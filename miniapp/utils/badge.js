/**
 * 消息 tab 未读角标轮询。
 *
 * Taro 版把这段逻辑放在 AuthProvider 的 useEffect 里（token 变化时起停）。
 * 原生版没有全局组件树，改为 app.js 里启动的单例定时器：
 *   - 登录后 start()，登出后 stop()
 *   - 立即拉一次，之后每 30s 一次
 */
const config = require('../config')
const auth = require('./auth')
const chatApi = require('../api/chat')
const format = require('./format')

let timer = null

function applyBadge(count) {
  const text = format.badgeText(count)
  if (text) {
    wx.setTabBarBadge({
      index: config.MESSAGE_TAB_INDEX,
      text: text,
      fail: function () {
        // 当前不在 tabBar 页面时会失败，忽略即可
      },
    })
  } else {
    wx.removeTabBarBadge({
      index: config.MESSAGE_TAB_INDEX,
      fail: function () {},
    })
  }
}

function poll() {
  const token = auth.getToken()
  if (!token) {
    applyBadge(0)
    return
  }
  chatApi
    .getChatUnreadCount(token)
    .then(function (res) {
      applyBadge(res && res.count)
    })
    .catch(function () {
      // 轮询失败静默处理，不打扰用户
    })
}

function start() {
  stop()
  if (!auth.getToken()) {
    applyBadge(0)
    return
  }
  poll()
  timer = setInterval(poll, config.UNREAD_POLL_INTERVAL)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 供页面在收发消息后手动刷新一次角标 */
function refresh() {
  poll()
}

module.exports = { start, stop, refresh }
