// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db/pg';
import { users } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      user: null,
      settings: null,
    };
  }

  try {
    const [userSettings] = await db
      .select({
        theme: users.theme,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, locals.user.id))
      .limit(1);

    return {
      user: locals.user,
      settings: userSettings || { theme: 'system', language: 'auto' },
    };
  } catch (err) {
    console.error('Failed to load user settings:', err);
    return {
      user: locals.user,
      settings: { theme: 'system', language: 'auto' },
    };
  }
};
