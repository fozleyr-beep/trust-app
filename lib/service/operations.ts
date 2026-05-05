import "server-only";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  ensureAgentActionBaselines,
  listAgentActionsForUser,
  recordAgentAction,
  type AgentActionView,
} from "@/lib/agents/actions";
import type {
  MatchResponseInput,
  RunServiceAgentsInput,
  SalaamResponseInput,
  ServiceProfileInput,
} from "@/lib/api/schemas";

export class ServiceOperationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type ServiceProfileView = {
  id: string;
  role: string;
  readiness: string;
  location: string | null;
  intent: string | null;
  familyContext: string | null;
  preferences: string | null;
  privacyConsentAt: string | null;
  updatedAt: string;
};

export type MatchSuggestionView = {
  id: string;
  label: string;
  context: string;
  reason: string;
  status: string;
  candidateUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalaamRequestView = {
  id: string;
  status: string;
  requesterStatus: string;
  recipientStatus: string;
  side: "requester" | "recipient";
  counterpartyEmail: string;
  threadId: string | null;
  updatedAt: string;
};

export type SalaamQuotaView = {
  limit: number;
  sent: number;
  left: number;
  weekStart: string;
};

const SALAAM_WEEKLY_LIMIT = 3;

export async function getServiceProfile(
  userId: string,
): Promise<ServiceProfileView | null> {
  const [row] = await db()
    .select()
    .from(schema.serviceProfiles)
    .where(eq(schema.serviceProfiles.userId, userId))
    .limit(1);
  return row ? toProfileView(row) : null;
}

export async function saveServiceProfile(
  userId: string,
  input: ServiceProfileInput,
): Promise<ServiceProfileView> {
  const readiness = input.privacyConsent ? "ready" : "needs_consent";
  const [row] = await db()
    .insert(schema.serviceProfiles)
    .values({
      userId,
      role: input.role,
      readiness,
      location: input.location,
      intent: input.intent,
      familyContext: input.familyContext,
      preferences: input.preferences,
      privacyConsentAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.serviceProfiles.userId,
      set: {
        role: input.role,
        readiness,
        location: input.location,
        intent: input.intent,
        familyContext: input.familyContext,
        preferences: input.preferences,
        privacyConsentAt: new Date(),
        updatedAt: sql`now()`,
      },
    })
    .returning();

  await recordAgentAction({
    userId,
    key: "hafiz.intake.packet",
    agentId: "hafiz",
    status: "live",
    action: "intake packet saved",
    subject: "onboarding",
    detail:
      "Hafiz has enough consented profile state to begin the zero-human service path.",
  });

  return toProfileView(row);
}

export async function runServiceAgents(
  userId: string,
  input: RunServiceAgentsInput = {},
): Promise<{
  actions: AgentActionView[];
  matches: MatchSuggestionView[];
  profile: ServiceProfileView | null;
}> {
  await ensureAgentActionBaselines(userId);
  const requested = input.agentId;
  if (!requested || requested === "hafiz") await runHafiz(userId);
  if (!requested || requested === "watim") await runWatim(userId);
  if (!requested || requested === "adil") await runAdil(userId);
  if (!requested || requested === "sabr") await runSabr(userId);
  return {
    actions: await listAgentActionsForUser(userId),
    matches: await listMatchSuggestions(userId),
    profile: await getServiceProfile(userId),
  };
}

export async function listMatchSuggestions(
  userId: string,
): Promise<MatchSuggestionView[]> {
  const rows = await db()
    .select()
    .from(schema.matchSuggestions)
    .where(
      and(
        eq(schema.matchSuggestions.userId, userId),
        inArray(schema.matchSuggestions.status, [
          "suggested",
          "salaam_requested",
        ]),
      ),
    )
    .orderBy(desc(schema.matchSuggestions.updatedAt))
    .limit(12);
  return rows.map(toMatchSuggestionView);
}

export async function respondToMatchSuggestion(
  userId: string,
  suggestionId: string,
  input: MatchResponseInput,
): Promise<{ match: MatchSuggestionView; salaam?: SalaamRequestView }> {
  const [match] = await db()
    .select()
    .from(schema.matchSuggestions)
    .where(
      and(
        eq(schema.matchSuggestions.id, suggestionId),
        eq(schema.matchSuggestions.userId, userId),
      ),
    )
    .limit(1);
  if (!match) throw new ServiceOperationError(404, "match suggestion not found");

  if (input.response === "dismiss") {
    const [updated] = await db()
      .update(schema.matchSuggestions)
      .set({ status: "dismissed", updatedAt: sql`now()` })
      .where(eq(schema.matchSuggestions.id, suggestionId))
      .returning();
    await recordAgentAction({
      userId,
      key: `watim.match.${suggestionId}`,
      agentId: "watim",
      status: "live",
      action: "match dismissed",
      subject: "matching",
      detail: "Watim removed the suggestion without opening a room.",
    });
    return { match: toMatchSuggestionView(updated) };
  }

  if (!match.candidateUserId) {
    throw new ServiceOperationError(
      409,
      "this suggestion has no verified candidate",
    );
  }

  const existingSalaam = await db()
    .select({ id: schema.salaamRequests.id })
    .from(schema.salaamRequests)
    .where(eq(schema.salaamRequests.matchSuggestionId, match.id))
    .limit(1);
  if (existingSalaam.length === 0) {
    await reserveSalaamQuota(userId);
  }

  const [salaam] = await db()
    .insert(schema.salaamRequests)
    .values({
      matchSuggestionId: match.id,
      requesterId: userId,
      recipientId: match.candidateUserId,
      requesterStatus: "accepted",
      recipientStatus: "pending",
      status: "requested",
    })
    .onConflictDoUpdate({
      target: schema.salaamRequests.matchSuggestionId,
      set: {
        requesterStatus: "accepted",
        recipientStatus: "pending",
        status: "requested",
        updatedAt: sql`now()`,
      },
    })
    .returning();

  const [updatedMatch] = await db()
    .update(schema.matchSuggestions)
    .set({ status: "salaam_requested", updatedAt: sql`now()` })
    .where(eq(schema.matchSuggestions.id, suggestionId))
    .returning();

  await recordAgentAction({
    userId,
    key: `adil.salaam.${salaam.id}`,
    agentId: "adil",
    status: "live",
    action: "salaam requested",
    subject: "salaam",
    detail: "Adil is holding the room closed until the other side accepts.",
  });

  return {
    match: toMatchSuggestionView(updatedMatch),
    salaam: (await listSalaamRequests(userId)).find((s) => s.id === salaam.id),
  };
}

export async function getSalaamQuotaStatus(
  userId: string,
  now = new Date(),
): Promise<SalaamQuotaView> {
  const weekStart = weekStartIso(now);
  const [row] = await db()
    .select()
    .from(schema.salaamQuota)
    .where(
      and(
        eq(schema.salaamQuota.userId, userId),
        eq(schema.salaamQuota.weekStart, weekStart),
      ),
    )
    .limit(1);
  const sent = row?.sentCount ?? 0;
  return {
    limit: SALAAM_WEEKLY_LIMIT,
    sent,
    left: Math.max(0, SALAAM_WEEKLY_LIMIT - sent),
    weekStart,
  };
}

export async function listSalaamRequests(
  userId: string,
): Promise<SalaamRequestView[]> {
  const rows = await db()
    .select({
      id: schema.salaamRequests.id,
      requesterId: schema.salaamRequests.requesterId,
      recipientId: schema.salaamRequests.recipientId,
      requesterStatus: schema.salaamRequests.requesterStatus,
      recipientStatus: schema.salaamRequests.recipientStatus,
      status: schema.salaamRequests.status,
      threadId: schema.salaamRequests.threadId,
      updatedAt: schema.salaamRequests.updatedAt,
      requesterEmail: schema.users.email,
    })
    .from(schema.salaamRequests)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.salaamRequests.requesterId),
    )
    .where(
      or(
        eq(schema.salaamRequests.requesterId, userId),
        eq(schema.salaamRequests.recipientId, userId),
      ),
    )
    .orderBy(desc(schema.salaamRequests.updatedAt))
    .limit(20);

  const recipientIds = rows.map((r) => r.recipientId);
  const recipients =
    recipientIds.length === 0
      ? []
      : await db()
          .select({ id: schema.users.id, email: schema.users.email })
          .from(schema.users)
          .where(inArray(schema.users.id, recipientIds));
  const emailById = new Map(recipients.map((r) => [r.id, r.email]));

  return rows.map((row) => {
    const side = row.requesterId === userId ? "requester" : "recipient";
    return {
      id: row.id,
      status: row.status,
      requesterStatus: row.requesterStatus,
      recipientStatus: row.recipientStatus,
      side,
      counterpartyEmail:
        side === "requester"
          ? (emailById.get(row.recipientId) ?? "private candidate")
          : row.requesterEmail,
      threadId: row.threadId,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function respondToSalaamRequest(
  userId: string,
  salaamId: string,
  input: SalaamResponseInput,
): Promise<SalaamRequestView> {
  const [row] = await db()
    .select()
    .from(schema.salaamRequests)
    .where(eq(schema.salaamRequests.id, salaamId))
    .limit(1);
  if (!row) throw new ServiceOperationError(404, "salaam request not found");
  if (row.requesterId !== userId && row.recipientId !== userId) {
    throw new ServiceOperationError(404, "salaam request not found");
  }

  const isRequester = row.requesterId === userId;
  const requesterStatus =
    input.response === "decline"
      ? isRequester
        ? "declined"
        : row.requesterStatus
      : isRequester
        ? "accepted"
        : row.requesterStatus;
  const recipientStatus =
    input.response === "decline"
      ? isRequester
        ? row.recipientStatus
        : "declined"
      : isRequester
        ? row.recipientStatus
        : "accepted";
  const accepted =
    requesterStatus === "accepted" && recipientStatus === "accepted";
  const status = input.response === "decline" ? "declined" : accepted ? "accepted" : "requested";

  let threadId = row.threadId;
  if (accepted && !threadId) {
    threadId = await createConsentThread({
      requesterId: row.requesterId,
      recipientId: row.recipientId,
    });
  }

  const [updated] = await db()
    .update(schema.salaamRequests)
    .set({
      requesterStatus,
      recipientStatus,
      status,
      threadId,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.salaamRequests.id, salaamId))
    .returning();

  await recordAgentAction({
    userId,
    key: `adil.salaam.${salaamId}`,
    agentId: "adil",
    status: accepted ? "live" : "ready",
    action: accepted ? "room opened by mutual consent" : "salaam updated",
    subject: "salaam",
    detail: accepted
      ? "Adil opened an encrypted room only after both sides accepted."
      : "Adil kept the room closed because mutual consent is not complete.",
  });

  const view = (await listSalaamRequests(userId)).find((s) => s.id === updated.id);
  if (!view) throw new ServiceOperationError(404, "salaam request not found");
  return view;
}

async function runHafiz(userId: string): Promise<void> {
  const profile = await getServiceProfile(userId);
  const devices = await db()
    .select({ id: schema.deviceKeys.id })
    .from(schema.deviceKeys)
    .where(eq(schema.deviceKeys.userId, userId))
    .limit(1);

  await recordAgentAction({
    userId,
    key: "hafiz.profile.readiness",
    agentId: "hafiz",
    status: profile?.readiness === "ready" ? "live" : "gate",
    action:
      profile?.readiness === "ready"
        ? "profile readiness confirmed"
        : "profile intake missing",
    subject: "onboarding",
    detail:
      profile?.readiness === "ready"
        ? "Hafiz can use consented profile state without asking a coordinator for follow-up."
        : "Save location, intent, and privacy consent before agents can operate.",
  });

  await recordAgentAction({
    userId,
    key: "hafiz.device.key",
    agentId: "hafiz",
    status: devices.length > 0 ? "live" : "gate",
    action: devices.length > 0 ? "device key present" : "device key missing",
    subject: "verification",
    detail:
      devices.length > 0
        ? "This account has a public device key for encrypted room fanout."
        : "Register a device key before private rooms can be useful.",
  });
}

async function runWatim(userId: string): Promise<void> {
  const profile = await getServiceProfile(userId);
  if (profile?.readiness !== "ready") {
    await recordAgentAction({
      userId,
      key: "watim.shortlist.reason",
      agentId: "watim",
      status: "gate",
      action: "shortlist blocked by incomplete intake",
      subject: "matching",
      detail: "Watim will not create a shortlist until Hafiz has intake consent.",
    });
    return;
  }

  const candidates = await db()
    .select({
      userId: schema.serviceProfiles.userId,
      email: schema.users.email,
      location: schema.serviceProfiles.location,
      intent: schema.serviceProfiles.intent,
      preferences: schema.serviceProfiles.preferences,
    })
    .from(schema.serviceProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.serviceProfiles.userId))
    .where(
      and(
        eq(schema.serviceProfiles.readiness, "ready"),
        ne(schema.serviceProfiles.userId, userId),
      ),
    )
    .limit(3);

  if (candidates.length === 0) {
    await recordAgentAction({
      userId,
      key: "watim.shortlist.reason",
      agentId: "watim",
      status: "gate",
      action: "not enough verified candidates",
      subject: "matching",
      detail:
        "Watim did not fabricate matches. More consented profiles are needed before a shortlist appears.",
    });
    return;
  }

  for (const candidate of candidates) {
    await db()
      .insert(schema.matchSuggestions)
      .values({
        userId,
        candidateUserId: candidate.userId,
        label: candidate.email.split("@")[0] ?? "Private candidate",
        context: [candidate.location, candidate.intent].filter(Boolean).join(" · "),
        reason:
          "Both profiles have consented intake state; Watim can show this as a small, explainable suggestion.",
        status: "suggested",
      })
      .onConflictDoUpdate({
        target: [
          schema.matchSuggestions.userId,
          schema.matchSuggestions.candidateUserId,
        ],
        set: {
          context: [candidate.location, candidate.intent]
            .filter(Boolean)
            .join(" · "),
          reason:
            "Both profiles have consented intake state; Watim can show this as a small, explainable suggestion.",
          status: "suggested",
          updatedAt: sql`now()`,
        },
      });
  }

  await recordAgentAction({
    userId,
    key: "watim.shortlist.reason",
    agentId: "watim",
    status: "live",
    action: "shortlist prepared",
    subject: "matching",
    detail: `Watim prepared ${candidates.length} explainable suggestion(s), capped to avoid a swipe feed.`,
  });
}

async function runAdil(userId: string): Promise<void> {
  const salaams = await listSalaamRequests(userId);
  const open = salaams.find((item) => item.status === "accepted");
  const pending = salaams.find((item) => item.status === "requested");
  await recordAgentAction({
    userId,
    key: "adil.salaam.consent",
    agentId: "adil",
    status: open ? "live" : "ready",
    action: open
      ? "mutual consent room exists"
      : pending
        ? "salaam waiting for mutual consent"
        : "consent before room",
    subject: "salaam",
    detail: open
      ? "At least one room was opened only after both sides accepted."
      : "Rooms stay closed until both sides explicitly accept a salaam.",
  });
}

async function runSabr(userId: string): Promise<void> {
  const salaams = await listSalaamRequests(userId);
  const pendingCount = salaams.filter((item) => item.status === "requested").length;
  await recordAgentAction({
    userId,
    key: "sabr.pressure.flags",
    agentId: "sabr",
    status: "live",
    action: pendingCount > 0 ? "pressure watch active" : "safety state visible",
    subject: "safety",
    detail:
      pendingCount > 0
        ? `${pendingCount} pending salaam request(s) are visible so pressure does not become hidden staff work.`
        : "Sabr has a visible safety ledger without reading encrypted room plaintext.",
  });
}

async function createConsentThread({
  requesterId,
  recipientId,
}: {
  requesterId: string;
  recipientId: string;
}): Promise<string> {
  const [thread] = await db()
    .insert(schema.threads)
    .values({ createdBy: requesterId })
    .returning({ id: schema.threads.id });
  await db()
    .insert(schema.threadMembers)
    .values([
      { threadId: thread.id, userId: requesterId, role: "participant" },
      { threadId: thread.id, userId: recipientId, role: "participant" },
    ])
    .onConflictDoNothing();
  return thread.id;
}

async function reserveSalaamQuota(userId: string): Promise<void> {
  const weekStart = weekStartIso();
  const quota = await getSalaamQuotaStatus(userId);
  if (quota.sent >= SALAAM_WEEKLY_LIMIT) {
    throw new ServiceOperationError(
      429,
      "weekly salaam quota reached; wait until next week",
    );
  }
  await db()
    .insert(schema.salaamQuota)
    .values({
      userId,
      weekStart,
      sentCount: 1,
    })
    .onConflictDoUpdate({
      target: [schema.salaamQuota.userId, schema.salaamQuota.weekStart],
      set: {
        sentCount: sql`${schema.salaamQuota.sentCount} + 1`,
      },
    });
}

export function weekStartIso(now = new Date()): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date.toISOString().slice(0, 10);
}

function toProfileView(row: schema.ServiceProfile): ServiceProfileView {
  return {
    id: row.id,
    role: row.role,
    readiness: row.readiness,
    location: row.location,
    intent: row.intent,
    familyContext: row.familyContext,
    preferences: row.preferences,
    privacyConsentAt: row.privacyConsentAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMatchSuggestionView(
  row: schema.MatchSuggestion,
): MatchSuggestionView {
  return {
    id: row.id,
    label: row.label,
    context: row.context,
    reason: row.reason,
    status: row.status,
    candidateUserId: row.candidateUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
