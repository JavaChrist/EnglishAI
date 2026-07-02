import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Listening Room",
};

export default function ListeningPage() {
  return (
    <ComingSoon
      title="Listening Room is coming"
      description="Natural audio dialogues with summaries and key words to train your ear."
    />
  );
}
