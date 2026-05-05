export type AgentStageState = "live" | "ready" | "gate";

export const sakinahAgents = [
  {
    id: "hafiz",
    name: "Hafiz",
    arabic: "الحافظ",
    role: "Verification guardian",
    status: "provider pending",
    promise: "Collects intake context and proves identity before access widens.",
    boundary: "Raw ID evidence must become a verification result, then leave the app.",
  },
  {
    id: "watim",
    name: "Watim",
    arabic: "الواطم",
    role: "Match reasoner",
    status: "design locked",
    promise: "Builds small, explainable shortlists instead of a swipe feed.",
    boundary: "No match is shown without a visible reason and next consent step.",
  },
  {
    id: "adil",
    name: "Adil",
    arabic: "العادل",
    role: "Consent keeper",
    status: "message boundary live",
    promise: "Turns interest into salaam, and salaam into a room only by consent.",
    boundary: "Family observers can witness; they cannot post or silently watch.",
  },
  {
    id: "sabr",
    name: "Sabr",
    arabic: "الصبر",
    role: "Pressure and safety guard",
    status: "design locked",
    promise: "Surfaces pressure, expiry, pause, and observer-boundary risks.",
    boundary: "Safety flags are visible as product states, not private staff notes.",
  },
] as const;

export type SakinahAgent = (typeof sakinahAgents)[number];
export type SakinahAgentId = SakinahAgent["id"];
export type SakinahAgentName = SakinahAgent["name"];

export const agentStageLabels: Record<AgentStageState, string> = {
  live: "live",
  ready: "operator-free design",
  gate: "launch gate",
};

export const serviceStages = [
  {
    n: "01",
    agentId: "hafiz",
    title: "Onboard",
    href: "/app/onboarding",
    state: "ready",
    body: "Profile, intent, family context, and voice intake without a coordinator call.",
  },
  {
    n: "02",
    agentId: "hafiz",
    title: "Verify",
    href: "/app/verification",
    state: "gate",
    body: "Identity, liveness, contact, and family-link checks. Provider wiring is the launch gate.",
  },
  {
    n: "03",
    agentId: "sabr",
    title: "Bill",
    href: "/app/billing",
    state: "gate",
    body: "Self-serve checkout and billing portal. No sales call, no invoice chase.",
  },
  {
    n: "04",
    agentId: "watim",
    title: "Match",
    href: "/app/matches",
    state: "ready",
    body: "A small shortlist with the reason each person is being shown.",
  },
  {
    n: "05",
    agentId: "adil",
    title: "Salaam",
    href: "/app/salaam",
    state: "ready",
    body: "Mutual consent before a room opens. Observers can witness; they cannot post.",
  },
  {
    n: "06",
    agentId: "sabr",
    title: "Family",
    href: "/app/family",
    state: "live",
    body: "Read-only family observer model. Server-side role enforcement blocks observer posting.",
  },
] as const satisfies ReadonlyArray<{
  n: string;
  agentId: SakinahAgentId;
  title: string;
  href: string;
  state: AgentStageState;
  body: string;
}>;

export const agentActionBaselines = [
  {
    key: "hafiz.intake.packet",
    agentId: "hafiz",
    status: "ready",
    action: "intake packet prepared",
    subject: "onboarding",
    detail: "Profile, intent, family context, and contact channels can start without a coordinator.",
  },
  {
    key: "hafiz.identity.provider",
    agentId: "hafiz",
    status: "gate",
    action: "identity provider pending",
    subject: "verification",
    detail: "Provider-backed ID and liveness checks are not enabled yet.",
  },
  {
    key: "watim.shortlist.reason",
    agentId: "watim",
    status: "ready",
    action: "shortlist reason visible",
    subject: "matching",
    detail: "Match cards must show why a person is being introduced.",
  },
  {
    key: "adil.salaam.consent",
    agentId: "adil",
    status: "ready",
    action: "consent before room",
    subject: "salaam",
    detail: "Rooms open after mutual salaam, not after unilateral interest.",
  },
  {
    key: "sabr.observer.boundary",
    agentId: "sabr",
    status: "live",
    action: "observer enforcement active",
    subject: "family",
    detail: "Family observers are read-only members; server-side messaging authz blocks posting.",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  agentId: SakinahAgentId;
  status: AgentStageState;
  action: string;
  subject: string;
  detail: string;
}>;

export function getAgent(id: SakinahAgentId): SakinahAgent {
  const agent = sakinahAgents.find((item) => item.id === id);
  if (!agent) throw new Error(`Unknown Sakinah agent: ${id}`);
  return agent;
}

export function agentName(id: SakinahAgentId): SakinahAgentName {
  return getAgent(id).name;
}
