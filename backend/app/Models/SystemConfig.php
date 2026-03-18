<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model
{
    protected $fillable = [
        'config_key',
        'config_value',
        'config_type',
        'description',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    /**
     * 获取配置值，自动转换类型
     */
    public function getTypedValueAttribute(): mixed
    {
        return match ($this->config_type) {
            'integer' => (int) $this->config_value,
            'float' => (float) $this->config_value,
            'boolean' => filter_var($this->config_value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->config_value, true),
            default => $this->config_value,
        };
    }

    /**
     * 按 key 获取配置值
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $config = static::query()->where('config_key', $key)->first();

        return $config ? $config->typed_value : $default;
    }
}
