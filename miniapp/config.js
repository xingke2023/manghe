/**
 * 全局配置。
 *
 * 原 Taro 版把 API 地址硬编码在 lib/api/client.ts 里，dev / prod 用同一个
 * localhost 地址（config/dev.ts、config/prod.ts 都没覆盖）。这里集中成一个
 * 常量，换环境只改这一处。
 *
 * 原生小程序没有构建期变量替换，所以切环境就是把下面两行注释对调。
 *
 * 用生产地址时注意两件事：
 *   1. 真机需在微信后台把 app51.xingke888.com 加进「request 合法域名」，
 *      否则只有开发者工具（勾了"不校验合法域名"）能通。
 *   2. 头像回落用的 api.dicebear.com 属外域图片，要加进「downloadFile 合法域名」。
 */
const API_BASE = 'https://app51.xingke888.com/api'
// const API_BASE = 'http://localhost:8068/api'   // 本地开发

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
