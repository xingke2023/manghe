#!/usr/bin/env python3
"""校验 miniapp/ 结构：JSON 合法性 + app.json 声明的页面是否都存在四件套。"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []
warnings = []

# 1. 所有 .json 必须是合法 JSON
json_count = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.git')]
    for name in filenames:
        if not name.endswith('.json'):
            continue
        path = os.path.join(dirpath, name)
        json_count += 1
        try:
            with open(path, encoding='utf-8') as fh:
                json.load(fh)
        except Exception as exc:
            errors.append(f'JSON 非法: {os.path.relpath(path, ROOT)} -> {exc}')

# 2. app.json 的 pages 与磁盘一致
with open(os.path.join(ROOT, 'app.json'), encoding='utf-8') as fh:
    app_json = json.load(fh)

pages = app_json.get('pages', [])
missing = []
for page in pages:
    for ext in ('js', 'wxml', 'json'):
        path = os.path.join(ROOT, page + '.' + ext)
        if not os.path.exists(path):
            missing.append(page + '.' + ext)
    # wxss 可选，但本项目约定每页都有
    if not os.path.exists(os.path.join(ROOT, page + '.wxss')):
        warnings.append(f'缺 wxss（可选）: {page}.wxss')

if missing:
    errors.append('app.json 声明但磁盘缺失:\n    ' + '\n    '.join(missing))

# 3. 磁盘上有页面但 app.json 没声明（会导致该页无法跳转）
declared = set(pages)
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'pages')):
    if 'index.js' in filenames:
        rel = os.path.relpath(os.path.join(dirpath, 'index'), ROOT)
        if rel not in declared:
            errors.append(f'页面存在但 app.json 未声明: {rel}')

# 4. tabBar 图标存在
for item in app_json.get('tabBar', {}).get('list', []):
    for key in ('iconPath', 'selectedIconPath'):
        icon = item.get(key)
        if icon and not os.path.exists(os.path.join(ROOT, icon)):
            errors.append(f'tabBar 图标缺失: {icon}')

print(f'检查了 {json_count} 个 JSON 文件，{len(pages)} 个页面声明')
for w in warnings:
    print('  ⚠ ' + w)
if errors:
    print()
    for e in errors:
        print('  ✗ ' + e)
    sys.exit(1)
print('✓ 全部通过')
