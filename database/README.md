# 约会盲盒 - 数据库设计文档

## 概述

本数据库设计支持"约会盲盒"小程序的所有核心功能，采用MySQL 8.0+，共16张核心表。

**核心特点：**
- ✅ 盲盒即约会（一对多模式）
- ✅ 支持一个发盒者锁定多个拆盒者
- ✅ 每个参与者独立履约判定
- ✅ 完整的打卡+双向扫码核销机制
- ✅ 每日拆盒次数限制（普通用户3次/天，会员10次/天）
- ✅ 灵活的系统配置管理

---

## 数据库表结构（16张表）

### 1. 用户相关（4张表）

#### 1.1 users - 用户基础信息表
存储用户核心身份信息和账户状态。

**关键字段：**
- `openid`: 微信唯一标识
- `phone`: 手机号
- `account_status`: 账户状态（正常/冻结）
- `has_box_permission`: 发盒资格（无/有/审核中）
- `credit_score`: 履约信誉分
- `referrer_user_id`: 推荐人ID（拉新溯源）

#### 1.2 user_profiles - 用户详细资料表
存储用户社交偏好和个人介绍。

**关键字段：**
- `dating_purposes`: 约会目的（JSON数组）
- `target_gender`: 期望对象性别
- `interests`: 兴趣爱好标签（JSON数组）
- `interest_photos`: 兴趣照片（JSON数组）

#### 1.3 value_tests - 价值观测试表
记录用户的价值观测试答案和审核结果。

**关键字段：**
- `answers`: 10道题答案（JSON对象）
- `risk_count`: 高风险选项数量
- `status`: 审核状态（自动通过/待审核/通过/拒绝）

#### 1.4 user_follows - 用户关注表
管理用户之间的关注关系（会员功能）。

---

### 2. 盲盒/约会相关（4张表）

#### 2.1 blind_boxes - 盲盒表（即约会表）⭐️ 核心表
**盲盒 = 约会**，一个盲盒就是一次约会。

**关键字段：**
- `creator_id`: 发盒者用户ID
- `title`: 约会主题
- `meeting_time`: 约会时间
- `location`: 约会地点（经纬度）
- `max_participants`: 最多接受多少个拆盒者
- `current_participants`: 当前已锁定人数
- `status`: 1-进行中, 2-已满员, 3-已下架, 4-已过期
- `checkin_start_time`: 打卡开始时间（meeting_time前3小时）
- `checkin_end_time`: 打卡结束时间（meeting_time后2小时）

**业务规则：**
- 当 `current_participants >= max_participants` 时，状态变为"已满员"
- 一个盲盒可以有多个拆盒者被锁定

#### 2.2 box_applications - 盲盒报名表
记录拆盒者的报名和锁定状态。

**关键字段：**
- `box_id`: 盲盒ID
- `applicant_id`: 报名者ID
- `status`: 1-开启中, 2-收到邀请, 3-擦肩而过, 4-遗憾错过
- `is_locked`: 是否被发盒者选中（0-否, 1-是）
- `anti_flake_fee`: 防鸽费金额
- `fulfill_status`: 履约结果（完美履约/失约/对方失约）
- `deposit_status`: 费用状态（已缴纳/已退还/已扣除/已补偿）

**业务规则：**
- 一个盲盒可以有多条 `is_locked=1` 的记录
- 唯一约束：`(box_id, applicant_id)`

#### 2.3 box_views - 拆盒记录表
记录用户拆过哪些盲盒，用于判断是否首次查看。

**关键字段：**
- `box_id`: 盲盒ID
- `viewer_id`: 查看者用户ID
- `first_view_at`: 首次查看时间

**业务规则：**
- 记录用户**所有拆过的盲盒**（不按日期区分）
- 唯一约束：`(box_id, viewer_id)` - 每个用户对每个盲盒只有一条记录
- 用于判断：用户之前是否拆过此盲盒

**核心逻辑：**
- **首次拆盒**：记录到 `box_views` + 扣除当日次数
- **重复查看**：已存在记录，不扣除当日次数

#### 2.4 daily_box_view_stats - 用户每日拆盒统计表
记录用户每日的拆盒次数，用于限制。

