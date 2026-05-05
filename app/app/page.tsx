import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import {
  AgentBubble,
  Eyebrow,
  TrustChip,
} from "@/app/components/SakinahPrimitives";
import { AgentOpsPanel, StatusPill } from "@/app/components/ServiceFlow";
import {
  AuditExportButton,
  ServiceRunButton,
} from "@/app/components/ServiceControls";
import { requireDbUser } from "@/lib/auth/current-user";
import { getPlatformSnapshot, type PlatformStage } from "@/lib/service/platform";
import type { AgentStageState } from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

// Post-auth landing. Middleware will already have redirected unauthed
// visitors to /sign-in; the explicit guard below is a belt + suspenders so
// a future middleware change cannot silently expose this.

export default async function AppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  const user = await currentUser();
  const me = await requireDbUser();
  const snapshot = await getPlatformSnapshot(me.id);
  const nextStage =
    snapshot.stages.find((stage) => stage.status === "active") ??
    snapshot.stages.find((stage) => stage.status === "blocked") ??
    snapshot.stages[0];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
      <DeviceBootstrap />
      <section className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Command center</Eyebrow>
            <TrustChip agent="Adil" action="message boundary live" timestamp="now" />
          </div>
          <h1 className="max-w-4xl font-serif text-[2.8rem] font-normal leading-tight md:text-[4rem]">
            Welcome back,{" "}
            <span className="italic text-[var(--color-ink-muted)]">
              {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
            </span>
            .
          </h1>
          <p className="mt-5 max-w-3xl leading-7 text-[var(--color-ink-soft)]">
            This is the Sakinah operating console: profile state, verification
            gates, billing access, agent actions, matches, salaam consent, and
            encrypted rooms in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ServiceRunButton>Run all agents</ServiceRunButton>
            <AuditExportButton />
          </div>
        </div>
        <PlatformReadiness percent={snapshot.readiness} nextStage={nextStage} />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {snapshot.stages.map((stage) => (
          <StageTile key={stage.href} stage={stage} />
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <AgentOpsPanel actions={snapshot.actions} />
        <div className="space-y-4">
          <MetricCard
            label="Profile"
            value={snapshot.profile?.readiness ?? "not started"}
            body={
              snapshot.profile
                ? `${snapshot.profile.role} · ${snapshot.profile.location ?? "location pending"}`
                : "Save onboarding to start the platform state."
            }
          />
          <MetricCard
            label="Matches"
            value={String(snapshot.matches.length)}
            body="Watim suggestions are explainable and capped."
          />
          <MetricCard
            label="Salaam"
            value={String(snapshot.salaams.length)}
            body={`${snapshot.pendingSalaams.length} request(s) awaiting consent.`}
          />
          <MetricCard
            label="Rooms"
            value={String(snapshot.threads.length)}
            body="Encrypted rooms stay separate from agent chat."
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceLink
          eyebrow="Prototype"
          href={"/app/mobile-flow" as Route}
          title="Mobile flow"
          body="Click through landing, intake, discovery, salaam, and encrypted room."
        />
        <SurfaceLink
          eyebrow="Start"
          href={"/app/onboarding" as Route}
          title="Service profile"
          body="Save the consented profile state Hafiz and Watim can operate on."
        />
        <SurfaceLink
          eyebrow="Watim"
          href={"/app/discovery" as Route}
          title="Discovery filters"
          body="Set hard gates and soft preferences without creating a browse feed."
        />
        <SurfaceLink
          eyebrow="Adil"
          href={"/app/salaam" as Route}
          title="Consent queue"
          body="Accept, decline, or wait without opening a room prematurely."
        />
        <SurfaceLink
          eyebrow="Family"
          href={"/app/wali" as Route}
          title="Wali view"
          body="See what observers can witness and what they cannot control."
        />
        <SurfaceLink
          eyebrow="Sabr"
          href={"/app/sabr" as Route}
          title="Safety console"
          body="Pressure, report, and observer signals without plaintext access."
        />
        <SurfaceLink
          eyebrow="Model"
          href={"/app/economics" as Route}
          title="Economics"
          body="Draft sustainability model with web billing and Android policy gates."
        />
        <SurfaceLink
          eyebrow="Build"
          href={"/app/engineering" as Route}
          title="Contracts"
          body="Schemas, API contracts, agent prompts, and launch gates."
        />
      </section>

      <div className="mt-8">
        <AgentBubble agent="Sabr">
          The platform is not a landing page. Every promise must resolve into a
          route, a state, an action, or a clear launch gate.
        </AgentBubble>
      </div>
    </main>
  );
}

function PlatformReadiness({
  nextStage,
  percent,
}: {
  nextStage?: PlatformStage;
  percent: number;
}) {
  return (
    <aside className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Platform readiness
      </p>
      <p className="mt-5 font-serif text-[4rem] leading-none">{percent}%</p>
      <div className="mt-5 h-2 rounded-full bg-[var(--color-paper-soft)]">
        <div
          className="h-2 rounded-full bg-[var(--color-accent)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextStage && (
        <div className="mt-6 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            next action · {nextStage.owner}
          </p>
          <h2 className="mt-3 font-serif text-[1.4rem] leading-tight">
            {nextStage.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
            {nextStage.detail}
          </p>
          <Link
            className="mt-4 inline-flex min-h-10 items-center rounded bg-[var(--color-ink)] px-4 text-sm text-[var(--color-paper)]"
            href={nextStage.href as Route}
          >
            Open
          </Link>
        </div>
      )}
    </aside>
  );
}

function StageTile({ stage }: { stage: PlatformStage }) {
  const tone =
    stage.status === "complete"
      ? "border-[var(--color-accent)]"
      : stage.status === "active"
        ? "border-[var(--color-ink-muted)]"
        : "border-[var(--color-rule)]";
  return (
    <Link
      className={`rounded border ${tone} bg-[var(--color-surface)] p-4 hover:border-[var(--color-ink)]`}
      href={stage.href as Route}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          {stage.owner}
        </p>
        <StatusPill state={stagePillState(stage.status)} />
      </div>
      <h2 className="mt-4 font-serif text-[1.25rem] leading-tight">
        {stage.label}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        {stage.detail}
      </p>
    </Link>
  );
}

function stagePillState(status: PlatformStage["status"]): AgentStageState {
  if (status === "complete") return "live";
  if (status === "active") return "ready";
  return "gate";
}

function MetricCard({
  body,
  label,
  value,
}: {
  body: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-[1.8rem] leading-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
        {body}
      </p>
    </article>
  );
}

function SurfaceLink({
  eyebrow,
  href,
  title,
  body,
}: {
  eyebrow: string;
  href: Route;
  title: string;
  body: string;
}) {
  return (
    <Link
      className="group rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-ink-muted)]"
      href={href}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-[1.5rem] leading-tight group-hover:text-[var(--color-ink)]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        {body}
      </p>
    </Link>
  );
}
