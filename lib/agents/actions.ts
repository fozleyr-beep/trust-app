import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  agentActionBaselines,
  getAgent,
  type AgentStageState,
  type SakinahAgentId,
} from "@/lib/agents/registry";

export type AgentActionView = {
  id: string;
  key: string;
  agentId: SakinahAgentId;
  agentName: string;
  status: AgentStageState;
  action: string;
  subject: string | null;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function ensureAgentActionBaselines(userId: string) {
  const conn = db();
  await Promise.all(
    agentActionBaselines.map((item) =>
      conn
        .insert(schema.agentActions)
        .values({
          userId,
          key: item.key,
          agent: item.agentId,
          status: item.status,
          action: item.action,
          subject: item.subject,
          detail: item.detail,
        })
        .onConflictDoUpdate({
          target: [schema.agentActions.userId, schema.agentActions.key],
          set: {
            agent: item.agentId,
            status: item.status,
            action: item.action,
            subject: item.subject,
            detail: item.detail,
            updatedAt: sql`now()`,
          },
        }),
    ),
  );
}

export async function listAgentActionsForUser(
  userId: string,
  limit = 12,
): Promise<AgentActionView[]> {
  const rows = await db()
    .select()
    .from(schema.agentActions)
    .where(eq(schema.agentActions.userId, userId))
    .orderBy(desc(schema.agentActions.updatedAt))
    .limit(limit);
  return rows.map(toView);
}

export async function recordAgentAction({
  userId,
  key,
  agentId,
  status,
  action,
  subject,
  detail,
}: {
  userId: string;
  key: string;
  agentId: SakinahAgentId;
  status: AgentStageState;
  action: string;
  subject?: string;
  detail?: string;
}): Promise<AgentActionView> {
  getAgent(agentId);
  const [row] = await db()
    .insert(schema.agentActions)
    .values({
      userId,
      key,
      agent: agentId,
      status,
      action,
      subject,
      detail,
    })
    .onConflictDoUpdate({
      target: [schema.agentActions.userId, schema.agentActions.key],
      set: {
        agent: agentId,
        status,
        action,
        subject,
        detail,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return toView(row);
}

function toView(row: schema.AgentAction): AgentActionView {
  const agentId = row.agent as SakinahAgentId;
  const agent = getAgent(agentId);
  return {
    id: row.id,
    key: row.key,
    agentId,
    agentName: agent.name,
    status: row.status as AgentStageState,
    action: row.action,
    subject: row.subject,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
