import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy so Next.js build doesn't fail when DATABASE_URL is unset at build time.
let _db: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
