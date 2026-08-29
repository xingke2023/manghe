Page({
  goHome: function () {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goMyBoxes: function () {
    wx.navigateTo({ url: '/pages/profile/my-boxes/index' })
  },
})
