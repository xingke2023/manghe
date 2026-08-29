const publishApi = require('../../../api/publish')

const app = getApp()

/**
 * 发布流程的入口网关，本身没有 UI，只负责按前置条件分流：
 *   未登录            → 登录页
 *   价值观测试未通过   → 测试页（待人工审核则去结果页）
 *   已通过但没交押金   → 押金页
 *   都齐了            → 创建页
 */
Page({
  onShow: function () {
    if (!app.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/auth/login/index' })
      return
    }

    publishApi
      .getPublishStatus(app.getToken())
      .then(function (res) {
        const status = res.value_test_status

        if (status !== 1) {
          if (status === 2) {
            wx.redirectTo({
              url: '/pages/publish/value-test-result/index?status=pending',
            })
          } else {
            wx.redirectTo({ url: '/pages/publish/value-test/index' })
          }
          return
        }

        if (!res.has_deposit) {
          wx.redirectTo({ url: '/pages/publish/deposit/index' })
          return
        }

        wx.redirectTo({ url: '/pages/publish/create/index' })
      })
      .catch(function () {
        // 查不到状态就从测试走一遍，与 Taro 版一致
        wx.redirectTo({ url: '/pages/publish/value-test/index' })
      })
  },
})
