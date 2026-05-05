import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  FamilyObserverBadge,
  PhotoGate,
  TrustChip,
  Wordmark,
} from "@/app/components/SakinahPrimitives";

export const metadata: Metadata = {
  title: "Sakinah.family — a quiet room where families meet",
  description:
    "An AI-operated matrimonial platform for Muslim families, built around named agents, family observers, payments without sales calls, and end-to-end encrypted conversations.",
  robots: { index: true, follow: true },
};

const steps = [
  {
    n: "01",
    title: "You begin",
    body: "Profile, verification, voice intake, and family link. The first pass should take around 12 minutes.",
  },
  {
    n: "02",
    title: "Watim introduces",
    body: "No swipe feed. Watim brings a small set of considered matches and shows the reason each one is here.",
  },
  {
    n: "03",
    title: "Adil mediates",
    body: "The thread stays respectful, consent prompts are explicit, and family observers stay read-only.",
  },
  {
    n: "04",
    title: "You leave the room",
    body: "When both sides are ready, Sakinah closes the thread and hands the next step back to families.",
  },
] as const;

const operatingModel = [
  {
    n: "01",
    title: "Onboard",
    body: "Hafiz handles identity, phone, email, liveness, and voice intake without an intake call.",
  },
  {
    n: "02",
    title: "Introduce",
    body: "Watim prepares a small shortlist and explains the reason for every introduction.",
  },
  {
    n: "03",
    title: "Mediate",
    body: "Adil keeps consent explicit, logs agent actions, and never lets observers post into the room.",
  },
  {
    n: "04",
    title: "Bill",
    body: "Stripe Checkout and billing portal are the launch bar: pay, pause, and manage service without sales calls.",
  },
  {
    n: "05",
    title: "Close",
    body: "Sabr watches for pressure and Sakinah exits once families should take the next step offline.",
  },
] as const;

export default function RootPage() {
  return (
    <main>
      <nav className="border-b border-[var(--color-rule)] px-5 py-5 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Wordmark />
          <div className="hidden items-center gap-6 text-sm text-[var(--color-ink-muted)] md:flex">
            <a href="#how">How it works</a>
            <Link href={"/trust" as Route}>Trust</Link>
            <Link href={"/walkthrough" as Route}>Walkthrough</Link>
            <a href="#families">For families</a>
            <span aria-disabled="true" className="text-[var(--color-ink-faint)]">
              Pricing
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="hidden text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline"
              href={"/sign-in" as Route}
            >
              Sign in
            </Link>
            <ButtonLink href={"/sign-up" as Route}>Begin</ButtonLink>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div>
          <Eyebrow>AI-operated matrimonial trust platform</Eyebrow>
          <h1 className="max-w-4xl font-serif text-[3.3rem] font-normal leading-[0.98] tracking-normal md:text-[5.25rem]">
            A quiet room
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              where families meet.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--color-ink-soft)]">
            Sakinah is being built as a zero-human-operator matrimonial trust
            platform for Muslim families. Named agents verify, introduce,
            mediate, bill, and close the service flow without a Sakinah staff
            member stepping into the room.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={"/sign-up" as Route}>Begin a profile</ButtonLink>
            <ButtonLink href={"/walkthrough" as Route} tone="secondary">
              Watch the flow
            </ButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 font-mono text-[0.68rem] text-[var(--color-ink-faint)] md:flex-nowrap">
            <span>private build</span>
            <span className="hidden md:inline">·</span>
            <span>named agents visible</span>
            <span className="hidden md:inline">·</span>
            <span>no staff in the room</span>
            <span className="hidden md:inline">·</span>
            <span>E2E messages live</span>
          </div>
        </div>

        <aside className="relative">
          <div className="absolute -right-2 -top-4 z-20 hidden rounded-full bg-[var(--color-ink)] px-3 py-1.5 font-mono text-[0.68rem] text-[var(--color-paper)] lg:block">
            ← every chip names the agent
          </div>
          <div className="rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                Profile · launch preview
              </p>
              <TrustChip agent="Adil" action="message boundary live" timestamp="now" />
            </div>
            <PhotoGate name="Aisha" />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[1.75rem] leading-tight">
                  Aisha, 27
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  Karachi → London · Architect
                </p>
              </div>
              <FamilyObserverBadge count={2} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <TrustChip agent="Watim" action="match preview" timestamp="now" />
              <TrustChip agent="Hafiz" action="provider pending" timestamp="now" />
            </div>
            <div className="mt-5">
              <AgentBubble agent="Watim">
                I checked the profile against Yusuf&rsquo;s must-haves and found
                overlap on family involvement, timeline, and city flexibility.
              </AgentBubble>
            </div>
          </div>
        </aside>
      </section>

      <section
        id="how"
        className="border-y border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-14 md:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            How Sakinah works · in four turns
          </p>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n}>
                <p className="font-mono text-xs text-[var(--color-ink-faint)]">
                  {step.n}
                </p>
                <h3 className="mt-3 font-serif text-[1.45rem] leading-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="families"
        className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14"
      >
        <div>
          <Eyebrow>For families</Eyebrow>
          <h2 className="font-serif text-[2.5rem] font-normal leading-tight">
            Observing is not approving.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Family observers can read the room.",
            "They cannot reply into a seeker thread.",
            "Every agent action leaves an audit trail.",
          ].map((item, index) => (
            <div
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 text-sm leading-6 text-[var(--color-ink-soft)]"
              key={item}
            >
              <p className="mb-4 font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                0{index + 1}
              </p>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-14 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <Eyebrow>Zero human operator</Eyebrow>
            <h2 className="font-serif text-[2.5rem] font-normal leading-tight">
              The service has to run without a back office.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {operatingModel.map((item) => (
              <article
                className="min-h-52 rounded border border-[var(--color-rule)] bg-[var(--color-paper)] p-5"
                key={item.title}
              >
                <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                  {item.n}
                </p>
                <h3 className="mt-5 font-serif text-[1.35rem] leading-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-rule)] px-5 py-10 font-mono text-[0.68rem] tracking-[0.04em] text-[var(--color-ink-faint)] md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span>سكينة · sakinah · private build</span>
          <div className="flex flex-col gap-2 md:flex-row md:gap-6">
            <span>End-to-end encrypted</span>
            <span>No one at Sakinah reads your app messages.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
