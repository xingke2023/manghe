const publishApi = require('../../../api/publish')
const format = require('../../../utils/format')

const app = getApp()

const DRAFT_KEY = 'publish_draft'

Page({
  data: {
    draft: null,
    place: '',
    feeLabel: '',
    submitting: false,
  },

  onLoad: function () {
    const raw = wx.getStorageSync(DRAFT_KEY)
    let draft = null
    if (raw) {
      try {
        draft = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch (e) {
        draft = null
      }
    }

    // Taro 版这里没有兜底，草稿丢了会卡在"加载中"死掉。这里退回上一页。
    if (!draft) {
      setTimeout(function () {
        wx.navigateBack()
      }, 1200)
      return
    }

    this.setData({
      draft: draft,
      place: format.joinPlace(draft.city, draft.district, draft.location),
      feeLabel: draft.fee_type === 2 ? '我请客' : 'AA制',
    })
  },

  onBack: function () {
    wx.navigateBack()
  },

  onSubmit: function () {
    if (this.data.submitting || !this.data.draft) return
    const d = this.data.draft

    const payload = {
      title: d.title,
      meeting_time: d.meeting_time,
      location: d.location,
      fee_type: d.fee_type,
      expected_traits: d.expected_traits || [],
      experience_values: d.experience_values || [],
    }
    if (d.city) payload.city = d.city
    if (d.district) payload.district = d.district
    if (d.cover_image) payload.cover_image = d.cover_image

    const self = this
    this.setData({ submitting: true })
    publishApi
      .createBlindBox(payload, app.getToken())
      .then(function () {
        wx.removeStorageSync(DRAFT_KEY)
        wx.redirectTo({ url: '/pages/publish/success/index' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '发布失败', icon: 'none' })
        self.setData({ submitting: false })
      })
  },
})
