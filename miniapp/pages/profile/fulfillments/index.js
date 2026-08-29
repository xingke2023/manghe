const fulfillmentApi = require('../../../api/fulfillment')
const format = require('../../../utils/format')

const app = getApp()

/** fulfill_status: 0 未结算 / 1 完美履约 / 2 我失约 / 3 对方失约 */
const RESULT_BADGE = {
  1: { label: '完美履约 🎉', cls: 'tag-result-perfect' },
  2: { label: '我失约', cls: 'tag-result-mine' },
  3: { label: '对方失约', cls: 'tag-result-other' },
}

/** 结算说明。status 3 的文案随角色不同 */
function resultDetail(status, role) {
  if (status === 1) {
    return {
      text: '约会圆满完成，保证金已退还',
      hint: '期待你们的下一次相遇',
      cls: 'ff-detail-green',
      textCls: 'ff-detail-text-green',
    }
  }
  if (status === 2) {
    return {
      text: '您未按时赴约，防鸽费已扣除',
      hint: '下次一定要守时哦！',
      cls: 'ff-detail-red',
      textCls: 'ff-detail-text-red',
    }
  }
  if (status === 3) {
    return {
      text: role === 'applicant' ? '发盒者未赴约，已获得补偿' : '拆盒者未赴约',
      hint: role === 'applicant' ? '如有异议可点击申诉按钮' : '对方的防鸽费已处理',
      cls: 'ff-detail-orange',
      textCls: 'ff-detail-text-orange',
    }
  }
  return null
}

/**
 * 把接口原始数据加工成 WXML 直接可用的形状。
 * WXML 里写不了复杂条件，所以四个互斥的操作按钮在这里先算成布尔量：
 *   can_appeal     已结算 + 对方失约 + 我打过卡 → 可申诉
 *   can_scan       未结算 + 我是发盒者         → 扫对方的码核销
 *   can_show_code  未结算 + 我是报名者 + 已打卡 → 出示见面码
 *   can_checkin    未结算 + 我是报名者 + 未打卡 → 先打卡
 */
function decorate(item) {
  const isSettled = item.fulfill_status > 0
  const isCreator = item.role === 'creator'
  const badge = RESULT_BADGE[item.fulfill_status]
  const detail = isSettled ? resultDetail(item.fulfill_status, item.role) : null

  return Object.assign({}, item, {
    role_label: isCreator ? '我发布的' : '我参与的',
    role_class: isCreator ? 'tag-role-creator' : 'tag-role-applicant',
    result_badge_label: badge ? badge.label : '',
    result_badge_class: badge ? badge.cls : '',
    result_detail_text: detail ? detail.text : '',
    result_detail_hint: detail ? detail.hint : '',
    result_detail_class: detail ? detail.cls : '',
    result_detail_text_class: detail ? detail.textCls : '',
    place: format.joinPlace(item.city, item.district, item.location),

    can_appeal: isSettled && item.fulfill_status === 3 && item.has_checked_in,
    can_scan: !isSettled && isCreator,
    can_show_code: !isSettled && !isCreator && item.has_checked_in,
    can_checkin: !isSettled && !isCreator && !item.has_checked_in,
  })
}

Page({
  data: {
    items: [],
    loading: true,

    // 见面码弹窗
    qrCode: '',
    qrValidUntil: '',

    // 申诉弹层
    appealIndex: null,
    appealReason: '',
    appealValid: false,
    appealSubmitting: false,
  },

  onShow: function () {
    this.loadItems()
  },

  onPullDownRefresh: function () {
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadItems().then(done, done)
  },

  loadItems: function () {
    const self = this
    this.setData({ loading: true })
    return fulfillmentApi
      .getFulfillments(app.getToken())
      .then(function (res) {
        self.setData({
          items: (res.data || []).map(decorate),
          loading: false,
        })
      })
      .catch(function (err) {
        self.setData({ items: [], loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  // —— GPS 打卡（报名方，需在约会地点 300m 内）——

  onCheckin: function (e) {
    const boxId = e.currentTarget.dataset.boxId
    const self = this
    wx.showLoading({ title: '定位中...', mask: true })
    fulfillmentApi
      .submitCheckin(boxId, app.getToken())
      .then(function (res) {
        wx.hideLoading()
        wx.showToast({ title: res.message || '打卡成功', icon: 'none' })
        if (res.is_valid) self.loadItems()
      })
      .catch(function (err) {
        wx.hideLoading()
        const raw = err.message || ''
        // 定位权限被拒和"超出范围"是两回事，前者给更明确的指引
        const msg = /auth|permission|deny/i.test(raw)
          ? '定位失败，请开启定位权限'
          : raw || '打卡失败'
        wx.showToast({ title: msg, icon: 'none' })
      })
  },

  // —— 出示见面码（报名方）——

  onGenerateCode: function (e) {
    const item = this.data.items[Number(e.currentTarget.dataset.index)]
    if (!item) return
    const self = this
    fulfillmentApi
      .generateMeetingCode(item.box_id, app.getToken())
      .then(function (res) {
        self.setData({
          qrCode: res.qr_code || '',
          qrValidUntil: res.valid_until || '',
        })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '生成失败，请先完成打卡', icon: 'none' })
      })
  },

  onCloseQr: function () {
    this.setData({ qrCode: '', qrValidUntil: '' })
  },

  // —— 扫码核销（发盒方）——

  onScan: function (e) {
    const boxId = e.currentTarget.dataset.boxId
    const self = this
    fulfillmentApi
      .verifyMeetingCode(boxId, app.getToken())
      .then(function (res) {
        wx.showToast({ title: res.message || '核销成功', icon: 'none' })
        if (res.is_valid) self.loadItems()
      })
      .catch(function (err) {
        // 用户主动取消扫码不算错误
        if (/cancel/i.test(err.message || '')) return
        wx.showToast({ title: err.message || '核销失败', icon: 'none' })
      })
  },

  // —— 申诉 ——

  onOpenAppeal: function (e) {
    this.setData({
      appealIndex: Number(e.currentTarget.dataset.index),
      appealReason: '',
      appealValid: false,
    })
  },

  onCloseAppeal: function () {
    this.setData({ appealIndex: null, appealReason: '', appealValid: false })
  },

  onAppealInput: function (e) {
    const value = e.detail.value
    this.setData({
      appealReason: value,
      // 后端要求 10~500 字
      appealValid: value.trim().length >= 10,
    })
  },

  onSubmitAppeal: function () {
    if (!this.data.appealValid) {
      wx.showToast({ title: '请至少填写 10 个字', icon: 'none' })
      return
    }
    if (this.data.appealSubmitting) return

    const item = this.data.items[this.data.appealIndex]
    if (!item) return

    const self = this
    this.setData({ appealSubmitting: true })
    fulfillmentApi
      .submitAppeal(item.box_id, this.data.appealReason.trim(), app.getToken())
      .then(function (res) {
        wx.showToast({ title: res.message || '申诉已提交', icon: 'none' })
        self.onCloseAppeal()
        self.loadItems()
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ appealSubmitting: false })
      })
  },
})
