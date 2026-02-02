// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, conversations, bookmarks } from '$lib/server/db/pg/schema';
import { eq, sql } from 'drizzle-orm';

const db = getDb();

// Store server start time
const serverStartTime = Date.now();

export const load: PageServerLoad = async () => {
  try {
    // Users
    const totalUsers = await db.select({ total: sql`COUNT(${users.id})` }).from(users);
    const registeredUsers = await db
      .select({ total: sql`COUNT(${users.id})` })
      .from(users)
      .where(eq(users.is_guest, false));
    const guestUsers = await db
      .select({ total: sql`COUNT(${users.id})` })
      .from(users)
      .where(eq(users.is_guest, true));

    // Conversations
    const totalConversations = await db.select({ total: sql`COUNT(${conversations.id})` }).from(conversations);

    // Bookmarks
    const totalBookmarks = await db.select({ total: sql`COUNT(${bookmarks.id})` }).from(bookmarks);

    // Calculate uptime in seconds
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

    return {
      stats: {
        uptime: {
          seconds: uptimeSeconds,
        },
        users: {
          total: Number(totalUsers[0]?.total ?? 0),
          registered: Number(registeredUsers[0]?.total ?? 0),
          guests: Number(guestUsers[0]?.total ?? 0),
        },
        conversations: {
          total: Number(totalConversations[0]?.total ?? 0),
        },
        bookmarks: {
          total: Number(totalBookmarks[0]?.total ?? 0),
        },
      },
    };
  } catch (err) {
    console.error('Dashboard load error:', err);
    return {
      stats: {
        uptime: { seconds: 0 },
        users: { total: 0, registered: 0, guests: 0 },
        conversations: { total: 0 },
        bookmarks: { total: 0 },
      },
    };
  }
};
