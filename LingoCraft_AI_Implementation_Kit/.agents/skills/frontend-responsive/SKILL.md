---
name: frontend-responsive
description: "Xây Next.js UI, AppShell, màn học/game/map responsive và trợ năng. Dùng khi thay đổi screen hoặc component."
---

# frontend-responsive

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 04, 06–07, 11–14. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Chọn một CTA chính theo screen. Dùng public contracts, không import private key/database. Server state dùng TanStack Query, local state tối giản. Thiết kế loading/empty/error/uncertain/offline trước polish. Mobile không phải desktop thu nhỏ: map outline, token bank dưới, panel thành sheet. Hỗ trợ 320/390/768/1024/1440px, zoom 200%, safe area và visual viewport. Thiết kế focus/keyboard/tap; drag là enhancement. Tách ui_locale/target_language/explanation_language.

## Guardrails

Không auto-play sound hoặc animation bắt buộc. Không màu-only feedback. Không đưa AI keys vào NEXT_PUBLIC. Không shared-cache private SSR responses. Không nhấn Enter submit trong IME composition. Không hiện mastered vì chỉ recognition.

## Kiểm tra bắt buộc

Playwright flows theo viewport; keyboard/screen reader smoke; contrast/reflow; reduced motion; network drop; long EN text/JA furigana; loading preserves input; review authenticated cache isolation. Axe tự động không thay kiểm tra thủ công.

## Bàn giao / điểm dừng

Bàn giao components/tokens, screenshot từng breakpoint, accessibility notes, tested states và lỗi chưa giải quyết.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
