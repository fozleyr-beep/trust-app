"use client";

import { useEffect, useState } from "react";
import { getOrCreateDevice, fingerprint } from "@/lib/crypto/keystore";

export function MyFingerprint({ className }: { className?: string }) {
  const [fp, setFp] = useState<string | null>(null);
  useEffect(() => {
    void getOrCreateDevice().then((d) => setFp(fingerprint(d.publicKey)));
  }, []);
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
