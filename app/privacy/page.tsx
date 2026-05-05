import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Eyebrow, Wordmark } from "@/app/components/SakinahPrimitives";
import { providerProcessing, retentionLedger } from "@/lib/trust/retention";

export const metadata: Metadata = {
  title: "Sakinah — privacy policy",
  description:
    "Sakinah.family privacy policy for web and mobile app users.",
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "What we collect",
    body: "Account email, sign-in identifiers from Clerk, device public keys, service entitlement status, four-agent product-state actions, encrypted message metadata, and ciphertext addressed to each device.",
  },
  {
    title: "What we do not collect",
    body: "We do not store plaintext messages between people, private device keys, analytics pixels, replay scripts, or raw identity evidence as a normal app record.",
  },
  {
    title: "Why we use data",
    body: "To authenticate users, maintain encrypted rooms, show service progress, process paid access when billing is enabled, protect account safety, and support account deletion.",
  },
  {
    title: "Who processes data",
    body: "Clerk handles authentication. Neon stores the app database. Vercel hosts the app. Stripe may process payments when billing is enabled. Anthropic processes only what a user types into the separate assistant surface.",
  },
  {
    title: "Account deletion",
    body: "Users can delete their account inside Settings or from the public deletion instructions page. Deletion revokes device keys, marks the user deleted, and removes the Clerk account. Existing ciphertext may remain for other thread members' history.",
  },
  {
    title: "Contact",
    body: "For privacy or security questions, contact fozleyr@gmail.com.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
      <header className="mb-12 flex items-center justify-between gap-6">
        <Wordmark compact />
        <Link
          className="font-mono text-[0.7rem] uppercase tracking-[0.16em] underline decoration-from-font underline-offset-4"
          href={"/trust" as Route}
        >
          Trust
        </Link>
      </header>
      <Eyebrow>Privacy policy</Eyebrow>
      <h1 className="mt-3 font-serif text-[3rem] font-normal leading-tight">
        What Sakinah holds, and what it refuses to hold.
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-[var(--color-ink-soft)]">
        This policy covers Sakinah.family web and mobile app surfaces. It is
        intentionally plain because privacy promises should be readable before
        they are trusted.
      </p>

      <section className="mt-12 grid gap-4">
        {sections.map((section) => (
          <article
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
            key={section.title}
          >
            <h2 className="font-serif text-[1.35rem]">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
              {section.body}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-[2rem] font-normal">
          Provider processing table
        </h2>
        <div className="mt-5 overflow-hidden rounded border border-[var(--color-rule)]">
          {providerProcessing.map(([provider, data, status, retention]) => (
            <div
              className="grid gap-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-sm last:border-b-0 md:grid-cols-[9rem_1fr_8rem_1.2fr]"
              key={provider}
            >
              <strong className="font-serif text-[1rem] font-normal">
                {provider}
              </strong>
              <span className="text-[var(--color-ink-soft)]">{data}</span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
                {status}
              </span>
              <span className="text-[var(--color-ink-soft)]">
                {retention}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-[2rem] font-normal">Retention ledger</h2>
        <div className="mt-5 grid gap-3">
          {retentionLedger.map(([data, held, retention]) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4"
              key={data}
            >
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                {data}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                {held}. {retention}
              </p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-[var(--color-ink-muted)]">
        Last updated 05 May 2026.
      </p>
    </main>
  );
}
