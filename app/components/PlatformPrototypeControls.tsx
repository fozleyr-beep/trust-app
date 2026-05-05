"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

const flowSteps = [
  {
    title: "Landing",
    route: "/" as Route,
    agent: "Sakinah",
    screen: "Trust-first promise",
    body: "A quiet public entry that explains the covenant before asking for an account.",
  },
  {
    title: "Onboarding",
    route: "/app/onboarding" as Route,
    agent: "Hafiz",
    screen: "Consented intake",
    body: "Profile, location, intent, family context, and privacy consent become service state.",
  },
  {
    title: "Discovery",
    route: "/app/discovery" as Route,
    agent: "Watim",
    screen: "Bounded preferences",
    body: "Hard gates are explicit; soft preferences guide three considered suggestions.",
  },
  {
    title: "Salaam",
    route: "/app/salaam" as Route,
    agent: "Adil",
    screen: "Mutual consent",
    body: "Interest becomes a salaam request. The room stays closed until both sides accept.",
  },
  {
    title: "Thread",
    route: "/app/threads" as Route,
    agent: "Adil",
    screen: "Encrypted room",
    body: "Conversation moves into encrypted rooms. Observers can witness but cannot post.",
  },
] as const;

const sectOptions = ["Sunni", "Shia", "Just Muslim"];
const regionOptions = ["Same city", "Same country", "Global diaspora"];
const values = ["practicing", "family-aware", "career-compatible", "relocation-open"];

export function MobileFlowPrototype() {
  const [index, setIndex] = useState(0);
  const step = flowSteps[index];
  return (
    <section className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="mx-auto w-full max-w-[22rem] rounded-[2rem] border border-[var(--color-ink)] bg-[var(--color-ink)] p-3">
        <div className="min-h-[37rem] rounded-[1.5rem] bg-[var(--color-paper)] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            {index + 1} of {flowSteps.length} · {step.agent}
          </p>
          <h2 className="mt-8 font-serif text-[2.25rem] leading-none">
            {step.screen}
          </h2>
          <p className="mt-5 text-sm leading-6 text-[var(--color-ink-soft)]">
            {step.body}
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                primary action
              </p>
              <p className="mt-3 font-serif text-[1.2rem]">{step.title}</p>
            </div>
            <div className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-4">
              <p className="text-xs leading-5 text-[var(--color-ink-muted)]">
                This prototype is deliberately linear: no browse rabbit hole,
                no staff handoff, no hidden review queue.
              </p>
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            <button
              className="min-h-11 flex-1 rounded border border-[var(--color-rule)] text-sm disabled:opacity-40"
              disabled={index === 0}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              Back
            </button>
            <button
              className="min-h-11 flex-1 rounded bg-[var(--color-ink)] text-sm text-[var(--color-paper)] disabled:opacity-40"
              disabled={index === flowSteps.length - 1}
              onClick={() =>
                setIndex((current) =>
                  Math.min(flowSteps.length - 1, current + 1),
                )
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid content-start gap-3">
        {flowSteps.map((item, itemIndex) => (
          <button
            className={[
              "rounded border p-4 text-left",
              itemIndex === index
                ? "border-[var(--color-ink)] bg-[var(--color-surface)]"
                : "border-[var(--color-rule)] bg-[var(--color-paper-soft)]",
            ].join(" ")}
            key={item.title}
            onClick={() => setIndex(itemIndex)}
            type="button"
          >
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {item.agent}
            </p>
            <h3 className="mt-2 font-serif text-[1.35rem] leading-tight">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              {item.body}
            </p>
          </button>
        ))}
        <Link
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded bg-[var(--color-ink)] px-5 text-sm text-[var(--color-paper)]"
          href={step.route}
        >
          Open live route
        </Link>
      </div>
    </section>
  );
}

export function DiscoveryFilterWorkbench() {
  const [sect, setSect] = useState(sectOptions[0]);
  const [region, setRegion] = useState(regionOptions[0]);
  const [wali, setWali] = useState(true);
  const [selectedValues, setSelectedValues] = useState([values[0], values[1]]);

  const score = useMemo(() => {
    let base = 43;
    if (sect !== "Just Muslim") base -= 11;
    if (region === "Same city") base -= 17;
    if (wali) base -= 5;
    base -= selectedValues.length * 3;
    return Math.max(3, base);
  }, [region, sect, selectedValues.length, wali]);

  function toggleValue(value: string) {
    setSelectedValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          hard gates
        </p>
        <div className="mt-5 grid gap-4">
          <label className="text-sm text-[var(--color-ink-soft)]">
            Religious fit
            <select
              className="mt-2 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm"
              onChange={(event) => setSect(event.target.value)}
              value={sect}
            >
              {sectOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[var(--color-ink-soft)]">
            Geography
            <select
              className="mt-2 w-full rounded border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-sm"
              onChange={(event) => setRegion(event.target.value)}
              value={region}
            >
              {regionOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            <input
              checked={wali}
              className="mt-1"
              onChange={(event) => setWali(event.target.checked)}
              type="checkbox"
            />
            Show profiles that support family observer context.
          </label>
        </div>
      </div>

      <div className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-soft)] p-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          soft preferences
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              className={[
                "min-h-10 rounded border px-4 text-sm",
                selectedValues.includes(value)
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-rule)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]",
              ].join(" ")}
              key={value}
              onClick={() => toggleValue(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ResultMetric label="Eligible pool" value={String(score)} />
          <ResultMetric label="Shown weekly" value={String(Math.min(3, score))} />
          <ResultMetric label="Hidden" value={String(Math.max(0, 43 - score))} />
        </div>
        <p className="mt-5 text-sm leading-6 text-[var(--color-ink-soft)]">
          Sakinah&apos;s answer to filters: hard gates protect values and safety;
          soft preferences guide Watim without turning the product into
          infinite search.
        </p>
      </div>
    </section>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-[1.8rem] leading-none">{value}</p>
    </div>
  );
}
