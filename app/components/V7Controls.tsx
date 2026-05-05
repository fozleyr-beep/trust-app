"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const fieldClass =
  "mt-2 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-muted)]";

export function VoiceIntakeRecorder() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Ready for a six-minute voice intake.");

  useEffect(() => {
    setSupported("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }, []);

  function start() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Speech recognition is not available in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang === "ar" ? "ar" : "en-US";
    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening. Watim is drafting only after you approve.");
    };
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setTranscript(text.trim());
    };
    recognition.onend = () => {
      setListening(false);
      setStatus("Stopped. Review before publishing any profile layer.");
    };
    recognition.start();
  }

  return (
    <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Watim voice intake
      </p>
      <div className="mt-5 h-16 overflow-hidden rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)]">
        <div
          className={[
            "h-full w-full bg-[repeating-linear-gradient(90deg,var(--color-accent)_0_2px,transparent_2px_14px)] opacity-40",
            listening ? "motion-safe:animate-[sakinah-pulse-hairline_1.2s_ease-in-out_infinite]" : "",
          ].join(" ")}
        />
      </div>
      <textarea
        className={fieldClass}
        onChange={(event) => setTranscript(event.target.value)}
        placeholder="Live transcript appears here; paste manually if your browser blocks speech recognition."
        rows={5}
        value={transcript}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)] disabled:opacity-50"
          disabled={!supported || listening}
          onClick={start}
          type="button"
        >
          Start voice intake
        </button>
        <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--color-ink-muted)]">
        Voice storage is launch-gated: recordings must purge within 24h through
        Vercel Cron before this can accept uploaded audio.
      </p>
    </section>
  );
}

export function ProfileLayerEditor({
  initial,
}: {
  initial: {
    layerPublic?: unknown;
    layerGated?: unknown;
    layerFamily?: unknown;
  };
}) {
  const router = useRouter();
  const [publicLayer, setPublicLayer] = useState(toPretty(initial.layerPublic));
  const [gatedLayer, setGatedLayer] = useState(toPretty(initial.layerGated));
  const [familyLayer, setFamilyLayer] = useState(toPretty(initial.layerFamily));
  const [status, setStatus] = useState("Ready.");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving layers...");
    const res = await fetch("/api/profile/layers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        layerPublic: parseLayer(publicLayer),
        layerGated: parseLayer(gatedLayer),
        layerFamily: parseLayer(familyLayer),
      }),
    });
    if (!res.ok) {
      setStatus("Layer save failed.");
      return;
    }
    setStatus("Saved. Match-eye preview updated.");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void save(event)}>
      <LayerTextarea
        label="Public layer"
        onChange={setPublicLayer}
        value={publicLayer}
      />
      <LayerTextarea
        label="Gated layer"
        onChange={setGatedLayer}
        value={gatedLayer}
      />
      <LayerTextarea
        label="Family layer"
        onChange={setFamilyLayer}
        value={familyLayer}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button className="min-h-11 rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)]">
          Save profile layers
        </button>
        <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>
      </div>
    </form>
  );
}

export function InviteLovedOneFlow() {
  const [step, setStep] = useState(0);
  const labels = ["Choose", "Explain", "Send"];
  return (
    <section className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
      <div className="grid gap-2 md:grid-cols-3">
        {labels.map((label, index) => (
          <button
            className={[
              "rounded border px-4 py-3 text-left text-sm",
              step === index
                ? "border-[var(--color-ink)] bg-[var(--color-paper-soft)]"
                : "border-[var(--color-rule)]",
            ].join(" ")}
            key={label}
            onClick={() => setStep(index)}
            type="button"
          >
            <span className="font-mono text-[0.62rem] text-[var(--color-ink-faint)]">
              0{index + 1}
            </span>
            <span className="mt-1 block font-serif text-[1.2rem]">{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {step === 0 && <InviteField label="Loved one's email or phone" />}
        {step === 1 && (
          <InviteField
            label="Message preview"
            textarea
            value="I would like you to witness my Sakinah process. You can observe boundaries, but you cannot post or approve on my behalf."
          />
        )}
        {step === 2 && (
          <div className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]">
            Invite expires silently after 30 days. No referral rewards. No
            funnel telemetry back to the sender.
          </div>
        )}
      </div>
    </section>
  );
}

export function AgentPermissionToggles() {
  const rows = [
    ["Hafiz may write verification state", true],
    ["Watim may draft match reasons", false],
    ["Adil may open rooms after mutual salaam", true],
    ["Sabr may pause unsafe flows", true],
    ["Agents may read encrypted room plaintext", true],
  ] as const;
  return (
    <div className="grid gap-3">
      {rows.map(([label, locked]) => (
        <label
          className={[
            "flex items-center justify-between gap-4 rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-sm",
            locked ? "opacity-60" : "",
          ].join(" ")}
          key={label}
        >
          <span>
            {label}
            {locked && (
              <span className="ml-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                enforced · cannot disable
              </span>
            )}
          </span>
          <input checked={!label.includes("plaintext")} disabled={locked} readOnly type="checkbox" />
        </label>
      ))}
    </div>
  );
}

export function AuditFilter({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState("all");
  return (
    <section>
      <label className="block max-w-xs text-sm text-[var(--color-ink-soft)]">
        Filter by agent
        <select
          className={fieldClass}
          onChange={(event) => setAgent(event.target.value)}
          value={agent}
        >
          <option value="all">All</option>
          <option value="hafiz">Hafiz</option>
          <option value="watim">Watim</option>
          <option value="adil">Adil</option>
          <option value="sabr">Sabr</option>
        </select>
      </label>
      <div className="mt-5" data-agent-filter={agent}>
        {children}
      </div>
    </section>
  );
}

function LayerTextarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm text-[var(--color-ink-soft)]">
      {label}
      <textarea
        className={fieldClass}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        value={value}
      />
    </label>
  );
}

function InviteField({
  label,
  textarea = false,
  value = "",
}: {
  label: string;
  textarea?: boolean;
  value?: string;
}) {
  return (
    <label className="block text-sm text-[var(--color-ink-soft)]">
      {label}
      {textarea ? (
        <textarea className={fieldClass} defaultValue={value} rows={4} />
      ) : (
        <input className={fieldClass} />
      )}
    </label>
  );
}

function parseLayer(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : { note: value };
  } catch {
    return { note: value };
  }
}

function toPretty(value: unknown): string {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify({ note: "" }, null, 2);
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}
