import {
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Messaging schema. Server stores ciphertext bytes only — no plaintext, no
// keys that decrypt user-to-user messages, no sealed-sender (sender id is on
// the row by design so authz can enforce thread membership on send).

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

// ─── users (PR-02) ─────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── device_keys ───────────────────────────────────────────────────────
// One row per device per user. publicKey is the X25519 box pub.
// The private key never leaves the device; we never see it. Device-scoped
// (not per-user) so a user can have multiple active devices and send
// fan-outs encrypted per device.
export const deviceKeys = pgTable(
  "device_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    publicKey: bytea("public_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    userDeviceUnique: index("device_keys_user_device_idx").on(
      t.userId,
      t.deviceId,
    ),
  }),
);

// ─── threads ───────────────────────────────────────────────────────────
export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // No subject/title persisted — that's part of the encrypted message stream
  // in the messaging UX. Server holds id + members + timestamps only.
});

// ─── thread_members ────────────────────────────────────────────────────
export const threadMembers = pgTable(
  "thread_members",
  {
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.threadId, t.userId] }),
  }),
);

// ─── messages ──────────────────────────────────────────────────────────
// One row per (sender → recipient_device) ciphertext. crypto_box ciphertext
// is per-recipient-key, so a thread of N members produces N copies on send.
// Server sees: who, when, ciphertext-size, recipient device. Server does
// NOT see: plaintext, sender's private key, message subject, attachments
// metadata that's inside the encrypted payload.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    recipientDeviceKeyId: uuid("recipient_device_key_id")
      .notNull()
      .references(() => deviceKeys.id),
    ciphertext: bytea("ciphertext").notNull(),
    nonce: bytea("nonce").notNull(),
    cipherSize: integer("cipher_size").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    threadIdx: index("messages_thread_sent_idx").on(t.threadId, t.sentAt),
    recipientIdx: index("messages_recipient_device_idx").on(
      t.recipientDeviceKeyId,
    ),
  }),
);

// ─── service_entitlements ─────────────────────────────────────────────
// One row per user for the zero-human service gate. Stripe webhooks update
// this row; app routes can read it without calling Stripe synchronously.
export const serviceEntitlements = pgTable(
  "service_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("inactive"),
    source: text("source").notNull().default("stripe"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("service_entitlements_user_idx").on(t.userId),
    stripeCustomerIdx: index("service_entitlements_stripe_customer_idx").on(
      t.stripeCustomerId,
    ),
    stripeSubscriptionIdx: index(
      "service_entitlements_stripe_subscription_idx",
    ).on(t.stripeSubscriptionId),
  }),
);

// ─── billing_events ───────────────────────────────────────────────────
// Idempotency ledger for Stripe webhooks. The raw event payload is kept for
// operational audit, not as a product-facing profile field.
export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull().default("stripe"),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    payload: text("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    providerEventUnique: uniqueIndex("billing_events_provider_event_idx").on(
      t.provider,
      t.eventId,
    ),
  }),
);

// ─── agent_actions ────────────────────────────────────────────────────
// Per-user operating ledger for the four named service agents. This stores
// product-state decisions, not encrypted-room content and not raw ID evidence.
export const agentActions = pgTable(
  "agent_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    agent: text("agent").notNull(),
    status: text("status").notNull().default("ready"),
    action: text("action").notNull(),
    subject: text("subject"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userKeyUnique: uniqueIndex("agent_actions_user_key_idx").on(
      t.userId,
      t.key,
    ),
    userCreatedIdx: index("agent_actions_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    agentStatusIdx: index("agent_actions_agent_status_idx").on(
      t.agent,
      t.status,
    ),
  }),
);

// ─── relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  devices: many(deviceKeys),
  threadsCreated: many(threads),
  memberships: many(threadMembers),
  messagesSent: many(messages),
  agentActions: many(agentActions),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  creator: one(users, {
    fields: [threads.createdBy],
    references: [users.id],
  }),
  members: many(threadMembers),
  messages: many(messages),
}));

export const threadMembersRelations = relations(threadMembers, ({ one }) => ({
  thread: one(threads, {
    fields: [threadMembers.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadMembers.userId],
    references: [users.id],
  }),
}));

export const deviceKeysRelations = relations(deviceKeys, ({ one }) => ({
  user: one(users, {
    fields: [deviceKeys.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipientDevice: one(deviceKeys, {
    fields: [messages.recipientDeviceKeyId],
    references: [deviceKeys.id],
  }),
}));

export const serviceEntitlementsRelations = relations(
  serviceEntitlements,
  ({ one }) => ({
    user: one(users, {
      fields: [serviceEntitlements.userId],
      references: [users.id],
    }),
  }),
);

export const agentActionsRelations = relations(agentActions, ({ one }) => ({
  user: one(users, {
    fields: [agentActions.userId],
    references: [users.id],
  }),
}));

// ─── inferred types ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type DeviceKey = typeof deviceKeys.$inferSelect;
export type NewDeviceKey = typeof deviceKeys.$inferInsert;
export type ServiceEntitlement = typeof serviceEntitlements.$inferSelect;
export type NewServiceEntitlement = typeof serviceEntitlements.$inferInsert;
export type BillingEvent = typeof billingEvents.$inferSelect;
export type NewBillingEvent = typeof billingEvents.$inferInsert;
export type AgentAction = typeof agentActions.$inferSelect;
export type NewAgentAction = typeof agentActions.$inferInsert;
