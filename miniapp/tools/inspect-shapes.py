#!/usr/bin/env python3
"""核对接口返回的字段结构是否和页面里假设的一致。"""
import json
import urllib.request
import urllib.error

BASE = 'http://localhost:8068/api'


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header('Accept', 'application/json')
    if data:
        req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        return exc.code, None


_, login = call('POST', '/login', body={'phone': '13800000003'})
token = login['token']

print('=== GET /blind-boxes 顶层键 ===')
_, res = call('GET', '/blind-boxes', token)
print(' ', sorted(res.keys()))
box = (res.get('data') or [None])[0]
if box:
    print('  单条盲盒字段:', sorted(box.keys()))
    if box.get('creator'):
        print('  creator 字段:', sorted(box['creator'].keys()))
        if box['creator'].get('profile'):
            print('  creator.profile 字段:', sorted(box['creator']['profile'].keys()))
else:
    print('  (列表为空)')

print()
print('=== GET /blind-boxes/{id} ===')
if box:
    _, detail = call('GET', '/blind-boxes/%s' % box['id'], token)
    print('  顶层键:', sorted(detail.keys()))
    d = detail.get('data') or {}
    print('  my_application:', d.get('my_application'))

print()
print('=== GET /me/profile ===')
_, res = call('GET', '/me/profile', token)
print('  顶层键:', sorted(res.keys()))
user = res.get('user') or {}
print('  user 字段:', sorted(user.keys()))
print('  有嵌套 profile:', 'profile' in user)
if user.get('profile'):
    print('  profile 字段:', sorted(user['profile'].keys()))

print()
print('=== GET /me/daily-views ===')
_, res = call('GET', '/me/daily-views', token)
print(' ', res)

print()
print('=== GET /publish/status ===')
_, res = call('GET', '/publish/status', token)
print(' ', res)

print()
print('=== GET /me/vouchers ===')
_, res = call('GET', '/me/vouchers', token)
print('  顶层键:', sorted(res.keys()))
v = (res.get('vouchers') or [None])[0]
print('  单张券字段:', sorted(v.keys()) if v else '(无券)')

print()
print('=== GET /chat/sessions ===')
_, res = call('GET', '/chat/sessions', token)
s = (res.get('data') or [None])[0]
print('  单条会话字段:', sorted(s.keys()) if s else '(无会话)')

print()
print('=== GET /notifications ===')
_, res = call('GET', '/notifications', token)
print('  顶层键:', sorted(res.keys()))
n = (res.get('data') or [None])[0]
print('  单条通知字段:', sorted(n.keys()) if n else '(无通知)')

print()
print('=== GET /me/fulfillments ===')
_, res = call('GET', '/me/fulfillments', token)
f = (res.get('data') or [None])[0]
print('  单条履约字段:', sorted(f.keys()) if f else '(无记录)')
