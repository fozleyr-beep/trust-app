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
  ];

  it("keeps every zero-human route present behind /app", () => {
    for (const route of routes) {
      expect(existsSync(join(root, route)), route).toBe(true);
    }
  });

  it("wires the dashboard to the full service path", () => {
    const dashboard = read("app/app/page.tsx");
    const serviceFlow = read("app/components/ServiceFlow.tsx");
    expect(dashboard).toContain("ServiceStageGrid");
    for (const href of [
      "/app/onboarding",
      "/app/verification",
      "/app/billing",
      "/app/matches",
      "/app/salaam",
      "/app/family",
    ]) {
      expect(serviceFlow).toContain(href);
    }
  });

  it("documents payment as self-serve and launch-gated until Stripe is set", () => {
    expect(read(".env.example")).toContain("STRIPE_SECRET_KEY");
    expect(read(".env.example")).toContain("STRIPE_PRICE_ID");
    expect(read("app/api/billing/checkout/route.ts")).toContain("status: 501");
    expect(read("app/api/billing/webhook/route.ts")).toContain("STRIPE_WEBHOOK_SECRET");
    expect(read("middleware.ts")).toContain("/api/billing/webhook");
    expect(read("DECISIONS.md")).toContain("zero human operator");
    expect(read("DECISIONS.md")).toContain("/app/billing");
  });

  it("does not position manual staff as part of service delivery", () => {
    const combined = routes.map(read).join("\n");
    expect(combined).not.toMatch(/sales call required|manual reviewer required|staff will match/i);
    expect(combined).toMatch(/without an intake call|No sales call|without a coordinator/i);
  });
});
