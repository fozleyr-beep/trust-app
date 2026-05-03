import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust",
  description: "How we handle your messages, your data, and the AI agent.",
  robots: { index: true, follow: true },
};

// PR-01 scaffold: Clerk activates only when keys are configured in .env.local.
// This lets the build pass dry. PR-02 fills in the auth integration.
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
  return clerkConfigured ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
