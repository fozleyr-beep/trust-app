"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateDevice } from "@/lib/crypto/keystore";
import { b64decode, decryptFromSender } from "@/lib/crypto/messaging";

type ServerMsg = {
  id: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  sentAt: string;
};

type SenderKey = {
  id: string;
  userId: string;
  publicKey: string; // base64
};

type RenderedMsg = {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
};

export function MessageStream({
  threadId,
  myUserId,
}: {
  threadId: string;
  myUserId: string;
}) {
  const [msgs, setMsgs] = useState<RenderedMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sinceRef = useRef<string>(new Date(0).toISOString());
  const senderKeyCache = useRef<Map<string, Uint8Array>>(new Map());

  const fetchSenderKeys = useCallback(async (userIds: string[]) => {
    const need = userIds.filter((u) => !senderKeyCache.current.has(u));
    if (need.length === 0) return;
    const r = await fetch("/api/sender-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userIds: need }),
    });
    if (!r.ok) return;
    const { keys } = (await r.json()) as { keys: SenderKey[] };
    // For each user, cache the FIRST returned active pubkey. PR-05 will let
    // the client try multiple sender devices when the first decrypt fails.
    for (const k of keys) {
      if (!senderKeyCache.current.has(k.userId)) {
        senderKeyCache.current.set(k.userId, b64decode(k.publicKey));
      }
    }
  }, []);

  const tick = useCallback(async () => {
    try {
      const device = await getOrCreateDevice();
      const url = `/api/threads/${threadId}/messages?since=${encodeURIComponent(sinceRef.current)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch ${r.status}`);
      const { messages } = (await r.json()) as { messages: ServerMsg[] };
      if (messages.length === 0) return;

      const senders = Array.from(new Set(messages.map((m) => m.senderId)));
      await fetchSenderKeys(senders);

      const decoded: RenderedMsg[] = [];
      for (const m of messages) {
        const senderPub = senderKeyCache.current.get(m.senderId);
        if (!senderPub) continue;
        try {
          const text = decryptFromSender({
            ciphertext: b64decode(m.ciphertext),
            nonce: b64decode(m.nonce),
            senderPublicKey: senderPub,
            recipientSecretKey: device.secretKey,
          });
          decoded.push({
            id: m.id,
            senderId: m.senderId,
            text,
            sentAt: m.sentAt,
          });
        } catch {
          // sender may have rotated keys — skip; PR-05 retries with all
          // candidate sender devices.
        }
      }

      if (decoded.length > 0) {
        sinceRef.current = decoded[decoded.length - 1].sentAt;
        setMsgs((prev) => [...prev, ...decoded]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "stream error");
    }
  }, [threadId, fetchSenderKeys]);

  useEffect(() => {
    void tick();
    const t = setInterval(() => void tick(), 4000);
    const onRefresh = () => void tick();
    window.addEventListener("trust-app:thread-refresh", onRefresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("trust-app:thread-refresh", onRefresh);
    };
  }, [tick]);

  return (
    <div className="mt-8">
      {error && (
        <p className="mb-4 text-xs text-red-700">stream: {error}</p>
      )}
      {msgs.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No messages yet for this device.
        </p>
      ) : (
        <ul className="space-y-5">
          {msgs.map((m) => {
            const mine = m.senderId === myUserId;
            return (
              <li
                key={m.id}
                className={mine ? "text-right" : "text-left"}
              >
                <p
                  className={
                    "inline-block max-w-[42ch] whitespace-pre-wrap rounded px-4 py-2 text-[1.02rem] " +
                    (mine
                      ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                      : "bg-[color-mix(in_srgb,var(--color-rule)_60%,transparent)] text-[var(--color-ink)]")
                  }
                >
                  {m.text}
                </p>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                  {new Date(m.sentAt).toLocaleTimeString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
