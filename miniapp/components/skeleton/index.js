/**
 * 列表骨架屏。Taro 版在 12 个列表页里逐个手写了 animate-pulse 占位块，
 * 这里收敛成一个组件，用 count 控制条数、type 控制形态。
 */
Component({
  options: { addGlobalClass: true },
  properties: {
    count: { type: Number, value: 3 },
    /** 'card' 缩略图形态 | 'row' 圆头像形态 */
    type: { type: String, value: 'card' },
  },
  data: {
    repeatList: [0, 1, 2],
  },
  observers: {
    count: function (count) {
      const list = []
      for (let i = 0; i < count; i++) list.push(i)
      this.setData({ repeatList: list })
    },
  },
})
