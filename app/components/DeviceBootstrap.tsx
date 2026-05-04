"use client";

import { useEffect, useState } from "react";
import { getOrCreateDevice } from "@/lib/crypto/keystore";
import { b64encode } from "@/lib/crypto/messaging";

// Mounted at /app shell. On first render: ensures a libsodium keypair exists
// in IndexedDB, registers its public key with the server, and stays out of
// the way thereafter.

export function DeviceBootstrap() {
  const [state, setState] = useState<"idle" | "ready" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const device = await getOrCreateDevice();
        // Idempotent: server upserts/rotates by (userId, deviceId).
        const res = await fetch("/api/device-keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deviceId: device.deviceId,
            publicKey: b64encode(device.publicKey),
          }),
        });
        if (!cancelled) setState(res.ok ? "ready" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "error") {
    return (
      <p className="fixed bottom-4 right-4 rounded bg-red-50 px-3 py-2 text-xs text-red-900 shadow">
        Couldn&rsquo;t register this device. Messaging will be read-only.
      </p>
    );
  }
  return null;
}
