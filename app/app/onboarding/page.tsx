import type { Route } from "next";
import { requireDbUser } from "@/lib/auth/current-user";
import { AppServiceShell, StepCard } from "@/app/components/ServiceFlow";
import { ServiceProfileForm } from "@/app/components/ServiceControls";
import { getServiceProfile } from "@/lib/service/operations";
import { getProfileCompleteness } from "@/lib/service/profile-completeness";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "01",
    title: "Profile facts",
    agent: "Hafiz",
    body: "Name, age band, location, intent, and contact channels. The goal is a complete packet without a staff intake call.",
  },
  {
    n: "02",
    title: "Voice intake",
    agent: "Watim",
    body: "The agent asks structured questions and turns answers into match preferences the seeker can edit before anything is shown.",
  },
  {
    n: "03",
    title: "Family link",
    agent: "Hafiz",
    body: "Invite a wali or family observer as read-only context. Observing is not approving and never becomes posting access.",
  },
  {
    n: "04",
    title: "Consent summary",
    agent: "Adil",
    body: "Before matching starts, Adil shows what can be used for introductions and what remains private.",
  },
] as const;

export default async function OnboardingPage() {
  const me = await requireDbUser();
  const profile = await getServiceProfile(me.id);
  const completeness = getProfileCompleteness(profile);

  return (
    <AppServiceShell
      body="This is the customer intake path for a no-human service. Sakinah should gather enough context to operate without a coordinator asking follow-up questions by hand."
      cta={{ href: "/app/verification" as Route, label: "Next: verification" }}
      eyebrow="Step 01 · onboarding"
      title={
        <>
          Intake without
          <br />
          <span className="italic text-[var(--color-ink-muted)]">
            an intake call.
          </span>
        </>
      }
    >
      <section className="mb-4 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
              profile completeness
            </p>
            <h2 className="mt-3 font-serif text-[1.8rem] leading-tight">
              {completeness.percent}% ready for Watim
            </h2>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
            {completeness.readyForMatching ? "ready" : "needs intake"}
          </p>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[var(--color-surface)]">
          <div
            className="h-2 rounded-full bg-[var(--color-accent)]"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        {completeness.missing.length > 0 && (
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
            Missing: {completeness.missing.join(", ")}.
          </p>
        )}
      </section>
      <ServiceProfileForm profile={profile} />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <StepCard key={step.n} {...step} state="ready" />
        ))}
      </div>
    </AppServiceShell>
  );
}
