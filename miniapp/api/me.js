/**
 * 个人资料 / 关注 接口。对应 mini/src/lib/api/me.ts
 */
const http = require('../utils/request')
const media = require('../utils/media')

module.exports = {
  /** @returns {Promise<{user: object}>} 含嵌套的 profile 子对象 */
  getMyProfile: function (token) {
    return http.get('/me/profile', token)
  },

  /**
   * 部分更新资料。后端用 $request->only(...) 取字段，传多少改多少。
   * 可用字段：nickname, avatar_url, gender, birth_date, age, height, city,
   * district, dating_purposes, target_gender, target_age_min, target_age_max,
   * about_me, interests, interest_photos, occupation, company, school,
   * education, annual_income, assets_range
   */
  updateProfile: function (data, token) {
    return http.put('/profile', data, token)
  },

  /** 我报名过的盲盒 */
  getMyApplications: function (token) {
    return http.get('/me/applications', token)
  },

  /** 我发布的盲盒 */
  getMyBlindBoxes: function (token) {
    return http.get('/me/blind-boxes', token)
  },

  getMyFollowing: function (token) {
    return http.get('/me/following', token)
  },

  /** @returns {Promise<{available: number, vouchers: Array}>} */
  getMyVouchers: function (token) {
    return http.get('/me/vouchers', token)
  },

  /** @returns {Promise<{used, limit, remaining, is_member}>} 每日拆盒配额 */
  getDailyViews: function (token) {
    return http.get('/me/daily-views', token)
  },

  /**
   * 看别人的主页。
   * @param {number} [boxId] 传盲盒 id 时，若当前用户是该盒创建者且对方报名过，
   *   后端会把 can_view_photos 置为 true
   */
  getUserProfile: function (userId, token, boxId) {
    return http.get(
      '/users/' + userId + '/profile' + (boxId ? '?box_id=' + boxId : ''),
      token
    )
  },

  /** 选图并上传，返回 {url} */
  uploadImage: function (token) {
    return media.chooseAndUpload(token)
  },

  /** 关注。会员专属，且最多关注 12 人 */
  followUser: function (userId, token) {
    return http.post('/users/' + userId + '/follow', {}, token)
  },

  unfollowUser: function (userId, token) {
    return http.del('/users/' + userId + '/follow', token)
  },

  /** @returns {Promise<{following: boolean, following_count: number, can_follow: boolean}>} */
  getFollowStatus: function (userId, token) {
    return http.get('/users/' + userId + '/follow', token)
  },
}
