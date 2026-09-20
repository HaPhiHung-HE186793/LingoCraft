---
name: safe-ai-generation
description: "Triển khai AI gateway, structured outputs, validation, quota, provider fallback và prompt-injection boundaries."
---

# safe-ai-generation

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 08, 16, 21–22. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Chọn task từ catalog. Tạo snapshot ít dữ liệu nhất sau authorization; nguồn ngoài instruction được phân tách. Khai báo output schema và referential/semantic validators. Reserve quota atomic trước enqueue; budget timeout/retry/repair và reconcile usage. Adapter xử lý success/refusal/timeout/rate-limit/invalid-schema/uncertain khác nhau. Chỉ provider có consent/policy được dùng. Ghi model/prompt/schema/hash và cost metadata; raw prompt tắt mặc định. Route fallback trước khi UI bị chặn.

## Guardrails

Không cho model SQL, DB credentials, secret, tự chọn scope hoặc fetch URL bất kỳ. Schema không bảo đảm ngữ nghĩa. Không dùng confidence tự khai như xác suất đã calibration. Không cache output lỗi vào approved pool; không tái dùng private data xuyên user.

## Kiểm tra bắt buộc

Test prompt injection trong term/note/source, nonexistent source IDs, cross-tenant cache, extra html fields, refusals, token cap, concurrent quota race, repair failure và provider outage. Chạy offline mock suite; live eval phải riêng và có budget.

## Bàn giao / điểm dừng

Bàn giao task contract, prompt version, policy data disclosure, validators, eval report, cost/latency và fallback evidence. Thiếu scope/consent thì dừng.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
