import { mssqlDb } from "$lib/server/db/mssql";
import { DOC, DOC_VIEW } from "$lib/server/db/mssql/schema"; 
import { limit, like, desc, or } from "drizzle-orm";

export async function searchBusinessBooksDebug() {
    return await mssqlDb
        .select()
        .from(DOC)
}

export async function searchBusinessBooks() {
    return await mssqlDb.execute(`SELECT TOP (10) * FROM DOC_VIEW`);
}

console.log(await searchBusinessBooks());
//console.log(await searchBusinessBooksDebug());

