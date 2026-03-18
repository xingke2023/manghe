<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentAppeal;
use App\Models\BlindBox;
use App\Models\BoxApplication;
use App\Models\Checkin;
use App\Models\MeetingCode;
use App\Models\MeetingVerification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FulfillmentController extends Controller
{
    /**
     * Get fulfillment list for current user.
     * Returns locked applications (as applicant) + own boxes with matched applications (as creator).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // As applicant: boxes I applied and got locked
        $asApplicant = BoxApplication::query()
            ->where('applicant_id', $user->id)
            ->where('is_locked', true)
            ->with('blindBox:id,title,cover_image,meeting_time,location,city,district,status,creator_id')
            ->get()
            ->map(fn ($app) => $this->formatFulfillment($app, $user->id, 'applicant'));

        // As creator: my boxes that have a locked applicant
        $asCreator = BoxApplication::query()
            ->whereHas('blindBox', fn ($q) => $q->where('creator_id', $user->id))
            ->where('is_locked', true)
            ->with('blindBox:id,title,cover_image,meeting_time,location,city,district,status,creator_id')
            ->get()
            ->map(fn ($app) => $this->formatFulfillment($app, $user->id, 'creator'));

        $all = $asApplicant->merge($asCreator)->sortByDesc('meeting_time')->values();

        return response()->json(['data' => $all]);
    }

    /**
     * GPS checkin — validates user is within 300m of the venue.
     */
    public function checkin(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'box_id' => 'required|integer',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $box = BlindBox::query()->findOrFail($request->box_id);

        // Verify user is related to this box
        $isCreator = $box->creator_id === $user->id;
        $isApplicant = BoxApplication::query()
            ->where('box_id', $box->id)
            ->where('applicant_id', $user->id)
            ->where('is_locked', true)
            ->exists();

        if (! $isCreator && ! $isApplicant) {
            return response()->json(['message' => '无权操作'], 403);
        }

        // Calculate distance (Haversine formula)
        $distance = null;
        $isValid = true;

        if ($box->location_latitude && $box->location_longitude) {
            $distance = $this->haversineDistance(
                (float) $request->latitude,
                (float) $request->longitude,
                (float) $box->location_latitude,
                (float) $box->location_longitude
            );
            $isValid = $distance <= 300;
        }

        $checkin = Checkin::query()->create([
            'box_id' => $box->id,
            'user_id' => $user->id,
            'checkin_latitude' => $request->latitude,
            'checkin_longitude' => $request->longitude,
            'distance_meters' => $distance ? (int) $distance : null,
            'is_valid' => $isValid,
        ]);

        return response()->json([
            'is_valid' => $isValid,
            'distance_meters' => $checkin->distance_meters,
            'message' => $isValid ? '打卡成功！' : '距离太远，请到达约定地点后再打卡',
        ], $isValid ? 200 : 422);
    }

    /**
     * Generate or retrieve a meeting QR code for applicant.
     */
    public function generateCode(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate(['box_id' => 'required|integer']);

        $box = BlindBox::query()->findOrFail($request->box_id);

        // Only locked applicant can generate code
        $application = BoxApplication::query()
            ->where('box_id', $box->id)
            ->where('applicant_id', $user->id)
            ->where('is_locked', true)
            ->first();

        if (! $application) {
            return response()->json(['message' => '无权生成见面码'], 403);
        }

        // Verify checkin done
        $checkedIn = Checkin::query()
            ->where('box_id', $box->id)
            ->where('user_id', $user->id)
            ->where('is_valid', true)
            ->exists();

        if (! $checkedIn) {
            return response()->json(['message' => '请先完成 GPS 打卡'], 422);
        }

        // Get or create code (valid 2 hours)
        $code = MeetingCode::query()
            ->where('box_id', $box->id)
            ->where('user_id', $user->id)
            ->where('status', 1)
            ->where('valid_until', '>', now())
            ->first();

        if (! $code) {
            $code = MeetingCode::query()->create([
                'box_id' => $box->id,
                'user_id' => $user->id,
                'role' => 2, // applicant
                'qr_code' => strtoupper(Str::random(12)),
                'is_scanned' => false,
                'valid_until' => now()->addHours(2),
                'status' => 1,
            ]);
        }

        return response()->json([
            'qr_code' => $code->qr_code,
            'valid_until' => $code->valid_until?->toISOString(),
        ]);
    }

    /**
     * Creator scans applicant's QR code to verify fulfillment.
     */
    public function verify(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'box_id' => 'required|integer',
            'qr_code' => 'required|string',
        ]);

        $box = BlindBox::query()->findOrFail($request->box_id);

        if ($box->creator_id !== $user->id) {
            return response()->json(['message' => '无权操作'], 403);
        }

        $code = MeetingCode::query()
            ->where('box_id', $box->id)
            ->where('qr_code', $request->qr_code)
            ->where('status', 1)
            ->where('valid_until', '>', now())
            ->first();

        if (! $code) {
            MeetingVerification::query()->create([
                'box_id' => $box->id,
                'scanner_id' => $user->id,
                'scanned_id' => null,
                'qr_code' => $request->qr_code,
                'is_valid' => false,
                'fail_reason' => '二维码无效或已过期',
            ]);

            return response()->json(['is_valid' => false, 'message' => '二维码无效或已过期'], 422);
        }

        // Mark code as scanned
        $code->update([
            'is_scanned' => true,
            'scanned_at' => now(),
            'scanned_by' => $user->id,
            'status' => 2,
        ]);

        // Record verification
        MeetingVerification::query()->create([
            'box_id' => $box->id,
            'scanner_id' => $user->id,
            'scanned_id' => $code->user_id,
            'qr_code' => $request->qr_code,
            'is_valid' => true,
        ]);

        // Settle: mark application as perfectly fulfilled
        $application = BoxApplication::query()
            ->where('box_id', $box->id)
            ->where('applicant_id', $code->user_id)
            ->where('is_locked', true)
            ->first();

        if ($application) {
            $application->update([
                'fulfill_status' => 1, // 完美履约
                'deposit_status' => 2, // 已退还
            ]);

            // Notify both parties
            NotificationService::send(
                userId: $application->applicant_id,
                type: 'fulfillment_perfect',
                title: '完美履约！',
                content: "与《{$box->title}》的约会顺利完成，保证金已退还",
                relatedType: 'blind_box',
                relatedId: $box->id,
            );
            NotificationService::send(
                userId: $box->creator_id,
                type: 'fulfillment_perfect',
                title: '完美履约！',
                content: "盲盒《{$box->title}》约会顺利完成，感谢你的参与",
                relatedType: 'blind_box',
                relatedId: $box->id,
            );
        }

        // Update box to fulfilled
        $box->update(['status' => 4]);

        return response()->json(['is_valid' => true, 'message' => '核销成功！赴约完成 🎉']);
    }

    private function formatFulfillment(BoxApplication $app, int $userId, string $role): array
    {
        $box = $app->blindBox;

        $hasCheckedIn = Checkin::query()
            ->where('box_id', $box->id)
            ->where('user_id', $userId)
            ->where('is_valid', true)
            ->exists();

        return [
            'application_id' => $app->id,
            'role' => $role, // 'creator' | 'applicant'
            'box_id' => $box->id,
            'title' => $box->title,
            'cover_image' => $box->cover_image,
            'meeting_time' => $box->meeting_time?->format('m-d H:i'),
            'location' => $box->location,
            'city' => $box->city,
            'district' => $box->district,
            'box_status' => $box->status,
            'has_checked_in' => $hasCheckedIn,
            'fulfill_status' => $app->fulfill_status ?? 0, // 0=pending,1=完美履约,2=我失约,3=对方失约
        ];
    }

    /**
     * Submit an appeal (已打卡但未完成核销场景).
     */
    public function appeal(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'box_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
            'evidence_images' => ['nullable', 'array'],
            'evidence_images.*' => ['string'],
        ]);

        $box = BlindBox::query()->findOrFail($request->box_id);

        // Verify user is involved
        $isCreator = $box->creator_id === $user->id;
        $application = BoxApplication::query()
            ->where('box_id', $box->id)
            ->where('applicant_id', $user->id)
            ->where('is_locked', true)
            ->first();

        if (! $isCreator && ! $application) {
            return response()->json(['message' => '无权申诉'], 403);
        }

        // Must have checked in
        $checkedIn = Checkin::query()
            ->where('box_id', $box->id)
            ->where('user_id', $user->id)
            ->where('is_valid', true)
            ->exists();

        if (! $checkedIn) {
            return response()->json(['message' => '需完成 GPS 打卡才能申诉'], 422);
        }

        // Within 24h of checkin_end_time
        if ($box->checkin_end_time && now()->gt($box->checkin_end_time->addHours(24))) {
            return response()->json(['message' => '申诉时间已过（打卡结束后 24 小时内有效）'], 422);
        }

        // No duplicate
        $existingAppeal = AppointmentAppeal::query()
            ->where('box_id', $box->id)
            ->where('appellant_id', $user->id)
            ->exists();

        if ($existingAppeal) {
            return response()->json(['message' => '已提交申诉，请等待客服处理'], 422);
        }

        $respondentId = $isCreator ? $application?->applicant_id : $box->creator_id;

        AppointmentAppeal::query()->create([
            'box_id' => $box->id,
            'appellant_id' => $user->id,
            'respondent_id' => $respondentId,
            'reason' => $request->reason,
            'evidence_images' => $request->evidence_images ?? [],
            'status' => 1,
        ]);

        return response()->json(['message' => '申诉已提交，等待客服审核'], 201);
    }

    /**
     * Settle all pending applications for boxes whose checkin window has closed.
     * Called by scheduler; can also be triggered manually for testing.
     */
    public function settleExpired(Request $request): JsonResponse
    {
        $boxes = BlindBox::query()
            ->whereIn('status', [1, 2, 3])
            ->where('checkin_end_time', '<', now())
            ->get();

        $settled = 0;

        foreach ($boxes as $box) {
            $applications = BoxApplication::query()
                ->where('box_id', $box->id)
                ->where('is_locked', true)
                ->whereNull('fulfill_status')
                ->get();

            foreach ($applications as $app) {
                $this->settleApplication($box, $app);
                $settled++;
            }
        }

        return response()->json(['message' => "已结算 {$settled} 条记录"]);
    }

    private function settleApplication(BlindBox $box, BoxApplication $app): void
    {
        $creatorCheckedIn = Checkin::query()
            ->where('box_id', $box->id)
            ->where('user_id', $box->creator_id)
            ->where('is_valid', true)
            ->exists();

        $applicantCheckedIn = Checkin::query()
            ->where('box_id', $box->id)
            ->where('user_id', $app->applicant_id)
            ->where('is_valid', true)
            ->exists();

        $mutualScanCount = MeetingVerification::query()
            ->where('box_id', $box->id)
            ->where('is_valid', true)
            ->where(function ($q) use ($box, $app) {
                $q->where(function ($q2) use ($box, $app) {
                    $q2->where('scanner_id', $box->creator_id)
                        ->where('scanned_id', $app->applicant_id);
                })->orWhere(function ($q2) use ($box, $app) {
                    $q2->where('scanner_id', $app->applicant_id)
                        ->where('scanned_id', $box->creator_id);
                });
            })
            ->count();

        if ($creatorCheckedIn && $applicantCheckedIn && $mutualScanCount >= 2) {
            // 完美履约
            $app->update(['fulfill_status' => 1, 'deposit_status' => 2]);
        } elseif ($creatorCheckedIn && ! $applicantCheckedIn) {
            // 拆盒者失约
            $app->update(['fulfill_status' => 2, 'deposit_status' => 3]);
            NotificationService::send(
                userId: $box->creator_id,
                type: 'fulfillment_applicant_missed',
                title: '对方失约了',
                content: "盲盒《{$box->title}》的拆盒者未打卡，防鸽费将补偿给你",
                relatedType: 'blind_box',
                relatedId: $box->id,
            );
        } elseif (! $creatorCheckedIn && $applicantCheckedIn) {
            // 发盒者失约
            $app->update(['fulfill_status' => 3, 'deposit_status' => 4]);
            NotificationService::send(
                userId: $app->applicant_id,
                type: 'fulfillment_creator_missed',
                title: '对方失约了',
                content: "盲盒《{$box->title}》的发盒者未打卡，防鸽费将赔偿给你",
                relatedType: 'blind_box',
                relatedId: $box->id,
            );
        } else {
            // 双方失约
            $app->update(['fulfill_status' => 2, 'deposit_status' => 3]);
        }
    }

    /** Haversine formula → meters */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return $earthRadius * 2 * asin(sqrt($a));
    }
}
