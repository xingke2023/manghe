<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingCode extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'user_id',
        'role',
        'qr_code',
        'is_scanned',
        'scanned_at',
        'scanned_by',
        'valid_until',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'role' => 'integer',
            'is_scanned' => 'boolean',
            'scanned_at' => 'datetime',
            'valid_until' => 'datetime',
            'status' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
