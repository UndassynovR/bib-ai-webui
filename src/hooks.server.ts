// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';

const db = getDb();

// Admin account auto-creation flag
let adminCheckDone = false;

async function ensureAdminExists() {
  if (adminCheckDone) return;
  
  try {
    const adminEmail = 'admin@localhost';
    
    // Check if admin already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (!existing) {
      console.log('👤 Creating default admin account...');
      
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        email: adminEmail,
        name: 'Administrator',
        password_hash: passwordHash,
        auth_type: 'local',
        is_guest: false,
        role: 'admin'
      });
      
      console.log('✅ Admin account created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: admin123`);
      console.log('   ⚠️  IMPORTANT: Change this password after first login!');
    }
    
    adminCheckDone = true;
  } catch (err) {
    console.error('❌ Error checking/creating admin account:', err);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  // Create admin on first request if needed
  await ensureAdminExists();
  
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
            role: user.role,
            auth_type: user.auth_type as 'local' | 'ldap' // Include auth_type
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
        auth_type: 'local' // Guests are technically local accounts
      };
    } catch (error) {
      console.error('Failed to create guest user:', error);
    }
  }
  
  return resolve(event);
};
