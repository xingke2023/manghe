<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'dating_purposes',
        'target_gender',
        'target_age_min',
        'target_age_max',
        'about_me',
        'interests',
        'interest_photos',
        'occupation',
        'company',
        'school',
        'education',
        'annual_income',
        'assets_range',
    ];

    protected function casts(): array
    {
        return [
            'dating_purposes' => 'array',
            'target_gender' => 'integer',
            'target_age_min' => 'integer',
            'target_age_max' => 'integer',
            'interests' => 'array',
            'interest_photos' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
