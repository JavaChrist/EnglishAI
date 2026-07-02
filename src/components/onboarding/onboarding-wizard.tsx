"use client";

import { Check, ChevronLeft } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { saveOnboarding } from "@/app/(app)/onboarding/actions";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ACCENTS,
  CEFR_LEVELS,
  CONFIDENCE_LABELS,
  DAILY_MINUTES_OPTIONS,
  GOALS,
  INTERESTS,
  VOICES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type StepId =
  | "level"
  | "goal"
  | "accent"
  | "voice"
  | "interests"
  | "time"
  | "confidence";

const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  { id: "level", title: "Where are you starting from?", subtitle: "Just a starting point — EnglishAI keeps adjusting the difficulty every session to keep you at your sweet spot (i+1)." },
  { id: "goal", title: "What's your main goal?", subtitle: "We'll shape your journey around it." },
  { id: "accent", title: "Which accent do you prefer?", subtitle: "You can change this anytime." },
  { id: "voice", title: "Pick your coach's voice", subtitle: "The voice you'll hear the most." },
  { id: "interests", title: "What are you into?", subtitle: "Pick a few — conversations will use these topics." },
  { id: "time", title: "How much time per day?", subtitle: "Small and steady beats long and rare." },
  { id: "confidence", title: "How do you feel about speaking?", subtitle: "No judgment — just so we start gently." },
];

function SelectCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/60 hover:bg-accent/40",
        selected && "border-primary bg-accent/60 ring-2 ring-primary/30",
        className,
      )}
    >
      {children}
      {selected && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" />
        </span>
      )}
    </button>
  );
}

export function OnboardingWizard({ firstName }: { firstName: string }) {
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const [level, setLevel] = React.useState<string | null>(null);
  const [goal, setGoal] = React.useState<string | null>(null);
  const [accent, setAccent] = React.useState<string>("us");
  const [voice, setVoice] = React.useState<string>("female");
  const [interests, setInterests] = React.useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = React.useState<number>(10);
  const [confidence, setConfidence] = React.useState<number | null>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function toggleInterest(key: string) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key],
    );
  }

  const canContinue = (() => {
    switch (current.id) {
      case "level":
        return level !== null;
      case "goal":
        return goal !== null;
      case "accent":
        return Boolean(accent);
      case "voice":
        return Boolean(voice);
      case "interests":
        return interests.length > 0;
      case "time":
        return Boolean(dailyMinutes);
      case "confidence":
        return confidence !== null;
      default:
        return false;
    }
  })();

  async function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    const result = await saveOnboarding({
      level: level!,
      goal: goal!,
      accent,
      voice,
      interests,
      daily_minutes: dailyMinutes,
      speaking_confidence: confidence!,
    });
    // On success the server action redirects; we only get here on error.
    if (result?.error) {
      setSubmitting(false);
      toast.error(result.error);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        {step > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep((s) => s - 1)}
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Button>
        ) : (
          <Mascot size="sm" className="size-9" />
        )}
        <div className="flex-1">
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>
        <span className="text-sm text-muted-foreground">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h1 className="text-2xl font-bold tracking-tight">
          {step === 0 ? `Hi, ${firstName}! ` : ""}
          {current.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{current.subtitle}</p>

        <div className="mt-6 flex-1">
          {current.id === "level" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {CEFR_LEVELS.map((l) => (
                <SelectCard
                  key={l.key}
                  selected={level === l.key}
                  onClick={() => setLevel(l.key)}
                >
                  <span className="font-medium">{l.label}</span>
                </SelectCard>
              ))}
            </div>
          )}

          {current.id === "goal" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {GOALS.map((g) => (
                <SelectCard
                  key={g.key}
                  selected={goal === g.key}
                  onClick={() => setGoal(g.key)}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="font-medium">{g.label}</span>
                </SelectCard>
              ))}
            </div>
          )}

          {current.id === "accent" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {ACCENTS.map((a) => (
                <SelectCard
                  key={a.key}
                  selected={accent === a.key}
                  onClick={() => setAccent(a.key)}
                >
                  <span className="font-medium">{a.label}</span>
                </SelectCard>
              ))}
            </div>
          )}

          {current.id === "voice" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {VOICES.map((v) => (
                <SelectCard
                  key={v.key}
                  selected={voice === v.key}
                  onClick={() => setVoice(v.key)}
                >
                  <span className="font-medium">{v.label}</span>
                </SelectCard>
              ))}
            </div>
          )}

          {current.id === "interests" && (
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((it) => {
                const selected = interests.includes(it.key);
                return (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => toggleInterest(it.key)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm transition-all hover:border-primary/60",
                      selected &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    <span>{it.emoji}</span>
                    {it.label}
                  </button>
                );
              })}
            </div>
          )}

          {current.id === "time" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DAILY_MINUTES_OPTIONS.map((m) => (
                <SelectCard
                  key={m}
                  selected={dailyMinutes === m}
                  onClick={() => setDailyMinutes(m)}
                  className="flex-col items-center justify-center py-6 text-center"
                >
                  <span className="text-2xl font-bold">{m}</span>
                  <span className="text-sm text-muted-foreground">min</span>
                </SelectCard>
              ))}
            </div>
          )}

          {current.id === "confidence" && (
            <div className="grid gap-3">
              {CONFIDENCE_LABELS.map((c) => (
                <SelectCard
                  key={c.value}
                  selected={confidence === c.value}
                  onClick={() => setConfidence(c.value)}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="font-medium">{c.label}</span>
                </SelectCard>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-6 bg-background/80 py-4 backdrop-blur">
          <Button
            className="h-11 w-full text-base"
            disabled={!canContinue || submitting}
            onClick={handleNext}
          >
            {submitting
              ? "Setting up your journey..."
              : isLast
                ? "Start learning"
                : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
