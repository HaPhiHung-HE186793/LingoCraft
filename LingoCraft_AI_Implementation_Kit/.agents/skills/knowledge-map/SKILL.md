---
name: knowledge-map
description: "Thiết kế graph, typed edges, proposals, prerequisites, intent-to-map và progressive disclosure."
---

# knowledge-map

## Đọc trước

AGENTS.md và PROJECT_SPEC.md, mục 09, 11–12, 18, 21. Đọc ADR, contracts và code hiện có liên quan. Tài liệu nguồn ở docs/SOURCES.md; xác minh API/version thực tế trước dùng.

## Quy trình

Tách graph quan hệ khỏi roadmap học. Node có kind, source/revision và scope; edge có type/evidence/status. Retrieval exact/lexical trước vector; LLM chỉ đề xuất từ authorized candidates. Check cycle ở prerequisite subgraph, không cấm mọi chu trình. Cho accept/reject/undo proposal. API giới hạn node/depth/cursor. MapBundle phải có next action, item đã có và item gợi ý mới khác nhau. Mobile có outline/list tương đương canvas.

## Guardrails

Không dùng vector similarity làm bằng chứng chắc chắn về prerequisite. Không silent merge hoặc xóa review history. Không xuất cả graph mọi người cho model. Không auto-enroll hàng chục item vào SRS từ một intent.

## Kiểm tra bắt buộc

Test duplicate/ambiguous senses, prerequisite cycle, related_to cycle hợp lệ, nonexistent sources, revoke permission, undo, zero retrieval results, >1000 nodes pagination và keyboard/mobile outline.

## Bàn giao / điểm dừng

Bàn giao graph schema, proposal policy, retrieval/evidence contract, UI canvas/list, performance dataset và tests.

Nếu thiếu quyền, dữ liệu nguồn, quyết định nghiệp vụ hoặc contract có mâu thuẫn, báo rõ phần bị chặn; vẫn có thể viết tests hoặc thiết kế local không tác động dữ liệu thật. Không tự mở rộng scope.
