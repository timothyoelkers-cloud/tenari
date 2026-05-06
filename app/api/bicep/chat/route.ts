import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are an expert Azure Bicep Infrastructure-as-Code generator.
Generate clean, production-ready Bicep templates based on the user's requirements.
Follow these principles:
- Use latest stable API versions
- Include all required parameters with sensible defaults
- Add @description decorators to parameters and variables
- Enable diagnostic settings and tags by default
- Follow Microsoft naming conventions (kebab-case for resources)
- Include proper RBAC assignments when relevant
- Always output only valid Bicep code — no explanations unless asked
- Wrap the template in a single code block when it is the final answer`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          system: SYSTEM,
          messages,
        });

        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
