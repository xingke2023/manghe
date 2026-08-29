const app = getApp()

Page({
  data: {
    phone: '',
    loading: false,
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value })
  },

  onLogin: function () {
    const phone = (this.data.phone || '').trim()
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (this.data.loading) return

    const self = this
    this.setData({ loading: true })
    app
      .login({ phone: phone })
      .then(function () {
        wx.switchTab({ url: '/pages/index/index' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '登录失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ loading: false })
      })
  },

  goRegister: function () {
    wx.navigateTo({ url: '/pages/auth/register/index' })
  },
})
