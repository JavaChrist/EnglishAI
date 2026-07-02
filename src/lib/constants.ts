import type { CEFRLevel } from "@/types/database";

/** Conversation Lab scenarios (spec). */
export const SCENARIOS = [
  { key: "coffee_shop", label: "Coffee Shop", emoji: "☕" },
  { key: "airport", label: "Airport", emoji: "✈️" },
  { key: "hotel", label: "Hotel", emoji: "🏨" },
  { key: "motorcycles", label: "Motorcycles", emoji: "🏍️" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
  { key: "business", label: "Business", emoji: "💼" },
  { key: "small_talk", label: "Small Talk", emoji: "💬" },
  { key: "doctor", label: "Doctor", emoji: "🩺" },
  { key: "travel", label: "Travel", emoji: "🌍" },
] as const;

export type ScenarioKey = (typeof SCENARIOS)[number]["key"];

/** Encouraging feedback phrases — the AI never says "Wrong". */
export const FEEDBACK_PHRASES = [
  "Good try!",
  "Nice sentence!",
  "Almost!",
  "A native speaker would usually say...",
] as const;

/** Spaced repetition intervals in minutes (spec: 10min → 30 days). */
export const SRS_INTERVALS_MINUTES = [
  10,
  60 * 24, // 1 day
  60 * 24 * 3, // 3 days
  60 * 24 * 7, // 7 days
  60 * 24 * 14, // 14 days
  60 * 24 * 30, // 30 days
] as const;

/** Listening Room durations in seconds. */
export const LISTENING_DURATIONS = [30, 60, 120] as const;

/** XP awarded per activity type. */
export const XP_REWARDS = {
  conversation: 20,
  listening: 15,
  speaking: 15,
  memory: 10,
  review: 10,
} as const;

/** Two ElevenLabs voices only. */
export const VOICES = [
  { key: "female", label: "Emma (Female)" },
  { key: "male", label: "James (Male)" },
] as const;

export const ACCENTS = [
  { key: "us", label: "American 🇺🇸" },
  { key: "uk", label: "British 🇬🇧" },
] as const;

export const CEFR_LEVELS: { key: CEFRLevel; label: string }[] = [
  { key: "A1", label: "A1 · Beginner" },
  { key: "A2", label: "A2 · Elementary" },
  { key: "B1", label: "B1 · Intermediate" },
  { key: "B2", label: "B2 · Upper-Intermediate" },
  { key: "C1", label: "C1 · Advanced" },
  { key: "C2", label: "C2 · Proficient" },
];

/** Onboarding: learning goals. */
export const GOALS = [
  { key: "travel", label: "Travel the world", emoji: "🌍" },
  { key: "work", label: "Work & business", emoji: "💼" },
  { key: "social", label: "Chat & make friends", emoji: "💬" },
  { key: "exams", label: "Pass an exam", emoji: "🎓" },
  { key: "media", label: "Enjoy movies & media", emoji: "🎬" },
  { key: "confidence", label: "Feel more confident", emoji: "✨" },
] as const;

/** Onboarding: interests (feed the AI's comprehensible input). */
export const INTERESTS = [
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "food", label: "Food & cooking", emoji: "🍽️" },
  { key: "business", label: "Business", emoji: "💼" },
  { key: "tech", label: "Technology", emoji: "💻" },
  { key: "motorcycles", label: "Motorcycles", emoji: "🏍️" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "movies", label: "Movies & series", emoji: "🎬" },
  { key: "science", label: "Science", emoji: "🔬" },
  { key: "health", label: "Health & fitness", emoji: "💪" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "nature", label: "Nature", emoji: "🌿" },
] as const;

/** Onboarding: daily time commitment (minutes). */
export const DAILY_MINUTES_OPTIONS = [5, 10, 15, 30] as const;

/** Onboarding: speaking confidence scale (1–5). */
export const CONFIDENCE_LABELS: { value: number; label: string; emoji: string }[] =
  [
    { value: 1, label: "Very shy", emoji: "😰" },
    { value: 2, label: "A bit nervous", emoji: "😅" },
    { value: 3, label: "Okay", emoji: "🙂" },
    { value: 4, label: "Pretty confident", emoji: "😃" },
    { value: 5, label: "Very confident", emoji: "😎" },
  ];

/** Gamification badges (spec). */
export const BADGES = [
  { key: "first_conversation", label: "First Conversation", emoji: "🎉" },
  { key: "7_day_streak", label: "7 Day Streak", emoji: "🔥" },
  { key: "100_words_heard", label: "100 Words Heard", emoji: "👂" },
  { key: "travel_ready", label: "Travel Ready", emoji: "🌍" },
  { key: "native_listener", label: "Native Listener", emoji: "🎧" },
  { key: "motorcycle_talker", label: "Motorcycle Talker", emoji: "🏍️" },
  { key: "business_starter", label: "Business Starter", emoji: "💼" },
] as const;
