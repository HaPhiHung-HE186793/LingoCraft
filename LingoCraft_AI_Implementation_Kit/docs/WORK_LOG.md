# Work log

## Trạng thái ban đầu

Chỉ có bộ đặc tả, schema và fixture tham khảo; chưa có ứng dụng triển khai.

## Mẫu mỗi task

- Task ID / ngày / người hoặc agent thực hiện:
- Section đặc tả và skill đã đọc:
- Thay đổi và file liên quan:
- Quyết định/giả định mới:
- Lệnh test thực sự đã chạy + kết quả:
- Test chưa chạy và lý do:
- Migration/rollback/security/a11y impact:
- Rủi ro còn lại và bước tiếp theo:

---

## T01 + T02 — M0 Scaffold + Auth/Tenant/RLS

- **Task ID**: T01, T02
- **Ngày**: 2026-09-20
- **Agent**: Antigravity (Claude Sonnet 4.6 Thinking)

### Section đặc tả và skill đã đọc

- PROJECT_SPEC.md mục 15–20, 26.1–26.2, 27.2
- AGENTS.md (toàn bộ)
- START_HERE.md
- docs/IMPLEMENTATION_PLAN.md
- Skills đọc: modular-backend, neon-data-security, testing-evaluations

### Thay đổi và file liên quan

**Root config:**
- `package.json` (pnpm workspace root, Node 22, pnpm 9.15.4)
- `pnpm-workspace.yaml`
- `tsconfig.base.json` (strict, exactOptionalPropertyTypes, noUncheckedIndexedAccess)
- `.eslintrc.cjs`, `.gitignore`, `.gitattributes`, `.nvmrc`, `.env.example`

**Apps:**
- `apps/api/` — NestJS scaffold + health endpoint
- `apps/worker/` — worker process scaffold
- `apps/web/` — Next.js 15 scaffold

**Packages:**
- `packages/domain/` — pure types, review policy, FSRS port
- `packages/contracts/` — Zod schemas (no answer keys exported)
- `packages/database/` — Drizzle schema + scoped-tx.ts + migrations
- `packages/config/` — shared tsconfig
- `packages/modules/identity/` — AuthPort, ClerkAuthAdapter scaffold, FakeAuthAdapter, ScopeResolver

**DB Migrations:**
- `packages/database/migrations/001_foundation.sql` — 5 M0 tables
- `packages/database/migrations/002_rls.sql` — FORCE RLS + runtime role + policies

**Tests:**
- `packages/domain/src/review-policy.test.ts`
- `packages/modules/identity/src/identity.test.ts`
- `tests/integration/tenant-isolation.test.ts`

**CI/Docs:**
- `.github/workflows/ci.yml`
- `docs/adr/ADR-001-typescript-stack.md`
- `docs/adr/ADR-002-tenant-isolation.md`
- `docs/setup/clerk-setup.md`
- `docs/setup/neon-setup.md`

### Quyết định/giả định mới

- D01: pnpm 9.15.4 workspaces (confirmed by user)
- D03: ClerkAuthAdapter scaffold — SDK chưa cài, cần clerk-setup.md để lấy key
- D05: lc_app (runtime) + lc_migrate (migration) roles tách biệt
- D06: set_config transaction-local (true) để tương thích pooler

### Lệnh test thực sự đã chạy + kết quả

```
Command: pnpm --filter @lingocraft/domain test
Result: 14 passed (14) — golden fixture cases RC-001..010 + LRN-01/02
Date: 2026-09-20 18:08:15

Command: pnpm --filter @lingocraft/identity test
Result: 5 passed (5) — FakeAuthAdapter + ClerkAuthAdapter scaffold
Date: 2026-09-20 18:11:12

Command: python LingoCraft_AI_Implementation_Kit/scripts/validate_kit.py
Result: PASS: 93 offline reference checks; 2 game/key fixture pairs; 10 review-policy cases; 12 skills
Date: 2026-09-20

Command: pnpm --filter @lingocraft/integration-tests test
Result: 1 passed | 3 skipped (4 total)
  - SKIPPED: SEC-01 cross-tenant isolation (reason: no DB)
  - SKIPPED: SEC-02 connection pool isolation (reason: no DB)
  - PASS: environment status test (correctly reports skip reason)
Date: 2026-09-20 23:10:38

Command: pnpm --filter @lingocraft/domain typecheck
Result: Exit 0 (no errors)

Command: pnpm --filter @lingocraft/contracts typecheck
Result: Exit 0 (no errors)

Command: pnpm --filter @lingocraft/database typecheck
Result: Exit 0 (no errors)

Command: git push origin main
Result: a344c3b..f9f7f50  main -> main (100 files committed)
```

### Test chưa chạy và lý do

| Test | Lý do chưa chạy | Cần gì để chạy |
|---|---|---|
| SEC-01 (cross-tenant RLS) | Không có Neon/DB cấu hình | DATABASE_URL_APP trỏ tới PG với lc_app role; migrations applied |
| SEC-02 (pooled connection isolation) | Không có Neon/DB cấu hình | DATABASE_URL_APP trỏ tới PG với lc_app role |
| ClerkAuthAdapter (thật) | @clerk/backend chưa cài | Clerk secret key từ clerk-setup.md; `pnpm add @clerk/backend` |
| NestJS API build | @nestjs/cli chưa xác nhận | Chạy `pnpm --filter @lingocraft/api build` sau khi cài thêm |
| Next.js web build | Chưa kiểm tra | Chạy `pnpm --filter @lingocraft/web build` |

### Migration/rollback/security/a11y impact

- **Migration forward**: 001 + 002 phải chạy theo thứ tự bằng lc_migrate role
- **Migration rollback**: Chưa có down scripts — ghi nhận rủi ro
- **RLS**: FORCE RLS bật — tests bằng lc_app, không phải owner
- **Security**: Không có secret nào trong code/commit; FakeAuthAdapter chỉ dùng trong tests

### Rủi ro còn lại và bước tiếp theo

1. **SEC-01/02 integration tests chưa chạy** — cần Neon + roles configured
2. **ClerkAuthAdapter SDK chưa cài** — cần CLERK_SECRET_KEY, sau đó cài `@clerk/backend@<verified_version>`
3. **API/Worker/Web build chưa verify đầy đủ** — NestJS cần `@nestjs/cli` đúng cách
4. **Migration down scripts chưa có** — cần trước khi T03
5. **Bước tiếp**: T03 (import pipeline) phụ thuộc T02 hoàn chỉnh; trước hết cấu hình Neon và Clerk
