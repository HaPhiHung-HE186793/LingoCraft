---
name: product-pedagogy
description: "Thiết kế phiên học, mục tiêu can-do, trợ giúp và động lực không gây áp lực. Dùng khi thay đổi nội dung, flow hoặc metric học tập."
---

# product-pedagogy

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 01–07, 10, 28. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Xác định người học, ngôn ngữ, một can-do và phép đo: recognition, unaided recall hay production. Tách mục tiêu kiến thức khỏi điểm game. Viết một phiên 90 giây và một bài transfer khác cảnh. Nêu cue nào đã lộ và cách giảm hỗ trợ qua lần ôn. Viết feedback nêu một điều đúng và một sửa đổi quan trọng; chi tiết mở theo yêu cầu. Gắn nguồn/reviewer cho kiến thức, nhãn draft cho AI chưa duyệt. Kiểm tra completion/stop/comeback flow không gây tội lỗi.

## Guardrails

Không hứa hình thành thói quen sau 1–2 lần hoặc đạt chứng chỉ trong thời gian chắc chắn. Không phân loại learning styles như chẩn đoán. Không coi điểm game là trí nhớ hay dùng thêm phút trong app làm mục tiêu duy nhất. Không tự suy luận sức khỏe tâm thần từ hành vi bỏ học.

## Kiểm tra bắt buộc

Kiểm thử người dùng dừng giữa phiên, dùng mọi hint, chỉ xem đáp án, bật chế độ ít năng lượng và không thích nhân vật. Đối chiếu rằng tất cả lượt có trợ giúp đều giữ dấu vết. Review câu EN/JA và accepted variants với language owner.

## Bàn giao / điểm dừng

Bàn giao mục tiêu học, flow, microcopy, dữ liệu sự kiện, phương án đánh giá trì hoãn và câu hỏi cần reviewer xác nhận.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
