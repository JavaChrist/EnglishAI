"use client";

import * as React from "react";
import { toast } from "sonner";

import { BADGES } from "@/lib/constants";

const BADGE_MAP = new Map<string, (typeof BADGES)[number]>(
  BADGES.map((b) => [b.key, b]),
);

/**
 * Polls once on mount for freshly-unlocked badges and pops a celebratory toast
 * for each. Kept subtle to keep the affective filter low (Krashen).
 */
export function BadgeToaster() {
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/badges/unseen");
        if (!res.ok) return;
        const { badges } = (await res.json()) as { badges: string[] };
        if (cancelled) return;
        badges.forEach((key, i) => {
          const badge = BADGE_MAP.get(key);
          if (!badge) return;
          const Icon = badge.icon;
          window.setTimeout(() => {
            toast.success("Badge unlocked!", {
              description: badge.label,
              icon: <Icon className="size-5 text-primary" />,
              duration: 5000,
            });
          }, i * 700);
        });
      } catch {
        // Non-critical — silently ignore.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
