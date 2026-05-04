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
  state: "sending" | "delivered" | "failed";
};

// Real-time message stream via Server-Sent Events.
// Browser EventSource handles reconnection with Last-Event-ID, so transient
// network drops resume from the last delivered message without missing or
// duplicating.
//
// Optimistic UI: <Composer> dispatches `trust-app:optimistic-send` with
// {tempId, text, sentAt} immediately on click. We render that as
// state="sending" so the user sees it instantly. When the SSE delivery for
// the real row arrives, we match by sender + plaintext and replace the
// optimistic entry with the canonical row.

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

      setMsgs((prev) => {
        // If this is one of our own sends arriving back, replace the
        // earliest matching optimistic entry instead of duplicating.
        if (m.senderId === myUserId) {
          const idx = prev.findIndex(
            (x) =>
              x.state === "sending" &&
              x.senderId === myUserId &&
              x.text === text,
          );
          if (idx !== -1) {
            const next = prev.slice();
            next[idx] = {
              id: m.id,
              senderId: m.senderId,
              text,
              sentAt: m.sentAt,
              state: "delivered",
            };
            return next;
          }
        }
        return [
          ...prev,
          {
            id: m.id,
            senderId: m.senderId,
            text,
            sentAt: m.sentAt,
            state: "delivered",
          },
        ];
      });
    },
    [fetchSenderKeys, decryptOne, myUserId],
  );

  // Cursor for "what's the latest message we've already shown." Used on
  // first load to avoid re-fetching history we already have, and as the
  // ?since= for the initial SSE connection. Resets per threadId.
  const sinceRef = useRef<string>(new Date(0).toISOString());

  // Optimistic UI events from <Composer>
  useEffect(() => {
    const onOptimisticSend = (e: Event) => {
      const detail = (e as CustomEvent<{
        tempId: string;
        text: string;
        sentAt: string;
      }>).detail;
      setMsgs((prev) => [
        ...prev,
        {
          id: detail.tempId,
          senderId: myUserId,
          text: detail.text,
          sentAt: detail.sentAt,
          state: "sending",
        },
      ]);
    };
    const onOptimisticFailed = (e: Event) => {
      const { tempId } = (e as CustomEvent<{ tempId: string }>).detail;
      setMsgs((prev) =>
        prev.map((x) =>
          x.id === tempId ? { ...x, state: "failed" } : x,
        ),
      );
    };
    window.addEventListener("trust-app:optimistic-send", onOptimisticSend);
    window.addEventListener(
      "trust-app:optimistic-failed",
      onOptimisticFailed,
    );
    return () => {
      window.removeEventListener(
        "trust-app:optimistic-send",
        onOptimisticSend,
      );
      window.removeEventListener(
        "trust-app:optimistic-failed",
        onOptimisticFailed,
      );
    };
  }, [myUserId]);

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
    // show. The since-cursor means no messages are lost.
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
      <div className="mb-4 flex h-4 items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        {connState === "open" ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>live</span>
          </>
        ) : connState === "connecting" ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <span>reconnecting…</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
            <span>paused</span>
          </>
        )}
      </div>

      {msgs.length === 0 && connState === "open" ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No messages yet for this device.
        </p>
      ) : (
        <ul className="space-y-5">
          {msgs.map((m) => {
            const mine = m.senderId === myUserId;
            const failed = m.state === "failed";
            const sending = m.state === "sending";
            return (
              <li key={m.id} className={mine ? "text-right" : "text-left"}>
                <p
                  className={
                    "inline-block max-w-[42ch] whitespace-pre-wrap rounded px-4 py-2 text-[1.02rem] " +
                    (mine
                      ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                      : "bg-[color-mix(in_srgb,var(--color-rule)_60%,transparent)] text-[var(--color-ink)]") +
                    (sending ? " opacity-60" : "") +
                    (failed
                      ? " border border-red-700 bg-red-900 text-[var(--color-paper)]"
                      : "")
                  }
                >
                  {m.text}
                </p>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                  {sending
                    ? "sending…"
                    : failed
                      ? "send failed"
                      : new Date(m.sentAt).toLocaleTimeString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
