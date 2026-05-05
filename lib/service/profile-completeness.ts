import type { ServiceProfileView } from "@/lib/service/operations";

export type ProfileCompleteness = {
  percent: number;
  complete: string[];
  missing: string[];
  readyForMatching: boolean;
};

const checks = [
  ["role", "Role"],
  ["location", "City or region"],
  ["intent", "Intent"],
  ["familyContext", "Family context"],
  ["preferences", "Match preferences"],
  ["privacyConsentAt", "Privacy consent"],
] as const;

export function getProfileCompleteness(
  profile: ServiceProfileView | null,
): ProfileCompleteness {
  if (!profile) {
    return {
      percent: 0,
      complete: [],
      missing: checks.map(([, label]) => label),
      readyForMatching: false,
    };
  }

  const complete: string[] = [];
  const missing: string[] = [];
  for (const [key, label] of checks) {
    const value = profile[key];
    if (typeof value === "string" ? value.trim().length > 0 : Boolean(value)) {
      complete.push(label);
    } else {
      missing.push(label);
    }
  }

  return {
    percent: Math.round((complete.length / checks.length) * 100),
    complete,
    missing,
    readyForMatching: missing.length === 0 && profile.readiness === "ready",
  };
}
