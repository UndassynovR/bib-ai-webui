// src/routes/api/settings/+server.ts
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/pg';
import { users } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

// GET /api/settings - Get user settings
export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [user] = await db
      .select({
        theme: users.theme,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, locals.user.id))
      .limit(1);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed GET /api/settings:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// PATCH /api/settings - Update user settings
export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { theme, language } = body;

    const updateData: { theme?: string; language?: string; updated_at: Date } = {
      updated_at: new Date(),
    };

    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return new Response(JSON.stringify({ error: 'Invalid theme value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.theme = theme;
    }

    if (language !== undefined) {
      if (!['auto', 'en', 'ru', 'kk'].includes(language)) {
        return new Response(JSON.stringify({ error: 'Invalid language value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.language = language;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, locals.user.id))
      .returning({
        theme: users.theme,
        language: users.language,
      });

    return new Response(JSON.stringify(updatedUser), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed PATCH /api/settings:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
