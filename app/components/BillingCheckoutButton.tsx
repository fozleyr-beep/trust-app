"use client";

import { useState } from "react";

type BillingState = "idle" | "loading" | "blocked" | "error";

export function BillingCheckoutButton() {
  const [state, setState] = useState<BillingState>("idle");
  const [detail, setDetail] = useState("");

  async function startCheckout() {
    setState("loading");
    setDetail("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setState(res.status === 501 ? "blocked" : "error");
    setDetail(data.error ?? "Checkout is unavailable.");
  }

  return (
    <div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)] disabled:opacity-60"
        disabled={state === "loading"}
        onClick={startCheckout}
        type="button"
      >
        {state === "loading" ? "Opening checkout..." : "Open self-serve checkout"}
      </button>
      {(state === "blocked" || state === "error") && (
        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-ink-muted)]">
          {detail}
        </p>
      )}
    </div>
  );
}
