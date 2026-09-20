/**
 * Unit tests for review eligibility policy.
 *
 * These tests cover the 10 golden fixture cases from
 * LingoCraft_AI_Implementation_Kit/fixtures/review-policy-cases.json
 * plus additional edge cases.
 *
 * Per testing-evaluations SKILL.md: "Không nói tests pass nếu chưa chạy."
 * Run: pnpm --filter @lingocraft/domain test
 */

import { describe, expect, it } from 'vitest';
import { determineReviewEligibility } from './review-policy.js';
import type { ReviewEligibilityInput } from './review-policy.js';

// ─── Golden cases from review-policy-cases.json ────────────────────────────
// Mapped from fixture fields:
//   task → taskKind
//   hint_before_first → hintBeforeFirstAttempt
//   first_verdict → firstVerdict
//   self_rating → selfRating
//   expected → expected rating or 'NO_UPDATE'

interface GoldenCase {
  id: string;
  input: ReviewEligibilityInput;
  expected: 'Again' | 'Hard' | 'Good' | 'Easy' | 'NO_UPDATE';
}

const goldenCases: GoldenCase[] = [
  {
    id: 'RC-001',
    input: { taskKind: 'free_recall', hintBeforeFirstAttempt: false, firstVerdict: 'correct' },
    expected: 'Good',
  },
  {
    id: 'RC-002',
    input: {
      taskKind: 'free_recall',
      hintBeforeFirstAttempt: false,
      firstVerdict: 'correct',
      selfRating: 'Hard',
    },
    expected: 'Hard',
  },
  {
    id: 'RC-003',
    input: {
      taskKind: 'free_recall',
      hintBeforeFirstAttempt: false,
      firstVerdict: 'correct',
      selfRating: 'Easy',
    },
    expected: 'Easy',
  },
  {
    id: 'RC-004',
    input: { taskKind: 'free_recall', hintBeforeFirstAttempt: false, firstVerdict: 'incorrect' },
    expected: 'Again',
  },
  {
    id: 'RC-005',
    input: { taskKind: 'free_recall', hintBeforeFirstAttempt: true, firstVerdict: 'correct' },
    expected: 'NO_UPDATE',
  },
  {
    id: 'RC-006',
    input: { taskKind: 'free_recall', hintBeforeFirstAttempt: true, firstVerdict: 'incorrect' },
    expected: 'NO_UPDATE',
  },
  {
    id: 'RC-007',
    input: { taskKind: 'recognition', hintBeforeFirstAttempt: false, firstVerdict: 'correct' },
    expected: 'NO_UPDATE',
  },
  {
    id: 'RC-008',
    input: { taskKind: 'recognition', hintBeforeFirstAttempt: false, firstVerdict: 'incorrect' },
    expected: 'NO_UPDATE',
  },
  {
    id: 'RC-009',
    input: { taskKind: 'assisted', hintBeforeFirstAttempt: false, firstVerdict: 'correct' },
    expected: 'NO_UPDATE',
  },
  {
    id: 'RC-010',
    input: { taskKind: 'free_recall', hintBeforeFirstAttempt: false, firstVerdict: 'uncertain' },
    expected: 'NO_UPDATE',
  },
];

describe('determineReviewEligibility — golden fixture cases', () => {
  for (const { id, input, expected } of goldenCases) {
    it(`${id}: ${JSON.stringify(input)} → ${expected}`, () => {
      const result = determineReviewEligibility(input);
      if (expected === 'NO_UPDATE') {
        expect(result.eligible).toBe(false);
      } else {
        expect(result.eligible).toBe(true);
        if (result.eligible) {
          expect(result.rating).toBe(expected);
        }
      }
    });
  }
});

describe('determineReviewEligibility — LRN-01: hint after first attempt does NOT block update', () => {
  it('LRN-01: correct first attempt (no hint before), hint shown after → still eligible for Good', () => {
    // Hint AFTER first attempt is captured in assistanceLevels/attempt data,
    // not in hintBeforeFirstAttempt. This test confirms the policy boundary.
    const result = determineReviewEligibility({
      taskKind: 'free_recall',
      hintBeforeFirstAttempt: false,
      firstVerdict: 'correct',
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) expect(result.rating).toBe('Good');
  });

  it('LRN-01: incorrect first attempt, then hint shown, correct on retry → still Again rating', () => {
    // The rating is based on the FIRST attempt. Correct after hint does not
    // become "Good" free recall. (spec §02.4, LRN-01)
    const result = determineReviewEligibility({
      taskKind: 'free_recall',
      hintBeforeFirstAttempt: false,
      firstVerdict: 'incorrect',
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) expect(result.rating).toBe('Again');
  });
});

describe('determineReviewEligibility — LRN-02: assisted recognition stays practice_only', () => {
  it('LRN-02: recognition task with hint before attempt → NO_UPDATE', () => {
    const result = determineReviewEligibility({
      taskKind: 'recognition',
      hintBeforeFirstAttempt: true,
      firstVerdict: 'correct',
    });
    expect(result.eligible).toBe(false);
  });

  it('LRN-02: production task correct → NO_UPDATE (not free_recall)', () => {
    const result = determineReviewEligibility({
      taskKind: 'production',
      hintBeforeFirstAttempt: false,
      firstVerdict: 'correct',
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toBe('not_free_recall');
  });
});
