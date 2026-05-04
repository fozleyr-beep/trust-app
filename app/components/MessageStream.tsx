"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllSecretKeys, getOrCreateDevice } from "@/lib/crypto/keystore";
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
  publicKey: string;
};

type RenderedMsg = {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
};

// Real-time message stream via Server-Sent Events.
// Replaces the prior 4-second polling design. The browser's EventSource
// handles reconnection with Last-Event-ID, so transient network drops
// resume from the last delivered message without missing or duplicating.

export function MessageStream({
  threadId,
  myUserId,
}: {
  threadId: string;
  myUserId: string;
}) {
  const [msgs, setMsgs] = useState<RenderedMsg[]>([]);
  const [connState, setConnState] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );

  const seenIdsRef = useRef<Set<string>>(new Set());
  const senderKeyCacheRef = useRef<Map<string, Uint8Array>>(new Map());
  const secretKeysRef = useRef<Uint8Array[]>([]);

  const fetchSenderKeys = useCallback(async (userIds: string[]) => {
    const need = userIds.filter((u) => !senderKeyCacheRef.current.has(u));
    if (need.length === 0) return;
    const r = await fetch("/api/sender-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userIds: need }),
    });
    if (!r.ok) return;
    const { keys } = (await r.json()) as { keys: SenderKey[] };
    for (const k of keys) {
      if (!senderKeyCacheRef.current.has(k.userId)) {
        senderKeyCacheRef.current.set(k.userId, b64decode(k.publicKey));
      }
    }
  }, []);

  const decryptOne = useCallback(
    (m: ServerMsg, senderPub: Uint8Array): string | null => {
      for (const sk of secretKeysRef.current) {
        try {
          return decryptFromSender({
            ciphertext: b64decode(m.ciphertext),
            nonce: b64decode(m.nonce),
            senderPublicKey: senderPub,
            recipientSecretKey: sk,
          });
        } catch {
          // wrong key generation — try next
        }
      }
      return null;
    },
    [],
  );

  const handleServerMsg = useCallback(
    async (m: ServerMsg) => {
      if (seenIdsRef.current.has(m.id)) return;
      seenIdsRef.current.add(m.id);

      if (!senderKeyCacheRef.current.has(m.senderId)) {
        await fetchSenderKeys([m.senderId]);
      }
      const senderPub = senderKeyCacheRef.current.get(m.senderId);
      if (!senderPub) return;

      const text = decryptOne(m, senderPub);
      if (text === null) return;

      setMsgs((prev) => [
        ...prev,
        { id: m.id, senderId: m.senderId, text, sentAt: m.sentAt },
      ]);
    },
    [fetchSenderKeys, decryptOne],
  );

  // Cursor for "what's the latest message we've already shown." Used on
  // first load to avoid re-fetching history we already have, and as the
  // ?since= for the initial SSE connection. Resets per threadId.
  const sinceRef = useRef<string>(new Date(0).toISOString());

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;

    const open = () => {
      if (cancelled || es) return;
      const url =
        `/api/threads/${threadId}/stream` +
        `?since=${encodeURIComponent(sinceRef.current)}`;
      es = new EventSource(url);
      es.addEventListener("open", () => {
        if (!cancelled) setConnState("open");
      });
      es.addEventListener("error", () => {
        if (!cancelled) setConnState("connecting");
      });
      es.addEventListener("message", (ev) => {
        try {
          const m = JSON.parse((ev as MessageEvent<string>).data) as ServerMsg;
          if (m.sentAt > sinceRef.current) sinceRef.current = m.sentAt;
          void handleServerMsg(m);
        } catch {
          // malformed, drop
        }
      });
    };

    const close = () => {
      es?.close();
      es = null;
      if (!cancelled) setConnState("closed");
    };

    // Pause the stream when the tab is hidden — saves a server-side DB
    // poll every 1.5s for every backgrounded thread tab. EventSource has
    // no built-in way to do this, so we tear down on hide and rebuild on
    // show. The since-cursor below means no messages are lost.
    const onVisibility = () => {
      if (document.visibilityState === "visible") open();
      else close();
    };

    (async () => {
      await getOrCreateDevice();
      secretKeysRef.current = await getAllSecretKeys();
      if (cancelled) return;

      // Load full history once before opening the stream — otherwise a
      // user reloading a thread page would only see new messages.
      try {
        const r = await fetch(
          `/api/threads/${threadId}/messages?since=${encodeURIComponent(
            new Date(0).toISOString(),
          )}`,
        );
        if (r.ok) {
          const { messages } = (await r.json()) as { messages: ServerMsg[] };
          for (const m of messages) {
            if (m.sentAt > sinceRef.current) sinceRef.current = m.sentAt;
            await handleServerMsg(m);
          }
        }
      } catch {
        // history fetch failed; SSE will still deliver new messages.
      }

      if (cancelled) return;
      if (document.visibilityState === "visible") open();
      document.addEventListener("visibilitychange", onVisibility);
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      close();
    };
  }, [threadId, handleServerMsg]);

  return (
    <div className="mt-8">
      {connState === "connecting" && msgs.length === 0 && (
        <p className="text-xs text-[var(--color-ink-muted)]">connecting…</p>
      )}
      {msgs.length === 0 && connState === "open" ? (
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
