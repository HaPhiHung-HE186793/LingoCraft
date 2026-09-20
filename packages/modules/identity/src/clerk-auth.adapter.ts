/**
 * Clerk auth adapter — implements AuthPort using @clerk/backend SDK.
 *
 * Per spec §19.1 and ADR-006:
 *   "Kiểm tra token bằng SDK/backend verification phù hợp,
 *    không tự viết thuật toán xác minh chữ ký."
 *
 * IMPORTANT: This adapter requires CLERK_SECRET_KEY environment variable.
 * Do NOT hardcode the key. Do NOT log tokens or secrets.
 *
 * For tests: use FakeAuthAdapter (fake-auth.adapter.ts) instead.
 *
 * Status: SCAFFOLD — Clerk SDK (@clerk/backend) not yet installed.
 * When installing: pin the version that was stable at scaffold time.
 * Run: pnpm --filter @lingocraft/api add @clerk/backend@<verified_version>
 *
 * Unverified claim: We document the expected API here based on Clerk docs.
 * The actual import path and method signature MUST be verified against the
 * installed version before this code is used in production.
 */

import { DomainError, DomainErrorCode, asUserId } from '@lingocraft/domain';
import type { AuthPort, VerifiedIdentity } from './ports.js';

/**
 * ClerkAuthAdapter — production auth verification via Clerk backend SDK.
 *
 * NOTE: @clerk/backend is NOT installed yet (T01 scope).
 * This adapter is a scaffold; actual SDK import is commented out.
 * Install @clerk/backend and uncomment the import in T02 integration work.
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
    // ── SCAFFOLD NOTE ────────────────────────────────────────────────────────
    // When @clerk/backend is installed, replace this block with:
    //
    //   import { createClerkClient } from '@clerk/backend';
    //   const clerk = createClerkClient({ secretKey: this.secretKey });
    //   const payload = await clerk.verifyToken(rawToken);
    //   const externalSubject = payload.sub;
    //   // Map externalSubject → internal userId via DB lookup (see ScopeResolver)
    //
    // Verify the actual API in the installed version's documentation before use.
    // ─────────────────────────────────────────────────────────────────────────

    // Placeholder: always reject until SDK is installed
    void rawToken; // suppress unused warning
    void this.secretKey;
    throw new DomainError(
      DomainErrorCode.UNAUTHORIZED,
      'ClerkAuthAdapter: SDK not yet installed. Use FakeAuthAdapter in tests.',
    );
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
