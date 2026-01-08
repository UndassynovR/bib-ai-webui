import { OPENAI_API_KEY } from "$env/static/private";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { searchBooksTool } from "$lib/server/services/tools/searchBooks";

interface Message {
  role: string;
  content: string;
}

interface StreamChunk {
  delta: string;
  fullContent: string;
}

const model = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: "gpt-4o",
  temperature: 0.1,
  streaming: true,
});

const agent = await createAgent({
  model,
  tools: [searchBooksTool],
});

export async function* streamChatCompletion(
  messages: Message[]
): AsyncGenerator<StreamChunk> {
  let fullContent = "";

  for await (const [token, metadata] of await agent.stream(
    { messages },
    { streamMode: "messages" }
  )) {
    // Filter out raw ITEM_STR objects and only include plain text
    const delta = token.contentBlocks
      ?.map((b: any) => {
        if (!b.text) return "";
        // skip JSON-like blocks
        // if (b.text.trim().startsWith("[{") && b.text.includes("title")) return "";
        return b.text;
      })
      .filter(Boolean)
      .join("") || "";

    if (delta) {
      fullContent += delta;
      yield { delta, fullContent };
    }
  }
}

export async function generateConversationTitle(message: string): Promise<string> {
  console.log('generateConversationTitle called with message:', message.substring(0, 100));
  
  // Simple greeting check (case-insensitive)
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "привет", "здравствуйте", "доброе утро", "добрый день", "добрый вечер", "сәлем", "сәлеметсіз бе", "қайырлы таң", "қайырлы күн", "қайырлы кеш", "ассалаумағалейкум"];
  const normalized = message.trim().toLowerCase();
  if (greetings.includes(normalized)) {
    return "New chat";
  }
  
  try {
    const titleModel = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 30, // This is correct for LangChain
    });
    
    console.log('Invoking OpenAI for title generation...');
    
    // Use proper LangChain message format
    const response = await titleModel.invoke([
      {
        role: "system",
        content: "Generate a concise, descriptive title (max 50 characters) for a conversation. Return ONLY the title, no quotes, explanations, or extra text."
      },
      {
        role: "user",
        content: `Generate a title for a conversation that starts with: "${message}"`
      }
    ]);
    
    // Handle different possible response formats
    let title = "";
    if (typeof response.content === 'string') {
      title = response.content;
    } else if (Array.isArray(response.content)) {
      // Handle array of content blocks
      title = response.content
        .map((block: any) => {
          if (typeof block === 'string') return block;
          if (block.text) return block.text;
          if (block.type === 'text' && block.text) return block.text;
          return '';
        })
        .join('');
    } else {
      title = String(response.content);
    }
    
    // Clean up the title
    title = title.trim().replace(/^["']|["']$/g, '');
    console.log('AI generated title:', title);
    
    // Ensure it's not too long
    if (title.length > 50) {
      return title.substring(0, 47) + '...';
    }
    
    return title || message.substring(0, 47) + '...';
  } catch (error) {
    console.error('Failed to generate title:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    // Fallback: use first part of message
    return message.substring(0, 47) + (message.length > 47 ? '...' : '');
  }
}
