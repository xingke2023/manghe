<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyBoxViewStat extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'stat_date',
        'view_count',
    ];

    protected function casts(): array
    {
        return [
            'stat_date' => 'date',
            'view_count' => 'integer',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
