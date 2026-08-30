const boxApi = require('../../api/blind-boxes')
const meApi = require('../../api/me')

const app = getApp()

const CATEGORIES = ['美食探索', '文艺沉浸', '技能交换', '观影交流', '深度对话']

Page({
  data: {
    isLoggedIn: false,
    activeTab: 'plaza',

    // 筛选
    categories: CATEGORIES,
    category: '',
    sort: '',
    city: '',

    // 广场列表
    boxes: [],
    loading: false,
    page: 1,
    hasMore: true,

    // 每日拆盒配额
    quota: null,

    // 我关注的
    followingGroups: [],
    followingLoading: false,
    followingError: '',
  },

  onLoad: function () {
    this.setData({ isLoggedIn: app.isLoggedIn() })
    this.loadQuota()
    this.loadBoxes(1)
  },

  onShow: function () {
    const loggedIn = app.isLoggedIn()
    // 登录态可能在别的页面变了（登录/登出），刷新一次
    if (loggedIn !== this.data.isLoggedIn) {
      this.setData({ isLoggedIn: loggedIn })
      this.loadQuota()
      this.loadBoxes(1)
    }
  },

  onPullDownRefresh: function () {
    const self = this
    const done = function () {
      wx.stopPullDownRefresh()
    }
    this.loadQuota()
    if (this.data.activeTab === 'plaza') {
      this.loadBoxes(1).then(done, done)
    } else {
      this.loadFollowing().then(done, done)
    }
  },

  onReachBottom: function () {
    if (this.data.activeTab !== 'plaza') return
    if (this.data.loading || !this.data.hasMore) return
    this.loadBoxes(this.data.page + 1)
  },

  onShareAppMessage: function () {
    return {
      title: '搭子盲盒 — 拆盒遇见有趣的人',
      path: '/pages/index/index',
    }
  },

  // —— 数据加载 ——

  loadQuota: function () {
    if (!app.isLoggedIn()) {
      this.setData({ quota: null })
      return
    }
    const self = this
    meApi
      .getDailyViews(app.getToken())
      .then(function (res) {
        self.setData({ quota: res })
      })
      .catch(function () {
        self.setData({ quota: null })
      })
  },

  /**
   * @param {number} page 第 1 页会替换列表，其余页追加
   */
  loadBoxes: function (page) {
    const self = this
    const isFirst = page === 1
    this.setData({ loading: true })

    const params = {
      page: page,
      category: this.data.category || undefined,
      sort: this.data.sort || undefined,
      city: this.data.city || undefined,
    }

    return boxApi
      .getBlindBoxes(params, app.getToken() || null)
      .then(function (res) {
        const list = res.data || []
        // 后端走的是 Laravel 标准资源分页，页码在 meta 里而不是顶层。
        // （Taro 版按顶层 current_page 读，取到 undefined，翻页是坏的）
        const meta = res.meta || res
        const currentPage = meta.current_page || page
        const lastPage = meta.last_page || currentPage

        self.setData({
          boxes: isFirst ? list : self.data.boxes.concat(list),
          page: currentPage,
          hasMore: currentPage < lastPage,
          loading: false,
        })
      })
      .catch(function (err) {
        self.setData({ loading: false })
        if (isFirst) self.setData({ boxes: [] })
        wx.showToast({ title: err.message || '加载失败', icon: 'none' })
      })
  },

  loadFollowing: function () {
    if (!app.isLoggedIn()) {
      this.setData({ followingGroups: [], followingError: '登录后可查看关注的发盒者' })
      return Promise.resolve()
    }
    const self = this
    this.setData({ followingLoading: true, followingError: '' })
    return boxApi
      .getFollowingBoxes(app.getToken())
      .then(function (res) {
        self.setData({
          followingGroups: res.data || [],
          followingLoading: false,
        })
      })
      .catch(function (err) {
        // 关注功能是会员专属，非会员这里会拿到 403，把后端文案透出来
        self.setData({
          followingGroups: [],
          followingLoading: false,
          followingError: err.message || '',
        })
      })
  },

  // —— 交互 ——

  onTabTap: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    if (tab === 'following' && !this.data.followingGroups.length) {
      this.loadFollowing()
    }
  },

  onCategoryTap: function (e) {
    const value = e.currentTarget.dataset.value
    // 再点一次取消选中
    this.setData({ category: this.data.category === value ? '' : value })
    this.loadBoxes(1)
  },

  onSortTap: function () {
    this.setData({ sort: this.data.sort === 'meeting_time' ? '' : 'meeting_time' })
    this.loadBoxes(1)
  },

  /** 地区筛选：从 filter-options 拉城市列表，用 actionSheet 选 */
  onCityTap: function () {
    const self = this
    boxApi
      .getFilterOptions()
      .then(function (res) {
        const cities = (res.cities || []).filter(Boolean)
        if (!cities.length) {
          wx.showToast({ title: '暂无可筛选的城市', icon: 'none' })
          return
        }
        const items = self.data.city ? ['全部城市'].concat(cities) : cities
        wx.showActionSheet({
          itemList: items,
          success: function (r) {
            const picked = items[r.tapIndex]
            self.setData({ city: picked === '全部城市' ? '' : picked })
            self.loadBoxes(1)
          },
          fail: function () {},
        })
      })
      .catch(function (err) {
        wx.showToast({ title: err.message || '获取城市失败', icon: 'none' })
      })
  },

  onResetFilters: function () {
    this.setData({ category: '', sort: '', city: '' })
    this.loadBoxes(1)
  },

  onBoxTap: function (e) {
    const id = e.detail.id
    if (!id) return
    wx.navigateTo({ url: '/pages/blind-box/detail/index?id=' + id })
  },

  onCreatorTap: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/profile/other/index?userId=' + id })
  },

  goPublish: function () {
    wx.navigateTo({ url: '/pages/publish/index/index' })
  },
})
