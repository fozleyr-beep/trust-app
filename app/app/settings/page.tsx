import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "@clerk/nextjs";
import { requireDbUser } from "@/lib/auth/current-user";
import { AuditExportButton } from "@/app/components/ServiceControls";
import { MyFingerprint } from "@/app/components/Fingerprint";
import { ExportButton } from "@/app/components/ExportButton";
import { RotateKeyButton } from "@/app/components/RotateKeyButton";
import { DeleteAccountButton } from "@/app/components/DeleteAccountButton";
import { AgentBubble } from "@/app/components/SakinahPrimitives";
import { StatusPill } from "@/app/components/ServiceFlow";
import {
  sakinahAgents,
  type AgentStageState,
  type SakinahAgent,
} from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireDbUser();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Platform settings
      </p>
      <h1 className="font-serif text-[2.8rem] font-normal leading-[1.1] md:text-[4rem]">
        Control the operating boundary.
      </h1>
      <p className="mt-5 max-w-3xl leading-7 text-[var(--color-ink-soft)]">
        Device keys, encrypted export, agent permissions, service audit, and
        account controls belong here. Anything agents do must be visible and
        exportable.
      </p>

      <section className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <h2 className="font-serif text-[1.45rem] leading-tight">
            Device fingerprint
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            Read this aloud on a separate channel so a counterpart can confirm
            they are encrypting to this device. The fingerprint is the first 16
            bytes of this device&rsquo;s X25519 public key.
          </p>
          <p className="mt-4">
            <MyFingerprint />
          </p>
          <div className="mt-6">
            <RotateKeyButton />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--color-ink-muted)]">
            Rotate if this device key may be exposed. Past local messages stay
            readable; new messages encrypt to the new key.
          </p>
          <div className="mt-4 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              recovery warning
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--color-ink-muted)]">
              Sakinah cannot recover a lost private device key. Keep another
              trusted device registered before rotating this one.
            </p>
          </div>
        </article>

        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <h2 className="font-serif text-[1.45rem] leading-tight">
            Export controls
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            Message export decrypts on this device only. Service audit export
            returns profile state, agent ledger rows, matches, salaam requests,
            and room metadata.
          </p>
          <div className="mt-5 grid gap-4">
            <ExportButton />
            <AuditExportButton />
          </div>
        </article>
      </section>

      <section className="mt-8 rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
              Agent permissions
            </p>
            <h2 className="mt-3 font-serif text-[1.7rem] leading-tight">
              Four agents can write service state, not private room plaintext.
            </h2>
          </div>
          <StatusPill state="live" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {sakinahAgents.map((agent) => (
            <article
              className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4"
              key={agent.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-[1.3rem] leading-tight">
                    {agent.name}{" "}
                    <span className="text-[var(--color-ink-muted)]">
                      {agent.arabic}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    {agent.role}
                  </p>
                </div>
                <StatusPill state={agentPermissionState(agent)} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
                {agent.promise}
              </p>
              <p className="mt-3 text-xs leading-5 text-[var(--color-ink-muted)]">
                Boundary: {agent.boundary}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-5">
          <AgentBubble agent="Sabr">
            Agent access is deliberately narrow: service ledger yes, encrypted
            message plaintext no.
          </AgentBubble>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
          <h2 className="font-serif text-[1.45rem] leading-tight">Account</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Signed in as{" "}
            <code className="font-mono text-[0.9rem]">{me.email}</code>.
          </p>
          <p className="mt-5">
            <SignOutButton redirectUrl="/">
              <button className="rounded border border-[var(--color-ink)] px-5 py-3 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]">
                Sign out
              </button>
            </SignOutButton>
          </p>
        </article>

        <article className="rounded border border-red-900/30 bg-[var(--color-surface)] p-5">
          <h2 className="font-serif text-[1.45rem] leading-tight text-red-900">
            Danger zone
          </h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Self-serve account deletion. Irreversible.
          </p>
          <div className="mt-5">
            <DeleteAccountButton />
          </div>
        </article>
      </section>

      <p className="mt-10 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/app" as Route}
        >
          ← Back
        </Link>
      </p>
    </main>
  );
}

function agentPermissionState(agent: SakinahAgent): AgentStageState {
  if (agent.status === "provider pending") return "gate";
  if (agent.status === "message boundary live") return "live";
  return "ready";
}
