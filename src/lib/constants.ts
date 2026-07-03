import {
  Annoyed,
  Bike,
  BookOpen,
  Briefcase,
  Clapperboard,
  Clock,
  Coffee,
  Dumbbell,
  FlaskConical,
  Flame,
  Frown,
  Gamepad2,
  Globe,
  GraduationCap,
  Headphones,
  Hotel,
  Laptop,
  Laugh,
  Leaf,
  type LucideIcon,
  Meh,
  MessageCircle,
  Mic,
  Music,
  Plane,
  Repeat,
  ShoppingBag,
  Smile,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

import type { CEFRLevel } from "@/types/database";

/** Conversation Lab scenarios (spec). */
export const SCENARIOS = [
  { key: "story", label: "Story Time", icon: Sparkles },
  { key: "coffee_shop", label: "Coffee Shop", icon: Coffee },
  { key: "airport", label: "Airport", icon: Plane },
  { key: "hotel", label: "Hotel", icon: Hotel },
  { key: "motorcycles", label: "Motorcycles", icon: Bike },
  { key: "restaurant", label: "Restaurant", icon: Utensils },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "business", label: "Business", icon: Briefcase },
  { key: "small_talk", label: "Small Talk", icon: MessageCircle },
  { key: "doctor", label: "Doctor", icon: Stethoscope },
  { key: "travel", label: "Travel", icon: Globe },
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
  reading: 15,
} as const;

/** Reading Room passage lengths (approx. word counts). */
export const READING_LENGTHS = [
  { key: "short", label: "Short", words: 120, hint: "~1 min" },
  { key: "medium", label: "Medium", words: 250, hint: "~2 min" },
  { key: "long", label: "Long", words: 450, hint: "~4 min" },
] as const;

/** Two ElevenLabs voices only. */
export const VOICES = [
  { key: "female", label: "Emma (Female)" },
  { key: "male", label: "James (Male)" },
] as const;

export const ACCENTS = [
  { key: "us", label: "American" },
  { key: "uk", label: "British" },
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
  { key: "travel", label: "Travel the world", icon: Globe },
  { key: "work", label: "Work & business", icon: Briefcase },
  { key: "social", label: "Chat & make friends", icon: Users },
  { key: "exams", label: "Pass an exam", icon: GraduationCap },
  { key: "media", label: "Enjoy movies & media", icon: Clapperboard },
  { key: "confidence", label: "Feel more confident", icon: Sparkles },
] as const;

/** Onboarding: interests (feed the AI's comprehensible input). */
export const INTERESTS = [
  { key: "travel", label: "Travel", icon: Plane },
  { key: "food", label: "Food & cooking", icon: Utensils },
  { key: "business", label: "Business", icon: Briefcase },
  { key: "tech", label: "Technology", icon: Laptop },
  { key: "motorcycles", label: "Motorcycles", icon: Bike },
  { key: "sports", label: "Sports", icon: Trophy },
  { key: "music", label: "Music", icon: Music },
  { key: "movies", label: "Movies & series", icon: Clapperboard },
  { key: "science", label: "Science", icon: FlaskConical },
  { key: "health", label: "Health & fitness", icon: Dumbbell },
  { key: "gaming", label: "Gaming", icon: Gamepad2 },
  { key: "nature", label: "Nature", icon: Leaf },
] as const;

/** Onboarding: daily time commitment (minutes). */
export const DAILY_MINUTES_OPTIONS = [5, 10, 15, 30] as const;

/** Onboarding: speaking confidence scale (1–5). */
export const CONFIDENCE_LABELS: {
  value: number;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 1, label: "Very shy", icon: Frown },
  { value: 2, label: "A bit nervous", icon: Annoyed },
  { value: 3, label: "Okay", icon: Meh },
  { value: 4, label: "Pretty confident", icon: Smile },
  { value: 5, label: "Very confident", icon: Laugh },
];

/** Badge tiers, from lowest to highest, with their visual styling. */
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const BADGE_TIERS: Record<
  BadgeTier,
  { label: string; rank: number; icon: string; bg: string; ring: string }
> = {
  bronze: {
    label: "Bronze",
    rank: 1,
    icon: "text-amber-700 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-950/50",
    ring: "border-amber-500/50",
  },
  silver: {
    label: "Silver",
    rank: 2,
    icon: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    ring: "border-slate-400/50",
  },
  gold: {
    label: "Gold",
    rank: 3,
    icon: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-950/50",
    ring: "border-yellow-500/50",
  },
  platinum: {
    label: "Platinum",
    rank: 4,
    icon: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-950/50",
    ring: "border-cyan-500/50",
  },
  diamond: {
    label: "Diamond",
    rank: 5,
    icon: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950/50",
    ring: "border-violet-500/50",
  },
};

/**
 * A metric drives a family of tiered badges. Numeric metrics unlock when the
 * measured value reaches the threshold; the "scenario" metric unlocks when a
 * specific scenario is completed.
 */
