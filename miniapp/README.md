# 约会盲盒 · 原生微信小程序

`mini/` 是 Taro 4.2 + React + Tailwind 版本；本目录是**纯原生**实现（WXML/WXSS/JS/JSON），
零编译步骤，用微信开发者工具直接导入 `miniapp/` 即可运行。两版功能对齐，互不依赖。

## 快速开始

```bash
# 1. 起后端
cd ../backend && php artisan serve --host=0.0.0.0 --port=8068

# 2. 微信开发者工具 → 导入项目 → 选择 miniapp/ 目录
#    appid 已写在 project.config.json：wx81855e163e189a51
```

`urlCheck` 已设为 `false`，否则请求 `localhost` 会被开发者工具按域名白名单拦掉。
换后端地址只改 `config.js` 里的 `API_BASE`。

## 目录结构

```
app.js / app.json / app.wxss   全局登录态、27 页路由与 tabBar、设计 token
config.js                      API 地址与轮询间隔
constants.js                   兴趣/体验价值/学历/收入等选项（逐字抄自 Taro 版）
utils/
  request.js   wx.request 的 Promise 封装 + 401 处理 + uploadFile
  auth.js      token/user 的 storage 读写
  format.js    时间、头像、地址、角标等纯函数
  media.js     选图 + 上传
  badge.js     消息 tab 未读角标轮询（30s）
api/           7 个模块，覆盖 44 个接口
components/    blind-box-card / avatar / empty-state / skeleton
styles/        跨页共享的 wxss 片段（@import 引入）
pages/         27 页，每页 index.{wxml,wxss,js,json}
tools/         校验与联调脚本（已在 packOptions.ignore 里排除，不进上传包）
```

## 校验

```bash
python3 tools/check.py         # JSON 合法性、app.json 与磁盘页面一致、tabBar 图标
python3 tools/check-deep.py    # require 路径、组件引用、WXML 事件有无对应 handler、花括号配对
node tools/test-format.js      # utils/format.js 的时间解析单测
node --check <file>            # 单个 JS 语法检查
python3 tools/smoke-api.py     # 登录后打一遍客户端用到的 GET 接口（需后端在跑）
python3 tools/inspect-shapes.py # 打印接口真实返回结构，核对字段名
```

## ⚠️ 后端接口契约里的坑

这些是实测踩出来的，改动相关页面前先看一眼。**Taro 版有几处正是踩在这里**。

### 1. 分页字段在 `meta` 里，不在顶层

`GET /blind-boxes` 返回 Laravel 标准资源分页 `{data, links, meta}`，
页码是 `meta.current_page` / `meta.last_page`。
Taro 版按顶层 `current_page` 读，拿到 `undefined`，所以它的翻页是坏的（永远显示"已经到底了"）。

### 2. 头像字段名不统一

| 接口 | 字段名 |
|---|---|
| `GET /blind-boxes/{id}/applications` → `applicant` | **`avatar`** |
| `GET /chat/sessions`、`GET /chat/{id}/messages` → `other_user` | **`avatar`** |
| 其余（`/me/following`、`/me/profile`、`/users/{id}/profile`、`followingBoxes` 的 `creator`） | `avatar_url` |

### 3. 时间字段三种格式混用

**已在服务端格式化成展示串**（没有年份，不可解析，直接渲染）：

| 接口 | 字段 | 形如 |
|---|---|---|
| `/blind-boxes/{id}/applications` | `created_at` | `3-7` |
| `/me/applications` | `created_at`、`blind_box.meeting_time` | `08-29 14:32` |
| `/me/blind-boxes`、`/me/fulfillments`、`followingBoxes` | `meeting_time` | `08-29 14:32` |
| `/chat/sessions` | `last_message_time` | `8-29` |
| `/me/profile` | `birth_date`、`member_expire_date` | `2026-08-29` |

**原始 ISO**（可解析）：`/me/vouchers` 的 `valid_until`/`used_at`（`+08:00` 偏移）、
通知与相册申请的 `created_at`/`next_request_time`（`.000000Z` 六位微秒）。