**关键字段：**
- `user_id`: 用户ID
- `stat_date`: 统计日期
- `view_count`: 当日已拆盒次数

**业务规则：**
- 每日一条记录，唯一约束：`(user_id, stat_date)`
- 普通用户限制3次/天，会员10次/天（可配置）
- 次日自动重置（新的一天新建记录）

**拆盒次数检查流程：**
```sql
-- 1. 检查是否拆过此盲盒（重复查看不扣次数）
SELECT COUNT(*) as already_viewed
FROM box_views
WHERE box_id = ? AND viewer_id = ?;

IF already_viewed > 0 THEN
    -- 已拆过，直接显示，不扣次数
    RETURN ALLOW_VIEW;
END IF;

-- 2. 首次拆盒，检查今日剩余次数
SELECT IFNULL(view_count, 0) as used_count
FROM daily_box_view_stats
WHERE user_id = ? AND stat_date = CURDATE();

-- 3. 获取用户限制（会员10次，普通3次）
limit = user.is_member ? 10 : 3;

IF used_count >= limit THEN
    RETURN ERROR('今日拆盒次数已用完');
END IF;

-- 4. 记录拆盒
INSERT INTO box_views (box_id, viewer_id) VALUES (?, ?);

-- 5. 更新今日统计
INSERT INTO daily_box_view_stats (user_id, stat_date, view_count)
VALUES (?, CURDATE(), 1)
ON DUPLICATE KEY UPDATE view_count = view_count + 1;
```

---

### 3. 履约相关（3张表）

#### 3.1 checkins - 打卡记录表
记录用户的线下打卡行为（GPS验证）。

**关键字段：**
- `box_id`: 盲盒ID
- `user_id`: 打卡用户ID
- `checkin_latitude/longitude`: 打卡位置
- `distance_meters`: 与约定地点的距离
- `is_valid`: 是否有效（300米内为有效）

**业务规则：**
- 每个用户对每个盲盒只能打卡一次
- 唯一约束：`(box_id, user_id)`

#### 3.2 meeting_codes - 见面码表
为每个参与者生成唯一的见面码。

**关键字段：**
- `box_id`: 盲盒ID
- `user_id`: 用户ID
- `role`: 角色（1-发盒者, 2-拆盒者）
- `qr_code`: 见面码（唯一）
- `is_scanned`: 是否被扫过
- `scanned_by`: 扫码者ID

**业务规则：**
- 每个用户对每个盲盒只有一个见面码
- 唯一约束：`(box_id, user_id)`
- 全局唯一：`qr_code`

#### 3.3 meeting_verifications - 扫码验证记录表
记录每次双向扫码行为。

**关键字段：**
- `box_id`: 盲盒ID
- `scanner_id`: 扫码者ID
- `scanned_id`: 被扫者ID
- `qr_code`: 扫描的码
- `is_valid`: 验证是否通过

**业务规则：**
- 防止重复扫码
- 唯一约束：`(scanner_id, scanned_id, box_id)`

**双向扫码完成判定：**
```sql
-- 发盒者和拆盒者A完成双向扫码，需要满足：
SELECT COUNT(*) FROM meeting_verifications
WHERE box_id = ?
  AND ((scanner_id = 发盒者ID AND scanned_id = A的ID)
       OR (scanner_id = A的ID AND scanned_id = 发盒者ID))
  AND is_valid = 1;
-- 结果 = 2 则完成双向扫码
```

---

### 4. 沟通相关（3张表）

#### 4.1 chat_sessions - 聊天会话表
管理发盒者与每个拆盒者的聊天会话。

**关键字段：**
- `box_id`: 盲盒ID
- `creator_id`: 发盒者ID
- `applicant_id`: 拆盒者ID
- `is_unlocked`: 是否解锁自由对话（一句话盲聊机制）
- `destroy_at`: 销毁时间（活动结束后2小时）

#### 4.2 chat_messages - 聊天消息表
存储聊天消息内容。

**业务规则：**
- 消息到达 `destroy_at` 时间后自动销毁（定时任务）

#### 4.3 profile_view_permissions - 资料查看权限表
管理拆盒者申请查看发盒者兴趣照的权限。

