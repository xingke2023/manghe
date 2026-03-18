<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlindBoxResource extends JsonResource
{
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
            'city' => $this->city,
            'district' => $this->district,
            'fee_type' => $this->fee_type,
            'fee_label' => $this->fee_type === 1 ? 'AA' : 'TA请客',
            'expected_traits' => $this->expected_traits ?? [],
            'experience_values' => $this->experience_values ?? [],
            'view_count' => $this->view_count,
            'apply_count' => $this->apply_count,
            'status' => $this->status,
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
