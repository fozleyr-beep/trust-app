import "server-only";
import {
  ensureAgentActionBaselines,
  listAgentActionsForUser,
} from "@/lib/agents/actions";
import { getServiceEntitlement } from "@/lib/billing/stripe";
import { listThreadsWithPeers } from "@/lib/db/threads";
import {
  getServiceProfile,
  listMatchSuggestions,
  listSalaamRequests,
} from "@/lib/service/operations";

export type PlatformStage = {
  href: string;
  label: string;
  owner: "Hafiz" | "Watim" | "Adil" | "Sabr" | "Sakinah";
  status: "complete" | "active" | "blocked";
  detail: string;
};

export async function getPlatformSnapshot(userId: string) {
  await ensureAgentActionBaselines(userId);
  const [profile, actions, entitlement, matches, salaams, threads] =
    await Promise.all([
      getServiceProfile(userId),
      listAgentActionsForUser(userId, 20),
      getServiceEntitlement(userId),
      listMatchSuggestions(userId),
      listSalaamRequests(userId),
      listThreadsWithPeers(userId),
    ]);

  const billingActive =
    entitlement?.status === "active" || entitlement?.status === "trialing";
  const pendingSalaams = salaams.filter((item) => item.status === "requested");
  const openSalaams = salaams.filter((item) => item.status === "accepted");

  const stages: PlatformStage[] = [
    {
      href: "/app/onboarding",
      label: "Profile intake",
      owner: "Hafiz",
      status: profile?.readiness === "ready" ? "complete" : "active",
      detail:
        profile?.readiness === "ready"
          ? "Consented profile state is saved."
          : "Save intent, location, family context, and consent.",
    },
    {
      href: "/app/verification",
      label: "Verification",
      owner: "Hafiz",
      status:
        actionStatus(actions, "hafiz.device.key") === "live"
          ? "complete"
          : "blocked",
      detail:
        actionStatus(actions, "hafiz.device.key") === "live"
          ? "Device key is present for encrypted room fanout."
          : "Register a device key and keep ID provider wiring launch-gated.",
    },
    {
      href: "/app/billing",
      label: "Service access",
      owner: "Sakinah",
      status: billingActive ? "complete" : "blocked",
      detail: billingActive
        ? "Service entitlement is active."
        : "Web billing is launch-gated; Android waits for Play Billing.",
    },
    {
      href: "/app/matches",
      label: "Shortlist",
      owner: "Watim",
      status: matches.length > 0 ? "active" : "blocked",
      detail:
        matches.length > 0
          ? `${matches.length} explainable suggestion(s) ready.`
          : "Watim will not fabricate candidates.",
    },
    {
      href: "/app/salaam",
      label: "Consent",
      owner: "Adil",
      status:
        openSalaams.length > 0
          ? "complete"
          : pendingSalaams.length > 0
            ? "active"
            : "blocked",
      detail:
        openSalaams.length > 0
          ? "At least one room opened by mutual consent."
          : pendingSalaams.length > 0
            ? `${pendingSalaams.length} salaam request(s) awaiting consent.`
            : "No active salaam yet.",
    },
    {
      href: "/app/threads",
      label: "Encrypted rooms",
      owner: "Adil",
      status: threads.length > 0 ? "active" : "blocked",
      detail:
        threads.length > 0
          ? `${threads.length} encrypted room(s) available.`
          : "Rooms open only after consent or manual invite.",
    },
  ];

  return {
    actions,
    entitlement,
    matches,
    pendingSalaams,
    profile,
    salaams,
    stages,
    threads,
    readiness: Math.round(
      (stages.filter((stage) => stage.status !== "blocked").length /
        stages.length) *
        100,
    ),
  };
}

function actionStatus(
  actions: { key: string; status: string }[],
  key: string,
): string | null {
  return actions.find((action) => action.key === key)?.status ?? null;
}
