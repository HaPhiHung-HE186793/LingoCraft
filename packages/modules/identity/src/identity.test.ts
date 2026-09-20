/**
 * Unit tests for identity module.
 *
 * Per testing-evaluations SKILL.md: integration tests with real PG/RLS
 * are in tests/integration/tenant-isolation.test.ts.
 * Unit tests here use FakeAuthAdapter and do NOT touch a database.
 */

import { describe, expect, it } from 'vitest';
import { DomainError, DomainErrorCode, asUserId } from '@lingocraft/domain';
import { FakeAuthAdapter, ClerkAuthAdapter } from './clerk-auth.adapter.js';

describe('FakeAuthAdapter', () => {
  const adapter = new FakeAuthAdapter([
    ['token-user-a', { userId: asUserId('user-a-uuid'), externalSubject: 'ext_a' }],
    ['token-user-b', { userId: asUserId('user-b-uuid'), externalSubject: 'ext_b' }],
  ]);

  it('resolves a known token to the correct identity', async () => {
    const identity = await adapter.verifyToken('token-user-a');
    expect(identity.userId).toBe('user-a-uuid');
    expect(identity.externalSubject).toBe('ext_a');
  });

  it('rejects an unknown token with UNAUTHORIZED error', async () => {
    await expect(adapter.verifyToken('invalid-token')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });

  it('resolves different tokens to different identities', async () => {
    const [a, b] = await Promise.all([
      adapter.verifyToken('token-user-a'),
      adapter.verifyToken('token-user-b'),
    ]);
    expect(a.userId).not.toBe(b.userId);
    expect(a.externalSubject).not.toBe(b.externalSubject);
  });
});

describe('ClerkAuthAdapter (scaffold — SDK not installed)', () => {
  it('rejects all tokens until Clerk SDK is installed', async () => {
    const adapter = new ClerkAuthAdapter('sk_test_placeholder_key_longer_than_10');
    await expect(adapter.verifyToken('any-token')).rejects.toMatchObject({
      code: DomainErrorCode.UNAUTHORIZED,
    });
  });

  it('throws on empty secret key', () => {
    expect(() => new ClerkAuthAdapter('')).toThrow();
  });
});
