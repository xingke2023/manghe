const chatApi = require('../../../api/chat')
const config = require('../../../config')
const badge = require('../../../utils/badge')

const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    sessionId: null,
    messages: [],
    input: '',
    loading: true,
    sending: false,
    scrollAnchor: '',

    otherName: '',
    otherAvatar: '',
    otherId: 0,
  },

  onLoad: function (options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      sessionId: options.id,
    })
    this.loadMessages()
    // 没有 websocket，用轮询模拟实时（与 Taro 版一致，15s 一次）
    this.timer = setInterval(this.loadMessages.bind(this), config.CHAT_POLL_INTERVAL)
  },

  onUnload: function () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    // 这个会话的未读已在拉取时被后端清掉，刷新一下 tabBar 角标
    badge.refresh()
  },

  onBack: function () {
    wx.navigateBack()
  },

  loadMessages: function () {
    const self = this

    return chatApi
      .getChatMessages(this.data.sessionId, app.getToken())
      .then(function (res) {
        // 后端已经在每条消息上给了 is_mine，不用自己比对 sender_id
        const list = res.data || []
        const session = res.session || {}
        const other = session.other_user || {}
        self.setData({
          messages: list,
          loading: false,
          otherName: other.nickname || '',
          // 注意后端字段叫 avatar，不是 avatar_url
          otherAvatar: other.avatar || '',
          otherId: other.id || 0,
          scrollAnchor: 'msg-bottom',
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onInput: function (e) {
    this.setData({ input: e.detail.value })
  },

  onSend: function () {
    const content = (this.data.input || '').trim()
    if (!content || this.data.sending) return

    const self = this
    this.setData({ sending: true })
    chatApi
      .sendChatMessage(this.data.sessionId, content, app.getToken())
      .then(function () {
        self.setData({ input: '' })
        return self.loadMessages()
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '发送失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ sending: false })
      })
  },
})
