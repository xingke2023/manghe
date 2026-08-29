#!/usr/bin/env python3
"""把各页面 WXSS 里硬编码的小字号统一映射到 app.wxss 的全局字号阶梯。

中文界面里 20rpx（10px）这种尺寸实在偏小，且各页面各写一套导致层级不一致。
本脚本只处理 30rpx 及以下 —— 32rpx 以上是刻意的标题/emoji 图标尺寸，不动。
weui.wxss 是上游文件，不改。

用法：python3 tools/normalize-font-sizes.py
"""
import glob
import os
import re

MAP = {
    '18rpx': 'var(--fs-mini)',
    '20rpx': 'var(--fs-mini)',
    '22rpx': 'var(--fs-mini)',
    '24rpx': 'var(--fs-caption)',
    '26rpx': 'var(--fs-caption)',
    '28rpx': 'var(--fs-secondary)',
    '30rpx': 'var(--fs-body)',
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def targets():
    for pattern in ('pages/**/*.wxss', 'components/**/*.wxss'):
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            yield path
    extra = os.path.join(ROOT, 'styles', 'profile-view.wxss')
    if os.path.exists(extra):
        yield extra


def main():
    total = 0
    touched = []
    for path in targets():
        with open(path, encoding='utf-8') as fh:
            src = fh.read()
        orig = src
        count = 0
        for old, new in MAP.items():
            src, n = re.subn(
                r'font-size:\s*' + re.escape(old) + r'\s*;', f'font-size: {new};', src
            )
            count += n
        if src != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(src)
            touched.append((os.path.relpath(path, ROOT), count))
            total += count

    for rel, n in touched:
        print(f'  {rel:52} {n} 处')
    print(f'\n共 {len(touched)} 个文件、{total} 处字号归入全局阶梯')


if __name__ == '__main__':
    main()
