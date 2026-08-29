const meApi = require('../../../api/me')
const format = require('../../../utils/format')

const app = getApp()

Page({
  data: {
    active: [],
    history: [],
    loading: true,
  },

  onShow: function () {
    this.loadVouchers()
  },

  loadVouchers: function () {
    const self = this
    this.setData({ loading: true })
    meApi
      .getMyVouchers(app.getToken())
      .then(function (res) {
        const all = res.vouchers || []
        const active = []
        const history = []

        all.forEach(function (voucher) {
          if (voucher.status === 1) {
            active.push(
              Object.assign({}, voucher, {
                // 与 Taro 版一致：渲染时算一次，不做逐秒跳动
                time_left: format.timeLeft(voucher.valid_until),
              })
            )
            return
          }
          // status 2 已核销，其余按过期处理
          const used = voucher.status === 2
          history.push(
            Object.assign({}, voucher, {
              status_label: used ? '已核销' : '已过期',
              status_class: used ? 'badge-outline-gray' : 'badge-outline-orange',
            })
          )
        })

        self.setData({ active: active, history: history, loading: false })
      })
      .catch(function (err) {
        self.setData({ active: [], history: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onCopy: function (e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.code,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'none' })
      },
    })
  },
})
