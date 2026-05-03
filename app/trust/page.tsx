import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust — what we hold, what we don't",
  description:
    "A plain-English contract for what is encrypted, what we can see, and what the AI agent sees.",
};

// Server component. No client JS. Public route per middleware.ts.
//
// Every substantive claim below is marked `{/* ASSUMPTION: ... */}`.
// When DECISIONS.md and CLAUDE_CODE_PROMPT.md arrive:
//   grep -n "ASSUMPTION" app/trust/page.tsx
// and reconcile each one before this page goes live.

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20 md:py-28">
      <header className="mb-16 md:mb-20">
        <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Trust
        </p>
        <h1 className="font-serif text-[2.4rem] leading-[1.1] md:text-[3rem]">
          What we hold.
          <br />
          <span className="text-[var(--color-ink-muted)]">
            What we don&rsquo;t.
          </span>
        </h1>
        <p className="mt-8 text-lg leading-[1.6] text-[var(--color-ink-soft)]">
          {/* ASSUMPTION: product is messaging + AI agent. Adjust framing if scope differs. */}
          You send messages and you talk to an assistant. This page tells you,
          in plain language, which of those we can read, which we can&rsquo;t,
          and how you can check.
        </p>
      </header>

      <Section index="01" title="Messages between people are end-to-end encrypted">
        {/* ASSUMPTION: libsodium crypto_box (X25519 + XSalsa20-Poly1305). Replace if handoff.yaml specifies sealed_box / kx / a different primitive. */}
        <p>
          When you send a message to another person, your device encrypts it
          with their public key using <Code>libsodium</Code>{" "}
          (<Code>crypto_box</Code>, X25519 key agreement, XSalsa20-Poly1305).
          Our servers see only ciphertext. We do not hold a key that can
          decrypt it.
        </p>
        <p>
          Your private key is generated on your device and never leaves it
          unencrypted. {/* ASSUMPTION: client-side keygen + IndexedDB storage. Confirm key-recovery model from DECISIONS.md (passphrase-wrapped backup vs. nothing vs. social recovery). */}
        </p>
      </Section>

      <Section index="02" title="What we do hold, in clear">
        <p>The server stores, in plaintext:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Your account record (Clerk user id, email, sign-up time).</li>
          <li>
            Your public key, so others can encrypt to you. Public keys are
            public by design.
          </li>
          <li>
            Message envelope metadata: sender, recipient, thread id, timestamp,
            ciphertext size.{" "}
            {/* ASSUMPTION: metadata-minimization stance. If DECISIONS.md commits to sealed-sender or onion-style metadata stripping, rewrite this bullet. */}
          </li>
          <li>
            Anything you explicitly send to the assistant (see next section).
          </li>
        </ul>
        <p>
          We do not store message bodies in plaintext. We do not keep
          decryption keys for messages between people.
        </p>
      </Section>

      <Section index="03" title="What the assistant sees">
        {/* ASSUMPTION: the AI agent is a separate conversational surface. Messages between people are NOT routed through it. Confirm in DECISIONS.md. */}
        <p>
          The assistant is a separate conversation. When you talk to it, your
          message is sent in clear to{" "}
          <Code>Anthropic&rsquo;s API (Claude Sonnet 4.5)</Code> so it can
          answer. The assistant cannot read messages you exchange with other
          people; those are encrypted and we never decrypt them server-side.
        </p>
        <p>
          We send Anthropic only what you type to the assistant in that
          session, plus the system prompt that defines its behaviour. We do
          not send your messages with other people, your contacts, or your
          private key.{" "}
          {/* ASSUMPTION: zero-retention is configured via Anthropic's no-train flag. Verify the exact API setting once the integration lands. */}
        </p>
      </Section>

      <Section index="04" title="How to verify any of this">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            The crypto code is{" "}
            <Code>lib/crypto/</Code>{" "}
            in our open-source repository.{" "}
            {/* ASSUMPTION: repo is or will be public. If it stays private, replace this with "code is auditable on request under NDA". */}
          </li>
          <li>
            Your key fingerprint is shown on every conversation header. Read
            it aloud to your counterpart over a separate channel to confirm
            you&rsquo;re encrypting to the right person.{" "}
            {/* ASSUMPTION: out-of-band fingerprint verification UX is in scope. Drop if not. */}
          </li>
          <li>
            You can export your full plaintext history from your device at any
            time (Settings → Export). The server has no way to produce this
            export — only your device can.
          </li>
        </ul>
      </Section>

      <Section index="05" title="Where the data lives">
        <p>
          The database is{" "}
          <Code>Neon Postgres</Code>{" "}
          {/* ASSUMPTION: single-region default. If multi-region or specific region committed in DECISIONS.md, name it. */}
          in a single region. Backups are encrypted at rest. Auth is{" "}
          <Code>Clerk</Code>; your password (if you use one) never touches our
          servers in plaintext.
        </p>
        <p>
          We use no third-party analytics, no marketing pixels, and no
          session-replay. The only third parties who see any of your data are
          Clerk (auth), Neon (database), and Anthropic (only your assistant
          turns).
        </p>
      </Section>

      <Section
        index="06"
        title="If something is wrong, tell us"
      >
        <p>
          Found a bug, a leak, a way to make the crypto lie? Email{" "}
          <a
            className="underline decoration-[var(--color-ink-muted)] decoration-from-font underline-offset-4 hover:text-[var(--color-accent)]"
            href="mailto:security@example.com"
          >
            {/* ASSUMPTION: replace with the real address from DECISIONS.md. */}
            security@example.com
          </a>
          . We respond within 72 hours. We will not pursue legal action against
          good-faith research.
        </p>
      </Section>

      <footer className="mt-24 border-t border-[var(--color-rule)] pt-8 text-sm text-[var(--color-ink-muted)]">
        <p>
          This page is the contract. If something below it diverges from what
          this page says, this page wins until we update it.
        </p>
        <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em]">
          Last reviewed —{" "}
          <time dateTime="2026-05-03">3 May 2026</time>
        </p>
      </footer>
    </main>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14 md:mb-16">
      <div className="mb-5 flex items-baseline gap-4">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          {index}
        </span>
        <h2 className="font-serif text-[1.4rem] leading-[1.25] md:text-[1.6rem]">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-[1.02rem] leading-[1.65] text-[var(--color-ink-soft)]">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[color-mix(in_srgb,var(--color-rule)_60%,transparent)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--color-ink)]">
      {children}
    </code>
  );
}
