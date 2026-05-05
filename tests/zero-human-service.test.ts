import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPlatformImprovements } from "@/lib/platform/improvements";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("zero-human service path", () => {
  const routes = [
    "app/app/onboarding/page.tsx",
    "app/app/verification/page.tsx",
    "app/app/mobile-flow/page.tsx",
    "app/app/discovery/page.tsx",
    "app/app/billing/page.tsx",
    "app/app/matches/page.tsx",
    "app/app/salaam/page.tsx",
    "app/app/family/page.tsx",
    "app/app/wali/page.tsx",
    "app/app/sabr/page.tsx",
    "app/app/economics/page.tsx",
    "app/app/engineering/page.tsx",
    "app/app/readiness/page.tsx",
    "app/app/improvements/page.tsx",
    "app/app/layout.tsx",
    "app/api/platform/readiness/route.ts",
    "app/api/platform/improvements/route.ts",
    "app/api/agents/actions/route.ts",
    "app/api/service/audit/route.ts",
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
    const platformLayout = read("app/app/layout.tsx");
    const serviceFlow = read("app/components/ServiceFlow.tsx");
    const registry = read("lib/agents/registry.ts");
    expect(platformLayout).toContain("platform console");
    expect(dashboard).toContain("Command center");
    expect(dashboard).toContain("getPlatformSnapshot");
    expect(dashboard).toContain("AuditExportButton");
    expect(dashboard).toContain("Run all agents");
    for (const href of [
      "/app/onboarding",
      "/app/verification",
      "/app/mobile-flow",
      "/app/discovery",
      "/app/billing",
      "/app/matches",
      "/app/salaam",
      "/app/family",
      "/app/wali",
      "/app/sabr",
      "/app/economics",
      "/app/engineering",
      "/app/readiness",
      "/app/improvements",
    ]) {
      expect(`${dashboard}\n${platformLayout}\n${serviceFlow}\n${registry}`).toContain(
        href,
      );
    }
  });

  it("closes the seven platform gaps as first-class surfaces", () => {
    const mobileFlow = read("app/app/mobile-flow/page.tsx");
    const discovery = read("app/app/discovery/page.tsx");
    const wali = read("app/app/wali/page.tsx");
    const sabr = read("app/app/sabr/page.tsx");
    const economics = read("app/app/economics/page.tsx");
    const engineering = read("app/app/engineering/page.tsx");
    const controls = read("app/components/PlatformPrototypeControls.tsx");
    expect(controls).toContain("MobileFlowPrototype");
    expect(controls).toContain("DiscoveryFilterWorkbench");
    expect(mobileFlow).toContain("trust, intake");
    expect(discovery).toContain("Hard gates");
    expect(discovery).toContain("Weekly cap");
    expect(wali).toContain("observer mode");
    expect(wali).toContain("cannot post");
    expect(sabr).toContain("Refresh Sabr state");
    expect(sabr).toContain("not decrypted room content");
    expect(economics).toContain("sustainability design");
    expect(economics).toContain("Google Play Billing");
    expect(engineering).toContain("ENGINEERING_PLAN.md");
    expect(read("public/ENGINEERING_PLAN.md")).toContain("schema");
    expect(read("public/API_CONTRACTS.md")).toContain("/api/service/audit");
    expect(read("public/AGENT_PROMPTS.md")).toContain("Hafiz");
  });

  it("exposes provider readiness without leaking secret values", () => {
    const readiness = read("lib/platform/readiness.ts");
    const page = read("app/app/readiness/page.tsx");
    const route = read("app/api/platform/readiness/route.ts");
    expect(read(".env.example")).toContain("R2_BUCKET=sakinah-photos");
    expect(read("scripts/doctor.ts")).toContain("R2_BUCKET_VOICE");
    expect(read("app/app/layout.tsx")).toContain("/app/readiness");
    expect(route).toContain("requireDbUser");
    expect(route).toContain("getProviderReadiness");
    expect(page).toContain("Provider readiness");
    expect(readiness).toContain("CLERK_WEBHOOK_SECRET");
    expect(readiness).toContain("STRIPE_WEBHOOK_SECRET");
    expect(readiness).toContain("R2_SECRET_ACCESS_KEY");
    expect(readiness).toContain("PHOTO_ACCESS_TOKEN_SECRET");
    expect(readiness).not.toContain("process.env.R2_SECRET_ACCESS_KEY!");
  });

  it("keeps a numbered 50-item improvement rail", () => {
    const improvements = read("lib/platform/improvements.ts");
    const page = read("app/app/improvements/page.tsx");
    const route = read("app/api/platform/improvements/route.ts");
    expect(route).toContain("requireDbUser");
    expect(route).toContain("getPlatformImprovements");
    expect(page).toContain("Fifty improvements");
    expect(page).toContain("next five by score");
    expect(read("public/API_CONTRACTS.md")).toContain(
      "/api/platform/improvements",
    );
    expect(getPlatformImprovements().total).toBe(50);
    expect(improvements).toContain("Launch cutover checklist");
  });

  it("keeps launch-gate pages operational instead of static copy", () => {
    const serviceFlow = read("app/components/ServiceFlow.tsx");
    const verification = read("app/app/verification/page.tsx");
    const billing = read("app/app/billing/page.tsx");
    const family = read("app/app/family/page.tsx");
    expect(serviceFlow).toContain("PlatformWorkbenchPanel");
    for (const page of [verification, billing, family]) {
      expect(page).toContain("getPlatformSnapshot");
      expect(page).toContain("PlatformWorkbenchPanel");
    }
    expect(verification).toContain("DeviceBootstrap");
    expect(verification).toContain("Refresh Hafiz checks");
    expect(billing).toContain("STRIPE_SECRET_KEY");
    expect(billing).toContain("Play Billing");
    expect(family).toContain("Observer posting");
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
    expect(read("app/api/service/audit/route.ts")).toContain(
      "getPlatformSnapshot",
    );
    expect(read("app/api/service/profile/route.ts")).toContain(
      "getProfileCompleteness",
    );
    expect(read("app/api/service/matches/route.ts")).toContain(
      "fakeInventory: false",
    );
    expect(read("app/api/service/salaam/route.ts")).toContain(
      "getSalaamQuotaStatus",
    );
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
