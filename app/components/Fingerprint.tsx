"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateDevice, fingerprint } from "@/lib/crypto/keystore";

export function MyFingerprint({ className }: { className?: string }) {
  const [fp, setFp] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void getOrCreateDevice().then((d) => setFp(fingerprint(d.publicKey)));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("trust-app:device-rotated", refresh);
    return () =>
      window.removeEventListener("trust-app:device-rotated", refresh);
  }, [refresh]);

  return (
    <code
      className={
        "font-mono text-[0.85rem] tracking-wider text-[var(--color-ink)] " +
        (className ?? "")
      }
    >
      {fp ?? "…"}
    </code>
  );
}
