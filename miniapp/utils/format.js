/**
 * 纯函数工具，从 Taro 版 lib/utils.ts 平移（原本就不依赖 Taro）。
 */

/**
 * 头像地址。用户没设头像时回落到 dicebear 按 id 生成的卡通头像。
 *
 * 注意：dicebear 是外域图片，开发者工具关掉 urlCheck 能显示，
 * 真机需要在小程序后台把 api.dicebear.com 加进 downloadFile 域名白名单。
 */
function getAvatarUrl(userId, avatarUrl) {
  if (avatarUrl) return avatarUrl
  return 'https://api.dicebear.com/7.x/open-peeps/svg?seed=' + userId
}

/**
 * 安全解析后端返回的时间字符串。
 *
 * 后端混用了三种格式，这里都要吃下：
 *   "2026-08-29T12:00:00+08:00"      toIso8601String()
 *   "2026-08-29T10:19:41.000000Z"    toISOString()，6 位微秒（部分 JS 引擎不接受）
 *   "2026-08-29 12:00:00"            纯 datetime，iOS 的 Date 不认带空格的形式
 *
 * 同时后端很多列表字段是**已经格式化好的展示串**（"8-29"、"08-29 14:32"），
 * 这些没有年份，交给 Date 会被猜成 2001 年，必须直接判为不可解析 —— 否则
 * 相对时间会算出"9000天前"这种离谱结果。
 *
 * 另外别对 ISO 串做 '-'→'/' 替换，那会让它彻底解析不了。
 */
function parseDate(dateStr) {
  if (!dateStr) return null
  let str = String(dateStr).trim()

  // 必须以 4 位年份开头，否则认定是展示串，不解析
  if (!/^\d{4}[-/]/.test(str)) return null

  if (str.indexOf('T') !== -1) {
    // 微秒截成毫秒，否则 iOS 上会得到 Invalid Date
    str = str.replace(/(\.\d{3})\d+/, '$1')
  } else if (str.indexOf(' ') !== -1) {
    // "2026-08-29 12:00:00" → "2026/08/29 12:00:00"
    str = str.replace(/-/g, '/')
  }

  const date = new Date(str)
  return isNaN(date.getTime()) ? null : date
}

/** 相对时间：刚刚 / n分钟前 / n小时前 / n天前 / M/D */
function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = parseDate(dateStr)
  // 后端有些列表字段已经是 "8-29" / "08-29 14:32" 这类展示串，解析不了就原样返回
  if (!date) return String(dateStr)

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + '小时前'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + '天前'
  return date.getMonth() + 1 + '/' + date.getDate()
}

/** YYYY-MM-DD */
function formatDate(dateStr) {
  const date = parseDate(dateStr)
  if (!date) return ''
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return date.getFullYear() + '-' + m + '-' + d
}

/**
 * 距 valid_until 还剩多久。兑换券列表用。
 * 与 Taro 版一致：渲染时算一次，不做逐秒跳动。
 */
function timeLeft(validUntil) {
  const date = parseDate(validUntil)
  if (!date) return ''
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return '已过期'
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  if (days > 0) return '剩余 ' + days + ' 天 ' + hours + ' 小时'
  const minutes = totalMinutes % 60
  return '剩余 ' + hours + ' 小时 ' + minutes + ' 分'
}

/** 把 location / city / district 拼成一行地址文本 */
function joinPlace() {
  const parts = []
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i]) parts.push(arguments[i])
  }
  return parts.join(' ')
}

/** 未读数展示，超过 99 显示 99+ */
function badgeText(count) {
  const n = Number(count) || 0
  if (n <= 0) return ''
  return n > 99 ? '99+' : String(n)
}

module.exports = {
  getAvatarUrl,
  formatTime,
  parseDate,
  formatDate,
  timeLeft,
  joinPlace,
  badgeText,
}
