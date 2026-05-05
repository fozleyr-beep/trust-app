import {
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
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

type JsonRecord = Record<string, unknown>;

// ─── users (PR-02) ─────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  role: text("role").notNull().default("seeker"),
  layerPublic: jsonb("layer_public").$type<JsonRecord>(),
  layerGated: jsonb("layer_gated").$type<JsonRecord>(),
  layerFamily: jsonb("layer_family").$type<JsonRecord>(),
  verification: jsonb("verification").$type<JsonRecord>(),
  preferences: jsonb("preferences").$type<JsonRecord>(),
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
  handoffAt: timestamp("handoff_at", { withTimezone: true }),
  mediator: text("mediator").notNull().default("adil"),
  sabrStatus: text("sabr_status").notNull().default("normal"),
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

// ─── family_link ──────────────────────────────────────────────────────
// Wali/family observation is explicit, accepted, and read-only by default.
export const familyLinks = pgTable(
  "family_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    observerId: uuid("observer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("read_only"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    steppedBackAt: timestamp("stepped_back_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    inviterObserverUnique: uniqueIndex("family_link_inviter_observer_idx").on(
      t.inviterId,
      t.observerId,
    ),
    observerIdx: index("family_link_observer_idx").on(t.observerId),
  }),
);

// ─── interest ─────────────────────────────────────────────────────────
// Lightweight mutual-interest ledger. Photos remain gated until mutual state.
export const interests = pgTable(
  "interest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromId: uuid("from_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toId: uuid("to_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    passedAt: timestamp("passed_at", { withTimezone: true }),
  },
  (t) => ({
    fromIdx: index("interest_from_idx").on(t.fromId, t.sentAt),
    toIdx: index("interest_to_idx").on(t.toId, t.sentAt),
  }),
);

// ─── salaam_quota ─────────────────────────────────────────────────────
export const salaamQuota = pgTable(
  "salaam_quota",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    sentCount: smallint("sent_count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.weekStart] }),
  }),
);

// ─── audit_event ──────────────────────────────────────────────────────
// Trust chips should be explainable from agent/action/time audit state.
export const auditEvents = pgTable(
  "audit_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agent: text("agent").notNull(),
    action: text("action").notNull(),
    tag: text("tag").notNull(),
    state: text("state").notNull().default("done"),
    promptHash: text("prompt_hash"),
    responseHash: text("response_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCreatedIdx: index("audit_event_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    agentTagIdx: index("audit_event_agent_tag_idx").on(t.agent, t.tag),
  }),
);

// ─── consent_grant ────────────────────────────────────────────────────
export const consentGrants = pgTable(
  "consent_grant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    seekerId: uuid("seeker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    threadSeekerKindIdx: index("consent_grant_thread_seeker_kind_idx").on(
      t.threadId,
      t.seekerId,
      t.kind,
    ),
  }),
);

// ─── wali_digest / wali_note ──────────────────────────────────────────
export const waliDigests = pgTable(
  "wali_digest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    observerId: uuid("observer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    writtenAt: timestamp("written_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    body: text("body").notNull(),
  },
  (t) => ({
    observerThreadIdx: index("wali_digest_observer_thread_idx").on(
      t.observerId,
      t.threadId,
    ),
  }),
);

export const waliNotes = pgTable(
  "wali_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyLinkId: uuid("family_link_id")
      .notNull()
      .references(() => familyLinks.id, { onDelete: "cascade" }),
    fromId: uuid("from_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toId: uuid("to_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ciphertext: bytea("ciphertext").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    familySentIdx: index("wali_note_family_sent_idx").on(
      t.familyLinkId,
      t.sentAt,
    ),
  }),
);

// ─── sabr_event / donation ────────────────────────────────────────────
// Sabr stores classifier metadata and decisions, never room plaintext.
export const sabrEvents = pgTable(
  "sabr_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    classifier: text("classifier").notNull(),
    confidence: numeric("confidence", { precision: 3, scale: 2 }),
    action: text("action").notNull(),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    decision: text("decision"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    threadCreatedIdx: index("sabr_event_thread_created_idx").on(
      t.threadId,
      t.createdAt,
    ),
    classifierIdx: index("sabr_event_classifier_idx").on(t.classifier),
  }),
);

