import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("v7 completion contract", () => {
  it("ships every PR-02 through PR-08 route family", () => {
    for (const path of [
      "app/for-families/page.tsx",
      "app/onboarding/[step]/page.tsx",
      "app/discovery/page.tsx",
      "app/profile/edit/page.tsx",
      "app/profile/preview/page.tsx",
      "app/thread/[id]/page.tsx",
      "app/observe/page.tsx",
      "app/observe/[thread_id]/page.tsx",
      "app/observe/notes/page.tsx",
      "app/observe/ask-watim/page.tsx",
      "app/settings/agents/page.tsx",
      "app/settings/audit/page.tsx",
      "app/settings/family-link/page.tsx",
      "app/invite/page.tsx",
      "app/admin/sabr/page.tsx",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }
  });

  it("locks the marketing visual primitives and family page", () => {
    const primitives = read("app/components/MarketingPrimitives.tsx");
    expect(primitives).toContain("function Girih");
    expect(primitives).toContain("function ArchFrame");
    expect(primitives).toContain("Only one BrassThread");
    expect(read("app/for-families/page.tsx")).toContain("Walis are free");
  });

  it("enforces photo, salaam, wali, and admin contracts in code", () => {
    expect(read("app/api/photos/[id]/route.ts")).toContain("status: 403");
    expect(read("app/api/photos/[id]/route.ts")).toContain(
      "verifyPhotoAccessToken",
    );
    expect(read("app/api/photos/[id]/route.ts")).toContain(
      "createR2SignedGetUrl",
    );
    expect(read("lib/service/operations.ts")).toContain(
      "weekly salaam quota reached",
    );
    expect(read("lib/service/wali-digest.ts")).toContain("ciphertextLike");
    expect(read("app/admin/sabr/page.tsx")).toContain('me.role !== "safety_reviewer"');
    expect(read("app/api/threads/[id]/messages/route.ts")).toContain(
      "senderRole",
    );
  });

  it("wires privacy-conserving observability and cron without observer funnels", () => {
    expect(read("lib/observability.ts")).toContain(
      'input.event.startsWith("observer.")',
    );
    expect(read("vercel.json")).toContain("/api/cron/wali-digest");
    expect(read(".env.example")).toContain("POSTHOG_KEY");
    expect(read(".env.example")).toContain("SENTRY_DSN");
  });
});
