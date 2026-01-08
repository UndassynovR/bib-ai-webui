import * as z from "zod";
import { tool } from "langchain";
import { mssqlDb } from "$lib/server/db/mssql";
import { DOC_VIEW } from "$lib/server/db/mssql/schema";

interface SearchFilters {
  queries: string[];
  language?: string;
  year?: number;
  volume?: number;
  quantity?: number;
}

const FIELDS_TO_REMOVE = [
  // "DOC_ID",
  "RECTYPE",
  "BIBLEVEL",
  "ITEM_STR",
  "date_of_correction",
  "cover_link",
];

async function searchBooks(filters: SearchFilters) {
  console.log("=== Diagnostics: Received filters ===");
  console.log(filters);

  const conditions: string[] = [];

  // Build OR conditions for multiple search queries
  if (filters.queries && filters.queries.length > 0) {
    const titleConditions = filters.queries
      .map(query => `title LIKE '%${query.replace(/'/g, "''")}%'`)
      .join(" OR ");
    conditions.push(`(${titleConditions})`);
  }

  if (filters.language) {
    conditions.push(`text_language_code LIKE '%${filters.language.replace(/'/g, "''")}%'`);
  }
  if (filters.year) {
    conditions.push(`year = ${filters.year}`);
  }
  if (filters.volume) {
    conditions.push(`volume = ${filters.volume}`);
  }
  if (filters.quantity) {
    conditions.push(`quantity = ${filters.quantity}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT TOP (16) * FROM DOC_VIEW ${whereClause} ORDER BY DOC_ID`;

  console.log("=== Diagnostics: Executing SQL ===");
  console.log(sql);

  const result = await mssqlDb.execute(sql);
  const rows = result.recordset ?? [];

  // Remove duplicates by DOC_ID
  const uniqueRows = Array.from(
    new Map(rows.map((row: any) => [row.DOC_ID, row])).values()
  );

  const cleanedRows = uniqueRows.map((row: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(row).filter(([key, v]) => v != null && !FIELDS_TO_REMOVE.includes(key))
    )
  );

  console.log(`=== Diagnostics: Returned ${cleanedRows.length} unique results ===`);
  console.log(cleanedRows);

  return JSON.stringify(cleanedRows);
}

// Zod schema
const schema = z.object({
  queries: z.array(z.string()).describe(
    "Array of search queries in different languages (English, Russian, Kazakh). " +
    "Example: ['psychology', 'психология', 'психология']"
  ),
  language: z.string().optional().describe("Text language code, e.g., 'rus' or 'eng'"),
  year: z.number().optional().describe("Publication year"),
  volume: z.number().optional().describe("Volume/pages of the book"),
  quantity: z.number().optional().describe("Quantity available"),
});

// LangChain tool
export const searchBooksTool = tool(
  async (input: z.infer<typeof schema>) => {
    return await searchBooks(input);
  },
  {
    name: "search_books",
    description: `
      Search the library's book database to find relevant books.
      
      SEARCH STRATEGY:
      - Provide ALL search queries at once in the "queries" array parameter
      - Include translations in English, Russian, and Kazakh
      - Example: queries: ["psychology", "психология", "психология"]
      - The tool will search for books matching ANY of the provided queries
      - This ensures comprehensive results as books may be cataloged in any language
      
      PARAMETERS:
      - queries (required): Array of search terms in different languages
      - language (optional): Filter by language code (e.g., 'rus', 'eng', 'kaz')
      - year (optional): Filter by publication year
      - volume (optional): Filter by specific volume number
      - quantity (optional): Filter by quantity available
      
      RETURNS:
      - Array of unique books (deduplicated) with: DOC_ID, title, author, other_authors, year, publisher, volume, quantity, keywords
      - Books are returned in JSON format
      - Maximum 16 results
      
      IMPORTANT NOTES:
      - This tool MUST be used ONLY ONCE per user message
      - Quantity field may be 0 or null - this does NOT mean the book is unavailable
      - Books with 0/null quantity may still be available at the library desk
      - Users should visit the library to check actual availability
      - Focus on content relevance rather than quantity numbers
      
      AFTER RECEIVING RESULTS:
      1. Analyze all returned books
      2. Identify the MOST RELEVANT book for the user's specific need
      3. Recommend that book as your TOP PICK with clear reasoning
      4. Then briefly mention 2-3 other good alternatives
      5. Explain what makes your top recommendation the best choice
      
      Example usage:
      {
        "queries": ["artificial intelligence", "искусственный интеллект", "жасанды интеллект"]
      }
      
      Example response structure:
      "I found several excellent books! My top recommendation is **[Title]** by [Author] (Year) 
      because [specific reason why it's best for this query].
      
      Other great options include:
      - **[Title 2]** - [brief note]
      - **[Title 3]** - [brief note]
      
      Note: For availability details, please check with the library desk as catalog quantities 
      may not reflect current status."
    `,
    schema: schema as unknown as z.ZodType<SearchFilters>,
  }
);
