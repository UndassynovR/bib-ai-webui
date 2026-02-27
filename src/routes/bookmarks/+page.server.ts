// src/routes/bookmarks/+page.server.ts
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db/pg';
const db = getDb();
import { getMssqlDb } from '$lib/server/db/mssql';
const mssqlDb = getMssqlDb();
import { bookmarks } from '$lib/server/db/pg/schema';
import { DOC_VIEW } from '$lib/server/db/mssql/schema';
import { eq, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Get user's bookmarks
    const userBookmarks = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.user_id, locals.userId))
      .orderBy(bookmarks.id);

    if (userBookmarks.length === 0) {
      return {
        books: [],
      };
    }

    // Get book details from MSSQL
    const docIds = userBookmarks.map(b => b.doc_id);
    
    const books = await mssqlDb
      .select({
        DOC_ID: DOC_VIEW.DOC_ID,
        title: DOC_VIEW.title,
		title_continuation: DOC_VIEW.title_continuation,
        author: DOC_VIEW.author,
        other_authors: DOC_VIEW.other_authors,
        year: DOC_VIEW.year,
        publisher: DOC_VIEW.publisher,
        publication_place: DOC_VIEW.publication_place,
        isbn: DOC_VIEW.isbn,
        keywords: DOC_VIEW.keywords,
        text_language_code: DOC_VIEW.text_language_code,
        volume: DOC_VIEW.volume,
      })
      .from(DOC_VIEW)
      .where(inArray(DOC_VIEW.DOC_ID, docIds));

    // Sort books by bookmark order
    const bookMap = new Map(books.map(b => [b.DOC_ID, b]));
    const sortedBooks = docIds
      .map(id => bookMap.get(id))
      .filter(Boolean);

    return {
      books: sortedBooks,
    };
  } catch (err) {
    console.error('Failed to load bookmarks:', err);
    throw error(500, 'Failed to load bookmarks');
  }
};
