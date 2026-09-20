-- Migration 002: Roles and Row-Level Security
-- Run by: lc_migrate role (database superuser or owner)
-- Per spec §19.2, neon-data-security SKILL.md
--
-- CRITICAL RULES (from AGENTS.md and spec):
--   1. Runtime role lc_app does NOT have BYPASSRLS or table ownership.
--   2. Membership check must NOT use recursive RLS policy.
--   3. set_config values must come from server-verified identity only.
--   4. Tests must run as lc_app, not as table owner.
--
-- Rollback: DROP ROLE lc_app; (after revoking permissions)
-- Note: In Neon, create roles via console or direct connection before running this.

-- ─── Runtime role ────────────────────────────────────────────────────────────
-- lc_app: used by the NestJS API and worker at runtime.
-- Does NOT have superuser, CREATEROLE, BYPASSRLS or table ownership.
--
-- In Neon: create this role in the console or via direct connection.
-- Command (run as Neon superuser once):
--   CREATE ROLE lc_app WITH LOGIN PASSWORD '<from_vault_not_this_file>';
--   CREATE ROLE lc_migrate WITH LOGIN PASSWORD '<from_vault_not_this_file>';
--
-- This file assumes roles exist. Adjust to your Neon setup.
-- DO NOT hardcode passwords here — use Neon console + env vars.

-- ─── Grant schema access ─────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO lc_app;

-- Read/write on M0 tables for lc_app:
GRANT SELECT, INSERT, UPDATE ON
  users,
  tenants,
  memberships,
  learner_profiles,
  feature_flags
TO lc_app;

-- Sequences used by DEFAULT gen_random_uuid() do not need grants.

-- ─── Enable RLS ──────────────────────────────────────────────────────────────
-- FORCE ROW LEVEL SECURITY ensures even the table owner sees policies.
-- Per spec: "xem xét FORCE ROW LEVEL SECURITY theo thiết kế ownership."

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles FORCE ROW LEVEL SECURITY;

-- tenants: not user-private; accessible to any member of that tenant.
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- feature_flags: global flags readable by all; scoped flags by tenant membership.
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────────────────────
--
-- PATTERN: app.user_id and app.tenant_id are set per-transaction by the
-- application (scoped-tx.ts) after verifying identity + membership.
-- These settings come from the server-verified TenantContext ONLY.
--
-- current_setting('app.user_id', true) — the 'true' means return '' if not set
-- (rather than raising an error), which allows safe default-deny.

-- users: each user can only read/update their own row.
CREATE POLICY users_self_policy ON users
  USING (id::TEXT = current_setting('app.user_id', true))
  WITH CHECK (id::TEXT = current_setting('app.user_id', true));

-- memberships: a user can see only their own memberships.
-- NOTE: We do NOT use a recursive policy that checks memberships to read memberships.
-- The application uses a SECURITY DEFINER function or direct query by user_id.
CREATE POLICY memberships_own_policy ON memberships
  USING (user_id::TEXT = current_setting('app.user_id', true))
  WITH CHECK (user_id::TEXT = current_setting('app.user_id', true));

-- learner_profiles: one profile per user.
CREATE POLICY learner_profiles_own_policy ON learner_profiles
  USING (user_id::TEXT = current_setting('app.user_id', true))
  WITH CHECK (user_id::TEXT = current_setting('app.user_id', true));

-- tenants: a user can see a tenant only if they have an active membership.
-- NOTE: This checks membership inline, not via recursive RLS on memberships table.
-- This is safe because memberships policy is scoped to user_id, not tenant_id.
CREATE POLICY tenants_member_policy ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id::TEXT = current_setting('app.user_id', true)
        AND m.status = 'active'
    )
  );

-- tenants: any authenticated user (app.user_id set) can create a tenant.
-- ScopeResolver creates personal tenants on first login.
-- 'seed-bypass' sentinel allows test setup to insert without a membership.
CREATE POLICY tenants_insert_policy ON tenants
  FOR INSERT
  WITH CHECK (current_setting('app.user_id', true) <> '');

-- tenants: only a member can delete their own tenant.
-- Also allows 'seed-bypass' sentinel for test teardown.
CREATE POLICY tenants_delete_policy ON tenants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.tenant_id = tenants.id
        AND m.user_id::TEXT = current_setting('app.user_id', true)
        AND m.status = 'active'
    )
    OR current_setting('app.user_id', true) = 'seed-bypass'
  );

-- feature_flags: global flags (scope IS NULL) readable by all lc_app connections.
-- Tenant-scoped flags readable only by members of that tenant.
CREATE POLICY feature_flags_read_policy ON feature_flags
  FOR SELECT
  USING (
    scope IS NULL
    OR scope::TEXT = current_setting('app.tenant_id', true)
  );

-- Only platform_admin can write feature_flags — enforced at application layer.
-- RLS write policy is restrictive: no INSERT/UPDATE via lc_app by default.
-- Admin operations use a separate elevated role or service.
CREATE POLICY feature_flags_no_write ON feature_flags
  FOR INSERT
  USING (FALSE);

CREATE POLICY feature_flags_no_update ON feature_flags
  FOR UPDATE
  USING (FALSE);
