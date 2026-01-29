import { drizzle } from "drizzle-orm/node-mssql";

export const mssqlDb = drizzle(Bun.env.MSSQL_URL!);
