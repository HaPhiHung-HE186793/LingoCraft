---
name: language-game-engine
description: "Xây Scene Builder hoặc game template, public GameSpec, private answer key, hint và grading đa đáp án EN/JA."
---

# language-game-engine

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 07–08, 12–13, 20, 27. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Đọc contracts/ và fixtures/. Vertical slice dùng scene_builder_v1, schema 1.0.0. Registry tĩnh ánh xạ template → renderer/grader; không dynamic path từ AI. Public spec chỉ có cue/tokens/asset IDs; key/hints ở server. Kiểm tra token ID unique, accepted sequence dùng token tồn tại, không dùng quá số lần available. Hint cấp theo attempt có audit. Thực hiện tap và keyboard trước drag. Hỗ trợ undo, IME, error boundary và fallback. Scene Builder của fixture là practice-only cho unaided recall.

## Guardrails

Không eval, raw HTML hoặc remote script. Không chỉ chấm exact canonical string. Không coi に/へ luôn tương đương; accepted variant tùy ngữ cảnh. Không nhầm 大学/だいがく và 学校/がっこう. Offline key không phù hợp leaderboard/assessment có chống gian lận.

## Kiểm tra bắt buộc

Validate positive/negative fixtures, private answer leakage qua network, unknown renderer, timeout giữ progress, hint-before-first-response, correct-after-hint, mobile 320px, keyboard-only và Japanese composition Enter.

## Bàn giao / điểm dừng

Bàn giao renderer, schema, deterministic grader, hint flow, accepted variants được review, screenshot và test evidence. Template mới cần schema/version riêng trước feature flag.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
