import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ButtonLink, Eyebrow, Wordmark } from "@/app/components/SakinahPrimitives";

export const metadata: Metadata = {
  title: "Sakinah — delete your account",
  description:
    "How to delete a Sakinah.family account from the web or mobile app.",
  robots: { index: true, follow: true },
};

const steps = [
  "Sign in with the email used for your Sakinah account.",
  "Open Settings.",
  "Use the Danger zone account deletion control.",
  "Type the confirmation text shown in the app.",
  "Submit. Device keys are revoked and the Clerk account is removed.",
] as const;

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <header className="mb-12 flex items-center justify-between gap-6">
        <Wordmark compact />
        <Link
          className="font-mono text-[0.7rem] uppercase tracking-[0.16em] underline decoration-from-font underline-offset-4"
          href={"/privacy" as Route}
        >
          Privacy
        </Link>
      </header>
      <Eyebrow>Account deletion</Eyebrow>
      <h1 className="mt-3 font-serif text-[3rem] font-normal leading-tight">
        Delete your Sakinah account without contacting staff.
      </h1>
      <p className="mt-5 leading-7 text-[var(--color-ink-soft)]">
        Sakinah is designed as a zero-human-operator service, so account
        deletion is self-serve. The same route supports web and mobile users.
      </p>

      <ol className="mt-10 grid gap-3">
        {steps.map((step, index) => (
          <li
            className="rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-sm leading-6 text-[var(--color-ink-soft)]"
            key={step}
          >
            <span className="mr-3 font-mono text-[0.7rem] text-[var(--color-ink-faint)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <ButtonLink href={"/app/settings" as Route}>Open settings</ButtonLink>
      </div>

      <p className="mt-8 text-sm leading-6 text-[var(--color-ink-muted)]">
        Current v1 behavior keeps thread membership rows and past ciphertext
        needed by other conversation members, while revoking active device keys
        and deleting the authentication account.
      </p>
    </main>
  );
}
