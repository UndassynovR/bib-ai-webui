// import { drizzle } from "drizzle-orm/node-mssql";
// import { getAppConfig } from '$lib/server/config';
// 
// export async function getMssqlDb() {
//     const config = await getAppConfig();
// 
//     // Map your custom ENV-style names
//     const USER = config.LIBRARY_DB_USER;
//     const PASS = encodeURIComponent(config.LIBRARY_DB_PASSWORD || '');
//     const HOST = config.LIBRARY_DB_HOST;
//     const PORT = config.LIBRARY_DB_PORT || '1433';
//     const NAME = config.LIBRARY_DB_NAME;
// 
//     if (!HOST || !USER) {
//         throw new Error("MSSQL configuration is missing. Check your settings page.");
//     }
// 
//     // Constructing the URL from parts
//     const url = `mssql://${USER}:${PASS}@${HOST}:${PORT}/${NAME}`;
// 
//     return drizzle(url);
// }
import { getAppConfig } from '$lib/server/config';
import { drizzle } from "drizzle-orm/node-mssql";

const config = await getAppConfig();
const url = `mssql://${config.LIBRARY_DB_USER}:${config.LIBRARY_DB_PASSWORD}@${config.LIBRARY_DB_HOST}:${config.LIBRARY_DB_PORT}/${config.LIBRARY_DB_NAME}?encrypt=true&trustServerCertificate=true`

export function getMssqlDb() {
  return drizzle("mssql://marc:marc@10.0.1.16/marc?encrypt=true&trustServerCertificate=true");
}
