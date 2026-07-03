"use client";

import { Check, Loader2, PartyPopper, Volume2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useTts } from "@/components/conversation/use-tts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { XP_REWARDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  reviewId: string;
  term: string;
  translation: string;
};

type Exercise = {
  item: ReviewItem;
  kind: "mcq" | "type";
  options: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExercises(items: ReviewItem[], distractors: string[]): Exercise[] {
  return items.map((item) => {
    const pool = distractors.filter(
      (d) => normalize(d) !== normalize(item.term),
    );
    const uniquePool = Array.from(new Set(pool.map((p) => p.toLowerCase())));

    if (uniquePool.length >= 3 && Math.random() < 0.6) {
      const picks = shuffle(uniquePool).slice(0, 3);
      return {
        item,
        kind: "mcq",
        options: shuffle([item.term, ...picks]),
      };
    }
    return { item, kind: "type", options: [] };
  });
}

export function ReviewSession({
  items,
  distractors,
  voice,
}: {
  items: ReviewItem[];
  distractors: string[];
  voice: "male" | "female";
}) {
  const exercises = React.useMemo(
    () => buildExercises(items, distractors),
    [items, distractors],
  );

  const { speak } = useTts(voice);

  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<"answering" | "feedback" | "done">(
    "answering",
  );
  const [typed, setTyped] = React.useState("");
  const [lastCorrect, setLastCorrect] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const total = exercises.length;
  const current = exercises[index];

  const grade = React.useCallback(
    async (answer: string) => {
      if (submitting || phase !== "answering") return;
      const correct = normalize(answer) === normalize(current.item.term);
      setLastCorrect(correct);
      if (correct) setCorrectCount((c) => c + 1);
      setPhase("feedback");
      void speak(current.item.reviewId, current.item.term);

      setSubmitting(true);
      try {
        await fetch("/api/review/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: current.item.reviewId, correct }),
        });
      } catch (error) {
        console.error("[review] schedule failed", error);
      } finally {
        setSubmitting(false);
      }
    },
    [current, phase, speak, submitting],
  );

  function next() {
    setTyped("");
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setPhase("answering");
    } else {
      setPhase("done");
    }
  }

  if (phase === "done") {
    const xp = correctCount * XP_REWARDS.review;
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PartyPopper className="size-8" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Review complete!</h1>
          <p className="text-muted-foreground">
            {correctCount} / {total} correct · +{xp} XP
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/dashboard" />}>Back to dashboard</Button>
          <Button variant="outline" render={<Link href="/conversation" />}>
            Conversation
          </Button>
        </div>
      </main>
    );
  }

  const progress = Math.round((index / total) * 100);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Word {index + 1} of {total}
          </span>
          <span>{correctCount} correct</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          What&apos;s this in English?
        </p>
        <p className="mt-2 text-2xl font-bold">{current.item.translation}</p>
      </div>

      {phase === "answering" ? (
        current.kind === "mcq" ? (
          <div className="grid gap-2">
            {current.options.map((option) => (
              <Button
                key={option}
                variant="outline"
                className="h-12 justify-start text-base"
                onClick={() => void grade(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) void grade(typed);
            }}
            className="flex flex-col gap-3"
          >
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type the English word…"
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
            />
            <Button
              type="submit"
              className="h-12"
              disabled={!typed.trim()}
            >
              Check
            </Button>
          </form>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4",
              lastCorrect
                ? "border-green-500/40 bg-green-500/10"
                : "border-red-500/40 bg-red-500/10",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-white",
                lastCorrect ? "bg-green-500" : "bg-red-500",
              )}
            >
              {lastCorrect ? (
                <Check className="size-5" />
              ) : (
                <X className="size-5" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium">
                {lastCorrect ? "Correct!" : "Not quite"}
              </p>
              <p className="text-sm text-muted-foreground">
                {current.item.term} — {current.item.translation}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() =>
                void speak(current.item.reviewId, current.item.term)
              }
              aria-label="Hear pronunciation"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </Button>
          </div>
          <Button className="h-12" onClick={next} autoFocus>
            {index < total - 1 ? "Next word" : "Finish"}
          </Button>
        </div>
      )}
    </main>
  );
}
