<?php

namespace Database\Seeders;

use App\Models\SystemConfig;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * 系统配置的预置项，取自 database/README.md「预置配置项」一节。
 *
 * 这张表原本是空的，导致所有 SystemConfig::getValue() 都落到调用处写的
 * 默认值上 —— 最直接的后果是会员每日拆盒次数取不到 10，被
 * MeController@dailyViews 的默认值 3 兜住，会员与普通用户没有区别。
 *
 * config_type 用 'integer' / 'float'，与 SystemConfig::getTypedValueAttribute()
 * 的 match 分支对齐（注意是 integer 而不是 int，写错会退化成字符串）。
 *
 * 可重复执行：按 config_key upsert，不会产生重复行。
 *
 * 用法：php artisan db:seed --class=SystemConfigSeeder
 */
class SystemConfigSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * @var array<int, array{0: string, 1: string, 2: string, 3: string, 4: bool}>
     *                                                                             [key, value, type, description, is_public]
     */
    private const CONFIGS = [
        // —— 拆盒次数限制 ——
        ['daily_box_view_limit', '3', 'integer', '普通用户每日拆盒次数', true],
        ['daily_box_view_limit_vip', '10', 'integer', '会员每日拆盒次数', true],

        // —— 费用配置 ——
        ['box_deposit_amount', '100.00', 'float', '发盒保证金（元）', true],
        ['box_anti_flake_fee', '50.00', 'float', '拆盒防鸽费（元）', true],

        // —— 履约配置 ——
        ['checkin_radius_meters', '300', 'integer', '打卡有效范围（米）', true],
        ['checkin_before_hours', '3', 'integer', '打卡开始时间（活动前 N 小时）', true],
        ['checkin_after_hours', '2', 'integer', '打卡结束时间（活动后 N 小时）', true],
        ['qrcode_valid_hours', '24', 'integer', '见面码有效期（小时）', false],

        // —— 其他配置 ——
        ['chat_destroy_hours', '2', 'integer', '聊天记录销毁时间（活动结束后 N 小时）', false],
        ['max_follow_count', '12', 'integer', '会员最大关注人数', true],
        ['voucher_valid_days', '7', 'integer', '发盒凭证有效期（天）', true],
        ['appeal_timeout_hours', '24', 'integer', '申诉提交时限（小时）', true],
        ['profile_view_cooldown_hours', '24', 'integer', '资料查看申请被拒冷却时间（小时）', false],
    ];

    public function run(): void
    {
        $now = now()->toDateTimeString();

        $rows = array_map(fn (array $c): array => [
            'config_key' => $c[0],
            'config_value' => $c[1],
            'config_type' => $c[2],
            'description' => $c[3],
            'is_public' => $c[4] ? 1 : 0,
            'created_at' => $now,
            'updated_at' => $now,
        ], self::CONFIGS);

        SystemConfig::query()->upsert(
            $rows,
            ['config_key'],
            ['config_value', 'config_type', 'description', 'is_public', 'updated_at'],
        );

        $this->command->info(sprintf('系统配置已写入 %d 项', count($rows)));
    }
}
