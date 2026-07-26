# BTC VPN — Backend API Server

خادم API كامل لتطبيق BTC VPN على الأندرويد. يستخدم SQLite كقاعدة بيانات محلية (لا يتطلب DATABASE_URL).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل API server (port 8080)
- `pnpm run typecheck` — فحص TypeScript لجميع الحزم
- `pnpm run build` — typecheck + build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: SQLite (better-sqlite3) — ملف `btc_vpn.sqlite` في جذر المشروع
- Auth: JWT-style tokens (crypto.scrypt hashing)

## API Endpoints

جميع الـ endpoints تبدأ بـ `/api`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | ❌ | تسجيل الدخول |
| POST | `/api/auth/logout` | ✅ Bearer | تسجيل الخروج |
| GET  | `/api/servers` | ✅ Bearer | جلب الشركات + السيرفرات + Spoof URLs |
| POST | `/api/device/check` | ❌ | فحص/تسجيل الجهاز |
| POST | `/api/detect-company` | ❌ | كشف الشركة من رقم الهاتف |
| GET  | `/api/spoof-urls/company/:id` | ✅ Bearer | Spoof URLs لشركة معينة |

## Where things live

- `artifacts/api-server/src/lib/database.ts` — SQLite setup + schema + seed data
- `artifacts/api-server/src/routes/auth.ts` — login / logout
- `artifacts/api-server/src/routes/servers.ts` — GET servers
- `artifacts/api-server/src/routes/device.ts` — device check
- `artifacts/api-server/src/routes/detectCompany.ts` — detect company from phone
- `artifacts/api-server/src/routes/spoofUrls.ts` — spoof URLs per company

## Default Credentials

- **Admin:** `admin` / `password`
- **Demo:** `demo` / `demo123`

## Android App Integration

في ملف `ApiClient.kt` في مشروع الأندرويد، غيّر:

```kotlin
const val BASE_URL = "https://<your-replit-domain>/"
```

## User preferences

_Populate as you build._

## Gotchas

- قاعدة البيانات تُنشأ وتُملأ تلقائياً عند أول تشغيل
- `spoof_urls` في رد `/api/servers` هي `Map<String, List>` حيث الـ key هو `company_id` كـ String (يطابق نموذج الأندرويد)
- بعد تغيير كود السيرفر يجب إعادة تشغيل الـ workflow لإعادة البناء

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
