/**
 * Drizzle ORM schema — foundation tables for M0.
 *
 * Per spec §18.1-18.2 and neon-data-security SKILL.md:
 * - Every private table has tenant_id (composite FK where needed).
 * - UUIDs server-generated; timestamps UTC timestamptz.
 * - RLS policies applied in migration 002_rls.sql using lc_migrate role.
 * - Domain does NOT receive Drizzle entity types; repository layer converts.
 *
 * Tables included in M0:
 *   users, tenants, memberships, learner_profiles, feature_flags
 *
 * Tables for M1+: decks, learning_items, content_revisions, sessions, etc.
 */

import {
  boolean,
  index,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);

export const membershipRoleEnum = pgEnum('membership_role', [
  'learner',
  'content_reviewer',
  'support',
  'platform_admin',
]);

export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'revoked',
  'invited',
]);

// ─── users ───────────────────────────────────────────────────────────────────
// Maps Clerk external_subject to internal UUID.
// Per spec §18.2: unique external_subject; do NOT use email as permanent key.

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Subject claim from identity provider (e.g. Clerk user_xxx). Immutable. */
    externalSubject: text('external_subject').notNull(),
    status: userStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueExternalSubject: unique('users_external_subject_unique').on(t.externalSubject),
  }),
);

// ─── tenants ─────────────────────────────────────────────────────────────────
// Each learner currently has their own private tenant.
// Future: org/class tenants per spec §03.3.

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

// ─── memberships ─────────────────────────────────────────────────────────────
// Per spec §19.1: "check trạng thái và membership" after token verification.
// unique(tenantId, userId) — one role per tenant per user.

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('learner'),
    status: membershipStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueTenantUser: unique('memberships_tenant_user_unique').on(t.tenantId, t.userId),
    tenantIdx: index('memberships_tenant_idx').on(t.tenantId),
    userIdx: index('memberships_user_idx').on(t.userId),
  }),
);

// ─── learner_profiles ────────────────────────────────────────────────────────
// Per spec §18.2: timezone IANA; goals user-editable.

export const learnerProfiles = pgTable('learner_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** IANA timezone e.g. 'Asia/Ho_Chi_Minh'. Used for quiet hours, daily reset. */
  timezone: text('timezone').notNull().default('Asia/Ho_Chi_Minh'),
  /** Target languages being learned. */
  targetLanguages: text('target_languages').array().notNull().default([]),
  /** UI locale — vi-VN is default per spec. */
  uiLocale: text('ui_locale').notNull().default('vi-VN'),
  /** Session mode: light (90s) / medium (3min) / focus (7min). */
  sessionMode: text('session_mode').notNull().default('light'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

// ─── feature_flags ───────────────────────────────────────────────────────────
// Per spec §18.4: kill switch for AI/game/speech features.
// Admin-only writes; not configurable via API without platform_admin role.

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** null scope = global; uuid = tenant-scoped override. */
    scope: uuid('scope'),
    flag: text('flag').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    /** JSON value for non-boolean flags (e.g. quota limits). */
    value: text('value'),
    /** Incremented on each change for audit trail. */
    revision: text('revision').notNull().default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueScopeFlag: unique('feature_flags_scope_flag_unique').on(t.scope, t.flag),
  }),
);

// ─── Type exports for repository layer ───────────────────────────────────────
// Repositories use these types; domain layer uses pure domain types.

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbTenant = typeof tenants.$inferSelect;
export type NewDbTenant = typeof tenants.$inferInsert;
export type DbMembership = typeof memberships.$inferSelect;
export type NewDbMembership = typeof memberships.$inferInsert;
export type DbLearnerProfile = typeof learnerProfiles.$inferSelect;
export type DbFeatureFlag = typeof featureFlags.$inferSelect;
