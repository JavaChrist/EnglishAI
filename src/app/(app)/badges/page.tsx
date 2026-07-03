import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Progress } from "@/components/ui/progress";
import { BADGES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Badges",
};

const DESCRIPTIONS: Record<string, string> = {
  first_conversation: "Finish your first conversation.",
  "7_day_streak": "Practice 7 days in a row.",
  "100_words_heard": "Collect 100 words in your vocabulary.",
  travel_ready: "Complete a Travel conversation.",
  native_listener: "Finish a Listening Room session.",
  motorcycle_talker: "Complete a Motorcycles conversation.",
  business_starter: "Complete a Business conversation.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BadgesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: earned } = await supabase
    .from("achievements")
    .select("badge_key, unlocked_at")
    .eq("user_id", user.id);

  const earnedMap = new Map<string, string>(
    (earned ?? []).map((e) => [e.badge_key as string, e.unlocked_at as string]),
  );

  const unlockedCount = BADGES.filter((b) => earnedMap.has(b.key)).length;
  const progress = Math.round((unlockedCount / BADGES.length) * 100);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
          <p className="text-muted-foreground">
            Milestones you unlock as you learn.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Collection</span>
            <span className="text-muted-foreground">
              {unlockedCount} / {BADGES.length} unlocked
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            const unlockedAt = earnedMap.get(badge.key);
            const unlocked = Boolean(unlockedAt);
            return (
              <div
                key={badge.key}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-colors",
                  unlocked
                    ? "border-primary/40 bg-card"
                    : "border-border/60 bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-16 items-center justify-center rounded-2xl",
                    unlocked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground/50",
                  )}
                >
                  <Icon className="size-8" />
                  {!unlocked && (
                    <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                      <Lock className="size-3" />
                    </span>
                  )}
                </span>
                <div className="space-y-1">
                  <p
                    className={cn(
                      "font-semibold",
                      !unlocked && "text-muted-foreground",
                    )}
                  >
                    {badge.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {DESCRIPTIONS[badge.key] ?? ""}
                  </p>
                  {unlockedAt && (
                    <p className="text-xs font-medium text-primary">
                      Unlocked {formatDate(unlockedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
