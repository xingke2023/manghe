const format = require('../../utils/format')

/**
 * 头像。没有 src 时按 userId 回落到 dicebear 卡通头像。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    src: { type: String, value: '' },
    userId: { type: null, value: 0 },
    /** 边长，单位 rpx */
    size: { type: Number, value: 96 },
  },
  data: {
    resolved: '',
  },
  observers: {
    'src, userId': function (src, userId) {
      this.setData({ resolved: format.getAvatarUrl(userId, src) })
    },
  },
})
