---
name: pwa-notifications
description: "Triển khai PWA, service worker, cache theo account, offline sync và push tự nguyện; đánh giá native boundary."
---

# pwa-notifications

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 10.6, 14, 22–24, 27. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Chọn nội dung offline giới hạn và partition cache account/tenant. App shell version không cắt phiên; background sync có fallback sync-on-open. Client event IDs và expected card version cho server reconcile. Push xin quyền sau hành động có giá trị, có quiet hours/timezone/dedupe/expiry/snooze. Deep link mở đúng phiên. Notification mặc định không lộ từ riêng. Detect capability thay vì chỉ user-agent. Thiết bị không hỗ trợ vẫn học bình thường.

## Guardrails

Không hứa unlock hook/full overlay của PWA. Không lạm dụng full-screen intent/call/alarm. Không giả wrapper WebView tự có native widget. Không gửi dồn khi thiết bị online lại hoặc nag sau từ chối quyền. Không coi offline cache có thể thu hồi tức thì khi mất mạng.

## Kiểm tra bắt buộc

Test iOS Home Screen push theo thiết bị/version được hỗ trợ, Android quyền bị từ chối, Focus/battery constraints, logout/account switch, cache update giữa phiên, offline conflicts, stale push và timezone change. Ghi rõ phần chưa test trên máy thật.

## Bàn giao / điểm dừng

Bàn giao permission flow, cache policy, sync protocol, device capability matrix và giới hạn native/OS trong copy UI.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
