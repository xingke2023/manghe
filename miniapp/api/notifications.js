/**
 * 通知接口。对应 mini/src/lib/api/notifications.ts
 */
const http = require('../utils/request')

module.exports = {
  /** @returns {Promise<{data: Array, unread_count: number, has_more: boolean}>} */
  getNotifications: function (token, page) {
    return http.get('/notifications?page=' + (page || 1), token)
  },

  /** @returns {Promise<{count: number}>} */
  getUnreadCount: function (token) {
    return http.get('/notifications/unread-count', token)
  },

  markNotificationRead: function (id, token) {
    return http.put('/notifications/' + id + '/read', {}, token)
  },

  markAllNotificationsRead: function (token) {
    return http.put('/notifications/read-all', {}, token)
  },
}
