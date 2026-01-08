import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/server/db/pg/schema.ts",      // path to your schema
  out: "./drizzle/migrations",    // folder for migration files
  dialect: "postgresql",
  dbCredentials: {
    url: Bun.env.PG_DATABASE_URL!, // Bun reads env vars directly
  },
});

