# Bắt đầu với LingoCraft

Đây là **bộ đặc tả và hướng dẫn triển khai**, không phải source code ứng dụng đã hoàn thành. Các schema/fixture có thể kiểm tra được; cấu hình deploy là ví dụ chưa chạy trên tài khoản hosting.

## 1. Đặt vào repository

Đọc PROJECT_SPEC.md để hiểu sản phẩm. Đưa AGENTS.md, PROJECT_SPEC.md, docs/, contracts/, fixtures/ và .agents/skills/ vào root repo làm việc. Nếu đã có tệp cùng tên, merge có kiểm tra; không ghi đè code hoặc quy tắc đang có. examples/ không được tự động copy thành cấu hình production.

VS Code cần agent/extension hỗ trợ Agent Skills. Google Antigravity và agent VS Code tương thích hỗ trợ .agents/skills theo nguồn [S36]–[S38] trong docs/SOURCES.md. Không giả định mọi extension sẽ tự đọc skills. Yêu cầu agent đọc rõ AGENTS.md và skill liên quan. Bộ kit không cài extension và không cấp quyền cho agent.

## 2. Prompt đầu tiên

> Đọc AGENTS.md, PROJECT_SPEC.md và docs/IMPLEMENTATION_PLAN.md. Kiểm tra code hiện có trước khi tạo file. Xác nhận giả định A01–A06 và các quyết định D01–D08 còn thiếu; bắt đầu bằng M0 và T01/T02. Chọn skill modular-backend, neon-data-security và testing-evaluations. Trình bày kế hoạch nhỏ, sau đó triển khai phần local được phép. Không deploy, mua dịch vụ hoặc xử lý dữ liệu production khi chưa được duyệt. Ghi chính xác test nào đã chạy và test nào chưa chạy.

## 3. Kiểm tra bộ kit

Yêu cầu Python 3 và gói jsonschema. Cài vào virtual environment theo chính sách máy của bạn, rồi chạy:

```sh
python scripts/validate_kit.py
```

Lệnh chỉ kiểm tra schema/fixture và chính sách minh họa trong bộ kit; không truy cập internet, không gọi AI, không gọi database. Không coi kết quả này là E2E/security/performance của ứng dụng.

## 4. Trình tự bắt buộc

Core không AI chạy được trước: auth → tenant isolation → import → phiên học → FSRS. Tiếp theo mới AI gateway/quota → GameSpec/Scene Builder → map → offline/push → pilot. Default TypeScript modular monolith; Java là phương án thay thế cần ADR, không chạy song song hai BE.

## 5. Những thứ chưa có

Chưa có package.json của app, database migration hoàn chỉnh, server/API, UI thực thi, model đã lựa chọn, keys/tài khoản hosting, benchmark hoặc chứng nhận hiệu quả học. Agent phải triển khai và kiểm thử các phần đó theo kế hoạch, không giả vờ các ví dụ là app đã chạy.