export const donations = pgTable(
  "donation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    occasion: text("occasion").notNull().default("nikah_blessing"),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userSentIdx: index("donation_user_sent_idx").on(t.userId, t.sentAt),
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
  familyLinksInvited: many(familyLinks, {
    relationName: "family_link_inviter",
  }),
  familyLinksObserved: many(familyLinks, {
    relationName: "family_link_observer",
  }),
  interestsSent: many(interests, { relationName: "interest_from" }),
  interestsReceived: many(interests, { relationName: "interest_to" }),
  salaamQuota: many(salaamQuota),
  auditEvents: many(auditEvents),
  consentGrants: many(consentGrants),
  waliDigests: many(waliDigests),
  waliNotesSent: many(waliNotes, { relationName: "wali_note_from" }),
  waliNotesReceived: many(waliNotes, { relationName: "wali_note_to" }),
  sabrReviews: many(sabrEvents, { relationName: "sabr_event_reviewer" }),
  donations: many(donations),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  creator: one(users, {
    fields: [threads.createdBy],
    references: [users.id],
  }),
  members: many(threadMembers),
  messages: many(messages),
  consentGrants: many(consentGrants),
  waliDigests: many(waliDigests),
  sabrEvents: many(sabrEvents),
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

export const familyLinksRelations = relations(familyLinks, ({ one, many }) => ({
  inviter: one(users, {
    fields: [familyLinks.inviterId],
    references: [users.id],
    relationName: "family_link_inviter",
  }),
  observer: one(users, {
    fields: [familyLinks.observerId],
    references: [users.id],
    relationName: "family_link_observer",
  }),
  notes: many(waliNotes),
}));

export const interestsRelations = relations(interests, ({ one }) => ({
  from: one(users, {
    fields: [interests.fromId],
    references: [users.id],
    relationName: "interest_from",
  }),
  to: one(users, {
    fields: [interests.toId],
    references: [users.id],
    relationName: "interest_to",
  }),
}));

export const salaamQuotaRelations = relations(salaamQuota, ({ one }) => ({
  user: one(users, {
    fields: [salaamQuota.userId],
    references: [users.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}));

export const consentGrantsRelations = relations(consentGrants, ({ one }) => ({
  thread: one(threads, {
    fields: [consentGrants.threadId],
    references: [threads.id],
  }),
  seeker: one(users, {
    fields: [consentGrants.seekerId],
    references: [users.id],
  }),
}));

export const waliDigestsRelations = relations(waliDigests, ({ one }) => ({
  thread: one(threads, {
    fields: [waliDigests.threadId],
    references: [threads.id],
  }),
  observer: one(users, {
    fields: [waliDigests.observerId],
    references: [users.id],
  }),
}));

export const waliNotesRelations = relations(waliNotes, ({ one }) => ({
  familyLink: one(familyLinks, {
    fields: [waliNotes.familyLinkId],
    references: [familyLinks.id],
  }),
  from: one(users, {
    fields: [waliNotes.fromId],
    references: [users.id],
    relationName: "wali_note_from",
  }),
  to: one(users, {
    fields: [waliNotes.toId],
    references: [users.id],
    relationName: "wali_note_to",
  }),
}));

export const sabrEventsRelations = relations(sabrEvents, ({ one }) => ({
  thread: one(threads, {
    fields: [sabrEvents.threadId],
    references: [threads.id],
  }),
  reviewer: one(users, {
    fields: [sabrEvents.reviewedBy],
    references: [users.id],
    relationName: "sabr_event_reviewer",
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, {
    fields: [donations.userId],
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
export type FamilyLink = typeof familyLinks.$inferSelect;
export type NewFamilyLink = typeof familyLinks.$inferInsert;
export type Interest = typeof interests.$inferSelect;
export type NewInterest = typeof interests.$inferInsert;
export type SalaamQuota = typeof salaamQuota.$inferSelect;
export type NewSalaamQuota = typeof salaamQuota.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
export type ConsentGrant = typeof consentGrants.$inferSelect;
export type NewConsentGrant = typeof consentGrants.$inferInsert;
export type WaliDigest = typeof waliDigests.$inferSelect;
export type NewWaliDigest = typeof waliDigests.$inferInsert;
export type WaliNote = typeof waliNotes.$inferSelect;
export type NewWaliNote = typeof waliNotes.$inferInsert;
export type SabrEvent = typeof sabrEvents.$inferSelect;
export type NewSabrEvent = typeof sabrEvents.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
