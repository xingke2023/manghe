<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'deposit_type',
        'related_box_id',
        'transaction_id',
        'payment_status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'type' => 'integer',
            'deposit_type' => 'integer',
            'payment_status' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'related_box_id');
    }
}
