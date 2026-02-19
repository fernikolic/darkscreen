import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Screenshots & Collections | Darkscreens",
  description: "Your saved screenshots and collections from the Darkscreens crypto design library.",
  robots: { index: false, follow: true },
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
