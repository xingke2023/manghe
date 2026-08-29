/**
 * 发布流程接口（价值观测试 / 押金 / 兑换券 / 建盒）。
 * 对应 mini/src/lib/api/publish.ts
 */
const http = require('../utils/request')
const media = require('../utils/media')

module.exports = {
  /**
   * 发布前置条件
   * @returns {Promise<{value_test_status: number, has_deposit: boolean}>}
   *   value_test_status: 0 未测 / 1 已通过 / 2 待人工审核
   */
  getPublishStatus: function (token) {
    return http.get('/publish/status', token)
  },

  /**
   * 提交价值观测试
   * @param {{q1..q10: string}} answers 必须齐 10 题
   * @returns {Promise<{status: number, message: string}>} status 1 自动通过 / 2 待审核
   */
  submitValueTest: function (answers, token) {
    return http.post('/value-test', { answers: answers }, token)
  },

  /** 支付 ¥50 押金（后端 mock，幂等） */
  payDeposit: function (token) {
    return http.post('/deposit', {}, token)
  },

  /** @param {string} code 6 位兑换券码 */
  redeemVoucher: function (code, token) {
    return http.post('/vouchers/redeem', { code: code }, token)
  },

  /**
   * 创建盲盒
   * @param {{title, meeting_time, location, city, district, fee_type,
   *   cover_image, expected_traits, experience_values, max_participants}} data
   * @returns {Promise<{message: string, id: number}>}
   */
  createBlindBox: function (data, token) {
    return http.post('/blind-boxes', data, token)
  },

  /**
   * 选封面图并上传
   * @returns {Promise<string>} 直接返回图片 URL（注意与 me.uploadImage 返回 {url} 不同，
   *   这是沿用 Taro 版的差异）
   */
  uploadCoverImage: function (token) {
    return media.chooseAndUpload(token).then(function (res) {
      return res.url
    })
  },
}
