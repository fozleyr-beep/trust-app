"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

const BrassThreadContext = createContext<{ count: { current: number } } | null>(
  null,
);

export function BrassThreadScope({ children }: { children: ReactNode }) {
  const count = useRef(0);
  const value = useMemo(() => ({ count }), []);
  return (
    <BrassThreadContext.Provider value={value}>
      {children}
    </BrassThreadContext.Provider>
  );
}

export function BrassThread() {
  const ctx = useContext(BrassThreadContext);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!ctx) {
      throw new Error("BrassThread must be rendered inside BrassThreadScope.");
    }
    ctx.count.current += 1;
    if (ctx.count.current > 1) {
      throw new Error("Only one BrassThread may render on a marketing page.");
    }
    return () => {
      ctx.count.current -= 1;
    };
  }, [ctx]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[44vh] h-px bg-[var(--color-brass)] opacity-60"
    />
  );
}

export function Girih({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 240 240"
    >
      <g
        className="origin-center motion-safe:animate-[sakinah-breathe_14s_ease-in-out_infinite]"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.72"
        strokeWidth="1"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <path
            className="motion-safe:[animation:sakinah-draw_2.8s_ease_forwards]"
            d="M120 20 L154 86 L220 120 L154 154 L120 220 L86 154 L20 120 L86 86 Z"
            key={index}
            pathLength="1"
            style={{
              animationDelay: `${index * 90}ms`,
              strokeDasharray: 1,
              strokeDashoffset: 1,
              transform: `rotate(${index * 45}deg)`,
              transformOrigin: "120px 120px",
            }}
          />
        ))}
        <circle
          className="motion-safe:[animation:sakinah-draw_2.4s_ease_forwards]"
          cx="120"
          cy="120"
          pathLength="1"
          r="58"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
      </g>
    </svg>
  );
}

export function ArchFrame({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 320 420"
    >
      <path
        className="motion-safe:[animation:sakinah-draw_2.4s_ease_forwards]"
        d="M40 390 V178 C40 102 94 42 160 42 C226 42 280 102 280 178 V390 M78 390 V181 C78 122 116 78 160 78 C204 78 242 122 242 181 V390"
        pathLength="1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1"
        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
      />
    </svg>
  );
}
