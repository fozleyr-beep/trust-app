import {
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
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

// ─── relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  devices: many(deviceKeys),
  threadsCreated: many(threads),
  memberships: many(threadMembers),
  messagesSent: many(messages),
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

// ─── inferred types ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type DeviceKey = typeof deviceKeys.$inferSelect;
export type NewDeviceKey = typeof deviceKeys.$inferInsert;
