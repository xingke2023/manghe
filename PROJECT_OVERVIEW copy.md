# 约会盲盒项目概览

## 🎯 项目定位

**产品名称**: 约会盲盒 ("不正经实验室"旗下)

**核心定位**: 通过"盲盒+兴趣匹配+线下履约"机制，为都市青年提供高质量真实社交的小程序平台

**目标用户**: 20-35岁一二线城市单身男女、斜杠青年、自由职业者

## 📁 项目结构

```
manghe/
│
├── backend/                    # Laravel 12 后端 (REST API)
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── Api/
│   │   │           └── AuthController.php    # 认证控制器
│   │   └── Models/
│   │       └── User.php                      # 用户模型 (含Sanctum)
│   ├── config/
│   │   ├── sanctum.php                       # Sanctum配置
│   │   └── cors.php                          # CORS配置
│   ├── database/
│   │   └── migrations/                       # 20个数据表迁移文件
│   ├── routes/
│   │   └── api.php                          # API路由
│   └── .env                                 # 环境配置 (MySQL: localhost/manghe)
│
├── frontend/                   # UniApp 前端 (Vue 3)
│   ├── pages/                 # 页面
│   │   ├── index/            # 首页
│   │   ├── discover/         # 发现
│   │   ├── create/           # 发布盲盒
│   │   ├── message/          # 消息
│   │   ├── profile/          # 个人中心
│   │   ├── box-detail/       # 盲盒详情
│   │   └── login/            # 登录页
│   ├── api/                  # API封装
│   │   └── auth.js           # 认证API
│   ├── utils/                # 工具类
│   │   ├── config.js         # API配置
│   │   └── request.js        # HTTP请求封装 (含拦截器)
│   ├── static/               # 静态资源
│   │   └── css/
│   │       └── common.css    # 全局样式
│   ├── App.vue               # 应用入口
│   ├── main.js               # 主文件
│   ├── pages.json            # 页面配置 (含tabBar)
│   └── manifest.json         # 应用配置 (微信小程序)
│
├── database/                  # 数据库设计文档
│   ├── schema.sql            # 完整SQL建表脚本
│   ├── README.md             # 数据库设计说明
│   └── 拆盒次数限制说明.md     # 拆盒次数逻辑详解
│
└── project_desc/              # 项目需求文档
    ├── 需求.txt              # 原始需求
    └── 项目需求简要总结.md     # 需求总结

```

## 🛠 技术栈

### 后端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| Laravel | 12.x | PHP框架 |
| Laravel Sanctum | 4.x | API Token认证 |
| MySQL | 8.0+ | 数据库 |
| PHP | 8.2+ | 编程语言 |

### 前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| UniApp | Vue 3 | 跨平台框架 |
| 微信小程序 | - | 目标平台 (可转换) |
| uni-request | - | HTTP请求 (已封装) |

## 🔐 认证流程

### Sanctum Token认证

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  微信小程序   │         │  Laravel API │         │   MySQL DB   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                        │
       │ 1. wx.login()         │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │ 2. POST /auth/wechat-login                    │
       │    {code, nickname, avatar}                    │
       ├──────────────────────>│                        │
       │                       │ 3. 验证code & 获取openid│
       │                       │                        │
       │                       │ 4. 查找或创建用户       │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │                       │                        │
       │                       │ 5. 生成Sanctum Token   │
       │                       │                        │
       │ 6. 返回 {token, user} │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 7. 存储token到本地     │                        │
       │                       │                        │
       │ 8. 后续请求携带token   │                        │
       │    Header: Authorization: Bearer {token}       │
       ├──────────────────────>│                        │
       │                       │ 9. 验证token            │
       │                       │                        │
       │ 10. 返回受保护资源     │                        │
       │<──────────────────────┤                        │
       │                       │                        │
```

## 📊 数据库架构

### 核心表关系

```
users (用户)
  ├── user_profiles (详细资料)
  ├── value_tests (价值观测试)
  ├── blind_boxes (发布的盲盒) ──┐
  ├── box_applications (报名记录) │
  ├── box_views (拆盒记录)        │
  └── user_follows (关注关系)     │
                                 │
blind_boxes (盲盒) <─────────────┘
  ├── box_applications (报名记录)
  │     └── meeting_verifications (扫码验证)
  ├── checkins (打卡记录)
  ├── meeting_codes (见面码)
  └── chat_sessions (聊天会话)
        └── chat_messages (消息)
