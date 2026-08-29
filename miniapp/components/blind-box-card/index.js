const format = require('../../utils/format')

/**
 * 盲盒广场卡片。首页广场列表和「我关注的」横向轮播共用（后者传 compact）。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    box: { type: Object, value: {} },
    /** 横向轮播里的窄卡样式 */
    compact: { type: Boolean, value: false },
  },
  data: {
    place: '',
  },
  observers: {
    box: function (box) {
      if (!box) return
      this.setData({
        place: format.joinPlace(box.city, box.district, box.location),
      })
    },
  },
  methods: {
    onTap: function () {
      this.triggerEvent('tap', { id: this.data.box && this.data.box.id })
    },
  },
})
