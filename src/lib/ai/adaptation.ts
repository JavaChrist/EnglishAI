import type { CEFRLevel } from "@/types/database";

/**
 * Krashen i+1 engine — continuous difficulty.
 *
 * The learner's ability is modeled as a continuous value on a 0–100 scale
 * (`estimated_level`) that moves after every interaction to keep the learner
 * in their "comprehensible input + 1" sweet spot. The CEFR label is only a
 * derived, informational view of this value.
 */

export const LEVEL_MIN = 0;
export const LEVEL_MAX = 100;

/** Target comprehension band that defines the i+1 sweet spot. */
export const TARGET_COMPREHENSION = { min: 0.7, max: 0.85 } as const;

/** Approximate center of each CEFR band on the 0–100 scale. */
const CEFR_BASE: Record<CEFRLevel, number> = {
  A1: 10,
  A2: 25,
  B1: 45,
  B2: 60,
  C1: 78,
  C2: 92,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampLevel(value: number) {
  return clamp(value, LEVEL_MIN, LEVEL_MAX);
}

/** Initial estimate from the self-reported CEFR level and speaking confidence. */
export function initialEstimatedLevel(
  level: CEFRLevel,
  speakingConfidence: number,
): number {
  const base = CEFR_BASE[level] ?? CEFR_BASE.A2;
  const nudge = (clamp(speakingConfidence, 1, 5) - 3) * 2;
  return clampLevel(base + nudge);
}

/** Derive an informational CEFR label from the continuous level. */
export function levelToCEFR(level: number): CEFRLevel {
  if (level < 18) return "A1";
  if (level < 35) return "A2";
  if (level < 52) return "B1";
  if (level < 70) return "B2";
  if (level < 85) return "C1";
  return "C2";
}

export type PerformanceSignals = {
  /**
   * Absolute estimate (0–100) of the learner's demonstrated proficiency, judged
   * from the English they actually produce. This is the primary anchor.
   */
  proficiency?: number;
  /** 0–1: how well the learner understood the input. */
  comprehension: number;
  /** 0–1: how fluently they produced language (optional). */
  fluency?: number;
  /** 0–1: response speed, 1 = very quick (optional). */
  responseTime?: number;
  /** They explicitly asked to slow down / simplify. */
  askedToSimplify?: boolean;
};

/**
 * Compute the next continuous level after an interaction.
 *
 * The estimate is anchored to the learner's *demonstrated production ability*
 * (a slow exponential moving average toward `proficiency`) so it can't run away
 * from reality: understanding deliberately-simplified i+1 input never inflates
 * the level. A small comprehension-based nudge keeps difficulty ~"+1" above the
 * learner's comfort zone. Upward moves are capped tightly; downward corrections
 * are allowed to be faster so a bad over-estimate snaps back quickly.
 */
export function nextEstimatedLevel(
  current: number,
  signals: PerformanceSignals,
): number {
  const comprehension = clamp(signals.comprehension, 0, 1);

  // Small i+1 nudge based on how the learner coped with the current difficulty.
  let nudge = 0;
  if (signals.askedToSimplify) nudge -= 2;
  if (comprehension >= 0.85) nudge += 1.5;
  else if (comprehension >= TARGET_COMPREHENSION.min) nudge += 0.5;
  else if (comprehension >= 0.5) nudge += 0;
  else if (comprehension >= 0.35) nudge -= 1.5;
  else nudge -= 3;

  if (signals.fluency !== undefined) {
    nudge += (clamp(signals.fluency, 0, 1) - 0.5) * 1.5;
  }

  let next: number;
  if (signals.proficiency !== undefined) {
    const target = clampLevel(signals.proficiency);
    // Gentle pull toward demonstrated ability; equilibrium sits slightly above
    // it (the "+1"), never far below.
    const alpha = 0.3;
    next = current + (target - current) * alpha + nudge;
  } else {
    next = current + nudge;
  }

  // Asymmetric clamp: rise slowly (+4 max), correct downward faster (−12 max).
  next = clamp(next, current - 12, current + 4);
  return clampLevel(next);
}

/**
 * A human/LLM-friendly description of the difficulty to inject into the
 * conversation system prompt so the model stays at i+1.
 */
export function difficultyBrief(level: number): string {
  const cefr = levelToCEFR(level);
  if (level < 18) {
    return `${cefr} (very beginner). Use very short, simple sentences, the most common ~500 words, present tense, speak slowly and warmly.`;
  }
  if (level < 35) {
    return `${cefr} (beginner). Short simple sentences, high-frequency vocabulary, mostly present/past tense, introduce one new word at a time.`;
  }
  if (level < 52) {
    return `${cefr} (intermediate). Natural but clear sentences, everyday vocabulary, gently introduce new expressions and reuse them.`;
  }
  if (level < 70) {
    return `${cefr} (upper-intermediate). Natural pace, richer vocabulary and idioms in context, occasional challenge slightly above comfort.`;
  }
  if (level < 85) {
    return `${cefr} (advanced). Near-native phrasing, nuanced vocabulary, idioms and cultural references.`;
  }
  return `${cefr} (proficient). Fully natural, sophisticated language, subtle nuance and humor.`;
}
