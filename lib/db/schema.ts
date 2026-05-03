import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// PR-01 placeholder. Replace this whole file from handoff.yaml's data model
// when it arrives. Tables here exist only so drizzle-kit doesn't choke and
// `import { schema }` resolves in PR-02 wiring.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  publicKey: text("public_key"), // base64; libsodium x25519 pub
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
