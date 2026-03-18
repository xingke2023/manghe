<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoxView extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'box_id',
        'viewer_id',
    ];

    protected function casts(): array
    {
        return [
            'first_view_at' => 'datetime',
        ];
    }

    public function blindBox(): BelongsTo
    {
        return $this->belongsTo(BlindBox::class, 'box_id');
    }

    public function viewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_id');
    }
}
