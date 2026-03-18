# 已完成功能进度

> 本文件被 CLAUDE.md 引用，记录所有已实现的功能、文件路径和 API 接口，方便续接开发。

---

## 已完成模块

### 1. 认证模块
**API**
- `POST /api/register` — 注册（手机号+密码，自动生成"用户XXXX"昵称）
- `POST /api/login` — 登录（返回 Sanctum token）
- `POST /api/dev/login-as` — 开发调试：指定 user_id 登录
- `POST /api/logout` — 登出
- `GET /api/me` — 当前用户基础信息

**前端**
- `/login` — `app/login/page.tsx`
- `/register` — `app/register/page.tsx` — Step1：头像/昵称/生日/身高/城市/性别
- `/register/preferences` — Step2：约会目的/目标性别/年龄偏好
- `/register/interests` — Step3：关于我/兴趣标签/生活照
- `/register/success` — 注册成功页
- `lib/auth-context.tsx` — AuthProvider + useAuth hook
- `lib/api/auth.ts` — 登录/注册/登出方法
- `app/(app)/layout.tsx` — 新用户检测（nickname 为 `^用户\d{4}$`）→ 自动跳转 `/register`

---

### 2. 首页盲盒广场
**API**
- `GET /api/blind-boxes` — 盲盒列表（支持 city/district/fee_type/category/sort/page）
- `GET /api/me/daily-views` — 查询今日拆盒配额（普通 3 次/会员 10 次）
- `GET /api/following/blind-boxes` — 我关注的人的盲盒（会员专属，按发盒者分组）

**后端文件**
- `backend/app/Http/Controllers/Api/BlindBoxController.php`
  - `index()` — 列表
  - `recordView()` — 记录拆盒，扣减每日配额，重复不扣
  - `followingBoxes()` — 关注者盲盒，按 creator_id 分组
- `backend/app/Http/Controllers/Api/MeController.php`
  - `dailyViews()` — 读 SystemConfig + DailyBoxViewStat，返回 used/limit/remaining
- `backend/app/Http/Resources/BlindBoxResource.php`

**前端文件**
- `frontend/app/(app)/page.tsx`
  - 渐变 header + 拆盒次数徽章（接真实 API）
  - 双 Tab：盲盒广场（列表+筛选）/ 我关注的（创作者分组横向盒子卡）
  - 非会员访问"我关注的"显示 🔒 提示
- `frontend/components/blind-box-card.tsx` — 盲盒卡片
- `frontend/lib/api/blind-boxes.ts`
  - `getBlindBoxes()`, `getBlindBox()`, `getFollowingBoxes()`
  - `unpublishBlindBox()`, `getProfileViewRequest()`, `requestProfileView()`
  - `getPendingProfileViewRequests()`, `processProfileViewRequest()`
  - `FollowingCreatorGroup`, `ProfileViewRequestStatus`, `PendingProfileViewRequest` 类型

---

### 3. 盲盒详情页
**API**
- `GET /api/blind-boxes/{id}` — 含 creator.profile
- `POST /api/blind-boxes/{id}/view` — 记录拆盒（配额扣减）
- `GET /api/users/{id}/follow` — 关注状态
- `POST /api/users/{id}/follow` — 关注
- `DELETE /api/users/{id}/follow` — 取关
- `POST /api/blind-boxes/{id}/apply` — 报名（创建 box_application）
- `GET /api/blind-boxes/{id}/profile-view-request` — 查询相册申请状态
- `POST /api/blind-boxes/{id}/profile-view-request` — 申请查看相册

**前端文件**
- `frontend/app/(app)/blind-box/[id]/page.tsx`
  - 创建者 Hero 区 + 关注按钮
  - 约会计划 / 特质 / 关于我 / 兴趣 / 兴趣相册
  - 相册状态：未申请→弹窗申请 / 申请中→灰字提示 / 已通过→"已解锁 ✓"
  - 防鸽费支付弹窗（仿微信支付）→ 报名成功结果页
  - 聊天底部弹窗（一句话盲聊，含盲盒信息系统卡片）
  - 底部栏多状态：去赴约 / 已报名 / 已匹配 / 已下架

---

### 4. 聊天功能
**API**
- `POST /api/chat/sessions` — 获取或创建会话
- `GET /api/chat/sessions` — 会话列表（含 is_creator 标记）
- `GET /api/chat/{sessionId}/messages` — 历史消息
- `POST /api/chat/{sessionId}/messages` — 发送消息

**后端文件**
- `backend/app/Http/Controllers/Api/ChatController.php`

**前端文件**
- `frontend/lib/api/chat.ts` — ChatSession/ChatMessage 类型 + API 方法
- 聊天底部弹窗内嵌在详情页
- 消息中心详情页 `/messages/[id]` — `app/(app)/messages/[id]/page.tsx`

---

### 5. 发布盲盒流程
**API**
- `GET /api/publish/status` — 查询发布资格（价值观/保证金/凭证状态）
- `POST /api/value-test` — 提交价值观测试答案
- `POST /api/deposit` — 缴纳保证金
- `POST /api/vouchers/redeem` — 核销发盒凭证
- `POST /api/blind-boxes` — 发布盲盒
- `PUT /api/blind-boxes/{id}` — 编辑盲盒
- `DELETE /api/blind-boxes/{id}` — 下架盲盒

