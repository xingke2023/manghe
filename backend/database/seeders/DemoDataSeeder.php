<?php

namespace Database\Seeders;

use App\Models\BlindBox;
use App\Models\BoxApplication;
use App\Models\User;
use App\Models\UserFollow;
use App\Models\UserProfile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * 演示数据：100 用户 + 50 盲盒 + 大量报名。
 *
 * 特点：
 *   - 可重复执行。所有行都带 demo_ 前缀的 openid，重跑先按前缀清掉旧数据
 *     （users 上的外键都是 ON DELETE CASCADE，删用户会连带清掉资料/盲盒/报名/关注）
 *   - 随机数固定种子，每次生成的数据一致，便于对照排查
 *   - 手机号统一 1770000xxxx，直接用 POST /api/auth/login 传 phone 即可登录任一演示账号
 *   - avatar_url 留空，前端会回落到 /api/avatar/{userId}.png（服务端缓存的 dicebear 头像）
 *
 * 用法：php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    private const USER_COUNT = 100;

    private const BOX_COUNT = 50;

    /** 演示账号的 openid 前缀，兼作重跑时的清理条件 */
    private const OPENID_PREFIX = 'demo_';

    /** 演示账号手机号前缀 + 3 位序号 */
    private const PHONE_PREFIX = '1770000';

    /** 报名费，与 ApplicationController 里写死的金额保持一致 */
    private const ANTI_FLAKE_FEE = 50.00;

    public function run(): void
    {
        mt_srand(20260902);

        $this->purgePreviousRun();

        $userIds = $this->seedUsers();
        $this->seedProfiles($userIds);
        $boxes = $this->seedBlindBoxes($userIds);
        $applicationTotal = $this->seedApplications($boxes, $userIds);
        $followTotal = $this->seedFollows($boxes, $userIds);

        $this->command->info(sprintf(
            '演示数据完成：%d 用户 / %d 盲盒 / %d 报名 / %d 关注',
            count($userIds),
            count($boxes),
            $applicationTotal,
            $followTotal,
        ));
        $this->command->info(sprintf(
            '登录任一演示账号：POST /api/auth/login {"phone":"%s001"} … 到 %s%03d',
            self::PHONE_PREFIX,
            self::PHONE_PREFIX,
            self::USER_COUNT,
        ));
    }

    /**
     * 清掉上一次的演示数据。users 的级联删除会带走
     * user_profiles / blind_boxes / box_applications / user_follows。
     */
    private function purgePreviousRun(): void
    {
        $deleted = User::query()
            ->where('openid', 'like', self::OPENID_PREFIX.'%')
            ->delete();

        if ($deleted > 0) {
            $this->command->warn("已清除上一次的 {$deleted} 个演示用户及其关联数据");
        }
    }

    // ==================== 用户 ====================

    /** @return array<int, int> 新建用户的 id */
    private function seedUsers(): array
    {
        $now = now();
        $rows = [];

        foreach (range(1, self::USER_COUNT) as $i) {
            $gender = $i % 2 === 1 ? 1 : 2;   // 男女各 50
            $age = $this->pick(self::AGES);
            $birthDate = $now->copy()->subYears($age)->subDays(mt_rand(0, 364));
            $city = $this->pick(array_keys(self::DISTRICTS));
            $isMember = mt_rand(1, 100) <= 40;

            $rows[] = [
                'openid' => self::OPENID_PREFIX.$i,
                'phone' => self::PHONE_PREFIX.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'nickname' => self::NICKNAMES[$i - 1],
                // 留空，前端回落到 /api/avatar/{id}.png
                'avatar_url' => null,
                'gender' => $gender,
                'birth_date' => $birthDate->toDateString(),
                'age' => $age,
                'height' => $gender === 1 ? mt_rand(170, 188) : mt_rand(155, 172),
                'province' => self::PROVINCES[$city],
                'city' => $city,
                'district' => $this->pick(self::DISTRICTS[$city]),
                'account_status' => 1,
                // 六成有发盒资格，才够 50 个盲盒分散到不同发盒者
                'has_box_permission' => mt_rand(1, 100) <= 60 ? 1 : 0,
                'is_member' => $isMember ? 1 : 0,
                'member_expire_date' => $isMember
                    ? $now->copy()->addDays(mt_rand(15, 330))->toDateTimeString()
                    : null,
                // 多数满分，少量因失约扣过分
                'credit_score' => mt_rand(1, 100) <= 82 ? 100 : mt_rand(78, 99),
                'created_at' => $now->copy()->subDays(mt_rand(1, 180))->toDateTimeString(),
                'updated_at' => $now->toDateTimeString(),
            ];
        }

        User::query()->insert($rows);

        return User::query()
            ->where('openid', 'like', self::OPENID_PREFIX.'%')
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /** @param  array<int, int>  $userIds */
    private function seedProfiles(array $userIds): void
    {
        $now = now()->toDateTimeString();
        $rows = [];

        foreach ($userIds as $index => $userId) {
            $rows[] = [
                'user_id' => $userId,
                'dating_purposes' => $this->jsonSample(self::DATING_PURPOSES, 1, 2),
                'target_gender' => $this->pick([1, 2, 3]),
                'target_age_min' => $targetMin = mt_rand(20, 28),
                'target_age_max' => $targetMin + mt_rand(4, 12),
                'about_me' => self::ABOUT_ME[$index % count(self::ABOUT_ME)],
                'interests' => $this->jsonSample(self::INTERESTS, 3, 6),
                // 相册留空数组：兴趣相册的授权流程仍可演示（无图时前端显示占位）
                'interest_photos' => json_encode([]),
                'occupation' => $this->pick(self::OCCUPATIONS),
                'company' => null,
                'school' => null,
                'education' => $this->pick(self::EDUCATIONS),
                'annual_income' => $this->pick(self::INCOMES),
                'assets_range' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        UserProfile::query()->insert($rows);
    }

    // ==================== 盲盒 ====================

    /**
     * @param  array<int, int>  $userIds
     * @return array<int, array{id: int, creator_id: int, kind: string, max_participants: int, meeting_time: \Carbon\Carbon}>
     */
    private function seedBlindBoxes(array $userIds): array
    {
        $maxIdBefore = (int) BlindBox::query()->max('id');

        // 只有拿到发盒资格的用户能发盒
        $creatorIds = User::query()
            ->where('openid', 'like', self::OPENID_PREFIX.'%')
            ->where('has_box_permission', 1)
            ->pluck('id')
            ->all();

        // 兜底：万一随机结果里没人拿到资格
        if (empty($creatorIds)) {
            $creatorIds = array_slice($userIds, 0, 20);
        }

        $now = now();
        $rows = [];
        $plan = [];

        foreach (range(0, self::BOX_COUNT - 1) as $i) {
            // 前 36 个进行中（广场可见、报名火热），中间 8 个已匹配，最后 6 个已过期
            $kind = match (true) {
                $i < 36 => 'open',
                $i < 44 => 'matched',
                default => 'expired',
            };

            $creatorId = $creatorIds[$i % count($creatorIds)];
            $city = $this->pick(array_keys(self::DISTRICTS));
            $category = self::CATEGORIES[$i % count(self::CATEGORIES)];
            $title = self::TITLES[$category][intdiv($i, count(self::CATEGORIES)) % count(self::TITLES[$category])];

            $meetingTime = $kind === 'expired'
                ? $now->copy()->subDays(mt_rand(2, 25))->setTime(mt_rand(10, 20), $this->pick([0, 30]))
                : $now->copy()->addDays(mt_rand(1, 30))->setTime(mt_rand(10, 20), $this->pick([0, 30]));

            // 创建时间要早于约会时间，且不早于 40 天前
            $createdAt = $meetingTime->copy()->subDays(mt_rand(2, 12));
            if ($createdAt->lt($now->copy()->subDays(40))) {
                $createdAt = $now->copy()->subDays(40);
            }

            $maxParticipants = $this->pick([1, 1, 1, 2, 2, 3]);

            // 区与地点成对取出，保证地址自洽
            [$district, $venue] = $this->pick(self::VENUES[$city]);

            $rows[] = [
                'creator_id' => $creatorId,
                'cover_image' => self::COVERS[$i % count(self::COVERS)],
                'title' => $title,
                'meeting_time' => $meetingTime->toDateTimeString(),
                'location' => $venue,
                'location_latitude' => self::COORDS[$city][0] + mt_rand(-400, 400) / 10000,
                'location_longitude' => self::COORDS[$city][1] + mt_rand(-400, 400) / 10000,
                'province' => self::PROVINCES[$city],
                'city' => $city,
                'district' => $district,
                'fee_type' => mt_rand(1, 100) <= 65 ? 1 : 2,   // 六成半 AA
                'expected_traits' => $this->jsonSample(self::TRAITS, 2, 3),
                // 首项是广场卡片的分类角标，也是 category 筛选命中的值
                'experience_values' => json_encode(
                    array_values(array_unique([$category, $this->pick(self::EXPERIENCE_VALUES)])),
                    JSON_UNESCAPED_UNICODE
                ),
                'max_participants' => $maxParticipants,
                // 报名写完后回填
                'current_participants' => 0,
                'status' => match ($kind) {
                    'open' => 1,
                    'matched' => 3,   // 锁定后 ApplicationController 会把盲盒置为 3
                    default => 4,
                },
                'view_count' => 0,
                'apply_count' => 0,
                'checkin_start_time' => $meetingTime->copy()->subHours(3)->toDateTimeString(),
                'checkin_end_time' => $meetingTime->copy()->addHours(2)->toDateTimeString(),
                'created_at' => $createdAt->toDateTimeString(),
                'updated_at' => $createdAt->toDateTimeString(),
                'expired_at' => $meetingTime->copy()->addHours(2)->toDateTimeString(),
            ];

            $plan[] = [
                'kind' => $kind,
                'creator_id' => $creatorId,
                'max_participants' => $maxParticipants,
                'meeting_time' => $meetingTime->copy(),
                'created_at' => $createdAt->copy(),
            ];
        }

        BlindBox::query()->insert($rows);

        // 取回自增 id：只认本次插入的（id 大于插入前的最大值），按 id 升序与 plan 对齐
        $ids = BlindBox::query()
            ->where('id', '>', $maxIdBefore)
            ->orderBy('id')
            ->pluck('id')
            ->all();

        return array_map(
            fn (int $index): array => ['id' => $ids[$index]] + $plan[$index],
            array_keys($plan),
        );
    }

    // ==================== 报名 ====================

    /**
     * 每个盲盒 12~35 个报名者，报名很热闹。
     *
     * @param  array<int, array{id: int, creator_id: int, kind: string, max_participants: int, meeting_time: \Carbon\Carbon, created_at: \Carbon\Carbon}>  $boxes
     * @param  array<int, int>  $userIds
     * @return int 报名总数
     */
    private function seedApplications(array $boxes, array $userIds): int
    {
        $now = now();
        $rows = [];
        /** @var array<int, array{apply: int, locked: int}> $counters */
        $counters = [];

        foreach ($boxes as $box) {
            // 报名者不能是发盒者自己
            $candidates = array_values(array_filter(
                $userIds,
                fn (int $id): bool => $id !== $box['creator_id'],
            ));
            shuffle($candidates);

            $wanted = mt_rand(12, 35);
            $applicants = array_slice($candidates, 0, min($wanted, count($candidates)));

            // 已匹配的盲盒锁定 max_participants 个人，其余「擦肩而过」
            $lockCount = $box['kind'] === 'matched'
                ? min($box['max_participants'], count($applicants))
                : 0;

            // 报名只可能发生在发盒之后、约会开始之前（进行中的盒子最晚到现在）
            $windowStart = $box['created_at'];
            $windowEnd = $box['meeting_time']->lt($now) ? $box['meeting_time'] : $now;
            if ($windowEnd->lte($windowStart)) {
                $windowEnd = $windowStart->copy()->addHours(6);
            }

            foreach ($applicants as $position => $applicantId) {
                $isLocked = $position < $lockCount;

                // 状态：1 开启中 / 2 收到邀请 / 3 擦肩而过 / 4 遗憾错过
                $status = match (true) {
                    $isLocked => 2,
                    $box['kind'] === 'matched' => 3,
                    $box['kind'] === 'expired' => 4,
                    default => 1,
                };

                $createdAt = $this->randomBetween($windowStart, $windowEnd);
                $lockedAt = $isLocked
                    ? $this->randomBetween($createdAt, $box['meeting_time'])
                    : null;

                $rows[] = [
                    'box_id' => $box['id'],
                    'applicant_id' => $applicantId,
                    'status' => $status,
                    'is_locked' => $isLocked ? 1 : 0,
                    'locked_at' => $lockedAt?->toDateTimeString(),
                    'anti_flake_fee' => self::ANTI_FLAKE_FEE,
                    'transaction_id' => 'demo_tx_'.$box['id'].'_'.$applicantId,
                    'payment_status' => 2,   // 已支付（mock）
                    'refund_transaction_id' => null,
                    'refunded_at' => null,
                    // 只有锁定并已过期的才有履约结果
                    'fulfill_status' => $isLocked && $box['kind'] === 'expired' ? 1 : null,
                    'deposit_status' => $isLocked ? 1 : null,
                    'created_at' => $createdAt->toDateTimeString(),
                    'updated_at' => $createdAt->toDateTimeString(),
                ];
            }

            $counters[$box['id']] = [
                'apply' => count($applicants),
                'locked' => $lockCount,
            ];
        }

        // 一千来行，分批插入避免单条 SQL 过大
        foreach (array_chunk($rows, 200) as $chunk) {
            BoxApplication::query()->insert($chunk);
        }

        $this->syncBoxCounters($counters);

        return count($rows);
    }

    /**
     * 回填 apply_count / current_participants / view_count，
     * 让盲盒上的计数与真实报名行数一致。
     *
     * @param  array<int, array{apply: int, locked: int}>  $counters
     */
    private function syncBoxCounters(array $counters): void
    {
        foreach ($counters as $boxId => $counter) {
            BlindBox::query()->where('id', $boxId)->update([
                'apply_count' => $counter['apply'],
                'current_participants' => $counter['locked'],
                // 浏览数总是明显高于报名数
                'view_count' => $counter['apply'] * mt_rand(3, 9) + mt_rand(0, 20),
            ]);
        }
    }

    // ==================== 关注 ====================

    /**
     * 让「我关注的」Tab 有内容：部分用户关注若干发盒者。
     *
     * @param  array<int, array{id: int, creator_id: int, kind: string, max_participants: int, meeting_time: \Carbon\Carbon, created_at: \Carbon\Carbon}>  $boxes
     * @param  array<int, int>  $userIds
     * @return int 关注关系总数
     */
    private function seedFollows(array $boxes, array $userIds): int
    {
        $creatorIds = array_values(array_unique(array_column($boxes, 'creator_id')));
        $now = now();
        $rows = [];

        foreach ($userIds as $followerId) {
            // 六成用户有关注行为
            if (mt_rand(1, 100) > 60) {
                continue;
            }

            $targets = array_values(array_filter(
                $creatorIds,
                fn (int $id): bool => $id !== $followerId,
            ));
            shuffle($targets);

            // 关注上限业务上是 12 人，这里最多 8
            foreach (array_slice($targets, 0, mt_rand(2, 8)) as $followeeId) {
                $rows[] = [
                    'follower_id' => $followerId,
                    'followee_id' => $followeeId,
                    'created_at' => $now->copy()->subDays(mt_rand(1, 90))->toDateTimeString(),
                ];
            }
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            UserFollow::query()->insert($chunk);
        }

        return count($rows);
    }

    // ==================== 工具 ====================

    /**
     * @template T
     *
     * @param  array<int, T>  $items
     * @return T
     */
    private function pick(array $items)
    {
        return $items[mt_rand(0, count($items) - 1)];
    }

    /**
     * 从池子里随机取 min~max 项，返回 JSON 字符串（中文不转义，便于直接看库）。
     *
     * @param  array<int, string>  $pool
     */
    private function jsonSample(array $pool, int $min, int $max): string
    {
        $copy = $pool;
        shuffle($copy);

        return json_encode(
            array_slice($copy, 0, mt_rand($min, min($max, count($copy)))),
            JSON_UNESCAPED_UNICODE
        );
    }

    private function randomBetween(\Carbon\Carbon $from, \Carbon\Carbon $to): \Carbon\Carbon
    {
        $span = (int) abs($to->diffInSeconds($from));

        return $from->copy()->addSeconds(mt_rand(0, max(1, $span)));
    }

    // ==================== 数据池 ====================

    /** @var array<int, string> 100 个昵称，与用户序号一一对应 */
    private const NICKNAMES = [
        '小熊饼干', '海边的毛毛', '柠檬不酸', '一只柯基', '晚风信箱', '芝士年糕', '路过的猫',
        '深夜面包', '橘子汽水', '云层之上', '雨天备胎', '青提优优', '半糖主义', '风筝与线',
        '木质香调', '南风知我', '拿铁不加糖', '慢跑的鱼', '菠萝头', '不加冰', '树莓布丁',
        '临时飞行员', '铁皮玩具', '甜豆花', '午后书店', '一颗荔枝', '雪顶咖啡', '走神先生',
        '折耳根', '海盐奶盖', '朝八晚五', '开水白菜', '望远镜里', '小满', '荞麦茶',
        '打字机', '苔原', '两点半', '琥珀色', '汽水泡泡', '山楂片', '冷萃日常', '缓慢生长',
        '纸飞机场', '一格电', '橄榄枝', '灰豆子', '南山脚下', '春分', '起司蛋糕',
        '晒被子的人', '慢半拍', '大米先生', '风的形状', '桂花酿', '第七次', '铅笔屑',
        '云吞面', '小行星', '奶油卷', '拾光者', '海胆头', '不眠列车', '青梅煮酒',
        '爱吃香菜', '棉花糖云', '零度可乐', '街角唱片', '芒果班戟', '硬糖', '有点困',
        '柚子茶', '独角兽饲养员', '干杯少女', '静音模式', '烤红薯', '莫比乌斯', '爬树高手',
        '早八人', '深水区', '甜杏仁', '菜市场诗人', '打盹的狗', '天台风大', '一勺盐',
        '波纹管', '空调外机', '荔枝气泡', '橙心橙意', '蓝调午夜', '数羊失败', '半熟蛋',
        '路灯下', '雾都孤儿', '木薯珍珠', '骑车去海边', '冬瓜茶', '一起看云', '折纸鹤',
        '慢煮生活', '返程票',
    ];

    /** @var array<int, int> 年龄池，重复的值权重更高（主力 24~32 岁） */
    private const AGES = [
        22, 23, 24, 24, 25, 25, 26, 26, 26, 27, 27, 27, 28, 28, 28,
        29, 29, 29, 30, 30, 30, 31, 31, 32, 32, 33, 34, 35, 36, 38,
    ];

    /** @var array<int, string> */
    private const ABOUT_ME = [
        '热爱生活，喜欢在城市里到处乱走，期待遇见有趣的灵魂。',
        '周末不爱待在家，喜欢徒步、露营和一切户外活动。',
        'i 人但聊起感兴趣的话题会变成 e 人，欢迎来聊。',
        '重度美食爱好者，探店清单排到了明年，缺个搭子。',
        '喜欢看电影，尤其是文艺片和悬疑片，看完想找人聊两小时。',
        '健身三年，撸铁和游泳都可以，也能陪你散步聊天。',
        '手里有相机，可以帮你拍好看的照片，互相成就。',
        '平时写代码，业余弹吉他，希望认识不同行业的朋友。',
        '喜欢安静的地方，书店、美术馆、咖啡馆都是我的主场。',
        '话不多但很靠谱，约了就一定到，不鸽。',
        '爱做饭，可以邀你来家里吃一顿，也可以一起去菜市场。',
        '刚来这个城市不久，想多认识些人，一起把周末填满。',
    ];

    /** @var array<int, string> 与 miniapp/constants.js 的兴趣选项对齐 */
    private const INTERESTS = [
        '热衷乐器', '野餐露营', '撸铁', '话剧脱口秀', '甜度满载奶茶', '放风筝',
        '健身游泳', '拍美照', '挑战极限运动', '电竞游戏', '下厨做饭', '音乐达人',
    ];

    /** @var array<int, string> 广场分类筛选用的 5 个值 */
    private const CATEGORIES = ['美食探索', '文艺沉浸', '技能交换', '观影交流', '深度对话'];

    /** @var array<int, string> */
    private const EXPERIENCE_VALUES = [
        '热衷乐器', '野餐露营', '撸铁', '话剧脱口秀', '甜度满载奶茶', '放风筝',
        '健身游泳', '拍美照', '美食探索', '观影交流', '深度对话', '技能交换',
    ];

    /** @var array<string, array<int, string>> 每个分类 10 个主题，共 50 个 */
    private const TITLES = [
        '美食探索' => [
            '深夜食堂寻宝，城中村小馆巡礼',
            '潮汕牛肉火锅局，涮到扶墙出',
            '早茶马拉松，一盅两件慢慢聊',
            '苍蝇馆子挑战赛，只吃本地人推荐的',
            '手作意面之夜，从揉面开始',
            '烧烤摊蹲点，配两瓶冰啤酒',
            '甜品店三连跳，从可丽饼吃到芭菲',
            '菜市场买菜 + 回家开火，AA 食材',
            '云南米线与野菌，边吃边聊旅行',
            '面包店晨间巡游，趁刚出炉',
        ],
        '文艺沉浸' => [
            '美术馆看展，看完找地方写观后感',
            '独立书店淘书，交换年度书单',
            '话剧之夜，散场后聊剧本',
            '黑胶唱片店挖宝，试听两小时',
            '城市漫步拍照，出片率很高的路线',
            '陶艺工作室拉坯，做个歪歪扭扭的碗',
            '深夜爵士小酒馆，只聊音乐',
            '老城区扫街，找那些快消失的招牌',
            '插花小课堂，带一束花回家',
            '露天电影 + 草坪野餐',
        ],
        '技能交换' => [
            '你教我摄影，我教你做饭',
            '吉他入门互助，两小时学会四个和弦',
            '英语角小聚，只说英文不许中文',
            'Excel 与 PPT 速成，互相拆解工作难题',
            '游泳陪练局，蛙泳自由泳都行',
            '手冲咖啡教学，从磨豆开始',
            '简历互改 + 模拟面试',
            '滑板入门，先学会怎么摔',
            '手机剪辑速成，做条能发的 vlog',
            '爬楼拍城市天际线，教你构图',
        ],
        '观影交流' => [
            '周末电影马拉松，六部 cult 片',
            '悬疑片专场，看完各写一版真相',
            '重看经典老片，聊聊当年的滤镜',
            '纪录片之夜，看完开个小型辩论',
            '影院首映日，散场立刻打分',
            '动画长片补片计划，从吉卜力开始',
            '导演专题周，一次看三部',
            '烂片鉴赏大会，笑着看完',
            '露天投影 + 泡面局，怀旧配置',
            '短片放映会，聊聊镜头语言',
        ],
        '深度对话' => [
            '咖啡馆两小时，只聊真心话',
            '海边散步聊人生，走到日落',
            '换个城市视角，聊聊各自的来处',
            '职业困惑互助局，把问题摊开说',
            '书房夜谈，一人带一个问题来',
            '公园长椅聊天，不带手机',
            '爬山路上聊天，到山顶再喝口水',
            '深夜大排档，聊那些白天不说的话',
            '哲学话题漫谈，不求结论',
            '人生规划复盘，年底前想清楚一件事',
        ],
    ];

    /** @var array<int, string> */
    private const TRAITS = [
        '好奇宝宝', '文艺青年', 'i 人', 'e 人', '吃货', '探险家',
        '话痨', '倾听者', '准时党', '不鸽的人', '爱笑', '小众文化',
    ];

    /** @var array<int, string> */
    private const OCCUPATIONS = [
        '产品经理', '前端工程师', '设计师', '教师', '医生', '律师',
        '市场运营', '摄影师', '会计', '建筑师', '销售', '创业者',
        '记者', '护士', '人力资源', '公务员', '咖啡师', '健身教练',
    ];

    /** @var array<int, string> */
    private const EDUCATIONS = ['高中及以下', '大专', '本科', '本科', '本科', '硕士', '硕士', '博士'];

    /** @var array<int, string> */
    private const INCOMES = ['5万以下', '5-10万', '10-20万', '10-20万', '20-50万', '50万以上'];

    /** @var array<int, string> */
    private const DATING_PURPOSES = ['找兴趣搭子', '脱单', 'Dating', '婚恋'];

    /** @var array<string, string> 城市 → 省份 */
    private const PROVINCES = [
        '深圳' => '广东省',
        '广州' => '广东省',
        '上海' => '上海市',
        '北京' => '北京市',
        '杭州' => '浙江省',
        '成都' => '四川省',
    ];

    /** @var array<string, array<int, string>> 城市 → 区 */
    private const DISTRICTS = [
        '深圳' => ['南山区', '福田区', '宝安区', '龙岗区', '罗湖区', '龙华区'],
        '广州' => ['天河区', '越秀区', '海珠区', '荔湾区', '番禺区'],
        '上海' => ['黄浦区', '徐汇区', '静安区', '长宁区', '浦东新区'],
        '北京' => ['朝阳区', '海淀区', '东城区', '西城区', '昌平区'],
        '杭州' => ['西湖区', '上城区', '拱墅区', '滨江区', '余杭区'],
        '成都' => ['锦江区', '青羊区', '武侯区', '成华区', '高新区'],
    ];

    /** @var array<string, array<int, float>> 城市中心经纬度，落点在附近随机偏移 */
    private const COORDS = [
        '深圳' => [22.5431, 114.0579],
        '广州' => [23.1291, 113.2644],
        '上海' => [31.2304, 121.4737],
        '北京' => [39.9042, 116.4074],
        '杭州' => [30.2741, 120.1551],
        '成都' => [30.5728, 104.0668],
    ];

    /**
     * @var array<string, array<int, array<int, string>>> 城市 → [[区, 地点], …]
     *
     * 区与地点成对出现，避免出现「罗湖区 深圳湾人才公园」这种自相矛盾的地址
     * （详情页会把 province/city/district 和 location 一起展示）。
     */
    private const VENUES = [
        '深圳' => [
            ['南山区', '海岸城购物中心'],
            ['南山区', '前海印里'],
            ['南山区', '深圳湾人才公园'],
            ['南山区', '万象天地'],
            ['南山区', '华侨城创意文化园'],
            ['南山区', '蛇口海上世界'],
            ['福田区', '星河 COCO Park'],
            ['福田区', '深业上城'],
            ['福田区', '莲花山公园'],
            ['罗湖区', '东门老街'],
            ['罗湖区', '万象城'],
            ['罗湖区', '梧桐山风景区'],
            ['宝安区', '海雅缤纷城'],
            ['龙岗区', '大运公园'],
            ['龙华区', '壹方天地'],
        ],
        '广州' => [
            ['天河区', '天河太古汇'],
            ['天河区', '正佳广场'],
            ['天河区', '珠江新城花城广场'],
            ['越秀区', '越秀公园'],
            ['越秀区', '北京路步行街'],
            ['越秀区', '东山口'],
            ['海珠区', '广州塔南广场'],
            ['海珠区', '太古仓码头'],
            ['荔湾区', '永庆坊'],
            ['荔湾区', '沙面岛'],
            ['荔湾区', '上下九步行街'],
            ['番禺区', '长隆度假区'],
        ],
        '上海' => [
            ['黄浦区', '外滩源'],
            ['黄浦区', '田子坊'],
            ['黄浦区', '思南公馆'],
            ['黄浦区', '新天地'],
            ['徐汇区', '安福路'],
            ['徐汇区', '武康路'],
            ['徐汇区', '西岸美术馆'],
            ['徐汇区', '徐汇滨江'],
            ['静安区', '静安嘉里中心'],
            ['静安区', '张园'],
            ['长宁区', '愚园路'],
            ['长宁区', '上生新所'],
            ['浦东新区', '陆家嘴中心'],
            ['浦东新区', '前滩太古里'],
        ],
        '北京' => [
            ['朝阳区', '三里屯太古里'],
            ['朝阳区', '798 艺术区'],
            ['朝阳区', '朝阳大悦城'],
            ['朝阳区', '颐堤港'],
            ['朝阳区', '亮马河畔'],
            ['朝阳区', '奥林匹克森林公园'],
            ['海淀区', '五道口'],
            ['海淀区', '圆明园'],
            ['东城区', '国子监街'],
            ['东城区', '南锣鼓巷'],
            ['西城区', '什刹海'],
            ['西城区', '后海酒吧街'],
            ['昌平区', '十三陵水库'],
        ],
        '杭州' => [
            ['西湖区', '西湖断桥'],
            ['西湖区', '龙井村'],
            ['西湖区', '天目里'],
            ['西湖区', '西溪湿地'],
            ['上城区', '湖滨银泰'],
            ['上城区', '南宋御街'],
            ['拱墅区', '桥西直街'],
            ['拱墅区', '运河文化广场'],
            ['滨江区', '星光大道'],
            ['余杭区', '良渚文化艺术中心'],
        ],
        '成都' => [
            ['锦江区', '太古里'],
            ['锦江区', '望平街'],
            ['锦江区', '九眼桥'],
            ['青羊区', '宽窄巷子'],
            ['青羊区', '浣花溪公园'],
            ['武侯区', '玉林东路'],
            ['武侯区', '锦里古街'],
            ['成华区', '东郊记忆'],
            ['高新区', '交子大道'],
            ['高新区', '铁像寺水街'],
        ],
    ];

    /** @var array<int, string> 封面图（unsplash，与库里已有数据同风格） */
    private const COVERS = [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
        'https://images.unsplash.com/photo-1598908314732-07113901949e?w=400',
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
        'https://images.unsplash.com/photo-1508175800969-525c72a047dd?w=400',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=400',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
        'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400',
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    ];
}
