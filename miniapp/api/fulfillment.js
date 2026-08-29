/**
 * 履约接口（GPS 打卡 / 二维码互扫 / 申诉）。对应 mini/src/lib/api/fulfillment.ts
 *
 * 这几个函数把设备能力和网络请求包在一起，与 Taro 版一致：
 *   submitCheckin      → wx.getLocation 再 POST /checkins
 *   verifyMeetingCode  → wx.scanCode 再 POST /meeting-verifications
 */
const http = require('../utils/request')

/** @returns {Promise<{data: Array}>} 我参与或发布的、已锁定的约会及其履约状态 */
function getFulfillments(token) {
  return http.get('/me/fulfillments', token)
}

function getLocation() {
  return new Promise(function (resolve, reject) {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '定位失败'))
      },
    })
  })
}

/**
 * GPS 打卡。后端用 Haversine 校验是否在约会地点 300m 内。
 * @returns {Promise<{is_valid: boolean, distance_meters?: number, message: string}>}
 */
function submitCheckin(boxId, token) {
  return getLocation().then(function (loc) {
    return http.post(
      '/checkins',
      { box_id: boxId, latitude: loc.latitude, longitude: loc.longitude },
      token
    )
  })
}

/**
 * 生成见面二维码（仅报名方，且需先完成打卡）
 * @returns {Promise<{qr_code: string, valid_until: string}>}
 */
function generateMeetingCode(boxId, token) {
  return http.post('/meeting-codes', { box_id: boxId }, token)
}

function scanCode() {
  return new Promise(function (resolve, reject) {
    wx.scanCode({
      scanType: ['qrCode'],
      success: function (res) {
        resolve(res.result)
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '扫码失败'))
      },
    })
  })
}

/**
 * 发盒者扫报名者的码，完成核销。
 * 成功后后端会标记完美履约、退还押金、盲盒 status → 4，并通知双方。
 * @returns {Promise<{is_valid: boolean, message: string}>}
 */
function verifyMeetingCode(boxId, token) {
  return scanCode().then(function (qrCode) {
    return http.post('/meeting-verifications', { box_id: boxId, qr_code: qrCode }, token)
  })
}

/** @param {string} reason 10~500 字 */
function submitAppeal(boxId, reason, token) {
  return http.post('/appeals', { box_id: boxId, reason: reason }, token)
}

module.exports = {
  getFulfillments,
  submitCheckin,
  generateMeetingCode,
  verifyMeetingCode,
  submitAppeal,
}