```

### 表统计
- **用户相关**: 4张表
- **盲盒/约会相关**: 4张表
- **履约相关**: 3张表
- **沟通相关**: 3张表
- **其他支撑**: 6张表
- **总计**: 20张表

## 🔄 核心业务流程

### 1. 用户注册登录
```
微信授权 → 获取openid → 创建/查找用户 → 返回Token → 存储Token
```

### 2. 发布盲盒
```
价值观测试 → 缴纳保证金 → 使用发盒凭证 → 填写内容 → 发布成功
```

### 3. 拆盒浏览
```
检查今日次数 → 首次拆盒扣次数 → 查看详情 → 可反复查看
```

### 4. 报名匹配
```
支付防鸽费 → 提交报名 → 发盒者筛选 → 锁定多人 → 生成约会
```

### 5. 履约核销
```
GPS打卡 → 生成二维码 → 双向扫码验证 → 自动判责 → 资金结算
```

## 🎨 前端页面结构

### TabBar页面 (5个)
1. **首页** (`pages/index`) - 推荐盲盒列表
2. **发现** (`pages/discover`) - 盲盒广场与筛选
3. **发布** (`pages/create`) - 发布新盲盒
4. **消息** (`pages/message`) - 聊天与通知
5. **我的** (`pages/profile`) - 个人中心

### 其他页面
- **登录页** (`pages/login`) - 微信一键登录
- **盲盒详情** (`pages/box-detail`) - 详情与报名

## 🔌 API接口设计

### 基础URL
```
开发环境: http://localhost:8000/api
生产环境: https://your-domain.com/api
```

### 认证接口
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/wechat-login` | 微信登录 | 否 |
| GET | `/auth/me` | 获取当前用户 | 是 |
| POST | `/auth/logout` | 登出 | 是 |

### 待开发接口
- [ ] 盲盒相关 (`/boxes`)
- [ ] 报名相关 (`/applications`)
- [ ] 聊天相关 (`/chats`)
- [ ] 履约相关 (`/appointments`)
- [ ] 用户相关 (`/users`)

## 🚀 快速启动

### 1. 启动后端 (5步)
```bash
cd backend
composer install
php artisan migrate
php artisan serve
# 访问: http://localhost:8000
```

### 2. 启动前端 (3步)
```bash
cd frontend
npm install                    # 可选
# 使用HBuilderX打开frontend目录，运行到微信开发者工具
```

## 📝 开发进度

### ✅ 已完成 (Phase 1)
- [x] 项目架构搭建
- [x] 数据库设计与迁移 (20张表)
- [x] Laravel Sanctum认证集成
- [x] UniApp项目结构
- [x] API请求封装与拦截器
- [x] 用户登录/登出功能
- [x] 基础页面框架

### 🚧 进行中 (Phase 2)
- [ ] 盲盒CRUD接口
- [ ] 盲盒列表与详情页
- [ ] 图片上传功能
- [ ] 报名与匹配逻辑

### 📅 待开发 (Phase 3)
- [ ] GPS打卡功能
- [ ] 二维码生成与扫描
- [ ] 聊天系统
- [ ] 履约判定与申诉
- [ ] 管理后台

## 🎯 核心亮点

### 1. Sanctum Token认证
- 无状态Token认证，适合小程序
- 支持多设备登录
- Token自动刷新机制

### 2. 拆盒次数限制
- 永久记录用户拆过的盒子
- 已拆盒子可反复查看不扣次数
- 每日限制只针对新盒子

### 3. 一对多约会模式
- 1个发盒者可锁定多人
- 每个拆盒者独立判定履约
- 支持部分履约场景

### 4. 双向扫码验证
- 发盒者扫所有拆盒者
- 拆盒者扫发盒者
- 双向完成才算履约

### 5. 微信小程序兼容
- 使用UniApp跨平台框架
- 可轻松转换到支付宝、抖音小程序
- 原生体验，性能优秀

## 🔒 安全考虑

### 后端安全
- ✅ Sanctum Token认证
- ✅ CORS跨域配置
- ✅ SQL注入防护 (Eloquent ORM)
- ✅ XSS防护 (自动转义)
- 🚧 敏感信息加密
- 🚧 API访问频率限制

### 前端安全
- ✅ Token安全存储
- ✅ 请求拦截器自动添加Token
- ✅ 401自动跳转登录
- 🚧 HTTPS通信
- 🚧 数据加密传输

## 📞 联系与支持

如有问题，请查看:
1. `README.md` - 快速开始指南
2. `database/README.md` - 数据库设计文档
3. `project_desc/项目需求简要总结.md` - 完整需求说明

---

**开发团队**: 不正经实验室
**创建时间**: 2025-01-09
**最后更新**: 2025-01-09
