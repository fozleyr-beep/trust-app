import { describe, expect, it } from "vitest";
import { getProfileCompleteness } from "@/lib/service/profile-completeness";
import { explainMatchSuggestion } from "@/lib/service/match-explainability";
import {
  isSalaamExpired,
  nextWeekStartIso,
  salaamExpiresAt,
} from "@/lib/service/salaam-policy";

describe("service flow hardening", () => {
  it("scores profile completeness before matching", () => {
    expect(getProfileCompleteness(null)).toMatchObject({
      percent: 0,
      readyForMatching: false,
    });
    expect(
      getProfileCompleteness({
        id: "p1",
        role: "seeker",
        readiness: "ready",
        location: "Dhaka",
        intent: "marriage",
        familyContext: "wali aware",
        preferences: "values aligned",
        privacyConsentAt: "2026-05-05T00:00:00.000Z",
        updatedAt: "2026-05-05T00:00:00.000Z",
      }),
    ).toMatchObject({ percent: 100, readyForMatching: true });
  });

  it("creates visible match evidence chips", () => {
    expect(
      explainMatchSuggestion({
        id: "m1",
        candidateUserId: "u2",
        context: "Dhaka · marriage",
        createdAt: "2026-05-05T00:00:00.000Z",
        evidence: [],
        label: "candidate",
        reason:
          "Both profiles have consented intake state; Watim can show this as a small, explainable suggestion.",
        status: "suggested",
        updatedAt: "2026-05-05T00:00:00.000Z",
      }),
    ).toEqual([
      "verified candidate",
      "Dhaka",
      "marriage",
      "consented intake",
      "bounded shortlist",
    ]);
  });

  it("computes salaam expiry and weekly reset", () => {
    const updated = new Date("2026-05-05T00:00:00.000Z");
    expect(salaamExpiresAt(updated, "requested")).toBe(
      "2026-05-12T00:00:00.000Z",
    );
    expect(
      isSalaamExpired(
        updated,
        "requested",
        new Date("2026-05-12T00:00:00.000Z"),
      ),
    ).toBe(true);
    expect(nextWeekStartIso(new Date("2026-05-05T00:00:00.000Z"))).toBe(
      "2026-05-11",
    );
  });
});
