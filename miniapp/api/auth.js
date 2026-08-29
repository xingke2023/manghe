/**
 * 认证接口。对应 mini/src/lib/api/auth.ts
 */
const http = require('../utils/request')

module.exports = {
  /**
   * 手机号登录（后端 mock，不存在则自动注册，无短信验证码）
   * @param {{phone: string}} data
   * @returns {Promise<{message: string, user: object, token: string}>}
   */
  login: function (data) {
    return http.post('/login', data, null)
  },

  /**
   * @param {{name, email, password, password_confirmation}} data
   * @returns {Promise<{message: string, user: object, token: string}>}
   */
  register: function (data) {
    return http.post('/register', data, null)
  },

  logout: function (token) {
    return http.post('/logout', {}, token)
  },

  /** @returns {Promise<{user: object}>} */
  me: function (token) {
    return http.get('/me', token)
  },
}
