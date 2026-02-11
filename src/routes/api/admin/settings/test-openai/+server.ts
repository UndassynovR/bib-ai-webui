// /api/admin/settings/test-openai/+server.ts
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Minimal OpenAI API test: list models
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('OpenAI API error:', text);

      return new Response(
        JSON.stringify({ error: 'OpenAI connection failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OpenAI test error:', error);
    return new Response(
      JSON.stringify({ error: 'Connection failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

