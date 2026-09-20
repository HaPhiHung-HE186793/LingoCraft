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
 * 1. PostgreSQL running locally or Neon connection available
 * 2. Migrations 001_foundation.sql and 002_rls.sql applied
 * 3. lc_app role created with limited permissions (no BYPASSRLS)
 * 4. Environment variables:
 *    - DATABASE_URL_APP: connection string for lc_app role (pooler/direct)
 *    - DATABASE_URL_MIGRATE: connection string for lc_migrate role (direct)
 *
 * ── STATUS ────────────────────────────────────────────────────────────────
 * SKIPPED in CI until DATABASE_URL_APP is provided via GitHub Secrets.
 * Tests are written and structurally correct; they will execute when the
 * environment is configured.
 *
 * Per AGENTS.md rule 10: "Khi không thể chạy test, ghi rõ nguyên nhân
 * và phạm vi chưa xác minh."
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
    ? 'DATABASE_URL_APP and DATABASE_URL_MIGRATE not set — integration tests require real PostgreSQL with lc_app role and applied migrations'
    : null;

// ─── Test setup ───────────────────────────────────────────────────────────

let appPool: Pool;
let migratePool: Pool;

// Test data — created fresh per test run, cleaned up after
let userAId: string;
let userBId: string;
let tenantAId: string;
let tenantBId: string;

beforeAll(async () => {
  if (SKIP_REASON) return;

  // migratePool: used only for test setup/teardown (seeding test users)
  // Runs as lc_migrate which can bypass RLS for seeding
  migratePool = new Pool({ connectionString: DATABASE_URL_MIGRATE, max: 2 });

  // appPool: used for all actual security tests — lc_app role, subject to RLS
  appPool = new Pool({ connectionString: DATABASE_URL_APP, max: 5 });

  // Seed test users and tenants
  const setupClient = await migratePool.connect();
  try {
    await setupClient.query('BEGIN');

    // Create tenant A
    const tenantAResult = await setupClient.query<{ id: string }>(
      `INSERT INTO tenants (name) VALUES ('test-tenant-a') RETURNING id`,
    );
    tenantAId = tenantAResult.rows[0]!.id;

    // Create tenant B
    const tenantBResult = await setupClient.query<{ id: string }>(
      `INSERT INTO tenants (name) VALUES ('test-tenant-b') RETURNING id`,
    );
    tenantBId = tenantBResult.rows[0]!.id;

    // Create user A
    const userAResult = await setupClient.query<{ id: string }>(
      `INSERT INTO users (external_subject) VALUES ('test_ext_user_a') RETURNING id`,
    );
    userAId = userAResult.rows[0]!.id;

    // Create user B
    const userBResult = await setupClient.query<{ id: string }>(
      `INSERT INTO users (external_subject) VALUES ('test_ext_user_b') RETURNING id`,
    );
    userBId = userBResult.rows[0]!.id;

    // Membership: A belongs to tenant A
    await setupClient.query(
      `INSERT INTO memberships (tenant_id, user_id, role, status)
       VALUES ($1, $2, 'learner', 'active')`,
      [tenantAId, userAId],
    );

    // Membership: B belongs to tenant B
    await setupClient.query(
      `INSERT INTO memberships (tenant_id, user_id, role, status)
       VALUES ($1, $2, 'learner', 'active')`,
      [tenantBId, userBId],
    );

    await setupClient.query('COMMIT');
  } catch (err) {
    await setupClient.query('ROLLBACK');
    throw err;
  } finally {
    setupClient.release();
  }
});

afterAll(async () => {
  if (SKIP_REASON) return;

  // Cleanup: remove test data
  const cleanupClient = await migratePool.connect();
  try {
    await cleanupClient.query(`DELETE FROM users WHERE external_subject IN ('test_ext_user_a', 'test_ext_user_b')`);
    await cleanupClient.query(`DELETE FROM tenants WHERE name IN ('test-tenant-a', 'test-tenant-b')`);
  } finally {
    cleanupClient.release();
  }

  await appPool.end();
  await migratePool.end();
});

// ─── SEC-01: User A cannot read User B's rows ────────────────────────────

describe('SEC-01: Cross-tenant data isolation', () => {
  it.skipIf(Boolean(SKIP_REASON))('User A scoped to tenant A cannot read User B row', async () => {
    // Request scoped as User A / Tenant A
    const result = await withTenantScope(
      appPool,
      { tenantId: asTenantId(tenantAId), userId: asUserId(userAId) },
      async (client) => {
        // Try to read User B's row — should return empty due to RLS
        const res = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE id = $1`,
          [userBId],
        );
        return res.rows;
      },
    );

    // RLS policy: users can only see their own row
    expect(result).toHaveLength(0);
  });

  it.skipIf(Boolean(SKIP_REASON))('User A cannot access User B membership in tenant B', async () => {
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

    // User A can only see their own memberships
    expect(result).toHaveLength(0);
  });
});

// ─── SEC-02: Reused pooled connection does not leak scope ─────────────────

describe('SEC-02: Connection pool scope isolation', () => {
  it.skipIf(Boolean(SKIP_REASON))('Sequential requests from different users do not share scope', async () => {
    // First request: scoped as User A
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

    // Second request: scoped as User B (may reuse the same connection)
    const resultB = await withTenantScope(
      appPool,
      { tenantId: asTenantId(tenantBId), userId: asUserId(userBId) },
      async (client) => {
        // User B should see their own row
        const resOwn = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE id = $1`,
          [userBId],
        );
        // User B should NOT see User A's row
        const resCross = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE id = $1`,
          [userAId],
        );
        return { own: resOwn.rows, cross: resCross.rows };
      },
    );

    // User A saw their row
    expect(resultA).toHaveLength(1);
    expect(resultA[0]!.id).toBe(userAId);

    // User B saw their own row
    expect(resultB.own).toHaveLength(1);
    expect(resultB.own[0]!.id).toBe(userBId);

    // User B did NOT see User A's row (no scope leak)
    expect(resultB.cross).toHaveLength(0);
  });
});

// ─── Status report (always runs) ─────────────────────────────────────────

describe('Integration test environment status', () => {
  it('reports why integration tests are skipped if no DB configured', () => {
    if (SKIP_REASON) {
      // This is the expected state in CI without secrets configured.
      // The test explicitly documents the skip reason per AGENTS.md rule 10.
      console.warn(`[SKIPPED] ${SKIP_REASON}`);
      expect(SKIP_REASON).toContain('DATABASE_URL_APP');
    } else {
      // DB is configured — integration tests ran above
      expect(DATABASE_URL_APP).toBeTruthy();
    }
  });
});
