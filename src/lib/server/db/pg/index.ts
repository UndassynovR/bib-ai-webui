import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(Bun.env.PG_URL!);
