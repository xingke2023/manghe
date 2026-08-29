/**
 * 各页面共用的选项常量，按 Taro 版逐字抄录。
 *
 * 注意几处原版就存在的不一致，这里如实保留，不做统一：
 *   - 注册页的兴趣是 12 项带 emoji，资料编辑页是另一套 10 项无 emoji，
 *     且同一个意思用词不同（热衷乐器 / 热爱乐器、撸铁 / 力量撸铁）
 *   - 提交给后端的都是 label 纯文本，emoji 只用于展示
 */

/** 注册第三步的兴趣选项（emoji 仅展示，入库只存 label） */
const PRESET_INTERESTS = [
  { emoji: '🎸', label: '热衷乐器' },
  { emoji: '⛺', label: '野餐露营' },
  { emoji: '🏋️', label: '撸铁' },
  { emoji: '🎭', label: '话剧脱口秀' },
  { emoji: '🧋', label: '甜度满载奶茶' },
  { emoji: '🪁', label: '放风筝' },
  { emoji: '🏊', label: '健身游泳' },
  { emoji: '📷', label: '拍美照' },
  { emoji: '🚵', label: '挑战极限运动' },
  { emoji: '🎮', label: '电竞游戏' },
  { emoji: '🍳', label: '下厨做饭' },
  { emoji: '🎵', label: '音乐达人' },
]

/** 资料编辑页的兴趣选项（与上面是两套，原版如此） */
const INTERESTS_OPTIONS = [
  '热爱乐器',
  '野餐露营',
  '力量撸铁',
  '话剧脱口秀',
  '甜度满载奶茶',
  '放风筝',
  '健身游泳',
  '拍美照',
  '挑战极限运动',
  '吃饭',
]

/** 发盒 / 编辑盒里的「体验价值」，入库只存 label */
const EXPERIENCE_VALUES = [
  { emoji: '🎸', label: '热衷乐器' },
  { emoji: '⛺', label: '野餐露营' },
  { emoji: '💪', label: '撸铁' },
  { emoji: '🎭', label: '话剧脱口秀' },
  { emoji: '🧋', label: '甜度满载奶茶' },
  { emoji: '🪁', label: '放风筝' },
  { emoji: '🏊', label: '健身游泳' },
  { emoji: '📷', label: '拍美照' },
  { emoji: '🍜', label: '美食探索' },
  { emoji: '🎬', label: '观影交流' },
  { emoji: '💬', label: '深度对话' },
  { emoji: '🔧', label: '技能交换' },
]

const DATING_PURPOSES = ['找兴趣搭子', '脱单', 'Dating', '婚恋']
const EDUCATION_OPTIONS = ['高中及以下', '大专', '本科', '硕士', '博士']
const INCOME_OPTIONS = ['5万以下', '5-10万', '10-20万', '20-50万', '50万以上']

/** 首页广场的分类筛选 */
const CATEGORIES = ['美食探索', '文艺沉浸', '技能交换', '观影交流', '深度对话']

/** 费用类型：1 AA制 / 2 我请客 */
const FEE_TYPES = [
  { value: 1, label: 'AA制' },
  { value: 2, label: '我请客' },
]

module.exports = {
  PRESET_INTERESTS,
  INTERESTS_OPTIONS,
  EXPERIENCE_VALUES,
  DATING_PURPOSES,
  EDUCATION_OPTIONS,
  INCOME_OPTIONS,
  CATEGORIES,
  FEE_TYPES,
}
