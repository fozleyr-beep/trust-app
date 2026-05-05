import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { requireDbUser } from "@/lib/auth/current-user";
import { db, schema } from "@/lib/db";
import { AuditExportButton } from "@/app/components/ServiceControls";
import { AuditFilter } from "@/app/components/V7Controls";
import { Eyebrow, TrustChip } from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit — Sakinah.family",
  robots: { index: false, follow: false },
};

export default async function AuditSettingsPage() {
  const me = await requireDbUser();
  const [auditRows, actionRows] = await Promise.all([
    db()
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.userId, me.id))
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(90),
    db()
      .select()
      .from(schema.agentActions)
      .where(eq(schema.agentActions.userId, me.id))
      .orderBy(desc(schema.agentActions.updatedAt))
      .limit(90),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <Eyebrow>Settings · audit</Eyebrow>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-[3rem] font-normal leading-tight">
            Ninety days
            <br />
            <span className="italic text-[var(--color-ink-muted)]">
              of agent decisions.
            </span>
          </h1>
        </div>
        <AuditExportButton />
      </div>
      <div className="mt-8">
        <AuditFilter>
          <div className="grid gap-3">
            {auditRows.map((row) => (
              <AuditRow
                action={row.action}
                agent={row.agent}
                key={row.id}
                state={row.state}
                tag={row.tag}
                timestamp={row.createdAt.toISOString()}
              />
            ))}
            {actionRows.map((row) => (
              <AuditRow
                action={row.action}
                agent={row.agent}
                key={row.id}
                state={row.status}
                tag={row.key}
                timestamp={row.updatedAt.toISOString()}
              />
            ))}
          </div>
        </AuditFilter>
      </div>
    </main>
  );
}

function AuditRow({
  action,
  agent,
  state,
  tag,
  timestamp,
}: {
  action: string;
  agent: string;
  state: string;
  tag: string;
  timestamp: string;
}) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
      <TrustChip
        agent={titleAgent(agent)}
        action={action}
        timestamp={timestamp.slice(0, 10)}
      />
      <p className="mt-3 font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
        {tag} · {state}
      </p>
    </article>
  );
}

function titleAgent(agent: string): "Hafiz" | "Watim" | "Adil" | "Sabr" {
  if (agent.toLowerCase().includes("hafiz")) return "Hafiz";
  if (agent.toLowerCase().includes("watim")) return "Watim";
  if (agent.toLowerCase().includes("sabr")) return "Sabr";
  return "Adil";
}
