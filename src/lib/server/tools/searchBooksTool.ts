/**
 * lib/server/tools/searchBooksTool.ts
 *
 * Hybrid RAG search with optional semantic query.
 * When no query is provided (e.g. ISBN/year/language lookup), skips vector
 * search and falls back to a direct filtered SQL query.
 */

import * as z from 'zod';
import { tool } from 'langchain';
import { sql } from 'drizzle-orm';
import { getMssqlDb } from '$lib/server/db/mssql';
import { getEmbedding } from '$lib/server/rag/openaiEmbeddings';
import { findSimilarBooks } from '$lib/server/rag/vectorStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOP_K_VECTOR   = 50;
const TOP_K_FINAL    = 16;
const KEYWORD_BOOST  = 0.3;
const MIN_SIMILARITY = 0.20;

const FIELDS_TO_REMOVE = [
  'RECTYPE', 'BIBLEVEL', 'ITEM_STR', 'date_of_correction', 'cover_link',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchFilters {
  query?: string;
  isbn?: string;
  language?: string;
  year?: number;
  volume?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toRows(result: any): Record<string, any>[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.recordset)) return result.recordset;
  if (Array.isArray(result?.rows)) return result.rows;
  return [];
}

function cleanRow(row: Record<string, any>, score?: number) {
  const cleaned = Object.fromEntries(
    Object.entries(row).filter(([k, v]) => v != null && !FIELDS_TO_REMOVE.includes(k))
  );
  if (score !== undefined) cleaned._relevance_score = Math.round(score * 100) / 100;
  return cleaned;
}

// ---------------------------------------------------------------------------
// Core search logic
// ---------------------------------------------------------------------------

async function searchBooks(filters: SearchFilters): Promise<string> {
  console.log('[searchBooks] filters:', filters);
  const db = getMssqlDb();

  // Build extra filter conditions (shared by both paths)
  const conditions: string[] = [];
  if (filters.isbn)     conditions.push(`isbn LIKE '%${filters.isbn.replace(/'/g, "''")}%'`);
  if (filters.language) conditions.push(`text_language_code LIKE '%${filters.language.replace(/'/g, "''")}%'`);
  if (filters.year)     conditions.push(`year = ${filters.year}`);
  if (filters.volume)   conditions.push(`volume = ${filters.volume}`);

  // ── PATH A: No query → pure filter search (ISBN, year, language, etc.) ──
  if (!filters.query?.trim()) {
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = toRows(await db.execute(sql`
      SELECT TOP (${TOP_K_FINAL}) * FROM DOC_VIEW ${sql.raw(whereClause)} ORDER BY DOC_ID
    `));

    const unique = Array.from(new Map(rows.map(r => [r.DOC_ID, r])).values());
    console.log(`[searchBooks] Filter-only path, returning ${unique.length} results.`);
    return JSON.stringify(unique.map(r => cleanRow(r)));
  }

  // ── PATH B: Query provided → hybrid vector + keyword search ─────────────

  // 1. Embed the query
  const queryEmbedding = await getEmbedding(filters.query);

  // 2. Vector search
  const vectorHits = await findSimilarBooks(queryEmbedding, TOP_K_VECTOR, MIN_SIMILARITY);
  if (vectorHits.length === 0) {
    console.log('[searchBooks] No vector hits above threshold.');
    return JSON.stringify([]);
  }

  const vectorScoreMap = new Map(vectorHits.map(h => [h.docId, h.score]));

  // 3. Fetch full data for vector candidates, applying any extra filters
  const idList = vectorHits.map(h => h.docId).join(',');
  const extraWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

  const rows = toRows(await db.execute(sql`
    SELECT * FROM DOC_VIEW
    WHERE DOC_ID IN (${sql.raw(idList)}) ${sql.raw(extraWhere)}
  `));

  // 4. Keyword boost
  const queryWords = filters.query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  function keywordScore(row: Record<string, any>): number {
    if (queryWords.length === 0) return 0;
    const haystack = [row.title, row.author, row.keywords].filter(Boolean).join(' ').toLowerCase();
    return queryWords.filter(w => haystack.includes(w)).length / queryWords.length;
  }

  // 5. Deduplicate, score, rank
  const unique = Array.from(new Map(rows.map((r: any) => [r.DOC_ID, r])).values()) as Record<string, any>[];

  const ranked = unique
    .map(row => ({
      row,
      combined: (vectorScoreMap.get(row.DOC_ID) ?? 0) + KEYWORD_BOOST * keywordScore(row),
    }))
    .sort((a, b) => b.combined - a.combined)
    .slice(0, TOP_K_FINAL);

  console.log(`[searchBooks] Returning ${ranked.length} results. Top score: ${ranked[0]?.combined.toFixed(3)}`);
  return JSON.stringify(ranked.map(({ row, combined }) => cleanRow(row, combined)));
}

// ---------------------------------------------------------------------------
// LangChain tool definition
// ---------------------------------------------------------------------------

const schema = z.object({
  query: z.string().optional().describe(
    'Natural-language description of what the user is looking for. ' +
    'Omit when searching by ISBN, year, or language alone — no need to invent a query. ' +
    'Example: "introductory psychology textbook for students"'
  ),
  isbn:     z.string().optional().describe('Filter by ISBN'),
  language: z.string().optional().describe("Filter by language code, e.g. 'rus', 'eng', 'kaz'"),
  year:     z.number().optional().describe('Filter by publication year'),
  volume:   z.number().optional().describe('Filter by volume number'),
});

export const searchBooksTool = tool(
  async (input: z.infer<typeof schema>) => searchBooks(input),
  {
    name: 'search_books',
    description: `
      Search the library's book catalog. Supports two modes:

      MODE 1 — SEMANTIC SEARCH (provide "query"):
      - Finds books by meaning, not just exact words
      - "machine learning" matches "neural networks", "AI", "deep learning"
      - Multilingual — no need to translate, works across English/Russian/Kazakh
      - Use for: topic searches, subject lookups, recommendation requests

      MODE 2 — FILTER SEARCH (omit "query"):
      - Direct lookup by ISBN, year, language or volume
      - Use when the user provides an ISBN or wants books from a specific year/language
      - No query needed — just pass the relevant filter(s)

      PARAMETERS:
      - query (optional): Natural-language topic description
      - isbn (optional): Filter by ISBN
      - language (optional): 'rus', 'eng', 'kaz'
      - year (optional): Publication year
      - volume (optional): Volume number

      EXAMPLES:
      { "query": "introductory artificial intelligence for undergraduates" }
      { "isbn": "978-5-00101-233-4" }
      { "year": 2020, "language": "rus" }
      { "query": "databases", "year": 2019 }

      RETURNS: Up to 16 books ranked by relevance.
    `,
    schema,
  }
);
