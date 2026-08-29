/**
 * wx.request / wx.uploadFile 的 Promise 封装。
 *
 * 行为对齐 Taro 版 lib/api/client.ts：
 *   - 统一带上 Content-Type / Accept，有 token 时加 Authorization: Bearer
 *   - 非 2xx 一律 reject(new Error(res.data.message || 'Request failed: {code}'))
 *     后端返回的 message 是中文用户文案，页面直接 showToast 即可，不要自己映射状态码
 *   - 401 特殊处理：清掉登录态 → redirectTo 登录页 → 再 reject
 */
const config = require('../config')
const auth = require('./auth')

/** 401 后避免多个并发请求同时触发跳转 */
let redirecting = false

function handleUnauthorized() {
  auth.clear()
  if (redirecting) return
  redirecting = true
  wx.redirectTo({
    url: config.LOGIN_PAGE,
    complete() {
      // 留一点时间让跳转完成，之后允许再次触发
      setTimeout(function () {
        redirecting = false
      }, 1000)
    },
  })
}

function request(path, options) {
  const opts = options || {}
  const method = opts.method || 'GET'
  // 绝大多数调用都要带 token，默认自动从 storage 取；显式传 null 可发匿名请求
  const token = opts.token === undefined ? auth.getToken() : opts.token

  return new Promise(function (resolve, reject) {
    const header = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (token) header.Authorization = 'Bearer ' + token

    wx.request({
      url: config.API_BASE + path,
      method: method,
      data: opts.data,
      header: header,
      success: function (res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (res.statusCode === 401) handleUnauthorized()
          const msg =
            (res.data && res.data.message) || 'Request failed: ' + res.statusCode
          reject(new Error(msg))
          return
        }
        resolve(res.data)
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '网络请求失败'))
      },
    })
  })
}

function get(path, token) {
  return request(path, { method: 'GET', token: token })
}

function post(path, data, token) {
  return request(path, { method: 'POST', data: data, token: token })
}

function put(path, data, token) {
  return request(path, { method: 'PUT', data: data, token: token })
}

function del(path, token) {
  return request(path, { method: 'DELETE', token: token })
}

/**
 * 上传单张图片到 POST /upload/image，字段名 image。
 * @param {string} filePath 本地临时文件路径
 * @returns {Promise<{url: string}>}
 */
function uploadFile(filePath, token) {
  const t = token === undefined ? auth.getToken() : token
  return new Promise(function (resolve, reject) {
    wx.uploadFile({
      url: config.API_BASE + '/upload/image',
      filePath: filePath,
      name: 'image',
      header: t ? { Authorization: 'Bearer ' + t } : {},
      success: function (res) {
        if (res.statusCode === 401) {
          handleUnauthorized()
          reject(new Error('登录已过期'))
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error('上传失败'))
          return
        }
        // uploadFile 的 data 始终是字符串，需要自己解析
        try {
          resolve(JSON.parse(res.data))
        } catch (e) {
          reject(new Error('上传失败'))
        }
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '上传失败'))
      },
    })
  })
}

/**
 * 把对象拼成 query string，只保留有值的字段（与 Taro 版 getBlindBoxes 一致）。
 * @returns {string} 形如 "?city=xx&page=2"，无有效字段时返回空串
 */
function buildQuery(params) {
  if (!params) return ''
  const parts = []
  Object.keys(params).forEach(function (key) {
    const value = params[key]
    if (value === undefined || value === null || value === '') return
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
  })
  return parts.length ? '?' + parts.join('&') : ''
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  buildQuery,
}
