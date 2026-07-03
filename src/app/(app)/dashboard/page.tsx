import {
  Flame,
  Gauge,
  GraduationCap,
  Headphones,
  MessageCircle,
  Repeat,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    .select("onboarded, display_name, streak_current, acquisition_index, xp_total")
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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { count: sessionsToday } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfToday.toISOString());

  const { count: reviewsDue } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString());

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

  const doneToday = Number(sessionsToday ?? 0);
  const dailyTarget = Math.max(1, Math.round(dailyMinutes / 10));
  const goalProgress = Math.min(100, Math.round((doneToday / dailyTarget) * 100));

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
          <h1 className="text-3xl font-bold tracking-tight">
            Hi, {firstName} 👋
          </h1>
          <p className="text-muted-foreground">
            {goalLabel
              ? `Let's get you closer to: ${goalLabel.toLowerCase()}.`
              : "Ready for today's English?"}
          </p>
        </div>

        {/* Today's Goal */}
        <Card className="overflow-hidden">
          <div className="grid gap-4 p-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <CardHeader className="p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" /> Today&apos;s Goal
              </div>
              <CardTitle className="text-xl">
                {dailyMinutes} minutes of English
              </CardTitle>
              <CardDescription>
                A short daily session keeps your acquisition growing. Let&apos;s
                start with a conversation.
              </CardDescription>
              <div className="mt-3">
                <Progress value={goalProgress} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {doneToday >= dailyTarget
                    ? "Goal reached today — nice work! 🎉"
                    : `${doneToday} / ${dailyTarget} session${
                        dailyTarget > 1 ? "s" : ""
                      } today`}
                </p>
              </div>
            </CardHeader>
            <div className="p-4">
              <Button
                size="lg"
                className="h-12 w-full px-8 text-base sm:w-auto"
                render={<Link href="/conversation" />}
              >
                Start now
              </Button>
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
        <div className="grid gap-4 sm:grid-cols-3">
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
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-2xl text-primary">
              {badge ? <span>{badge.emoji}</span> : <Trophy className="size-6" />}
            </div>
            <div>
              {badge ? (
                <>
                  <CardTitle>Latest badge: {badge.label}</CardTitle>
                  <CardDescription>
                    Keep practicing to unlock more.
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
          </CardHeader>
        </Card>
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
