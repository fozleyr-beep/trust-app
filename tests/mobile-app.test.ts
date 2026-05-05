import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("mobile app foundation", () => {
  it("keeps an Expo Android/iOS app scaffold in mobile/", () => {
    for (const path of [
      "mobile/App.tsx",
      "mobile/app.json",
      "mobile/eas.json",
      "mobile/package.json",
      "mobile/metro.config.js",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }
  });

  it("shares the canonical four-agent registry with the web app", () => {
    expect(read("mobile/App.tsx")).toContain("../lib/agents/registry");
    expect(read("mobile/metro.config.js")).toContain("watchFolders");
  });

  it("targets Android Play delivery first without closing the iOS path", () => {
    const app = read("mobile/app.json");
    const eas = read("mobile/eas.json");
    expect(app).toContain('"package": "family.sakinah.app"');
    expect(app).toContain('"bundleIdentifier": "family.sakinah.app"');
    expect(eas).toContain('"buildType": "app-bundle"');
    expect(eas).toContain('"track": "internal"');
  });

  it("keeps Play-required account and privacy links reachable", () => {
    const app = read("mobile/App.tsx");
    expect(existsSync(join(root, "app/privacy/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/account/delete/page.tsx"))).toBe(true);
    expect(read("middleware.ts")).toContain("/account/delete");
    expect(app).toContain("/account/delete");
    expect(app).toContain("/privacy");
    expect(app).toContain("/sign-in");
  });

  it("uses current Clerk Expo auth with secure native token persistence", () => {
    const app = read("mobile/App.tsx");
    const pkg = read("mobile/package.json");
    const config = read("mobile/app.json");
    expect(pkg).toContain('"@clerk/expo"');
    expect(pkg).not.toContain("@clerk/clerk-expo");
    expect(config).toContain('"@clerk/expo"');
    expect(config).toContain('"expo-secure-store"');
    expect(app).toContain("ClerkProvider");
    expect(app).toContain("@clerk/expo/token-cache");
    expect(app).toContain("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  });

  it("has native email/password sign-in and verified sign-up screens", () => {
    const app = read("mobile/App.tsx");
    expect(app).toContain("useSignIn");
    expect(app).toContain("useSignUp");
    expect(app).toContain("signIn.password");
    expect(app).toContain("signUp.password");
    expect(app).toContain("sendEmailCode");
    expect(app).toContain("verifyEmailCode");
    expect(app).toContain("TextInput");
  });

  it("has an Android auth QA readiness check", () => {
    const pkg = read("package.json");
    const check = read("scripts/check-mobile-readiness.ts");
    expect(pkg).toContain('"mobile:check"');
    expect(read(".env.example")).toContain("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(check).toContain("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    expect(check).toContain("mobile readiness");
    expect(check).toContain("permissions");
  });

  it("starts signed-in users with a consent-first onboarding gate", () => {
    const app = read("mobile/App.tsx");
    expect(app).toContain("OnboardingGate");
    expect(app).toContain("Start Sakinah");
    expect(app).toContain("Seeker");
    expect(app).toContain("Family");
    expect(app).toContain("Privacy consent is required");
    expect(app).toContain("Save onboarding");
  });

  it("puts service intake, agent ledger, and match readiness on mobile", () => {
    const app = read("mobile/App.tsx");
    expect(app).toContain("ServiceIntakeFlow");
    expect(app).toContain("MatchReadinessCard");
    expect(app).toContain("AgentLedgerCards");
    expect(app).toContain("agentActionBaselines");
    expect(app).toContain("Privacy consent accepted");
    expect(app).toContain("Watim may prepare an explainable shortlist");
  });
});
