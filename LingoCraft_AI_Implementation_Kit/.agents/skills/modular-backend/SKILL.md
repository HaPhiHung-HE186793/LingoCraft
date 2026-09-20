---
name: modular-backend
description: "Xây hoặc sửa NestJS API/worker, boundaries, use case, transaction và error contract. Không dùng để tự ý chuyển microservice."
---

# modular-backend

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 15–20, 23–24. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Đọc repo và ADR stack. Chọn module sở hữu use case; xác định port và DTO public/private. Viết domain policy thuần trước, adapter sau. Scope resolver phải chạy trước repository. Transaction ngắn; outbox cùng commit với thay đổi phát sinh job. Gọi AI ngoài transaction. Trả error code ổn định và idempotency theo route/user/scope/request hash. Dùng dependency rules ngăn import nội bộ xuyên module và web import database.

## Guardrails

Không thêm abstract layer cho mọi helper. Không export ORM entities ra FE. Không tạo Python service chỉ để gọi model HTTP. Không dùng singleton mutable tenant context hoặc transaction mở chờ provider. Không dựa vào client để chấm quyền/kết quả.

## Kiểm tra bắt buộc

Unit test policy với fake Clock; contract test adapter; integration PostgreSQL/RLS; concurrency/idempotency cho write; test worker retry khi side effect đã xảy ra. Chạy build cả API và worker; không bỏ qua script thực tế trong package.json.

## Bàn giao / điểm dừng

Bàn giao use case, contracts, file ownership, migration/rollback, test log và runbook lỗi. Nếu đổi stack, dừng và lập ADR trước.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
