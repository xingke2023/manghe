<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileViewPermission extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'requester_id',
        'owner_id',
        'status',
        'processed_at',
        'next_request_time',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
            'processed_at' => 'datetime',
            'next_request_time' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
