<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlindBox;
use App\Models\BoxApplication;
use App\Models\ChatSession;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    /**
     * Apply for a blind box (拆盒者报名).
     */
    public function apply(Request $request, BlindBox $blindBox): JsonResponse
    {
        $user = $request->user();

        if ($blindBox->creator_id === $user->id) {
            return response()->json(['message' => '不能报名自己的盲盒'], 422);
        }

        if ($blindBox->status !== 1) {
            return response()->json(['message' => '该盲盒已下架'], 422);
        }

        $existing = BoxApplication::query()
            ->where('box_id', $blindBox->id)
            ->where('applicant_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => '已报名', 'application_id' => $existing->id]);
        }

        $application = BoxApplication::query()->create([
            'box_id' => $blindBox->id,
            'applicant_id' => $user->id,
            'status' => 1, // 待处理
            'is_locked' => false,
            'anti_flake_fee' => 50.00,
            'payment_status' => 2, // mock paid
        ]);

        // Create a chat session
        ChatSession::query()->firstOrCreate(
            ['box_id' => $blindBox->id, 'applicant_id' => $user->id],
            [
                'creator_id' => $blindBox->creator_id,
                'status' => 1,
                'is_unlocked' => false,
            ]
        );

        // Notify creator: someone applied
        $applicantName = $user->profile?->nickname ?? 'TA';
        NotificationService::send(
            userId: $blindBox->creator_id,
            type: 'new_application',
            title: '有人报名了你的盲盒',
            content: "{$applicantName} 报名了你的盲盒《{$blindBox->title}》",
            relatedType: 'blind_box',
            relatedId: $blindBox->id,
            linkUrl: '/messages',
        );

        return response()->json(['message' => '报名成功', 'application_id' => $application->id], 201);
    }

    /**
     * Get applicants for a blind box (发盒者查看报名列表).
     */
    public function index(Request $request, BlindBox $blindBox): JsonResponse
    {
        $user = $request->user();

        if ($blindBox->creator_id !== $user->id) {
            return response()->json(['message' => '无权查看'], 403);
        }

        $applications = $blindBox->applications()
            ->with('applicant:id', 'applicant.profile:user_id,nickname,avatar,gender,birth_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'is_locked' => $app->is_locked,
                'created_at' => $app->created_at?->format('n-j'),
                'applicant' => [
                    'id' => $app->applicant->id,
                    'nickname' => $app->applicant->profile?->nickname ?? 'TA',
                    'avatar' => $app->applicant->profile?->avatar,
                    'gender' => $app->applicant->profile?->gender,
                ],
            ]);

        return response()->json(['data' => $applications]);
    }

    /**
     * Lock an applicant (发盒者选定报名者).
     */
    public function lock(Request $request, int $applicationId): JsonResponse
    {
        $user = $request->user();

        $application = BoxApplication::query()
            ->with('blindBox')
            ->findOrFail($applicationId);

        if ($application->blindBox->creator_id !== $user->id) {
            return response()->json(['message' => '无权操作'], 403);
        }

        if ($application->is_locked) {
            return response()->json(['message' => '已锁定']);
        }

        // Notify rejected applicants
        $rejectedApplicants = BoxApplication::query()
            ->where('box_id', $application->box_id)
            ->where('id', '!=', $applicationId)
            ->where('status', 1)
            ->pluck('applicant_id');

        BoxApplication::query()
            ->where('box_id', $application->box_id)
            ->where('id', '!=', $applicationId)
            ->where('status', 1)
            ->update(['status' => 3]); // rejected

        foreach ($rejectedApplicants as $applicantId) {
            NotificationService::send(
                userId: $applicantId,
                type: 'application_rejected',
                title: '本次遗憾错过',
                content: "盲盒《{$application->blindBox->title}》已选定其他人，期待下次相遇",
                relatedType: 'blind_box',
                relatedId: $application->box_id,
            );
        }

        $application->update([
            'is_locked' => true,
            'locked_at' => now(),
            'status' => 2, // matched
        ]);

        // Update blind box status to matched
        $application->blindBox->update(['status' => 3]);

        // Notify the locked applicant
        NotificationService::send(
            userId: $application->applicant_id,
            type: 'application_locked',
            title: '恭喜！你被选中了',
            content: "你报名的盲盒《{$application->blindBox->title}》已匹配成功，快去准备赴约吧！",
            relatedType: 'blind_box',
            relatedId: $application->box_id,
            linkUrl: '/profile/fulfillments',
        );

        return response()->json(['message' => '已锁定']);
    }

    /**
     * Reject an applicant (发盒者拒绝报名者).
     */
    public function reject(Request $request, int $applicationId): JsonResponse
    {
        $user = $request->user();

        $application = BoxApplication::query()
            ->with('blindBox')
            ->findOrFail($applicationId);

        if ($application->blindBox->creator_id !== $user->id) {
            return response()->json(['message' => '无权操作'], 403);
        }

        $application->update(['status' => 3]); // rejected

        // Notify the rejected applicant
        NotificationService::send(
            userId: $application->applicant_id,
            type: 'application_rejected',
            title: '本次遗憾错过',
            content: "盲盒《{$application->blindBox->title}》暂无缘分，期待下次相遇",
            relatedType: 'blind_box',
            relatedId: $application->box_id,
        );

        return response()->json(['message' => '已拒绝']);
    }
}
