<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Admin extends Authenticatable implements FilamentUser, HasName
{
    use HasFactory;

    protected $fillable = [
        'username',
        'password',
        'real_name',
        'role',
        'permissions',
        'status',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'permissions' => 'array',
            'status' => 'integer',
            'last_login_at' => 'datetime',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->status === 1;
    }

    public function getRememberToken(): string
    {
        return '';
    }

    public function setRememberToken($value): void {}

    public function getRememberTokenName(): string
    {
        return '';
    }

    public function getFilamentName(): string
    {
        return $this->real_name ?? $this->username ?? 'Admin';
    }

    public function reviewedValueTests(): HasMany
    {
        return $this->hasMany(ValueTest::class, 'reviewer_id');
    }

    public function reviewedAppeals(): HasMany
    {
        return $this->hasMany(AppointmentAppeal::class, 'reviewer_id');
    }

    public function createdVouchers(): HasMany
    {
        return $this->hasMany(BoxVoucher::class, 'created_by');
    }
}
