const notificationApi = require('../../api/notifications')
const format = require('../../utils/format')

const app = getApp()

Page({
  data: {
    notifications: [],
    unreadCount: 0,
    loading: true,
    loadingMore: false,
    page: 1,
    hasMore: false,
  },

  onShow: function () {
    this.loadNotifications(1)
  },

  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadNotifications(1).then(done, done)
  },

  onReachBottom: function () {
    this.onLoadMore()
  },

  /**
   * @param {number} page 第 1 页替换，其余追加
   */
  loadNotifications: function (page) {
    if (!app.isLoggedIn()) {
      this.setData({ notifications: [], loading: false, hasMore: false })
      return Promise.resolve()
    }
    const self = this
    const isFirst = page === 1
    this.setData(isFirst ? { loading: true } : { loadingMore: true })

    return notificationApi
      .getNotifications(app.getToken(), page)
      .then(function (res) {
        const list = (res.data || []).map(function (item) {
          return Object.assign({}, item, {
            time_text: format.formatTime(item.created_at),
          })
        })
        self.setData({
          notifications: isFirst ? list : self.data.notifications.concat(list),
          unreadCount: res.unread_count || 0,
          hasMore: !!res.has_more,
          page: page,
          loading: false,
          loadingMore: false,
        })
      })
      .catch(function (err) {
        self.setData({ loading: false, loadingMore: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onLoadMore: function () {
    if (this.data.loadingMore || !this.data.hasMore) return
    this.loadNotifications(this.data.page + 1)
  },

  onMarkAllRead: function () {
    const self = this
    notificationApi
      .markAllNotificationsRead(app.getToken())
      .then(function () {
        // 本地直接置为已读，省一次请求
        const list = self.data.notifications.map(function (item) {
          return Object.assign({}, item, { is_read: true })
        })
        self.setData({ notifications: list, unreadCount: 0 })
        wx.showToast({ title: '已全部标记已读', icon: 'none' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
      })
  },

  onNoticeTap: function (e) {
    const index = Number(e.currentTarget.dataset.index)
    const item = this.data.notifications[index]
    if (!item) return

    if (!item.is_read) {
      const patch = {}
      patch['notifications[' + index + '].is_read'] = true
      this.setData(patch)
      this.setData({ unreadCount: Math.max(0, this.data.unreadCount - 1) })
      notificationApi.markNotificationRead(item.id, app.getToken()).catch(function () {})
    }

    this.navigateByLink(item.link_url)
  },

  /** 按 link_url 前缀分派到对应页面 */
  navigateByLink: function (linkUrl) {
    if (!linkUrl) return

    if (linkUrl.indexOf('/messages') === 0) {
      wx.switchTab({ url: '/pages/messages/index/index' })
      return
    }
    if (linkUrl.indexOf('/blind-box/') === 0) {
      // 形如 /blind-box/12 或 /blind-box/12/xxx，取第一段数字
      const match = linkUrl.match(/\/blind-box\/(\d+)/)
      if (match) {
        wx.navigateTo({ url: '/pages/blind-box/detail/index?id=' + match[1] })
      }
      return
    }
    if (linkUrl.indexOf('/profile') === 0) {
      wx.switchTab({ url: '/pages/profile/index/index' })
    }
  },
})
