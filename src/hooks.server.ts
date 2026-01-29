// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/pg';
const db = getDb();
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');
  
  if (sessionToken) {
    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, sessionToken))
        .limit(1);
      
      if (session && session.expires_at > new Date()) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.user_id))
          .limit(1);
        
        if (user) {
          event.locals.userId = user.id;
          event.locals.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            is_guest: user.is_guest,
          };
        }
      } else if (session) {
        // Session expired, delete it
        await db.delete(sessions).where(eq(sessions.token, sessionToken));
        event.cookies.delete('session', { path: '/' });
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }
  
  // If no valid session and not calling auth API, create guest user
  if (!event.locals.userId && !event.url.pathname.startsWith('/api/auth')) {
    try {
      const [guestUser] = await db
        .insert(users)
        .values({
          is_guest: true,
        })
        .returning();
      
      const token = crypto.randomUUID() + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      await db.insert(sessions).values({
        user_id: guestUser.id,
        token,
        expires_at: expiresAt,
      });
      
      event.cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });
      
      event.locals.userId = guestUser.id;
      event.locals.user = {
        id: guestUser.id,
        email: null,
        name: null,
        is_guest: true,
      };
    } catch (error) {
      console.error('Failed to create guest user:', error);
    }
  }
  
  return resolve(event);
};
