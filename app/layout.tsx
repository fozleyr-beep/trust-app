import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust",
  description: "How we handle your messages, your data, and the AI agent.",
  // Default deny for the whole site. /trust explicitly opts back in via
  // its own `robots: { index: true, follow: true }` export. Sign-in,
  // sign-up, /app/*, and /api/* therefore stay out of search indexes by
  // default — privacy hygiene + SEO hygiene in one rule.
  robots: { index: false, follow: false },
};

// Clerk activates only when keys are configured in .env.local. This lets
// the build pass dry; the auth integration is wired in PR-02 onward.
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
