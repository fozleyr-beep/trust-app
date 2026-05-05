import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { DeviceBootstrap } from "@/app/components/DeviceBootstrap";
import {
  AgentBubble,
  Eyebrow,
  TrustChip,
  Wordmark,
} from "@/app/components/SakinahPrimitives";

export const dynamic = "force-dynamic";

// Post-auth landing. Middleware will already have redirected unauthed
// visitors to /sign-in; the explicit guard below is a belt + suspenders so
// a future middleware change cannot silently expose this.

export default async function AppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in" as Route);
  const user = await currentUser();

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <DeviceBootstrap />
      <div className="mb-12 flex items-center justify-between gap-6">
        <Wordmark compact />
        <TrustChip agent="Adil" action="message boundary live" timestamp="now" />
      </div>
      <Eyebrow>Private build</Eyebrow>
      <h1 className="max-w-3xl font-serif text-[2.8rem] font-normal leading-tight">
        Welcome back,{" "}
        <span className="italic text-[var(--color-ink-muted)]">
          {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
        </span>
        .
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-[var(--color-ink-soft)]">
        The live app currently ships encrypted rooms, a separate assistant, and
        device-level trust controls. Hafiz verification, photo gates, and wali
        observer routes remain launch gates.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <SurfaceLink
          eyebrow="Adil room"
          href={"/app/threads" as Route}
          title="Mediated threads"
          body="Encrypted conversations with people. The server stores ciphertext, not message bodies."
        />
        <SurfaceLink
          eyebrow="Agent room"
          href={"/app/agent" as Route}
          title="Sakinah assistant"
          body="A separate server-mediated conversation. It cannot read encrypted rooms."
        />
        <SurfaceLink
          eyebrow="Trust controls"
          href={"/app/settings" as Route}
          title="Device and account"
          body="Fingerprint, rotation, export, sign-out, and account deletion controls."
        />
        <SurfaceLink
          eyebrow="Public contract"
          href={"/trust" as Route}
          title="Trust & verification"
          body="The four-agent trust model, with live guarantees separated from launch gates."
        />
      </div>

      <div className="mt-8">
        <AgentBubble agent="Sabr">
          I will keep surfacing the difference between what is live and what is
          only design-locked. Trust language cannot outrun enforcement.
        </AgentBubble>
      </div>
    </main>
  );
}

function SurfaceLink({
  eyebrow,
  href,
  title,
  body,
}: {
  eyebrow: string;
  href: Route;
  title: string;
  body: string;
}) {
  return (
    <Link
      className="group rounded border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-ink-muted)]"
      href={href}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-[1.5rem] leading-tight group-hover:text-[var(--color-ink)]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
        {body}
      </p>
    </Link>
  );
}
