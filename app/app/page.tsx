import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

// PR-02 smoke test for the auth wiring. Middleware will already have
// redirected unauthed visitors to /sign-in; the explicit guard below is a
// belt + suspenders so a future middleware change cannot silently expose this.
//
// ASSUMPTION: /app is the post-auth landing surface. Replace if DECISIONS.md
// commits to a different route name (e.g. /threads, /home).

export default async function AppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  const user = await currentUser();

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Signed in
      </p>
      <h1 className="font-serif text-[2rem] leading-[1.1]">
        Hello, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}.
      </h1>
      <p className="mt-6 text-[var(--color-ink-soft)]">
        This is the auth smoke test. In PR-03 it becomes your thread list.
      </p>
      <p className="mt-8 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
          href="/trust"
        >
          ← Back to Trust
        </Link>
      </p>
    </main>
  );
}
