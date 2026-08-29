#!/usr/bin/env python3
"""并发压一下生产 API，看 artisan serve 能不能扛住小程序的请求模式。

小程序首页加载会同时打 daily-views + blind-boxes，加上 30s 未读轮询、
15s 聊天轮询，所以并发是常态而非例外。
"""
import concurrent.futures
import ssl
import sys
import time
import urllib.request

BASE = 'https://app51.xingke888.com/api'
# Cloudflare 会拦 Python-urllib 的默认 UA，这里伪装成小程序
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) MicroMessenger/8.0.44 miniProgram'
CTX = ssl.create_default_context()

PATHS = [
    '/blind-boxes',
    '/blind-boxes/filter-options',
    '/blind-boxes/3',
    '/blind-boxes',
    '/blind-boxes/filter-options',
    '/blind-boxes/3',
]


def hit(path):
    req = urllib.request.Request(BASE + path)
    req.add_header('User-Agent', UA)
    req.add_header('Accept', 'application/json')
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as resp:
            return path, resp.status, time.time() - start
    except Exception as exc:
        return path, f'ERR {type(exc).__name__}', time.time() - start


print(f'并发 {len(PATHS)} 个请求打 {BASE}\n')
overall = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=len(PATHS)) as pool:
    results = list(pool.map(hit, PATHS))
total = time.time() - overall

ok = 0
for path, status, elapsed in results:
    mark = 'ok ' if status == 200 else 'BAD'
    if status == 200:
        ok += 1
    print(f'  {mark} {str(status):18} {elapsed:5.2f}s  {path}')

print(f'\n成功 {ok}/{len(PATHS)}，总耗时 {total:.2f}s')
slowest = max(r[2] for r in results)
print(f'最慢单请求 {slowest:.2f}s')
if ok < len(PATHS):
    print('\n有请求失败 —— 并发能力不足')
    sys.exit(1)
if slowest > 8:
    print('\n全部成功但最慢超过 8s —— 并发下明显排队')
    sys.exit(2)
print('\n✓ 并发表现可接受')
