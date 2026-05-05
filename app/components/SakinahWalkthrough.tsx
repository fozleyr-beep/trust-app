"use client";

import { useEffect, useMemo, useState } from "react";

const DURATION = 30;

const beats = [
  { label: "Title", start: 0 },
  { label: "Discovery", start: 3 },
  { label: "Salaam", start: 9 },
  { label: "Thread", start: 14 },
  { label: "Handoff", start: 22 },
  { label: "Close", start: 27 },
] as const;

type Person = {
  name: string;
  age: number;
  city: string;
  delay: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function segment(time: number, start: number, end: number) {
  return clamp((time - start) / (end - start));
}

function fade(time: number, start: number, end: number) {
  const intro = start <= 0 ? 1 : clamp((time - start) / 0.4);
  const outro = clamp((end - time) / 0.5);
  return Math.min(intro, outro);
}

function Silhouette({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={small ? "h-14 w-14" : "h-32 w-32"}
      viewBox="0 0 100 120"
    >
      <circle cx="50" cy="36" fill="currentColor" opacity="0.2" r="18" />
      <path
        d="M14 120 Q14 70 50 70 Q86 70 86 120 Z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

function StoryChip({
  agent,
  action,
  timestamp,
}: {
  agent: "Watim" | "Hafiz" | "Adil" | "Sabr";
  action: string;
  timestamp: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-paper-soft)] px-2.5 py-1 font-mono text-[0.58rem] text-[var(--color-ink-muted)] md:text-[0.65rem]">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
      />
      {agent} · {action} · {timestamp}
    </span>
  );
}

function ProfileCard({
  person,
  progress,
  focused,
}: {
  person: Person;
  progress: number;
  focused: boolean;
}) {
  const enter = clamp((progress - person.delay) / 0.18);
  const eased = easeOutCubic(enter);

  return (
    <div
      className="w-[7.1rem] shrink-0 overflow-hidden rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] transition-[filter,transform] duration-500 sm:w-[10rem] md:w-[13.75rem]"
      style={{
        opacity: eased,
        transform: `translateY(${lerp(34, 0, eased)}px) scale(${focused ? 1.06 : 1})`,
        filter: focused || progress < 0.55 ? "none" : "blur(1.5px) opacity(0.55)",
      }}
    >
      <div className="relative flex h-24 items-end justify-center overflow-hidden bg-[var(--color-paper-soft)] text-[var(--color-ink)] sm:h-32 md:h-40">
        <Silhouette />
        <span className="absolute left-2 top-2 rounded-full bg-[rgba(42,39,34,0.55)] px-2 py-1 font-mono text-[0.55rem] text-[var(--color-paper)]">
          gated
        </span>
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-serif text-base leading-tight sm:text-xl md:text-[1.35rem]">
          {person.name}, {person.age}
        </h3>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          {person.city}
        </p>
        <div className="mt-3 hidden sm:block">
          <StoryChip agent="Hafiz" action="ID verified" timestamp="14d" />
        </div>
        <p className="mt-2 font-mono text-[0.56rem] leading-4 text-[var(--color-ink-faint)] sm:hidden">
          Hafiz · ID verified · 14d
        </p>
      </div>
    </div>
  );
}

function TitleScene({ time }: { time: number }) {
  const opacity = fade(time, 0, 3);
  const lift = lerp(14, 0, easeOutCubic(segment(time, 0, 1)));

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ opacity, transform: `translateY(${lift}px)` }}
    >
      <p className="mb-6 font-mono text-[0.62rem] uppercase tracking-[0.32em] text-[var(--color-ink-faint)]">
        Sakinah · the quiet room
      </p>
      <h2 className="max-w-5xl font-serif text-[2rem] font-normal leading-[1.04] sm:text-[2.8rem] md:text-[5.25rem]">
        A service{" "}
        <span className="italic text-[var(--color-ink-muted)]">
          without operators.
        </span>
        <br />
        Trust, end to end.
      </h2>
    </div>
  );
}

