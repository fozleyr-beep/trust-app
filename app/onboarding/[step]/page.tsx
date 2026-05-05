import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDbUser } from "@/lib/auth/current-user";
import { getServiceProfile } from "@/lib/service/operations";
import { ServiceProfileForm } from "@/app/components/ServiceControls";
import { VoiceIntakeRecorder, InviteLovedOneFlow } from "@/app/components/V7Controls";
import {
  AgentBubble,
  ButtonLink,
  Eyebrow,
  TrustChip,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding — Sakinah.family",
  robots: { index: false, follow: false },
};

const steps = ["greet", "verify", "voice", "family"] as const;
type Step = (typeof steps)[number];

const stepCopy: Record<Step, { title: string; agent: "Hafiz" | "Watim" | "Adil" | "Sabr"; body: string }> = {
  greet: {
    title: "Four steps, twelve minutes.",
    agent: "Watim",
    body: "Watim sets expectations before any profile data is collected: verification, voice intake, family link, and review.",
  },
  verify: {
    title: "Hafiz verifies, then discards evidence.",
    agent: "Hafiz",
    body: "Persona and Stripe Identity are launch-gated here. Raw ID evidence must become a provider result, hash, and audit row.",
  },
  voice: {
    title: "The voice intake is the heart.",
    agent: "Watim",
    body: "Speak naturally. Watim drafts the public layer, but the user approves before anything is published.",
  },
  family: {
    title: "Family is optional and visible.",
    agent: "Adil",
    body: "Invite observers if useful. The invite is skippable, expires silently, and never gives posting access.",
  },
};

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: rawStep } = await params;
  if (!isStep(rawStep)) notFound();
  const me = await requireDbUser();
  const profile = await getServiceProfile(me.id);
  const currentIndex = steps.indexOf(rawStep);
  const copy = stepCopy[rawStep];
  const next = steps[currentIndex + 1];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Onboarding · {rawStep}</Eyebrow>
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <aside>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            {copy.title}
          </h1>
          <p className="mt-5 text-sm leading-6 text-[var(--color-ink-soft)]">
            {copy.body}
          </p>
          <div className="mt-6">
            <TrustChip agent={copy.agent} action={`${rawStep} active`} timestamp="now" />
          </div>
          <nav className="mt-8 grid gap-2">
            {steps.map((item, index) => (
              <Link
                className={[
                  "rounded border px-4 py-3 text-sm",
                  item === rawStep
                    ? "border-[var(--color-ink)] bg-[var(--color-surface)]"
                    : "border-[var(--color-rule)]",
                ].join(" ")}
                href={`/onboarding/${item}` as Route}
                key={item}
              >
                <span className="font-mono text-[0.62rem] text-[var(--color-ink-faint)]">
                  0{index + 1}
                </span>{" "}
                {item}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="grid gap-5">
          {rawStep === "greet" && (
            <>
              <AgentBubble agent="Watim">
                I will ask only for what helps Sakinah operate without a
                coordinator. You can stop after any step and continue later.
              </AgentBubble>
              <ServiceProfileForm profile={profile} />
            </>
          )}
          {rawStep === "verify" && (
            <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
              <TrustChip agent="Hafiz" action="provider launch gate" timestamp="now" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {["ID document", "Selfie liveness", "Phone channel", "Email channel"].map(
                  (item) => (
                    <div
                      className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4"
                      key={item}
                    >
                      <h2 className="font-serif text-[1.35rem]">{item}</h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                        Provider result only. Raw evidence is not retained in
                        Sakinah tables.
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          {rawStep === "voice" && <VoiceIntakeRecorder />}
          {rawStep === "family" && <InviteLovedOneFlow />}
          <div className="flex flex-wrap gap-3">
            {next ? (
              <ButtonLink href={`/onboarding/${next}` as Route}>Next step</ButtonLink>
            ) : (
              <ButtonLink href={"/discovery" as Route}>Open discovery</ButtonLink>
            )}
            <ButtonLink href={"/app" as Route} tone="secondary">
              Platform console
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}

function isStep(value: string): value is Step {
  return steps.some((step) => step === value);
}
