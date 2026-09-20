# Kế hoạch triển khai và task cards

Mỗi task là một PR nhỏ hoặc tập PR có dependency, không phải chỉ tạo file rỗng. Done theo PROJECT_SPEC mục 27.4.

| Task | Milestone | Phạm vi | Phụ thuộc | Bằng chứng nghiệm thu |
|---|---|---|---|---|
| T01 | M0 | Scaffold monorepo/CI/contracts | Không | Strict TS, lockfile, web/api/worker build; no secrets |
| T02 | M0 | Auth, tenant, runtime role/RLS | T01 | SEC-01/02/03; A/B isolation trên DB role thật |
| T03 | M1 | Import parse/mapping/preview | T02 | IMP-01..04; row errors, idempotent commit |
| T04 | M1 | Deck/items/revisions/provenance | T03 | Version conflict, duplicates, user draft không bị đè |
| T05 | M1 | Session/attempt/core flashcard | T04 | LRN-01/02; resume/error giữ input |
| T06 | M1 | FSRS, atomic review, conflicts | T05 | LRN-03..06; actual library golden tests |
| T07 | M2 | AI gateway/quota/outbox/worker | T02,T04 | AI-01/02; no raw DB tool; provider outage |
| T08 | M2 | GameSpec/key/hint validation | T07 | GAME-01..03; public/private split |
| T09 | M2 | Scene Builder EN/JA + grading | T05,T08 | GAME-04..06; keyboard/tap; IME; practice-only |
| T10 | M3 | Graph/proposals/map/outline | T04 | MAP-01..03; evidence, undo, scoped retrieval |
| T11 | M3 | Intent-to-map + 2 additional templates | T09,T10 | Schema riêng, safe fallback, source IDs valid |
| T12 | M0–M4 | Responsive/a11y/design system | T01; chạy xuyên suốt | UI-01..04, contrast, reduced motion, manual review |
| T13 | M4 | Offline/PWA/push | T06,T12 | PWA-01..04; real device limitations documented |
| T14 | M5 | Security/load/language evaluation | T01..T13 | OPS-01..03; holdout EN/JA; pricing assumptions checked |
| T15 | M5 | Pilot/release/go-no-go | T14 | DATA-01; restore; budget; reviewer sign-off |

## Prompt mỗi task

> Triển khai TASK_ID theo PROJECT_SPEC. Đọc module và SKILL.md liên quan. Trước code, nêu acceptance criteria, contracts/migrations bị ảnh hưởng và rủi ro. Sau code, chạy tests thực tế, ghi commands/results vào WORK_LOG. Không vượt scope hoặc dùng dữ liệu production. Nếu không chạy được test, đánh dấu chưa xác minh.

## Gate

Không mở AI feature trước khi core review và scope chạy được. Không mở PWA sync trước atomic review. Không mở catalog công khai trước human review. Không mở production trước security, cost và restore checks. Ví dụ render.yaml không thay cho cấu hình đã kiểm tra ở tài khoản hosting.
