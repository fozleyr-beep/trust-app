import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ButtonLink, Eyebrow, Wordmark } from "@/app/components/SakinahPrimitives";
import { SakinahWalkthrough } from "@/app/components/SakinahWalkthrough";

export const metadata: Metadata = {
  title: "Sakinah — 30 second walkthrough",
  description:
    "A motion walkthrough of Sakinah's discovery, salaam, mediated thread, and handoff flow.",
  robots: { index: true, follow: true },
};

export default function WalkthroughPage() {
  return (
    <main>
      <nav className="border-b border-[var(--color-rule)] px-5 py-5 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Wordmark compact />
          <div className="flex items-center gap-4">
            <Link
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              href={"/trust" as Route}
            >
              Trust
            </Link>
            <ButtonLink href={"/sign-up" as Route}>Begin</ButtonLink>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14 lg:px-14">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Eyebrow>Thirty seconds</Eyebrow>
            <h1 className="font-serif text-[3rem] font-normal leading-[1.02] md:text-[4.25rem]">
              The room,
              <br />
              <span className="italic text-[var(--color-ink-muted)]">
                end to end.
              </span>
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--color-ink-soft)] lg:justify-self-end">
            Discovery is limited. Salaam is one tap. Adil mediates consent.
            When the thread has gone far enough, Sakinah leaves the room and
            families take it from there.
          </p>
        </div>
        <SakinahWalkthrough />
      </section>
    </main>
  );
}
