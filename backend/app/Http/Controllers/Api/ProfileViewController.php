<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlindBox;
use App\Models\ProfileViewPermission;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileViewController extends Controller
{
    /**
     * Get the current user's profile view request status for a blind box.
     * GET /api/blind-boxes/{blindBox}/profile-view-request
     */
    public function show(Request $request, BlindBox $blindBox): JsonResponse
    {
        $user = $request->user();

        $permission = ProfileViewPermission::query()
            ->where('box_id', $blindBox->id)
            ->where('requester_id', $user->id)
            ->first();

        if (! $permission) {
            return response()->json(['status' => 0]); // 0 = no request yet
        }

        return response()->json([
            'status' => $permission->status,
            'created_at' => $permission->created_at?->toISOString(),
            'next_request_time' => $permission->next_request_time?->toISOString(),
        ]);
    }

    /**
     * Request to view a blind box creator's profile photos.
     * POST /api/blind-boxes/{blindBox}/profile-view-request
     */
    public function store(Request $request, BlindBox $blindBox): JsonResponse
    {
        $user = $request->user();

        // Cannot request own box
        if ($blindBox->creator_id === $user->id) {
            return response()->json(['message' => '不能申请查看自己的资料'], 422);
        }

        $existing = ProfileViewPermission::query()
            ->where('box_id', $blindBox->id)
            ->where('requester_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->status === 1) {
                return response()->json(['message' => '已提交申请，等待对方处理'], 422);
            }
            if ($existing->status === 2) {
                return response()->json(['message' => '对方已通过，可以查看相册'], 422);
            }
            // status === 3 (rejected): check cooldown
            if ($existing->next_request_time && now()->lt($existing->next_request_time)) {
                $remaining = (int) now()->diffInHours($existing->next_request_time, false);

                return response()->json([
                    'message' => "被拒绝后需等待 24 小时，还剩约 {$remaining} 小时",
                    'next_request_time' => $existing->next_request_time->toISOString(),
                ], 422);
            }

            // Cooldown passed — allow re-request by updating existing record
            $existing->update([
                'status' => 1,
                'processed_at' => null,
                'next_request_time' => null,
                'created_at' => now(),
            ]);

            return response()->json(['message' => '申请已重新发送', 'status' => 1], 201);
        }

        ProfileViewPermission::query()->create([
            'box_id' => $blindBox->id,
            'requester_id' => $user->id,
            'owner_id' => $blindBox->creator_id,
            'status' => 1,
        ]);

        // Notify owner
        $requesterName = $user->profile?->nickname ?? 'TA';
        NotificationService::send(
            userId: $blindBox->creator_id,
            type: 'profile_view_request',
            title: '有人申请查看你的相册',
            content: "{$requesterName} 想查看你在《{$blindBox->title}》的兴趣相册",
            relatedType: 'blind_box',
            relatedId: $blindBox->id,
            linkUrl: '/messages',
        );

        return response()->json(['message' => '申请已发送，等待对方同意', 'status' => 1], 201);
    }

    /**
     * Get pending profile view requests for the current user as owner.
     * GET /api/me/profile-view-requests
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = ProfileViewPermission::query()
            ->where('owner_id', $user->id)
            ->where('status', 1)
            ->with(['requester:id,nickname,avatar_url,gender', 'blindBox:id,title'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'box_id' => $p->box_id,
                'box_title' => $p->blindBox?->title,
                'requester' => [
                    'id' => $p->requester?->id,
                    'nickname' => $p->requester?->nickname,
                    'avatar_url' => $p->requester?->avatar_url,
                    'gender' => $p->requester?->gender,
                ],
                'created_at' => $p->created_at?->toISOString(),
            ]);

        return response()->json(['data' => $requests]);
    }

    /**
     * Approve or reject a profile view request.
     * POST /api/profile-view-requests/{id}/approve
     * POST /api/profile-view-requests/{id}/reject
     */
    public function process(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $action = $request->route('action');

        $permission = ProfileViewPermission::query()->findOrFail($id);

        if ($permission->owner_id !== $user->id) {
            return response()->json(['message' => '无权操作'], 403);
        }

        if ($permission->status !== 1) {
            return response()->json(['message' => '该申请已处理'], 422);
        }

        if ($action === 'approve') {
            $permission->update([
                'status' => 2,
                'processed_at' => now(),
            ]);

            $box = BlindBox::query()->find($permission->box_id);
            NotificationService::send(
                userId: $permission->requester_id,
                type: 'profile_view_approved',
                title: '对方同意了你的相册申请',
                content: '对方已同意，你现在可以查看其兴趣相册了',
                relatedType: 'blind_box',
                relatedId: $permission->box_id,
                linkUrl: $box ? "/blind-box/{$box->id}" : null,
            );

            return response()->json(['message' => '已同意查看相册']);
        }

        // reject
        $permission->update([
            'status' => 3,
            'processed_at' => now(),
            'next_request_time' => now()->addHours(24),
        ]);

        NotificationService::send(
            userId: $permission->requester_id,
            type: 'profile_view_rejected',
            title: '对方拒绝了你的相册申请',
            content: '对方暂不希望分享相册，24小时后可再次申请',
            relatedType: 'blind_box',
            relatedId: $permission->box_id,
        );

        return response()->json(['message' => '已拒绝申请']);
    }
}
