import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Wordmark } from "@/app/components/SakinahPrimitives";

const platformNav = [
  { href: "/app", label: "Command" },
  { href: "/app/mobile-flow", label: "Mobile flow" },
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/verification", label: "Verification" },
  { href: "/app/discovery", label: "Discovery" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/matches", label: "Matches" },
  { href: "/app/salaam", label: "Salaam" },
  { href: "/app/family", label: "Family" },
  { href: "/app/wali", label: "Wali" },
  { href: "/app/sabr", label: "Sabr ops" },
  { href: "/app/economics", label: "Economics" },
  { href: "/app/engineering", label: "Build plan" },
  { href: "/app/threads", label: "Rooms" },
  { href: "/app/agent", label: "Assistant" },
  { href: "/app/settings", label: "Settings" },
] as const;

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap items-center justify-between gap-4 lg:block">
          <Wordmark compact />
          <p className="mt-0 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)] lg:mt-4">
            platform console
          </p>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {platformNav.map((item) => (
            <Link
              className="block rounded border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-ink-muted)] hover:text-[var(--color-ink)] lg:border-transparent lg:bg-transparent"
              href={item.href as Route}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 hidden rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-xs leading-5 text-[var(--color-ink-muted)] lg:block">
          Product rule: agents operate service state. Encrypted room plaintext
          stays outside the agent layer.
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
