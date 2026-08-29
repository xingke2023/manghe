<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvatarController;
use App\Http\Controllers\Api\BlindBoxController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\FulfillmentController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileViewController;
use App\Http\Controllers\Api\PublishController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ValueTestController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/dev/login-as', [AuthController::class, 'loginAsUser']); // dev only

// 头像：按 seed 生成并缓存在本机，客户端不再直连 dicebear。
// 放在 /api 下是因为 nginx 只把 /api/ 等少数前缀代理到后端，其它路径会走前端端口。
// 路径必须带 .png 后缀 —— Cloudflare 按扩展名判断能否缓存，没后缀会被当成
// 动态请求（cf-cache-status: DYNAMIC）每次回源，加了之后边缘才会命中缓存。
Route::get('/avatar/{seed}.png', [AvatarController::class, 'show'])
    ->where('seed', '[0-9]{1,12}');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Upload
    Route::post('/upload/image', [UploadController::class, 'image']);

    // Me / profile
    Route::get('/me/profile', [MeController::class, 'show']);
    Route::put('/profile', [MeController::class, 'update']);
    Route::get('/me/blind-boxes', [MeController::class, 'blindBoxes']);
    Route::get('/me/following', [MeController::class, 'following']);
    Route::get('/me/vouchers', [MeController::class, 'vouchers']);
    Route::get('/me/daily-views', [MeController::class, 'dailyViews']);
    Route::get('/me/applications', [MeController::class, 'applications']);

    // Fulfillment
    Route::get('/me/fulfillments', [FulfillmentController::class, 'index']);
    Route::post('/checkins', [FulfillmentController::class, 'checkin']);
    Route::post('/meeting-codes', [FulfillmentController::class, 'generateCode']);
    Route::post('/meeting-verifications', [FulfillmentController::class, 'verify']);
    Route::post('/appeals', [FulfillmentController::class, 'appeal']);
    Route::post('/admin/settle-expired', [FulfillmentController::class, 'settleExpired']);

    // Publish flow
    Route::get('/publish/status', [PublishController::class, 'status']);
    Route::post('/value-test', [ValueTestController::class, 'store']);
    Route::post('/deposit', [DepositController::class, 'store']);
    Route::post('/vouchers/redeem', [VoucherController::class, 'redeem']);
    Route::post('/blind-boxes', [BlindBoxController::class, 'store']);
    Route::put('/blind-boxes/{blindBox}', [BlindBoxController::class, 'update']);
    Route::delete('/blind-boxes/{blindBox}', [BlindBoxController::class, 'destroy']);
    Route::post('/blind-boxes/{blindBox}/view', [BlindBoxController::class, 'recordView']);

    // Apply for a blind box
    Route::post('/blind-boxes/{blindBox}/apply', [ApplicationController::class, 'apply']);
    // Applications management (creator)
    Route::get('/blind-boxes/{blindBox}/applications', [ApplicationController::class, 'index']);
    Route::post('/applications/{applicationId}/lock', [ApplicationController::class, 'lock']);
    Route::post('/applications/{applicationId}/reject', [ApplicationController::class, 'reject']);

    // Profile view permission
    Route::get('/blind-boxes/{blindBox}/profile-view-request', [ProfileViewController::class, 'show']);
    Route::post('/blind-boxes/{blindBox}/profile-view-request', [ProfileViewController::class, 'store']);
    Route::get('/me/profile-view-requests', [ProfileViewController::class, 'pending']);
    Route::post('/profile-view-requests/{id}/approve', [ProfileViewController::class, 'process'])->defaults('action', 'approve');
    Route::post('/profile-view-requests/{id}/reject', [ProfileViewController::class, 'process'])->defaults('action', 'reject');

    // Chat
    Route::post('/chat/sessions', [ChatController::class, 'getOrCreateSession']);
    Route::get('/chat/sessions', [ChatController::class, 'sessions']);
    Route::get('/chat/unread-count', [ChatController::class, 'unreadCount']);
    Route::get('/chat/{sessionId}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/{sessionId}/messages', [ChatController::class, 'sendMessage']);

    // User follow / unfollow
    Route::get('/users/{user}/profile', [UserController::class, 'profile']);
    Route::get('/users/{user}/follow', [UserController::class, 'followStatus']);
    Route::post('/users/{user}/follow', [UserController::class, 'follow']);
    Route::delete('/users/{user}/follow', [UserController::class, 'unfollow']);

    // Following feed
    Route::get('/following/blind-boxes', [BlindBoxController::class, 'followingBoxes']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});

// BlindBox routes
Route::get('/blind-boxes/filter-options', [BlindBoxController::class, 'filterOptions']);
Route::get('/blind-boxes', [BlindBoxController::class, 'index']);
Route::get('/blind-boxes/{blindBox}', [BlindBoxController::class, 'show']);

// Post routes (index and show are public, rest require auth)
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{post}', [PostController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
});
