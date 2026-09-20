/**
 * Public API error envelope — returned by all API endpoints on error.
 * Per spec §20.1: stable error codes, request_id, no internal details leaked.
 *
 * IMPORTANT: Never include raw DB errors, stack traces, or provider details
 * in the 'message_safe' field — that field is user-facing.
 */

import { z } from 'zod';

export const ErrorEnvelopeSchema = z.object({
  code: z.string(),
  message_safe: z.string(),
  request_id: z.string().uuid(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// ─── Idempotency ─────────────────────────────────────────────────────────────

/**
 * Attempt payload — client submits this when recording a learning attempt.
 * Per spec §20.3: tenant_id, user_id, canonical answer NOT in this payload.
 * Server determines verdict from its own state.
 */
export const AttemptPayloadSchema = z.object({
  client_event_id: z.string().uuid(),
  session_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  expected_card_version: z.number().int().nonnegative(),
  response: z.object({
    kind: z.enum(['text', 'token_sequence', 'audio_ref']),
    value: z.string().max(2000),
  }),
  active_response_ms: z.number().int().nonnegative().max(300_000),
  client_occurred_at: z.string().datetime({ offset: true }),
});

export type AttemptPayload = z.infer<typeof AttemptPayloadSchema>;

// ─── Health ──────────────────────────────────────────────────────────────────

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ─── Preferences ─────────────────────────────────────────────────────────────

export const TargetLanguageSchema = z.enum(['en', 'ja']);
export const UiLocaleSchema = z.enum(['vi-VN']);

export const LearnerPreferencesSchema = z.object({
  target_language: TargetLanguageSchema,
  ui_locale: UiLocaleSchema,
  /** IANA timezone string e.g. 'Asia/Ho_Chi_Minh' */
  timezone: z.string().min(1).max(64),
  /** Session load mode selected by learner — UX preference only */
  session_mode: z.enum(['light', 'medium', 'focus']),
});

export type LearnerPreferences = z.infer<typeof LearnerPreferencesSchema>;
