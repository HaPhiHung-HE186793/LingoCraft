---
name: deploy-observability
description: "Dựng hoặc kiểm tra Render/Vercel/Neon deployment, môi trường, migrations, cost và incident runbooks."
---

# deploy-observability

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 15–16, 23–26, 29. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Đọc examples nhưng kiểm tra schema nhà cung cấp hiện hành và scripts repo thật. Tách dev/staging/prod identity/DB/bucket. Pin runtime/package manager, set secrets ngoài repo. API/worker deploy separate process, job concurrency bounded. Migration một pipeline với direct restricted role; application không auto destructive migrate. Cấu hình trace/request IDs, pool/queue/AI metrics, budgets và kill switches. Smoke auth/import/review/fallback rồi mở feature flag. Thực hiện restore rehearsal được phép.

## Guardrails

Không dùng free/hobby plan không phù hợp rồi hứa production uptime. Không coi Blueprint template đã được deploy. Không đặt DB/key trong FE. Không assume worker polling cho DB scale-to-zero. Không mua/deploy/xóa dữ liệu thật khi chưa được duyệt.

## Kiểm tra bắt buộc

Build frozen lockfile; validate env fail-closed; preview isolation; health/readiness; migration failure; provider outage; queue retry/DLQ; rollback renderer/schema compatibility; budget reservation leak; restore RPO/RTO measured.

## Bàn giao / điểm dừng

Bàn giao commands/config đã xác minh, secret names không value, monitoring/runbooks, cost assumptions so với actual và danh sách thao tác production cần phê duyệt.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
