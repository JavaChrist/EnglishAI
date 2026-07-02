import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: 48,
  md: 96,
  lg: 128,
  xl: 192,
  "2xl": 256,
} as const;

type MascotSize = keyof typeof SIZES;

/**
 * The EnglishAI robot mascot. Uses the official brand icons in /public.
 * These are the ONLY logo assets to use across the app.
 */
export function Mascot({
  size = "md",
  className,
  priority = false,
}: {
  size?: MascotSize;
  className?: string;
  priority?: boolean;
}) {
  const px = SIZES[size];
  return (
    <Image
      src="/logo512.png"
      alt="EnglishAI mascot"
      width={px}
      height={px}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}
