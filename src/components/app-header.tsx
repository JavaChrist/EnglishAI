import { BarChart3, Trophy } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { Mascot } from "@/components/mascot/mascot";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Mascot size="sm" className="size-8" />
          <span className="font-semibold tracking-tight">
            English<span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Progress"
            render={<Link href="/stats" />}
          >
            <BarChart3 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Badges"
            render={<Link href="/badges" />}
          >
            <Trophy className="size-5" />
          </Button>
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
