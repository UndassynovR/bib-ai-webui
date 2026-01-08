// src/routes/api/c/[id]/messages/+server.ts
import type { RequestHandler } from "./$types";
import { 
  getConversation, 
  updateConversationTimestamp,
  updateConversationTitle,
} from "$lib/server/services/conversation.service";
import {
  getConversationMessages,
  saveUserMessage,
  saveAssistantMessage,
  formatMessagesForAI,
} from "$lib/server/services/message.service";
import { streamChatCompletion, generateConversationTitle } from "$lib/server/services/ai.service";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const conversationId = params.id;
  const userId = locals.userId; // TODO: Implement auth middleware

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify conversation ownership
  const conv = await getConversation(conversationId, userId);
  if (!conv) {
    return new Response("Not found", { status: 404 });
  }

  // Get user message
  const { content } = await request.json();

  // Save user message
  await saveUserMessage(conversationId, content);

  // Get conversation history AFTER saving the user message
  const history = await getConversationMessages(conversationId);
  
  // Check if this is the first user message
  const isFirstMessage = history.length === 1;
  console.log('Message count:', history.length, 'isFirstMessage:', isFirstMessage, 'conv.title:', conv.title);

  const langchainMessages = formatMessagesForAI(history);

  // Create SSE stream
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let assistantMessage = "";
      let titlePromise: Promise<void> | null = null;

      // If this is the first message, start generating title
      if (isFirstMessage) {
        console.log('Starting title generation for message:', content.substring(0, 50));
        titlePromise = generateConversationTitle(content)
          .then(async (newTitle) => {
            console.log('Generated title:', newTitle);
            await updateConversationTitle(conversationId, newTitle);
            // Send title update to client
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ title: newTitle })}\n\n`)
            );
            console.log('Title updated and sent to client');
          })
          .catch(err => console.error('Failed to generate/update title:', err));
      }

      try {
        // Stream AI response
        for await (const { delta, fullContent } of streamChatCompletion(langchainMessages)) {
          assistantMessage = fullContent;

          // Send delta to client
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
          );
        }

        // Save assistant message to DB
        await saveAssistantMessage(conversationId, assistantMessage);

        // Update conversation timestamp
        await updateConversationTimestamp(conversationId);

        // Wait for title generation to complete if it was started
        if (titlePromise) {
          await titlePromise;
        }

        // Send completion signal
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
          )
        );
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
