const meApi = require('../../../api/me')

const app = getApp()

Page({
  data: {
    nickname: '',
    gender: 0,
    birthDate: '',
    height: '',
    city: '',
    saving: false,
  },

  /** 通用文本输入，字段名放在 data-field 上 */
  onInput: function (e) {
    const patch = {}
    patch[e.currentTarget.dataset.field] = e.detail.value
    this.setData(patch)
  },

  onGenderTap: function (e) {
    this.setData({ gender: Number(e.currentTarget.dataset.value) })
  },

  onBirthDateChange: function (e) {
    this.setData({ birthDate: e.detail.value })
  },

  onNext: function () {
    if (this.data.saving) return
    if (!this.data.nickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    if (!this.data.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }

    const payload = {
      nickname: this.data.nickname.trim(),
      gender: this.data.gender,
    }
    if (this.data.birthDate) payload.birth_date = this.data.birthDate
    if (this.data.height) payload.height = Number(this.data.height)
    if (this.data.city) payload.city = this.data.city.trim()

    const self = this
    this.setData({ saving: true })
    meApi
      .updateProfile(payload, app.getToken())
      .then(function () {
        wx.navigateTo({ url: '/pages/auth/register-preferences/index' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ saving: false })
      })
  },
})
