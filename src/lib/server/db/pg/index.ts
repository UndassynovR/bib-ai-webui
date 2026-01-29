import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!db) {
    client = postgres(env.PG_URL);
    db = drizzle(client);
  }
  return db;
}
