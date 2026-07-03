"use client";

import {
  ArrowLeft,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Mascot } from "@/components/mascot/mascot";
import { useRecorder } from "@/components/conversation/use-recorder";
import { useTts } from "@/components/conversation/use-tts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Voice } from "@/types/database";

type Feedback = {
  encouragement: string;
  better: string;
  tip: string;
  onTopic: boolean;
  vocab: { term: string; translation: string }[];
};

type Phase = "idle" | "transcribing" | "evaluating" | "feedback";

export function SpeakingRoom({ voice }: { voice: Voice }) {
  const [prompt, setPrompt] = React.useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = React.useState(true);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [answer, setAnswer] = React.useState("");
  const [typed, setTyped] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const recordStartRef = React.useRef<number | null>(null);
  const recentPromptsRef = React.useRef<string[]>([]);

  const { speak, stop: stopTts, speakingId, loadingId } = useTts(voice);

  const loadPrompt = React.useCallback(async () => {
    setLoadingPrompt(true);
    setError(null);
    setFeedback(null);
    setAnswer("");
    setTyped("");
    setPhase("idle");
    stopTts();
    try {
      const res = await fetch("/api/speaking/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avoid: recentPromptsRef.current }),
      });
      if (!res.ok) throw new Error(`Prompt ${res.status}`);
      const { prompt: p } = (await res.json()) as { prompt: string };
      setPrompt(p);
      recentPromptsRef.current = [...recentPromptsRef.current, p].slice(-6);
    } catch (err) {
      console.error("[speaking] prompt failed", err);
      setError("Couldn't load a prompt. Please try again.");
    } finally {
      setLoadingPrompt(false);
    }
  }, [stopTts]);

  React.useEffect(() => {
    void loadPrompt();
  }, [loadPrompt]);

  const evaluate = React.useCallback(
    async (text: string, spokenSeconds = 0) => {
      setPhase("evaluating");
      setError(null);
      try {
        const res = await fetch("/api/speaking/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, transcript: text, spokenSeconds }),
        });
        if (!res.ok) throw new Error(`Evaluate ${res.status}`);
        const data = (await res.json()) as Feedback;
        setFeedback(data);
        setPhase("feedback");
      } catch (err) {
        console.error("[speaking] evaluate failed", err);
        setError("Couldn't assess your answer. Please try again.");
        setPhase("idle");
      }
    },
    [prompt],
  );

  const handleRecorded = React.useCallback(
    async (blob: Blob) => {
      const spokenSeconds = recordStartRef.current
        ? Math.round((Date.now() - recordStartRef.current) / 1000)
        : 0;
      recordStartRef.current = null;
      setPhase("transcribing");
      setError(null);
      try {
        const form = new FormData();
        form.append("file", blob, "speech.webm");
        const res = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`Transcribe ${res.status}`);
        const { text } = (await res.json()) as { text: string };
        if (text?.trim()) {
          setAnswer(text.trim());
          await evaluate(text.trim(), spokenSeconds);
        } else {
          setError("I didn't catch that — try speaking again.");
          setPhase("idle");
        }
      } catch (err) {
        console.error("[speaking] transcribe failed", err);
        setError("Couldn't transcribe the audio. Please try again.");
        setPhase("idle");
      }
    },
    [evaluate],
  );

  const recorder = useRecorder({ onRecorded: handleRecorded });

  function toggleMic() {
    if (recorder.recording) {
      recorder.stop();
    } else {
      stopTts();
      setError(null);
      recordStartRef.current = Date.now();
      void recorder.start();
    }
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    const t = typed.trim();
    if (t.length < 2) return;
    setAnswer(t);
    void evaluate(t);
  }

  const busy = phase === "transcribing" || phase === "evaluating";

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
          <h1 className="text-xl font-bold tracking-tight">Speaking Room</h1>
          <p className="text-xs text-muted-foreground">
            Answer out loud — get warm, i+1 feedback.
          </p>
        </div>
      </div>

      {/* Prompt */}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" /> Your prompt
        </div>
        {loadingPrompt ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Preparing a prompt…
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Mascot size="sm" className="size-9 shrink-0" />
            <p className="text-lg leading-snug">{prompt}</p>
          </div>
        )}
        {prompt && !loadingPrompt && (
          <div className="mt-3 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() =>
                speakingId === "prompt"
                  ? stopTts()
                  : void speak("prompt", prompt)
              }
            >
              {loadingId === "prompt" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : speakingId === "prompt" ? (
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
              onClick={() => void loadPrompt()}
            >
              <RefreshCw className="size-3.5" /> New prompt
            </Button>
          </div>
        )}
      </section>

      {/* Answer / recording */}
      {phase !== "feedback" && (
        <section className="space-y-4 text-center">
          {recorder.supported && (
            <div className="flex flex-col items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant={recorder.recording ? "default" : "outline"}
                className={cn(
                  "size-20 rounded-full",
                  recorder.recording && "animate-pulse",
                )}
                onClick={toggleMic}
                disabled={busy || loadingPrompt}
                aria-label={recorder.recording ? "Stop and send" : "Record answer"}
              >
                {phase === "transcribing" || phase === "evaluating" ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : recorder.recording ? (
                  <Square className="size-8 fill-current" />
                ) : (
                  <Mic className="size-8" />
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {recorder.recording
                  ? "Listening… tap to finish."
                  : phase === "transcribing"
                    ? "Transcribing your answer…"
                    : phase === "evaluating"
                      ? "Your coach is listening…"
                      : "Tap the mic and answer out loud."}
              </p>
            </div>
          )}

          {/* Typed fallback */}
          <form
            onSubmit={submitTyped}
            className="flex items-center gap-2 pt-2 text-left"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="…or type your answer"
              disabled={busy || recorder.recording}
              className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={typed.trim().length < 2 || busy}
              aria-label="Send answer"
            >
              <Send className="size-5" />
            </Button>
          </form>
        </section>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {/* Feedback */}
      {phase === "feedback" && feedback && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              You said
            </p>
            <p className="text-sm italic">“{answer}”</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500">
              <ThumbsUp className="size-4" /> {feedback.encouragement}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium uppercase text-primary">
                A natural way to say it
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  speakingId === "better"
                    ? stopTts()
                    : void speak("better", feedback.better)
                }
              >
                {loadingId === "better" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : speakingId === "better" ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
                Play
              </Button>
            </div>
            <p className="text-sm">{feedback.better}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-2 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" />
              <span>{feedback.tip}</span>
            </div>
          </div>

          {feedback.vocab.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Words to level up (saved for review)
              </p>
              <ul className="space-y-1.5 text-sm">
                {feedback.vocab.map((v) => (
                  <li key={v.term} className="flex justify-between gap-3">
                    <span className="font-medium">{v.term}</span>
                    <span className="text-muted-foreground">{v.translation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button className="w-full" onClick={() => void loadPrompt()}>
            <RefreshCw className="mr-2 size-4" /> Next prompt
          </Button>
        </section>
      )}
    </main>
  );
}
