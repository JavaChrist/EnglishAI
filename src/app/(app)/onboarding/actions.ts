"use server";

import { redirect } from "next/navigation";

import { initialEstimatedLevel } from "@/lib/ai/adaptation";
import { createClient } from "@/lib/supabase/server";
import type { CEFRLevel } from "@/types/database";

export type OnboardingInput = {
  level: string;
  goal: string;
  accent: string;
  voice: string;
  interests: string[];
  daily_minutes: number;
  speaking_confidence: number;
};

export async function saveOnboarding(
  input: OnboardingInput,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const estimatedLevel = initialEstimatedLevel(
    input.level as CEFRLevel,
    input.speaking_confidence,
  );

  const { error: profileError } = await supabase
    .from("language_profile")
    .upsert(
      {
        user_id: user.id,
        level: input.level,
        goal: input.goal,
        accent: input.accent,
        voice: input.voice,
        interests: input.interests,
        daily_minutes: input.daily_minutes,
        speaking_confidence: input.speaking_confidence,
        estimated_level: estimatedLevel,
        difficulty_updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: onboardedError } = await supabase
    .from("users_profile")
    .update({ onboarded: true })
    .eq("id", user.id);

  if (onboardedError) {
    return { error: onboardedError.message };
  }

  redirect("/dashboard");
}
