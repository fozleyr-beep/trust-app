import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { defaultLocale, dirForLocale, isLocale } from "@/lib/i18n/routing";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sakinah.family",
  description:
    "A quiet matrimonial trust platform for Muslim families, with named agents and encrypted rooms.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const tree = (
    <html lang={locale} dir={dirForLocale(locale)}>
      <body>{children}</body>
    </html>
  );
  return clerkConfigured ? (
    <ClerkProvider dynamic>{tree}</ClerkProvider>
  ) : (
    tree
  );
}
