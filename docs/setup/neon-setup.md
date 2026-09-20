# Hướng dẫn cấu hình Neon PostgreSQL

## Tổng quan

LingoCraft dùng **Neon PostgreSQL** với hai roles riêng biệt:
- `lc_app`: runtime role cho API + worker (không có BYPASSRLS)
- `lc_migrate`: migration role (chỉ dùng khi apply migrations)

## 1. Tạo Database trên Neon

**Link tạo DB**: https://neon.tech/docs/get-started-with-neon/signing-up

1. Đăng nhập Neon Console → **"New Project"**
2. **Project name**: `lingocraft`
3. **Region**: chọn gần Vietnam (Singapore `aws-ap-southeast-1` hoặc Tokyo `aws-ap-northeast-1`)
4. **Postgres version**: 16
5. Click **"Create project"**

## 2. Tạo Roles

> ⚠️ **Neon yêu cầu password mạnh**: tối thiểu 12+ ký tự, có chữ HOA, chữ thường, số, và ký tự đặc biệt.
> Password ngắn hoặc đơn giản (như `Hung@1704`) sẽ bị từ chối với lỗi "insecure password".

**Bước 1**: Tạo password ngẫu nhiên an toàn (chạy trong PowerShell):
```powershell
# Tạo password ngẫu nhiên 32 ký tự
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
# Ví dụ output: K7mPxQr2vNsYwZ4LbDhJc8TnFe6gAoRq
```

**Bước 2**: Dán vào Neon SQL Editor:
```sql
-- Tạo runtime role (không có BYPASSRLS)
-- Thay YOUR_STRONG_APP_PASSWORD bằng password từ bước 1
CREATE ROLE lc_app WITH LOGIN PASSWORD 'YOUR_STRONG_APP_PASSWORD_HERE_32chars+';

-- Tạo migration role (dùng password KHÁC với lc_app)
-- Thay YOUR_STRONG_MIGRATE_PASSWORD bằng password khác từ bước 1
CREATE ROLE lc_migrate WITH LOGIN PASSWORD 'YOUR_STRONG_MIGRATE_PASSWORD_HERE_32+';

-- Grant migration role schema access
GRANT ALL ON SCHEMA public TO lc_migrate;
GRANT lc_migrate TO neon_superuser;
```

> 💡 Gợi ý format password hợp lệ với Neon: `LcApp@2026!xKmP9rQnWvZsYb3TdHjF` (chữ hoa, thường, số, ký tự đặc biệt, ≥16 ký tự)

> ⚠️ Lưu cả 2 password vào password manager ngay — **không commit vào code**.

## 3. Lấy Connection Strings

Trong Neon Console → Project → **Connection Details**:

### Pooler (cho runtime — lc_app)
- Click **"Pooled connection"**
- **User**: `lc_app`
- Copy URL dạng: `postgresql://lc_app:<pwd>@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

### Direct (cho migration — lc_migrate)
- Click **"Direct connection"**
- **User**: `lc_migrate`
- Copy URL dạng: `postgresql://lc_migrate:<pwd>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

## 4. Chạy Migrations

```bash
# Bước 1: Chạy foundation tables (với lc_migrate role)
psql "$DATABASE_URL_MIGRATE" -f packages/database/migrations/001_foundation.sql

# Bước 2: Chạy RLS policies (với superuser vì cần CREATE ROLE grant)
# Neon: dùng superuser connection từ Dashboard → SQL Editor
# Paste nội dung 002_rls.sql vào SQL Editor

# Verify:
psql "$DATABASE_URL_APP" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

## 5. Cấu hình .env

```bash
DATABASE_URL_APP=postgresql://lc_app:<pwd>@<pooler-host>/<dbname>?sslmode=require
DATABASE_URL_MIGRATE=postgresql://lc_migrate:<pwd>@<direct-host>/<dbname>?sslmode=require
```

## 6. GitHub Secrets

Trong GitHub repo → Settings → Secrets → Actions:
- `DATABASE_URL_APP` = pooler URL (lc_app)
- `DATABASE_URL_MIGRATE` = direct URL (lc_migrate)
- `RUN_INTEGRATION_TESTS` = `true` (trong Variables, không phải Secrets)

## 7. Verify RLS hoạt động

```sql
-- Dùng lc_app role (pooler connection):
SET app.user_id = 'some-uuid';
SET app.tenant_id = 'some-tenant-uuid';
SELECT * FROM users;  -- Phải trả về 0 row nếu UUID không khớp
```

## Trạng thái M0

- Migration SQL đã được viết: `001_foundation.sql`, `002_rls.sql`
- Integration tests (`tests/integration/tenant-isolation.test.ts`) đã sẵn sàng nhưng cần DB thật
- Chưa cần Neon để chạy unit tests
