const publishApi = require('../../../api/publish')
const meApi = require('../../../api/me')
const media = require('../../../utils/media')
const constants = require('../../../constants')
const format = require('../../../utils/format')

const app = getApp()

/** 草稿存 storage，由 preview 页读出来提交（与 Taro 版一致） */
const DRAFT_KEY = 'publish_draft'

Page({
  data: {
    step: 'voucher',

    // 凭证
    vouchers: [],
    vouchersLoading: true,
    selectedCode: '',
    voucherError: '',
    voucherLoading: false,

    // 表单
    coverUrl: '',
    coverUploading: false,
    title: '',
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
    selectedExp: {},
    agreed: false,
    canSubmit: false,
  },

  onLoad: function () {
    const now = new Date()
    const pad = function (n) {
      return String(n).padStart(2, '0')
    }
    this.setData({
      today: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
    })
    this.loadVouchers()
  },

  // —— 第一步：凭证 ——

  loadVouchers: function () {
    const self = this
    meApi
      .getMyVouchers(app.getToken())
      .then(function (res) {
        // 只有 status 1（未使用）的能拿来发盒
        const list = (res.vouchers || [])
          .filter(function (v) {
            return v.status === 1
          })
          .map(function (v) {
            return Object.assign({}, v, {
              valid_text: format.formatDate(v.valid_until),
            })
          })
        self.setData({ vouchers: list, vouchersLoading: false })
      })
      .catch(function (err) {
        self.setData({ vouchers: [], vouchersLoading: false })
        wx.showToast({ title: err.message || '加载凭证失败', icon: 'none' })
      })
  },

  onSelectVoucher: function (e) {
    this.setData({
      selectedCode: e.currentTarget.dataset.code,
      voucherError: '',
    })
  },

  onRedeem: function () {
    if (!this.data.selectedCode || this.data.voucherLoading) return
    const self = this
    this.setData({ voucherLoading: true, voucherError: '' })
    publishApi
      .redeemVoucher(this.data.selectedCode, app.getToken())
      .then(function () {
        self.setData({ step: 'form', voucherLoading: false })
      })
      .catch(function (err) {
        self.setData({
          voucherError: err.message || '核销失败，请换一张凭证',
          voucherLoading: false,
        })
      })
  },

  // —— 第二步：表单 ——

  onInput: function (e) {
    const patch = {}
    patch[e.currentTarget.dataset.field] = e.detail.value
    this.setData(patch)
    this.refreshCanSubmit()
  },

  onDateChange: function (e) {
    this.setData({ meetingDate: e.detail.value })
    this.refreshCanSubmit()
  },

  onTimeChange: function (e) {
    this.setData({ meetingClock: e.detail.value })
    this.refreshCanSubmit()
  },

  onFeeTap: function (e) {
    this.setData({ feeType: Number(e.currentTarget.dataset.value) })
  },

  onToggleAgree: function () {
    this.setData({ agreed: !this.data.agreed })
    this.refreshCanSubmit()
  },

  /** 标题 + 日期 + 时间 + 地点 + 勾选协议 全齐才能进预览 */
  refreshCanSubmit: function () {
    const d = this.data
    this.setData({
      canSubmit: !!(
        d.title.trim() &&
        d.meetingDate &&
        d.meetingClock &&
        d.location.trim() &&
        d.agreed
      ),
    })
  },

  onPickCover: function () {
    if (this.data.coverUploading) return
    const self = this
    this.setData({ coverUploading: true })
    publishApi
      .uploadCoverImage(app.getToken())
      .then(function (url) {
        self.setData({ coverUrl: url })
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
    this.setData({ traits: this.data.traits.concat([value]), traitInput: '' })
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
    if (selected[label]) delete selected[label]
    else selected[label] = true
    this.setData({ selectedExp: selected })
  },

  /** 不直接建盒，先把草稿写进 storage，交给 preview 页确认后再提交 */
  onPreview: function () {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请填完必填项并勾选协议', icon: 'none' })
      return
    }
    const d = this.data
    const draft = {
      cover_image: d.coverUrl || '',
      title: d.title.trim(),
      meeting_time: d.meetingDate + ' ' + d.meetingClock,
      location: d.location.trim(),
      city: d.city.trim(),
      district: d.district.trim(),
      fee_type: d.feeType,
      expected_traits: d.traits,
      experience_values: Object.keys(d.selectedExp),
    }
    wx.setStorageSync(DRAFT_KEY, JSON.stringify(draft))
    wx.navigateTo({ url: '/pages/publish/preview/index' })
  },
})
