"use client";

import { useEffect, useState } from "react";
import { b64decode } from "@/lib/crypto/messaging";
import { fingerprint } from "@/lib/crypto/keystore";

type PeerKey = {
  id: string;
  userId: string;
  deviceId: string;
  publicKey: string;
};

export function PeerFingerprints({
  threadId,
  myUserId,
}: {
  threadId: string;
  myUserId: string;
}) {
  const [peers, setPeers] = useState<
    Array<{ deviceId: string; fp: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/threads/${threadId}/recipient-keys`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const { keys } = (await r.json()) as { keys: PeerKey[] };
        const peerKeys = keys.filter((k) => k.userId !== myUserId);
        if (cancelled) return;
        setPeers(
          peerKeys.map((k) => ({
            deviceId: k.deviceId,
            fp: fingerprint(b64decode(k.publicKey)),
          })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "fingerprint fetch failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId, myUserId]);

  if (error) {
    return (
      <p className="text-xs text-red-700">
        Couldn&rsquo;t load peer fingerprints: {error}
      </p>
    );
  }

  if (peers.length === 0) {
    return (
      <p className="text-xs text-[var(--color-ink-muted)]">
        No peer devices have published a key yet.
      </p>
    );
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Peer fingerprints ({peers.length})
      </summary>
      <ul className="mt-3 space-y-2">
        {peers.map((p) => (
          <li key={p.deviceId} className="flex flex-col gap-1">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
              {p.deviceId.slice(0, 8)}
            </span>
            <code className="font-mono text-[0.85rem] tracking-wider">
              {p.fp}
            </code>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.7rem] leading-[1.5] text-[var(--color-ink-muted)]">
        Read these aloud to your counterpart over a separate channel
        (phone, in person). If they match what they see on their end, you
        are encrypting to the right person on the right device.
      </p>
    </details>
  );
}
