// Preflight check: do the things that fail silently in production fail
// loudly here. Run before your first deploy and any time something stops
// working in a non-obvious way.
//
//   npm run doctor
//
// Reads .env.local automatically (via Next.js' loader), probes each
// service with a small live call, prints a status table, exits non-zero
// if any required check fails.

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

type Status = "ok" | "warn" | "fail";
type Check = {
  name: string;
  status: Status;
  detail: string;
};

const REQUIRED = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "DATABASE_URL",
] as const;

const RECOMMENDED = [
  "CLERK_WEBHOOK_SECRET",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_BUCKET_VOICE",
  "POSTHOG_KEY",
  "SENTRY_DSN",
  "CRON_SECRET",
] as const;

function envCheck(name: string, required: boolean): Check {
  const v = process.env[name];
  if (!v) {
    return {
      name: `env: ${name}`,
      status: required ? "fail" : "warn",
      detail: required ? "missing" : "missing (recommended)",
    };
  }
  return {
    name: `env: ${name}`,
    status: "ok",
    detail: `set (${v.length} chars)`,
  };
}

function assistantEnvCheck(): Check {
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      name: "env: assistant provider",
      status: "ok",
      detail: "ANTHROPIC_API_KEY set",
    };
  }
  if (process.env.AI_GATEWAY_API_KEY) {
    return {
      name: "env: assistant provider",
      status: "ok",
      detail: "AI_GATEWAY_API_KEY set",
    };
  }
  if (process.env.VERCEL_OIDC_TOKEN) {
    return {
      name: "env: assistant provider",
      status: "ok",
      detail: "VERCEL_OIDC_TOKEN set",
    };
  }
  return {
    name: "env: assistant provider",
    status: "warn",
    detail:
      "missing locally; set AI_GATEWAY_API_KEY / ANTHROPIC_API_KEY, or rely on Vercel OIDC in production",
  };
}

async function checkAnthropic(): Promise<Check> {
  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  const directKey = process.env.ANTHROPIC_API_KEY;
  const apiKey = gatewayKey ?? directKey;

  if (!apiKey) {
    return {
      name: "assistant provider",
      status: "warn",
      detail:
        "skipped locally; production can use Vercel OIDC, or set AI_GATEWAY_API_KEY / ANTHROPIC_API_KEY",
    };
  }

  const model = gatewayKey
    ? (process.env.AI_GATEWAY_MODEL ?? "anthropic/claude-sonnet-4.5")
    : (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({
      apiKey,
      baseURL: gatewayKey
        ? (process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh")
        : undefined,
    });
    const resp = await client.messages.create({
      model,
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    });
    const tokens = resp.usage?.output_tokens ?? 0;
    return {
      name: "assistant provider",
      status: "ok",
      detail: `${model} reachable, ${tokens} output tokens`,
    };
  } catch (err) {
    return {
      name: "assistant provider",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkDatabase(): Promise<Check> {
  if (!process.env.DATABASE_URL) {
    return {
      name: "db: connect",
      status: "fail",
      detail: "skipped (DATABASE_URL not set)",
    };
  }
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = (await sql`select 1 as ok`) as Array<{ ok: number }>;
    if (rows[0]?.ok !== 1) {
      return {
        name: "db: connect",
        status: "fail",
        detail: "unexpected query result",
      };
    }
    return {
      name: "db: connect",
      status: "ok",
      detail: "select 1 → ok",
    };
  } catch (err) {
    return {
      name: "db: connect",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkDatabaseSchema(): Promise<Check> {
  if (!process.env.DATABASE_URL) {
    return {
      name: "db: schema",
      status: "fail",
      detail: "skipped (DATABASE_URL not set)",
    };
  }
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const tables = (await sql`
      select table_name from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `) as Array<{ table_name: string }>;
    const got = new Set(tables.map((t) => t.table_name));
    const expected = [
      "agent_actions",
      "audit_event",
      "billing_events",
      "consent_grant",
      "device_keys",
      "donation",
      "family_link",
      "interest",
      "match_suggestions",
      "messages",
      "sabr_event",
      "salaam_quota",
      "salaam_requests",
      "service_entitlements",
      "service_profiles",
      "thread_members",
      "threads",
      "users",
      "wali_digest",
      "wali_note",
    ];
    const missing = expected.filter((e) => !got.has(e));
    if (missing.length > 0) {
      return {
        name: "db: schema",
        status: "fail",
        detail: `missing tables: ${missing.join(", ")}. Run: npx drizzle-kit migrate`,
      };
    }
    return {
      name: "db: schema",
      status: "ok",
      detail: `all ${expected.length} tables present`,
    };
  } catch (err) {
    return {
      name: "db: schema",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkClerk(): Promise<Check> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    return {
      name: "clerk: probe",
      status: "fail",
      detail: "skipped (CLERK_SECRET_KEY not set)",
    };
  }
  try {
    const r = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: { authorization: `Bearer ${secret}` },
    });
    if (r.status === 401) {
      return {
        name: "clerk: probe",
        status: "fail",
        detail: "401 — CLERK_SECRET_KEY rejected",
      };
    }
    if (!r.ok) {
      return {
        name: "clerk: probe",
        status: "fail",
        detail: `HTTP ${r.status}`,
      };
    }
    return {
      name: "clerk: probe",
      status: "ok",
      detail: "admin API reachable",
    };
  } catch (err) {
    return {
      name: "clerk: probe",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

function render(checks: Check[]): void {
  const symbol: Record<Status, string> = {
    ok: "✓",
    warn: "·",
    fail: "✗",
  };
  const padName = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) {
    const line =
      `  ${symbol[c.status]}  ` +
      c.name.padEnd(padName + 2) +
      c.detail;
    if (c.status === "fail") {
      process.stdout.write(`\x1b[31m${line}\x1b[0m\n`);
    } else if (c.status === "warn") {
      process.stdout.write(`\x1b[33m${line}\x1b[0m\n`);
    } else {
      process.stdout.write(`\x1b[32m${line}\x1b[0m\n`);
    }
  }
}

async function main() {
  console.log("\ntrust-app doctor");
  console.log("");

  const checks: Check[] = [];

  // Phase 1: env vars (synchronous)
  for (const name of REQUIRED) checks.push(envCheck(name, true));
  checks.push(assistantEnvCheck());
  for (const name of RECOMMENDED) checks.push(envCheck(name, false));

  // Phase 2: live probes (parallel)
  const probes = await Promise.all([
    checkDatabase(),
    checkDatabaseSchema(),
    checkClerk(),
    checkAnthropic(),
  ]);
  checks.push(...probes);

  render(checks);

  const failures = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  console.log("");
  if (failures === 0) {
    console.log(
      `  ${warnings} warning(s), 0 failures. You're good to go.`,
    );
    process.exit(0);
  }
  console.log(
    `  ${failures} failure(s), ${warnings} warning(s). Fix the red lines above before deploying.`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("doctor crashed:", err);
  process.exit(2);
});
