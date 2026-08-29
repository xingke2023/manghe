const chatApi = require('../../../api/chat')
const notificationApi = require('../../../api/notifications')
const format = require('../../../utils/format')

const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    sessions: [],
    loading: true,
    noticeUnread: '',
  },

  onShow: function () {
    this.setData({ isLoggedIn: app.isLoggedIn() })
    this.loadSessions()
    this.loadNoticeUnread()
  },

  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadNoticeUnread()
    this.loadSessions().then(done, done)
  },

  loadSessions: function () {
    if (!app.isLoggedIn()) {
      this.setData({ sessions: [], loading: false })
      return Promise.resolve()
    }
    const self = this
    this.setData({ loading: true })
    return chatApi
      .getChatSessions(app.getToken())
      .then(function (res) {
        const list = (res.data || []).map(function (session) {
          const other = session.other_user || {}
          return Object.assign({}, session, {
            // 后端字段叫 avatar（不是 avatar_url），且 last_message_time 已经
            // 在服务端格式化成 "8-29" 这种字符串，不要再套一层相对时间换算
            other_user: {
              id: other.id,
              nickname: other.nickname,
              avatar_url: other.avatar || '',
            },
            time_text: session.last_message_time || '',
            badge: format.badgeText(session.unread_count),
          })
        })
        self.setData({ sessions: list, loading: false })
      })
      .catch(function (err) {
        self.setData({ sessions: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  loadNoticeUnread: function () {
    if (!app.isLoggedIn()) {
      this.setData({ noticeUnread: '' })
      return
    }
    const self = this
    notificationApi
      .getUnreadCount(app.getToken())
      .then(function (res) {
        self.setData({ noticeUnread: format.badgeText(res.count) })
      })
      .catch(function () {
        self.setData({ noticeUnread: '' })
      })
  },

  onSessionTap: function (e) {
    wx.navigateTo({
      url: '/pages/messages/chat/index?id=' + e.currentTarget.dataset.id,
    })
  },

  goNotifications: function () {
    wx.navigateTo({ url: '/pages/notifications/index' })
  },
})
