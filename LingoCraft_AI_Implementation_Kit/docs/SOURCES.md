# Nguồn tham chiếu

Đối chiếu ngày 20/09/2026. Giá, API và phiên bản phải kiểm tra lại khi triển khai.

**[S01] Quizlet — Creating study sets with Smart Assist**

https://help.quizlet.com/hc/en-us/articles/39606772122509-Creating-study-sets-with-Smart-Assist

Phạm vi sử dụng: Xác nhận đối thủ đã có tạo thẻ bằng AI; không dùng định vị 'Quizlet không có AI'.

**[S02] Roediger & Karpicke (2006) — Test-enhanced learning**

https://pubmed.ncbi.nlm.nih.gov/16507066/

Phạm vi sử dụng: Cơ sở cho kiểm tra truy hồi; không phải bằng chứng riêng cho hiệu quả sản phẩm đề xuất.

**[S03] Lally et al. (2010) — How are habits formed**

https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674

Phạm vi sử dụng: Thói quen khác nhau giữa người và hành vi; không hứa hình thành sau 1–2 lần.

**[S04] Pashler et al. — Learning Styles: Concepts and Evidence**

https://journals.sagepub.com/doi/10.1111/j.1539-6053.2009.01038.x

Phạm vi sử dụng: Không gán người học vào 'kiểu học thị giác/thính giác' như một chẩn đoán khoa học.

**[S05] Anki Manual — Deck Options / FSRS**

https://docs.ankiweb.net/deck-options.html

Phạm vi sử dụng: FSRS, retention và tải ôn; phân biệt Hard với quên; cá nhân hóa theo lịch sử.

**[S06] Open Spaced Repetition — ts-fsrs**

https://github.com/open-spaced-repetition/ts-fsrs

Phạm vi sử dụng: Thư viện ứng viên cho adapter lập lịch; kiểm tra phiên bản, API, giấy phép khi triển khai.

**[S07] Council of Europe — CEFR level descriptions**

https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions

Phạm vi sử dụng: Can-do và mô tả năng lực; không quy đổi máy móc sang JLPT.

**[S08] Japan Foundation — Irodori Starter, Lesson 13**

https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L13.pdf

Phạm vi sử dụng: Đối chiếu cách dùng phương tiện + で + 行きます; đã kiểm tra trang PDF 25. Không mặc định quyền sao chép học liệu.

**[S09] British Council — Giving directions**

https://learnenglishteens.britishcouncil.org/skills/listening/a2-listening/giving-directions

Phạm vi sử dụng: Tham chiếu tình huống chỉ đường; ví dụ trong đặc tả là nội dung minh họa tự soạn.

**[S10] NestJS — Documentation**

https://docs.nestjs.com/

Phạm vi sử dụng: Modules, dependency injection, TypeScript; Express/Fastify.

**[S11] Drizzle ORM — Overview**

https://orm.drizzle.team/docs/overview

Phạm vi sử dụng: ORM hướng SQL; xác minh driver và migration tương thích ở thời điểm dựng dự án.

**[S12] Next.js — Progressive Web Apps**

https://nextjs.org/docs/app/guides/progressive-web-apps

Phạm vi sử dụng: Nền tảng triển khai PWA; không đồng nghĩa có quyền của native app.

**[S13] Render — Background Workers**

https://render.com/docs/background-workers

Phạm vi sử dụng: Tiến trình worker cho import, sinh nội dung, media và tác vụ nền.

**[S14] Render — Free instances**

https://render.com/docs/free

Phạm vi sử dụng: Giới hạn sleep, filesystem và loại dịch vụ; không chọn free tier làm cam kết production.

**[S15] Render — Cron Jobs**

https://render.com/docs/cronjobs

Phạm vi sử dụng: Lịch UTC, giới hạn chạy; cần ánh xạ múi giờ người dùng.

**[S16] Render — Monorepo support**

https://render.com/docs/monorepo-support

Phạm vi sử dụng: Build context và service riêng trong một monorepo.

**[S17] Render — Blueprint specification**

https://render.com/docs/blueprint-spec

Phạm vi sử dụng: Mẫu render.yaml; cần xác minh plan, region và lệnh với repo thực tế.

**[S18] Vercel — Hobby plan**

https://vercel.com/docs/plans/hobby

Phạm vi sử dụng: Hobby dành cho cá nhân phi thương mại; launch thương mại phải chọn gói phù hợp.

**[S19] Neon — Connection pooling (official repository mirror)**

https://github.com/neondatabase/website/blob/main/content/docs/connect/connection-pooling.md

Phạm vi sử dụng: Transaction pooling, URL pooled/direct và giới hạn session state. Bản tài liệu chính thức trong repo Neon.

**[S20] Neon — pgvector (official repository mirror)**

