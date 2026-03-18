<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'creator_id',
        'applicant_id',
        'status',
        'is_unlocked',
        'last_message',
        'last_message_time',
        'closed_at',
        'destroy_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
            'is_unlocked' => 'boolean',
            'last_message_time' => 'datetime',
            'created_at' => 'datetime',
            'closed_at' => 'datetime',
            'destroy_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'session_id');
    }
}
