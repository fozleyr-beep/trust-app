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

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as unknown;
}

function checkFile(path: string): Check {
  return existsSync(join(root, path))
    ? { name: path, status: "ok", detail: "present" }
    : { name: path, status: "fail", detail: "missing" };
}

function checkEasProjectId(): Check {
  const app = readJson("mobile/app.json") as {
    expo?: { extra?: { eas?: { projectId?: string } } };
  };
  const projectId = app.expo?.extra?.eas?.projectId;
  return projectId
    ? { name: "eas project id", status: "ok", detail: projectId }
    : {
        name: "eas project id",
        status: "warn",
        detail: "missing; run npx eas build:configure after Expo login",
      };
}

function checkLocalVersionSource(): Check {
  const eas = readJson("mobile/eas.json") as {
    cli?: { appVersionSource?: string };
  };
  return eas.cli?.appVersionSource === "local"
    ? { name: "eas app version source", status: "ok", detail: "local" }
    : {
        name: "eas app version source",
        status: "fail",
        detail: "set cli.appVersionSource to local before Play builds",
      };
}

function checkAndroidVersionCode(): Check {
  const app = readJson("mobile/app.json") as {
    expo?: { android?: { versionCode?: number } };
  };
  const versionCode = app.expo?.android?.versionCode;
  return Number.isInteger(versionCode) && Number(versionCode) > 0
    ? {
        name: "android versionCode",
        status: "ok",
        detail: String(versionCode),
      }
    : {
        name: "android versionCode",
        status: "fail",
        detail: "missing positive integer",
      };
}

function checkDomain(): Check {
  const app = readJson("mobile/app.json") as {
    expo?: { extra?: { apiBaseUrl?: string } };
  };
  const apiBaseUrl = app.expo?.extra?.apiBaseUrl;
  if (apiBaseUrl === "https://sakinah.family") {
    return { name: "api domain", status: "ok", detail: "sakinah.family" };
  }
  return {
    name: "api domain",
    status: "fail",
    detail: `currently ${apiBaseUrl ?? "unset"}; switch after domain points here`,
  };
}

function checkEnv(): Check {
  return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? {
        name: "expo clerk env",
        status: "ok",
        detail: "set",
      }
    : {
        name: "expo clerk env",
        status: "warn",
        detail: "missing; native auth will show the fallback gate",
      };
}

const checks: Check[] = [
  checkFile("mobile/store/play-listing.json"),
  checkFile("mobile/store/internal-testing-qa.md"),
  checkFile("PAYMENTS_ANDROID.md"),
  checkFile("DOMAIN_ALIGNMENT.md"),
  checkFile("mobile/assets/sakinah-icon.png"),
  checkFile("mobile/assets/adaptive-icon.png"),
  checkFile("mobile/assets/feature-graphic.png"),
  checkFile("app/privacy/page.tsx"),
  checkFile("app/account/delete/page.tsx"),
  checkEasProjectId(),
  checkLocalVersionSource(),
  checkAndroidVersionCode(),
  checkDomain(),
  checkEnv(),
];

for (const check of checks) {
  console.log(`${check.status.toUpperCase()} ${check.name}: ${check.detail}`);
}

const failures = checks.filter((check) => check.status === "fail").length;
const warnings = checks.filter((check) => check.status === "warn").length;
console.log(`${failures} failure(s), ${warnings} warning(s)`);
process.exit(failures > 0 ? 1 : 0);
