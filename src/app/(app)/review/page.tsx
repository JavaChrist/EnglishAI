import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Mascot } from "@/components/mascot/mascot";
import { ReviewSession, type ReviewItem } from "@/components/review/review-session";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Review & Memory",
};

type ReviewRow = {
  id: string;
  interval_index: number;
  vocabulary_items: {
    id: string;
    term: string;
    translation: string;
    status: string;
  } | null;
};

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();

  const { data: dueRaw } = await supabase
    .from("reviews")
    .select(
      "id, interval_index, vocabulary_items:vocabulary_item_id (id, term, translation, status)",
    )
    .eq("user_id", user.id)
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(20);

  const due = (dueRaw ?? []) as unknown as ReviewRow[];

  const { data: lang } = await supabase
    .from("language_profile")
    .select("voice")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: pool } = await supabase
    .from("vocabulary_items")
    .select("term")
    .eq("user_id", user.id)
    .limit(60);

  const voice = (lang?.voice as "male" | "female" | null) ?? "female";
  const distractors = (pool ?? []).map((p) => p.term as string);

  const items: ReviewItem[] = due
    .filter((r) => r.vocabulary_items)
    .map((r) => ({
      reviewId: r.id,
      term: r.vocabulary_items!.term,
      translation: r.vocabulary_items!.translation,
    }));

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
          <Mascot size="xl" priority className="drop-shadow-lg" />
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <span className="font-medium">All caught up!</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              No reviews due right now
            </h1>
            <p className="text-muted-foreground">
              Have a conversation to pick up new words — they&apos;ll come back
              here for review at just the right time.
            </p>
          </div>
          <div className="flex gap-2">
            <Button render={<Link href="/conversation" />}>
              Start a conversation
            </Button>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <ReviewSession items={items} distractors={distractors} voice={voice} />
    </div>
  );
}
