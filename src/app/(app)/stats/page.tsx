import { BookOpen, Flame, GraduationCap, Headphones, Timer, Zap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Progress } from "@/components/ui/progress";
import { levelToCEFR } from "@/lib/ai/adaptation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Progress",
};

const DAYS = 14;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select(
      "streak_current, streak_longest, xp_total, input_seconds, acquisition_index",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level")
    .eq("user_id", user.id)
    .maybeSingle();

  // Work entirely in UTC days to match the app's streak/XP bookkeeping.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const { data: xpEvents } = await supabase
    .from("xp_events")
    .select("source, amount, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString());

  const { data: vocab } = await supabase
    .from("vocabulary_items")
    .select("status")
    .eq("user_id", user.id);

  const inputMinutes = Math.round(Number(profile?.input_seconds ?? 0) / 60);
  const xpTotal = Number(profile?.xp_total ?? 0);
  const streak = Number(profile?.streak_current ?? 0);
  const streakLongest = Number(profile?.streak_longest ?? 0);
  const cefr = levelToCEFR(Number(lang?.estimated_level ?? 25));
  const acquisitionIndex = Math.round(Number(profile?.acquisition_index ?? 0));

  // Daily XP for the last DAYS days.
  const events = xpEvents ?? [];
  const perDay = new Map<string, number>();
  for (let i = 0; i < DAYS; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    perDay.set(dayKey(d), 0);
  }
  events.forEach((e) => {
    const key = dayKey(new Date(e.created_at as string));
    if (perDay.has(key)) {
      perDay.set(key, (perDay.get(key) ?? 0) + Number(e.amount ?? 0));
    }
  });
  const daily = [...perDay.entries()].map(([key, value]) => ({ key, value }));
  const maxDaily = Math.max(1, ...daily.map((d) => d.value));
  const activeDays = daily.filter((d) => d.value > 0).length;

  // XP by source.
  const bySource = new Map<string, number>();
  events.forEach((e) => {
    const s = e.source as string;
    bySource.set(s, (bySource.get(s) ?? 0) + Number(e.amount ?? 0));
  });
  const sourceRows = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sourceRows.map(([, v]) => v));

  // Vocabulary breakdown.
  const rows = vocab ?? [];
  const wordsTotal = rows.length;
  const passive = rows.filter((r) => r.status === "passive").length;
  const active = rows.filter((r) => r.status === "active").length;
  const mastered = rows.filter((r) => r.status === "mastered").length;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your progress</h1>
          <p className="text-muted-foreground">
            In Krashen&apos;s model, the volume of comprehensible input drives
            acquisition. Keep it flowing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            icon={<Timer className="size-5 text-primary" />}
            label="Comprehensible input"
            value={`${inputMinutes} min`}
          />
          <Tile
            icon={<Zap className="size-5 text-yellow-500" />}
            label="Total XP"
            value={`${xpTotal}`}
          />
          <Tile
            icon={<Flame className="size-5 text-orange-500" />}
            label="Streak"
            value={`${streak} d`}
            sub={`Best: ${streakLongest} d`}
          />
          <Tile
            icon={<GraduationCap className="size-5 text-primary" />}
            label="Estimated level"
            value={cefr}
          />
          <Tile
            icon={<BookOpen className="size-5 text-primary" />}
            label="Words collected"
            value={`${wordsTotal}`}
            sub={`${mastered} mastered`}
          />
          <Tile
            icon={<Headphones className="size-5 text-primary" />}
            label="Acquisition index"
            value={`${acquisitionIndex}/100`}
          />
        </div>

        {/* Daily activity */}
        <section className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Activity — last {DAYS} days</h2>
            <span className="text-sm text-muted-foreground">
              {activeDays} active day{activeDays === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {daily.map((d) => (
              <div
                key={d.key}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                title={`${d.value} XP`}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    d.value > 0 ? "bg-primary" : "bg-muted",
                  )}
                  style={{
                    height: `${Math.max(4, (d.value / maxDaily) * 100)}%`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {Number(d.key.slice(8, 10))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vocabulary breakdown */}
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-4 font-semibold">Vocabulary</h2>
            {wordsTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                No words yet — start a conversation, listen or read to collect
                some.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-muted-foreground/40"
                    style={{ width: `${(passive / wordsTotal) * 100}%` }}
                  />
                  <div
                    className="bg-primary/60"
                    style={{ width: `${(active / wordsTotal) * 100}%` }}
                  />
                  <div
                    className="bg-primary"
                    style={{ width: `${(mastered / wordsTotal) * 100}%` }}
                  />
                </div>
                <ul className="space-y-1.5 text-sm">
                  <LegendRow color="bg-muted-foreground/40" label="Passive" value={passive} />
                  <LegendRow color="bg-primary/60" label="Active" value={active} />
                  <LegendRow color="bg-primary" label="Mastered" value={mastered} />
                </ul>
              </div>
            )}
          </section>

          {/* XP by source */}
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="mb-4 font-semibold">
              Where your XP comes from ({DAYS}d)
            </h2>
            {sourceRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {sourceRows.map(([source, value]) => (
                  <li key={source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize">{source}</span>
                      <span className="text-muted-foreground">{value} XP</span>
                    </div>
                    <Progress value={(value / maxSource) * 100} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("size-3 rounded-sm", color)} />
      <span className="flex-1">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
