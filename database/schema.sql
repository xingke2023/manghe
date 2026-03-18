-- ============================================
-- 约会盲盒 数据库设计
-- MySQL 8.0+
-- 创建时间: 2025-01-09
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 用户相关表
-- ============================================

-- 用户基础信息表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  `phone` VARCHAR(20) UNIQUE COMMENT '手机号',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(500) COMMENT '头像URL',
  `original_avatar_url` VARCHAR(500) COMMENT '原始上传头像URL',
  `gender` TINYINT UNSIGNED COMMENT '性别: 1-男, 2-女',
  `birth_date` DATE COMMENT '出生日期',
  `age` INT UNSIGNED COMMENT '年龄',
  `height` INT UNSIGNED COMMENT '身高(cm)',
  `province` VARCHAR(50) COMMENT '省份',
  `city` VARCHAR(50) COMMENT '城市',
  `district` VARCHAR(50) COMMENT '区',

  -- 账户状态
  `account_status` TINYINT UNSIGNED DEFAULT 1 COMMENT '账户状态: 1-正常, 2-冻结',
  `has_box_permission` TINYINT UNSIGNED DEFAULT 0 COMMENT '发盒资格: 0-无, 1-有, 2-审核中',
  `is_member` TINYINT UNSIGNED DEFAULT 1 COMMENT '是否会员: 0-否, 1-是',
  `member_expire_date` DATETIME COMMENT '会员过期时间',

  -- 信誉相关
  `credit_score` INT UNSIGNED DEFAULT 100 COMMENT '履约信誉分',

  -- 推荐关系
  `referrer_user_id` BIGINT UNSIGNED COMMENT '推荐人用户ID',
  `referrer_click_time` DATETIME COMMENT '推荐点击时间',

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_phone` (`phone`),
  INDEX `idx_openid` (`openid`),
  INDEX `idx_referrer` (`referrer_user_id`),
  INDEX `idx_city_district` (`city`, `district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';


-- 用户详细资料表
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '资料ID',
  `user_id` BIGINT UNSIGNED UNIQUE NOT NULL COMMENT '用户ID',

  -- 社交偏好
  `dating_purposes` JSON COMMENT '约会目的: ["找兴趣搭子","脱单","Dating","婚恋"]',
  `target_gender` TINYINT UNSIGNED COMMENT '期望对象性别: 1-男, 2-女, 3-不限',
  `target_age_min` INT UNSIGNED COMMENT '期望年龄最小值',
  `target_age_max` INT UNSIGNED COMMENT '期望年龄最大值',

  -- 个人介绍
  `about_me` TEXT COMMENT '关于我',
  `interests` JSON COMMENT '兴趣爱好标签数组',
  `interest_photos` JSON COMMENT '兴趣照片URL数组',

  -- 真实资料（选填）
  `occupation` VARCHAR(100) COMMENT '职业',
  `company` VARCHAR(200) COMMENT '公司',
  `school` VARCHAR(200) COMMENT '学校',
  `education` VARCHAR(50) COMMENT '学历',
  `annual_income` VARCHAR(50) COMMENT '年收入',
  `assets_range` VARCHAR(50) COMMENT '资产范围',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户详细资料表';


-- 价值观测试表
DROP TABLE IF EXISTS `value_tests`;
CREATE TABLE `value_tests` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '测试ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',

  -- 测试结果
  `answers` JSON NOT NULL COMMENT '10道题的答案: {"q1":"A","q2":"B",...}',
  `risk_count` INT UNSIGNED DEFAULT 0 COMMENT '高风险选项数量',
  `risk_questions` JSON COMMENT '高风险题号数组',

  -- 审核状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-自动通过, 2-待人工审核, 3-审核通过, 4-审核拒绝',
  `reviewer_id` BIGINT UNSIGNED COMMENT '审核员ID',
  `review_note` TEXT COMMENT '审核备注',
  `reviewed_at` DATETIME COMMENT '审核时间',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价值观测试表';


