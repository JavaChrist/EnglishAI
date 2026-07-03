import {
  BookOpen,
  ChevronRight,
  Flame,
  Gauge,
  GraduationCap,
  Headphones,
  MessageCircle,
  Mic,
  Repeat,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { DailyReminder } from "@/components/reminders/daily-reminder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { levelToCEFR } from "@/lib/ai/adaptation";
import { BADGES, GOALS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
      "onboarded, display_name, streak_current, acquisition_index, xp_total, input_seconds",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) {
    redirect("/onboarding");
  }

  const { data: lang } = await supabase
    .from("language_profile")
    .select("estimated_level, daily_minutes, goal")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: lastBadge } = await supabase
    .from("achievements")
    .select("badge_key, unlocked_at")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: reviewsDue } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString());

  // Comprehensible input logged so far today (UTC day, matching streak logic).
  const startOfUtcToday = new Date();
  startOfUtcToday.setUTCHours(0, 0, 0, 0);
  const { data: todayInput } = await supabase
    .from("input_events")
    .select("seconds")
    .eq("user_id", user.id)
    .gte("created_at", startOfUtcToday.toISOString());
  const inputMinutesToday = Math.round(
    (todayInput ?? []).reduce((sum, e) => sum + Number(e.seconds ?? 0), 0) / 60,
  );

  const firstName =
    (profile?.display_name as string | null)?.trim() ||
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  const estimatedLevel = Number(lang?.estimated_level ?? 25);
  const cefr = levelToCEFR(estimatedLevel);
  const acquisitionIndex = Number(profile?.acquisition_index ?? 0);
  const streak = Number(profile?.streak_current ?? 0);
  const xp = Number(profile?.xp_total ?? 0);
  const dailyMinutes = Number(lang?.daily_minutes ?? 10);
  const goalLabel = GOALS.find((g) => g.key === lang?.goal)?.label;

  const goalReached = inputMinutesToday >= dailyMinutes;
  const goalProgress = Math.min(
    100,
    Math.round((inputMinutesToday / Math.max(1, dailyMinutes)) * 100),
  );

  const badge = lastBadge
    ? BADGES.find((b) => b.key === lastBadge.badge_key)
    : undefined;

  const actions = [
    {
      href: "/conversation",
      icon: MessageCircle,
      title: "Start Conversation",
      description: "Talk with your AI coach.",
    },
    {
      href: "/listening",
      icon: Headphones,
      title: "Listening Session",
      description: "Train your ear with real audio.",
    },
    {
      href: "/speaking",
      icon: Mic,
      title: "Speaking Room",
      description: "Practice speaking and get feedback.",
    },
    {
      href: "/reading",
      icon: BookOpen,
      title: "Reading Room",
      description: "Read a story at your level.",
    },
    {
      href: "/review",
      icon: Repeat,
      title: "Reviews Due",
      description:
        Number(reviewsDue ?? 0) > 0
          ? `${reviewsDue} word${
              Number(reviewsDue) > 1 ? "s" : ""
            } ready to review.`
          : "Bring back what you've learned.",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hi, {firstName}</h1>
          <p className="text-muted-foreground">
            {goalLabel
              ? `Let's get you closer to: ${goalLabel.toLowerCase()}.`
              : "Ready for today's English?"}
          </p>
        </div>

        {/* Today's Goal */}
        <Card className="overflow-hidden">
          <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              <ProgressRing value={goalProgress}>
                <span className="text-2xl font-bold leading-none">
                  {inputMinutesToday}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {dailyMinutes} min
                </span>
              </ProgressRing>
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="size-4" /> Today&apos;s Goal
                </div>
                <CardTitle className="text-xl">
                  {goalReached
                    ? "Goal reached — great work!"
                    : `${dailyMinutes} minutes of English input`}
                </CardTitle>
                <CardDescription>
                  {goalReached
                    ? "You've hit today's input target. Every extra minute compounds."
                    : "In Krashen's model, daily comprehensible input drives acquisition. Keep the streak alive."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  className="h-11 px-6"
                  render={<Link href="/conversation" />}
                >
                  Start now
                </Button>
                <DailyReminder goalReached={goalReached} />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Flame className="size-5 text-orange-500" />}
            label="Current Streak"
            value={`${streak} ${streak === 1 ? "day" : "days"}`}
          />
          <Card>
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="size-5 text-primary" /> Acquisition Index
              </div>
              <div className="text-2xl font-bold">
                {Math.round(acquisitionIndex)}
                <span className="text-base font-normal text-muted-foreground">
                  /100
                </span>
              </div>
              <Progress value={acquisitionIndex} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="size-5 text-primary" /> Estimated Level
              </div>
              <div className="text-2xl font-bold">{cefr}</div>
              <Progress value={estimatedLevel} />
              <p className="text-xs text-muted-foreground">
                Adapts continuously (i+1)
              </p>
            </CardHeader>
          </Card>
          <StatCard
            icon={<Zap className="size-5 text-yellow-500" />}
            label="Total XP"
            value={`${xp} XP`}
          />
        </div>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-all group-hover:border-primary/60 group-hover:ring-primary/30">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Last badge */}
        <Link href="/badges" className="group block">
          <Card className="transition-all group-hover:border-primary/60 group-hover:ring-primary/30">
            <CardHeader className="flex-row items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
                {(() => {
                  const BadgeIcon = badge?.icon ?? Trophy;
                  return <BadgeIcon className="size-6" />;
                })()}
              </div>
              <div className="flex-1">
                {badge ? (
                  <>
                    <CardTitle>Latest badge: {badge.label}</CardTitle>
                    <CardDescription>
                      View all your badges and what&apos;s next.
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle>Your first badge is waiting</CardTitle>
                    <CardDescription>
                      Finish your first conversation to unlock it.
                    </CardDescription>
                  </>
                )}
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon} {label}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardHeader>
    </Card>
  );
}