**关键字段：**
- `status`: 1-待处理, 2-已通过, 3-已拒绝
- `next_request_time`: 下次可申请时间（拒绝后24小时冷却）

---

### 5. 其他支撑（6张表）

#### 5.1 system_configs - 系统配置表
存储系统级别的可配置参数，支持动态调整业务规则。

**关键字段：**
- `config_key`: 配置键（唯一）
- `config_value`: 配置值（存储为文本）
- `config_type`: 数据类型（int/float/string/boolean/json）
- `is_public`: 是否公开给前端

**预置配置项：**
```sql
-- 拆盒次数限制
daily_box_view_limit = 3           -- 普通用户每日拆盒次数
daily_box_view_limit_vip = 10      -- 会员每日拆盒次数

-- 费用配置
box_deposit_amount = 100.00        -- 发盒保证金（元）
box_anti_flake_fee = 50.00         -- 拆盒防鸽费（元）

-- 履约配置
checkin_radius_meters = 300        -- 打卡有效范围（米）
checkin_before_hours = 3           -- 打卡开始时间（活动前N小时）
checkin_after_hours = 2            -- 打卡结束时间（活动后N小时）
qrcode_valid_hours = 24            -- 见面码有效期（小时）

-- 其他配置
chat_destroy_hours = 2             -- 聊天记录销毁时间（活动结束后N小时）
max_follow_count = 12              -- 会员最大关注人数
voucher_valid_days = 7             -- 发盒凭证有效期（天）
appeal_timeout_hours = 24          -- 申诉提交时限（小时）
profile_view_cooldown_hours = 24   -- 资料查看申请被拒冷却时间（小时）
```

**使用示例：**
```sql
-- 读取配置
SELECT config_value FROM system_configs WHERE config_key = 'daily_box_view_limit';

-- 更新配置
UPDATE system_configs SET config_value = '5' WHERE config_key = 'daily_box_view_limit';
```

#### 5.2 box_vouchers - 发盒凭证表
管理发盒凭证的生成、分发和核销。

**关键字段：**
- `voucher_code`: 凭证码（6位大写字母+数字）
- `owner_user_id`: 归属人ID（种子用户）
- `used_by`: 使用者ID
- `valid_until`: 有效期（7天）

#### 5.3 deposits - 保证金/防鸽费记录表
记录所有资金流水。

**关键字段：**
- `type`: 1-缴纳, 2-退还, 3-扣除, 4-补偿
- `deposit_type`: 1-发盒保证金, 2-拆盒防鸽费

#### 5.4 appointment_appeals - 履约申诉表
处理"已打卡但未完成核销"场景的申诉。

#### 5.5 notifications - 系统通知表
存储所有系统通知（11类通知触点）。

#### 5.6 admins - 管理员表
后台管理员账户。

---

## 核心业务流程

### 流程0：拆盒次数限制检查

```sql
-- 用户点击盲盒卡片，进入拆盒流程

-- 1. 检查是否拆过此盲盒（重复查看不扣次数）
SELECT COUNT(*) as already_viewed
FROM box_views
WHERE box_id = ? AND viewer_id = ?;

IF already_viewed > 0 THEN
    -- 已拆过此盲盒，直接显示，不扣次数
    RETURN SHOW_BOX_DETAIL;
END IF;

-- 2. 首次拆此盲盒，检查今日剩余次数
SELECT IFNULL(view_count, 0) as used_count
FROM daily_box_view_stats
WHERE user_id = ? AND stat_date = CURDATE();

-- 3. 获取用户限制
SELECT is_member FROM users WHERE id = ?;
limit = is_member ? 10 : 3;  -- 会员10次，普通3次

-- 4. 判断是否超限
IF used_count >= limit THEN
    RETURN ERROR('今日拆盒次数已用完，明天再来吧！');
END IF;

-- 5. 允许拆盒，记录到 box_views
INSERT INTO box_views (box_id, viewer_id)
VALUES (?, ?);

-- 6. 更新今日统计（+1）
INSERT INTO daily_box_view_stats (user_id, stat_date, view_count)
VALUES (?, CURDATE(), 1)
ON DUPLICATE KEY UPDATE view_count = view_count + 1;

-- 7. 更新盲盒浏览数
UPDATE blind_boxes
SET view_count = view_count + 1
WHERE id = ?;

-- 8. 显示盲盒详情
RETURN SHOW_BOX_DETAIL;
```

