import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Progress } from "@/components/ui/progress";
import { BADGE_GROUPS, BADGE_TIERS, BADGES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Badges",
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
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
          <p className="text-muted-foreground">
            Small milestones across every activity — climb from bronze to
            diamond.
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
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(
              Object.entries(BADGE_TIERS) as [
                keyof typeof BADGE_TIERS,
                (typeof BADGE_TIERS)[keyof typeof BADGE_TIERS],
              ][]
            )
              .sort((a, b) => a[1].rank - b[1].rank)
              .map(([tier, style]) => (
                <span key={tier} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-3 rounded-full border",
                      style.bg,
                      style.ring,
                    )}
                  />
                  {style.label}
                </span>
              ))}
          </div>
        </div>

        {BADGE_GROUPS.map((group) => {
          const items = BADGES.filter((b) => b.group === group);
          if (items.length === 0) return null;
          const groupUnlocked = items.filter((b) =>
            earnedMap.has(b.key),
          ).length;
          return (
            <section key={group} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{group}</h2>
                <span className="text-xs text-muted-foreground">
                  {groupUnlocked} / {items.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((badge) => {
                  const Icon = badge.icon;
                  const unlockedAt = earnedMap.get(badge.key);
                  const unlocked = Boolean(unlockedAt);
                  const tier = BADGE_TIERS[badge.tier];
                  return (
                    <div
                      key={badge.key}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                        unlocked
                          ? cn("bg-card", tier.ring)
                          : "border-border/60 bg-muted/30",
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex size-12 shrink-0 items-center justify-center rounded-xl",
                          unlocked
                            ? cn(tier.bg, tier.icon)
                            : "bg-muted text-muted-foreground/50",
                        )}
                      >
                        <Icon className="size-6" />
                        {!unlocked && (
                          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                            <Lock className="size-2.5" />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold",
                              !unlocked && "text-muted-foreground",
                            )}
                          >
                            {badge.label}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                              unlocked
                                ? cn(tier.icon, tier.ring)
                                : "border-border/60 text-muted-foreground/60",
                            )}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                        {unlockedAt && (
                          <p className={cn("text-xs font-medium", tier.icon)}>
                            {formatDate(unlockedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
