/**
 * Scoped transaction helper — CRITICAL for tenant isolation.
 *
 * Per spec §19.2 and neon-data-security SKILL.md:
 *   "Trên transaction pooler, mọi set_config/SET LOCAL phải nằm trong cùng
 *    transaction với truy vấn dùng nó."
 *
 * This helper sets app.tenant_id and app.user_id within the transaction scope
 * so that RLS policies can reference them. Values come from server-verified
 * identity and membership — NEVER from request body.
 *
 * WARNING: Do NOT call this with values derived from client input.
 * The caller (use case / application service) is responsible for passing
 * verified TenantContext only.
 */

import type { Pool, PoolClient } from 'pg';
import type { TenantId, UserId } from '@lingocraft/domain';

export interface ScopedTxOptions {
  /**
   * Verified tenant ID from TenantContext — NEVER from request body.
   */
  tenantId: TenantId;
  /**
   * Verified user ID from TenantContext — NEVER from request body.
   */
  userId: UserId;
}

/**
 * Execute a database operation within a tenant-scoped transaction.
 *
 * The transaction:
 * 1. BEGINs
 * 2. Sets app.tenant_id and app.user_id as LOCAL (transaction-scope only)
 * 3. Runs the provided function
 * 4. COMMITs on success, ROLLBACKs on error
 *
 * RLS policies reference current_setting('app.tenant_id') and
 * current_setting('app.user_id') to enforce row-level isolation.
 *
 * @throws Re-throws any error from fn after rolling back.
 */
export async function withTenantScope<T>(
  pool: Pool,
  { tenantId, userId }: ScopedTxOptions,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // true = transaction-local (reset at COMMIT/ROLLBACK)
    // This is correct for both session and transaction pooler modes.
    await client.query(
      `SELECT set_config('app.tenant_id', $1, true),
              set_config('app.user_id', $2, true)`,
      [tenantId, userId],
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a read-only query within tenant scope.
 * Same isolation guarantees as withTenantScope but signals read intent.
 */
export async function withTenantScopeReadonly<T>(
  pool: Pool,
  options: ScopedTxOptions,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.tenant_id', $1, true),
              set_config('app.user_id', $2, true)`,
      [options.tenantId, options.userId],
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create a pg Pool configured for the runtime role (lc_app).
 * This role does NOT have BYPASSRLS or table ownership.
 *
 * Per spec §19.2: "Migration role và runtime role tách biệt."
 * Use DATABASE_URL_APP (pooler URL for lc_app) here.
 * Use DATABASE_URL_MIGRATE (direct URL for lc_migrate) in migrate.ts only.
 */
export function createAppPool(connectionString: string): Pool {
  // pg Pool is imported lazily to avoid the import at module top level
  // (allows testing with mock pool in unit tests)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg') as typeof import('pg');
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000, // 30s query timeout per spec §24.1
    query_timeout: 30_000,
  });
}
