import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  TrustChip,
  WaliDigestCard,
  Wordmark,
} from "@/app/components/SakinahPrimitives";
import { ArchFrame, Girih } from "@/app/components/MarketingPrimitives";

export const metadata: Metadata = {
  title: "For families — Sakinah.family",
  description:
    "How Sakinah lets Muslim families witness a matrimonial process without turning wali support into control.",
  robots: { index: true, follow: true },
};

const principles = [
  {
    title: "Witness, not control",
    body: "Family can be present without approving, declining, or typing into the seeker thread.",
  },
  {
    title: "Visible boundaries",
    body: "Every observer is visible. No silent watching, no hidden escalation, no growth funnel.",
  },
  {
    title: "Non-verbatim context",
    body: "Wali digests summarize process state and consent boundaries without quoting private messages.",
  },
] as const;

const faqs = [
  [
    "Can a wali send messages inside the couple's room?",
    "No. Observer posting is blocked server-side and tested at the message API boundary.",
  ],
  [
    "Do families pay?",
    "Walis are free. The service should never make family presence a premium upsell.",
  ],
  [
    "Can I step back?",
    "Yes. Step-back is a first-class state; it should be visible and reversible by invitation, not pressure.",
  ],
  [
    "Will the sender see invite analytics?",
    "No. Loved-one invites expire silently. There are no referral rewards and no sender telemetry.",
  ],
] as const;

export default function ForFamiliesPage() {
  return (
    <main className="overflow-hidden">
      <nav className="border-b border-[var(--color-rule)] px-5 py-5 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Wordmark compact />
          <Link
            className="text-sm text-[var(--color-ink-muted)]"
            href={"/trust" as Route}
          >
            Trust
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-10 lg:grid-cols-[1fr_0.8fr] lg:px-14">
        <Girih className="absolute -right-16 top-8 h-72 w-72 text-[var(--color-brass)] opacity-20" />
        <div>
          <Eyebrow>For families</Eyebrow>
          <h1 className="font-serif text-[3.1rem] font-normal leading-[1.02] md:text-[4.6rem]">
            You can witness
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              without taking over.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
            Sakinah treats wali and family involvement as trust infrastructure,
            not a backdoor control panel. The platform shows what happened, who
            did it, and what boundary was enforced.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={"/sign-up" as Route}>Begin</ButtonLink>
            <ButtonLink href={"/invite" as Route} tone="secondary">
              Invite a loved one
            </ButtonLink>
          </div>
        </div>
        <div className="relative">
          <ArchFrame className="absolute inset-x-0 top-0 mx-auto h-[26rem] w-64 text-[var(--color-ink-faint)] opacity-30" />
          <div className="relative mt-10">
            <WaliDigestCard
              body="Adil saw mutual consent, two respectful exchanges, and no pressure signal. The observer remains read-only. No private message text is included in this digest."
              writtenAt="today"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-14 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {principles.map((principle, index) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={principle.title}
            >
              <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                0{index + 1}
              </p>
              <h2 className="mt-5 font-serif text-[1.55rem] leading-tight">
                {principle.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {principle.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-14">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-serif text-[2.4rem] font-normal leading-tight">
            The family boundary is part of the product.
          </h2>
          <div className="mt-6">
            <TrustChip agent="Adil" action="observer rules visible" timestamp="now" />
          </div>
        </div>
        <div className="grid gap-3">
          {faqs.map(([question, answer]) => (
            <details
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
              key={question}
            >
              <summary className="cursor-pointer font-serif text-[1.25rem]">
                {question}
              </summary>
              <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-ink)] px-5 py-14 text-[var(--color-paper)] md:px-10 lg:px-14">
        <div className="mx-auto max-w-4xl">
          <AgentBubble agent="Sabr">
            Walis are free because family safety is not a monetization lever.
            If an observer flow ever starts measuring invite conversion back to
            the sender, the design contract is broken.
          </AgentBubble>
        </div>
      </section>
    </main>
  );
}
