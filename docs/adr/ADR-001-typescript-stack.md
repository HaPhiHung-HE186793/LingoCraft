# ADR-001 — TypeScript monorepo: NestJS + Next.js + Drizzle

Status: accepted
Date: 2026-09-20
Owner/approver: Chủ dự án (pending explicit approval)

## Bối cảnh và bằng chứng

Spec §15.1 (ADR-001) xác định TypeScript xuyên suốt cho greenfield team.
Team hiện tại làm TypeScript (A02 xác nhận). Greenfield, chưa có code tồn tại.

## Các lựa chọn

1. **TypeScript: NestJS + Next.js + Drizzle** (đã chọn)
2. Java/Spring Modulith (chỉ khi đội chủ lực Java — A02 loại trừ)
3. Python service riêng (không cần — không có ML pipeline tự huấn luyện)

## Quyết định và lý do

- **NestJS**: module + DI giúp tổ chức boundary; không tự bảo đảm SOLID nhưng hỗ trợ.
- **Next.js 15**: App Router, RSC, PWA-ready với next-pwa.
- **Drizzle + pg**: minh bạch SQL, dễ tích hợp RLS, không giấu query.
- **pnpm workspaces**: lockfile nhất quán, peer resolution tốt hơn npm workspaces.
- **Vitest**: tốc độ, ESM native, không cần Babel transform.

## Tác động: data/privacy/cost/operations/UX

- Cost: zero thêm so với plan; lockfile commit giảm CI cache miss.
- Operations: một codebase cho api + worker giảm phức tạp deploy.
- UX: Next.js RSC cho phép SSR cho landing, client-only cho private content.

## Contract/migration/test cần đổi

- Tất cả packages dùng `tsconfig.base.json` extend từ root.
- Web KHÔNG được import database hoặc server-only packages.
- Domain KHÔNG được import ORM hoặc framework.

## Cách đo hiệu quả và điều kiện rollback

- CI: `pnpm build` và `pnpm typecheck` không có error = baseline.
- Rollback: nếu đội chuyển sang Java, tạo ADR-002-java-migration.md trước.

## Nguồn sơ cấp / phiên bản đã kiểm tra

- NestJS 10.4.4 (npmjs.com, 2026-09-20)
- Next.js 15.0.2 (npmjs.com, 2026-09-20)
- Drizzle ORM 0.36.4 (npmjs.com, 2026-09-20)
- pnpm 9.15.4 (npm install -g pnpm@9.15.4, verified running)
- Spec [S10], [S11] trong docs/SOURCES.md
