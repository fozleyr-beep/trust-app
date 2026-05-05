import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  dirForLocale,
  isLocale,
  locales,
} from "@/lib/i18n/routing";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("PR-01 v7 foundation", () => {
  it("keeps the v7 handoff and canvas in the repo", () => {
    expect(read("CODEX_HANDOFF.yaml")).toContain("v7");
    expect(read("CODEX_PROMPT.md")).toContain("SYSTEM MESSAGE");
    expect(existsSync(join(root, "Sakinah v7.html"))).toBe(true);
  });

  it("scaffolds bilingual routing with RTL support", () => {
    expect(locales).toEqual(["en", "ar"]);
    expect(defaultLocale).toBe("en");
    expect(isLocale("ar")).toBe(true);
    expect(dirForLocale("ar")).toBe("rtl");
    expect(read("i18n/request.ts")).toContain("next-intl/server");
    expect(read("app/layout.tsx")).toContain("dirForLocale");
  });

  it("adds the v7 additive schema contracts", () => {
    const schema = read("lib/db/schema.ts");
    for (const table of [
      "family_link",
      "interest",
      "salaam_quota",
      "audit_event",
      "consent_grant",
      "wali_digest",
      "wali_note",
      "sabr_event",
      "donation",
    ]) {
      expect(schema).toContain(table);
    }
    expect(schema).toContain('role: text("role")');
    expect(schema).toContain("layerPublic");
    expect(schema).toContain("sabrStatus");
  });

  it("wraps Twilio Verify behind explicit env gates", () => {
    const wrapper = read("lib/auth/twilio-verify.ts");
    const example = read(".env.example");
    for (const key of [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
    ]) {
      expect(wrapper).toContain(key);
      expect(example).toContain(key);
    }
    expect(wrapper).toContain("isTwilioVerifyConfigured");
  });

  it("installs lint and e2e guardrails for the design contract", () => {
    expect(read("eslint.config.mjs")).toContain("sakinah/trust-chip-contract");
    expect(read("scripts/eslint-sakinah-rules.mjs")).toContain(
      "no-verified-component",
    );
    expect(read("package.json")).toContain("playwright test");
    expect(read("playwright.config.ts")).toContain("tests/e2e");
  });
});
