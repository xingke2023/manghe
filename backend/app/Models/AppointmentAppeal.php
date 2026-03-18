<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentAppeal extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'appellant_id',
        'respondent_id',
        'reason',
        'evidence_images',
        'status',
        'reviewer_id',
        'review_result',
        'review_note',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'evidence_images' => 'array',
            'status' => 'integer',
            'review_result' => 'integer',
            'reviewed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function appellant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'appellant_id');
    }

    public function respondent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondent_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewer_id');
    }
}
