/**
 * Clerk auth adapter — implements AuthPort using @clerk/backend SDK v3.
 *
 * Per spec §19.1 and ADR-006:
 *   "Kiểm tra token bằng SDK/backend verification phù hợp,
 *    không tự viết thuật toán xác minh chữ ký."
 *
 * Per safe-ai-generation SKILL.md:
 *   "Không log token hoặc secret; không hardcode key."
 *
 * Verified API (@clerk/backend@3.18.1):
 *   - verifyToken(token, options) is a top-level export
 *   - Returns JwtPayload with .sub = Clerk user ID (external subject)
 *   - Throws on invalid/expired tokens automatically
 *   - Validates signature via JWKS, issuer, exp, nbf
 */

import { verifyToken as clerkVerifyToken } from '@clerk/backend';
import { DomainError, DomainErrorCode, asUserId } from '@lingocraft/domain';
import type { AuthPort, VerifiedIdentity } from './ports.js';

/**
 * ClerkAuthAdapter — production auth verification via Clerk backend SDK.
 *
 * Usage:
 *   const adapter = new ClerkAuthAdapter(process.env.CLERK_SECRET_KEY!);
 *   const identity = await adapter.verifyToken(bearerToken);
 *
 * The returned identity.externalSubject is the Clerk user_id (sub claim).
 * Pass it to ScopeResolver to resolve the internal userId and tenantId.
 */
export class ClerkAuthAdapter implements AuthPort {
  private readonly secretKey: string;

  constructor(secretKey: string) {
    if (!secretKey || secretKey.length < 10) {
      throw new Error('ClerkAuthAdapter: CLERK_SECRET_KEY is required and must not be empty');
    }
    this.secretKey = secretKey;
  }

  async verifyToken(rawToken: string): Promise<VerifiedIdentity> {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new DomainError(DomainErrorCode.UNAUTHORIZED, 'Missing bearer token');
    }

    let payload: Awaited<ReturnType<typeof clerkVerifyToken>>;
    try {
      // verifyToken validates: signature, issuer, exp, nbf, azp
      // Throws on any validation failure (TokenVerificationError)
      payload = await clerkVerifyToken(rawToken, { secretKey: this.secretKey });
    } catch (cause) {
      // Do NOT log rawToken — security risk
      throw new DomainError(
        DomainErrorCode.UNAUTHORIZED,
        'Token verification failed',
        cause instanceof Error ? { reason: cause.message } : undefined,
      );
    }

    const externalSubject = payload.sub;
    if (!externalSubject) {
      throw new DomainError(DomainErrorCode.UNAUTHORIZED, 'Token missing sub claim');
    }

    // Note: userId returned here uses externalSubject as placeholder.
    // The API guard calls ScopeResolver.resolveForSubject(externalSubject)
    // to get the real internal UserId from the users table.
    return {
      userId: asUserId(externalSubject), // overwritten by ScopeResolver in guard
      externalSubject,
    };
  }
}

/**
 * FakeAuthAdapter — for unit/integration tests only.
 * Accepts a pre-configured map of token → identity.
 *
 * Per testing-evaluations SKILL.md: mocks ghi rõ, không gửi provider thật khi test.
 */
export class FakeAuthAdapter implements AuthPort {
  private readonly tokenMap: Map<string, VerifiedIdentity>;

  constructor(entries: Array<[token: string, identity: VerifiedIdentity]>) {
    this.tokenMap = new Map(entries);
  }

  async verifyToken(rawToken: string): Promise<VerifiedIdentity> {
    const identity = this.tokenMap.get(rawToken);
    if (identity === undefined) {
      throw new DomainError(DomainErrorCode.UNAUTHORIZED, 'FakeAuthAdapter: unknown token');
    }
    return identity;
  }
}
