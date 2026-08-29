const meApi = require('../../../api/me')

const app = getApp()

Page({
  data: {
    profile: {},
    loading: true,
    metaText: '',
    about: '',
    purposes: [],
    interests: [],
    photos: [],
  },

  onLoad: function () {
    this.loadProfile()
  },

  loadProfile: function () {
    const self = this
    meApi
      .getMyProfile(app.getToken())
      .then(function (res) {
        const user = res.user || {}
        const p = user.profile || {}

        const bits = []
        if (user.gender === 1) bits.push('♂ 男')
        else if (user.gender === 2) bits.push('♀ 女')
        if (user.age) bits.push(user.age + '岁')
        if (user.height) bits.push(user.height + 'cm')
        if (user.city) bits.push(user.city)

        self.setData({
          profile: user,
          loading: false,
          metaText: bits.join('  '),
          about: p.about_me || '',
          purposes: p.dating_purposes || [],
          interests: p.interests || [],
          photos: p.interest_photos || [],
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onPhotoTap: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photos,
    })
  },
})
