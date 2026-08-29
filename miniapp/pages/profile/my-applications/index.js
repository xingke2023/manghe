const meApi = require('../../../api/me')
const format = require('../../../utils/format')

const app = getApp()

/** 报名状态：1 待处理 / 2 已匹配 / 3 未入选 */
const STATUS_MAP = {
  1: { label: '待处理', cls: 'badge-amber', result: '' },
  2: { label: '已匹配', cls: 'badge-green', result: '🎉 恭喜匹配成功' },
  3: { label: '未入选', cls: 'badge-gray', result: '本次遗憾未入选，期待下次相遇' },
}

Page({
  data: {
    applications: [],
    loading: true,
  },

  onShow: function () {
    this.loadApplications()
  },

  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadApplications().then(done, done)
  },

  loadApplications: function () {
    const self = this
    this.setData({ loading: true })
    return meApi
      .getMyApplications(app.getToken())
      .then(function (res) {
        const list = (res.data || []).map(function (item) {
          const status = STATUS_MAP[item.status] || {
            label: '未知',
            cls: 'badge-gray',
            result: '',
          }
          // 后端这里的嵌套键叫 blind_box（不是 box），盲盒被删时为 null
          const box = item.blind_box
          return Object.assign({}, item, {
            box: box,
            title_text: box ? box.title : '盲盒已下架',
            status_label: status.label,
            status_class: status.cls,
            result_text: status.result,
            place: box ? format.joinPlace(box.city, box.district) : '',
            // created_at 和 meeting_time 后端已经格式化成 "m-d H:i"，直接用
            applied_at: item.created_at || '',
          })
        })
        self.setData({ applications: list, loading: false })
      })
      .catch(function (err) {
        self.setData({ applications: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onTap: function (e) {
    const boxId = e.currentTarget.dataset.boxId
    if (!boxId) {
      wx.showToast({ title: '该盲盒已下架', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/blind-box/detail/index?id=' + boxId })
  },
})
