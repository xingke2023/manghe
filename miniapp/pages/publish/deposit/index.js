const publishApi = require('../../../api/publish')

const app = getApp()

Page({
  data: {
    paying: false,
  },

  /**
   * 后端 /deposit 是 mock 支付（幂等），没有真的 wx.requestPayment。
   * 接微信支付时替换这里即可，其余流程不变。
   */
  onPay: function () {
    if (this.data.paying) return
    const self = this
    this.setData({ paying: true })

    publishApi
      .payDeposit(app.getToken())
      .then(function (res) {
        wx.showToast({ title: res.message || '支付成功', icon: 'none' })
        setTimeout(function () {
          wx.redirectTo({ url: '/pages/publish/create/index' })
        }, 1000)
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '支付失败', icon: 'none' })
        self.setData({ paying: false })
      })
  },
})
