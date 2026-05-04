"use client";

import { useState } from "react";
import { getOrCreateDevice } from "@/lib/crypto/keystore";
import { b64decode, b64encode, encryptForDevice } from "@/lib/crypto/messaging";

type RecipientKey = {
  id: string;
  userId: string;
  deviceId: string;
  publicKey: string;
};

// Window event contract for optimistic UI:
//
//   trust-app:optimistic-send  { tempId, text, sentAt }
//   trust-app:optimistic-failed { tempId }
//
// MessageStream listens for these and renders the message immediately
// (with a "sending" affordance until the SSE delivers the real row).

export function Composer({ threadId }: { threadId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const draft = text.trim();
    if (!draft || busy) return;
    setBusy(true);
    setError(null);

    const tempId = `temp-${crypto.randomUUID()}`;
    const sentAt = new Date().toISOString();
    // Optimistic dispatch fires before the network round-trip so the user
    // sees their own message immediately.
    window.dispatchEvent(
      new CustomEvent("trust-app:optimistic-send", {
        detail: { tempId, text: draft, sentAt },
      }),
    );
    setText("");

    try {
      const device = await getOrCreateDevice();
      const r = await fetch(`/api/threads/${threadId}/recipient-keys`);
      if (!r.ok) throw new Error(`recipient-keys ${r.status}`);
      const { keys } = (await r.json()) as { keys: RecipientKey[] };

      if (keys.length === 0) {
        throw new Error("No active device keys to encrypt to.");
      }

      const fanout = keys.map((k) => {
        const { ciphertext, nonce } = encryptForDevice({
          plaintext: draft,
          recipientPublicKey: b64decode(k.publicKey),
          senderSecretKey: device.secretKey,
        });
        return {
          recipientDeviceKeyId: k.id,
          ciphertext: b64encode(ciphertext),
          nonce: b64encode(nonce),
        };
      });

      const send = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fanout }),
      });
      if (!send.ok) throw new Error(`send ${send.status}`);

      // SSE will replace the optimistic entry within ~1.5s on its next
      // server-side poll tick.
    } catch (err) {
      setError(err instanceof Error ? err.message : "send failed");
      setText(draft); // restore draft so the user can retry
      window.dispatchEvent(
        new CustomEvent("trust-app:optimistic-failed", {
          detail: { tempId },
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="mt-8 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write to this thread…"
        rows={3}
        className="block w-full resize-none border border-[var(--color-rule)] bg-transparent px-4 py-3 font-serif text-[1.05rem] outline-none focus:border-[var(--color-ink)]"
      />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 disabled:opacity-50 hover:enabled:bg-[var(--color-accent)]"
        >
          {busy ? "Encrypting…" : "Send"}
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}
