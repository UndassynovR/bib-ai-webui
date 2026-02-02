// src/routes/api/auth/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

const db = getDb();
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Helper to hash passwords (install: bun add bcrypt @types/bcrypt)
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  const [session] = await db
    .insert(sessions)
    .values({
      user_id: userId,
      token,
      expires_at: expiresAt,
    })
    .returning();
  
  return { token, expiresAt };
}

// POST /api/auth - Handle login, register, and guest creation
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { action, email, password } = await request.json();
    
    if (action === 'login') {
      // Login existing user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user || !user.password_hash) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const { token, expiresAt } = await createSession(user.id);
      
      cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });
      
      return new Response(JSON.stringify({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          is_guest: false 
        } 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'register') {
      // Check if email already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existing && !existing.is_guest) {
        return new Response(JSON.stringify({ error: 'Email already registered' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const passwordHash = await hashPassword(password);
      
      // Check if current session belongs to a guest
      const sessionToken = cookies.get('session');
      let userId: string;
      
      if (sessionToken) {
        const [session] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.token, sessionToken))
          .limit(1);
        
        if (session) {
          const [guestUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.user_id))
            .limit(1);
          
          // If current user is guest, upgrade them
          if (guestUser && guestUser.is_guest) {
            await db
              .update(users)
              .set({
                email,
                password_hash: passwordHash,
                is_guest: false,
                updated_at: new Date(),
              })
              .where(eq(users.id, guestUser.id));
            
            userId = guestUser.id;
            
            return new Response(JSON.stringify({ 
              user: { 
                id: userId, 
                email, 
                name: guestUser.name,
                is_guest: false 
              },
              message: 'Account upgraded! Your chats have been preserved.'
            }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
      
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password_hash: passwordHash,
          is_guest: false,
        })
        .returning();
      
      const { token, expiresAt } = await createSession(newUser.id);
      
      cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });
      
      return new Response(JSON.stringify({ 
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name,
          is_guest: false 
        } 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'guest') {
      // Create guest user
      const [guestUser] = await db
        .insert(users)
        .values({
          is_guest: true,
        })
        .returning();
      
      const { token, expiresAt } = await createSession(guestUser.id);
      
      cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
      });
      
      return new Response(JSON.stringify({ 
        user: { 
          id: guestUser.id, 
          is_guest: true 
        } 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (err) {
    console.error('Failed POST /api/auth:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// DELETE /api/auth - Logout
export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('session');
    
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
      cookies.delete('session', { path: '/' });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed DELETE /api/auth:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
