/**
 * lib/server/rag/openaiEmbeddings.ts
 *
 * Thin wrapper around OpenAI embeddings with a simple in-process cache
 * so repeated identical queries don't cost extra API calls.
 */

import { getAppConfig } from '$lib/server/config';
import { OpenAI } from 'openai';

const config = await getAppConfig();
const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// Cache last 64 query embeddings in memory
const cache = new Map<string, number[]>();
const CACHE_MAX = 64;

export async function getEmbedding(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  const embedding = response.data[0].embedding;

  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, embedding);

  return embedding;
}

/** Embed multiple texts in one API call (used by the batch job). */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}
