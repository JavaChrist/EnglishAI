/**
 * Supabase database types.
 *
 * Once the schema migrations are applied, regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * The domain-level types below describe the tables planned in the spec and are
 * used across the app until generated types are available.
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Accent = "us" | "uk";
export type Voice = "male" | "female";
export type VocabStatus = "passive" | "active" | "mastered";
export type XpSource =
  | "conversation"
  | "listening"
  | "speaking"
  | "memory"
  | "review";

export interface UsersProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  streak_current: number;
  streak_longest: number;
  acquisition_index: number;
  xp_total: number;
  onboarded: boolean;
  last_active_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface LanguageProfile {
  id: string;
  user_id: string;
  level: CEFRLevel;
  goal: string | null;
  accent: Accent;
  voice: Voice;
  interests: string[];
  daily_minutes: number;
  speaking_confidence: number;
  /** Continuous Krashen i+1 difficulty cursor (0–100). */
  estimated_level: number;
  difficulty_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  scenario: string;
  status: "active" | "completed";
  progress_awarded: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface VocabularyItem {
  id: string;
  user_id: string;
  term: string;
  translation: string | null;
  status: VocabStatus;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  vocabulary_item_id: string;
  due_at: string;
  interval_index: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_key: string;
  unlocked_at: string;
}

export interface XpEvent {
  id: string;
  user_id: string;
  source: XpSource;
  amount: number;
  created_at: string;
}
