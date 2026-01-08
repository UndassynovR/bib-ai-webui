// src/routes/api/c/[id]/+server.ts
import type { RequestHandler } from "./$types";
import {
  getConversation,
  deleteConversation,
} from "$lib/server/services/conversation.service";
import { getConversationMessages } from "$lib/server/services/message.service";

// Get conversation with messages
export const GET: RequestHandler = async ({ params, locals }) => {
  const userId = locals.userId; // TODO: Implement auth middleware

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const conv = await getConversation(params.id, userId);

  if (!conv) {
    return new Response("Not found", { status: 404 });
  }

  const msgs = await getConversationMessages(params.id);

  return new Response(
    JSON.stringify({
      conversation: conv,
      messages: msgs,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

// Delete conversation
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const userId = locals.userId; // TODO: Implement auth middleware

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deleted = await deleteConversation(params.id, userId);

  if (!deleted) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
};
