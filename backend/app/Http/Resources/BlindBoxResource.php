<?php

namespace App\Http\Resources;

use App\Models\BoxApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlindBoxResource extends JsonResource
{
    /** 广场卡片最多展示几个参与者头像 */
    private const RECENT_APPLICANT_LIMIT = 6;

    public function toArray(Request $request): array
    {
        $creator = $this->creator;
        $generationLabel = $this->resolveGenerationLabel($creator?->birth_date, $creator?->age);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'cover_image' => $this->cover_image,
            'meeting_time' => $this->meeting_time?->format('m-d H:i'),
            'meeting_time_full' => $this->meeting_time?->toISOString(),
            'location' => $this->location,
            'province' => $this->province,
            'location_latitude' => $this->location_latitude,
            'location_longitude' => $this->location_longitude,
            'city' => $this->city,
            'district' => $this->district,
            'fee_type' => $this->fee_type,
            'fee_label' => $this->fee_type === 1 ? 'AA' : 'TA请客',
            'expected_traits' => $this->expected_traits ?? [],
            'experience_values' => $this->experience_values ?? [],
            'view_count' => $this->view_count,
            'apply_count' => $this->apply_count,
            'recent_applicants' => $this->resolveRecentApplicants(),
            'max_participants' => $this->max_participants,
            'current_participants' => $this->current_participants,
            'checkin_start_time' => $this->checkin_start_time?->format('m-d H:i'),
            'checkin_end_time' => $this->checkin_end_time?->format('m-d H:i'),
            'status' => $this->status,
            'my_application' => $this->resolveMyApplication($request),
            'created_at' => $this->created_at,
            'creator' => $creator ? [
                'id' => $creator->id,
                'nickname' => $creator->nickname,
                'avatar_url' => $creator->avatar_url,
                'gender' => $creator->gender,
                'age' => $creator->age,
                'height' => $creator->height,
                'is_member' => $creator->is_member,
                'generation_label' => $generationLabel,
                'profile' => $this->whenLoaded('creator', function () use ($creator) {
                    $profile = $creator->relationLoaded('profile') ? $creator->profile : null;

                    return $profile ? [
                        'about_me' => $profile->about_me,
                        'interests' => $profile->interests ?? [],
                        'interest_photos' => $profile->interest_photos ?? [],
                        'dating_purposes' => $profile->dating_purposes ?? [],
                    ] : null;
                }),
            ] : null,
        ];
    }

    private function resolveMyApplication(Request $request): ?array
    {
        $user = auth('sanctum')->user();
        if (! $user) {
            return null;
        }

        $app = BoxApplication::query()
            ->where('box_id', $this->id)
            ->where('applicant_id', $user->id)
            ->first();

        if (! $app) {
            return null;
        }

        return [
            'id' => $app->id,
            'status' => $app->status,   // 1=pending, 2=matched, 3=rejected
            'is_locked' => $app->is_locked,
        ];
    }

    /**
     * 广场卡片上展示的参与者头像（前几个报名者）。
     *
     * 只在 applications 关系已预加载时返回，避免列表页 N+1；
     * 控制器需要 with(['applications' => fn ($q) => $q->latest()->limit(6), 'applications.applicant'])。
     *
     * @return array<int, array{id: int, avatar_url: string|null}>
     */
    private function resolveRecentApplicants(): array
    {
        if (! $this->resource->relationLoaded('applications')) {
            return [];
        }

        return $this->resource->applications
            ->take(self::RECENT_APPLICANT_LIMIT)
            ->map(fn ($application) => [
                'id' => $application->applicant?->id,
                'avatar_url' => $application->applicant?->avatar_url,
            ])
            ->filter(fn (array $item): bool => $item['id'] !== null)
            ->values()
            ->all();
    }

    private function resolveGenerationLabel(?\Carbon\Carbon $birthDate, ?int $age): ?string
    {
        $year = $birthDate?->year;

        if (! $year && $age) {
            $year = now()->year - $age;
        }

        if (! $year) {
            return null;
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
