"use client";

import { useState } from "react";
import { getOrCreateDevice } from "@/lib/crypto/keystore";
import { b64decode, decryptFromSender } from "@/lib/crypto/messaging";

type ServerMsg = {
  id: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  sentAt: string;
};

type ThreadMeta = {
  id: string;
  createdAt: string;
};

// Pulls every thread, every message addressed to this device, decrypts
// locally, and downloads as JSON. The server cannot produce this — only
// this device can, because only this device holds the secret key.

export function ExportButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      const device = await getOrCreateDevice();

      const threadsRes = await fetch("/api/me/threads");
      if (!threadsRes.ok) throw new Error(`threads ${threadsRes.status}`);
      const { threads } = (await threadsRes.json()) as {
        threads: ThreadMeta[];
      };

      const senderKeyCache = new Map<string, Uint8Array>();
      const out: Array<{
        threadId: string;
        createdAt: string;
        messages: Array<{
          id: string;
          senderId: string;
          sentAt: string;
          text: string | null;
        }>;
      }> = [];

      for (const t of threads) {
        const r = await fetch(`/api/threads/${t.id}/messages`);
        if (!r.ok) continue;
        const { messages } = (await r.json()) as { messages: ServerMsg[] };

        const need = Array.from(
          new Set(messages.map((m) => m.senderId)),
        ).filter((u) => !senderKeyCache.has(u));
        if (need.length > 0) {
          const sk = await fetch("/api/sender-keys", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ userIds: need }),
          });
          if (sk.ok) {
            const { keys } = (await sk.json()) as {
              keys: Array<{ userId: string; publicKey: string }>;
            };
            for (const k of keys) {
              if (!senderKeyCache.has(k.userId)) {
                senderKeyCache.set(k.userId, b64decode(k.publicKey));
              }
            }
          }
        }

        const decoded = messages.map((m) => {
          const senderPub = senderKeyCache.get(m.senderId);
          let text: string | null = null;
          if (senderPub) {
            try {
              text = decryptFromSender({
                ciphertext: b64decode(m.ciphertext),
                nonce: b64decode(m.nonce),
                senderPublicKey: senderPub,
                recipientSecretKey: device.secretKey,
              });
            } catch {
              text = null;
            }
          }
          return {
            id: m.id,
            senderId: m.senderId,
            sentAt: m.sentAt,
            text,
          };
        });

        out.push({
          threadId: t.id,
          createdAt: t.createdAt,
          messages: decoded,
        });
      }

      const blob = new Blob([JSON.stringify(out, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trust-app-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={busy}
        className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 disabled:opacity-50 hover:enabled:bg-[var(--color-accent)]"
      >
        {busy ? "Exporting…" : "Export plaintext history"}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
