const boxApi = require('../../../api/blind-boxes')
const chatApi = require('../../../api/chat')
const meApi = require('../../../api/me')
const format = require('../../../utils/format')

const app = getApp()

/** 盲盒状态：1 进行中 / 2 已满员 / 3 已下架 / 4 已过期 */
const STATUS_MAP = {
  2: { label: '已满员', cls: 'is-blue' },
  3: { label: '已下架', cls: 'is-gray' },
  4: { label: '已结束', cls: 'is-gray' },
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 活动时间的完整文案：09-05 周六 14:59
 *
 * 注意 meeting_time_full 是「把本地时间当 UTC」序列化的，墙上时间藏在 UTC
 * 字段里（详见 blind-box/edit 的 splitMeetingTime）。拿不到就退回后端已经
 * 格式化好的 meeting_time。
 */
function buildMeetingText(box) {
  const date = format.parseDate(box.meeting_time_full)
  if (!date) return box.meeting_time || ''
  const pad = function (n) {
    return String(n).padStart(2, '0')
  }
  return (
    pad(date.getUTCMonth() + 1) +
    '-' +
    pad(date.getUTCDate()) +
    ' 周' +
    WEEKDAYS[date.getUTCDay()] +
    ' ' +
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes())
  )
}

/** 距开始还有多久；已开始则不显示 */
function buildCountdown(box) {
  const date = format.parseDate(box.meeting_time_full)
  if (!date) return ''
  // meeting_time_full 的墙上时间在 UTC 字段里，换算成真实时间戳要减掉本地时区偏移
  const wallClock = date.getTime() + new Date().getTimezoneOffset() * 60000
  const diff = wallClock - Date.now()
  if (diff <= 0) return ''
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '即将开始'
  if (hours < 24) return hours + ' 小时后开始'
  return Math.floor(hours / 24) + ' 天后开始'
}

Page({
  data: {
    statusBarHeight: 20,
    boxId: null,
    box: null,
    loading: true,
    isCreator: false,
    regionText: '',

    // 活动内容派生文案
    meetingText: '',
    countdown: '',
    participantText: '',
    categoryLabel: '',
    statusLabel: '',
    statusClass: '',
    publishedText: '',
    creatorMeta: '',
    applicantAvatars: [],

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
        const status = STATUS_MAP[box.status]
        const creator = box.creator || {}
        // 发起人的次要信息拼一行，避免占太多版面
        const creatorBits = []
        if (creator.generation_label) creatorBits.push(creator.generation_label)
        if (creator.gender === 1) creatorBits.push('♂')
        else if (creator.gender === 2) creatorBits.push('♀')
        if (creator.age) creatorBits.push(creator.age + '岁')
        if (creator.height) creatorBits.push(creator.height + 'cm')

        const maxP = box.max_participants || 1
        const curP = box.current_participants || 0

        self.setData({
          box: box,
          loading: false,
          isCreator: isCreator,
          regionText: format.joinPlace(box.province, box.city, box.district),

          meetingText: buildMeetingText(box),
          countdown: buildCountdown(box),
          participantText: '招募 ' + maxP + ' 人 · 已锁定 ' + curP + ' 人',
          // 后端没有独立分类字段，取体验价值首项当角标
          categoryLabel: (box.experience_values || [])[0] || '',
          statusLabel: status ? status.label : '',
          statusClass: status ? status.cls : '',
          publishedText: format.formatTime(box.created_at),
          creatorMeta: creatorBits.join(' · '),
          applicantAvatars: (box.recent_applicants || []).slice(0, 6),

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

  /** 点发起人头像/昵称进 TA 的主页 */
  onCreatorTap: function () {
    const creator = this.data.box && this.data.box.creator
    if (!creator || this.data.isCreator) return
    wx.navigateTo({ url: '/pages/profile/other/index?userId=' + creator.id })
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
