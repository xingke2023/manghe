const format = require('../../utils/format')

/**
 * 盲盒广场卡片。首页列表和「我关注的」横向轮播共用（后者传 compact）。
 *
 * 布局参照参考图：左侧竖版封面（带分类角标）+ 右侧标题/发盒者/时间地点/费用，
 * 分隔线以下是参与者头像叠放行和报名人数。
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
    /** 参与者头像，最多展示 5 个（第 6 个开始只计入人数） */
    applicants: [],
    categoryLabel: '',
  },
  observers: {
    box: function (box) {
      if (!box) return
      this.setData({
        place: format.joinPlace(box.city, box.district, box.location),
        applicants: (box.recent_applicants || []).slice(0, 5),
        // 体验价值的第一项当分类角标用 —— 后端没有独立的分类字段
        categoryLabel: (box.experience_values || [])[0] || '',
      })
    },
  },
  methods: {
    onTap: function () {
      this.triggerEvent('tap', { id: this.data.box && this.data.box.id })
    },
  },
})
