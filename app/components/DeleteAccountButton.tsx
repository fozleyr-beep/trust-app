"use client";

import { useState } from "react";
import { clearAllDevices } from "@/lib/crypto/keystore";

export function DeleteAccountButton() {
  const [stage, setStage] = useState<"idle" | "confirm" | "busy">("idle");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" exactly to confirm.');
      return;
    }
    setStage("busy");
    setError(null);
    try {
      const r = await fetch("/api/me/delete", { method: "POST" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      }
      // Wipe local crypto state — Clerk session is already gone server-side.
      await clearAllDevices().catch(() => {});
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "delete failed");
      setStage("confirm");
    }
  }

  if (stage === "idle") {
    return (
      <button
        onClick={() => setStage("confirm")}
        className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-red-900 border border-red-900 px-5 py-3 hover:bg-red-900 hover:text-[var(--color-paper)]"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded border border-red-900 bg-red-50/50 p-5">
      <p className="text-sm text-[var(--color-ink)]">
        This is irreversible. We will:
      </p>
      <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--color-ink-soft)]">
        <li>Mark your account deleted in our database.</li>
        <li>Revoke every device key you have registered.</li>
        <li>Hard-delete your account from Clerk (auth provider).</li>
      </ul>
      <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
        Past messages you sent stay readable to their recipients (we never
        held the keys to remove them). Threads you participate in remain
        for the other members.
      </p>

      <label className="mt-5 block">
        <span className="block font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Type DELETE to confirm
        </span>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          disabled={stage === "busy"}
          className="mt-2 block w-full border-b border-red-900 bg-transparent py-2 text-[1rem] outline-none focus:border-red-950 disabled:opacity-50"
        />
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleDelete}
          disabled={stage === "busy" || confirmText !== "DELETE"}
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-red-900 px-5 py-3 disabled:opacity-50 hover:enabled:bg-red-950"
        >
          {stage === "busy" ? "Deleting…" : "Delete forever"}
        </button>
        <button
          onClick={() => {
            setStage("idle");
            setConfirmText("");
            setError(null);
          }}
          disabled={stage === "busy"}
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)] px-3 py-3 disabled:opacity-50 hover:text-[var(--color-ink)]"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  );
}
