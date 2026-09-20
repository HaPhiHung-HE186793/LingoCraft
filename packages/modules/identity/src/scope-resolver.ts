/**
 * Scope resolver — maps verified identity to TenantContext.
 *
 * Per spec §19.1:
 *   "Map subject sang user nội bộ, kiểm tra trạng thái và membership."
 *
 * Per AGENTS.md rule 1:
 *   "Tenant scope từ identity đã verify + membership,
 *    không từ model hoặc body tự khai."
 *
 * This resolver:
 *   1. Finds or creates the internal user record for an externalSubject.
 *   2. Finds the active membership for that user.
 *   3. Returns a TenantContext that the rest of the app uses for scoping.
 *
 * For new learners: auto-creates a personal tenant + learner membership.
 * The personal tenant model follows spec §03.3 (learner owns their content).
 */

import {
  DomainError,
  DomainErrorCode,
  asTenantId,
  asUserId,
  type TenantContext,
  type UserId,
} from '@lingocraft/domain';
import type { Pool, PoolClient } from 'pg';

export interface ScopeResolverDeps {
  pool: Pool;
}

export class ScopeResolver {
  constructor(private readonly deps: ScopeResolverDeps) {}

  /**
   * Resolve TenantContext for a verified external subject.
   *
   * Runs in a single transaction:
   *   - INSERT ... ON CONFLICT DO NOTHING to find-or-create user
   *   - INSERT ... ON CONFLICT DO NOTHING for tenant + membership (new learners)
   *   - SELECT membership to verify active status
   *
   * The transaction uses NO set_config because it runs as lc_migrate-equivalent
   * startup context; subsequent request transactions use withTenantScope.
   *
   * @throws DomainError FORBIDDEN if membership is revoked/suspended.
   * @throws DomainError UNAUTHORIZED if user is suspended/deleted.
   */
  async resolveForSubject(externalSubject: string): Promise<TenantContext> {
    const client = await this.deps.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find or create user (upsert pattern)
      await client.query(
        `INSERT INTO users (external_subject, status)
         VALUES ($1, 'active')
         ON CONFLICT (external_subject) DO NOTHING`,
        [externalSubject],
      );

      const userResult = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM users WHERE external_subject = $1`,
        [externalSubject],
      );

      const user = userResult.rows[0];
      if (!user) {
        throw new DomainError(DomainErrorCode.UNAUTHORIZED, 'User record could not be created');
      }
      if (user.status !== 'active') {
        throw new DomainError(DomainErrorCode.UNAUTHORIZED, 'User account is not active');
      }

      const userId = asUserId(user.id);

      // 2. Find or create personal tenant for new learners
      // Check if user already has a membership before creating tenant
      const existingMembership = await client.query<{ tenant_id: string }>(
        `SELECT tenant_id FROM memberships WHERE user_id = $1 LIMIT 1`,
        [user.id],
      );

      if (existingMembership.rows.length === 0) {
        // New user — create personal tenant and membership (idempotent)
        const tenantResult = await client.query<{ id: string }>(
          `INSERT INTO tenants (name)
           VALUES ('personal-' || $1::TEXT)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [user.id],
        );
        const tenantId = tenantResult.rows[0]?.id;
        if (tenantId) {
          await client.query(
            `INSERT INTO memberships (tenant_id, user_id, role, status)
             VALUES ($1, $2, 'learner', 'active')
             ON CONFLICT (tenant_id, user_id) DO NOTHING`,
            [tenantId, user.id],
          );
        }
      }

      // 3. Find active membership (primary personal tenant)
      const membershipResult = await client.query<{
        tenant_id: string;
        role: string;
        status: string;
      }>(
        `SELECT m.tenant_id, m.role, m.status
         FROM memberships m
         WHERE m.user_id = $1 AND m.status = 'active'
         ORDER BY m.created_at ASC
         LIMIT 1`,
        [user.id],
      );

      const membership = membershipResult.rows[0];
      if (!membership) {
        throw new DomainError(DomainErrorCode.FORBIDDEN, 'No active membership found for user');
      }

      await client.query('COMMIT');

      return {
        tenantId: asTenantId(membership.tenant_id),
        userId,
        role: membership.role as TenantContext['role'],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
