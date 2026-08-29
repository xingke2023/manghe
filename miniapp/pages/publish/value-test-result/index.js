Page({
  data: {
    passed: false,
  },

  onLoad: function (options) {
    this.setData({ passed: options.status === 'pass' })
  },

  onAction: function () {
    if (this.data.passed) {
      wx.redirectTo({ url: '/pages/publish/deposit/index' })
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },
})
