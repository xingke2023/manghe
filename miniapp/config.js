/**
 * 全局配置。
 *
 * 原 Taro 版把 API 地址硬编码在 lib/api/client.ts 里，dev / prod 用同一个
 * localhost 地址（config/dev.ts、config/prod.ts 都没覆盖）。这里集中成一个
 * 常量，换环境只改这一处。
 *
 * 注意：请求 localhost 需要在 project.config.json 里保持 urlCheck: false，
 * 否则开发者工具会以"不在域名白名单"为由拦掉请求。
 */
const API_BASE = 'http://localhost:8068/api'

module.exports = {
  API_BASE,
  /** 未读消息角标轮询间隔 */
  UNREAD_POLL_INTERVAL: 30000,
  /** 聊天页拉取新消息的轮询间隔 */
  CHAT_POLL_INTERVAL: 15000,
  /** 消息 tab 在 tabBar 里的下标，setTabBarBadge 用 */
  MESSAGE_TAB_INDEX: 1,
  /** 登录页路径，401 时统一跳这里 */
  LOGIN_PAGE: '/pages/auth/login/index',
}
