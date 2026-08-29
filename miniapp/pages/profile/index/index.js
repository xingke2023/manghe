const meApi = require('../../../api/me')

const app = getApp()

const MENU = [
  { icon: '🎁', label: '我的盲盒', url: '/pages/profile/my-boxes/index' },
  { icon: '✋', label: '我的报名', url: '/pages/profile/my-applications/index' },
  { icon: '❤️', label: '我的关注', url: '/pages/profile/following/index' },
  { icon: '📋', label: '履约记录', url: '/pages/profile/fulfillments/index' },
  { icon: '🎫', label: '我的兑换券', url: '/pages/profile/vouchers/index' },
]

Page({
  data: {
    isLoggedIn: false,
    menu: MENU,
    profile: {},
    displayName: '',
    metaText: '',
  },

  onShow: function () {
    const loggedIn = app.isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) this.loadProfile()
  },

  loadProfile: function () {
    const self = this
    meApi
      .getMyProfile(app.getToken())
      .then(function (res) {
        const user = res.user || {}
        const cached = app.getUser() || {}
        // 城市 / 年龄 / 身高 拼成一行，缺哪项就跳过
        const bits = []
        if (user.city) bits.push(user.city)
        if (user.age) bits.push(user.age + '岁')
        if (user.height) bits.push(user.height + 'cm')

        self.setData({
          profile: user,
          displayName: user.nickname || cached.name || '未设置昵称',
          metaText: bits.join(' '),
        })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onMenuTap: function (e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  },

  goEdit: function () {
    wx.navigateTo({ url: '/pages/profile/edit/index' })
  },

  goLogin: function () {
    wx.navigateTo({ url: '/pages/auth/login/index' })
  },

  onLogout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: function (r) {
        if (!r.confirm) return
        app.logout().then(function () {
          wx.redirectTo({ url: '/pages/auth/login/index' })
        })
      },
    })
  },
})