function DiscoveryScene({ time }: { time: number }) {
  const progress = segment(time, 3, 9);
  const people: Person[] = useMemo(
    () => [
      { name: "Aisha", age: 27, city: "Karachi → London", delay: 0.08 },
      { name: "Yusuf", age: 29, city: "London", delay: 0.2 },
      { name: "Layla", age: 26, city: "Manchester", delay: 0.32 },
    ],
    [],
  );
  const focus = progress > 0.55 ? 1 : -1;

  return (
    <div
      className="absolute inset-0 flex flex-col px-6 py-8 md:px-20 md:py-14"
      style={{ opacity: fade(time, 3, 9) }}
    >
      <div
        style={{
          opacity: clamp(progress / 0.16),
          transform: `translateY(${lerp(12, 0, clamp(progress / 0.16))}px)`,
        }}
      >
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          Watim · this week
        </p>
        <h2 className="mt-2 font-serif text-4xl font-normal md:text-[2.75rem]">
          Three considered.
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-center gap-4 md:gap-7">
        {people.map((person, index) => (
          <ProfileCard
            focused={focus === index}
            key={person.name}
            person={person}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}

function SalaamScene({ time }: { time: number }) {
  const progress = segment(time, 9, 14);
  const line = easeInOutCubic(clamp((progress - 0.1) / 0.65));
  const accepted = progress > 0.74;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      style={{ opacity: fade(time, 9, 14) }}
    >
      <p className="mb-12 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        Salaam · one tap
      </p>
      <div className="relative flex h-28 w-full max-w-2xl items-center justify-between">
        <Avatar label="Yusuf" />
        <div className="absolute left-[5rem] right-[5rem] top-[2.1rem] h-px bg-[var(--color-rule)]">
          <div
            className="h-full bg-[var(--color-accent)]"
            style={{ width: `${line * 100}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute top-[1.72rem] h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_16px_rgba(138,154,123,0.45)]"
          style={{ left: `calc(5rem + ${(line * 100).toFixed(2)}% - ${line * 10}rem)` }}
        />
        <Avatar active={accepted} label="Aisha" />
      </div>
      <p
        className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-accent)]"
        style={{ opacity: clamp((progress - 0.75) / 0.16) }}
      >
        Aisha accepted · Adil opening the thread
      </p>
    </div>
  );
}

function Avatar({ active, label }: { active?: boolean; label: string }) {
  return (
    <div className="z-10 flex flex-col items-center gap-3">
      <div
        className="flex h-14 w-14 items-end justify-center overflow-hidden rounded-full bg-[var(--color-paper-soft)] text-[var(--color-ink)] transition-shadow"
        style={{
          boxShadow: active ? "0 0 0 3px var(--color-accent)" : "none",
        }}
      >
        <Silhouette small />
      </div>
      <p className="font-serif text-sm">{label}</p>
    </div>
  );
}

function ChatScene({ time }: { time: number }) {
  const progress = segment(time, 14, 22);
  const messages = [
    {
      from: "adil",
      at: 0.05,
      text: "No Sakinah staff can enter this room. I will ask before sharing anything.",
    },
    { from: "a", at: 0.2, text: "Assalamu alaikum, Yusuf." },
    { from: "y", at: 0.35, text: "Wa alaikum salaam." },
    {
      from: "adil",
      at: 0.5,
      text: "Aisha's family asked: does he pray? May I share Yusuf's salaah summary?",
    },
    { from: "y", at: 0.68, text: "Yes. Share it." },
    { from: "a", at: 0.85, text: "Tell me about your father's workshop?" },
  ];

  return (
    <div
      className="absolute inset-0 flex flex-col px-6 py-8 md:px-40 md:py-12"
      style={{ opacity: fade(time, 14, 22) }}
    >
      <p className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        Adil · mediating
      </p>
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((message) => {
          const shown = clamp((progress - message.at) / 0.07);
          const isAdil = message.from === "adil";
          const isYusuf = message.from === "y";
          return (
            <div
              className={[
                "flex",
                isAdil
                  ? "justify-center"
                  : isYusuf
                    ? "justify-end"
                    : "justify-start",
              ].join(" ")}
              key={`${message.from}-${message.at}`}
              style={{
                opacity: shown,
                transform: `translateY(${lerp(12, 0, easeOutCubic(shown))}px)`,
              }}
            >
              <div
                className={[
                  "max-w-[27rem] rounded-md px-4 py-3 text-sm leading-6",
                  isAdil
                    ? "border border-[var(--color-rule)] bg-[var(--color-paper-soft)] text-[var(--color-ink-soft)]"
                    : isYusuf
                      ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                      : "bg-[var(--color-surface)] text-[var(--color-ink-soft)]",
                ].join(" ")}
              >
                {isAdil && (
                  <p className="mb-1.5 flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                    Adil · mediator
                  </p>
                )}
                {message.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HandoffScene({ time }: { time: number }) {
  const progress = segment(time, 22, 27);
  const opacity = fade(time, 22, 27);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ opacity }}
    >
      <p className="mb-7 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        Handoff · we leave the room
      </p>
      <h2 className="max-w-3xl font-serif text-[2.05rem] font-normal leading-[1.08] sm:text-[2.8rem] md:text-[3.5rem]">
        We&rsquo;ve taken you
        <br />
        as far as <span className="italic text-[var(--color-ink-muted)]">we should.</span>
      </h2>
      <div className="relative mt-10 h-px w-full max-w-lg bg-[var(--color-rule)]">
        <div
          className="h-full bg-[var(--color-accent)]"
          style={{ width: `${clamp((progress - 0.2) / 0.6) * 100}%` }}
        />
      </div>
      <p className="mt-5 font-mono text-[0.65rem] tracking-[0.06em] text-[var(--color-ink-faint)]">
        Sakinah closes the thread · billing and service history remain self-serve.
      </p>
    </div>
  );
}

function CloseScene({ time }: { time: number }) {
  const opacity = clamp(segment(time, 27, 28));
  const lift = lerp(16, 0, easeOutCubic(segment(time, 27, 28.2)));

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ opacity, transform: `translateY(${lift}px)` }}
    >
      <p className="font-serif text-[4rem] italic leading-none text-[var(--color-ink)] md:text-[6rem]">
        sakinah
      </p>
      <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-ink-faint)]">
        sakinah.family
      </p>
    </div>
  );
}

function activeBeat(time: number) {
  return beats.reduce((current, beat) => (time >= beat.start ? beat : current));
}

export function SakinahWalkthrough() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((current) => {
        const next = current + delta;
        return next >= DURATION ? 0 : next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const beat = activeBeat(time);

  return (
    <div className="w-full">
      <div
        aria-label="Sakinah 30 second walkthrough"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] md:aspect-video"
      >
        <TitleScene time={time} />
        <DiscoveryScene time={time} />
        <SalaamScene time={time} />
        <ChatScene time={time} />
        <HandoffScene time={time} />
        <CloseScene time={time} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
        <button
          className="min-h-10 rounded bg-[var(--color-ink)] px-4 text-sm text-[var(--color-paper)]"
          onClick={() => setPlaying((value) => !value)}
          type="button"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <label className="sr-only" htmlFor="walkthrough-time">
          Walkthrough time
        </label>
        <input
          className="w-full accent-[var(--color-ink)]"
          id="walkthrough-time"
          max={DURATION}
          min={0}
          onChange={(event) => setTime(Number(event.target.value))}
          step={0.1}
          type="range"
          value={time}
        />
        <p className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
          {beat.label} · {time.toFixed(1)}s
        </p>
      </div>
    </div>
  );
}