**后端文件**
- `PublishController`, `ValueTestController`, `DepositController`, `VoucherController`

**前端文件**
- `frontend/app/(publish)/` — 发布流程路由组（无底部 Tab）
  - `layout.tsx`, `page.tsx`（资格检查入口）
  - `value-test/page.tsx` — 引导 + 10 题测试 + 审核中/通过 结果页
  - `deposit/page.tsx` — 缴纳保证金
  - `voucher/page.tsx` — 6 位凭证核销弹窗
  - `create/page.tsx` — 填写盲盒内容
  - `preview/page.tsx` — 预览（拆盒者视角）
  - `success/page.tsx` — 发布成功

---

### 6. 约会页（消息中心）
**API**（同上聊天 + 下方报名 API）
- `GET /api/blind-boxes/{id}/applications` — 报名列表
- `POST /api/applications/{id}/lock` — 锁定报名者（其余自动拒绝）
- `POST /api/applications/{id}/reject` — 拒绝
- `GET /api/me/profile-view-requests` — 待处理相册查看申请（发盒者视角）
- `POST /api/profile-view-requests/{id}/approve` — 同意相册查看
- `POST /api/profile-view-requests/{id}/reject` — 拒绝相册查看

**后端文件**
- `ApplicationController.php`, `ProfileViewController.php`

**前端文件**
- `frontend/app/(app)/messages/page.tsx`
  - "我感兴趣"Tab：拆盒者会话列表
  - "我发的盒"Tab：按盒分组 + 报名者会话 + 相册申请处理区（同意/拒绝）
- `frontend/app/(app)/messages/[id]/page.tsx` — 聊天详情（含发盒者通过/拒绝操作）

---

### 7. 履约核销
**API**
- `GET /api/me/fulfillments` — 履约列表（拆盒者+发盒者双视角）
- `POST /api/checkins` — GPS 打卡（Haversine 300m 验证）
- `POST /api/meeting-codes` — 生成见面码（12 位随机，2h 有效）
- `POST /api/meeting-verifications` — 扫码核销（发盒者）
- `POST /api/appeals` — 提交申诉
- `POST /api/admin/settle-expired` — 手动触发结算（测试用）

**后端文件**
- `FulfillmentController.php` — 含 4 种结算场景逻辑

**前端文件**
- `frontend/app/(app)/profile/fulfillments/page.tsx`
  - 履约卡片：角色标签 / 结果徽章 / 打卡/生成码/扫码/申诉 操作
  - GPS 打卡弹窗 / QR 码展示弹窗 / 扫码输入弹窗 / 申诉弹窗
- `frontend/lib/api/fulfillment.ts`

---

### 8. 我的页面
**API**
- `GET /api/me/profile` — 完整个人资料（含 profile 子表）
- `PUT /api/profile` — 更新个人信息（user + user_profiles 表）
- `GET /api/me/blind-boxes` — 我发布的盲盒列表
- `GET /api/me/following` — 我关注的用户
- `GET /api/me/vouchers` — 可用凭证数量
- `GET /api/me/daily-views` — 今日拆盒配额

**前端文件**
- `frontend/app/(app)/profile/page.tsx` — 个人中心主页
- `frontend/app/(app)/profile/edit/page.tsx` — 编辑个人信息
- `frontend/app/(app)/profile/vouchers/page.tsx` — 发盒凭证
- `frontend/app/(app)/profile/fulfillments/page.tsx` — 履约记录（见模块七）
- `frontend/app/(app)/profile/my-boxes/page.tsx` — 发盒记录
- `frontend/app/(app)/profile/following/page.tsx` — 关注的 TA（VIP 专属）
- `frontend/lib/api/me.ts` — MyProfile/MyBlindBox/FollowingUser 类型 + 所有 API 方法

---

## 路由结构
```
/                          首页广场
/blind-box/[id]            盲盒详情
/messages                  消息中心（我感兴趣/我发的盒）
/messages/[id]             聊天详情
/profile                   个人中心
/profile/edit              编辑资料
/profile/vouchers          发盒凭证
/profile/fulfillments      履约记录
/profile/my-boxes          发盒记录
/profile/following         关注的 TA
/publish                   发布入口（资格检查）
/publish/value-test        价值观测试
/publish/deposit           缴纳保证金
/publish/voucher           凭证核销
/publish/create            填写盲盒内容
/publish/preview           预览
/publish/success           发布成功
/login                     登录
/register                  注册 Step1
/register/preferences      注册 Step2
/register/interests        注册 Step3
/register/success          注册成功
```

---

## 主题 & 设计规范
- 主品牌色：`#E8373F`（红/珊瑚色）
- 背景渐变：`linear-gradient(160deg, #FFE8E0, #FFF0E8, #F5F5F5)`
- 主操作按钮：`bg-gray-900 text-white rounded-full`
- 页面背景：`#F5F5F5`
- 卡片：`bg-white rounded-2xl shadow-sm`
- 移动端最大宽度：480px 居中
- 设计稿目录：`ziliao/pages/`