https://github.com/neondatabase/website/blob/main/content/docs/extensions/pgvector.md

Phạm vi sử dụng: Khả năng lưu/tìm vector trên Neon; không suy ra năng lực tải chỉ từ số connection.

**[S21] PostgreSQL — Row Security Policies**

https://www.postgresql.org/docs/current/ddl-rowsecurity.html

Phạm vi sử dụng: RLS, owner/BYPASSRLS, default deny; phải test với đúng role runtime.

**[S22] pgvector — Official repository**

https://github.com/pgvector/pgvector

Phạm vi sử dụng: Tìm kiếm vector, filter và trade-off index/recall.

**[S23] PgBouncer — Features**

https://www.pgbouncer.org/features.html

Phạm vi sử dụng: Giới hạn transaction pooling và tính năng phụ thuộc session.

**[S24] pg-boss — Official repository**

https://github.com/timgit/pg-boss

Phạm vi sử dụng: Queue dựa trên PostgreSQL; ứng dụng vẫn phải idempotent với side effect bên ngoài.

**[S25] Cloudflare — R2 documentation**

https://developers.cloudflare.com/r2/

Phạm vi sử dụng: Object storage cho file/ảnh/audio, tách metadata lưu trong Neon.

**[S26] Spring Modulith — Reference documentation**

https://docs.spring.io/spring-modulith/reference/

Phạm vi sử dụng: Phương án Java cho đội ngũ có kinh nghiệm Spring; không buộc dùng hai BE.

**[S27] Clerk — Manual JWT verification**

https://clerk.com/docs/guides/sessions/manual-jwt-verification

Phạm vi sử dụng: Xác minh token, issuer, thời hạn, authorized parties; membership vẫn thuộc ứng dụng.

**[S28] OpenAI — Structured model outputs**

https://developers.openai.com/api/docs/guides/structured-outputs

Phạm vi sử dụng: Schema-constrained output là một lựa chọn adapter, không bảo đảm đúng ngữ nghĩa.

**[S29] OWASP — Top 10 for Large Language Model Applications**

https://owasp.org/projects/top-10-for-large-language-model-applications/

Phạm vi sử dụng: Prompt injection, excessive agency, dữ liệu nhạy cảm và ranh giới tin cậy.

**[S30] React Flow — Learn**

https://reactflow.dev/learn

Phạm vi sử dụng: Renderer bản đồ tương tác; thư viện không thay thế mô hình ngữ nghĩa.

**[S31] W3C — Web Content Accessibility Guidelines 2.2**

https://www.w3.org/TR/WCAG22/

Phạm vi sử dụng: Mục tiêu AA: contrast, keyboard, drag alternative; 44–48 px là lựa chọn thiết kế nâng cao.

**[S32] WebKit — Web Push for Web Apps on iOS and iPadOS**

https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

Phạm vi sử dụng: iOS/iPadOS 16.4+, Home Screen app, quyền qua thao tác trực tiếp; OS kiểm soát thông báo.

**[S33] Apple — WidgetKit**

https://developer.apple.com/documentation/widgetkit

Phạm vi sử dụng: Hướng native widget; tính năng cụ thể cần prototype theo phiên bản hệ điều hành.

**[S34] Android — Create notifications**

https://developer.android.com/develop/ui/compose/notifications/create-notification

Phạm vi sử dụng: Thông báo native Android; quyền và hành vi theo hệ điều hành.

**[S35] Android 14 — Secure full-screen Intent notifications**

https://developer.android.com/about/versions/14/behavior-changes-14#secure-fsi

Phạm vi sử dụng: Full-screen intent không phải lối tắt hợp lệ để cưỡng ép flashcard mỗi lần bật máy.

**[S36] VS Code — Agent Skills**

https://code.visualstudio.com/docs/agent-customization/agent-skills

Phạm vi sử dụng: Đường dẫn .agents/skills được hỗ trợ bởi agent tương thích; không phải mọi extension đều giống nhau.

**[S37] Google Antigravity — Agent Skills**

https://antigravity.google/docs/skills

Phạm vi sử dụng: Workspace skills .agents/skills; .agent/skills được giữ cho tương thích.

**[S38] Agent Skills — Specification**

https://agentskills.io/specification

Phạm vi sử dụng: SKILL.md, YAML frontmatter, mô tả để chọn skill và progressive disclosure.

**[S39] Render — Pricing**

https://render.com/pricing

Phạm vi sử dụng: Đối chiếu gói lúc mua; số tiền trong mô hình ngân sách của tài liệu là giả định, không báo giá.

**[S40] Vercel — Pricing**

https://vercel.com/pricing

Phạm vi sử dụng: Đối chiếu gói thương mại và usage lúc mua; không khóa giá hiện hành vào đặc tả.
