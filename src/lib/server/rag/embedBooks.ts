/**
 * lib/server/rag/embedBooks.ts
 */

import crypto from 'crypto';
import { sql } from 'drizzle-orm';
import { getMssqlDb } from '$lib/server/db/mssql';
import { getEmbeddings } from './openaiEmbeddings';

const BATCH_SIZE = 50;

function buildBookText(row: Record<string, any>): string {
  return [
    row.title,
    row.author,
    row.other_authors,
    row.keywords,
    row.publisher,
    row.year ? `Year: ${row.year}` : null,
  ].filter(Boolean).join(' | ');
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Safely extract rows from whatever shape Drizzle returns */
function toRows(result: any): Record<string, any>[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.recordset)) return result.recordset;
  if (Array.isArray(result?.rows)) return result.rows;
  // Log the actual shape once so we can see it
  console.log('[EmbedJob] Unexpected db.execute result shape:', JSON.stringify(result)?.slice(0, 300));
  return [];
}

export async function runEmbeddingJob(): Promise<void> {
  const db = getMssqlDb();
  console.log('[EmbedJob] Starting incremental embedding job...');

  const newBooksRaw = await db.execute(sql`
    SELECT
      v.DOC_ID,
      v.title,
      v.author,
      v.other_authors,
      v.keywords,
      v.publisher,
      v.year
    FROM DOC_VIEW v
    LEFT JOIN DOC_EMBEDDINGS e ON e.DOC_ID = v.DOC_ID
    WHERE e.DOC_ID IS NULL
  `);

  const existingBooksRaw = await db.execute(sql`
    SELECT
      v.DOC_ID,
      v.title,
      v.author,
      v.other_authors,
      v.keywords,
      v.publisher,
      v.year,
      e.content_hash
    FROM DOC_VIEW v
    INNER JOIN DOC_EMBEDDINGS e ON e.DOC_ID = v.DOC_ID
  `);

  const newBooks = toRows(newBooksRaw);
  const existingBooks = toRows(existingBooksRaw);

  const changedBooks = existingBooks.filter(row => {
    const currentHash = sha256(buildBookText(row));
    return currentHash !== row.content_hash;
  });

  const booksToEmbed = [...newBooks, ...changedBooks];

  if (booksToEmbed.length === 0) {
    console.log('[EmbedJob] All books up to date. Nothing to do.');
    return;
  }

  console.log(`[EmbedJob] Found ${booksToEmbed.length} books to embed (${newBooks.length} new, ${changedBooks.length} changed).`);

  for (let i = 0; i < booksToEmbed.length; i += BATCH_SIZE) {
    const batch = booksToEmbed.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildBookText);
    const embeddings = await getEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      const docId: number = batch[j].DOC_ID;
      const hash: string = sha256(texts[j]);
      const embeddingJson: string = JSON.stringify(embeddings[j]);

      await db.execute(sql`
        MERGE DOC_EMBEDDINGS AS target
        USING (SELECT ${docId} AS DOC_ID) AS source ON target.DOC_ID = source.DOC_ID
        WHEN MATCHED THEN
          UPDATE SET
            embedding    = ${embeddingJson},
            content_hash = ${hash},
            embedded_at  = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (DOC_ID, embedding, content_hash)
          VALUES (${docId}, ${embeddingJson}, ${hash});
      `);
    }

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(booksToEmbed.length / BATCH_SIZE);
    console.log(`[EmbedJob] Embedded batch ${batchNum} / ${totalBatches}`);

    if (i + BATCH_SIZE < booksToEmbed.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('[EmbedJob] Done.');
}
