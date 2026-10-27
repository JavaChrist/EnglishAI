"use client";

import {
  ArrowLeft,
  AudioLines,
  Check,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useOpenMic } from "@/components/pronunciation/use-open-mic";
import { useTts } from "@/components/conversation/use-tts";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { blobToWav } from "@/lib/audio/wav";
import { PRONUNCIATION_FOCUSES } from "@/lib/pronunciation/focuses";
import { cn } from "@/lib/utils";
import type { Voice } from "@/types/database";

type Phrase = {
  sentence: string;
  translation?: string;
  focusId: string;
  focus: string;
  guide: string;
  explainInFrench?: boolean;
};

type WordFeedback = {
  word: string;
  status: "clear" | "check";
  note?: string;
};

type Feedback = {
  score: number;
  heard: string;
  encouragement: string;
  tip: string;
  explain?: string;
  spoken: string;
  words: WordFeedback[];
};

type Phase = "idle" | "assessing" | "feedback";

/** Exact model the learner must copy, so a retry doesn't invent new words. */
function echoScript(sentence: string, words: WordFeedback[]): string {
  const checks = words.filter((word) => word.status === "check").slice(0, 3);
  if (checks.length === 0) return `Repeat after me. ${sentence}`;
  const modeled = checks.map((word) => `${word.word}... ${word.word}.`).join(" ");
  return `Repeat after me. ${modeled} Now the whole sentence. Repeat after me. ${sentence}`;
}

