<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $content,
        ?string $relatedType = null,
        ?int $relatedId = null,
        ?string $linkUrl = null,
    ): Notification {
        return Notification::query()->create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'content' => $content,
            'related_type' => $relatedType,
            'related_id' => $relatedId,
            'link_url' => $linkUrl,
            'is_read' => false,
        ]);
    }
}
