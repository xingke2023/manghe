/**
 * 聊天接口。对应 mini/src/lib/api/chat.ts
 */
const http = require('../utils/request')

module.exports = {
  /**
   * 取或建与盲盒创建者的会话
   * @returns {Promise<{session_id, is_new, creator, blind_box}>}
   */
  getOrCreateSession: function (boxId, token) {
    return http.post('/chat/sessions', { box_id: boxId }, token)
  },

  /** @returns {Promise<{data: Array}>} 含未读数、最后一条消息、对方信息 */
  getChatSessions: function (token) {
    return http.get('/chat/sessions', token)
  },

  /** @returns {Promise<{count: number}>} */
  getChatUnreadCount: function (token) {
    return http.get('/chat/unread-count', token)
  },

  /**
   * 拉取会话消息（副作用：把发给我的未读标为已读）
   * @returns {Promise<{session: object, data: Array}>}
   */
  getChatMessages: function (sessionId, token) {
    return http.get('/chat/' + sessionId + '/messages', token)
  },

  /** @param {string} content 最长 500 字 */
  sendChatMessage: function (sessionId, content, token) {
    return http.post('/chat/' + sessionId + '/messages', { content: content }, token)
  },

  /**
   * 报名盲盒（会收取防鸽费，并自动建立聊天会话）
   * 幂等：已报名过会直接返回已有的 application_id
   * @returns {Promise<{message: string, application_id: number}>}
   */
  applyBlindBox: function (boxId, token) {
    return http.post('/blind-boxes/' + boxId + '/apply', {}, token)
  },
}
