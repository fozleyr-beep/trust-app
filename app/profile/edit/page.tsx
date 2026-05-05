import type { Metadata } from "next";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { ButtonLink, Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";
import { ProfileLayerEditor } from "@/app/components/V7Controls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit profile — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function ProfileEditPage() {
  const me = await requireDbUser();
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Profile · three layers</Eyebrow>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            Public, gated,
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              and family context.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
            Public is what a considered match can see. Gated unlocks only after
            mutual interest. Family context is for observer digest and wali
            conversations.
          </p>
        </div>
        <TrustChip agent="Hafiz" action="layer editor open" timestamp="now" />
      </div>
      <section className="mt-8 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <ProfileLayerEditor
          initial={{
            layerPublic: me.layerPublic,
            layerGated: me.layerGated,
            layerFamily: me.layerFamily,
          }}
        />
      </section>
      <div className="mt-6">
        <ButtonLink href={"/profile/preview" as Route} tone="secondary">
          Preview as match
        </ButtonLink>
      </div>
    </main>
  );
}
