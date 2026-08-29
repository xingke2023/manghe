const meApi = require('../../../api/me')

const app = getApp()

Page({
  data: {
    users: [],
    loading: true,
  },

  onShow: function () {
    this.loadFollowing()
  },

  // Taro 版这页在 config 里开了下拉刷新但没接生命周期，手势会空转。这里补上。
  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadFollowing().then(done, done)
  },

  loadFollowing: function () {
    const self = this
    this.setData({ loading: true })
    return meApi
      .getMyFollowing(app.getToken())
      .then(function (res) {
        const list = (res.data || []).map(function (user) {
          const bits = []
          if (user.gender === 1) bits.push('♂')
          else if (user.gender === 2) bits.push('♀')
          if (user.generation_label) bits.push(user.generation_label)
          return Object.assign({}, user, { meta_text: bits.join(' ') })
        })
        self.setData({ users: list, loading: false })
      })
      .catch(function (err) {
        self.setData({ users: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onUserTap: function (e) {
    wx.navigateTo({
      url: '/pages/profile/other/index?userId=' + e.currentTarget.dataset.id,
    })
  },

  onUnfollow: function (e) {
    const userId = e.currentTarget.dataset.id
    const self = this
    wx.showModal({
      title: '提示',
      content: '确定取消关注吗？',
      success: function (r) {
        if (!r.confirm) return
        meApi
          .unfollowUser(userId, app.getToken())
          .then(function () {
            // 本地移除，不重新拉整个列表
            self.setData({
              users: self.data.users.filter(function (u) {
                return u.id !== userId
              }),
            })
            wx.showToast({ title: '已取消关注', icon: 'none' })
          })
          .catch(function (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
          })
      },
    })
  },
})
