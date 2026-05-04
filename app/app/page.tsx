import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";

export const dynamic = "force-dynamic";

// Post-auth landing. Middleware will already have redirected unauthed
// visitors to /sign-in; the explicit guard below is a belt + suspenders so
// a future middleware change cannot silently expose this.

export default async function AppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  const user = await currentUser();

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <DeviceBootstrap />
      <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Signed in
      </p>
      <h1 className="font-serif text-[2rem] leading-[1.1]">
        Hello, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}.
      </h1>
      <p className="mt-6 text-[var(--color-ink-soft)]">
        Choose a surface.
      </p>
      <ul className="mt-6 space-y-3">
        <li>
          <Link
            className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
            href={"/app/threads" as Route}
          >
            Threads (encrypted, with people) →
          </Link>
        </li>
        <li>
          <Link
            className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
            href={"/app/agent" as Route}
          >
            Assistant (server-mediated, with Claude) →
          </Link>
        </li>
        <li>
          <Link
            className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
            href={"/app/settings" as Route}
          >
            Settings (fingerprint, export) →
          </Link>
        </li>
        <li>
          <Link
            className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
            href={"/trust" as Route}
          >
            Trust contract
          </Link>
        </li>
      </ul>
    </main>
  );
}
