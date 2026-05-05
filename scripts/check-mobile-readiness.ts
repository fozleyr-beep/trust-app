import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type Status = "ok" | "warn" | "fail";

type Check = {
  detail: string;
  name: string;
  status: Status;
};

const root = process.cwd();

function fileContains(path: string, needle: string): Check {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    return { name: path, status: "fail", detail: "missing" };
  }
  const text = readFileSync(fullPath, "utf8");
  if (!text.includes(needle)) {
    return { name: path, status: "fail", detail: `missing ${needle}` };
  }
  return { name: path, status: "ok", detail: `contains ${needle}` };
}

function envCheck(): Check {
  if (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      name: "env: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
      status: "ok",
      detail: "set for Expo runtime",
    };
  }

  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      name: "env: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
      status: "warn",
      detail:
        "missing; copy the web publishable key into Expo env before device QA",
    };
  }

  return {
    name: "env: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    status: "fail",
    detail: "missing; Clerk native auth cannot mount on device",
  };
}

function render(checks: Check[]): void {
  const icon: Record<Status, string> = { fail: "x", ok: "✓", warn: "·" };
  const pad = Math.max(...checks.map((check) => check.name.length));
  for (const check of checks) {
    console.log(
      `${icon[check.status]} ${check.name.padEnd(pad + 2)}${check.detail}`,
    );
  }
}

const checks: Check[] = [
  envCheck(),
  fileContains("mobile/App.tsx", "ClerkProvider"),
  fileContains("mobile/App.tsx", "signIn.password"),
  fileContains("mobile/App.tsx", "signUp.password"),
  fileContains("mobile/App.tsx", "OnboardingGate"),
  fileContains("mobile/App.tsx", "ServiceIntakeFlow"),
  fileContains("mobile/App.tsx", "AgentLedgerCards"),
  fileContains("mobile/App.tsx", "MatchReadinessCard"),
  fileContains("mobile/App.tsx", "DeviceKeyCard"),
  fileContains("mobile/App.tsx", "RoomsTab"),
  fileContains("mobile/src/crypto/deviceKeys.ts", "SecureStore"),
  fileContains("mobile/src/crypto/messaging.ts", "nacl.box"),
  fileContains("mobile/src/messaging/api.ts", "sendEncryptedMobileMessage"),
  fileContains("mobile/app.json", "\"permissions\": []"),
  fileContains("mobile/package.json", "\"@clerk/expo\""),
  fileContains("mobile/eas.json", "\"buildType\": \"app-bundle\""),
  fileContains("app/account/delete/page.tsx", "Delete"),
  fileContains("app/privacy/page.tsx", "Privacy"),
];

console.log("\nmobile readiness\n");
render(checks);

const failures = checks.filter((check) => check.status === "fail").length;
const warnings = checks.filter((check) => check.status === "warn").length;
console.log(`\n${failures} failure(s), ${warnings} warning(s)`);
process.exit(failures > 0 ? 1 : 0);
