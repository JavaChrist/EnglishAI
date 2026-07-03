"use client";

import {
  BookOpen,
  Check,
  Loader2,
  Plus,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { READING_LENGTHS, XP_REWARDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Question = { question: string; options: string[]; answerIndex: number };
type Story = {
  title: string;
  paragraphs: string[];
  glossary: { term: string; translation: string }[];
  questions: Question[];
};
type Phase = "pick" | "loading" | "read" | "quiz" | "done";
type Selected = {
  display: string;
  translation?: string;
  loading: boolean;
};

const normalize = (w: string) =>
  w.toLowerCase().replace(/[^a-z’']/g, "").replace(/’/g, "'");

export function ReadingRoom({ voice }: { voice: "male" | "female" }) {
  const [phase, setPhase] = React.useState<Phase>("pick");
  const [error, setError] = React.useState<string | null>(null);
  const [story, setStory] = React.useState<Story | null>(null);

  const [selected, setSelected] = React.useState<Selected | null>(null);
  const [saved, setSaved] = React.useState<
    Record<string, { term: string; translation: string }>
  >({});

  const [qIndex, setQIndex] = React.useState(0);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [answered, setAnswered] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [quizTaken, setQuizTaken] = React.useState(false);

  const glossaryMap = React.useMemo(() => {
    const m = new Map<string, string>();
    story?.glossary.forEach((g) => m.set(normalize(g.term), g.translation));
    return m;
  }, [story]);

  const speakWord = React.useCallback(
    (text: string) => {
      const params = new URLSearchParams({ voice, text });
      const audio = new Audio(`/api/voice/generate?${params.toString()}`);
      void audio.play().catch(() => {});
    },
    [voice],
  );

  async function generate(length: string) {
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/reading/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ length }),
      });
      if (!res.ok) throw new Error(`Generate ${res.status}`);
      const data = (await res.json()) as Story;
      setStory(data);
      setSaved({});
      setSelected(null);
      setQIndex(0);
      setChoice(null);
      setAnswered(false);
      setCorrectCount(0);
      setQuizTaken(false);
      setPhase("read");
    } catch (err) {
      console.error("[reading] generate failed", err);
      setError("Couldn't generate a passage. Please try again.");
      setPhase("pick");
    }
  }

  async function onWord(raw: string) {
    const key = normalize(raw);
    if (!key) return;
    const display = raw.replace(/[^A-Za-z’'-]/g, "");
    const known = glossaryMap.get(key);
    if (known) {
      setSelected({ display, translation: known, loading: false });
      return;
    }
    setSelected({ display, loading: true });
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: display }),
      });
      const { text } = (await res.json()) as { text: string };
      setSelected({ display, translation: text, loading: false });
    } catch {
      setSelected({
        display,
        translation: "Traduction indisponible.",
        loading: false,
      });
    }
  }

  function saveSelected() {
    if (!selected?.translation) return;
    const term = selected.display.toLowerCase();
    setSaved((prev) => ({
      ...prev,
      [term]: { term, translation: selected.translation! },
    }));
  }

  function saveGlossary(term: string, translation: string) {
    setSaved((prev) => ({
      ...prev,
      [term.toLowerCase()]: { term: term.toLowerCase(), translation },
    }));
  }

  async function complete() {
    const savedWords = Object.values(saved);
    const words = story
      ? story.paragraphs.join(" ").split(/\s+/).filter(Boolean).length
      : 0;
    try {
      await fetch("/api/reading/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedWords, words }),
      });
    } catch (err) {
      console.error("[reading] complete failed", err);
    }
  }

  function finishReadOnly() {
    setQuizTaken(false);
    setPhase("done");
    void complete();
  }

  function answer(i: number) {
    if (answered || !story) return;
    setChoice(i);
    setAnswered(true);
    if (i === story.questions[qIndex].answerIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  async function nextQuestion() {
    if (!story) return;
    setAnswered(false);
    setChoice(null);
    if (qIndex < story.questions.length - 1) {
      setQIndex((q) => q + 1);
    } else {
      setQuizTaken(true);
      setPhase("done");
      await complete();
    }
  }

  const savedCount = Object.keys(saved).length;

  // ---- PICK / LOADING ----
  if (phase === "pick" || phase === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <BookOpen className="size-6" />
            <span className="font-medium">Reading Room</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Read at your level</h1>
          <p className="text-muted-foreground">
            A fresh story at your level. Tap any word to see its meaning.
          </p>
        </div>

        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p>Writing your story…</p>
          </div>
        ) : (
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {READING_LENGTHS.map((l) => (
              <Button
                key={l.key}
                variant="outline"
                className="h-24 flex-col gap-1 text-lg"
                onClick={() => void generate(l.key)}
              >
                <span className="text-2xl font-bold">{l.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {l.hint}
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

  if (!story) return null;

  // ---- READ ----
  if (phase === "read") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 pb-40">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reading
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{story.title}</h1>
        </div>

        <article className="space-y-4 text-lg leading-relaxed">
          {story.paragraphs.map((p, pi) => (
            <p key={pi}>
              {p
                .match(/[A-Za-z’'-]+|[^A-Za-z’'-]+/g)
                ?.map((seg, si) => {
                  const isWord = /[A-Za-z]/.test(seg);
                  if (!isWord) return <span key={si}>{seg}</span>;
                  const isSaved = normalize(seg) in saved;
                  return (
                    <button
                      key={si}
                      type="button"
                      onClick={() => void onWord(seg)}
                      className={cn(
                        "rounded transition-colors hover:bg-primary/15",
                        isSaved && "bg-primary/15 underline decoration-dotted",
                      )}
                    >
                      {seg}
                    </button>
                  );
                })}
            </p>
          ))}
        </article>

        {story.glossary.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
              Key words
            </p>
            <ul className="space-y-2">
              {story.glossary.map((g, i) => {
                const isSaved = g.term.toLowerCase() in saved;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{g.term}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {g.translation}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground"
                      aria-label={isSaved ? "Saved" : `Save ${g.term}`}
                      onClick={() => saveGlossary(g.term, g.translation)}
                      disabled={isSaved}
                    >
                      {isSaved ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button className="h-12" onClick={() => setPhase("quiz")}>
            I&apos;m done — check my understanding
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={finishReadOnly}
          >
            Finish (skip questions)
          </Button>
        </div>

        {/* Word lookup card */}
        {selected && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selected.display}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    aria-label="Pronounce"
                    onClick={() => speakWord(selected.display)}
                  >
                    <Volume2 className="size-4" />
                  </Button>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {selected.loading ? "Translating…" : selected.translation}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                disabled={
                  selected.loading ||
                  !selected.translation ||
                  selected.display.toLowerCase() in saved
                }
                onClick={saveSelected}
              >
                {selected.display.toLowerCase() in saved ? (
                  <>
                    <Check className="size-4" /> Saved
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Save
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground"
                aria-label="Close"
                onClick={() => setSelected(null)}
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ---- QUIZ ----
  if (phase === "quiz") {
    const q = story.questions[qIndex];
    const progress = Math.round((qIndex / story.questions.length) * 100);
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Question {qIndex + 1} of {story.questions.length}
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
            const isChosen = i === choice;
            return (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  "h-auto min-h-12 justify-start whitespace-normal py-2 text-left text-base",
                  answered && isCorrect && "border-green-500 bg-green-500/10",
                  answered &&
                    isChosen &&
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
                {answered && isChosen && !isCorrect && (
                  <X className="size-5 text-red-600" />
                )}
              </Button>
            );
          })}
        </div>

        {answered && (
          <Button className="h-12" onClick={() => void nextQuestion()} autoFocus>
            {qIndex < story.questions.length - 1
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
            <BookOpen className="size-7" />
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Great reading!</h1>
        <p className="text-muted-foreground">
          {quizTaken
            ? `${correctCount} / ${story.questions.length} correct · +${XP_REWARDS.reading} XP`
            : `+${XP_REWARDS.reading} XP`}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">
          {savedCount > 0
            ? `${savedCount} word${savedCount > 1 ? "s" : ""} added to your reviews.`
            : "Tip: tap words while reading to save them to your reviews."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button className="h-11" onClick={() => setPhase("pick")}>
          Read another
        </Button>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
      </div>
    </main>
  );
}
