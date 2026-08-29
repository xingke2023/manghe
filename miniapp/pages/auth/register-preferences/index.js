const meApi = require('../../../api/me')

const app = getApp()

const PURPOSE_OPTIONS = ['找兴趣搭子', '脱单', 'Dating', '婚恋']

Page({
  data: {
    purposeOptions: PURPOSE_OPTIONS,
    /** 用 map 存选中态，WXML 里直接 selectedPurposes[item] 取，省掉 indexOf */
    selectedPurposes: {},
    targetGender: 0,
    ageMin: 18,
    ageMax: 36,
    saving: false,
  },

  onPurposeTap: function (e) {
    const value = e.currentTarget.dataset.value
    const selected = Object.assign({}, this.data.selectedPurposes)
    if (selected[value]) {
      delete selected[value]
    } else {
      selected[value] = true
    }
    this.setData({ selectedPurposes: selected })
  },

  onTargetGenderTap: function (e) {
    this.setData({ targetGender: Number(e.currentTarget.dataset.value) })
  },

  // 两个滑块互相夹紧：最小不能超过最大，反之同理
  onAgeMinChange: function (e) {
    const value = e.detail.value
    this.setData({
      ageMin: value,
      ageMax: Math.max(value, this.data.ageMax),
    })
  },

  onAgeMaxChange: function (e) {
    const value = e.detail.value
    this.setData({
      ageMax: value,
      ageMin: Math.min(value, this.data.ageMin),
    })
  },

  onNext: function () {
    if (this.data.saving) return
    const purposes = Object.keys(this.data.selectedPurposes)
    if (!purposes.length) {
      wx.showToast({ title: '请选择找搭子的目的', icon: 'none' })
      return
    }
    if (!this.data.targetGender) {
      wx.showToast({ title: '请选择对象属性', icon: 'none' })
      return
    }

    const self = this
    this.setData({ saving: true })
    meApi
      .updateProfile(
        {
          dating_purposes: purposes,
          target_gender: this.data.targetGender,
          target_age_min: this.data.ageMin,
          target_age_max: this.data.ageMax,
        },
        app.getToken()
      )
      .then(function () {
        wx.navigateTo({ url: '/pages/auth/register-interests/index' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ saving: false })
      })
  },
})
