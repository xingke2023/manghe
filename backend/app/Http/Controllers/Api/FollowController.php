<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    private const MAX_FOLLOWING = 12;

    /**
     * Follow a user. Members only, max 12.
     */
    public function follow(Request $request, int $userId): JsonResponse
    {
        $user = $request->user();

        if ($user->id === $userId) {
            return response()->json(['message' => '不能关注自己'], 422);
        }

        $target = User::query()->findOrFail($userId);

        // Already following
        if ($user->following()->where('followee_id', $userId)->exists()) {
            return response()->json(['message' => '已关注', 'following' => true]);
        }

        // Check member limit
        $followingCount = $user->following()->count();
        if ($followingCount >= self::MAX_FOLLOWING) {
            return response()->json(['message' => '最多关注 '.self::MAX_FOLLOWING.' 人'], 422);
        }

        $user->following()->attach($userId, ['created_at' => now()]);

        return response()->json([
            'message' => '关注成功',
            'following' => true,
            'following_count' => $followingCount + 1,
        ]);
    }

    /**
     * Unfollow a user.
     */
    public function unfollow(Request $request, int $userId): JsonResponse
    {
        $user = $request->user();

        $user->following()->detach($userId);

        return response()->json([
            'message' => '已取关',
            'following' => false,
        ]);
    }

    /**
     * Check if current user follows a specific user.
     */
    public function status(Request $request, int $userId): JsonResponse
    {
        $user = $request->user();
        $isFollowing = $user->following()->where('followee_id', $userId)->exists();
        $followingCount = $user->following()->count();

        return response()->json([
            'following' => $isFollowing,
            'following_count' => $followingCount,
            'can_follow' => $followingCount < self::MAX_FOLLOWING,
        ]);
    }
}
