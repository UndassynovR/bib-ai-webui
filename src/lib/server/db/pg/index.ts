// src/lib/server/db/pg/index.ts
// import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// const sql = postgres({ connectionString: Bun.env.PG_DATABASE_URL! });
export const db = drizzle(Bun.env.PG_DATABASE_URL!);
