import Link from "next/link";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AgentChat } from "@/app/components/AgentChat";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  await requireDbUser();
  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Assistant
      </p>
      <h1 className="font-serif text-[2rem] leading-[1.1]">
        A separate conversation.
      </h1>
      <p className="mt-4 text-[var(--color-ink-soft)]">
        This conversation is server-mediated and routed to Anthropic. It is
        not end-to-end encrypted, by design — the assistant has to read what
        you send it. It cannot see your messages with other people.{" "}
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/trust" as Route}
        >
          Read the trust contract
        </Link>
        .
      </p>

      <AgentChat />

      <p className="mt-12 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/app" as Route}
        >
          ← Back
        </Link>
      </p>
    </main>
  );
}
