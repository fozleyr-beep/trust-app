import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// PR-02: users mirror, fed by Clerk webhook.
// Replace this whole file from handoff.yaml's data model when it lands —
// this is intentionally minimal so PR-03's messaging schema can extend it.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  publicKey: text("public_key"), // base64; libsodium x25519 pub. Set at PR-03.
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
