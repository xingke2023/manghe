<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserFollow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private const FOLLOW_LIMIT = 12;

    public function follow(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if (! $me->is_member) {
            return response()->json(['message' => '关注功能为会员专属'], 403);
        }

        if ($me->id === $user->id) {
            return response()->json(['message' => '不能关注自己'], 422);
        }

        $alreadyFollowing = UserFollow::query()
            ->where('follower_id', $me->id)
            ->where('followee_id', $user->id)
            ->exists();

        if ($alreadyFollowing) {
            return response()->json(['message' => '已关注'], 422);
        }

        $followCount = UserFollow::query()
            ->where('follower_id', $me->id)
            ->count();

        if ($followCount >= self::FOLLOW_LIMIT) {
            return response()->json(['message' => '最多关注 12 人'], 422);
        }

        UserFollow::query()->create([
            'follower_id' => $me->id,
            'followee_id' => $user->id,
        ]);

        return response()->json(['message' => '关注成功']);
    }

    public function unfollow(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        $deleted = UserFollow::query()
            ->where('follower_id', $me->id)
            ->where('followee_id', $user->id)
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => '未关注该用户'], 422);
        }

        return response()->json(['message' => '已取消关注']);
    }

    public function followStatus(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        $isFollowing = UserFollow::query()
            ->where('follower_id', $me->id)
            ->where('followee_id', $user->id)
            ->exists();

        $followCount = UserFollow::query()
            ->where('follower_id', $me->id)
            ->count();

        return response()->json([
            'following' => $isFollowing,
            'following_count' => $followCount,
            'can_follow' => $followCount < self::FOLLOW_LIMIT,
        ]);
    }
}
