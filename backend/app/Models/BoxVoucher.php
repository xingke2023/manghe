<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoxVoucher extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'voucher_code',
        'owner_user_id',
        'created_by',
        'status',
        'used_by',
        'used_at',
        'related_box_id',
        'valid_until',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
            'used_at' => 'datetime',
            'valid_until' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function usedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'related_box_id');
    }
}
