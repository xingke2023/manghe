/**
 * 登录态存储。
 *
 * 与 Taro 版 lib/auth-context.tsx 保持完全一致的两个 storage key，
 * 这样两版小程序共用同一套后端时行为一致：
 *   auth_token —— 裸 token 字符串
 *   auth_user  —— JSON 序列化后的 user 对象
 *
 * 原版用 React Context 分发状态；原生版没有 Context，改为这个单例模块 +
 * app.globalData 缓存，页面在 onShow 里读一次即可。
 */
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function getUser() {
  const raw = wx.getStorageSync(USER_KEY)
  if (!raw) return null
  // 小程序 storage 会自动反序列化对象，但历史数据可能是字符串，两种都兜住
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }
  return raw
}

function setAuth(token, user) {
  wx.setStorageSync(TOKEN_KEY, token)
  wx.setStorageSync(USER_KEY, JSON.stringify(user))
}

function setUser(user) {
  wx.setStorageSync(USER_KEY, JSON.stringify(user))
}

/** 清空登录态（登出 / 401 时调用），不做跳转 */
function clear() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
}

function isLoggedIn() {
  return !!getToken() && !!getUser()
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  getUser,
  setAuth,
  setUser,
  clear,
  isLoggedIn,
}
