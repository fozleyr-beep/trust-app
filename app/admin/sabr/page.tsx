import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireDbUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db";
import { Eyebrow, SabrIntervention, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sabr triage — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function AdminSabrPage() {
  const me = await requireDbUser();
  if (me.role !== "safety_reviewer") notFound();

  const events = await db()
    .select()
    .from(schema.sabrEvents)
    .orderBy(desc(schema.sabrEvents.createdAt))
    .limit(30);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Admin · Sabr triage</Eyebrow>
      <h1 className="font-serif text-[3rem] font-normal leading-tight">
        Safety review
        <br />
        <span className="italic text-[var(--color-ink-muted)]">
          without plaintext.
        </span>
      </h1>
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-3">
          {events.length === 0 ? (
            <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
              <TrustChip agent="Sabr" action="queue empty" timestamp="now" />
              <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
                No paused threads are waiting for review.
              </p>
            </article>
          ) : (
            events.map((event) => (
              <article
                className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
                key={event.id}
              >
                <TrustChip
                  agent="Sabr"
                  action={event.action}
                  timestamp={event.createdAt.toISOString().slice(0, 10)}
                />
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  classifier {event.classifier} · confidence{" "}
                  {event.confidence ?? "n/a"} · decision{" "}
                  {event.decision ?? "pending"}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["Confirm pause", "Reverse pause", "Escalate"].map((label) => (
                    <button
                      className="rounded border border-[var(--color-ink)] px-4 py-2 text-sm"
                      key={label}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
        <aside>
          <SabrIntervention state="paused" />
          <p className="mt-4 text-xs leading-5 text-[var(--color-ink-muted)]">
            Reviewers cannot read message plaintext or contact users directly.
            They can confirm pause, reverse pause, or escalate.
          </p>
        </aside>
      </section>
    </main>
  );
}
