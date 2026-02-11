// src/routes/api/auth/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, sessions } from '$lib/server/db/pg/schema';
import { eq } from 'drizzle-orm';
import { Client } from 'ldapts';
import { getAppConfig } from '$lib/server/config';

// 1. Updated path to match your settings handler
const CERT_FILE_PATH = '/app/data/settings/ldap-cert.crt';

const config = await getAppConfig();
const LDAP_URL = config.LDAP_URL;
const LDAP_BASE_DN = config.LDAP_BASE_DN;
const LDAP_ADMIN_LOGIN = config.LDAP_ADMIN_LOGIN;
const LDAP_ADMIN_PASSWORD = config.LDAP_ADMIN_PASSWORD;

const db = getDb();
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

let client: Client | null = null;

async function getLDAPClient() {
  if (client) return client;

  let tlsOptions: any = { rejectUnauthorized: false }; // Fallback if no cert exists

  // 2. Check if the certificate exists using Bun.file
  const certFile = Bun.file(CERT_FILE_PATH);
  const exists = await certFile.exists();

  if (exists) {
    const caCert = await certFile.text();
    tlsOptions = {
      ca: [caCert],
      rejectUnauthorized: true 
    };
    console.log('LDAP Client: Using custom certificate from settings.');
  } else {
    console.warn('LDAP Client: No certificate found at path, proceeding without CA verification.');
  }

  client = new Client({
    url: LDAP_URL,
    tlsOptions: tlsOptions
  });

  return client;
}

function normalizeUsername(input: string): string {
  // If input ends with @kaztbu.edu.kz, strip it to get the username
  if (input.endsWith('@kaztbu.edu.kz')) {
    return input.replace('@kaztbu.edu.kz', '');
  }
  return input;
}

async function authenticateLDAP(username: string, password: string) {
  const client = await getLDAPClient();
  // const baseDN = 'ou=Univer,dc=kaztbu,dc=edu,dc=kz';
  const filter = `(sAMAccountName=${username})`;

  try {
    // Bind as service account
    await client.bind(LDAP_ADMIN_LOGIN, LDAP_ADMIN_PASSWORD);

    // Search for the user
    const { searchEntries } = await client.search(LDAP_BASE_DN, {
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

function determineRole(dn: string): 'admin' | 'user' {
  // Check if the DN contains OU=IT
  return dn.includes('OU=IT') ? 'admin' : 'user';
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { action, username: rawUsername, password } = await request.json();

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
      if (!rawUsername || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Normalize username - strip @kaztbu.edu.kz if present
      const username = normalizeUsername(rawUsername);

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
      const role = determineRole(ldapUser.dn as string);

      // Delete any existing guest account for this session
      const currentSessionToken = cookies.get('session');
      if (currentSessionToken) {
        const [currentSession] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.token, currentSessionToken))
          .limit(1);

        if (currentSession) {
          const [currentUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, currentSession.user_id))
            .limit(1);

          // If current user is a guest, delete their session and account
          if (currentUser?.is_guest) {
            await db.delete(sessions).where(eq(sessions.user_id, currentUser.id));
            await db.delete(users).where(eq(users.id, currentUser.id));
            console.log('Deleted guest account:', currentUser.id);
          }
        }
      }

      // Check if a registered user exists in DB
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      let userId: string;

      if (existing) {
        // Update user info including role
        await db
          .update(users)
          .set({ 
            name, 
            role, 
            is_guest: false, 
            updated_at: new Date() 
          })
          .where(eq(users.id, existing.id));
        userId = existing.id;
      } else {
        // Create new LDAP-backed user with role
        const [newUser] = await db
          .insert(users)
          .values({ email, name, role, is_guest: false })
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
        JSON.stringify({ user: { id: userId, email, name, role, is_guest: false } }),
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
