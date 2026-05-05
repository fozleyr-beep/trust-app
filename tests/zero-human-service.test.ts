import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("zero-human service path", () => {
  const routes = [
    "app/app/onboarding/page.tsx",
    "app/app/verification/page.tsx",
    "app/app/billing/page.tsx",
    "app/app/matches/page.tsx",
    "app/app/salaam/page.tsx",
    "app/app/family/page.tsx",
    "app/api/agents/actions/route.ts",
    "app/api/service/profile/route.ts",
    "app/api/service/agents/run/route.ts",
    "app/api/service/matches/[id]/respond/route.ts",
    "app/api/service/salaam/[id]/route.ts",
  ];

  it("keeps every zero-human route present behind /app", () => {
    for (const route of routes) {
      expect(existsSync(join(root, route)), route).toBe(true);
    }
  });

  it("wires the dashboard to the full service path", () => {
    const dashboard = read("app/app/page.tsx");
    const serviceFlow = read("app/components/ServiceFlow.tsx");
    const registry = read("lib/agents/registry.ts");
    expect(dashboard).toContain("ServiceStageGrid");
    for (const href of [
      "/app/onboarding",
      "/app/verification",
      "/app/billing",
      "/app/matches",
      "/app/salaam",
      "/app/family",
    ]) {
      expect(`${serviceFlow}\n${registry}`).toContain(href);
    }
  });

  it("documents payment as self-serve and launch-gated until Stripe is set", () => {
    expect(read(".env.example")).toContain("STRIPE_SECRET_KEY");
    expect(read(".env.example")).toContain("STRIPE_PRICE_ID");
    expect(read("app/api/billing/checkout/route.ts")).toContain("status: 501");
    expect(read("app/api/billing/webhook/route.ts")).toContain("STRIPE_WEBHOOK_SECRET");
    expect(read("lib/db/schema.ts")).toContain("agent_actions");
    expect(read("lib/db/schema.ts")).toContain("service_profiles");
    expect(read("lib/db/schema.ts")).toContain("match_suggestions");
    expect(read("lib/db/schema.ts")).toContain("salaam_requests");
    expect(read("app/api/agents/actions/route.ts")).toContain("sakinahAgents");
    expect(read("middleware.ts")).toContain("/api/billing/webhook");
    expect(read("DECISIONS.md")).toContain("zero human operator");
    expect(read("DECISIONS.md")).toContain("/app/billing");
  });

  it("keeps Android payments locked to Play Billing", () => {
    const mobile = read("mobile/App.tsx");
    expect(read("mobile/src/payments/policy.ts")).toContain(
      "google-play-billing",
    );
    expect(mobile).toContain("Google Play Billing required");
    expect(mobile).not.toMatch(/checkout\.stripe|STRIPE_PRICE_ID|bank transfer/i);
  });

  it("makes the four agents operational without room plaintext", () => {
    const ops = read("lib/service/operations.ts");
    expect(ops).toContain("saveServiceProfile");
    expect(ops).toContain("not fabricate matches");
    expect(ops).toContain("createConsentThread");
    expect(ops).toContain("sabr.pressure.flags");
    expect(ops).not.toContain("schema.messages");
  });

  it("blocks observer posting at the messaging authorization layer", () => {
    expect(read("lib/db/schema.ts")).toContain("role: text(\"role\")");
    expect(read("lib/messaging/authz.ts")).toContain(
      "observer members cannot send messages",
    );
    expect(read("app/api/threads/[id]/messages/route.ts")).toContain(
      "senderRole",
    );
  });

  it("does not position manual staff as part of service delivery", () => {
    const combined = routes.map(read).join("\n");
    expect(combined).not.toMatch(/sales call required|manual reviewer required|staff will match/i);
    expect(combined).toMatch(/without an intake call|No sales call|without a coordinator/i);
  });
});
