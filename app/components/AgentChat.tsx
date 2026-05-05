"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function AgentChat() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || streaming) return;
    setError(null);

    const userMsg: Msg = { role: "user", content: draft };
    const next: Msg[] = [...history, userMsg];
    setHistory(next);
    setDraft("");
    setStreaming(true);

    abortRef.current = new AbortController();
    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: abortRef.current.signal,
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setHistory((h) => [...h, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setHistory((h) => {
          const copy = h.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "stream failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="mt-8">
      {history.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Ask the assistant anything. It cannot read your encrypted messages
          with other people.
        </p>
      ) : (
        <ul className="space-y-5">
          {history.map((m, i) => (
            <li
              key={i}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <p
                className={
                  "inline-block max-w-[52ch] whitespace-pre-wrap rounded px-4 py-2 text-[1.02rem] " +
                  (m.role === "user"
                    ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                    : "bg-[color-mix(in_srgb,var(--color-rule)_60%,transparent)] text-[var(--color-ink)]")
                }
              >
                {m.content || (m.role === "assistant" && streaming ? "…" : "")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSend} className="mt-8 space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the assistant…"
          rows={3}
          disabled={streaming}
          className="block w-full resize-none border border-[var(--color-rule)] bg-transparent px-4 py-3 font-serif text-[1.05rem] outline-none focus:border-[var(--color-ink)] disabled:opacity-60"
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={streaming || !draft.trim()}
            className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 disabled:opacity-50 hover:enabled:bg-[var(--color-ink-soft)]"
          >
            {streaming ? "Thinking…" : "Send"}
          </button>
          {error && <span className="text-xs text-red-700">{error}</span>}
        </div>
      </form>
    </div>
  );
}
