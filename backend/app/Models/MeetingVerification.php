<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingVerification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'scanner_id',
        'scanned_id',
        'qr_code',
        'is_valid',
        'fail_reason',
    ];

    protected function casts(): array
    {
        return [
            'is_valid' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanner_id');
    }

    public function scanned(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_id');
    }
}
