const meApi = require('../../../api/me')
const media = require('../../../utils/media')
const constants = require('../../../constants')

const app = getApp()

/**
 * 这一页的头像不是拍照上传，而是从 dicebear 的 24 个确定性种子里挑一个。
 * 注意用的是 9.x（列表页 fallback 用的是 7.x），两套视觉不同，原版如此。
 */
function dicebearUrl(seed) {
  return (
    'https://api.dicebear.com/9.x/open-peeps/svg?seed=' +
    seed +
    '&backgroundColor=ffd6c8,fce4d6,fff0e8,e8f4ff,d6f0e8,f0e8ff'
  )
}

const SEED_OFFSETS = [
  0, 7, 13, 21, 37, 42, 55, 68, 74, 81, 99, 103, 117, 128, 136, 145, 157, 163, 172,
  189, 204, 213, 227, 238,
]

function buildSeedList(userId) {
  return SEED_OFFSETS.map(function (offset) {
    const seed = userId + offset
    return { seed: seed, url: dicebearUrl(seed) }
  })
}

/** 数组转成 {值: true} 的 map，方便 WXML 里判断选中 */
function toMap(list) {
  const map = {}
  ;(list || []).forEach(function (item) {
    map[item] = true
  })
  return map
}

Page({
  data: {
    loading: true,
    saving: false,

    userId: 0,
    // 当前生效的种子；没选过就用 userId 本身
    currentSeed: 0,
    /** 弹层里高亮但还没点"确定使用"的种子 */
    pendingSeed: 0,
    /** 用户是否在本次编辑里挑过头像（决定要不要提交 avatar_url） */
    seedPicked: false,
    avatarUrl: '',
    showAvatarPicker: false,
    seedList: [],

    nickname: '',
    gender: 0,
    age: '',
    height: '',
    city: '',
    aboutMe: '',

    purposeOptions: constants.DATING_PURPOSES,
    selectedPurposes: {},
    targetGender: 0,

    interestOptions: constants.INTERESTS_OPTIONS,
    selectedInterests: {},
    customInterest: '',

    photos: [],
    uploading: false,

    occupation: '',
    company: '',
    school: '',
    education: '',
    annualIncome: '',
    educationOptions: constants.EDUCATION_OPTIONS,
    incomeOptions: constants.INCOME_OPTIONS,
  },

  onLoad: function () {
    this.loadProfile()
  },

  loadProfile: function () {
    const self = this
    meApi
      .getMyProfile(app.getToken())
      .then(function (res) {
        const user = res.user || {}
        const p = user.profile || {}
        const userId = user.id || 0
        const interests = p.interests || []

        // 自定义兴趣（不在预设里的）要补进选项列表，否则渲染不出来
        const options = constants.INTERESTS_OPTIONS.slice()
        interests.forEach(function (item) {
          if (options.indexOf(item) === -1) options.push(item)
        })

        self.setData({
          loading: false,
          userId: userId,
          currentSeed: userId,
          pendingSeed: userId,
          avatarUrl: user.avatar_url || dicebearUrl(userId),
          seedList: buildSeedList(userId),

          nickname: user.nickname || '',
          gender: user.gender || 0,
          age: user.age ? String(user.age) : '',
          height: user.height ? String(user.height) : '',
          city: user.city || '',
          aboutMe: p.about_me || '',

          selectedPurposes: toMap(p.dating_purposes),
          targetGender: p.target_gender || 0,

          interestOptions: options,
          selectedInterests: toMap(interests),

          photos: p.interest_photos || [],

          occupation: p.occupation || '',
          company: p.company || '',
          school: p.school || '',
          education: p.education || '',
          annualIncome: p.annual_income || '',
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  onInput: function (e) {
    const patch = {}
    patch[e.currentTarget.dataset.field] = e.detail.value
    this.setData(patch)
  },

  onAboutMeInput: function (e) {
    this.setData({ aboutMe: e.detail.value })
  },

  onGenderTap: function (e) {
    this.setData({ gender: Number(e.currentTarget.dataset.value) })
  },

  onTargetGenderTap: function (e) {
    this.setData({ targetGender: Number(e.currentTarget.dataset.value) })
  },

  onPurposeTap: function (e) {
    const value = e.currentTarget.dataset.value
    const selected = Object.assign({}, this.data.selectedPurposes)
    if (selected[value]) delete selected[value]
    else selected[value] = true
    this.setData({ selectedPurposes: selected })
  },

  onInterestTap: function (e) {
    const value = e.currentTarget.dataset.value
    const selected = Object.assign({}, this.data.selectedInterests)
    if (selected[value]) delete selected[value]
    else selected[value] = true
    this.setData({ selectedInterests: selected })
  },

  onCustomInterestInput: function (e) {
    this.setData({ customInterest: e.detail.value })
  },

  onAddCustomInterest: function () {
    const value = (this.data.customInterest || '').trim()
    if (!value) return
    if (this.data.interestOptions.indexOf(value) !== -1) {
      this.setData({ customInterest: '' })
      return
    }
    const selected = Object.assign({}, this.data.selectedInterests)
    selected[value] = true
    this.setData({
      interestOptions: this.data.interestOptions.concat([value]),
      selectedInterests: selected,
      customInterest: '',
    })
  },

  // 学历 / 收入是单选，再点一次取消
  onEducationTap: function (e) {
    const value = e.currentTarget.dataset.value
    this.setData({ education: this.data.education === value ? '' : value })
  },

  onIncomeTap: function (e) {
    const value = e.currentTarget.dataset.value
    this.setData({ annualIncome: this.data.annualIncome === value ? '' : value })
  },

  // —— 相册 ——

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
    const photos = this.data.photos.slice()
    photos.splice(Number(e.currentTarget.dataset.index), 1)
    this.setData({ photos: photos })
  },

  onPreviewPhoto: function (e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.photos,
    })
  },

  // —— 头像选择 ——

  onOpenAvatarPicker: function () {
    this.setData({ showAvatarPicker: true, pendingSeed: this.data.currentSeed })
  },

  onSeedTap: function (e) {
    this.setData({ pendingSeed: Number(e.currentTarget.dataset.seed) })
  },

  onConfirmAvatar: function () {
    this.setData({
      currentSeed: this.data.pendingSeed,
      avatarUrl: dicebearUrl(this.data.pendingSeed),
      seedPicked: true,
      showAvatarPicker: false,
    })
  },

  onCloseAvatarPicker: function () {
    this.setData({ showAvatarPicker: false })
  },

  // —— 保存 ——

  onSave: function () {
    if (this.data.saving) return

    const payload = {
      nickname: this.data.nickname.trim(),
      gender: this.data.gender,
      city: this.data.city.trim(),
      about_me: this.data.aboutMe,
      dating_purposes: Object.keys(this.data.selectedPurposes),
      target_gender: this.data.targetGender,
      interests: Object.keys(this.data.selectedInterests),
      interest_photos: this.data.photos,
      occupation: this.data.occupation.trim(),
      company: this.data.company.trim(),
      school: this.data.school.trim(),
      education: this.data.education,
      annual_income: this.data.annualIncome,
    }
    if (this.data.age) payload.age = Number(this.data.age)
    if (this.data.height) payload.height = Number(this.data.height)
    // 只有本次真的挑过头像才提交，避免把 dicebear 兜底地址写进库里
    if (this.data.seedPicked) payload.avatar_url = this.data.avatarUrl

    const self = this
    this.setData({ saving: true })
    meApi
      .updateProfile(payload, app.getToken())
      .then(function () {
        // 顺手刷新全局缓存的 user，"我的"页立刻能看到新昵称/头像
        app.refreshUser().catch(function () {})
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

  goPreview: function () {
    wx.navigateTo({ url: '/pages/profile/preview/index' })
  },
})
