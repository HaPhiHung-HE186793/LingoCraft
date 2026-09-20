/**
 * Auth port — interface that the API guard depends on.
 * Per spec §15.2 ADR-006: "Clerk làm identity provider mặc định qua adapter."
 * Per modular-backend SKILL.md: "Viết domain policy thuần trước, adapter sau."
 *
 * The adapter (ClerkAuthAdapter) implements this port.
 * Tests can inject a FakeAuthAdapter without Clerk SDK.
 */

import type { UserId } from '@lingocraft/domain';

/**
 * Result of a successful token verification.
 * Contains only what the server assigns — never what the client claims.
 */
export interface VerifiedIdentity {
  /** Internal user ID (UUID from users table). */
  userId: UserId;
  /**
   * External subject claim from the identity provider.
   * Used to look up or create the internal user record.
   */
  externalSubject: string;
}

/**
 * Port for verifying bearer tokens.
 * Implementations: ClerkAuthAdapter (production), FakeAuthAdapter (tests).
 *
 * Per spec §19.1: verify signature/JWKS, issuer, exp/nbf, authorized party.
 * Do NOT accept expired or malformed tokens.
 */
export interface AuthPort {
  /**
   * Verify the raw bearer token string.
   * @throws {DomainError} with code UNAUTHORIZED if token is invalid/expired.
   */
  verifyToken(rawToken: string): Promise<VerifiedIdentity>;
}

/**
 * Membership record returned by the scope resolver.
 */
export interface ResolvedMembership {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: 'learner' | 'content_reviewer' | 'support' | 'platform_admin';
}

/**
 * Port for resolving the active tenant membership for a user.
 */
export interface MembershipPort {
  /**
   * Find the active membership for a user (auto-creates personal tenant for learners).
   * @throws {DomainError} FORBIDDEN if no active membership exists.
   */
  resolveActiveMembership(userId: string): Promise<ResolvedMembership>;
}
