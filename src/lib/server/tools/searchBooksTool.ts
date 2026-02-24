/**
 * Hybrid RAG search:
 *   1. Embed the user's query with OpenAI text-embedding-3-small
 *   2. Vector search → top 50 semantically similar books
 *   3. Keyword (LIKE) search → exact-match candidates
 *   4. Merge & score:  combined = vector_score + 0.3 * keyword_boost
 *   5. Return top 16, ranked by combined score
 *
 * The LLM no longer needs to manually translate queries —
 * semantic search handles multilingual similarity automatically.
 */

import * as z from 'zod';
import { tool } from 'langchain';
import { getMssqlDb } from '$lib/server/db/mssql';
import { getEmbedding } from '$lib/server/rag/openaiEmbeddings';
import { findSimilarBooks } from '$lib/server/rag/vectorStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOP_K_VECTOR   = 50;  // candidates from vector search
const TOP_K_FINAL    = 16;  // results returned to the LLM
const KEYWORD_BOOST  = 0.3; // score bonus for keyword matches
const MIN_SIMILARITY = 0.20; // discard very weak semantic matches

const FIELDS_TO_REMOVE = [
  'RECTYPE', 'BIBLEVEL', 'ITEM_STR', 'date_of_correction', 'cover_link',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchFilters {
  query: string;              // single natural-language query (LLM writes this)
  language?: string;
  year?: number;
  volume?: number;
  quantity?: number;
}

// ---------------------------------------------------------------------------
// Core search logic
// ---------------------------------------------------------------------------

async function searchBooks(filters: SearchFilters): Promise<string> {
  console.log('[searchBooks] filters:', filters);
  const db = getMssqlDb();

  // ── 1. Embed the query ──────────────────────────────────────────────────
  const queryEmbedding = await getEmbedding(filters.query);

  // ── 2. Vector search ───────────────────────────────────────────────────
  const vectorHits = await findSimilarBooks(queryEmbedding, TOP_K_VECTOR, MIN_SIMILARITY);
  const vectorScoreMap = new Map(vectorHits.map(h => [h.docId, h.score]));

  if (vectorHits.length === 0) {
    console.log('[searchBooks] No vector hits above threshold.');
    return JSON.stringify([]);
  }

  // ── 3. Fetch full book data for vector candidates from MSSQL ───────────
  const idList = vectorHits.map(h => h.docId).join(',');

  // Build optional filter clauses
  const extraConditions: string[] = [];
  if (filters.language) extraConditions.push(`text_language_code LIKE '%${filters.language.replace(/'/g, "''")}%'`);
  if (filters.year)     extraConditions.push(`year = ${filters.year}`);
  if (filters.volume)   extraConditions.push(`volume = ${filters.volume}`);
  if (filters.quantity) extraConditions.push(`quantity = ${filters.quantity}`);

  const extraWhere = extraConditions.length > 0
    ? `AND ${extraConditions.join(' AND ')}`
    : '';

  const { recordset: rows } = await db.execute(`
    SELECT * FROM DOC_VIEW
    WHERE DOC_ID IN (${idList})
    ${extraWhere}
  `);

  // ── 4. Keyword boost — check which results also match the raw query ─────
  const queryWords = filters.query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2);

  function keywordScore(row: Record<string, any>): number {
    const haystack = [row.title, row.author, row.keywords]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matched = queryWords.filter(w => haystack.includes(w)).length;
    return queryWords.length > 0 ? matched / queryWords.length : 0;
  }

  // ── 5. Deduplicate, score, rank ─────────────────────────────────────────
  const uniqueRows = Array.from(
    new Map(rows.map((row: any) => [row.DOC_ID, row])).values()
  ) as Record<string, any>[];

  const ranked = uniqueRows
    .map(row => {
      const vecScore  = vectorScoreMap.get(row.DOC_ID) ?? 0;
      const kwScore   = keywordScore(row);
      const combined  = vecScore + KEYWORD_BOOST * kwScore;
      return { row, combined };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, TOP_K_FINAL);

  // ── 6. Clean up fields ──────────────────────────────────────────────────
  const cleaned = ranked.map(({ row, combined }) => ({
    ...Object.fromEntries(
      Object.entries(row).filter(([k, v]) => v != null && !FIELDS_TO_REMOVE.includes(k))
    ),
    _relevance_score: Math.round(combined * 100) / 100, // helpful for debugging
  }));

  console.log(`[searchBooks] Returning ${cleaned.length} results. Top score: ${ranked[0]?.combined.toFixed(3)}`);
  return JSON.stringify(cleaned);
}

// ---------------------------------------------------------------------------
// LangChain tool definition
// ---------------------------------------------------------------------------

const schema = z.object({
  query: z.string().describe(
    'A natural-language search query describing what the user is looking for. ' +
    'Write it in whatever language is most natural — semantic search handles multilingual matching. ' +
    'Example: "introductory psychology textbook for students"'
  ),
  language: z.string().optional().describe("Filter by language code, e.g. 'rus', 'eng', 'kaz'"),
  year:     z.number().optional().describe('Filter by publication year'),
  volume:   z.number().optional().describe('Filter by volume number'),
  quantity: z.number().optional().describe('Filter by quantity available'),
});

export const searchBooksTool = tool(
  async (input: z.infer<typeof schema>) => searchBooks(input),
  {
    name: 'search_books',
    description: `
      Search the library's book catalog using semantic (AI-powered) search.

      HOW IT WORKS:
      - Uses vector similarity — finds books by meaning, not just exact words
      - "machine learning" will match books about "neural networks", "AI", "deep learning"
      - Multilingual automatically — no need to manually translate the query
      - Combines semantic relevance with keyword matching for best results

      PARAMETERS:
      - query (required): Natural-language description of what the user needs.
        Write a descriptive phrase, not just keywords.
        Good:  "introductory psychology textbook covering cognitive development"
        Bad:   "psychology"
      - language (optional): Filter by language code ('rus', 'eng', 'kaz')
      - year (optional): Filter by publication year
      - volume (optional): Filter by volume number
      - quantity (optional): Filter by quantity available

      RETURNS:
      - Up to 16 books ranked by relevance (_relevance_score: higher = better match)
      - Fields: DOC_ID, title, author, other_authors, year, publisher, volume, quantity, keywords

      IMPORTANT:
      - Use this tool ONCE per user message
      - quantity = 0 or null does NOT mean unavailable — check with library desk
      - After results, recommend the TOP book with clear reasoning, then 2–3 alternatives

      EXAMPLE:
      { "query": "introductory book on artificial intelligence for undergraduate students" }
    `,
    schema,
  }
);
