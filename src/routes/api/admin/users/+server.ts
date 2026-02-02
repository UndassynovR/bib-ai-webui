// src/routes/api/admin/users/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users } from '$lib/server/db/pg/schema';

const db = getDb();

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const allUsers = await db.select().from(users);
    return new Response(JSON.stringify(allUsers), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
