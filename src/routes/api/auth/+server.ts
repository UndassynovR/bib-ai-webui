// src/routes/api/auth/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';
import { Client } from 'ldapts';
import { readdirSync } from 'fs';
import { join } from 'path';
import { env } from '$env/dynamic/private';

const LDAP_LOGIN = env.LDAP_LOGIN;
const LDAP_PASSWORD = env.LDAP_PASSWORD;

const db = getDb();
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// LDAP client - will be initialized on first use
let client: Client | null = null;

async function getLDAPClient() {
  if (client) return client;
  
  // List what's in the certs directory
  const certDir = '/usr/local/share/ca-certificates';
  console.log('Contents of cert directory:', readdirSync(certDir));
  
  // Find the .crt file
  const files = readdirSync(certDir);
  const certFile = files.find(f => f.endsWith('.crt'));
  
  if (!certFile) {
    throw new Error('No .crt file found in ' + certDir);
  }
  
  const certPath = join(certDir, certFile);
  console.log('Using certificate:', certPath);
  
  // Read CA file using Bun
  const caCertFile = Bun.file(certPath);
  const caCert = await caCertFile.text();

  client = new Client({
    url: 'ldaps://dc1.kaztbu.edu.kz:636',
    tlsOptions: {
      ca: [caCert]
    }
  });
  
  return client;
}

async function authenticateLDAP(username: string, password: string) {
  const client = await getLDAPClient();
  const baseDN = 'ou=Univer,dc=kaztbu,dc=edu,dc=kz';
  const filter = `(sAMAccountName=${username})`;

  try {
    // Bind as service account
    await client.bind(LDAP_LOGIN, LDAP_PASSWORD);
    
    // Search for the user
    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter
    });

    if (searchEntries.length === 0) {
      console.log('User not found in LDAP');
      return null;
    }

    console.log('User found:', searchEntries[0].dn);

    // Try binding as the user
    try {
      await client.bind(searchEntries[0].dn as string, password);
      console.log('Authentication successful');
      return searchEntries[0];
    } catch (bindError) {
      console.log('Password verification failed');
      return null;
    }
  } catch (error) {
    console.error('LDAP authentication error:', error);
    throw error;
  }
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    user_id: userId,
    token,
    expires_at: expiresAt
  });

  return { token, expiresAt };
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { action, username, password } = await request.json();

    if (action === 'guest') {
      const [guestUser] = await db.insert(users).values({ is_guest: true }).returning();
      const { token, expiresAt } = await createSession(guestUser.id);

      cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt
      });

      return new Response(JSON.stringify({ user: { id: guestUser.id, is_guest: true } }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'login') {
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const ldapUser = await authenticateLDAP(username, password);

      if (!ldapUser) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Map LDAP info
      const email = (ldapUser.mail as string) || `${username}@kaztbu.edu.kz`;
      const name = (ldapUser.displayName as string) || username;

      // Check if a user exists in DB
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      let userId: string;

      if (existing) {
        // Promote guest if needed
        if (existing.is_guest) {
          await db
            .update(users)
            .set({ name, is_guest: false, updated_at: new Date() })
            .where(eq(users.id, existing.id));
        }
        userId = existing.id;
      } else {
        // Create new LDAP-backed user
        const [newUser] = await db
          .insert(users)
          .values({ email, name, is_guest: false })
          .returning();
        userId = newUser.id;
      }

      const { token, expiresAt } = await createSession(userId);

      cookies.set('session', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt
      });

      return new Response(
        JSON.stringify({ user: { id: userId, email, name, is_guest: false } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Failed POST /api/auth:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get('session');

    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
      cookies.delete('session', { path: '/' });
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error('Failed DELETE /api/auth:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
