---
name: neon-data-security
description: "Thiết kế PostgreSQL/Neon, schema, RLS, pooler, migration và tenant-safe retrieval. Dùng cho mọi thay đổi dữ liệu riêng."
---

# neon-data-security

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 18–20, 22–24. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Liệt kê bảng private/catalog, runtime roles, owner và composite foreign keys. Thiết kế query trước index. Tạo scoped transaction dùng set_config(..., true) trong cùng transaction; giá trị từ server-verified membership. Viết policies default-deny, tránh policy đệ quy. Tách pooled URL request và direct URL cho queue/migration theo capability. Plan migration expand/contract và restore. Với vector, lọc scope/ngôn ngữ trước khi dữ liệu tới prompt/log; đo recall khi ANN filter.

## Guardrails

Không dùng app role owner/BYPASSRLS hoặc giả tenant từ request body. Không giữ SET tenant ở session trên pooler. Không tạo public = tenant_id NULL khắp hệ thống. Không dùng migration role trong ứng dụng; không copy prod DB vào preview thiếu phê duyệt.

## Kiểm tra bắt buộc

Test A/B tenant trên reused connections với đúng runtime role; IDOR FK; worker sau revoke; transaction rollback; concurrency pool; delete vectors/cache refs; explain query trên dataset đại diện. Tests chạy bằng DB owner không tính là test RLS.

## Bàn giao / điểm dừng

Bàn giao schema/migration, bảng quyền, SQL test, index rationale, connection budget và bằng chứng restore hoặc ghi rõ chưa thực hiện.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
