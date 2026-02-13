// src/routes/api/account/password/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

const db = getDb();

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Get session
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, sessionToken))
      .limit(1);

    if (!session || session.expires_at < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user_id))
      .limit(1);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is local account
    if (user.auth_type !== 'local' || user.is_guest) {
      return new Response(JSON.stringify({ 
        error: 'Password change is only available for local accounts' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify current password
    if (!user.password_hash) {
      return new Response(JSON.stringify({ error: 'Invalid account state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        error: 'New password must be at least 6 characters' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ 
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed to change password:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
