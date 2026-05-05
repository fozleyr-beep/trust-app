"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

type Profile = {
  role: string;
  location: string | null;
  intent: string | null;
  familyContext: string | null;
  preferences: string | null;
  privacyConsentAt: string | null;
} | null;

const inputClass =
  "mt-3 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-muted)]";

export function ServiceProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [role, setRole] = useState(profile?.role ?? "seeker");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [intent, setIntent] = useState(profile?.intent ?? "");
  const [familyContext, setFamilyContext] = useState(
    profile?.familyContext ?? "",
  );
  const [preferences, setPreferences] = useState(profile?.preferences ?? "");
  const [privacyConsent, setPrivacyConsent] = useState(
    Boolean(profile?.privacyConsentAt),
  );
  const [status, setStatus] = useState("Ready to save.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving intake...");
    try {
      const res = await fetch("/api/service/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role,
          location,
          intent: intent || undefined,
          familyContext: familyContext || undefined,
          preferences: preferences || undefined,
          privacyConsent,
        }),
      });
      if (!res.ok) throw new Error(await errorText(res));
      await fetch("/api/service/agents/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: "hafiz" }),
      });
      setStatus("Saved. Hafiz updated the service ledger.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
      onSubmit={(event) => void onSubmit(event)}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Hafiz intake
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-[var(--color-ink-soft)]">
          Role
          <select
            className={inputClass}
            onChange={(event) => setRole(event.target.value)}
            value={role}
          >
            <option value="seeker">Seeker</option>
            <option value="family">Family</option>
          </select>
        </label>
        <label className="text-sm text-[var(--color-ink-soft)]">
          City or region
          <input
            className={inputClass}
            onChange={(event) => setLocation(event.target.value)}
            required
            value={location}
          />
        </label>
      </div>
      <label className="mt-4 block text-sm text-[var(--color-ink-soft)]">
        Intent
        <input
          className={inputClass}
          onChange={(event) => setIntent(event.target.value)}
          value={intent}
        />
      </label>
      <label className="mt-4 block text-sm text-[var(--color-ink-soft)]">
        Family context
        <textarea
          className={inputClass}
          onChange={(event) => setFamilyContext(event.target.value)}
          rows={3}
          value={familyContext}
        />
      </label>
      <label className="mt-4 block text-sm text-[var(--color-ink-soft)]">
        Match preferences
        <textarea
          className={inputClass}
          onChange={(event) => setPreferences(event.target.value)}
          rows={3}
          value={preferences}
        />
      </label>
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        <input
          checked={privacyConsent}
          className="mt-1"
          onChange={(event) => setPrivacyConsent(event.target.checked)}
          required
          type="checkbox"
        />
        I agree Sakinah agents may use this profile state to prepare service
        steps.
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)] disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          Save onboarding
        </button>
        <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>
      </div>
    </form>
  );
}

export function ServiceRunButton({
  agentId,
  children,
}: {
  agentId?: "hafiz" | "watim" | "adil" | "sabr";
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function run() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/service/agents/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(agentId ? { agentId } : {}),
      });
      if (!res.ok) throw new Error(await errorText(res));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <button
      className="min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)] disabled:opacity-60"
      disabled={isSubmitting}
      onClick={() => void run()}
      type="button"
    >
      {children}
    </button>
  );
}

export function MatchResponseButton({
  id,
  response,
  children,
}: {
  id: string;
  response: "request_salaam" | "dismiss";
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function respond() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/service/matches/${id}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error(await errorText(res));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <button
      className="min-h-10 rounded border border-[var(--color-ink)] px-4 text-sm text-[var(--color-ink)] disabled:opacity-60"
      disabled={isSubmitting}
      onClick={() => void respond()}
      type="button"
    >
      {children}
    </button>
  );
}

export function SalaamResponseButton({
  id,
  response,
  children,
}: {
  id: string;
  response: "accept" | "decline";
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function respond() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/service/salaam/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error(await errorText(res));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <button
      className="min-h-10 rounded border border-[var(--color-ink)] px-4 text-sm text-[var(--color-ink)] disabled:opacity-60"
      disabled={isSubmitting}
      onClick={() => void respond()}
      type="button"
    >
      {children}
    </button>
  );
}

export function AuditExportButton() {
  const [status, setStatus] = useState("Ready.");
  async function exportAudit() {
    setStatus("Preparing export...");
    try {
      const res = await fetch("/api/service/audit");
      if (!res.ok) throw new Error(await errorText(res));
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sakinah-audit-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Export downloaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed.");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="min-h-11 rounded border border-[var(--color-ink)] px-5 text-sm text-[var(--color-ink)]"
        onClick={() => void exportAudit()}
        type="button"
      >
        Export service audit
      </button>
      <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>
    </div>
  );
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `request failed (${res.status})`;
  } catch {
    return `request failed (${res.status})`;
  }
}
