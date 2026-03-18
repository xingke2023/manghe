<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoxApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'box_id',
        'applicant_id',
        'status',
        'is_locked',
        'locked_at',
        'anti_flake_fee',
        'transaction_id',
        'payment_status',
        'refund_transaction_id',
        'refunded_at',
        'fulfill_status',
        'deposit_status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
            'anti_flake_fee' => 'decimal:2',
            'payment_status' => 'integer',
            'refunded_at' => 'datetime',
            'fulfill_status' => 'integer',
            'deposit_status' => 'integer',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }
}
