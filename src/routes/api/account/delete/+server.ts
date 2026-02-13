// src/routes/api/account/delete/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

const db = getDb();

export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
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

    // Only allow local accounts to be deleted (not LDAP accounts)
    if (user.auth_type !== 'local' || user.is_guest) {
      return new Response(JSON.stringify({ 
        error: 'Only local accounts can be deleted. LDAP accounts must be managed through your organization.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete all user sessions first (cascade)
    await db.delete(sessions).where(eq(sessions.user_id, user.id));

    // Delete the user account
    await db.delete(users).where(eq(users.id, user.id));

    // Clear the session cookie
    cookies.delete('session', { path: '/' });

    console.log(`Account deleted: ${user.email} (${user.id})`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account deleted successfully' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed to delete account:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
