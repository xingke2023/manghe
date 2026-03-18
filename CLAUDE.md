# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"约会盲盒" (Dating Blind Box) — a matchmaking mini-program where users publish blind box dating events, others apply to join, one applicant gets locked in, and both complete offline fulfillment via GPS checkin + mutual QR code scanning.

## Architecture

- **Backend**: Laravel 12 API (PHP 8.4) — `backend/`
- **Frontend**: Next.js 16 (React 19, TypeScript) — `frontend/`
- **Database**: MySQL (`manghe` database, root, no password). Tables already exist — not managed by Laravel migrations.
- **Database docs**: `database/README.md` (business logic) and `database/schema.sql` (full DDL)

### Authentication
Laravel Sanctum token-based auth. Frontend stores token in localStorage, sends via `Authorization: Bearer {token}`.
- `frontend/lib/auth-context.tsx` — AuthProvider + useAuth hook (exposes `user`, `token`, `loading`)
- `frontend/lib/api/client.ts` — ApiClient: `get(endpoint, token)`, `post(endpoint, data, token)`, `put`, `delete`
- `backend/app/Http/Controllers/Api/AuthController.php` — login/register/logout/me

### Backend Models (`backend/app/Models/`, 20 models)
- **User**: User, UserProfile, Admin, UserFollow, ValueTest
- **Blind box**: BlindBox, BoxApplication, BoxView, BoxVoucher, DailyBoxViewStat
- **Fulfillment**: Checkin, MeetingCode, MeetingVerification, Deposit, AppointmentAppeal
- **Communication**: ChatSession, ChatMessage, ProfileViewPermission, Notification
- **Config**: SystemConfig (`SystemConfig::getValue('key')` helper)

### Key Business Flow
1. User passes value test → pays deposit → uses voucher → publishes blind box
2. Others browse plaza (daily quota: 3 free / 10 member) → apply (anti-flake fee)
3. Creator locks one applicant → others auto-rejected
4. Both GPS checkin within 300m → mutual QR scan → fulfillment complete
5. 4 settlement scenarios in `database/README.md`

### Notification System (`app/Services/NotificationService.php`)
```php
NotificationService::send(userId: $id, type: 'new_application', title: '...', content: '...', relatedType: 'blind_box', relatedId: $boxId, linkUrl: '/messages');
```
11 types: `new_application`, `application_locked`, `application_rejected`, `profile_view_request`, `profile_view_approved`, `profile_view_rejected`, `fulfillment_perfect`, `fulfillment_creator_missed`, `fulfillment_applicant_missed`, `value_test_approved`, `value_test_rejected`

### Recommendation Algorithm (`BlindBoxController@index`)
Default sort = 兴趣匹配(60%) + 新近度(40%). Uses `auth('sanctum')->user()` on public route. Falls back to `latest()` if user unauthenticated or has no interests.

## Development Commands

```bash
# Backend
cd backend && php artisan serve --host=0.0.0.0 --port=8068
cd backend && php artisan test
cd backend && vendor/bin/pint --dirty
cd backend && php artisan route:list

# Frontend
cd frontend && npm run dev          # port 3111
cd frontend && NEXT_TURBOPACK=0 npx next build
```

## Conventions

### Backend (Laravel 12)
- Middleware: `bootstrap/app.php` (no Kernel.php)
- Casts: `casts()` method, not `$casts` property
- Validation: Form Request classes, not inline
- Models: always type relationship return types (`HasMany`, `BelongsTo`, etc.)
- DB: `Model::query()`, avoid `DB::` facade
- Tests: Pest v4 — `it('description', function() { ... })`

### Frontend
- App Router, `'use client'` for interactive pages
- Route groups: `app/(app)/` has bottom tab layout; login/register do not
- API pattern: types in `lib/api/types.ts`, services in `lib/api/*.ts`, each function takes `token` as last param
- Mobile-first, max-width 480px centered

## Environment

| | Value |
|---|---|
| Backend port | `0.0.0.0:8068` |
| Frontend port | `0.0.0.0:3111` |
| DB | `manghe`, root, no password |
| Frontend API URL | `http://localhost:8068/api` |

## Current State

**全部功能 100% 完成**（见 `TODO.md`）。

- 27 MySQL tables, 20 Eloquent models
- All APIs complete: auth, blind-box CRUD, applications, chat, fulfillment, notifications, follows, vouchers
- All frontend pages complete: plaza, detail, publish flow, messages, profile, fulfillment, notifications
- Full requirements: `需求.txt` / `需求总结.txt` (Chinese)
- Design mockups: `ziliao/pages/` (PNG, organized by feature)
