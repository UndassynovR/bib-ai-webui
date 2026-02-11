import { getAppConfig } from '$lib/server/config';
import { drizzle } from "drizzle-orm/node-mssql";

const config = await getAppConfig();
const url = `mssql://${config.LIBRARY_DB_USER}:${config.LIBRARY_DB_PASSWORD}@${config.LIBRARY_DB_HOST}:${config.LIBRARY_DB_PORT}/${config.LIBRARY_DB_NAME}?encrypt=true&trustServerCertificate=true`

export function getMssqlDb() {
  return drizzle(url);
}