### 流程1：发盒 → 报名 → 锁定

```sql
-- 1. 发盒者创建盲盒
INSERT INTO blind_boxes (creator_id, title, max_participants, ...)
VALUES (发盒者ID, '一起看展', 3, ...);

-- 2. 多人报名
INSERT INTO box_applications (box_id, applicant_id, anti_flake_fee, ...)
VALUES (盲盒ID, A的ID, 50, ...);

INSERT INTO box_applications (box_id, applicant_id, anti_flake_fee, ...)
VALUES (盲盒ID, B的ID, 50, ...);

-- 3. 发盒者锁定A和B
UPDATE box_applications
SET is_locked = 1, status = 2, locked_at = NOW()
WHERE box_id = 盲盒ID AND applicant_id IN (A的ID, B的ID);

UPDATE blind_boxes
SET current_participants = 2
WHERE id = 盲盒ID;
```

### 流程2：打卡 → 生成见面码 → 双向扫码

```sql
-- 4. 发盒者打卡
INSERT INTO checkins (box_id, user_id, checkin_latitude, checkin_longitude, ...)
VALUES (盲盒ID, 发盒者ID, ...);

-- 5. 生成见面码（发盒者+每个拆盒者）
INSERT INTO meeting_codes (box_id, user_id, role, qr_code, ...)
VALUES (盲盒ID, 发盒者ID, 1, 'CODE_001', ...),
       (盲盒ID, A的ID, 2, 'CODE_002', ...),
       (盲盒ID, B的ID, 2, 'CODE_003', ...);

-- 6. 发盒者扫描A的码
INSERT INTO meeting_verifications (box_id, scanner_id, scanned_id, qr_code, ...)
VALUES (盲盒ID, 发盒者ID, A的ID, 'CODE_002', ...);

-- 7. A扫描发盒者的码
INSERT INTO meeting_verifications (box_id, scanner_id, scanned_id, qr_code, ...)
VALUES (盲盒ID, A的ID, 发盒者ID, 'CODE_001', ...);

-- 8. 履约判定（定时任务）
UPDATE box_applications
SET fulfill_status = 1, deposit_status = 2  -- 完美履约，退还防鸽费
WHERE box_id = 盲盒ID AND applicant_id = A的ID;
```

---

## 关键查询示例

### 查询某个盲盒的所有被锁定的拆盒者
```sql
SELECT u.*, ba.locked_at, ba.anti_flake_fee
FROM box_applications ba
JOIN users u ON ba.applicant_id = u.id
WHERE ba.box_id = ?
  AND ba.is_locked = 1
ORDER BY ba.locked_at;
```

### 查询某个用户作为拆盒者的履约情况
```sql
SELECT
    bb.title,
    ba.status,
    CASE
        WHEN c.id IS NOT NULL THEN '已打卡'
        ELSE '未打卡'
    END as checkin_status,
    (
        SELECT COUNT(*)
        FROM meeting_verifications mv
        WHERE mv.box_id = ba.box_id
          AND ((mv.scanner_id = bb.creator_id AND mv.scanned_id = ba.applicant_id)
               OR (mv.scanner_id = ba.applicant_id AND mv.scanned_id = bb.creator_id))
          AND mv.is_valid = 1
    ) as scan_count,
    ba.fulfill_status,
    ba.deposit_status
FROM box_applications ba
JOIN blind_boxes bb ON ba.box_id = bb.id
LEFT JOIN checkins c ON c.box_id = ba.box_id AND c.user_id = ba.applicant_id
WHERE ba.applicant_id = ?
  AND ba.is_locked = 1
ORDER BY bb.meeting_time DESC;
```

### 查询发盒者需要扫描的剩余拆盒者
```sql
SELECT
    u.nickname,
    mc.qr_code,
    mc.is_scanned
FROM box_applications ba
JOIN users u ON ba.applicant_id = u.id
LEFT JOIN meeting_codes mc ON mc.box_id = ba.box_id AND mc.user_id = ba.applicant_id
WHERE ba.box_id = ?
  AND ba.is_locked = 1
  AND (mc.is_scanned = 0 OR mc.is_scanned IS NULL)
ORDER BY ba.locked_at;
```