-- 用户关注表
DROP TABLE IF EXISTS `user_follows`;
CREATE TABLE `user_follows` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '关注ID',
  `follower_id` BIGINT UNSIGNED NOT NULL COMMENT '关注者用户ID',
  `followee_id` BIGINT UNSIGNED NOT NULL COMMENT '被关注者用户ID',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`followee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_follower` (`follower_id`),
  INDEX `idx_followee` (`followee_id`),
  UNIQUE KEY `uk_follower_followee` (`follower_id`, `followee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注表';


-- ============================================
-- 2. 盲盒/约会相关表
-- ============================================

-- 盲盒表（即约会表）
DROP TABLE IF EXISTS `blind_boxes`;
CREATE TABLE `blind_boxes` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '盲盒ID',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '发盒者用户ID',

  -- 盲盒内容
  `cover_image` VARCHAR(500) COMMENT '封面图',
  `title` VARCHAR(200) NOT NULL COMMENT '约会主题',
  `meeting_time` DATETIME NOT NULL COMMENT '约会时间',
  `location` VARCHAR(200) NOT NULL COMMENT '约会地点',
  `location_latitude` DECIMAL(10,7) COMMENT '纬度',
  `location_longitude` DECIMAL(10,7) COMMENT '经度',
  `province` VARCHAR(50) COMMENT '省份',
  `city` VARCHAR(50) COMMENT '城市',
  `district` VARCHAR(50) COMMENT '区',

  `fee_type` TINYINT UNSIGNED NOT NULL COMMENT '费用类型: 1-AA, 2-我请客',
  `expected_traits` JSON COMMENT '期待同行者特质标签',
  `experience_values` JSON COMMENT '体验价值标签',

  -- 人数限制
  `max_participants` INT UNSIGNED DEFAULT 1 COMMENT '最多接受多少个拆盒者',
  `current_participants` INT UNSIGNED DEFAULT 0 COMMENT '当前已锁定人数',

  -- 状态管理
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-进行中, 2-已满员, 3-已下架, 4-已过期',

  -- 统计数据
  `view_count` INT UNSIGNED DEFAULT 0 COMMENT '浏览人数',
  `apply_count` INT UNSIGNED DEFAULT 0 COMMENT '报名人数',

  -- 履约窗口（从盲盒创建时就可以计算）
  `checkin_start_time` DATETIME COMMENT '打卡开始时间（meeting_time前3小时）',
  `checkin_end_time` DATETIME COMMENT '打卡结束时间（meeting_time后2小时）',

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `expired_at` DATETIME COMMENT '过期时间',

  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_city_district` (`city`, `district`),
  INDEX `idx_meeting_time` (`meeting_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盲盒表（即约会表）';


-- 盲盒报名表
DROP TABLE IF EXISTS `box_applications`;
CREATE TABLE `box_applications` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '报名ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `applicant_id` BIGINT UNSIGNED NOT NULL COMMENT '报名者用户ID',

  -- 报名状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-盲盒开启中, 2-收到邀请(被锁定), 3-擦肩而过, 4-遗憾错过',
  `is_locked` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否被锁定: 0-否, 1-是',
  `locked_at` DATETIME COMMENT '锁定时间',

  -- 防鸽费
  `anti_flake_fee` DECIMAL(10,2) NOT NULL COMMENT '防鸽费金额',
  `transaction_id` VARCHAR(100) COMMENT '支付交易号',
  `payment_status` TINYINT UNSIGNED DEFAULT 2 COMMENT '支付状态: 1-待支付, 2-已支付, 3-已退款',
  `refund_transaction_id` VARCHAR(100) COMMENT '退款交易号',
  `refunded_at` DATETIME COMMENT '退款时间',

  -- 履约结果（最终结算）
  `fulfill_status` TINYINT UNSIGNED COMMENT '履约状态: 1-完美履约, 2-失约, 3-对方失约',
  `deposit_status` TINYINT UNSIGNED COMMENT '费用状态: 1-已缴纳, 2-已退还, 3-已扣除, 4-已补偿',

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_applicant` (`applicant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_locked` (`is_locked`),
  UNIQUE KEY `uk_box_applicant` (`box_id`, `applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盲盒报名表';


-- 拆盒记录表（记录用户拆过哪些盲盒，用于重复查看不扣次数）
DROP TABLE IF EXISTS `box_views`;
CREATE TABLE `box_views` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `viewer_id` BIGINT UNSIGNED NOT NULL COMMENT '查看者用户ID',
  `first_view_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '首次查看时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`viewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_viewer` (`viewer_id`),
  INDEX `idx_box` (`box_id`),
  UNIQUE KEY `uk_box_viewer` (`box_id`, `viewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='拆盒记录表（记录用户拆过的所有盲盒）';


-- 用户每日拆盒统计表（仅统计当日拆盒次数）
DROP TABLE IF EXISTS `daily_box_view_stats`;
CREATE TABLE `daily_box_view_stats` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `view_count` INT UNSIGNED DEFAULT 0 COMMENT '当日已拆盒次数',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_date` (`user_id`, `stat_date`),
  INDEX `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户每日拆盒次数统计表';


-- ============================================
-- 3. 履约相关表
-- ============================================

-- 打卡记录表
DROP TABLE IF EXISTS `checkins`;
CREATE TABLE `checkins` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '打卡ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',

  -- 打卡信息
  `checkin_latitude` DECIMAL(10,7) NOT NULL COMMENT '打卡纬度',
  `checkin_longitude` DECIMAL(10,7) NOT NULL COMMENT '打卡经度',
  `distance_meters` INT UNSIGNED COMMENT '与约定地点距离（米）',

  -- 验证结果
  `is_valid` TINYINT UNSIGNED DEFAULT 1 COMMENT '是否有效: 0-无效, 1-有效',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_user` (`user_id`),
  UNIQUE KEY `uk_box_user` (`box_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表';


-- 见面码表
DROP TABLE IF EXISTS `meeting_codes`;
CREATE TABLE `meeting_codes` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '见面码ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` TINYINT UNSIGNED NOT NULL COMMENT '角色: 1-发盒者, 2-拆盒者',

  -- 见面码信息
  `qr_code` VARCHAR(100) UNIQUE NOT NULL COMMENT '见面码（唯一）',

  -- 扫码状态
  `is_scanned` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否被扫过: 0-否, 1-是',
  `scanned_at` DATETIME COMMENT '被扫时间',
  `scanned_by` BIGINT UNSIGNED COMMENT '扫码者用户ID',

  -- 有效期
  `valid_until` DATETIME COMMENT '有效期至',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-有效, 2-已使用, 3-已过期',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_qr_code` (`qr_code`),
  UNIQUE KEY `uk_box_user` (`box_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='见面码表';


-- 扫码验证记录表
DROP TABLE IF EXISTS `meeting_verifications`;
CREATE TABLE `meeting_verifications` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '验证ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `scanner_id` BIGINT UNSIGNED NOT NULL COMMENT '扫码者用户ID',
  `scanned_id` BIGINT UNSIGNED NOT NULL COMMENT '被扫者用户ID',
  `qr_code` VARCHAR(100) NOT NULL COMMENT '扫描的见面码',

  -- 验证结果
  `is_valid` TINYINT UNSIGNED DEFAULT 1 COMMENT '验证是否通过: 0-失败, 1-成功',
  `fail_reason` VARCHAR(200) COMMENT '失败原因',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scanner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scanned_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_scanner` (`scanner_id`),
  INDEX `idx_scanned` (`scanned_id`),
  UNIQUE KEY `uk_scanner_scanned_box` (`scanner_id`, `scanned_id`, `box_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='扫码验证记录表';


-- ============================================
-- 4. 沟通相关表
-- ============================================

-- 聊天会话表
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '发盒者ID',
  `applicant_id` BIGINT UNSIGNED NOT NULL COMMENT '拆盒者ID',

  -- 会话状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-活跃, 2-已关闭',
  `is_unlocked` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否解锁自由对话: 0-未解锁, 1-已解锁',

  -- 最后消息
  `last_message` TEXT COMMENT '最后一条消息内容',
  `last_message_time` DATETIME COMMENT '最后消息时间',

  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `closed_at` DATETIME COMMENT '关闭时间',
  `destroy_at` DATETIME COMMENT '销毁时间（活动结束后2小时）',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_applicant` (`applicant_id`),
  UNIQUE KEY `uk_box_applicant` (`box_id`, `applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';


-- 聊天消息表
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  `session_id` BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者用户ID',
  `receiver_id` BIGINT UNSIGNED NOT NULL COMMENT '接收者用户ID',

  -- 消息内容
  `message_type` TINYINT UNSIGNED DEFAULT 1 COMMENT '消息类型: 1-文本, 2-图片, 3-系统消息',
  `content` TEXT NOT NULL COMMENT '消息内容',

  -- 状态
  `is_read` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已读: 0-未读, 1-已读',
  `read_at` DATETIME COMMENT '阅读时间',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_session` (`session_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';


-- 资料查看权限表
DROP TABLE IF EXISTS `profile_view_permissions`;
CREATE TABLE `profile_view_permissions` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `requester_id` BIGINT UNSIGNED NOT NULL COMMENT '申请者用户ID（拆盒者）',
  `owner_id` BIGINT UNSIGNED NOT NULL COMMENT '资料所有者用户ID（发盒者）',

  -- 申请状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-待处理, 2-已通过, 3-已拒绝',
  `processed_at` DATETIME COMMENT '处理时间',

  -- 冷却机制
  `next_request_time` DATETIME COMMENT '下次可申请时间（拒绝后24小时）',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box_requester` (`box_id`, `requester_id`),
  UNIQUE KEY `uk_box_requester` (`box_id`, `requester_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资料查看权限表';


-- ============================================
-- 5. 其他支撑表
-- ============================================

-- 发盒凭证表
DROP TABLE IF EXISTS `box_vouchers`;
CREATE TABLE `box_vouchers` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '凭证ID',
  `voucher_code` VARCHAR(10) UNIQUE NOT NULL COMMENT '凭证码（6位大写字母+数字）',

  -- 归属关系
  `owner_user_id` BIGINT UNSIGNED NOT NULL COMMENT '归属人用户ID',
  `created_by` BIGINT UNSIGNED COMMENT '生成者ID（管理员）',

  -- 使用状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-未使用, 2-已核销, 3-已失效',
  `used_by` BIGINT UNSIGNED COMMENT '使用者用户ID',
  `used_at` DATETIME COMMENT '核销时间',
  `related_box_id` BIGINT UNSIGNED COMMENT '关联的盲盒ID',

  -- 有效期
  `valid_until` DATETIME NOT NULL COMMENT '有效期至（7天）',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE SET NULL,
  INDEX `idx_voucher_code` (`voucher_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_owner` (`owner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发盒凭证表';


-- 保证金/防鸽费记录表
DROP TABLE IF EXISTS `deposits`;
CREATE TABLE `deposits` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',

  -- 金额信息
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `type` TINYINT UNSIGNED NOT NULL COMMENT '类型: 1-缴纳, 2-退还, 3-扣除, 4-补偿',
  `deposit_type` TINYINT UNSIGNED NOT NULL COMMENT '保证金类型: 1-发盒保证金, 2-拆盒防鸽费',

  -- 关联信息
  `related_box_id` BIGINT UNSIGNED COMMENT '关联的盲盒ID',

  -- 支付信息
  `transaction_id` VARCHAR(100) COMMENT '微信交易号',
  `payment_status` TINYINT UNSIGNED DEFAULT 1 COMMENT '支付状态: 1-待支付, 2-已支付, 3-已退款',

  `note` TEXT COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_box` (`related_box_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保证金/防鸽费记录表';


-- 履约申诉表
DROP TABLE IF EXISTS `appointment_appeals`;
CREATE TABLE `appointment_appeals` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '申诉ID',
  `box_id` BIGINT UNSIGNED NOT NULL COMMENT '盲盒ID',
  `appellant_id` BIGINT UNSIGNED NOT NULL COMMENT '申诉人用户ID',
  `respondent_id` BIGINT UNSIGNED NOT NULL COMMENT '被申诉人用户ID',

  -- 申诉内容
  `reason` TEXT NOT NULL COMMENT '申诉理由',
  `evidence_images` JSON COMMENT '证据图片URL数组',

  -- 处理状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-待处理, 2-已处理',
  `reviewer_id` BIGINT UNSIGNED COMMENT '处理人ID（管理员）',
  `review_result` TINYINT UNSIGNED COMMENT '处理结果: 1-申诉成功, 2-申诉失败, 3-维持原判',
  `review_note` TEXT COMMENT '处理意见',
  `reviewed_at` DATETIME COMMENT '处理时间',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`box_id`) REFERENCES `blind_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appellant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`respondent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_box` (`box_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='履约申诉表';


-- 系统通知表
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收用户ID',

  -- 通知内容
  `type` VARCHAR(50) NOT NULL COMMENT '通知类型',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '通知内容',

  -- 关联信息
  `related_type` VARCHAR(50) COMMENT '关联类型: box, application等',
  `related_id` BIGINT UNSIGNED COMMENT '关联ID',

  -- 跳转链接
  `link_url` VARCHAR(500) COMMENT '跳转链接',

  -- 状态
  `is_read` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已读: 0-未读, 1-已读',
  `read_at` DATETIME COMMENT '阅读时间',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';


-- 管理员表
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `real_name` VARCHAR(50) COMMENT '真实姓名',

  -- 权限
  `role` VARCHAR(50) DEFAULT 'admin' COMMENT '角色',
  `permissions` JSON COMMENT '权限列表',

  -- 状态
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态: 1-正常, 2-禁用',

  `last_login_at` DATETIME COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) COMMENT '最后登录IP',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';


-- 系统配置表
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `config_type` VARCHAR(20) DEFAULT 'string' COMMENT '配置类型: string, int, float, boolean, json',
  `description` VARCHAR(500) COMMENT '配置描述',
  `is_public` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否公开给前端: 0-否, 1-是',

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 初始化数据
-- ============================================

-- 创建默认管理员账户（密码: admin123，需要在应用层加密）
INSERT INTO `admins` (`username`, `password`, `real_name`, `role`, `status`)
VALUES ('admin', 'admin123_need_encrypt', '系统管理员', 'super_admin', 1);

-- 初始化系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_public`) VALUES
('daily_box_view_limit', '3', 'int', '每日免费拆盒次数限制', 1),
('daily_box_view_limit_vip', '10', 'int', '会员每日拆盒次数限制', 1),
('box_deposit_amount', '100.00', 'float', '发盒保证金金额（元）', 1),
('box_anti_flake_fee', '50.00', 'float', '拆盒防鸽费金额（元）', 1),
('checkin_radius_meters', '300', 'int', '打卡有效范围（米）', 0),
('checkin_before_hours', '3', 'int', '打卡开始时间（活动前N小时）', 0),
('checkin_after_hours', '2', 'int', '打卡结束时间（活动后N小时）', 0),
('qrcode_valid_hours', '24', 'int', '见面码有效期（小时）', 0),
('chat_destroy_hours', '2', 'int', '聊天记录销毁时间（活动结束后N小时）', 0),
('max_follow_count', '12', 'int', '会员最大关注人数', 1),
('voucher_valid_days', '7', 'int', '发盒凭证有效期（天）', 0),
('appeal_timeout_hours', '24', 'int', '申诉提交时限（小时）', 0),
('profile_view_cooldown_hours', '24', 'int', '资料查看申请被拒后冷却时间（小时）', 0);