export type BadgeMetric =
  | "conversations"
  | "listening"
  | "reading"
  | "speaking"
  | "reviews"
  | "streak"
  | "words"
  | "mastered"
  | "inputMinutes"
  | "level"
  | "scenario";

export type BadgeDef = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tier: BadgeTier;
  metric: BadgeMetric;
  /** Threshold for numeric metrics. */
  threshold: number;
  /** Scenario key for the "scenario" metric. */
  scenario?: string;
  /** Display group label on the Badges page. */
  group: string;
};

/** Gamification badges — many small, tiered milestones that show progression. */
export const BADGES: BadgeDef[] = [
  // Conversations
  { key: "conv_1", label: "First Chat", description: "Finish your first conversation.", icon: MessageCircle, tier: "bronze", metric: "conversations", threshold: 1, group: "Conversations" },
  { key: "conv_5", label: "Chatterbox", description: "Finish 5 conversations.", icon: MessageCircle, tier: "silver", metric: "conversations", threshold: 5, group: "Conversations" },
  { key: "conv_25", label: "Conversationalist", description: "Finish 25 conversations.", icon: MessageCircle, tier: "gold", metric: "conversations", threshold: 25, group: "Conversations" },
  { key: "conv_50", label: "Smooth Talker", description: "Finish 50 conversations.", icon: MessageCircle, tier: "platinum", metric: "conversations", threshold: 50, group: "Conversations" },
  { key: "conv_100", label: "Dialogue Master", description: "Finish 100 conversations.", icon: MessageCircle, tier: "diamond", metric: "conversations", threshold: 100, group: "Conversations" },

  // Listening
  { key: "listen_1", label: "First Listen", description: "Finish a listening session.", icon: Headphones, tier: "bronze", metric: "listening", threshold: 1, group: "Listening" },
  { key: "listen_10", label: "Good Ear", description: "Finish 10 listening sessions.", icon: Headphones, tier: "silver", metric: "listening", threshold: 10, group: "Listening" },
  { key: "listen_25", label: "Sharp Ear", description: "Finish 25 listening sessions.", icon: Headphones, tier: "gold", metric: "listening", threshold: 25, group: "Listening" },
  { key: "listen_50", label: "Native Listener", description: "Finish 50 listening sessions.", icon: Headphones, tier: "platinum", metric: "listening", threshold: 50, group: "Listening" },

  // Reading
  { key: "read_1", label: "First Read", description: "Finish a reading passage.", icon: BookOpen, tier: "bronze", metric: "reading", threshold: 1, group: "Reading" },
  { key: "read_10", label: "Bookworm", description: "Finish 10 reading passages.", icon: BookOpen, tier: "silver", metric: "reading", threshold: 10, group: "Reading" },
  { key: "read_25", label: "Avid Reader", description: "Finish 25 reading passages.", icon: BookOpen, tier: "gold", metric: "reading", threshold: 25, group: "Reading" },
  { key: "read_50", label: "Bibliophile", description: "Finish 50 reading passages.", icon: BookOpen, tier: "platinum", metric: "reading", threshold: 50, group: "Reading" },

  // Speaking
  { key: "speak_1", label: "First Words", description: "Answer your first speaking prompt.", icon: Mic, tier: "bronze", metric: "speaking", threshold: 1, group: "Speaking" },
  { key: "speak_10", label: "Speaking Up", description: "Answer 10 speaking prompts.", icon: Mic, tier: "silver", metric: "speaking", threshold: 10, group: "Speaking" },
  { key: "speak_25", label: "Confident Speaker", description: "Answer 25 speaking prompts.", icon: Mic, tier: "gold", metric: "speaking", threshold: 25, group: "Speaking" },
  { key: "speak_50", label: "Orator", description: "Answer 50 speaking prompts.", icon: Mic, tier: "platinum", metric: "speaking", threshold: 50, group: "Speaking" },

  // Reviews
  { key: "review_10", label: "Memory Starter", description: "Review 10 words.", icon: Repeat, tier: "bronze", metric: "reviews", threshold: 10, group: "Reviews" },
  { key: "review_50", label: "Memory Keeper", description: "Review 50 words.", icon: Repeat, tier: "silver", metric: "reviews", threshold: 50, group: "Reviews" },
  { key: "review_150", label: "Memory Master", description: "Review 150 words.", icon: Repeat, tier: "gold", metric: "reviews", threshold: 150, group: "Reviews" },

  // Streak
  { key: "streak_3", label: "Getting Going", description: "Practice 3 days in a row.", icon: Flame, tier: "bronze", metric: "streak", threshold: 3, group: "Streak" },
  { key: "streak_7", label: "One Week Strong", description: "Practice 7 days in a row.", icon: Flame, tier: "silver", metric: "streak", threshold: 7, group: "Streak" },
  { key: "streak_14", label: "Two Weeks Strong", description: "Practice 14 days in a row.", icon: Flame, tier: "gold", metric: "streak", threshold: 14, group: "Streak" },
  { key: "streak_30", label: "One Month Strong", description: "Practice 30 days in a row.", icon: Flame, tier: "platinum", metric: "streak", threshold: 30, group: "Streak" },
  { key: "streak_100", label: "Unstoppable", description: "Practice 100 days in a row.", icon: Flame, tier: "diamond", metric: "streak", threshold: 100, group: "Streak" },

  // Vocabulary — collected
  { key: "words_10", label: "Word Collector", description: "Collect 10 words.", icon: Sparkles, tier: "bronze", metric: "words", threshold: 10, group: "Vocabulary" },
  { key: "words_50", label: "Word Gatherer", description: "Collect 50 words.", icon: Sparkles, tier: "silver", metric: "words", threshold: 50, group: "Vocabulary" },
  { key: "words_100", label: "Hundred Words", description: "Collect 100 words.", icon: Sparkles, tier: "gold", metric: "words", threshold: 100, group: "Vocabulary" },
  { key: "words_250", label: "Word Hoarder", description: "Collect 250 words.", icon: Sparkles, tier: "platinum", metric: "words", threshold: 250, group: "Vocabulary" },
  { key: "words_500", label: "Lexicon", description: "Collect 500 words.", icon: Sparkles, tier: "diamond", metric: "words", threshold: 500, group: "Vocabulary" },

  // Vocabulary — mastered
  { key: "mastered_5", label: "First Mastery", description: "Master 5 words.", icon: GraduationCap, tier: "bronze", metric: "mastered", threshold: 5, group: "Vocabulary" },
  { key: "mastered_25", label: "Vocabulary Builder", description: "Master 25 words.", icon: GraduationCap, tier: "silver", metric: "mastered", threshold: 25, group: "Vocabulary" },
  { key: "mastered_100", label: "Vocabulary Expert", description: "Master 100 words.", icon: GraduationCap, tier: "gold", metric: "mastered", threshold: 100, group: "Vocabulary" },

  // Comprehensible input time (minutes)
  { key: "input_30", label: "Warmed Up", description: "Reach 30 minutes of input.", icon: Clock, tier: "bronze", metric: "inputMinutes", threshold: 30, group: "Input time" },
  { key: "input_60", label: "One Hour In", description: "Reach 1 hour of input.", icon: Clock, tier: "silver", metric: "inputMinutes", threshold: 60, group: "Input time" },
  { key: "input_300", label: "Five Hours In", description: "Reach 5 hours of input.", icon: Clock, tier: "gold", metric: "inputMinutes", threshold: 300, group: "Input time" },
  { key: "input_600", label: "Ten Hours In", description: "Reach 10 hours of input.", icon: Clock, tier: "platinum", metric: "inputMinutes", threshold: 600, group: "Input time" },
  { key: "input_1500", label: "Immersed", description: "Reach 25 hours of input.", icon: Clock, tier: "diamond", metric: "inputMinutes", threshold: 1500, group: "Input time" },

  // Level milestones (continuous 0–100 estimate)
  { key: "level_a2", label: "Elementary (A2)", description: "Reach an A2 estimated level.", icon: TrendingUp, tier: "bronze", metric: "level", threshold: 18, group: "Level" },
  { key: "level_b1", label: "Intermediate (B1)", description: "Reach a B1 estimated level.", icon: TrendingUp, tier: "silver", metric: "level", threshold: 35, group: "Level" },
  { key: "level_b2", label: "Upper-Intermediate (B2)", description: "Reach a B2 estimated level.", icon: TrendingUp, tier: "gold", metric: "level", threshold: 52, group: "Level" },
  { key: "level_c1", label: "Advanced (C1)", description: "Reach a C1 estimated level.", icon: TrendingUp, tier: "platinum", metric: "level", threshold: 70, group: "Level" },
  { key: "level_c2", label: "Proficient (C2)", description: "Reach a C2 estimated level.", icon: TrendingUp, tier: "diamond", metric: "level", threshold: 85, group: "Level" },

  // Scenario explorers
  { key: "travel_ready", label: "Travel Ready", description: "Complete a Travel conversation.", icon: Globe, tier: "silver", metric: "scenario", threshold: 1, scenario: "travel", group: "Scenarios" },
  { key: "motorcycle_talker", label: "Motorcycle Talker", description: "Complete a Motorcycles conversation.", icon: Bike, tier: "silver", metric: "scenario", threshold: 1, scenario: "motorcycles", group: "Scenarios" },
  { key: "business_starter", label: "Business Starter", description: "Complete a Business conversation.", icon: Briefcase, tier: "silver", metric: "scenario", threshold: 1, scenario: "business", group: "Scenarios" },
];

/** Ordered list of badge groups for display. */
export const BADGE_GROUPS = [
  "Conversations",
  "Listening",
  "Speaking",
  "Reading",
  "Vocabulary",
  "Reviews",
  "Input time",
  "Streak",
  "Level",
  "Scenarios",
] as const;
