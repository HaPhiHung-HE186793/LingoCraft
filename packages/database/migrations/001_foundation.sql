-- Migration 001: Foundation tables
-- Run by: lc_migrate role (NOT lc_app runtime role)
-- Per spec §18.1-18.2, §19.2
--
-- EXPAND/CONTRACT pattern: this migration only ADDS objects.
-- Rollback: see 001_foundation.down.sql
--
-- After applying: run 002_rls.sql to enable row-level security.

-- ─── Extensions ──────────────────────────────────────────────────────────────
-- pgvector for semantic retrieval (M3+); installed now to avoid ALTER TABLE later.
-- pg_trgm for fuzzy text search (M1+).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- pgvector may not be available on all Neon plans; handled in 003_pgvector.sql
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE membership_role AS ENUM ('learner', 'content_reviewer', 'support', 'platform_admin');
CREATE TYPE membership_status AS ENUM ('active', 'revoked', 'invited');

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject TEXT NOT NULL,
  status           user_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- external_subject is immutable identity from provider (Clerk user_xxx).
-- Do NOT use email as permanent key (spec §18.2).
CREATE UNIQUE INDEX users_external_subject_unique ON users (external_subject);

-- ─── tenants ─────────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── memberships ─────────────────────────────────────────────────────────────
-- Links a user to a tenant with a role.
-- unique(tenant_id, user_id): one role per user per tenant.
-- Revoke = UPDATE status = 'revoked'; worker checks this before serving content.
CREATE TABLE memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       membership_role NOT NULL DEFAULT 'learner',
  status     membership_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX memberships_tenant_user_unique ON memberships (tenant_id, user_id);
CREATE INDEX memberships_tenant_idx ON memberships (tenant_id);
CREATE INDEX memberships_user_idx ON memberships (user_id);

-- ─── learner_profiles ────────────────────────────────────────────────────────
-- Per spec §18.2: timezone IANA; goals user-editable.
CREATE TABLE learner_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  timezone         TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  target_languages TEXT[] NOT NULL DEFAULT '{}',
  ui_locale        TEXT NOT NULL DEFAULT 'vi-VN',
  session_mode     TEXT NOT NULL DEFAULT 'light',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT learner_profiles_session_mode_check
    CHECK (session_mode IN ('light', 'medium', 'focus'))
);

-- ─── feature_flags ───────────────────────────────────────────────────────────
-- Scope NULL = global; UUID = tenant-scoped override.
-- Per spec §18.4: kill switch for AI/game/speech.
CREATE TABLE feature_flags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      UUID,  -- NULL = global; UUID = tenant-scoped
  flag       TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  value      TEXT,  -- JSON for non-boolean flags
  revision   TEXT NOT NULL DEFAULT '0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX feature_flags_scope_flag_unique ON feature_flags (scope, flag);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
-- Automatically maintain updated_at on all tables.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER learner_profiles_updated_at
  BEFORE UPDATE ON learner_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
