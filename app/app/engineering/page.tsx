import Link from "next/link";
import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";

export const dynamic = "force-dynamic";

const docs = [
  {
    href: "/ENGINEERING_PLAN.md",
    title: "Engineering plan",
    body: "Milestones, schema ownership, launch gates, and verification loop.",
  },
  {
    href: "/API_CONTRACTS.md",
    title: "API contracts",
    body: "Public, authenticated, service, billing, messaging, and agent route contracts.",
  },
  {
    href: "/AGENT_PROMPTS.md",
    title: "Agent prompts",
    body: "Operational prompts and boundaries for Hafiz, Watim, Adil, and Sabr.",
  },
] as const;

export default async function EngineeringPage() {
  await requireDbUser();

  return (
    <AppServiceShell
      body="The design only becomes a platform when the schemas, APIs, prompts, tests, deploy gates, and mobile policy are explicit."
      cta={{ href: "/app" as Route, label: "Back to command" }}
      eyebrow="Build plan · contracts"
      title={
        <>
          From canvas
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            to shipped system.
          </span>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {docs.map((doc) => (
          <a
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-ink-muted)]"
            href={doc.href}
            key={doc.href}
          >
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              doc
            </p>
            <h2 className="mt-4 font-serif text-[1.5rem] leading-tight">
              {doc.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
              {doc.body}
            </p>
          </a>
        ))}
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StepCard
          agent="Hafiz"
          body="Schema drift, typecheck, tests, build, bundle, and production smoke remain required."
          n="01"
          state="live"
          title="Verification gates"
        />
        <StepCard
          agent="Watim"
          body="Search/filter stays bounded by explicit hard gates and explainable shortlist generation."
          n="02"
          state="ready"
          title="Product contract"
        />
        <StepCard
          agent="Sabr"
          body="No agent prompt may ask for encrypted room plaintext or raw identity evidence."
          n="03"
          state="live"
          title="Safety boundary"
        />
      </div>
      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        Static docs are also exposed for review:{" "}
        <Link className="underline" href={"/trust" as Route}>
          trust contract
        </Link>
        .
      </p>
    </AppServiceShell>
  );
}
