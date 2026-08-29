const meApi = require('../../../api/me')

const app = getApp()

Page({
  data: {
    userId: null,
    boxId: null,
    user: {},
    loading: true,
    following: false,
    followLoading: false,

    metaText: '',
    about: '',
    purposes: [],
    interests: [],
    photos: [],
    canViewPhotos: false,
  },

  onLoad: function (options) {
    this.setData({
      userId: options.userId,
      // 从盲盒报名名单点进来时带着 box_id，后端据此判断相册可见性
      boxId: options.box_id || null,
    })
    this.loadUser()
  },

  loadUser: function () {
    const self = this
    const token = app.getToken()

    Promise.all([
      meApi.getUserProfile(this.data.userId, token, this.data.boxId),
      meApi.getFollowStatus(this.data.userId, token).catch(function () {
        return { following: false }
      }),
    ])
      .then(function (results) {
        const user = results[0].user || {}
        const p = user.profile || {}

        const bits = []
        if (user.gender === 1) bits.push('♂ 男')
        else if (user.gender === 2) bits.push('♀ 女')
        if (user.age) bits.push(user.age + '岁')
        if (user.height) bits.push(user.height + 'cm')
        if (user.city) bits.push(user.city)

        self.setData({
          user: user,
          loading: false,
          following: !!results[1].following,
          metaText: bits.join('  '),
          about: p.about_me || '',
          purposes: p.dating_purposes || [],
          interests: p.interests || [],
          photos: p.interest_photos || [],
          canViewPhotos: !!user.can_view_photos,
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onToggleFollow: function () {
    if (this.data.followLoading) return
    const self = this
    const wasFollowing = this.data.following
    const call = wasFollowing ? meApi.unfollowUser : meApi.followUser

    this.setData({ followLoading: true })
    call(this.data.userId, app.getToken())
      .then(function (res) {
        self.setData({ following: !wasFollowing })
        wx.showToast({
          title: res.message || (wasFollowing ? '已取消关注' : '关注成功'),
          icon: 'none',
        })
      })
      .catch(function (err) {
        // 关注是会员专属、上限 12 人，直接透出后端文案
        wx.showToast({ title: err.message || '操作失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ followLoading: false })
      })
  },

  onPhotoTap: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photos,
    })
  },
})
