import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type AgentName = "Watim" | "Hafiz" | "Adil" | "Sabr" | "Sakinah";

const agentArabic: Record<AgentName, string> = {
  Watim: "الواطم",
  Hafiz: "الحافظ",
  Adil: "العادل",
  Sabr: "الصبر",
  Sakinah: "سكينة",
};

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className="inline-flex items-baseline gap-3 text-[var(--color-ink)]"
      href={"/" as Route}
    >
      <span
        className={[
          "font-serif font-normal italic leading-none tracking-normal",
          compact ? "text-[1.5rem]" : "text-[2rem]",
        ].join(" ")}
      >
        sakinah
      </span>
      {!compact && (
        <span className="font-serif text-[1.15rem] italic text-[var(--color-ink-muted)]">
          {agentArabic.Sakinah}
        </span>
      )}
    </Link>
  );
}

export function TrustChip({
  agent,
  action,
  timestamp,
  size = "sm",
}: {
  agent: AgentName;
  action: string;
  timestamp: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full bg-[var(--color-paper-soft)] text-[var(--color-ink-soft)]",
        "font-mono tracking-normal",
        size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[0.68rem]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
      />
      <span>
        {agent} · {action} · {timestamp}
      </span>
    </span>
  );
}

export function AgentBubble({
  agent,
  children,
}: {
  agent: Exclude<AgentName, "Sakinah">;
  children: ReactNode;
}) {
  return (
    <div className="rounded border border-[var(--color-rule)] bg-[var(--color-cream-2)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
      <p className="mb-2 flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
        />
        {agent} · {agentArabic[agent]}
      </p>
      {children}
    </div>
  );
}

export function PhotoGate({
  mode = "silhouette",
  name = "Aisha",
}: {
  mode?: "blur" | "soft" | "mosaic" | "silhouette";
  name?: string;
}) {
  const overlay =
    mode === "blur"
      ? "bg-[linear-gradient(180deg,rgba(42,39,34,0.08),rgba(42,39,34,0.36))] backdrop-blur-2xl"
      : mode === "soft"
        ? "bg-[radial-gradient(circle_at_50%_30%,rgba(255,250,241,0.42),rgba(42,39,34,0.28))] backdrop-blur-md"
        : mode === "mosaic"
          ? "bg-[repeating-linear-gradient(45deg,rgba(255,250,241,0.22)_0_8px,rgba(42,39,34,0.18)_8px_16px)]"
          : "bg-[linear-gradient(180deg,rgba(42,39,34,0.04),rgba(42,39,34,0.28))]";

  return (
    <div className="relative flex h-[220px] overflow-hidden rounded bg-[linear-gradient(135deg,var(--color-paper-soft),var(--color-ink-faint))]">
      <div className={["absolute inset-0", overlay].join(" ")} />
      <div className="relative z-10 m-auto max-w-[16rem] px-6 text-center text-[var(--color-paper)]">
        {mode === "silhouette" && (
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-14 w-11 rounded-t-full border border-current border-b-0"
          />
        )}
        <p className="text-sm leading-6">
          gated · mutual interest reveals · {mode}
        </p>
        <p className="mt-2 text-xs leading-5 opacity-85">
          by Sakinah, not by {name}
        </p>
      </div>
    </div>
  );
}

export function FamilyObserverBadge({
  count,
  mode = "always",
}: {
  count: number;
  mode?: "always" | "contextual" | "on-demand";
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-1 font-mono text-[0.68rem] text-[var(--color-ink-muted)]">
      family observing · {count} · {mode}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  tone = "primary",
}: {
  href: Route;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  const className =
    tone === "primary"
      ? "inline-flex min-h-11 items-center justify-center rounded bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)]"
      : "inline-flex min-h-11 items-center justify-center rounded border border-[var(--color-ink)] px-5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]";

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-faint)]"
      />
      {children}
    </p>
  );
}

export function SalaamQuotaMeter({
  sent = 0,
  limit = 3,
}: {
  sent?: number;
  limit?: number;
}) {
  const left = Math.max(0, limit - sent);
  return (
    <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          weekly salaam quota
        </p>
        <TrustChip agent="Adil" action="quota checked" timestamp="now" />
      </div>
      <p className="mt-4 font-serif text-[1.8rem] leading-none">
        you have {left} salaam left this week.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: limit }).map((_, index) => (
          <span
            aria-hidden="true"
            className={[
              "h-1 rounded-full",
              index < sent
                ? "bg-[var(--color-ink)]"
                : "bg-[var(--color-rule)]",
            ].join(" ")}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function HandoffCeremony() {
  return (
    <section className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
      <TrustChip agent="Adil" action="handoff ceremony locked" timestamp="4w+" />
      <h3 className="mt-4 font-serif text-[1.6rem] leading-tight">
        Handoff ceremony
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        After four active weeks, Adil can ask both sides for consent to close
        the room. Both walis receive a non-verbatim summary; contact details are
        revealed only by mutual consent; encrypted room data is scheduled for
        purge within seven days.
      </p>
    </section>
  );
}

export function SabrIntervention({
  state = "paused",
}: {
  state?: "paused" | "watching" | "clear";
}) {
  return (
    <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <TrustChip agent="Sabr" action={`thread ${state}`} timestamp="now" />
      <p className="mt-4 font-serif text-[1.35rem] leading-tight">
        {state === "paused"
          ? "Sabr paused this thread for review."
          : state === "watching"
            ? "Sabr is watching pressure signals."
            : "Sabr sees no active pressure flag."}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        This surface is driven by metadata, reports, consent state, and stale
        flow timing. It does not require Sakinah to read message plaintext.
      </p>
    </section>
  );
}

export function WaliDigestCard({
  body,
  writtenAt = "today",
}: {
  body: string;
  writtenAt?: string;
}) {
  return (
    <article className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <TrustChip agent="Adil" action="wali digest written" timestamp={writtenAt} />
      <p className="mt-4 text-sm leading-6 text-[var(--color-ink-soft)]">
        {body}
      </p>
      <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        non-verbatim · no ciphertext · no screenshots
      </p>
    </article>
  );
}
