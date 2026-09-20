---
name: testing-evaluations
description: "Thiết lập unit/integration/E2E, tenant security, AI golden eval, performance và release evidence."
---

# testing-evaluations

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 21, 24, 27–29. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Map task tới AC IDs trong spec. Tách tests deterministic từ live-model evaluation có budget. Integration dùng PostgreSQL runtime role thật để test RLS; mock DB không đủ. Golden EN/JA có source, variants, expected hint behavior, ambiguous cases và human adjudication. Holdout không bị dùng để chỉnh prompt tùy tiện. Load test ghi region/resources/data/user pattern, không chỉ số user đăng ký. Kiểm tra UX manually cùng automated a11y.

## Guardrails

Không nói tests pass nếu chưa chạy. Không sửa assertion chỉ để hết đỏ khi business rule chưa đổi. Không coi validate_kit.py là kiểm thử ứng dụng. Không phạt learner khi model uncertain. Không kết luận hiệu quả học từ chỉ completion rate.

## Kiểm tra bắt buộc

Bắt buộc cross-tenant/cache/injection, repeat writes, concurrent quota, renderer error, provider timeout, Japanese variants/IME, mobile, offline, export/delete, backup restore. Lưu pass/fail/skipped và commands.

## Bàn giao / điểm dừng

Bàn giao traceability matrix, test scripts, fixtures, eval report, remaining risks và go/no-go đề xuất kèm bằng chứng.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
