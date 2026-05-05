import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "@clerk/nextjs";
import { requireDbUser } from "@/lib/auth/current-user";
import { MyFingerprint } from "@/app/components/Fingerprint";
import { ExportButton } from "@/app/components/ExportButton";
import { RotateKeyButton } from "@/app/components/RotateKeyButton";
import { DeleteAccountButton } from "@/app/components/DeleteAccountButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireDbUser();

  return (
    <main className="mx-auto max-w-[68ch] px-6 py-20">
      <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
        Settings
      </p>
      <h1 className="font-serif text-[2rem] leading-[1.1]">
        Your account.
      </h1>

      <section className="mt-12">
        <h2 className="font-serif text-[1.2rem]">This device&rsquo;s fingerprint</h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Read this aloud to a counterpart on a separate channel (phone, in
          person) so they can confirm they&rsquo;re encrypting to you and
          not someone impersonating you. The fingerprint is the first 16
          bytes of this device&rsquo;s X25519 public key.
        </p>
        <p className="mt-4">
          <MyFingerprint />
        </p>
        <div className="mt-6">
          <RotateKeyButton />
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          Rotate if you suspect this device&rsquo;s key has been exposed.
          Past messages on this device stay readable; new messages encrypt
          to the new key.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-[1.2rem]">Export your history</h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Pulls every message addressed to this device from the server,
          decrypts each one in this browser, and saves a JSON file. The
          server cannot produce this file — only this device can, because
          only this device has the keys.
        </p>
        <p className="mt-5">
          <ExportButton />
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-[1.2rem]">Account</h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Signed in as <code className="font-mono text-[0.9rem]">{me.email}</code>.
        </p>
        <p className="mt-5">
          <SignOutButton redirectUrl="/">
            <button className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-ink)] border border-[var(--color-ink)] px-5 py-3 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]">
              Sign out
            </button>
          </SignOutButton>
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-[1.2rem] text-red-900">
          Danger zone
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Self-serve account deletion. Irreversible.
        </p>
        <div className="mt-5">
          <DeleteAccountButton />
        </div>
      </section>

      <p className="mt-20 text-sm">
        <Link
          className="underline decoration-from-font underline-offset-4 hover:text-[var(--color-ink)]"
          href={"/app" as Route}
        >
          ← Back
        </Link>
      </p>
    </main>
  );
}
