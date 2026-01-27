import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/server/db/pg/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: Bun.env.PG_HOST!,
    port: Number(Bun.env.PG_PORT ?? 5432),
    database: Bun.env.PG_DB!,
    user: Bun.env.PG_USER!,
    password: Bun.env.PG_PASSWORD!,
  },
});
