const boxApi = require('../../../api/blind-boxes')
const chatApi = require('../../../api/chat')
const meApi = require('../../../api/me')
const format = require('../../../utils/format')

const app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    boxId: null,
    box: null,
    loading: true,
    isCreator: false,
    regionText: '',

    // 关注
    isFollowing: false,
    followLoading: false,

    // 报名
    applying: false,
    actionLabel: '去赴约',
    actionDisabled: false,

    // 报名名单（发盒者视角）
    applications: [],
    applicationsLoading: false,

    // 兴趣相册授权
    hasPhotos: false,
    canViewPhotos: false,
    photoRequestStatus: 0,
    photoRequestHint: '',
    photoRequesting: false,

    // 聊天弹层
    showChat: false,
    chatSessionId: null,
    chatMessages: [],
    chatInput: '',
    chatLoading: false,
    chatSending: false,
    canSendChat: true,
    scrollAnchor: '',
  },

  onLoad: function (options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      boxId: options.id,
    })
    this.loadBox()
  },

  onShareAppMessage: function () {
    const box = this.data.box
    return {
      title: box ? box.title : '搭子盲盒',
      path: '/pages/blind-box/detail/index?id=' + this.data.boxId,
      imageUrl: box && box.cover_image ? box.cover_image : '',
    }
  },

  onBack: function () {
    wx.navigateBack()
  },

  // —— 加载 ——

  loadBox: function () {
    const self = this
    const token = app.getToken() || null
    this.setData({ loading: true })

    boxApi
      .getBlindBox(this.data.boxId, token)
      .then(function (res) {
        const box = res.data
        const me = app.getUser()
        const isCreator = !!(me && box.creator && box.creator.id === me.id)
        const photos =
          (box.creator && box.creator.profile && box.creator.profile.interest_photos) || []

        self.setData({
          box: box,
          loading: false,
          isCreator: isCreator,
          regionText: format.joinPlace(box.city, box.district),
          hasPhotos: photos.length > 0,
          canViewPhotos: isCreator,
        })
        self.refreshAction()

        // 记一次浏览（扣每日配额），失败不影响页面
        if (token) {
          boxApi.recordBoxView(self.data.boxId, token).catch(function () {})
        }

        if (isCreator) {
          self.loadApplications()
        } else if (token) {
          self.loadFollowStatus(box.creator.id)
          if (photos.length) self.loadPhotoPermission()
        }
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '盲盒不存在', icon: 'none' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1200)
      })
  },

  /** 根据盲盒状态和我的报名情况算底部按钮文案 */
  refreshAction: function () {
    const box = this.data.box
    if (!box) return
    const mine = box.my_application

    let label = '去赴约'
    let disabled = false
    if (box.status !== 1) {
      label = '已结束'
      disabled = true
    } else if (mine && mine.is_locked) {
      label = '已匹配 🎉'
      disabled = true
    } else if (mine && mine.status === 3) {
      label = '未入选'
      disabled = true
    } else if (mine) {
      label = '已报名，等 TA 选择'
      disabled = true
    }
    this.setData({ actionLabel: label, actionDisabled: disabled })
  },

  loadApplications: function () {
    const self = this
    this.setData({ applicationsLoading: true })
    boxApi
      .getApplications(this.data.boxId, app.getToken())
      .then(function (res) {
        self.setData({ applications: res.data || [], applicationsLoading: false })
      })
      .catch(function () {
        self.setData({ applications: [], applicationsLoading: false })
      })
  },

  loadFollowStatus: function (userId) {
    const self = this
    meApi
      .getFollowStatus(userId, app.getToken())
      .then(function (res) {
        self.setData({ isFollowing: !!res.following })
      })
      .catch(function () {})
  },

  loadPhotoPermission: function () {
    const self = this
    boxApi
      .getProfileViewRequest(this.data.boxId, app.getToken())
      .then(function (res) {
        self.applyPhotoStatus(res.status, res.next_request_time)
      })
      .catch(function () {})
  },

  applyPhotoStatus: function (status, nextRequestTime) {
    let hint = ''
    if (status === 1) {
      hint = '已提交申请，等待 TA 确认'
    } else if (status === 3) {
      hint = nextRequestTime
        ? '申请未通过，' + format.formatDate(nextRequestTime) + ' 后可再次申请'
        : '申请未通过，24 小时后可再次申请'
    } else if (status !== 2) {
      hint = '相册需要 TA 授权后才能查看'
    }
    this.setData({
      photoRequestStatus: status,
      canViewPhotos: this.data.isCreator || status === 2,
      photoRequestHint: hint,
    })
  },

  // —— 交互 ——

  onRequestPhotos: function () {
    if (this.data.photoRequesting) return
    if (!app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/index' })
      return
    }
    const self = this
    this.setData({ photoRequesting: true })
    boxApi
      .requestProfileView(this.data.boxId, app.getToken())
      .then(function (res) {
        wx.showToast({ title: res.message || '已提交申请', icon: 'none' })
        self.applyPhotoStatus(res.status || 1)
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '申请失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ photoRequesting: false })
      })
  },

  onPhotoTap: function (e) {
    if (!this.data.canViewPhotos) return
    const photos = this.data.box.creator.profile.interest_photos || []
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: photos })
  },

  onToggleFollow: function () {
    if (this.data.followLoading) return
    if (!app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/index' })
      return
    }
    const self = this
    const userId = this.data.box.creator.id
    const wasFollowing = this.data.isFollowing
    const call = wasFollowing ? meApi.unfollowUser : meApi.followUser

    this.setData({ followLoading: true })
    call(userId, app.getToken())
      .then(function (res) {
        self.setData({ isFollowing: !wasFollowing })
        wx.showToast({
          title: res.message || (wasFollowing ? '已取消关注' : '关注成功'),
          icon: 'none',
        })
      })
      .catch(function (err) {
        // 关注是会员专属、且上限 12 人，后端文案直接透出
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ followLoading: false })
      })
  },

  onApply: function () {
    if (this.data.actionDisabled || this.data.applying) return
    if (!app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/index' })
      return
    }
    const self = this
    this.setData({ applying: true })
    chatApi
      .applyBlindBox(this.data.boxId, app.getToken())
      .then(function (res) {
        wx.showToast({ title: res.message || '报名成功', icon: 'none' })
        self.loadBox()
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '报名失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ applying: false })
      })
  },

  onLockApplication: function (e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '确认锁定',
      content: '锁定后其他报名者会被自动拒绝，确定吗？',
      success: function (r) {
        if (!r.confirm) return
        boxApi
          .lockApplication(id, app.getToken())
          .then(function (res) {
            wx.showToast({ title: res.message || '已锁定', icon: 'none' })
            self.loadBox()
          })
          .catch(function (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
          })
      },
    })
  },

  onRejectApplication: function (e) {
    const id = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '确认拒绝',
      content: '确定拒绝这位报名者吗？',
      success: function (r) {
        if (!r.confirm) return
        boxApi
          .rejectApplication(id, app.getToken())
          .then(function (res) {
            wx.showToast({ title: res.message || '已拒绝', icon: 'none' })
            self.loadApplications()
          })
          .catch(function (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
          })
      },
    })
  },

  onUnpublish: function () {
    const self = this
    wx.showModal({
      title: '确认下架',
      content: '下架后其他人将看不到这个盲盒，确定吗？',
      success: function (r) {
        if (!r.confirm) return
        boxApi
          .unpublishBlindBox(self.data.boxId, app.getToken())
          .then(function (res) {
            wx.showToast({ title: res.message || '已下架', icon: 'none' })
            setTimeout(function () {
              wx.navigateBack()
            }, 1000)
          })
          .catch(function (err) {
            wx.showToast({ title: err.message || '下架失败', icon: 'none' })
          })
      },
    })
  },

  onApplicantTap: function (e) {
    const userId = e.currentTarget.dataset.id
    if (!userId) return
    wx.navigateTo({
      url:
        '/pages/profile/other/index?userId=' + userId + '&box_id=' + this.data.boxId,
    })
  },

  goEdit: function () {
    wx.navigateTo({ url: '/pages/blind-box/edit/index?id=' + this.data.boxId })
  },

  // —— 一次性聊天弹层 ——
  // 匹配前只能发一条，等对方回复后才能再发（与 Taro 版一致）

  onOpenChat: function () {
    if (!app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/index' })
      return
    }
    const self = this
    this.setData({ showChat: true, chatLoading: true })
    chatApi
      .getOrCreateSession(this.data.boxId, app.getToken())
      .then(function (res) {
        self.setData({ chatSessionId: res.session_id })
        return self.loadChatMessages()
      })
      .catch(function (err) {
        self.setData({ chatLoading: false })
        wx.showToast({ title: err.message || '打开会话失败', icon: 'none' })
      })
  },

  loadChatMessages: function () {
    const self = this
    return chatApi
      .getChatMessages(this.data.chatSessionId, app.getToken())
      .then(function (res) {
        // 后端每条消息自带 is_mine
        const list = res.data || []
        const last = list[list.length - 1]
        self.setData({
          chatMessages: list,
          chatLoading: false,
          // 没有消息，或最后一条是对方发的 → 可以发送
          canSendChat: !last || !last.is_mine,
          scrollAnchor: 'chat-bottom',
        })
      })
  },

  onChatInput: function (e) {
    this.setData({ chatInput: e.detail.value })
  },

  onSendChat: function () {
    const content = (this.data.chatInput || '').trim()
    if (!content || !this.data.canSendChat || this.data.chatSending) return
    const self = this
    this.setData({ chatSending: true })
    chatApi
      .sendChatMessage(this.data.chatSessionId, content, app.getToken())
      .then(function () {
        self.setData({ chatInput: '' })
        return self.loadChatMessages()
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '发送失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ chatSending: false })
      })
  },

  onCloseChat: function () {
    this.setData({ showChat: false })
  },
})
