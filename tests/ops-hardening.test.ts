import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isPrivacyEventAllowed } from "@/lib/observability-policy";
import { getPlatformImprovements } from "@/lib/platform/improvements";
import {
  getAgentPromptVersions,
  launchCutoverChecklist,
  operationalChangelog,
} from "@/lib/platform/launch-ledger";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("operator hardening", () => {
  it("keeps analytics on an explicit privacy allowlist", () => {
    expect(isPrivacyEventAllowed("profile.saved")).toBe(true);
    expect(isPrivacyEventAllowed("observer.invited")).toBe(false);
    expect(isPrivacyEventAllowed("room.message.sent")).toBe(false);
    expect(read("lib/observability.ts")).toContain("isPrivacyEventAllowed");
  });

  it("adds machine-readable doctor and production smoke scripts", () => {
    expect(read("scripts/doctor.ts")).toContain("--json");
    expect(existsSync(join(root, "scripts/smoke-production.ts"))).toBe(true);
    expect(read("package.json")).toContain("doctor:json");
    expect(read("package.json")).toContain("smoke:prod");
    expect(read("public/API_CONTRACTS.md")).toContain("Operator scripts");
    expect(read("public/ENGINEERING_PLAN.md")).toContain("npm run smoke:prod");
  });

  it("publishes the launch ledger and prompt versions", () => {
    const prompts = getAgentPromptVersions();
    expect(operationalChangelog).toHaveLength(4);
    expect(launchCutoverChecklist.map((item) => item.id)).toContain("smoke");
    expect(prompts).toHaveLength(4);
    expect(prompts.every((prompt) => /^[a-f0-9]{64}$/.test(prompt.hash))).toBe(
      true,
    );
    expect(read("app/app/engineering/page.tsx")).toContain(
      "operational changelog",
    );
    expect(read("app/app/engineering/page.tsx")).toContain(
      "agent prompt versions",
    );
    expect(read("app/app/improvements/page.tsx")).toContain(
      "launch cutover checklist",
    );
  });

  it("keeps the 50-item rail current without hiding launch blockers", () => {
    const plan = getPlatformImprovements();
    const byNumber = new Map(plan.items.map((item) => [item.n, item]));
    expect(plan.total).toBe(50);
    expect(byNumber.get(39)?.status).toBe("live");
    expect(byNumber.get(40)?.status).toBe("live");
    expect(byNumber.get(47)?.status).toBe("live");
    expect(byNumber.get(48)?.status).toBe("live");
    expect(byNumber.get(50)?.status).toBe("active");
    expect(byNumber.get(50)?.blocker).toContain("provider gates");
    expect(plan.next.some((item) => item.status === "blocked")).toBe(true);
  });
});
