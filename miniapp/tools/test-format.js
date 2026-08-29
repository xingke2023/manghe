#!/usr/bin/env node
/** 验证 utils/format.js 能吃下后端实际用的三种时间格式。 */
const format = require('../utils/format')

const cases = [
  ['2026-08-29T12:00:00+08:00', 'toIso8601String（带时区偏移）'],
  ['2026-08-29T10:19:41.000000Z', 'toISOString（6 位微秒）'],
  ['2026-08-29T10:19:41.000Z', '标准 3 位毫秒'],
  ['2026-08-29 12:00:00', '纯 datetime（iOS 需转换）'],
  ['2026-08-29', '仅日期'],
  ['8-29', '后端预格式化的展示串 n-j'],
  ['08-29 14:32', '后端预格式化的展示串 m-d H:i'],
  ['', '空值'],
  [null, 'null'],
]

let failed = 0
console.log('parseDate:')
for (const [input, desc] of cases) {
  const parsed = format.parseDate(input)
  const ok = parsed ? parsed.toISOString() : 'null'
  console.log(`  ${JSON.stringify(input).padEnd(32)} -> ${ok}   (${desc})`)
}

console.log('\n关键断言：')
const checks = [
  [
    'ISO+offset 必须能解析',
    format.parseDate('2026-08-29T12:00:00+08:00') !== null,
  ],
  [
    '6 位微秒必须能解析',
    format.parseDate('2026-08-29T10:19:41.000000Z') !== null,
  ],
  [
    '带空格的 datetime 必须能解析',
    format.parseDate('2026-08-29 12:00:00') !== null,
  ],
  [
    '预格式化展示串解析不了时，formatTime 原样返回',
    format.formatTime('08-29 14:32') === '08-29 14:32',
  ],
  [
    'timeLeft 对 ISO 能算出剩余',
    /剩余|已过期/.test(format.timeLeft('2030-01-01T00:00:00+08:00')),
  ],
  ['过期时间返回已过期', format.timeLeft('2020-01-01T00:00:00+08:00') === '已过期'],
  ['formatDate 对 ISO 正常', /^\d{4}-\d{2}-\d{2}$/.test(format.formatDate('2026-08-29T12:00:00+08:00'))],
  ['badgeText 超 99', format.badgeText(150) === '99+'],
  ['badgeText 0 返回空', format.badgeText(0) === ''],
  ['joinPlace 跳过空值', format.joinPlace('杭州', null, '西湖') === '杭州 西湖'],
  [
    'getAvatarUrl 无头像时回落到本站 /avatar/{id}（不再直连 dicebear）',
    format.getAvatarUrl(7, '').indexOf('/avatar/7') !== -1 &&
      format.getAvatarUrl(7, '').indexOf('dicebear') === -1,
  ],
  ['getAvatarUrl 有头像时原样返回', format.getAvatarUrl(7, 'http://x/a.png') === 'http://x/a.png'],
]

for (const [desc, pass] of checks) {
  console.log(`  ${pass ? '✓' : '✗'} ${desc}`)
  if (!pass) failed++
}

console.log()
if (failed) {
  console.log(`${failed} 个断言失败`)
  process.exit(1)
}
console.log('✓ format.js 全部通过')
