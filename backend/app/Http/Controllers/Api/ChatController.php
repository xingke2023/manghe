<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlindBox;
use App\Models\ChatSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * Get or create a chat session for a blind box (applicant perspective).
     */
    public function getOrCreateSession(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate(['box_id' => 'required|integer']);

        $blindBox = BlindBox::query()->findOrFail($request->box_id);

        if ($blindBox->creator_id === $user->id) {
            return response()->json(['message' => '不能与自己聊天'], 422);
        }

        $session = ChatSession::query()->firstOrCreate(
            ['box_id' => $blindBox->id, 'applicant_id' => $user->id],
            [
                'creator_id' => $blindBox->creator_id,
                'status' => 1,
                'is_unlocked' => false,
            ]
        );

        $session->load([
            'blindBox:id,title,cover_image,meeting_time',
            'creator:id',
            'creator.profile:user_id,nickname,avatar',
        ]);

        return response()->json([
            'session_id' => $session->id,
            'is_new' => $session->wasRecentlyCreated,
            'creator' => [
                'id' => $blindBox->creator_id,
                'nickname' => $session->creator?->profile?->nickname ?? 'TA',
                'avatar' => $session->creator?->profile?->avatar,
            ],
            'blind_box' => [
                'id' => $blindBox->id,
                'title' => $blindBox->title,
                'cover_image' => $blindBox->cover_image,
                'meeting_time' => $blindBox->meeting_time?->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Get all chat sessions for the authenticated user.
     */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessions = ChatSession::query()
            ->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                    ->orWhere('applicant_id', $user->id);
            })
            ->with([
                'blindBox:id,title,cover_image,meeting_time',
                'creator:id',
                'creator.profile:user_id,nickname,avatar',
                'applicant:id',
                'applicant.profile:user_id,nickname,avatar',
            ])
            ->orderByDesc('last_message_time')
            ->get()
            ->map(function (ChatSession $session) use ($user) {
                $isCreator = $session->creator_id === $user->id;
                $other = $isCreator ? $session->applicant : $session->creator;

                return [
                    'id' => $session->id,
                    'box_id' => $session->box_id,
                    'status' => $session->status,
                    'is_creator' => $isCreator,
                    'last_message' => $session->last_message,
                    'last_message_time' => $session->last_message_time?->format('n-j'),
                    'blind_box' => $session->blindBox ? [
                        'id' => $session->blindBox->id,
                        'title' => $session->blindBox->title,
                        'cover_image' => $session->blindBox->cover_image,
                        'meeting_time' => $session->blindBox->meeting_time,
                    ] : null,
                    'other_user' => $other ? [
                        'id' => $other->id,
                        'nickname' => $other->profile?->nickname ?? 'TA',
                        'avatar' => $other->profile?->avatar,
                    ] : null,
                ];
            });

        return response()->json(['data' => $sessions]);
    }

    /**
     * Get messages for a specific chat session.
     */
    public function messages(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->user();

        $session = ChatSession::query()
            ->where('id', $sessionId)
            ->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                    ->orWhere('applicant_id', $user->id);
            })
            ->firstOrFail();

        $messages = $session->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'is_mine' => $msg->sender_id === $user->id,
                'content' => $msg->content,
                'message_type' => $msg->message_type,
                'is_read' => $msg->is_read,
                'created_at' => $msg->created_at?->toISOString(),
            ]);

        $isCreator = $session->creator_id === $user->id;
        $other = $isCreator ? $session->applicant : $session->creator;

        $session->load([
            'blindBox:id,title,cover_image,meeting_time,status',
            'creator:id',
            'creator.profile:user_id,nickname,avatar',
            'applicant:id',
            'applicant.profile:user_id,nickname,avatar',
        ]);

        return response()->json([
            'session' => [
                'id' => $session->id,
                'status' => $session->status,
                'is_unlocked' => $session->is_unlocked,
                'is_creator' => $isCreator,
                'box_id' => $session->box_id,
                'other_user' => $other ? [
                    'id' => $other->id,
                    'nickname' => $other->profile?->nickname ?? 'TA',
                    'avatar' => $other->profile?->avatar,
                ] : null,
                'blind_box' => $session->blindBox ? [
                    'id' => $session->blindBox->id,
                    'title' => $session->blindBox->title,
                    'cover_image' => $session->blindBox->cover_image,
                    'meeting_time' => $session->blindBox->meeting_time,
                    'status' => $session->blindBox->status,
                ] : null,
            ],
            'data' => $messages,
        ]);
    }

    /**
     * Send a message in a chat session.
     */
    public function sendMessage(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->user();

        $session = ChatSession::query()
            ->where('id', $sessionId)
            ->where(function ($q) use ($user) {
                $q->where('creator_id', $user->id)
                    ->orWhere('applicant_id', $user->id);
            })
            ->firstOrFail();

        $request->validate(['content' => 'required|string|max:500']);

        $receiverId = $session->creator_id === $user->id
            ? $session->applicant_id
            : $session->creator_id;

        $message = $session->messages()->create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message_type' => 1,
            'content' => $request->content,
            'is_read' => false,
        ]);

        $session->update([
            'last_message' => $request->content,
            'last_message_time' => now(),
        ]);

        return response()->json([
            'id' => $message->id,
            'sender_id' => $user->id,
            'is_mine' => true,
            'content' => $message->content,
            'created_at' => now()->toISOString(),
        ], 201);
    }
}
