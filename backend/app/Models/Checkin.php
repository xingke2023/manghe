<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Checkin extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'user_id',
        'checkin_latitude',
        'checkin_longitude',
        'distance_meters',
        'is_valid',
    ];

    protected function casts(): array
    {
        return [
            'checkin_latitude' => 'decimal:7',
            'checkin_longitude' => 'decimal:7',
            'distance_meters' => 'integer',
            'is_valid' => 'boolean',
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
}
