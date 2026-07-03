import {
  Annoyed,
  Bike,
  Briefcase,
  Clapperboard,
  Coffee,
  Dumbbell,
  Ear,
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
  Music,
  PartyPopper,
  Plane,
  ShoppingBag,
  Smile,
  Sparkles,
  Stethoscope,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";

import type { CEFRLevel } from "@/types/database";

/** Conversation Lab scenarios (spec). */
export const SCENARIOS = [
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

/** Gamification badges (spec). */
export const BADGES = [
  { key: "first_conversation", label: "First Conversation", icon: PartyPopper },
  { key: "7_day_streak", label: "7 Day Streak", icon: Flame },
  { key: "100_words_heard", label: "100 Words Heard", icon: Ear },
  { key: "travel_ready", label: "Travel Ready", icon: Globe },
  { key: "native_listener", label: "Native Listener", icon: Headphones },
  { key: "motorcycle_talker", label: "Motorcycle Talker", icon: Bike },
  { key: "business_starter", label: "Business Starter", icon: Briefcase },
] as const;
