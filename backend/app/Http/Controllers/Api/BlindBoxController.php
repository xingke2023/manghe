<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBlindBoxRequest;
use App\Http\Resources\BlindBoxResource;
use App\Models\BlindBox;
use App\Models\BoxView;
use App\Models\DailyBoxViewStat;
use App\Models\SystemConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BlindBoxController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = BlindBox::query()
            ->where('status', 1)
            ->with(['creator', 'creator.profile'])
            ->latest();

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('district')) {
            $query->where('district', $request->district);
        }

        if ($request->filled('fee_type')) {
            $query->where('fee_type', $request->integer('fee_type'));
        }

        if ($request->filled('category')) {
            $query->whereJsonContains('experience_values', $request->category);
        }

        if ($request->filled('date_from')) {
            $query->where('meeting_time', '>=', $request->date_from.' 00:00:00');
        }

        if ($request->filled('date_to')) {
            $query->where('meeting_time', '<=', $request->date_to.' 23:59:59');
        }

        // Explicit sort: meeting_time — skip recommendation
        if ($request->get('sort') === 'meeting_time') {
            $query->reorder()->orderBy('meeting_time');

            return BlindBoxResource::collection($query->paginate(10));
        }

        // Recommendation sort (default)
        $user = auth('sanctum')->user();
        $userInterests = $user?->profile?->interests ?? [];

        // No interests to personalise → latest order
        if (empty($userInterests)) {
            return BlindBoxResource::collection($query->paginate(10));
        }

        // Score all matching boxes in PHP
        $now = now();
        $userFlipped = array_flip($userInterests);
        $userCount = count($userInterests);

        $scored = $query->get()->map(function ($box) use ($now, $userFlipped, $userCount) {
            $creatorInterests = $box->creator?->profile?->interests ?? [];
            $common = count(array_intersect_key(array_flip($creatorInterests), $userFlipped));
            $interestScore = ($common / $userCount) * 100;

            $hoursOld = max(0, $now->diffInHours($box->created_at));
            $recencyScore = max(0, 100 - floor($hoursOld / 24) * 10);

            $box->_score = round($interestScore * 0.6 + $recencyScore * 0.4, 2);

            return $box;
        })->sortByDesc('_score')->values();

        $page = max(1, $request->integer('page', 1));
        $perPage = 10;

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $scored->forPage($page, $perPage)->values(),
            $scored->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return BlindBoxResource::collection($paginator);
    }

    public function filterOptions(): JsonResponse
    {
        $cities = BlindBox::query()
            ->where('status', 1)
            ->whereNotNull('city')
            ->distinct()
            ->pluck('city');

        $districts = BlindBox::query()
            ->where('status', 1)
            ->whereNotNull('district')
            ->distinct()
            ->pluck('district');

        return response()->json([
            'cities' => $cities,
            'districts' => $districts,
        ]);
    }

    public function show(BlindBox $blindBox): BlindBoxResource
    {
        $blindBox->load(['creator', 'creator.profile']);

        return new BlindBoxResource($blindBox);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'meeting_time' => ['required', 'date', 'after:now'],
            'location' => ['required', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:50'],
            'district' => ['nullable', 'string', 'max:50'],
            'fee_type' => ['required', 'integer', 'in:1,2'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'expected_traits' => ['nullable', 'array'],
            'experience_values' => ['nullable', 'array'],
            'max_participants' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $meetingTime = \Carbon\Carbon::parse($validated['meeting_time']);

        $blindBox = BlindBox::query()->create([
            ...$validated,
            'creator_id' => $user->id,
            'province' => $user->province,
            'city' => $validated['city'] ?? $user->city,
            'district' => $validated['district'] ?? $user->district,
            'status' => 1,
            'checkin_start_time' => $meetingTime->copy()->subHours(3),
            'checkin_end_time' => $meetingTime->copy()->addHours(2),
            'expired_at' => $meetingTime->copy()->addHours(2),
        ]);

        return response()->json([
            'message' => '发布成功',
            'id' => $blindBox->id,
        ], 201);
    }

    public function update(UpdateBlindBoxRequest $request, BlindBox $blindBox): JsonResponse
    {
        if ($blindBox->status !== 1) {
            return response()->json(['message' => '只能编辑进行中的盲盒'], 422);
        }

        $validated = $request->validated();

        if (isset($validated['meeting_time'])) {
            $meetingTime = \Carbon\Carbon::parse($validated['meeting_time']);
            $validated['checkin_start_time'] = $meetingTime->copy()->subHours(3);
            $validated['checkin_end_time'] = $meetingTime->copy()->addHours(2);
            $validated['expired_at'] = $meetingTime->copy()->addHours(2);
        }

        $blindBox->update($validated);

        return response()->json(['message' => '更新成功']);
    }

    public function destroy(Request $request, BlindBox $blindBox): JsonResponse
    {
        if ($request->user()->id !== $blindBox->creator_id) {
            return response()->json(['message' => '无权操作'], 403);
        }

        if (! in_array($blindBox->status, [1, 2])) {
            return response()->json(['message' => '该盲盒无法下架'], 422);
        }

        $hasLockedApplication = $blindBox->applications()
            ->where('is_locked', true)
            ->exists();

        if ($hasLockedApplication) {
            return response()->json(['message' => '已锁定报名者，无法下架'], 422);
        }

        $blindBox->update(['status' => 3]);

        return response()->json(['message' => '已下架']);
    }

    /**
     * Record a blind box view and deduct daily quota.
     * POST /api/blind-boxes/{blindBox}/view
     */
    public function recordView(Request $request, BlindBox $blindBox): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        // If already viewed this box, no quota deduction needed
        $alreadyViewed = BoxView::query()
            ->where('box_id', $blindBox->id)
            ->where('viewer_id', $user->id)
            ->exists();

        if (! $alreadyViewed) {
            // Get quota limit
            $limitKey = $user->is_member ? 'daily_box_view_limit_vip' : 'daily_box_view_limit';
            $limit = (int) SystemConfig::getValue($limitKey, 3);

            // Get today's usage
            $stat = DailyBoxViewStat::query()
                ->where('user_id', $user->id)
                ->where('stat_date', $today)
                ->first();

            $used = $stat?->view_count ?? 0;

            if ($used >= $limit) {
                return response()->json([
                    'message' => '今日拆盒次数已用完',
                    'quota_exhausted' => true,
                    'used' => $used,
                    'limit' => $limit,
                ], 422);
            }

            // Record view
            BoxView::query()->create([
                'box_id' => $blindBox->id,
                'viewer_id' => $user->id,
            ]);

            // Increment box view count
            $blindBox->increment('view_count');

            // Update daily stat
            DailyBoxViewStat::query()->updateOrCreate(
                ['user_id' => $user->id, 'stat_date' => $today],
                ['view_count' => $used + 1]
            );
        }

        return response()->json(['message' => 'ok', 'already_viewed' => $alreadyViewed]);
    }

    /**
     * Get blind boxes from users the current user follows.
     * GET /api/following/blind-boxes
     */
    public function followingBoxes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->is_member) {
            return response()->json(['message' => '关注功能为会员专属'], 403);
        }

        $followingIds = $user->following()->pluck('users.id');

        $boxes = BlindBox::query()
            ->whereIn('creator_id', $followingIds)
            ->where('status', 1)
            ->with(['creator'])
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('creator_id')
            ->map(function ($creatorBoxes) {
                $creator = $creatorBoxes->first()->creator;

                return [
                    'creator' => [
                        'id' => $creator->id,
                        'nickname' => $creator->nickname,
                        'avatar_url' => $creator->avatar_url,
                        'gender' => $creator->gender,
                    ],
                    'boxes' => $creatorBoxes->map(fn ($b) => [
                        'id' => $b->id,
                        'title' => $b->title,
                        'cover_image' => $b->cover_image,
                        'meeting_time' => $b->meeting_time?->format('m-d H:i'),
                        'city' => $b->city,
                        'district' => $b->district,
                        'fee_type' => $b->fee_type,
                        'fee_label' => $b->fee_type === 1 ? 'AA' : 'TA请客',
                        'view_count' => $b->view_count,
                        'apply_count' => $b->apply_count,
                    ])->values(),
                ];
            })
            ->values();

        return response()->json(['data' => $boxes]);
    }
}
