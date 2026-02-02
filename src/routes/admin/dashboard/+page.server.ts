// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db/pg';
import { users, conversations, bookmarks } from '$lib/server/db/pg/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

const db = getDb();

// Store server start time
const serverStartTime = Date.now();

async function getApiPing(): Promise<number> {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    return Date.now() - start;
  } catch (err) {
    console.error('Failed to ping database:', err);
    return -1;
  }
}

export const load: PageServerLoad = async () => {
  try {
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Users - Total counts
    const totalUsers = await db.select({ total: sql<number>`count(*)::int` }).from(users);
    const registeredUsers = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.is_guest, false));
    const guestUsers = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.is_guest, true));

    // Active users (7 days)
    const activeUsersResult = await db
      .select({ total: sql<number>`count(distinct ${conversations.user_id})::int` })
      .from(conversations)
      .where(gte(conversations.updated_at, weekStart));

    // New users - time-based
    const newUsersToday = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.is_guest, false),
          gte(users.updated_at, todayStart)
        )
      );

    const newUsersThisWeek = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.is_guest, false),
          gte(users.updated_at, weekStart)
        )
      );

    const newUsersThisMonth = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.is_guest, false),
          gte(users.updated_at, monthStart)
        )
      );

    // Conversations - Total and time-based
    const totalConversations = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(conversations);

    const conversationsToday = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(conversations)
      .where(gte(conversations.updated_at, todayStart));

    const conversationsThisWeek = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(conversations)
      .where(gte(conversations.updated_at, weekStart));

    // Bookmarks
    const totalBookmarks = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookmarks);

    // Get API ping
    const apiPing = await getApiPing();

    // Calculate uptime in seconds
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

    return {
      stats: {
        uptime: {
          seconds: uptimeSeconds,
        },
        system: {
          apiPing: apiPing,
        },
        users: {
          total: totalUsers[0]?.total ?? 0,
          registered: registeredUsers[0]?.total ?? 0,
          guests: guestUsers[0]?.total ?? 0,
          active: activeUsersResult[0]?.total ?? 0,
          newToday: newUsersToday[0]?.total ?? 0,
          newThisWeek: newUsersThisWeek[0]?.total ?? 0,
          newThisMonth: newUsersThisMonth[0]?.total ?? 0,
        },
        conversations: {
          total: totalConversations[0]?.total ?? 0,
          today: conversationsToday[0]?.total ?? 0,
          thisWeek: conversationsThisWeek[0]?.total ?? 0,
        },
        bookmarks: {
          total: totalBookmarks[0]?.total ?? 0,
        },
      },
    };
  } catch (err) {
    console.error('Dashboard load error:', err);
    throw err;
  }
};
