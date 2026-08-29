#!/usr/bin/env python3
"""烟雾测试：登录后逐个打客户端会用到的 GET 接口，确认路径和鉴权都对。

用法：
    python3 tools/smoke-api.py                                  # 打本地 8068
    python3 tools/smoke-api.py https://app51.xingke888.com/api  # 打生产
"""
import json
import sys
import urllib.request
import urllib.error

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8068/api'
print(f'目标: {BASE}\n')


def call(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Accept', 'application/json')
    if data:
        req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()
    except Exception as exc:
        return 0, str(exc)


status, raw = call('POST', '/login', body={'phone': '13800000002'})
if status != 200:
    print(f'登录失败 {status}: {raw[:200]}')
    raise SystemExit(1)
token = json.loads(raw)['token']
print(f'登录 OK，token 取到\n')

GETS = [
    '/me',
    '/me/profile',
    '/me/daily-views',
    '/me/blind-boxes',
    '/me/applications',
    '/me/following',
    '/me/vouchers',
    '/me/fulfillments',
    '/me/profile-view-requests',
    '/chat/sessions',
    '/chat/unread-count',
    '/notifications',
    '/notifications/unread-count',
    '/publish/status',
    '/blind-boxes',
    '/blind-boxes/filter-options',
]

bad = []
for path in GETS:
    code, body = call('GET', path, token)
    mark = 'ok ' if code == 200 else 'BAD'
    print(f'  {mark} {code}  GET {path}')
    if code != 200:
        bad.append((path, code, body[:160]))

# 会员专属接口，非会员返回 403 是正确行为
code, body = call('GET', '/following/blind-boxes', token)
expected = code in (200, 403)
print(f'  {"ok " if expected else "BAD"} {code}  GET /following/blind-boxes  (403=非会员，属正常)')
if not expected:
    bad.append(('/following/blind-boxes', code, body[:160]))

print()
if bad:
    print('以下接口异常：')
    for path, code, body in bad:
        print(f'  {path} -> {code}: {body}')
    raise SystemExit(1)
print('✓ 客户端用到的 GET 接口全部可用')
