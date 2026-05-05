import type { Metadata } from "next";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  FamilyObserverBadge,
  PhotoGate,
  TrustChip,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile preview — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function ProfilePreviewPage() {
  const me = await requireDbUser();
  const publicNote = extractNote(me.layerPublic) || "A calm public profile summary appears here after approval.";
  const familyNote = extractNote(me.layerFamily) || "Family context remains separate from the public layer.";

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Match-eye preview</Eyebrow>
      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            What a match
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              can see first.
            </span>
          </h1>
          <p className="mt-5 text-sm leading-6 text-[var(--color-ink-soft)]">
            Gated and family layers stay out of this view until the relevant
            consent boundary is crossed.
          </p>
          <div className="mt-6">
            <ButtonLink href={"/profile/edit" as Route} tone="secondary">
              Edit layers
            </ButtonLink>
          </div>
        </aside>
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FamilyObserverBadge count={1} />
            <TrustChip agent="Hafiz" action="photo gated" timestamp="now" />
          </div>
          <PhotoGate mode="silhouette" name={me.email.split("@")[0] ?? "profile"} />
          <h2 className="mt-5 font-serif text-[1.8rem] leading-tight">
            {me.email.split("@")[0]}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            {publicNote}
          </p>
          <div className="mt-5">
            <AgentBubble agent="Watim">{familyNote}</AgentBubble>
          </div>
        </article>
      </section>
    </main>
  );
}

function extractNote(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const note = (value as { note?: unknown }).note;
  return typeof note === "string" ? note : "";
}
