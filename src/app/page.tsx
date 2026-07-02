import Link from "next/link";
import {
  Headphones,
  MessageCircle,
  Sparkles,
  Repeat,
  Trophy,
  Brain,
} from "lucide-react";

import { Mascot } from "@/components/mascot/mascot";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Conversation Lab",
    description:
      "Talk with an AI that adapts to your level in real time — it never says “Wrong”, it just helps you grow.",
  },
  {
    icon: Headphones,
    title: "Listening Room",
    description:
      "Short, natural audio dialogues with summaries and key words to train your ear.",
  },
  {
    icon: Repeat,
    title: "Smart Review",
    description:
      "Spaced repetition brings back the right words at the right time, so they stick for good.",
  },
  {
    icon: Brain,
    title: "Comprehensible Input",
    description:
      "Built on Stephen Krashen's method: you acquire English by understanding, not by memorizing rules.",
  },
  {
    icon: Sparkles,
    title: "Adaptive AI",
    description:
      "Every session stays in your i+1 zone — challenging enough to learn, easy enough to enjoy.",
  },
  {
    icon: Trophy,
    title: "Gamified Progress",
    description:
      "Earn XP, keep your streak alive and unlock badges as your Acquisition Index climbs.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Mascot size="sm" priority className="size-9" />
            <span className="text-lg font-semibold tracking-tight">
              English<span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              render={<Link href="/login" />}
            >
              Log in
            </Button>
            <Button render={<Link href="/signup" />}>Get started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-accent)_0%,transparent_70%)]"
          />
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:py-24">
            <Mascot size="2xl" priority className="drop-shadow-xl" />
            <div className="space-y-4">
              <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
                Learn English the way you learned to speak.
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
                No grammar drills. No boring lessons. Just real conversations
                with an AI coach that meets you exactly where you are — and takes
                you further, one word at a time.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 px-8 text-base"
                render={<Link href="/signup" />}
              >
                Start learning free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
                render={<Link href="/login" />}
              >
                I already have an account
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Mascot size="sm" className="size-6" />
            <span>
              English<span className="text-primary">AI</span> — acquire English
              naturally.
            </span>
          </div>
          <p>Built with comprehensible input.</p>
        </div>
      </footer>
    </div>
  );
}
