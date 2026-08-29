const boxApi = require('../../../api/blind-boxes')
const media = require('../../../utils/media')
const constants = require('../../../constants')
const format = require('../../../utils/format')

const app = getApp()

/**
 * 把 meeting_time_full 拆成 ['2026-09-01', '19:30'] 回填两个 picker。
 *
 * 坑：后端把不带时区的 DATETIME 直接按 UTC 序列化了 —— 约会时间 14:00 会变成
 * "2025-04-05T14:00:00.000000Z"。所以真实的墙上时间藏在 UTC 字段里，必须用
 * getUTC* 读；用本地 getter 会在东八区多出 8 小时。
 * （可以拿同一条数据的 meeting_time 展示串 "04-05 14:00" 对照验证。）
 */
function splitMeetingTime(value) {
  if (!value) return ['', '']
  const date = format.parseDate(value)
  if (!date) return ['', '']
  const pad = function (n) {
    return String(n).padStart(2, '0')
  }
  return [
    date.getUTCFullYear() +
      '-' +
      pad(date.getUTCMonth() + 1) +
      '-' +
      pad(date.getUTCDate()),
    pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()),
  ]
}

Page({
  data: {
    boxId: null,
    loading: true,
    saving: false,

    coverUrl: '',
    coverUploading: false,

    title: '',
    // 原版这里是自由文本输入，很容易填出后端不接受的格式；
    // 原生版拆成日期 + 时间两个 picker，提交时再拼回 "YYYY-MM-DD HH:mm"
    meetingDate: '',
    meetingClock: '',
    today: '',

    location: '',
    city: '',
    district: '',
    feeType: 1,
    feeTypes: constants.FEE_TYPES,

    traits: [],
    traitInput: '',

    expOptions: constants.EXPERIENCE_VALUES,
    /** 选中态 map，key 是 label；提交给后端的也是 label */
    selectedExp: {},
  },

  onLoad: function (options) {
    const now = new Date()
    const pad = function (n) {
      return String(n).padStart(2, '0')
    }
    this.setData({
      boxId: options.id,
      today: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
    })
    this.loadBox()
  },

  loadBox: function () {
    const self = this
    boxApi
      .getBlindBox(this.data.boxId, app.getToken())
      .then(function (res) {
        const box = res.data
        const parts = splitMeetingTime(box.meeting_time_full || box.meeting_time)
        const selectedExp = {}
        ;(box.experience_values || []).forEach(function (label) {
          selectedExp[label] = true
        })

        self.setData({
          loading: false,
          coverUrl: box.cover_image || '',
          title: box.title || '',
          meetingDate: parts[0],
          meetingClock: parts[1],
          location: box.location || '',
          city: box.city || '',
          district: box.district || '',
          feeType: box.fee_type || 1,
          traits: box.expected_traits || [],
          selectedExp: selectedExp,
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1200)
      })
  },

  onInput: function (e) {
    const patch = {}
    patch[e.currentTarget.dataset.field] = e.detail.value
    this.setData(patch)
  },

  onDateChange: function (e) {
    this.setData({ meetingDate: e.detail.value })
  },

  onTimeChange: function (e) {
    this.setData({ meetingClock: e.detail.value })
  },

  onFeeTap: function (e) {
    this.setData({ feeType: Number(e.currentTarget.dataset.value) })
  },

  onPickCover: function () {
    if (this.data.coverUploading) return
    const self = this
    this.setData({ coverUploading: true })
    media
      .chooseAndUpload(app.getToken())
      .then(function (res) {
        self.setData({ coverUrl: res.url })
      })
      .catch(function (err) {
        if (!media.isCancel(err)) {
          wx.showToast({ title: err.message || '上传失败', icon: 'none' })
        }
      })
      .then(function () {
        self.setData({ coverUploading: false })
      })
  },

  onTraitInput: function (e) {
    this.setData({ traitInput: e.detail.value })
  },

  onAddTrait: function () {
    const value = (this.data.traitInput || '').trim()
    if (!value) return
    if (this.data.traits.indexOf(value) !== -1) {
      this.setData({ traitInput: '' })
      return
    }
    this.setData({
      traits: this.data.traits.concat([value]),
      traitInput: '',
    })
  },

  onRemoveTrait: function (e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      traits: this.data.traits.filter(function (item) {
        return item !== value
      }),
    })
  },

  onExpTap: function (e) {
    const label = e.currentTarget.dataset.label
    const selected = Object.assign({}, this.data.selectedExp)
    if (selected[label]) {
      delete selected[label]
    } else {
      selected[label] = true
    }
    this.setData({ selectedExp: selected })
  },

  onSave: function () {
    if (this.data.saving) return
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }
    if (!this.data.location.trim()) {
      wx.showToast({ title: '请填写地点', icon: 'none' })
      return
    }

    const payload = {
      title: this.data.title.trim(),
      location: this.data.location.trim(),
      fee_type: this.data.feeType,
      expected_traits: this.data.traits,
      experience_values: Object.keys(this.data.selectedExp),
    }
    if (this.data.meetingDate && this.data.meetingClock) {
      payload.meeting_time = this.data.meetingDate + ' ' + this.data.meetingClock
    }
    if (this.data.city.trim()) payload.city = this.data.city.trim()
    if (this.data.district.trim()) payload.district = this.data.district.trim()
    if (this.data.coverUrl) payload.cover_image = this.data.coverUrl

    const self = this
    this.setData({ saving: true })
    boxApi
      .updateBlindBox(this.data.boxId, payload, app.getToken())
      .then(function () {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1000)
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ saving: false })
      })
  },
})
