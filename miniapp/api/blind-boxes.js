/**
 * 盲盒 / 报名 / 相册权限接口。对应 mini/src/lib/api/blind-boxes.ts
 */
const http = require('../utils/request')

module.exports = {
  /**
   * 盲盒广场列表（公开接口，带 token 会走个性化推荐排序）
   * @param {{city, district, fee_type, category, sort, date_from, date_to, page}} params
   * @returns {Promise<{data: Array, links: object, meta: {current_page, last_page, per_page, total}}>}
   *   注意：分页字段在 meta 里，不在顶层。
   */
  getBlindBoxes: function (params, token) {
    return http.get('/blind-boxes' + http.buildQuery(params), token)
  },

  /** @returns {Promise<{data: object}>} */
  getBlindBox: function (id, token) {
    return http.get('/blind-boxes/' + id, token)
  },

  /** @returns {Promise<{cities: string[], districts: string[]}>} */
  getFilterOptions: function () {
    return http.get('/blind-boxes/filter-options', null)
  },

  /**
   * 创建盲盒。需要 has_box_permission === 1，否则 403。
   * @returns {Promise<{message: string, id: number}>}
   */
  createBlindBox: function (data, token) {
    return http.post('/blind-boxes', data, token)
  },

  updateBlindBox: function (id, data, token) {
    return http.put('/blind-boxes/' + id, data, token)
  },

  /** 下架（软删，status → 3） */
  unpublishBlindBox: function (id, token) {
    return http.del('/blind-boxes/' + id, token)
  },

  /**
   * 记录一次浏览，扣减每日拆盒配额。
   * 配额用尽时后端返回 422 {quota_exhausted, used, limit}
   * @returns {Promise<{message: string, already_viewed: boolean}>}
   */
  recordBoxView: function (boxId, token) {
    return http.post('/blind-boxes/' + boxId + '/view', {}, token)
  },

  /** 我关注的发盒者的盲盒，按发盒者分组。会员专属，非会员 403 */
  getFollowingBoxes: function (token) {
    return http.get('/following/blind-boxes', token)
  },

  // —— 报名 ——

  /** @returns {Promise<{data: Array}>} 仅盲盒创建者可调 */
  getApplications: function (boxId, token) {
    return http.get('/blind-boxes/' + boxId + '/applications', token)
  },

  /** 锁定某个报名者，其余待处理报名会被自动拒绝 */
  lockApplication: function (applicationId, token) {
    return http.post('/applications/' + applicationId + '/lock', {}, token)
  },

  rejectApplication: function (applicationId, token) {
    return http.post('/applications/' + applicationId + '/reject', {}, token)
  },

  // —— 兴趣相册查看权限 ——

  /**
   * @returns {Promise<{status: number, created_at?, next_request_time?}>}
   *   status: 0 未申请 / 1 待处理 / 2 已通过 / 3 已拒绝
   */
  getProfileViewRequest: function (boxId, token) {
    return http.get('/blind-boxes/' + boxId + '/profile-view-request', token)
  },

  requestProfileView: function (boxId, token) {
    return http.post('/blind-boxes/' + boxId + '/profile-view-request', {}, token)
  },

  /** 我收到的待处理相册查看申请 */
  getPendingProfileViewRequests: function (token) {
    return http.get('/me/profile-view-requests', token)
  },

  /** @param {'approve'|'reject'} action */
  processProfileViewRequest: function (id, action, token) {
    return http.post('/profile-view-requests/' + id + '/' + action, {}, token)
  },
}