`utils/format.js` 的 `parseDate` 对这些都做了处理：要求以 4 位年份开头才解析，
微秒截成毫秒，带空格的 datetime 转 `/` 分隔。**不要**对 ISO 串做 `-`→`/` 替换。

### 4. `meeting_time_full` 是"把本地时间当 UTC"序列化的

真实约会时间 14:00 会变成 `2025-04-05T14:00:00.000000Z`。
墙上时间藏在 UTC 字段里，回填 picker 必须用 `getUTC*`，
用本地 getter 在东八区会多出 8 小时。见 `pages/blind-box/edit/index.js` 的 `splitMeetingTime`。

### 5. `/me/applications` 的嵌套键是 `blind_box`，不是 `box`

盲盒被删时该键为 `null`。

### 6. `/users/{id}/profile` 无权限时把 `interest_photos` 置为 `[]`

所以**无法**用 `photos.length` 区分"对方没有相册"和"相册被隐藏"，
只能按 `user.can_view_photos` 分支（该字段在 `user` 里，不在顶层）。

### 7. 消息体自带 `is_mine`

不用拿 `sender_id` 和本地缓存的 user id 比对。

### 8. 其它

- `fee_label` 后端给的是 `AA` / `TA请客`（发布预览页从发布者视角自己算 `AA制` / `我请客`）
- `/following/blind-boxes` 是会员专属，非会员返回 403，文案直接透出即可
- `/me/vouchers` 的券码字段叫 `code`（模型里是 `voucher_code`）
- `/me/fulfillments` 每项主键是 `application_id`；同一 `box_id` 可能出现两条（自己既是发盒者又是报名者），列表 key 不能只用 `box_id`
- 所有非 2xx 的 `message` 都是中文用户文案，页面直接 `wx.showToast` 展示，不要自己映射状态码

## 相对 Taro 版的有意改动

都是小改动，不影响主流程，需要严格 1:1 时可回退。

| 位置 | 改动 | 原因 |
|---|---|---|
| `pages/index` | 首页"时间▾"、"地区▾"两个 chip 接上真实筛选 | 原版是点了没反应的空壳，后端本就支持 `sort=meeting_time` 和 `city` |
| `pages/index` | 分页改读 `meta` | 见上文坑 1，原版翻页失效 |
| `blind-box/edit`、`publish/create` | `meeting_time` 从自由文本输入改成日期 + 时间 picker | 后端要求合法日期且晚于当前，自由文本很容易 422 |
| `blind-box/edit`、`publish/create` | 补上"区域"输入框 | 原版有 `district` state 但没有对应输入框 |
| `blind-box/detail` | 模糊相册上加"申请查看"入口 | `getProfileViewRequest`/`requestProfileView` 等 4 个接口和 3 种通知类型后端都齐了，但原版没有任何页面调用，功能不可达 |
| `publish/preview` | 草稿缺失时退回上一页 | 原版会永久卡在"加载中" |
| `profile/following`、`profile/my-applications` | 接上 `onPullDownRefresh` | 原版 config 开了下拉刷新但没接生命周期，手势空转 |
| `notifications` | 接上分页加载更多 | 接口本就返回 `has_more`，原版从不请求第 2 页 |
| `app.json` | 补 `permission.scope.userLocation` + `requiredPrivateInfos` | 履约页要用 `wx.getLocation`，原版 `app.config.ts` 漏了声明，真机会直接失败 |

## 已知限制

- **头像走外域**：`api.dicebear.com`。开发者工具关掉 urlCheck 能显示，
  真机需在小程序后台把该域名加进 downloadFile 白名单。
- **押金是模拟支付**：`POST /deposit` 是后端 mock，没有接 `wx.requestPayment`。
  接真实微信支付只需改 `pages/publish/deposit/index.js` 的 `onPay`。
- **聊天靠轮询**：没有 websocket。聊天页 15s 一次，未读角标 30s 一次。
- **tabBar 图标是占位空图**（68 字节，从 Taro 版原样搬来），需要替换成真实图标。
- **两版共用同一个 appid**，开发者工具里作为两个独立项目导入即可。
