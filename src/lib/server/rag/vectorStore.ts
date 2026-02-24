/**
 * Loads all book embeddings from MSSQL into memory and performs
 * cosine similarity search. Refreshes automatically every 5 minutes
 * so new embeddings produced by the background job become available.
 *
 * Memory usage estimate: 10,000 books × 1536 floats × 4 bytes ≈ 60 MB. Fine.
 */

import { getMssqlDb } from '$lib/server/db/mssql';

interface BookVector {
  docId: number;
  vector: number[];
}

interface VectorStore {
  books: BookVector[];
  loadedAt: number;
}

// Module-level singleton — survives across requests in the same Node process
let store: VectorStore | null = null;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function loadStore(): Promise<VectorStore> {
  const db = getMssqlDb();
  const { recordset } = await db.execute(`
    SELECT DOC_ID, embedding FROM DOC_EMBEDDINGS
  `);

  const books: BookVector[] = recordset
    .map((row: any) => {
      try {
        return { docId: row.DOC_ID, vector: JSON.parse(row.embedding) as number[] };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as BookVector[];

  console.log(`[VectorStore] Loaded ${books.length} book embeddings from MSSQL.`);
  return { books, loadedAt: Date.now() };
}

async function getStore(): Promise<VectorStore> {
  if (!store || Date.now() - store.loadedAt > REFRESH_INTERVAL_MS) {
    store = await loadStore();
  }
  return store;
}

/** Force an immediate reload (call after the embedding job finishes). */
export function invalidateVectorStore(): void {
  store = null;
}

/** Dot product of two equal-length vectors. */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Magnitude of a vector. */
function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

/** Cosine similarity in [−1, 1]. Higher = more similar. */
function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot(a, b) / (magA * magB);
}

export interface SimilarBook {
  docId: number;
  score: number; // cosine similarity [0, 1]
}

/**
 * Find the top-k most similar books to a query embedding.
 *
 * @param queryEmbedding  - The embedding vector of the user's query
 * @param topK            - How many results to return (default 50)
 * @param minScore        - Minimum similarity threshold (default 0.25)
 */
export async function findSimilarBooks(
  queryEmbedding: number[],
  topK = 50,
  minScore = 0.25,
): Promise<SimilarBook[]> {
  const { books } = await getStore();

  const scored = books
    .map(book => ({
      docId: book.docId,
      score: cosineSimilarity(queryEmbedding, book.vector),
    }))
    .filter(b => b.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
