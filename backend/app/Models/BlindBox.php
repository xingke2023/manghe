<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlindBox extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'cover_image',
        'title',
        'meeting_time',
        'location',
        'location_latitude',
        'location_longitude',
        'province',
        'city',
        'district',
        'fee_type',
        'expected_traits',
        'experience_values',
        'max_participants',
        'current_participants',
        'status',
        'view_count',
        'apply_count',
        'checkin_start_time',
        'checkin_end_time',
        'expired_at',
    ];

    protected function casts(): array
    {
        return [
            'meeting_time' => 'datetime',
            'location_latitude' => 'decimal:7',
            'location_longitude' => 'decimal:7',
            'fee_type' => 'integer',
            'expected_traits' => 'array',
            'experience_values' => 'array',
            'max_participants' => 'integer',
            'current_participants' => 'integer',
            'status' => 'integer',
            'view_count' => 'integer',
            'apply_count' => 'integer',
            'checkin_start_time' => 'datetime',
            'checkin_end_time' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(BoxApplication::class, 'box_id');
    }

    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class, 'box_id');
    }

    public function checkins(): HasMany
    {
        return $this->hasMany(Checkin::class, 'box_id');
    }

    public function meetingCodes(): HasMany
    {
        return $this->hasMany(MeetingCode::class, 'box_id');
    }

    public function meetingVerifications(): HasMany
    {
        return $this->hasMany(MeetingVerification::class, 'box_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(BoxView::class, 'box_id');
    }

    public function appeals(): HasMany
    {
        return $this->hasMany(AppointmentAppeal::class, 'box_id');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class, 'related_box_id');
    }

    public function lockedApplication(): HasMany
    {
        return $this->hasMany(BoxApplication::class, 'box_id')->where('is_locked', true);
    }
}
