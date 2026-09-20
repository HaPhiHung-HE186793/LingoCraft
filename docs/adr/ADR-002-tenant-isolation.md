# ADR-002 — Tenant isolation: runtime role + RLS + scoped transaction

Status: accepted
Date: 2026-09-20
Owner/approver: Chủ dự án (pending explicit approval)

## Bối cảnh và bằng chứng

Spec §19.1-19.2 và AGENTS.md rule 1: tenant scope từ identity đã verify.
Neon PostgreSQL hỗ trợ RLS và connection pooler (PgBouncer transaction mode).

## Các lựa chọn

1. **Runtime role + FORCE RLS + set_config per transaction** (đã chọn)
2. Application-only filtering (không RLS) — rủi ro cao hơn, rejected
3. Separate schemas per tenant — quá phức tạp cho MVP

## Quyết định và lý do

**Hai roles tách biệt:**
- `lc_app`: runtime; LOGIN, no BYPASSRLS, no table ownership.
- `lc_migrate`: migration; chỉ dùng trong migration scripts, không bao giờ ở runtime.

**FORCE ROW LEVEL SECURITY** trên tất cả private tables: đảm bảo ngay cả khi code có bug bypass, DB là tuyến phòng thủ cuối.

**set_config('app.tenant_id', $1, true)** trong cùng transaction: `true` = transaction-local, reset sau COMMIT/ROLLBACK. An toàn trên pooler.

**Không dùng session SET**: PgBouncer transaction mode reset session state giữa connections — phải dùng transaction-local.

## Tác động: data/privacy/cost/operations/UX

- Security: RLS là defense-in-depth; không thay application-layer scoping.
- Cost: set_config thêm ~1ms/transaction; chấp nhận được.
- Operations: migration phải chạy bằng lc_migrate, không phải lc_app.
- Test: integration tests PHẢI chạy bằng lc_app, không phải owner/superuser.

## Contract/migration/test cần đổi

- `002_rls.sql`: enable RLS, tạo policies.
- `scoped-tx.ts`: helper bắt buộc cho mọi private table query.
- Integration test SEC-01, SEC-02 bắt buộc.

## Cách đo hiệu quả và điều kiện rollback

- SEC-01: User A không đọc được row của User B.
- SEC-02: Reused connection không leak scope.
- Rollback: nếu có vấn đề performance, profile set_config overhead trước khi thay đổi chiến lược.

## Nguồn sơ cấp / phiên bản đã kiểm tra

- [S19] PgBouncer transaction mode docs
- [S21] PostgreSQL RLS docs
- [S23] Neon pooler compatibility notes
- Spec §19.1-19.2
