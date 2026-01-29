// src/lib/server/services/conversation.service.ts
import { getDb } from '$lib/server/db/pg';
const db = getDb();
import { conversations } from "$lib/server/db/pg/schema";
import { eq, desc } from "drizzle-orm";

export async function listConversations(userId: string) {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.user_id, userId))
    .orderBy(desc(conversations.updated_at));
}

export async function getConversation(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conv || conv.user_id !== userId) {
    return null;
  }

  return conv;
}

export async function createConversation(
  userId: string,
  title: string = "New Chat",
  model: string = "gpt-4o"
) {
  const [conv] = await db
    .insert(conversations)
    .values({
      user_id: userId,
      title,
      model,
    })
    .returning();

  return conv;
}

export async function updateConversationTimestamp(conversationId: string) {
  await db
    .update(conversations)
    .set({ updated_at: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function updateConversationTitle(conversationId: string, title: string) {
  await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId));
}

export async function deleteConversation(conversationId: string, userId: string) {
  const conv = await getConversation(conversationId, userId);
  if (!conv) return false;

  await db
    .delete(conversations)
    .where(eq(conversations.id, conversationId));

  return true;
}
