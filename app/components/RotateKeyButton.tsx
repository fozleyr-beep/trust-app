"use client";

import { useState } from "react";
import { rotateDevice } from "@/lib/crypto/keystore";
import { b64encode } from "@/lib/crypto/messaging";

// Generates a fresh keypair, registers it server-side (which revokes the
// prior pubkey for this deviceId), and keeps the old secret keys locally so
// past messages remain readable.
//
// After rotation: outgoing messages encrypt with the new key. Incoming
// messages encrypted to the old pubkey continue to decrypt because we still
// hold the old secret. Anyone trying to encrypt to the old pubkey from now
// on will be turned away — /api/threads/[id]/recipient-keys filters on
// revokedAt is null.

export function RotateKeyButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleRotate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const newDevice = await rotateDevice();
      const res = await fetch("/api/device-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceId: newDevice.deviceId,
          publicKey: b64encode(newDevice.publicKey),
        }),
      });
      if (!res.ok) throw new Error(`register ${res.status}`);
      // Notify components that show device data (Fingerprint, MessageStream).
      window.dispatchEvent(new CustomEvent("trust-app:device-rotated"));
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "rotation failed");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-ink)] border border-[var(--color-ink)] px-5 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
      >
        Rotate this device&rsquo;s key
      </button>
    );
  }

  return (
    <div className="rounded border border-[var(--color-rule)] bg-[color-mix(in_srgb,var(--color-rule)_30%,transparent)] p-5">
      <p className="text-sm text-[var(--color-ink)]">
        Rotating generates a new keypair and tells the server to revoke the
        old one for this device. After rotation:
      </p>
      <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--color-ink-soft)]">
        <li>New messages encrypt to the new key.</li>
        <li>You can still decrypt past messages on this device.</li>
        <li>Other devices will need your new fingerprint to verify you.</li>
      </ul>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleRotate}
          disabled={busy}
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 disabled:opacity-50 hover:enabled:bg-[var(--color-ink-soft)]"
        >
          {busy ? "Rotating…" : "Confirm rotation"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)] px-3 py-3 disabled:opacity-50 hover:text-[var(--color-ink)]"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  );
}
