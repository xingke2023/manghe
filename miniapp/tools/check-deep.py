#!/usr/bin/env python3
"""深度检查：require 路径、usingComponents 路径、WXML 事件绑定是否有对应 handler。"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def walk_files(suffix):
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.git')]
        for name in filenames:
            if name.endswith(suffix):
                yield os.path.join(dirpath, name)


def rel(path):
    return os.path.relpath(path, ROOT)


# 1. require('./x') 目标是否存在
for path in walk_files('.js'):
    src = open(path, encoding='utf-8').read()
    base = os.path.dirname(path)
    for match in re.finditer(r"require\(['\"](\.[^'\"]+)['\"]\)", src):
        target = os.path.normpath(os.path.join(base, match.group(1)))
        if not (os.path.exists(target) or os.path.exists(target + '.js')):
            errors.append(f'{rel(path)}: require 路径不存在 -> {match.group(1)}')

# 2. usingComponents 指向的组件四件套是否齐
for path in walk_files('.json'):
    try:
        data = json.load(open(path, encoding='utf-8'))
    except Exception:
        continue
    if not isinstance(data, dict):
        continue
    base = os.path.dirname(path)
    for tag, comp in (data.get('usingComponents') or {}).items():
        target = os.path.normpath(os.path.join(base, comp))
        for ext in ('.js', '.wxml', '.json'):
            if not os.path.exists(target + ext):
                errors.append(f'{rel(path)}: 组件 {tag} 缺 {comp}{ext}')

# 3. WXML 里 bind*/catch* 绑定的方法必须在同目录 .js 里定义
EVENT_RE = re.compile(r'\b(?:bind|catch|capture-bind|capture-catch):?([a-zA-Z]+)\s*=\s*"([^"{}]+)"')
for path in walk_files('.wxml'):
    js_path = path[: -len('.wxml')] + '.js'
    if not os.path.exists(js_path):
        continue
    js_src = open(js_path, encoding='utf-8').read()
    wxml_src = open(path, encoding='utf-8').read()
    for match in EVENT_RE.finditer(wxml_src):
        handler = match.group(2).strip()
        if not handler:
            continue
        # 组件自定义事件（bindtap 到父页面）也走同样的定义查找
        if not re.search(r'\b' + re.escape(handler) + r'\s*[:(]', js_src):
            errors.append(f'{rel(path)}: 绑定了 {handler}，但 {os.path.basename(js_path)} 里没定义')

# 4. WXML 花括号配对（漏写 }} 是最容易犯的错）
for path in walk_files('.wxml'):
    src = open(path, encoding='utf-8').read()
    if src.count('{{') != src.count('}}'):
        errors.append(
            f'{rel(path)}: 花括号不配对，{{{{ 有 {src.count("{{")} 个，}}}} 有 {src.count("}}")} 个'
        )

if errors:
    for e in errors:
        print('  ✗ ' + e)
    print(f'\n共 {len(errors)} 个问题')
    sys.exit(1)
print('✓ require / 组件引用 / 事件绑定 / 花括号 全部通过')
