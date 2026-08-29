/**
 * 空列表占位。Taro 版每个列表页都手写一遍「大 emoji + 灰字」，这里统一。
 */
Component({
  options: {
    // 让外部页面的 .empty / .empty-icon 等全局类作用到组件内部
    addGlobalClass: true,
  },
  properties: {
    icon: { type: String, value: '📭' },
    text: { type: String, value: '暂无内容' },
    /** 第二行更浅的提示文案，可选 */
    hint: { type: String, value: '' },
    /** 填了就渲染一个按钮，点击 triggerEvent('action') */
    action: { type: String, value: '' },
  },
  methods: {
    onAction: function () {
      this.triggerEvent('action')
    },
  },
})
