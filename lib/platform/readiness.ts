export type ProviderReadinessStatus = "live" | "blocked" | "optional";

export type ProviderReadinessItem = {
  id: string;
  label: string;
  owner: "Hafiz" | "Watim" | "Adil" | "Sabr" | "Sakinah";
  status: ProviderReadinessStatus;
  detail: string;
  env: string[];
  next: string;
};

type Env = Record<string, string | undefined>;

function hasAll(env: Env, keys: string[]) {
  return keys.every((key) => Boolean(env[key]));
}

function item(
  env: Env,
  input: Omit<ProviderReadinessItem, "status"> & {
    optional?: boolean;
    ready?: boolean;
  },
): ProviderReadinessItem {
  const ready = input.ready ?? hasAll(env, input.env);
  return {
    id: input.id,
    label: input.label,
    owner: input.owner,
    status: ready ? "live" : input.optional ? "optional" : "blocked",
    detail: input.detail,
    env: input.env,
    next: ready ? "No action needed." : input.next,
  };
}

export function getProviderReadiness(env: Env = process.env) {
  const items: ProviderReadinessItem[] = [
    item(env, {
      id: "clerk-auth",
      label: "Clerk auth",
      owner: "Hafiz",
      detail: "Sign-in, sign-up, and current-user backfill are available.",
      env: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
      next: "Set Clerk publishable and secret keys.",
    }),
    item(env, {
      id: "clerk-webhook",
      label: "Clerk user webhook",
      owner: "Hafiz",
      detail: "Canonical user mirror can verify Svix signatures.",
      env: ["CLERK_WEBHOOK_SECRET"],
      next: "Create the Clerk endpoint and add the whsec signing secret.",
    }),
    item(env, {
      id: "assistant-provider",
      label: "Assistant provider",
      owner: "Watim",
      detail: "Agent chat has a model provider or Vercel AI Gateway path.",
      env: ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "ANTHROPIC_API_KEY"],
      ready: Boolean(
        env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN || env.ANTHROPIC_API_KEY,
      ),
      next: "Set AI_GATEWAY_API_KEY, rely on Vercel OIDC, or set ANTHROPIC_API_KEY.",
    }),
    item(env, {
      id: "twilio-verify",
      label: "Phone verification",
      owner: "Hafiz",
      detail: "Twilio Verify can send and check phone challenges.",
      env: [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_VERIFY_SERVICE_SID",
      ],
      next: "Add Twilio Verify credentials.",
    }),
    item(env, {
      id: "stripe-billing",
      label: "Web billing",
      owner: "Sakinah",
      detail: "Stripe Checkout and webhook entitlement updates are enabled.",
      env: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
      next: "Add Stripe secret, subscription price, and webhook secret.",
    }),
    item(env, {
      id: "private-media",
      label: "Photo and voice storage",
      owner: "Hafiz",
      detail: "Private R2 buckets are configured for gated photos and voice purge.",
      env: [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_BUCKET_VOICE",
      ],
      next: "Create private R2 buckets and add scoped access keys.",
    }),
    item(env, {
      id: "wali-digest",
      label: "Wali digest cron",
      owner: "Sabr",
      detail: "Cron can run without exposing the digest endpoint publicly.",
      env: ["CRON_SECRET"],
      next: "Set CRON_SECRET in production and cron callers.",
    }),
    item(env, {
      id: "observability",
      label: "Error and product telemetry",
      owner: "Sabr",
      detail: "Minimal telemetry can record non-observer, non-plaintext events.",
      env: ["POSTHOG_KEY", "SENTRY_DSN"],
      next: "Add PostHog and Sentry DSNs, or keep this explicitly deferred.",
      optional: true,
    }),
  ];

  const live = items.filter((gate) => gate.status === "live").length;
  const blocked = items.filter((gate) => gate.status === "blocked").length;
  const optional = items.filter((gate) => gate.status === "optional").length;

  return {
    items,
    live,
    blocked,
    optional,
    percent: Math.round((live / items.length) * 100),
  };
}
