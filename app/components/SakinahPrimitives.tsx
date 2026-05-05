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
    <div className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
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

export function PhotoGate({ name = "Aisha" }: { name?: string }) {
  return (
    <div className="relative flex h-[220px] overflow-hidden rounded bg-[linear-gradient(135deg,#d4c4a8,#9f9276)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,39,34,0.08),rgba(42,39,34,0.36))] backdrop-blur-2xl" />
      <div className="relative z-10 m-auto max-w-[16rem] px-6 text-center text-[var(--color-paper)]">
        <div className="mx-auto mb-3 h-10 w-8 rounded-t-full border border-current border-b-0" />
        <p className="text-sm leading-6">gated · mutual interest unblurs</p>
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
