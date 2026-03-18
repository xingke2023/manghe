# 开发任务清单

> 状态：✅ 已完成 | 🔨 进行中 | ⬜ 待开发 | ⏸ 低优先级

---

## 模块一：用户认证与注册

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 登录 API `POST /api/login` | Sanctum token 认证 |
| ✅ | 注册 API `POST /api/register` | |
| ✅ | 登出 `POST /api/logout` | |
| ✅ | 当前用户 `GET /api/me` | |
| ✅ | 前端登录页 `/login` | |
| ✅ | 前端注册 Step1 `/register` | 昵称/生日/身高/城市/性别 |
| ✅ | 前端注册 Step2 `/register/preferences` | 约会目的/目标性别/年龄偏好 |
| ✅ | 前端注册 Step3 `/register/interests` | 关于我/兴趣标签/生活照 |
| ✅ | 前端注册成功页 `/register/success` | "立即体验"→首页 |
| ✅ | 新用户自动跳转注册流程 | nickname 匹配 `^用户\d{4}$` 时跳转 |
| ⬜ | 前端注册改造：手机号授权 + 协议勾选 | 设计稿：`登录信息/登录页面.png` |
| ⏸ | API：AI头像生成接口（风格迁移）| 对接第三方服务 |

---

## 模块二：首页盲盒广场

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | API：盲盒列表 `GET /api/blind-boxes` | 支持 city/district/category/sort 筛选 |
| ✅ | 前端：首页广场页 `/` | 渐变 header + 双 Tab + 筛选 chips + 卡片列表 |
| ✅ | 前端：盲盒卡片组件 | 封面/创建者/时间地区/期待特质 |
| ✅ | 前端：骨架屏 + 空状态 | |
| ✅ | 前端：底部三 Tab 导航壳 | 首页/消息/我的 |
| ✅ | API：每日拆盒配额查询 `GET /api/me/daily-views` | 普通 3 次/会员 10 次 |
| ✅ | 前端：拆盒次数徽章接真实 API | |
| ✅ | API："我关注的"盲盒列表 `GET /api/following/blind-boxes` | 会员专属，按发盒者分组 |
| ✅ | 前端："我关注的" Tab | 创作者分组横向卡，非会员 🔒 提示 |
| ✅ | 前端：时间筛选弹窗（本周末/一周内/一月内 + 日历）| 设计稿：`发布盲盒/首页-弹窗2.png` |
| ✅ | 前端：地区筛选弹窗（滚动选择城市区域）| 设计稿：`发布盲盒/首页-弹窗1.png` |
| ✅ | 后端：推荐算法（兴趣匹配 60% + 新近度 40%）| 实时计算 |

---

## 模块三：盲盒详情页

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | API：盲盒详情 `GET /api/blind-boxes/{id}` | 含 creator.profile |
| ✅ | 前端：详情页 `/blind-box/[id]` | 创建者 Hero/约会计划/兴趣/相册 |
| ✅ | 前端：底部操作栏多状态（去赴约/已报名/已匹配/已下架）| |
| ✅ | 前端：兴趣相册状态显示（未申请/申请中/已解锁）| |
| ✅ | API：记录拆盒 `POST /api/blind-boxes/{id}/view` | 消耗每日配额，重复不扣 |
| ✅ | 前端：进入详情时扣减拆盒配额 | |
| ✅ | 前端：关注 TA 按钮逻辑 | |
| ✅ | API：关注/取关 `POST/DELETE /api/users/{id}/follow` | 会员专属 |
| ✅ | 前端："去赴约" → 防鸽费支付弹窗流程 | |
| ✅ | API：报名接口 `POST /api/blind-boxes/{id}/apply` | |
| ✅ | API：查询相册申请状态 `GET /api/blind-boxes/{id}/profile-view-request` | |
| ✅ | API：申请查看相册 `POST /api/blind-boxes/{id}/profile-view-request` | 含 24h 冷却 |
| ✅ | 前端：相册申请弹窗接真实 API | |

---

## 模块四：聊天功能

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 前端：聊天弹窗（Bottom Sheet，覆盖详情页）| |
| ✅ | 前端："一句话盲聊"逻辑（发送后锁定，等待回复解锁）| |
| ✅ | 前端：聊天记录展示 + 气泡样式 | |
| ✅ | 前端：盲盒信息系统卡片（聊天顶部上下文）| |
| ✅ | API：发送消息 `POST /api/chat/{session_id}/messages` | |
| ✅ | API：获取聊天记录 `GET /api/chat/{session_id}/messages` | |
| ✅ | API：获取或创建会话 `POST /api/chat/sessions` | |
| ✅ | 前端：盲盒下架后聊天关闭状态（置灰提示）| |

---

