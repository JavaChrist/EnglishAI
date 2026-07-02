import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <Mascot size="xl" priority className="drop-shadow-lg" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </main>
    </div>
  );
}
