"use client";

import {
  Check,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LISTENING_DURATIONS, XP_REWARDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Line = { speaker: "A" | "B"; text: string };
type Question = { question: string; options: string[]; answerIndex: number };
type Clip = {
  title: string;
  lines: Line[];
  questions: Question[];
  summary: string;
  keywords: { term: string; translation: string }[];
};

type Phase = "pick" | "loading" | "listen" | "quiz" | "done";
type PlayStatus = "idle" | "loading" | "playing" | "paused" | "finished";

export function ListeningRoom({ voice }: { voice: "male" | "female" }) {
  const primaryVoice = voice;
  const secondaryVoice: "male" | "female" =
    voice === "female" ? "male" : "female";

  const [phase, setPhase] = React.useState<Phase>("pick");
  const [error, setError] = React.useState<string | null>(null);
  const [clip, setClip] = React.useState<Clip | null>(null);

  const [status, setStatus] = React.useState<PlayStatus>("idle");
  const [currentLine, setCurrentLine] = React.useState(-1);
  const [lineProgress, setLineProgress] = React.useState(0);
  const [showTranscript, setShowTranscript] = React.useState(false);

  const [qIndex, setQIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [answered, setAnswered] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const pausedRef = React.useRef(false);
  const audioCache = React.useRef<Map<number, Promise<string>>>(new Map());
  const clipRef = React.useRef<Clip | null>(null);
  clipRef.current = clip;

  const voiceFor = (speaker: "A" | "B") =>
    speaker === "A" ? primaryVoice : secondaryVoice;

  const speakerName = (speaker: "A" | "B") =>
    voiceFor(speaker) === "female" ? "Mei" : "Tom";

  const speakerColor = (speaker: "A" | "B") =>
    voiceFor(speaker) === "female" ? "text-primary" : "text-emerald-500";

  const clearAudioCache = React.useCallback(() => {
    audioCache.current.forEach((p) =>
      void p.then((url) => URL.revokeObjectURL(url)).catch(() => {}),
    );
    audioCache.current.clear();
  }, []);

  /** Fetch (and memoise) the spoken audio for a line as an object URL. */
  const ensureAudio = React.useCallback(
    (i: number): Promise<string> => {
      const cached = audioCache.current.get(i);
      if (cached) return cached;
      const line = clipRef.current?.lines[i];
      if (!line) return Promise.reject(new Error("no line"));
      const params = new URLSearchParams({
        voice: voiceFor(line.speaker),
        text: line.text,
      });
      const promise = fetch(`/api/voice/generate?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error(`voice ${res.status}`);
          return res.blob();
        })
        .then((blob) => URL.createObjectURL(blob));
      audioCache.current.set(i, promise);
      return promise;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryVoice, secondaryVoice],
  );

  const playIndex = React.useCallback(
    async (i: number) => {
      const current = clipRef.current;
      if (!current) return;
      if (i >= current.lines.length) {
        setStatus("finished");
        setCurrentLine(-1);
        setLineProgress(0);
        return;
      }

      setCurrentLine(i);
      setLineProgress(0);
      setStatus("loading");

      let url: string;
      try {
        url = await ensureAudio(i);
      } catch {
        setStatus("paused");
        return;
      }
      // Prefetch the next line so playback is gapless.
      if (i + 1 < current.lines.length) void ensureAudio(i + 1);

      if (pausedRef.current) return;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setLineProgress(audio.currentTime / audio.duration);
        }
      };
      audio.onended = () => {
        if (!pausedRef.current) void playIndex(i + 1);
      };
      audio.onerror = () => {
        if (!pausedRef.current) void playIndex(i + 1);
      };
      try {
        await audio.play();
        setStatus("playing");
      } catch {
        setStatus("paused");
      }
    },
    [ensureAudio],
  );

  const start = React.useCallback(() => {
    pausedRef.current = false;
    void playIndex(0);
  }, [playIndex]);

  const pause = React.useCallback(() => {
    pausedRef.current = true;
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const resume = React.useCallback(() => {
    pausedRef.current = false;
    const audio = audioRef.current;
    if (audio && audio.src) {
      void audio.play();
      setStatus("playing");
    } else {
      void playIndex(currentLine < 0 ? 0 : currentLine);
    }
  }, [playIndex, currentLine]);

  const restart = React.useCallback(() => {
    pausedRef.current = false;
    audioRef.current?.pause();
    void playIndex(0);
  }, [playIndex]);

  const toggle = React.useCallback(() => {
    if (status === "playing" || status === "loading") pause();
    else if (status === "paused") resume();
    else start();
  }, [status, pause, resume, start]);

  /** One-off pronunciation (used on the results screen), independent of the player. */
  const speakOnce = React.useCallback(
    (text: string) => {
      const params = new URLSearchParams({ voice: primaryVoice, text });
      const audio = new Audio(`/api/voice/generate?${params.toString()}`);
      void audio.play().catch(() => {});
    },
    [primaryVoice],
  );

  React.useEffect(() => {
    return () => {
      pausedRef.current = true;
      audioRef.current?.pause();
      clearAudioCache();
    };
  }, [clearAudioCache]);

  async function generate(duration: number) {
    pausedRef.current = true;
    audioRef.current?.pause();
    clearAudioCache();
    setStatus("idle");
    setCurrentLine(-1);
    setLineProgress(0);
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/listening/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });
      if (!res.ok) throw new Error(`Generate ${res.status}`);
      const data = (await res.json()) as Clip;
      setClip(data);
      setShowTranscript(false);
      setQIndex(0);
      setSelected(null);
      setAnswered(false);
      setCorrectCount(0);
      setPhase("listen");
    } catch (err) {
      console.error("[listening] generate failed", err);
      setError("Couldn't generate a clip. Please try again.");
      setPhase("pick");
    }
  }

  function answer(i: number) {
    if (answered || !clip) return;
    setSelected(i);
    setAnswered(true);
    if (i === clip.questions[qIndex].answerIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  async function nextQuestion() {
    if (!clip) return;
    setAnswered(false);
    setSelected(null);
    if (qIndex < clip.questions.length - 1) {
      setQIndex((q) => q + 1);
    } else {
      setPhase("done");
      try {
        await fetch("/api/listening/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: clip.keywords }),
        });
      } catch (err) {
        console.error("[listening] complete failed", err);
      }
    }
  }

  // ---- PICK / LOADING ----
  if (phase === "pick" || phase === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Headphones className="size-6" />
            <span className="font-medium">Listening Room</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Train your ear</h1>
          <p className="text-muted-foreground">
            Pick a length. We&apos;ll create a fresh clip at your level.
          </p>
        </div>

        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p>Writing and preparing your clip…</p>
          </div>
        ) : (
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {LISTENING_DURATIONS.map((d) => (
              <Button
                key={d}
                variant="outline"
                className="h-24 flex-col gap-1 text-lg"
                onClick={() => void generate(d)}
              >
                <span className="text-2xl font-bold">
                  {d < 60 ? `${d}s` : `${d / 60}min`}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {d === 30 ? "Quick" : d === 60 ? "Standard" : "Deep"}
                </span>
              </Button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button variant="ghost" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </main>
    );
  }

  if (!clip) return null;

  // ---- LISTEN ----
  if (phase === "listen") {
    const total = clip.lines.length;
    const overall =
      currentLine < 0
        ? status === "finished"
          ? 100
          : 0
        : Math.min(100, ((currentLine + lineProgress) / total) * 100);
    const activeSpeaker = currentLine >= 0 ? clip.lines[currentLine].speaker : null;
    const isBusy = status === "playing" || status === "loading";

    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Now playing
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{clip.title}</h1>
        </div>

        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-8">
          {/* Speaker indicator dots */}
          <div className="flex items-center gap-1.5">
            {clip.lines.map((line, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentLine
                    ? "w-6 bg-primary"
                    : i < currentLine
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-muted-foreground/25",
                  line.speaker === "B" && i === currentLine && "bg-accent",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full text-muted-foreground"
              onClick={restart}
              disabled={status === "idle"}
              aria-label="Restart"
            >
              <RotateCcw className="size-5" />
            </Button>

            <Button
              size="lg"
              className="size-20 rounded-full"
              onClick={toggle}
              aria-label={isBusy ? "Pause" : "Play"}
            >
              {status === "loading" ? (
                <Loader2 className="size-8 animate-spin" />
              ) : isBusy ? (
                <Pause className="size-8 fill-current" />
              ) : (
                <Play className="size-8 fill-current" />
              )}
            </Button>

            <div className="size-11" aria-hidden />
          </div>

          <div className="w-full space-y-2">
            <Progress value={overall} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {currentLine >= 0
                  ? `Line ${currentLine + 1} of ${total}`
                  : status === "finished"
                    ? "Finished"
                    : `${total} lines`}
              </span>
              {activeSpeaker && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <UserRound
                    className={cn("size-3.5", speakerColor(activeSpeaker))}
                  />
                  {speakerName(activeSpeaker)}
                </span>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isBusy
              ? "Listening… focus on the meaning."
              : status === "finished"
                ? "Replay it, or check your understanding below."
                : "Tap play. Try it without reading first."}
          </p>
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setShowTranscript((s) => !s)}
          >
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </Button>
          {showTranscript && (
            <div className="mt-2 space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-4">
              {clip.lines.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-sm transition-colors",
                    currentLine === i && "font-medium text-primary",
                  )}
                >
                  <span className="mr-1 inline-flex items-center gap-1 align-middle font-medium text-foreground">
                    <UserRound
                      className={cn("size-3.5", speakerColor(line.speaker))}
                    />
                    {speakerName(line.speaker)}:
                  </span>
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>

        <Button className="h-12" onClick={() => setPhase("quiz")}>
          I&apos;m ready — check my understanding
        </Button>
      </main>
    );
  }

  // ---- QUIZ ----
  if (phase === "quiz") {
    const q = clip.questions[qIndex];
    const progress = Math.round((qIndex / clip.questions.length) * 100);
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Question {qIndex + 1} of {clip.questions.length}
            </span>
            <span>{correctCount} correct</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <p className="text-lg font-semibold">{q.question}</p>
        </div>

        <div className="grid gap-2">
          {q.options.map((option, i) => {
            const isCorrect = i === q.answerIndex;
            const isSelected = i === selected;
            return (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  "h-auto min-h-12 justify-start whitespace-normal py-2 text-left text-base",
                  answered && isCorrect && "border-green-500 bg-green-500/10",
                  answered &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-500 bg-red-500/10",
                )}
                disabled={answered}
                onClick={() => answer(i)}
              >
                <span className="flex-1">{option}</span>
                {answered && isCorrect && (
                  <Check className="size-5 text-green-600" />
                )}
                {answered && isSelected && !isCorrect && (
                  <X className="size-5 text-red-600" />
                )}
              </Button>
            );
          })}
        </div>

        {answered && (
          <Button className="h-12" onClick={() => void nextQuestion()} autoFocus>
            {qIndex < clip.questions.length - 1
              ? "Next question"
              : "See results"}
          </Button>
        )}
      </main>
    );
  }

  // ---- DONE ----
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="text-center">
        <div className="flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Headphones className="size-7" />
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Nice listening!
        </h1>
        <p className="text-muted-foreground">
          {correctCount} / {clip.questions.length} correct · +
          {XP_REWARDS.listening} XP
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Summary
        </p>
        <p className="text-sm">{clip.summary}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
          Key vocabulary (added to your reviews)
        </p>
        <ul className="space-y-2">
          {clip.keywords.map((k, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">{k.term}</span>
                <span className="text-muted-foreground"> — {k.translation}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                aria-label={`Hear ${k.term}`}
                onClick={() => speakOnce(k.term)}
              >
                <Volume2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setPhase("pick")}>
          Another clip
        </Button>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
      </div>
    </main>
  );
}