### 统计某个盲盒的履约完成度
```sql
SELECT
    bb.title,
    bb.current_participants as total_locked,
    SUM(CASE WHEN ba.fulfill_status = 1 THEN 1 ELSE 0 END) as fulfilled_count,
    SUM(CASE WHEN ba.fulfill_status = 2 THEN 1 ELSE 0 END) as failed_count
FROM blind_boxes bb
LEFT JOIN box_applications ba ON bb.id = ba.box_id AND ba.is_locked = 1
WHERE bb.id = ?
GROUP BY bb.id;
```

---

## 履约判定逻辑

### 判定条件

对于每个被锁定的拆盒者，需要检查：

1. **打卡状态**：`checkins` 表是否有记录
2. **双向扫码状态**：`meeting_verifications` 表是否有2条记录

### 判定结果

| 发盒者打卡 | 拆盒者打卡 | 双向扫码 | 判定结果 | 资金处理 |
|---------|---------|--------|---------|---------|
| ✅ | ✅ | ✅ | 完美履约 | 双方费用退还 |
| ✅ | ❌ | - | 拆盒者失约 | 扣拆盒者防鸽费，50%给发盒者，50%平台 |
| ❌ | ✅ | - | 发盒者失约 | 扣发盒者保证金，50%给拆盒者，50%平台 |
| ❌ | ❌ | - | 双方失约 | 双方费用都扣除，归平台 |
| ✅ | ✅ | ❌ | 已打卡未核销 | 默认双方失约，但可申诉 |

---

## 数据库优化建议

### 1. 索引策略
- 已对所有外键创建索引
- 对高频查询字段创建联合索引
- 定期分析慢查询日志

### 2. 分区策略（可选）
- `chat_messages` 表可按月分区
- `notifications` 表可按月分区

### 3. 定时任务

#### 每日零点任务
```sql
-- 任务: 清理30天前的拆盒统计记录
DELETE FROM daily_box_view_stats
WHERE stat_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- 注意：box_views 表永久保留，不按日期清理
-- 因为需要判断用户是否拆过某个盲盒（不限日期）
```

#### 每小时任务
```sql
-- 检查过期的盲盒，更新状态
UPDATE blind_boxes
SET status = 4
WHERE status = 1
  AND expired_at < NOW();
```

#### 履约窗口结束后任务
```sql
-- 在打卡结束时间过后，执行履约判定
-- 查询需要判定的盲盒
SELECT id FROM blind_boxes
WHERE status IN (1, 2)
  AND checkin_end_time < NOW()
  AND checkin_end_time > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- 对每个盲盒执行履约判定逻辑...
```

#### 活动结束2小时后任务
```sql
-- 销毁聊天记录
DELETE FROM chat_messages
WHERE session_id IN (
    SELECT id FROM chat_sessions
    WHERE destroy_at < NOW()
);

DELETE FROM chat_sessions
WHERE destroy_at < NOW();
```

### 4. 数据备份
- 每日全量备份
- 每小时增量备份
- 保留30天备份数据

---

## 安全考虑

1. **防止SQL注入**：使用参数化查询
2. **密码加密**：使用bcrypt或argon2
3. **敏感数据加密**：手机号、地址等
4. **访问控制**：基于角色的权限管理
5. **日志审计**：记录所有敏感操作

---

## 部署说明

### 创建数据库

```bash
mysql -u root -p

CREATE DATABASE manghe_dating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE manghe_dating;

SOURCE /path/to/schema.sql;
```

### 验证表创建

```sql
SHOW TABLES;

-- 应该显示15张表
```

### 创建数据库用户

```sql
CREATE USER 'manghe_app'@'localhost' IDENTIFIED BY 'strong_password_here';

GRANT SELECT, INSERT, UPDATE, DELETE ON manghe_dating.* TO 'manghe_app'@'localhost';

FLUSH PRIVILEGES;
```

---

## 版本历史

- **v1.0** (2025-01-09): 初始版本，支持一对多约会模式
