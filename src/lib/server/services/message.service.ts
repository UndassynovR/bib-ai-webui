// src/lib/server/services/message.service.ts
import { db } from "$lib/server/db/pg";
import { messages } from "$lib/server/db/pg/schema";
import { eq, asc } from "drizzle-orm";

export async function getConversationMessages(conversationId: string) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversation_id, conversationId))
    .orderBy(asc(messages.id));
}

export async function saveUserMessage(conversationId: string, content: string) {
  const [msg] = await db
    .insert(messages)
    .values({
      conversation_id: conversationId,
      is_user: true,
      content,
    })
    .returning();

  return msg;
}

export async function saveAssistantMessage(conversationId: string, content: string) {
  const [msg] = await db
    .insert(messages)
    .values({
      conversation_id: conversationId,
      is_user: false,
      content,
    })
    .returning();

  return msg;
}

export function formatMessagesForAI(msgs: Array<{ is_user: boolean; content: string }>) {
  return msgs.map((msg) => ({
    role: msg.is_user ? "user" : "assistant",
    content: msg.content,
  }));
}
