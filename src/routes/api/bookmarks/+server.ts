// src/routes/api/bookmarks/+server.ts
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/pg';
import { bookmarks } from '$lib/server/db/pg/schema';
import { eq, and, desc } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

// GET /api/bookmarks - Get all bookmarks for current user
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    const userBookmarks = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.user_id, locals.userId))
      .orderBy(desc(bookmarks.created_at));

    return json({
      bookmarks: userBookmarks.map(b => b.doc_id),
    });
  } catch (err) {
    console.error('Failed to fetch bookmarks:', err);
    throw error(500, 'Failed to fetch bookmarks');
  }
};

// POST /api/bookmarks - Add a bookmark
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    const body = await request.json();
    
    let doc_id = body.doc_id;
    
    // Convert string to number if needed
    if (typeof doc_id === 'string') {
      doc_id = parseInt(doc_id, 10);
    }

    if (!doc_id || typeof doc_id !== 'number' || isNaN(doc_id)) {
      console.error('Invalid doc_id - expected number, got:', typeof body.doc_id, body.doc_id);
      throw error(400, `Invalid doc_id: expected number, got ${typeof body.doc_id}`);
    }

    // Check if bookmark already exists
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.user_id, locals.userId),
          eq(bookmarks.doc_id, doc_id)
        )
      )
      .limit(1);

    if (existing) {
      return json({ success: true, message: 'Already bookmarked' });
    }

    await db.insert(bookmarks).values({
      user_id: locals.userId,
      doc_id,
    });

    return json({ success: true, message: 'Bookmark added' });
  } catch (err) {
    console.error('Failed to add bookmark:', err);
    throw error(500, 'Failed to add bookmark');
  }
};

// DELETE /api/bookmarks - Remove a bookmark
export const DELETE: RequestHandler = async ({ request, locals }) => {
  if (!locals.userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    const body = await request.json();
    
    let doc_id = body.doc_id;
    
    // Convert string to number if needed
    if (typeof doc_id === 'string') {
      doc_id = parseInt(doc_id, 10);
    }

    if (!doc_id || typeof doc_id !== 'number' || isNaN(doc_id)) {
      console.error('Invalid doc_id - expected number, got:', typeof body.doc_id, body.doc_id);
      throw error(400, `Invalid doc_id: expected number, got ${typeof body.doc_id}`);
    }

    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.user_id, locals.userId),
          eq(bookmarks.doc_id, doc_id)
        )
      );

    return json({ success: true, message: 'Bookmark removed' });
  } catch (err) {
    console.error('Failed to remove bookmark:', err);
    throw error(500, 'Failed to remove bookmark');
  }
};
