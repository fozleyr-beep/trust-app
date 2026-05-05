import type { Metadata } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Observer notes — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function ObserveNotesPage() {
  await requireDbUser();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Observer side-channel</Eyebrow>
      <h1 className="font-serif text-[3rem] font-normal leading-tight">
        Send a thought,
        <br />
        <span className="italic text-[var(--color-ink-muted)]">
          not a command.
        </span>
      </h1>
      <section className="mt-8 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <TrustChip agent="Hafiz" action="family link scoped" timestamp="now" />
        <label className="mt-5 block text-sm text-[var(--color-ink-soft)]">
          Private note to the seeker
          <textarea
            className="mt-2 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm"
            rows={5}
          />
        </label>
        <button className="mt-4 min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)]">
          Save encrypted note
        </button>
      </section>
    </main>
  );
}
