# Deployment examples — not ready-to-apply infrastructure

render.yaml is a reference skeleton: package names/scripts must exist; choose compatible pinned Node and pnpm versions, plan and nearby region; configure every required secret/model/storage/quota variable. Do not apply a paid Blueprint without owner authorization. The YAML parse test does not validate the live Render provider schema or deploy resources.

Build runs at repository root so shared workspace packages are available. API listens on PORT / 0.0.0.0. pg-boss worker uses small direct pool; runtime row access still must be scoped. Direct database URL is not a reason to use owner/superuser. Migration has a separate restricted role and single deployment step.

Vercel project: root apps/web, Next.js framework, monorepo workspace install/build according to actual scripts; public API base URL and publishable auth key only. Verify shared packages are included. Authenticated responses must not enter shared CDN caches. Staging/preview use separate DB/identity/bucket and explicit origin allowlists. Commercial launch must select a suitable plan, not assume Hobby is permitted.

Neon: create migrations/extensions after checking privileges/version, runtime role and RLS tests. Keep pooled and direct secrets separately. Backups/restore and data region must be confirmed in the purchased plan. Do not assume zero-idle cost with queue polling.

Optional cron: enqueue due notifications in UTC while resolving user timezones; use dedupe and current consent. No cron resource is created by this reference file. Choose one scheduling authority rather than double-scheduling in worker and cron.
