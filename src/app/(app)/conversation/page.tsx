import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SCENARIOS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conversation Lab",
};

export default function ConversationPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Conversation Lab</h1>
          <p className="text-muted-foreground">
            Pick a scene and start talking. Your coach adapts to you in real
            time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <Link
                key={scenario.key}
                href={`/conversation/${scenario.key}`}
                className="group"
              >
                <Card className="h-full transition-all group-hover:border-primary/60 group-hover:ring-primary/30">
                  <CardHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                      <Icon className="size-6" />
                    </div>
                    <CardTitle>{scenario.label}</CardTitle>
                    <CardDescription>
                      {scenario.key === "story"
                        ? "Listen to a short story and answer along the way."
                        : `Practice a ${scenario.label.toLowerCase()} conversation.`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
