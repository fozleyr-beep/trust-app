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
    role: text("role").notNull().default("participant"),
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

// ─── service_profiles ─────────────────────────────────────────────────
// Minimal zero-human service intake state. This intentionally stores user
// supplied profile facts, not identity evidence or encrypted-room content.
export const serviceProfiles = pgTable(
  "service_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("seeker"),
    readiness: text("readiness").notNull().default("needs_intake"),
    location: text("location"),
    intent: text("intent"),
    familyContext: text("family_context"),
    preferences: text("preferences"),
    privacyConsentAt: timestamp("privacy_consent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("service_profiles_user_idx").on(t.userId),
    readinessIdx: index("service_profiles_readiness_idx").on(t.readiness),
  }),
);

// ─── match_suggestions ────────────────────────────────────────────────
// Watim suggestions are bounded and explainable. candidateUserId is nullable
// so an audit row can still describe why no real candidate was shown.
export const matchSuggestions = pgTable(
  "match_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    candidateUserId: uuid("candidate_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    label: text("label").notNull(),
    context: text("context").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("suggested"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userStatusIdx: index("match_suggestions_user_status_idx").on(
      t.userId,
      t.status,
    ),
    userCandidateUnique: uniqueIndex(
      "match_suggestions_user_candidate_idx",
    ).on(t.userId, t.candidateUserId),
  }),
);

// ─── salaam_requests ──────────────────────────────────────────────────
// Adil consent state. A room opens only after requester and recipient have
// both accepted; observers are represented by thread_members.role.
export const salaamRequests = pgTable(
  "salaam_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchSuggestionId: uuid("match_suggestion_id").references(
      () => matchSuggestions.id,
      { onDelete: "set null" },
    ),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterStatus: text("requester_status").notNull().default("accepted"),
    recipientStatus: text("recipient_status").notNull().default("pending"),
    status: text("status").notNull().default("requested"),
    threadId: uuid("thread_id").references(() => threads.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    requesterStatusIdx: index("salaam_requests_requester_status_idx").on(
      t.requesterId,
      t.status,
    ),
    recipientStatusIdx: index("salaam_requests_recipient_status_idx").on(
      t.recipientId,
      t.status,
    ),
    matchUnique: uniqueIndex("salaam_requests_match_idx").on(
      t.matchSuggestionId,
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
  serviceProfiles: many(serviceProfiles),
  matchSuggestions: many(matchSuggestions),
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

export const serviceProfilesRelations = relations(
  serviceProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [serviceProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const matchSuggestionsRelations = relations(
  matchSuggestions,
  ({ one }) => ({
    user: one(users, {
      fields: [matchSuggestions.userId],
      references: [users.id],
      relationName: "match_suggestion_user",
    }),
    candidate: one(users, {
      fields: [matchSuggestions.candidateUserId],
      references: [users.id],
      relationName: "match_suggestion_candidate",
    }),
  }),
);

export const salaamRequestsRelations = relations(
  salaamRequests,
  ({ one }) => ({
    requester: one(users, {
      fields: [salaamRequests.requesterId],
      references: [users.id],
      relationName: "salaam_requester",
    }),
    recipient: one(users, {
      fields: [salaamRequests.recipientId],
      references: [users.id],
      relationName: "salaam_recipient",
    }),
    thread: one(threads, {
      fields: [salaamRequests.threadId],
      references: [threads.id],
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
export type ServiceProfile = typeof serviceProfiles.$inferSelect;
export type NewServiceProfile = typeof serviceProfiles.$inferInsert;
export type MatchSuggestion = typeof matchSuggestions.$inferSelect;
export type NewMatchSuggestion = typeof matchSuggestions.$inferInsert;
export type SalaamRequest = typeof salaamRequests.$inferSelect;
export type NewSalaamRequest = typeof salaamRequests.$inferInsert;
export type AgentAction = typeof agentActions.$inferSelect;
export type NewAgentAction = typeof agentActions.$inferInsert;
