/**
 * Integration test: tenant isolation (SEC-01, SEC-02).
 *
 * Per neon-data-security SKILL.md:
 *   "Test A/B tenant trên reused connections với đúng runtime role;
 *    IDOR FK; worker sau revoke; transaction rollback; concurrency pool."
 *
 * Per testing-evaluations SKILL.md:
 *   "Integration dùng PostgreSQL runtime role thật để test RLS; mock DB không đủ."
 *
 * ── PREREQUISITES ─────────────────────────────────────────────────────────
 * 1. PostgreSQL running (Neon) with migrations 001 + 002 applied
 * 2. lc_app role: no BYPASSRLS (runtime role)
 * 3. lc_migrate role: FORCE RLS applies — test setup sets app.user_id per-tx
 * 4. Environment variables:
 *    - DATABASE_URL_APP: pooler URL for lc_app role
 *    - DATABASE_URL_MIGRATE: direct URL for lc_migrate role
 *
 * ── RLS SEEDING STRATEGY ──────────────────────────────────────────────────
 * FORCE RLS blocks inserts from lc_migrate too (no BYPASSRLS).
 * Solution: set app.user_id = <row_id> before each insert so
 * WITH CHECK policies pass. UUIDs are pre-generated client-side.
 *
 * Per AGENTS.md rule 10: "Khi không thể chạy test, ghi rõ nguyên nhân."
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { withTenantScope } from '@lingocraft/database';
import { asUserId, asTenantId } from '@lingocraft/domain';

// ─── Test environment check ───────────────────────────────────────────────

const DATABASE_URL_APP = process.env['DATABASE_URL_APP'];
const DATABASE_URL_MIGRATE = process.env['DATABASE_URL_MIGRATE'];

const SKIP_REASON =
  !DATABASE_URL_APP || !DATABASE_URL_MIGRATE
    ? 'DATABASE_URL_APP and DATABASE_URL_MIGRATE not set — integration tests require real PostgreSQL'
    : null;

// ─── Test state ───────────────────────────────────────────────────────────

let appPool: Pool;
let migratePool: Pool;

let userAId: string;
let userBId: string;
let tenantAId: string;
let tenantBId: string;

// ─── Test data suffix to avoid collisions between runs ────────────────────
const RUN_SUFFIX = Date.now().toString();

// ─── beforeAll: seed data using RLS-aware inserts ─────────────────────────

beforeAll(async () => {
  if (SKIP_REASON) return;

  migratePool = new Pool({ connectionString: DATABASE_URL_MIGRATE, max: 2 });
  appPool = new Pool({ connectionString: DATABASE_URL_APP, max: 5 });

  const c = await migratePool.connect();
  try {
    // ── Step 1: Insert tenants ───────────────────────────────────────────
    // tenants table has SELECT policy (member check) but no INSERT WITH CHECK.
    // FORCE RLS with no INSERT policy = blocked unless app.user_id is set.
    // Set a sentinel value to satisfy the RLS engine (no WITH CHECK on tenants INSERT).
    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', 'seed-bypass', true)`);
    const tA = await c.query<{ id: string }>(
      `INSERT INTO tenants (name) VALUES ($1) RETURNING id`,
      [`test-tenant-a-${RUN_SUFFIX}`],
    );
    tenantAId = tA.rows[0]!.id;
    const tB = await c.query<{ id: string }>(
      `INSERT INTO tenants (name) VALUES ($1) RETURNING id`,
      [`test-tenant-b-${RUN_SUFFIX}`],
    );
    tenantBId = tB.rows[0]!.id;
    await c.query('COMMIT');

    // ── Step 2: Insert user A ────────────────────────────────────────────
    // users WITH CHECK: id::TEXT = current_setting('app.user_id', true)
    // Pre-generate UUID, set it as app.user_id, then insert with that ID.
    await c.query('BEGIN');
    const uA = await c.query<{ id: string }>(`SELECT gen_random_uuid() AS id`);
    userAId = uA.rows[0]!.id;
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userAId]);
    await c.query(
      `INSERT INTO users (id, external_subject) VALUES ($1, $2)`,
      [userAId, `ext_a_${RUN_SUFFIX}`],
    );
    await c.query('COMMIT');

    // ── Step 3: Insert user B ────────────────────────────────────────────
    await c.query('BEGIN');
    const uB = await c.query<{ id: string }>(`SELECT gen_random_uuid() AS id`);
    userBId = uB.rows[0]!.id;
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userBId]);
    await c.query(
      `INSERT INTO users (id, external_subject) VALUES ($1, $2)`,
      [userBId, `ext_b_${RUN_SUFFIX}`],
    );
    await c.query('COMMIT');

    // ── Step 4: Insert membership A → tenant A ───────────────────────────
    // memberships WITH CHECK: user_id::TEXT = current_setting('app.user_id', true)
    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userAId]);
    await c.query(
      `INSERT INTO memberships (tenant_id, user_id, role, status) VALUES ($1, $2, 'learner', 'active')`,
      [tenantAId, userAId],
    );
    await c.query('COMMIT');

    // ── Step 5: Insert membership B → tenant B ───────────────────────────
    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userBId]);
    await c.query(
      `INSERT INTO memberships (tenant_id, user_id, role, status) VALUES ($1, $2, 'learner', 'active')`,
      [tenantBId, userBId],
    );
    await c.query('COMMIT');
  } catch (err) {
    await c.query('ROLLBACK');
    throw err;
  } finally {
    c.release();
  }
});

// ─── afterAll: cleanup test data ─────────────────────────────────────────

afterAll(async () => {
  if (SKIP_REASON) return;

  const c = await migratePool.connect();
  try {
    // Cleanup: memberships cascade-deleted with users/tenants
    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userAId]);
    await c.query(`DELETE FROM users WHERE id = $1`, [userAId]);
    await c.query('COMMIT');

    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', $1, true)`, [userBId]);
    await c.query(`DELETE FROM users WHERE id = $1`, [userBId]);
    await c.query('COMMIT');

    // Tenants cleanup (no RLS restriction on delete check — needs sentinel)
    await c.query('BEGIN');
    await c.query(`SELECT set_config('app.user_id', 'seed-bypass', true)`);
    await c.query(`DELETE FROM tenants WHERE id IN ($1, $2)`, [tenantAId, tenantBId]);
    await c.query('COMMIT');
  } finally {
    c.release();
  }

  await appPool.end();
  await migratePool.end();
});

// ─── SEC-01: User A cannot read User B's rows ─────────────────────────────

describe('SEC-01: Cross-tenant data isolation', () => {
  it.skipIf(Boolean(SKIP_REASON))(
    'User A scoped to tenant A cannot read User B row via RLS',
    async () => {
      const result = await withTenantScope(
        appPool,
        { tenantId: asTenantId(tenantAId), userId: asUserId(userAId) },
        async (client) => {
          const res = await client.query<{ id: string }>(
            `SELECT id FROM users WHERE id = $1`,
            [userBId],
          );
          return res.rows;
        },
      );
      // RLS policy: users can only see their own row → result must be empty
      expect(result).toHaveLength(0);
    },
  );

  it.skipIf(Boolean(SKIP_REASON))(
    'User A cannot access User B membership in tenant B',
    async () => {
      const result = await withTenantScope(
        appPool,
        { tenantId: asTenantId(tenantAId), userId: asUserId(userAId) },
        async (client) => {
          const res = await client.query<{ id: string }>(
            `SELECT id FROM memberships WHERE user_id = $1`,
            [userBId],
          );
          return res.rows;
        },
      );
      // RLS: memberships visible only to owner user
      expect(result).toHaveLength(0);
    },
  );

  it.skipIf(Boolean(SKIP_REASON))(
    'User A can read their own row',
    async () => {
      const result = await withTenantScope(
        appPool,
        { tenantId: asTenantId(tenantAId), userId: asUserId(userAId) },
        async (client) => {
          const res = await client.query<{ id: string }>(
            `SELECT id FROM users WHERE id = $1`,
            [userAId],
          );
          return res.rows;
        },
      );
      // Own row must be visible
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(userAId);
    },
  );
});

// ─── SEC-02: Reused pooled connection does not leak scope ─────────────────

describe('SEC-02: Connection pool scope isolation', () => {
  it.skipIf(Boolean(SKIP_REASON))(
    'Sequential requests from different users do not share scope',
    async () => {
      // First request: User A
      const resultA = await withTenantScope(
        appPool,
        { tenantId: asTenantId(tenantAId), userId: asUserId(userAId) },
        async (client) => {
          const res = await client.query<{ id: string }>(
            `SELECT id FROM users WHERE id = $1`,
            [userAId],
          );
          return res.rows;
        },
      );

      // Second request: User B — may reuse the same pooled connection
      const resultB = await withTenantScope(
        appPool,
        { tenantId: asTenantId(tenantBId), userId: asUserId(userBId) },
        async (client) => {
          const resOwn = await client.query<{ id: string }>(
            `SELECT id FROM users WHERE id = $1`,
            [userBId],
          );
          // B must NOT see A's row (no scope leak from previous connection use)
          const resCross = await client.query<{ id: string }>(
            `SELECT id FROM users WHERE id = $1`,
            [userAId],
          );
          return { own: resOwn.rows, cross: resCross.rows };
        },
      );

      expect(resultA).toHaveLength(1);
      expect(resultA[0]!.id).toBe(userAId);

      expect(resultB.own).toHaveLength(1);
      expect(resultB.own[0]!.id).toBe(userBId);

      // Key assertion: no scope leak between connections
      expect(resultB.cross).toHaveLength(0);
    },
  );
});

// ─── Environment status (always runs) ─────────────────────────────────────

describe('Integration test environment status', () => {
  it('reports skip reason when DB not configured', () => {
    if (SKIP_REASON) {
      console.warn(`[SKIPPED] ${SKIP_REASON}`);
      expect(SKIP_REASON).toContain('DATABASE_URL_APP');
    } else {
      expect(DATABASE_URL_APP).toBeTruthy();
    }
  });
});
