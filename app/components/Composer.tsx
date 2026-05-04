"use client";

import { useState } from "react";
import { getOrCreateDevice } from "@/lib/crypto/keystore";
import { b64decode, b64encode, encryptForDevice } from "@/lib/crypto/messaging";

type RecipientKey = {
  id: string;
  userId: string;
  deviceId: string;
  publicKey: string; // base64
};

export function Composer({ threadId }: { threadId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const device = await getOrCreateDevice();
      const r = await fetch(`/api/threads/${threadId}/recipient-keys`);
      if (!r.ok) throw new Error(`recipient-keys ${r.status}`);
      const { keys } = (await r.json()) as { keys: RecipientKey[] };

      if (keys.length === 0) {
        setError("No active device keys to encrypt to.");
        return;
      }

      const fanout = await Promise.all(
        keys.map(async (k) => {
          const { ciphertext, nonce } = encryptForDevice({
            plaintext: text,
            recipientPublicKey: b64decode(k.publicKey),
            senderSecretKey: device.secretKey,
          });
          return {
            recipientDeviceKeyId: k.id,
            ciphertext: b64encode(ciphertext),
            nonce: b64encode(nonce),
          };
        }),
      );

      const send = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fanout }),
      });
      if (!send.ok) throw new Error(`send ${send.status}`);

      setText("");
      // Tell the stream to refetch.
      window.dispatchEvent(new CustomEvent("trust-app:thread-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "send failed");
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
        {error && (
          <span className="text-xs text-red-700">{error}</span>
        )}
      </div>
    </form>
  );
}
