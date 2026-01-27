import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/server/db/pg/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: Bun.env.PG_DATABASE_URL!,
  },
});

