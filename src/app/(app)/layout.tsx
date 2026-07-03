import { BadgeToaster } from "@/components/badge-toaster";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BadgeToaster />
    </>
  );
}
