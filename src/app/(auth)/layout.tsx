import Link from "next/link";

import { Mascot } from "@/components/mascot/mascot";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-accent)_0%,transparent_70%)]"
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex flex-col items-center gap-3 text-center"
        >
          <Mascot size="lg" priority className="drop-shadow-lg" />
          <span className="text-2xl font-bold tracking-tight">
            English<span className="text-primary">AI</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
