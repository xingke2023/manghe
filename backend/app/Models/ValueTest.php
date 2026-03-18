<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValueTest extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'answers',
        'risk_count',
        'risk_questions',
        'status',
        'reviewer_id',
        'review_note',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'risk_count' => 'integer',
            'risk_questions' => 'array',
            'status' => 'integer',
            'reviewed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewer_id');
    }
}
