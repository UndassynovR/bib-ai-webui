import { drizzle } from "drizzle-orm/node-mssql";
import { env } from '$env/dynamic/private';

export function getMssqlDb() {
  const url = env.MSSQL_URL || "sqlite::memory:";
  if (!url) throw new Error("MSSQL_URL is not set");
  return drizzle(url);
}
