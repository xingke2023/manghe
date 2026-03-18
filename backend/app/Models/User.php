<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'openid',
        'phone',
        'nickname',
        'avatar_url',
        'original_avatar_url',
        'gender',
        'birth_date',
        'age',
        'height',
        'province',
        'city',
        'district',
        'account_status',
        'has_box_permission',
        'is_member',
        'member_expire_date',
        'credit_score',
        'referrer_user_id',
        'referrer_click_time',
    ];

    protected $hidden = [
        'openid',
    ];

    protected function casts(): array
    {
        return [
            'gender' => 'integer',
            'birth_date' => 'date',
            'age' => 'integer',
            'height' => 'integer',
            'account_status' => 'integer',
            'has_box_permission' => 'boolean',
            'is_member' => 'boolean',
            'member_expire_date' => 'datetime',
            'credit_score' => 'integer',
            'referrer_click_time' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referrer_user_id');
    }

    public function blindBoxes(): HasMany
    {
        return $this->hasMany(BlindBox::class, 'creator_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(BoxApplication::class, 'applicant_id');
    }

    public function valueTests(): HasMany
    {
        return $this->hasMany(ValueTest::class);
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    public function ownedVouchers(): HasMany
    {
        return $this->hasMany(BoxVoucher::class, 'owner_user_id');
    }

    public function usedVouchers(): HasMany
    {
        return $this->hasMany(BoxVoucher::class, 'used_by');
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'follower_id', 'followee_id')
            ->withPivot('created_at');
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_follows', 'followee_id', 'follower_id')
            ->withPivot('created_at');
    }

    public function checkins(): HasMany
    {
        return $this->hasMany(Checkin::class);
    }

    public function meetingCodes(): HasMany
    {
        return $this->hasMany(MeetingCode::class);
    }

    public function userNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function boxViews(): HasMany
    {
        return $this->hasMany(BoxView::class, 'viewer_id');
    }

    public function dailyViewStats(): HasMany
    {
        return $this->hasMany(DailyBoxViewStat::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'receiver_id');
    }

    public function appeals(): HasMany
    {
        return $this->hasMany(AppointmentAppeal::class, 'appellant_id');
    }
}
