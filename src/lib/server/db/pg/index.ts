// src/lib/server/db/pg/index.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const host = Bun.env.PG_HOST!;
const port = Number(Bun.env.PG_PORT ?? 5432);
const database = Bun.env.PG_DB!;
const user = Bun.env.PG_USER!;
const password = Bun.env.PG_PASSWORD!;

if (!host || !database || !user || !password) {
  throw new Error("Missing one of required Postgres env vars");
}

console.log("Environment variables:");
console.log("PG_HOST:", host);
console.log("PG_PORT:", port);
console.log("PG_DB:", database);
console.log("PG_USER:", user);

const sql = postgres({
  host,
  port,
  database,
  username: user,
  password,
});

export const db = drizzle(sql);
