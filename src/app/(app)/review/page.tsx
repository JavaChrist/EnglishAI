import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Review & Memory",
};

export default function ReviewPage() {
  return (
    <ComingSoon
      title="Review & Memory is coming"
      description="Spaced repetition will bring back the right words at the right time."
    />
  );
}
