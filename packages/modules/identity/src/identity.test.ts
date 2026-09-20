/**
 * Unit tests for identity module adapters.
 *
 * Tests:
 *  - FakeAuthAdapter: token lookup, unknown token rejection
 *  - ClerkAuthAdapter: constructor validation, invalid token rejection
 *
 * Per testing-evaluations SKILL.md:
 *   "Unit tests dùng FakeAuthAdapter hoặc mock; không gọi Clerk thật."
 *   "ClerkAuthAdapter integration test dùng real Clerk token từ test user."
 */

import { describe, expect, it } from 'vitest';
import { DomainError, DomainErrorCode, asUserId } from '@lingocraft/domain';
import { FakeAuthAdapter, ClerkAuthAdapter } from './clerk-auth.adapter.js';

describe('FakeAuthAdapter', () => {
  const adapter = new FakeAuthAdapter([
    ['tok_valid_user_a', { userId: asUserId('user-a-uuid'), externalSubject: 'clerk_user_a' }],
    ['tok_valid_user_b', { userId: asUserId('user-b-uuid'), externalSubject: 'clerk_user_b' }],
  ]);

  it('returns identity for known token', async () => {
    const identity = await adapter.verifyToken('tok_valid_user_a');
    expect(identity.userId).toBe('user-a-uuid');
    expect(identity.externalSubject).toBe('clerk_user_a');
  });

  it('returns different identity for different token', async () => {
    const identity = await adapter.verifyToken('tok_valid_user_b');
    expect(identity.userId).toBe('user-b-uuid');
    expect(identity.externalSubject).toBe('clerk_user_b');
  });

  it('throws UNAUTHORIZED for unknown token', async () => {
    await expect(adapter.verifyToken('tok_unknown')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });

  it('throws UNAUTHORIZED for empty token', async () => {
    await expect(adapter.verifyToken('')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });
});

describe('ClerkAuthAdapter', () => {
  it('throws on empty secret key', () => {
    expect(() => new ClerkAuthAdapter('')).toThrow();
  });

  it('throws on secret key shorter than 10 chars', () => {
    expect(() => new ClerkAuthAdapter('short')).toThrow();
  });

  it('constructs successfully with valid-length key', () => {
    expect(() => new ClerkAuthAdapter('sk_test_placeholder_key_longer_than_10')).not.toThrow();
  });

  it('rejects invalid/expired token with UNAUTHORIZED', async () => {
    // Uses real @clerk/backend but with a dummy key + invalid token
    // Clerk SDK will throw a verification error — we map it to DomainError
    const adapter = new ClerkAuthAdapter('sk_test_placeholder_key_longer_than_10');
    await expect(adapter.verifyToken('invalid.jwt.token')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });

  it('rejects empty token with UNAUTHORIZED', async () => {
    const adapter = new ClerkAuthAdapter('sk_test_placeholder_key_longer_than_10');
    await expect(adapter.verifyToken('')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });
});