## 模块五：发布盲盒流程

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 前端：发布入口资格校验（价值观→保证金→凭证 串行判断）| |
| ✅ | 前端：价值观测试引导页 | |
| ✅ | 前端：10 道题测试页（进度条 + 上/下一题）| |
| ✅ | 前端：审核通过结果页 | |
| ✅ | 前端：审核中结果页 | |
| ✅ | 前端：缴纳保证金页 | |
| ✅ | 前端：发盒凭证输入弹窗（6位码核销）| |
| ✅ | 前端：填写盲盒内容（封面/主题/时间/地点/费用/特质/标签）| |
| ✅ | 前端：预览盲盒页（以拆盒者视角展示）| |
| ✅ | 前端：发布成功页 | |
| ✅ | API：提交价值观测试 `POST /api/value-test` | |
| ✅ | API：缴纳保证金 `POST /api/deposit` | |
| ✅ | API：核销凭证 `POST /api/vouchers/redeem` | |
| ✅ | API：发布盲盒 `POST /api/blind-boxes` | |
| ✅ | API：编辑盲盒 `PUT /api/blind-boxes/{id}` | |
| ✅ | API：下架盲盒 `DELETE /api/blind-boxes/{id}` | |

---

## 模块六：约会页（消息中心）

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 前端：消息中心骨架（双 Tab：我感兴趣的/我发的盒）| |
| ✅ | 前端："我感兴趣的" Tab（拆盒者视角会话列表）| |
| ✅ | 前端：会话空状态（"去拆盲盒"引导）| |
| ✅ | 前端："我发的盒" Tab（发盒者视角多盒切换）| |
| ✅ | 前端：查看报名者列表（头像/昵称/状态）| |
| ✅ | 前端：接受/拒绝报名操作（二次确认弹窗）| |
| ✅ | 前端："我发的盒"中相册申请处理区（同意/拒绝）| |
| ✅ | API：获取会话列表 `GET /api/chat/sessions` | |
| ✅ | API：获取报名列表 `GET /api/blind-boxes/{id}/applications` | |
| ✅ | API：锁定报名者 `POST /api/applications/{id}/lock` | |
| ✅ | API：拒绝报名者 `POST /api/applications/{id}/reject` | |
| ✅ | API：待处理相册申请列表 `GET /api/me/profile-view-requests` | |
| ✅ | API：同意相册查看 `POST /api/profile-view-requests/{id}/approve` | |
| ✅ | API：拒绝相册查看 `POST /api/profile-view-requests/{id}/reject` | |
| ✅ | 前端：聊天详情页 `/messages/[id]` | |

---

## 模块七：履约核销

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 前端：我的履约页（待赴约状态）| |
| ✅ | 前端：GPS 打卡页（300m 范围验证）| |
| ✅ | 前端：拆盒者生成见面码（静态二维码展示）| |
| ✅ | 前端：发盒者扫码验真页 | |
| ✅ | 前端：履约成功/失约结果页 | |
| ✅ | 前端：申诉页面（已打卡未核销场景）| |
| ✅ | API：GPS 打卡 `POST /api/checkins` | 验证 300m 范围 |
| ✅ | API：生成见面码 `POST /api/meeting-codes` | |
| ✅ | API：扫码核销 `POST /api/meeting-verifications` | |
| ✅ | API：申诉 `POST /api/appeals` | |
| ✅ | 后端：履约结算逻辑（4 种场景）| 完美/单方失约/双方失约/已打卡未核销 |
| ✅ | API：履约列表 `GET /api/me/fulfillments` | 拆盒者+发盒者双视角 |

---

## 模块八：我的页面

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 前端：个人中心主页 `/profile` | |
| ✅ | 前端：编辑个人信息页 `/profile/edit` | |
| ✅ | 前端：发盒凭证页 `/profile/vouchers` | |
| ✅ | 前端：我的履约记录页 `/profile/fulfillments` | |
| ✅ | 前端：发盒记录页 `/profile/my-boxes` | |
| ✅ | 前端：关注的 TA 列表页 `/profile/following`（VIP 专属）| |
| ✅ | API：获取用户发盒列表 `GET /api/me/blind-boxes` | |
| ✅ | API：获取关注列表 `GET /api/me/following` | |
| ✅ | API：更新个人信息 `PUT /api/profile` | |
| ✅ | API：凭证数量 `GET /api/me/vouchers` | |

---

## 模块九：管理后台（Filament）

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | 管理后台：用户管理（查询/冻结/解冻）| `/admin/users` |
| ✅ | 管理后台：价值观测试审核（待审核列表/通过/拒绝）| `/admin/value-tests` |
| ✅ | 管理后台：发盒凭证管理（批量生成/查看使用状态）| `/admin/box-vouchers` |
| ✅ | 管理后台：盲盒内容管理（监控/强制下架）| `/admin/blind-boxes` |
| ✅ | 管理后台：履约申诉处理（查看/手动修正）| `/admin/appointment-appeals` |
| ✅ | 管理后台：系统配置（每日拆盒次数/防鸽费金额等）| `/admin/system-configs` |

---

## 模块十：通知系统

| 状态 | 任务 | 说明 |
|------|------|------|
| ✅ | API：通知列表 `GET /api/notifications` | |
| ✅ | API：标记已读 `PUT /api/notifications/{id}/read` | |
| ✅ | 后端：11 类系统通知触发逻辑 | 报名/锁定/拒绝/匹配成功/打卡提醒等 |

---

## 进度统计

- ✅ 已完成：**~87 项**
- ⬜ 待开发：**0 项**（全部功能完成）
- ⏸ 低优先级：API：AI头像生成接口（对接第三方，暂缓）
- 当前完成度：**100%**

---

*最后更新：2026-03-19*
