import type { Metadata } from "next";
import { eq, or } from "drizzle-orm";
import { requireDbUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db";
import { InviteLovedOneFlow } from "@/app/components/V7Controls";
import { Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Family links — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function FamilyLinkSettingsPage() {
  const me = await requireDbUser();
  const links = await db()
    .select()
    .from(schema.familyLinks)
    .where(
      or(
        eq(schema.familyLinks.inviterId, me.id),
        eq(schema.familyLinks.observerId, me.id),
      ),
    )
    .limit(20);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Settings · family link</Eyebrow>
      <h1 className="font-serif text-[3rem] font-normal leading-tight">
        Observers can
        <br />
        <span className="italic text-[var(--color-ink-muted)]">
          step back.
        </span>
      </h1>
      <section className="mt-8 grid gap-3">
        {links.length === 0 ? (
          <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)]">
            No family links yet.
          </div>
        ) : (
          links.map((link) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={link.id}
            >
              <TrustChip
                agent="Hafiz"
                action={link.steppedBackAt ? "stepped back" : link.role}
                timestamp={link.acceptedAt?.toISOString().slice(0, 10) ?? "pending"}
              />
              <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
                inviter {link.inviterId} · observer {link.observerId}
              </p>
            </article>
          ))
        )}
      </section>
      <div className="mt-8">
        <InviteLovedOneFlow />
      </div>
    </main>
  );
}
