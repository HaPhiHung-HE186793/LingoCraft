---
name: fsrs-learning-engine
description: "Triển khai scheduler adapter, eligibility, review log, idempotency, offline conflicts và workload cá nhân hóa."
---

# fsrs-learning-engine

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 02, 10, 18–20, 27. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Đọc fixture review-policy-cases. Tách Attempt, eligible ReviewEvent và MemoryCard theo user/variant. Xác định first response và thời điểm hint; assistance không bị xóa sau sửa đúng. Dùng ts-fsrs phiên bản đã pin qua SchedulerPort; fixture của kit không phải implementation FSRS. Đóng băng clock/seed trong tests. Atomic transaction gồm dedupe → lock/version → classify → schedule → append event → update card. Giới hạn từ mới, sibling policy và backlog theo profile. Offline stale event mặc định practice/conflict.

## Guardrails

Không tự nhân interval theo response time/hint; không sửa FSRS bằng LLM. Hard không phải quên. Không tự suy Easy từ tốc độ. Token assembly không nâng free-recall. Không gọi provider trong row lock. Không đảm bảo target_retention là tỷ lệ nhớ thực tế.

## Kiểm tra bắt buộc

Golden schedule theo thư viện đã chọn, duplicate event, key reused khác payload, concurrent device writes, hints trước/sau first response, uncertain verdict, time skew, DST/timezone, pause tab và version migrations.

## Bàn giao / điểm dừng

Bàn giao policy table, scheduler adapter, audit reason, atomicity/concurrency tests và phân biệt test thật với mock. Thay model scheduler cần ADR/evaluation.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
