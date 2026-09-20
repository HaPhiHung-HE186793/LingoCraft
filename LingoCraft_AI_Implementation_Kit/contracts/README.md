# Contract reference — vertical slice

Version 1.0.0 chỉ định nghĩa scene_builder_v1. JSON Schema Draft 2020-12; tất cả object control fields đóng additionalProperties. Không cho HTML/JavaScript/CSS hoặc remote asset URL. Text vẫn là dữ liệu không tin cậy, phải render như text, không innerHTML.

Canonical answer và hint content nằm trong private-answer-key.schema.json, không export qua public DTO/package. API cấp hint theo attempt rồi ghi assistance. Public tokens có thể chứa các phần của đáp án vì đây là bài lắp ghép, không phải bài free recall.

Ngoài schema phải có semantic validators: token/node IDs unique, edges tồn tại, source refs thuộc snapshot được phép, accepted sequences dùng token khả dụng với multiplicity đúng, hint levels không trùng, prompt/scene/answer đúng nghĩa. Validator file không thể chứng minh language correctness hoặc authorization server; cần tests/reviewer riêng.

Missing Piece và Intent Match cần schema discriminated riêng trước khi mở feature flag. Không mở additionalProperties để nhét payload mới.
