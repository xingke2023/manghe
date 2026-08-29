const meApi = require('../../../api/me')
const media = require('../../../utils/media')
const constants = require('../../../constants')

const app = getApp()

Page({
  data: {
    aboutMe: '',
    /**
     * 预设选项（{emoji, label}）+ 自定义标签（{emoji:'', label}）。
     * emoji 仅用于展示，提交给后端的 interests 只含 label。
     */
    options: constants.PRESET_INTERESTS,
    /** 选中态 map，key 是 label */
    selected: {},
    showTagInput: false,
    customTag: '',
    photos: [],
    uploading: false,
    saving: false,
  },

  onAboutMeInput: function (e) {
    this.setData({ aboutMe: e.detail.value })
  },

  onInterestTap: function (e) {
    const label = e.currentTarget.dataset.label
    const selected = Object.assign({}, this.data.selected)
    if (selected[label]) {
      delete selected[label]
    } else {
      selected[label] = true
    }
    this.setData({ selected: selected })
  },

  onShowTagInput: function () {
    this.setData({ showTagInput: true, customTag: '' })
  },

  onCustomTagInput: function (e) {
    this.setData({ customTag: e.detail.value })
  },

  /** 新增自定义标签并自动选中 */
  onConfirmTag: function () {
    const label = (this.data.customTag || '').trim()
    if (!label) {
      this.setData({ showTagInput: false })
      return
    }
    const exists = this.data.options.some(function (item) {
      return item.label === label
    })
    if (exists) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      this.setData({ showTagInput: false, customTag: '' })
      return
    }
    const selected = Object.assign({}, this.data.selected)
    selected[label] = true
    this.setData({
      options: this.data.options.concat([{ emoji: '', label: label }]),
      selected: selected,
      showTagInput: false,
      customTag: '',
    })
  },

  onAddPhoto: function () {
    if (this.data.uploading) return
    const self = this
    this.setData({ uploading: true })
    media
      .chooseAndUpload(app.getToken())
      .then(function (res) {
        self.setData({ photos: self.data.photos.concat([res.url]) })
      })
      .catch(function (err) {
        if (!media.isCancel(err)) {
          wx.showToast({ title: err.message || '上传失败', icon: 'none' })
        }
      })
      .then(function () {
        self.setData({ uploading: false })
      })
  },

  onRemovePhoto: function (e) {
    const index = Number(e.currentTarget.dataset.index)
    const photos = this.data.photos.slice()
    photos.splice(index, 1)
    this.setData({ photos: photos })
  },

  onPreviewPhoto: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photos,
    })
  },

  onFinish: function () {
    if (this.data.saving) return
    const self = this
    this.setData({ saving: true })
    meApi
      .updateProfile(
        {
          about_me: this.data.aboutMe,
          interests: Object.keys(this.data.selected),
          interest_photos: this.data.photos,
        },
        app.getToken()
      )
      .then(function () {
        wx.navigateTo({ url: '/pages/auth/register-success/index' })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .then(function () {
        self.setData({ saving: false })
      })
  },
})
