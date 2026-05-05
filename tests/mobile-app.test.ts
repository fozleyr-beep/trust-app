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

  it("keeps mobile private keys in native secure storage", () => {
    const app = read("mobile/App.tsx");
    const deviceKeys = read("mobile/src/crypto/deviceKeys.ts");
    const messaging = read("mobile/src/crypto/messaging.ts");
    const pkg = read("mobile/package.json");
    expect(pkg).toContain('"tweetnacl"');
    expect(deviceKeys).toContain("expo-secure-store");
    expect(deviceKeys).toContain("registerMobileDeviceKey");
    expect(deviceKeys).toContain("/api/device-keys");
    expect(messaging).toContain("nacl.box");
    expect(messaging).toContain("decryptMobileMessage");
    expect(app).toContain("DeviceKeyCard");
  });

  it("wires a mobile encrypted rooms shell to the messaging APIs", () => {
    const app = read("mobile/App.tsx");
    const api = read("mobile/src/messaging/api.ts");
    expect(app).toContain("RoomsTab");
    expect(app).toContain("Load rooms");
    expect(app).toContain("Send encrypted");
    expect(api).toContain("/api/me/threads");
    expect(api).toContain("/recipient-keys");
    expect(api).toContain("/messages");
    expect(api).toContain("sendEncryptedMobileMessage");
    expect(api).toContain("encryptMobileMessage");
  });

  it("keeps Android payments conservative until Play Billing is implemented", () => {
    const policy = read("PAYMENTS_ANDROID.md");
    const mobilePolicy = read("mobile/src/payments/policy.ts");
    const app = read("mobile/App.tsx");
    expect(policy).toContain("Google Play Billing");
    expect(policy).toContain("must not expose an in-app Stripe checkout");
    expect(mobilePolicy).toContain("externalCheckoutAllowedInAndroid: false");
    expect(app).toContain("Google Play Billing required");
    expect(app).toContain("Stripe remains web-only");
  });

  it("keeps Play listing, QA, and release readiness artifacts", () => {
    const pkg = read("package.json");
    const listing = read("mobile/store/play-listing.json");
    const qa = read("mobile/store/internal-testing-qa.md");
    const releaseCheck = read("scripts/check-android-release-readiness.ts");
    expect(pkg).toContain("android:release-check");
    expect(listing).toContain("Sakinah.family");
    expect(listing).toContain("accountDeletionUrl");
    expect(qa).toContain("Android Internal Testing QA");
    expect(qa).toContain("Encrypted send");
    expect(releaseCheck).toContain("eas project id");
    expect(releaseCheck).toContain("api domain");
  });

  it("keeps Play artwork sources and screenshot plan in repo", () => {
    expect(existsSync(join(root, "mobile/assets/sakinah-icon.svg"))).toBe(true);
    expect(existsSync(join(root, "mobile/assets/feature-graphic.svg"))).toBe(true);
    expect(read("mobile/store/play-listing.json")).toContain("sakinah-icon.svg");
    expect(read("mobile/store/screenshot-plan.md")).toContain("Store tab");
  });

  it("documents the domain switch gate before changing mobile API base", () => {
    const domain = read("DOMAIN_ALIGNMENT.md");
    const app = read("mobile/app.json");
    expect(domain).toContain("sakinah.family/api/health");
    expect(domain).toContain("returns `200`");
    expect(app).toContain("https://sakinah.family");
  });
});
