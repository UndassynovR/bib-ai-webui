import * as z from "zod";
import readline from "node:readline";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { searchBooksTool } from "$lib/server/services/tools/searchBooks";

// simple test tools
const search = tool(
  ({ query }) => `Results for: ${query}`,
  {
    name: "search",
    description: "Search",
    schema: z.object({ query: z.string() }),
  }
);

const getWeather = tool(
  ({ location }) => `Weather in ${location}: Sunny`,
  {
    name: "get_weather",
    schema: z.object({ location: z.string() }),
  }
);

// model
const model = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: "gpt-4o",
  temperature: 0.1,
});

// agent
const agent = await createAgent({
  model,
  tools: [search, getWeather, searchBooksTool],
});

// readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

function ask(prompt: string) {
  return new Promise<string>(resolve => rl.question(prompt, resolve));
}

console.log("AI Agent REPL. Type your question. Ctrl+C to exit.\n");

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  if (input === "exit") break;

  try {
    // Pass messages as simple strings
    const result = await agent.invoke({
      messages: [new HumanMessage(input)],
    });

    // Extract last message text
    const last = result.messages?.[result.messages.length - 1];
    const out = typeof last?.content === "string"
      ? last.content
      : Array.isArray(last?.content)
        ? last.content.map(p => p.text ?? "").join("")
        : "(no content)";

    console.log(out);
  } catch (err) {
    console.error("Error:", err);
  }
}

rl.close();
process.exit(0);
