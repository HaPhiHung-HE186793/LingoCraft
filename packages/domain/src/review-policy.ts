/**
 * Review eligibility policy — pure function, no DB/AI calls.
 *
 * This logic is derived from the reference implementation in
 * LingoCraft_AI_Implementation_Kit/scripts/validate_kit.py (classify_reference).
 *
 * Per AGENTS.md rule 5: FSRS runs via SchedulerPort; this policy only
 * determines eligibility and initial rating — it does NOT call the scheduler.
 *
 * Acceptance criteria: LRN-01, LRN-02 from PROJECT_SPEC §27.2.
 */

import type { RecallRating, ResponseVerdict, TaskKind } from './types.js';

export type SelfRating = 'Hard' | 'Good' | 'Easy';

export interface ReviewEligibilityInput {
  /**
   * Task mode — only free_recall can update long-term memory state.
   * Per LRN-02: if hint was shown before first attempt, result is practice_only.
   */
  taskKind: TaskKind;

  /**
   * Was a hint shown BEFORE the learner's first attempt?
   * If yes → NO_UPDATE regardless of verdict. (LRN-01, LRN-02)
   */
  hintBeforeFirstAttempt: boolean;

  /** Verdict of the learner's FIRST attempt (before any hints). */
  firstVerdict: ResponseVerdict;

  /** Optional self-rating after correct response (affects Hard/Easy branching). */
  selfRating?: SelfRating;
}

export type ReviewEligibilityResult =
  | { eligible: true; rating: RecallRating }
  | { eligible: false; reason: 'not_free_recall' | 'hint_before_first' | 'incorrect_first' | 'uncertain' };

/**
 * Determine review eligibility and initial FSRS rating.
 *
 * Rules (per spec §02.4 and fixture review-policy-cases.json):
 * 1. Only free_recall tasks update memory state.
 * 2. If hint shown before first attempt → practice_only, no update.
 * 3. First attempt incorrect → Again rating (learner saw answer, relearning).
 * 4. Uncertain verdict (edge case, unknown answer) → NO_UPDATE, needs adjudication.
 * 5. Correct first attempt → rating from selfRating (Hard/Easy) or default Good.
 *
 * IMPORTANT: This policy is tested with golden fixtures (review-policy-cases.json).
 * Do NOT modify rules without updating tests and consulting spec §27.2.
 */
export function determineReviewEligibility(
  input: ReviewEligibilityInput,
): ReviewEligibilityResult {
  // Rule 1: only free_recall updates memory state
  if (input.taskKind !== 'free_recall') {
    return { eligible: false, reason: 'not_free_recall' };
  }

  // Rule 2: hint before first attempt → practice only, no memory update
  if (input.hintBeforeFirstAttempt) {
    return { eligible: false, reason: 'hint_before_first' };
  }

  // Rule 3: incorrect first attempt → Again
  if (input.firstVerdict === 'incorrect') {
    return { eligible: true, rating: 'Again' };
  }

  // Rule 4: uncertain → needs human adjudication, no update
  if (input.firstVerdict === 'uncertain') {
    return { eligible: false, reason: 'uncertain' };
  }

  // Rule 5: correct first attempt
  if (input.selfRating === 'Hard') {
    return { eligible: true, rating: 'Hard' };
  }
  if (input.selfRating === 'Easy') {
    return { eligible: true, rating: 'Easy' };
  }
  return { eligible: true, rating: 'Good' };
}
