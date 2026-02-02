// src/routes/api/admin/users/[id]/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

const db = getDb();

export const PUT: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response('User ID required', { status: 400 });

  try {
    const data = await request.json();
    const { name, role } = data;

    if (!['user', 'admin'].includes(role)) {
      return new Response('Invalid role', { status: 400 });
    }

    await db.update(users)
      .set({ name, role })
      .where(eq(users.id, id));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed to update user:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response('User ID required', { status: 400 });

  try {
    await db.delete(users).where(eq(users.id, id));
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed to delete user:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
