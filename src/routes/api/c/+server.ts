// src/routes/api/c/+server.ts
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db/pg";
import { users, conversations } from "$lib/server/db/pg/schema";
import { eq, desc } from "drizzle-orm";

// List all conversations for the user
export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.userId;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Fetch conversations
    const convs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at));

    return new Response(JSON.stringify(convs || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed GET /api/c:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};

// Create new conversation
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.userId;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { title = "New Chat", model = "gpt-4o" } = await request.json();

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Insert conversation (id and updated_at are auto-generated)
    const [conv] = await db
      .insert(conversations)
      .values({
        user_id: userId,
        title,
        model,
      })
      .returning();

    return new Response(JSON.stringify(conv), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed POST /api/c:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
