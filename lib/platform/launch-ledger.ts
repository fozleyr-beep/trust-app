import { createHash } from "node:crypto";
import type { SakinahAgentName } from "@/lib/agents/registry";

export type LaunchLedgerStatus = "live" | "active" | "blocked";

export type OperationalChangelogItem = {
  id: string;
  title: string;
  status: LaunchLedgerStatus;
  proof: string;
  shippedAt: string;
};

export type LaunchCutoverItem = {
  id: string;
  title: string;
  owner: SakinahAgentName | "Sakinah";
  status: LaunchLedgerStatus;
  proof: string;
  next: string;
};

const promptContracts = [
  {
    agent: "Hafiz",
    version: "2026-05-05.1",
    source: "public/AGENT_PROMPTS.md#hafiz",
    contract:
      "Verification guardian using consented profile fields, auth metadata, device keys, and provider results; never raw ID evidence or room plaintext.",
  },
  {
    agent: "Watim",
    version: "2026-05-05.1",
    source: "public/AGENT_PROMPTS.md#watim",
    contract:
      "Match reasoner producing small explainable shortlists from eligible consented profiles; records no-inventory instead of fake matches.",
  },
  {
    agent: "Adil",
    version: "2026-05-05.1",
    source: "public/AGENT_PROMPTS.md#adil",
    contract:
      "Consent keeper moving interest to salaam and salaam to rooms only after mutual consent; observers witness but never post.",
  },
  {
    agent: "Sabr",
    version: "2026-05-05.1",
    source: "public/AGENT_PROMPTS.md#sabr",
    contract:
      "Safety guard surfacing pause, report, stale-flow, observer, and account states without inspecting encrypted message plaintext.",
  },
] as const satisfies ReadonlyArray<{
  agent: SakinahAgentName;
  version: string;
  source: string;
  contract: string;
}>;

export const operationalChangelog = [
  {
    id: "rail-01",
    title: "Provider readiness, private photo gate, and 50-item execution rail",
    status: "live",
    proof: "/app/readiness, /api/photos/:id, /app/improvements",
    shippedAt: "2026-05-05",
  },
  {
    id: "rail-02",
    title: "Profile completeness, explainable matches, quota reset, and salaam expiry",
    status: "live",
    proof: "/app/onboarding, /app/matches, /app/salaam",
    shippedAt: "2026-05-05",
  },
  {
    id: "rail-03",
    title: "Trust, retention, deletion, family, and observer boundaries",
    status: "live",
    proof: "/trust, /privacy, /account/delete, /for-families",
    shippedAt: "2026-05-05",
  },
  {
    id: "rail-04",
    title: "Machine-readable doctor, production smoke, and privacy analytics allowlist",
    status: "live",
    proof: "npm run doctor:json, npm run smoke:prod",
    shippedAt: "2026-05-05",
  },
] as const satisfies ReadonlyArray<OperationalChangelogItem>;

export const launchCutoverChecklist = [
  {
    id: "providers",
    title: "Provider gates are visible before public launch",
    owner: "Sabr",
    status: "active",
    proof: "/app/readiness",
    next: "Clear Clerk webhook, Twilio Verify, Stripe, private media, and cron gates.",
  },
  {
    id: "android-payments",
    title: "Android access stays locked until Play Billing",
    owner: "Sakinah",
    status: "blocked",
    proof: "mobile/src/payments/policy.ts",
    next: "Finish Play Console verification, upload AAB, then wire server-side purchase verification.",
  },
  {
    id: "smoke",
    title: "Production smoke is scripted",
    owner: "Sabr",
    status: "live",
    proof: "scripts/smoke-production.ts",
    next: "Run after every deploy and before telling users a route is live.",
  },
  {
    id: "audit",
    title: "Audit export includes provider and improvement state",
    owner: "Sabr",
    status: "live",
    proof: "/api/service/audit",
    next: "Keep exports free of encrypted room plaintext and raw identity evidence.",
  },
] as const satisfies ReadonlyArray<LaunchCutoverItem>;

export function getAgentPromptVersions() {
  return promptContracts.map((prompt) => ({
    agent: prompt.agent,
    hash: digest(
      `${prompt.agent}:${prompt.version}:${prompt.source}:${prompt.contract}`,
    ),
    source: prompt.source,
    version: prompt.version,
  }));
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
