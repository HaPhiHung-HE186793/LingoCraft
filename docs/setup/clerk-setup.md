# Hướng dẫn lấy Clerk API Keys

## 1. Tạo tài khoản Clerk

Truy cập: **https://clerk.com** → Sign up (miễn phí, không cần thẻ tín dụng cho Development).

## 2. Tạo Application

1. Sau khi đăng nhập → **"Create application"**
2. **Application name**: `LingoCraft`
3. **Sign-in options**: chọn Email + Google (hoặc tuỳ)
4. Click **"Create application"**

## 3. Lấy API Keys

Trong Clerk Dashboard của application vừa tạo:

1. Sidebar trái → **"API Keys"**
2. Bạn sẽ thấy:
   - **Publishable key**: `pk_test_...` — dùng ở frontend (Next.js)
   - **Secret key**: `sk_test_...` — dùng ở backend (NestJS API) — **KHÔNG chia sẻ**

## 4. Cấu hình trong project

```bash
# Copy env example
cp .env.example apps/api/.env

# Điền vào apps/api/.env:
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

> ⚠️ **KHÔNG commit file .env** — đã được thêm vào .gitignore.

## 5. Cấu hình GitHub Secrets (cho CI)

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Thêm:
   - `CLERK_SECRET_KEY` = giá trị từ Clerk Dashboard
4. (Khi deploy) Thêm vào Render environment variables

## 6. Kiểm tra JWT issuer

Clerk cấp JWT với issuer dạng:
```
https://<your-clerk-frontend-api>.clerk.accounts.dev
```

Khi implement ClerkAuthAdapter (T02 full), SDK tự xử lý verify.
Bạn chỉ cần `CLERK_SECRET_KEY` đúng.

## Trạng thái hiện tại (M0)

- `ClerkAuthAdapter` đã được scaffold nhưng **SDK chưa cài** (`@clerk/backend`).
- Unit tests dùng `FakeAuthAdapter`.
- Khi cài SDK (T02): `pnpm --filter @lingocraft/api add @clerk/backend@<version>`.
- Xác minh version trước khi cài: https://www.npmjs.com/package/@clerk/backend
