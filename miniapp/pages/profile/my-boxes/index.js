const meApi = require('../../../api/me')
const format = require('../../../utils/format')

const app = getApp()

/** 盲盒状态：1 进行中 / 2 已满员 / 3 已下架 / 4 已履约 */
const STATUS_MAP = {
  1: { label: '进行中', cls: 'badge-green' },
  2: { label: '已满员', cls: 'badge-blue' },
  3: { label: '已下架', cls: 'badge-gray' },
  4: { label: '已履约', cls: 'badge-amber' },
}

Page({
  data: {
    boxes: [],
    loading: true,
  },

  onShow: function () {
    this.loadBoxes()
  },

  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadBoxes().then(done, done)
  },

  loadBoxes: function () {
    const self = this
    this.setData({ loading: true })
    return meApi
      .getMyBlindBoxes(app.getToken())
      .then(function (res) {
        const list = (res.data || []).map(function (box) {
          const status = STATUS_MAP[box.status] || { label: '未知', cls: 'badge-gray' }
          return Object.assign({}, box, {
            status_label: status.label,
            status_class: status.cls,
            place: format.joinPlace(box.city, box.district),
          })
        })
        self.setData({ boxes: list, loading: false })
      })
      .catch(function (err) {
        self.setData({ boxes: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onBoxTap: function (e) {
    wx.navigateTo({
      url: '/pages/blind-box/detail/index?id=' + e.currentTarget.dataset.id,
    })
  },

  goPublish: function () {
    wx.navigateTo({ url: '/pages/publish/index/index' })
  },
})