export function PronunciationRoom({ voice }: { voice: Voice }) {
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [phrase, setPhrase] = React.useState<Phrase | null>(null);
  const [loadingPhrase, setLoadingPhrase] = React.useState(true);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [holding, setHolding] = React.useState(false);

  const recentRef = React.useRef<string[]>([]);
  const requestRef = React.useRef(0);
  const focusRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    focusRef.current = focusId;
  }, [focusId]);

  const { speak, stop: stopTts, speakingId, loadingId } = useTts(voice);

  const playCoach = React.useCallback(
    (explain: string, model: string) => {
      const line = model.trim();
      if (!explain.trim()) {
        if (line) void speak("echo", line);
        return;
      }
      void speak("coach", explain, {
        onEnded: () => {
          if (line) void speak("echo", line);
        },
      });
    },
    [speak],
  );

  const loadPhrase = React.useCallback(async (nextFocus: string | null): Promise<Phrase | null> => {
    const request = ++requestRef.current;
    setLoadingPhrase(true);
    setError(null);
    setFeedback(null);
    setPhase("idle");
    stopTts();
    try {
      const res = await fetch("/api/pronunciation/phrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusId: nextFocus,
          avoid: recentRef.current,
        }),
      });
      if (!res.ok) throw new Error(`Phrase ${res.status}`);
      const next = (await res.json()) as Phrase;
      if (request !== requestRef.current) return null;
      setPhrase(next);
      recentRef.current = [...recentRef.current, next.sentence].slice(-6);
      return next;
    } catch (err) {
      console.error("[pronunciation] phrase failed", err);
      if (request !== requestRef.current) return null;
      setError("Couldn't load a sentence. Please try again.");
      return null;
    } finally {
      if (request === requestRef.current) setLoadingPhrase(false);
    }
  }, [stopTts]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) await loadPhrase(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPhrase]);

  const assess = React.useCallback(
    async (blob: Blob, spokenSeconds: number) => {
      if (!phrase) return;
      setPhase("assessing");
      setError(null);
      try {
        let audio = blob;
        try {
          audio = await blobToWav(blob);
        } catch (err) {
          console.error("[pronunciation] wav conversion failed", err);
        }

        const form = new FormData();
        const name = audio.type.includes("wav") ? "speech.wav" : "speech.webm";
        form.append("file", audio, name);
        form.append("sentence", phrase.sentence);
        form.append("focusId", phrase.focusId);
        form.append("spokenSeconds", String(spokenSeconds));

        const res = await fetch("/api/pronunciation/evaluate", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`Evaluate ${res.status}`);
        const data = (await res.json()) as Feedback;
        setFeedback(data);
        setPhase("feedback");
        const passed =
          data.score >= 80 &&
          data.words.length > 0 &&
          data.words.every((word) => word.status === "clear");

        if (!passed) {
          playCoach(
            data.explain?.trim() || data.tip,
            data.spoken?.trim() || `Repeat after me. ${phrase.sentence}`,
          );
          return;
        }

        setHolding(true);
        const bridge = phrase.explainInFrench
          ? "C'était clair. Voici une nouvelle phrase."
          : "That was clear. Here comes a new sentence.";
        void speak("coach", bridge, {
          onEnded: () => {
            void (async () => {
              const next = await loadPhrase(focusRef.current);
              if (!next) {
                setHolding(false);
                return;
              }
              void speak("model", `Repeat after me. ${next.sentence}`, {
                onEnded: () => setHolding(false),
              });
            })();
          },
        });
      } catch (err) {
        console.error("[pronunciation] assess failed", err);
        setError("Couldn't assess that recording. Please try again.");
        setPhase("idle");
      }
    },
    [phrase, speak, loadPhrase, playCoach],
  );

  const handleRecorded = React.useCallback(
    (blob: Blob, spokenSeconds: number) => {
      void assess(blob, spokenSeconds);
    },
    [assess],
  );

  const micReady =
    !loadingPhrase &&
    !!phrase &&
    phase !== "assessing" &&
    speakingId == null &&
    loadingId == null &&
    !holding;
  const mic = useOpenMic({ enabled: micReady, onUtterance: handleRecorded });

  function chooseFocus(next: string | null) {
    if (next === focusId && phase !== "feedback") return;
    setFocusId(next);
    void loadPhrase(next);
  }

  const checks = feedback?.words.filter((word) => word.status === "check") ?? [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pronunciation</h1>
          <p className="text-xs text-muted-foreground">
            The microphone stays on. Repeat after the coach.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FocusChip
          active={focusId === null}
          onClick={() => chooseFocus(null)}
          label="Mix"
        />
        {PRONUNCIATION_FOCUSES.map((focus) => (
          <FocusChip
            key={focus.id}
            active={focusId === focus.id}
            onClick={() => chooseFocus(focus.id)}
            label={focus.label}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <AudioLines className="size-4" /> Repeat after me
        </div>
        {loadingPhrase || !phrase ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Preparing a sentence…
          </div>
        ) : (
          <>
            <p className="text-lg leading-snug">{phrase.sentence}</p>
            {phrase.translation ? (
              <p className="mt-1 text-sm leading-snug text-sky-700 dark:text-sky-300">
                {phrase.translation}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {phrase.explainInFrench ? "Son : " : "Focus: "}
              </span>
              {phrase.focus}. {phrase.guide}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  speakingId === "model"
                    ? stopTts()
                    : void speak("model", `Repeat after me. ${phrase.sentence}`)
                }
              >
                {loadingId === "model" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : speakingId === "model" ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
                Hear it
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  speakingId === "slow"
                    ? stopTts()
                    : void speak(
                        "slow",
                        `Repeat after me. ${phrase.sentence}`,
                        { slow: true },
                      )
                }
              >
                {loadingId === "slow" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : speakingId === "slow" ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
                Slowly
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() => void loadPhrase(focusId)}
              >
                <RefreshCw className="size-3.5" /> New sentence
              </Button>
            </div>
          </>
        )}
      </section>

      {mic.supported && (
        <section className="flex flex-col items-center gap-3 text-center">
          {mic.needsTap && !mic.live ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-20 rounded-full"
              onClick={() => void mic.arm()}
              aria-label="Turn the microphone on"
            >
              <Mic className="size-8" />
            </Button>
          ) : (
            <div
              className={cn(
                "flex size-20 items-center justify-center rounded-full border",
                mic.hearing
                  ? "animate-pulse border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-primary",
              )}
              aria-label={mic.live ? "Microphone is on" : "Opening the microphone"}
            >
              {phase === "assessing" || !mic.live ? (
                <Loader2 className="size-8 animate-spin" />
              ) : (
                <Mic className="size-8" />
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {mic.needsTap && !mic.live
              ? "Allow the microphone once. It stays on after that."
              : phase === "assessing"
                ? "Your coach is preparing the correction…"
                : speakingId || loadingId
                  ? "The coach is speaking. The microphone stays on."
                  : holding
                    ? "A new sentence is on the way."
                    : mic.hearing
                    ? "Hearing you…"
                    : "Microphone on. Speak when you are ready."}
          </p>
        </section>
      )}

      {!mic.supported && !loadingPhrase && (
        <p className="text-center text-sm text-muted-foreground">
          This browser cannot use the microphone. Try Chrome or Safari.
        </p>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      {phase === "feedback" && feedback && phrase && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <AudioLines className="size-4" /> Coach
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  speakingId === "coach" || speakingId === "echo"
                    ? stopTts()
                    : playCoach(
                        feedback.explain?.trim() || feedback.tip,
                        feedback.spoken || `Repeat after me. ${phrase.sentence}`,
                      )
                }
              >
                {loadingId === "coach" || loadingId === "echo" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : speakingId === "coach" || speakingId === "echo" ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
                {speakingId === "coach" || speakingId === "echo" ? "Stop" : "Hear again"}
              </Button>
            </div>
            <p className="text-sm leading-relaxed">
              {feedback.explain?.trim() || feedback.tip}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <ProgressRing value={feedback.score} size={112} strokeWidth={10}>
              <span className="text-2xl font-bold leading-none">
                {feedback.score}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </ProgressRing>
            <p className="text-sm font-medium">{feedback.encouragement}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {feedback.words.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
                  word.status === "clear"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                )}
              >
                {word.status === "clear" ? <Check className="size-3.5" /> : null}
                {word.word}
              </span>
            ))}
          </div>

          {checks.length > 0 && (
            <ul className="space-y-2 rounded-2xl border border-border/60 bg-card p-4 text-sm">
              {checks.map((word, index) => (
                <li key={`${word.word}-${index}`}>
                  <span className="font-medium">{word.word}.</span>{" "}
                  <span className="text-muted-foreground">{word.note}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {phrase.explainInFrench ? "Ce que j'ai entendu" : "What it sounded like"}
            </p>
            <p className="text-sm italic">{feedback.heard}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-2 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" />
              <span>{feedback.tip}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                void speak("echo", echoScript(phrase.sentence, feedback.words), {
                  slow: true,
                })
              }
            >
              <Volume2 className="mr-2 size-4" /> Repeat after me
            </Button>
            <Button className="flex-1" onClick={() => void loadPhrase(focusId)}>
              <RefreshCw className="mr-2 size-4" /> Next sentence
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}

function FocusChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
