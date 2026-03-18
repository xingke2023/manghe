<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyBoxViewStat;
use App\Models\SystemConfig;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    /**
     * Get current user's profile (extended info with profile).
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nickname' => $user->nickname,
                'avatar_url' => $user->avatar_url,
                'gender' => $user->gender,
                'birth_date' => $user->birth_date?->format('Y-m-d'),
                'age' => $user->age,
                'height' => $user->height,
                'city' => $user->city,
                'district' => $user->district,
                'is_member' => $user->is_member,
                'member_expire_date' => $user->member_expire_date?->format('Y-m-d'),
                'credit_score' => $user->credit_score,
                'has_box_permission' => $user->has_box_permission,
                'profile' => $user->profile ? [
                    'dating_purposes' => $user->profile->dating_purposes,
                    'target_gender' => $user->profile->target_gender,
                    'target_age_min' => $user->profile->target_age_min,
                    'target_age_max' => $user->profile->target_age_max,
                    'about_me' => $user->profile->about_me,
                    'interests' => $user->profile->interests,
                    'interest_photos' => $user->profile->interest_photos,
                    'occupation' => $user->profile->occupation,
                    'education' => $user->profile->education,
                    'annual_income' => $user->profile->annual_income,
                ] : null,
            ],
        ]);
    }

    /**
     * Update current user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $userFields = $request->only([
            'nickname', 'avatar_url', 'gender', 'birth_date', 'age', 'height', 'city', 'district',
        ]);

        if (! empty($userFields)) {
            $user->update($userFields);
        }

        $profileFields = $request->only([
            'dating_purposes', 'target_gender', 'target_age_min', 'target_age_max',
            'about_me', 'interests', 'interest_photos', 'occupation', 'company',
            'school', 'education', 'annual_income', 'assets_range',
        ]);

        if (! empty($profileFields)) {
            UserProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                $profileFields
            );
        }

        return response()->json(['message' => '保存成功']);
    }

    /**
     * Get current user's published blind boxes.
     */
    public function blindBoxes(Request $request): JsonResponse
    {
        $user = $request->user();

        $boxes = $user->blindBoxes()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($box) => [
                'id' => $box->id,
                'title' => $box->title,
                'cover_image' => $box->cover_image,
                'meeting_time' => $box->meeting_time?->format('m-d H:i'),
                'city' => $box->city,
                'district' => $box->district,
                'fee_type' => $box->fee_type,
                'fee_label' => $box->fee_type === 1 ? 'AA' : 'TA请客',
                'status' => $box->status,
                'view_count' => $box->view_count,
                'apply_count' => $box->apply_count,
                'expected_traits' => $box->expected_traits,
            ]);

        return response()->json(['data' => $boxes]);
    }

    /**
     * Get current user's following list.
     */
    public function following(Request $request): JsonResponse
    {
        $user = $request->user();

        $following = $user->following()
            ->with('profile:user_id,nickname,avatar,gender,birth_date')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'nickname' => $u->nickname ?? $u->profile?->nickname ?? 'TA',
                'avatar_url' => $u->avatar_url,
                'gender' => $u->gender,
                'generation_label' => $this->generationLabel($u->birth_date?->year),
            ]);

        return response()->json(['data' => $following]);
    }

    /**
     * Get current user's available vouchers count.
     */
    public function vouchers(Request $request): JsonResponse
    {
        $user = $request->user();

        $available = $user->ownedVouchers()->where('status', 1)->count();

        return response()->json(['available' => $available]);
    }

    /**
     * Get current user's daily blind box view quota.
     * GET /api/me/daily-views
     */
    public function dailyViews(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $limitKey = $user->is_member ? 'daily_box_view_limit_vip' : 'daily_box_view_limit';
        $limit = (int) SystemConfig::getValue($limitKey, 3);

        $stat = DailyBoxViewStat::query()
            ->where('user_id', $user->id)
            ->where('stat_date', $today)
            ->first();

        $used = $stat?->view_count ?? 0;

        return response()->json([
            'used' => $used,
            'limit' => $limit,
            'remaining' => max(0, $limit - $used),
            'is_member' => $user->is_member,
        ]);
    }

    private function generationLabel(?int $year): string
    {
        if (! $year) {
            return '';
        }

        return match (true) {
            $year >= 2000 => '00后',
            $year >= 1995 => '95后',
            $year >= 1990 => '90后',
            $year >= 1985 => '85后',
            default => '80后',
        };
    }
}
