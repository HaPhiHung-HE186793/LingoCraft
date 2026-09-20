/**
 * Core domain types for LingoCraft.
 * These are pure value types with no framework or ORM dependencies.
 * Per AGENTS.md: domain must not import ORM/model SDK.
 */

// ─── Branded ID types ────────────────────────────────────────────────────────
// Using branded types prevents accidental ID confusion (e.g. passing UserId where TenantId expected)

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type TenantId = Brand<string, 'TenantId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type RevisionId = Brand<string, 'RevisionId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type AttemptId = Brand<string, 'AttemptId'>;
export type RequestId = Brand<string, 'RequestId'>;

/**
 * Construct a branded ID from an unknown string.
 * Server-side only — never trust client-supplied IDs without DB lookup.
 */
export function asUserId(raw: string): UserId {
  return raw as UserId;
}
export function asTenantId(raw: string): TenantId {
  return raw as TenantId;
}
export function asItemId(raw: string): ItemId {
  return raw as ItemId;
}
export function asRevisionId(raw: string): RevisionId {
  return raw as RevisionId;
}

// ─── Clock (injectable for testing) ─────────────────────────────────────────

export interface Clock {
  /** Returns current UTC time. Injected to allow deterministic tests. */
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(iso: string): Clock {
  const fixed = new Date(iso);
  return { now: () => new Date(fixed.getTime()) };
}

// ─── Tenant context ──────────────────────────────────────────────────────────

/**
 * Resolved from identity token + DB membership check.
 * NEVER constructed from request body values.
 * Per AGENTS.md rule 1: tenant scope from verified identity + membership only.
 */
export interface TenantContext {
  readonly tenantId: TenantId;
  readonly userId: UserId;
  readonly role: MembershipRole;
}

export type MembershipRole = 'learner' | 'content_reviewer' | 'support' | 'platform_admin';

// ─── Stable error codes ──────────────────────────────────────────────────────

export const DomainErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  REVIEW_INELIGIBLE: 'REVIEW_INELIGIBLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// ─── Language types ──────────────────────────────────────────────────────────

export type TargetLanguage = 'en' | 'ja';
export type UiLocale = 'vi-VN';

// ─── Review / FSRS domain types ──────────────────────────────────────────────

/**
 * Rating passed to the FSRS scheduler.
 * The scheduler lives behind SchedulerPort — LLM must not write the formula.
 */
export type RecallRating = 'Again' | 'Hard' | 'Good' | 'Easy';

/**
 * Verdict of a learner's response before rating is determined.
 */
export type ResponseVerdict = 'correct' | 'incorrect' | 'uncertain';

/**
 * Task type determines eligibility rules.
 * 'free_recall' is the only mode that can update long-term memory state.
 */
export type TaskKind = 'free_recall' | 'recognition' | 'production' | 'assisted';

/**
 * Memory card state values (compatible with FSRS state machine).
 */
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface MemoryCard {
  readonly userId: UserId;
  readonly variantId: string;
  readonly state: CardState;
  readonly dueAt: Date;
  readonly stability: number;
  readonly difficulty: number;
  readonly version: number;
}

export interface ScheduledCard {
  readonly state: CardState;
  readonly dueAt: Date;
  readonly stability: number;
  readonly difficulty: number;
}

/**
 * Port interface: FSRS scheduler lives in an adapter; domain calls this port.
 * Per spec §17.4: tests fix clock/seed for reproducibility.
 */
export interface SchedulerPort {
  schedule(input: {
    card: MemoryCard;
    rating: RecallRating;
    reviewedAt: Date;
    parametersVersion: string;
  }): ScheduledCard;
}
