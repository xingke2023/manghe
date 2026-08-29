const auth = require('./utils/auth')
const badge = require('./utils/badge')
const authApi = require('./api/auth')
const config = require('./config')

/**
 * 全局登录态与未读角标。
 *
 * Taro 版用 AuthProvider（React Context）分发 user / token，并在 effect 里跑
 * 未读轮询。原生版没有全局组件树，改成：
 *   - globalData 缓存 user / token，页面 onShow 时读
 *   - login / logout / refreshUser 挂在 App 实例上，页面用 getApp() 调
 *   - 角标轮询由 utils/badge 单例负责，登录时 start、登出时 stop
 */
App({
  globalData: {
    token: '',
    user: null,
  },

  onLaunch: function () {
    this.restoreAuth()
  },

  onShow: function () {
    // 从后台切回前台时重启轮询（小程序进后台会挂起定时器）
    if (this.globalData.token) badge.start()
  },

  onHide: function () {
    badge.stop()
  },

  /** 从 storage 恢复登录态 */
  restoreAuth: function () {
    this.globalData.token = auth.getToken()
    this.globalData.user = auth.getUser()
    if (this.globalData.token) badge.start()
  },

  /** @returns {string} 当前 token，未登录返回空串 */
  getToken: function () {
    if (!this.globalData.token) this.globalData.token = auth.getToken()
    return this.globalData.token
  },

  getUser: function () {
    if (!this.globalData.user) this.globalData.user = auth.getUser()
    return this.globalData.user
  },

  isLoggedIn: function () {
    return !!this.getToken()
  },

  /**
   * 手机号登录
   * @returns {Promise<object>} user
   */
  login: function (credentials) {
    const self = this
    return authApi.login(credentials).then(function (res) {
      auth.setAuth(res.token, res.user)
      self.globalData.token = res.token
      self.globalData.user = res.user
      badge.start()
      return res.user
    })
  },

  register: function (credentials) {
    const self = this
    return authApi.register(credentials).then(function (res) {
      auth.setAuth(res.token, res.user)
      self.globalData.token = res.token
      self.globalData.user = res.user
      badge.start()
      return res.user
    })
  },

  /** 重新拉一次 /me，刷新本地缓存的 user */
  refreshUser: function () {
    const self = this
    const token = this.getToken()
    if (!token) return Promise.resolve(null)
    return authApi.me(token).then(function (res) {
      auth.setUser(res.user)
      self.globalData.user = res.user
      return res.user
    })
  },

  /** 登出。接口失败也照样清本地状态 */
  logout: function () {
    const self = this
    const token = this.getToken()
    const done = function () {
      auth.clear()
      self.globalData.token = ''
      self.globalData.user = null
      badge.stop()
      wx.removeTabBarBadge({ index: config.MESSAGE_TAB_INDEX, fail: function () {} })
    }
    if (!token) {
      done()
      return Promise.resolve()
    }
    return authApi
      .logout(token)
      .catch(function () {})
      .then(done)
  },
})
