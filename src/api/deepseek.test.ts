import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEEPSEEK_DEFAULT_MODEL, callDeepSeek, hashPromptPrefix } from './deepseek';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('callDeepSeek observability', () => {
  it('uses the default model and exposes cache usage telemetry', async () => {
    let requestBody: any = null;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      requestBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({ message: 'ok' }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          total_tokens: 120,
          prompt_cache_hit_tokens: 75,
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    const result = await callDeepSeek('stable system prompt', 'player action', {
      apiKey: 'test-key',
      temperature: 0.2,
    });

    expect(result.success).toBe(true);
    expect(requestBody.model).toBe(DEEPSEEK_DEFAULT_MODEL);
    expect(requestBody.temperature).toBe(0.2);
    expect(result.model).toBe(DEEPSEEK_DEFAULT_MODEL);
    expect(result.temperature).toBe(0.2);
    expect(result.prompt_prefix_hash).toBe(hashPromptPrefix('stable system prompt'));
    expect(result.tokens).toMatchObject({
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
      cached_tokens: 75,
      cache_hit_ratio: 0.75,
    });
  });

  it('allows model override for gated evaluation runs', async () => {
    let requestBody: any = null;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      requestBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({ message: 'ok' }),
            },
          },
        ],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
          prompt_cache_hit_tokens: 0,
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    const result = await callDeepSeek('system', 'user', {
      apiKey: 'test-key',
      model: 'deepseek-reasoner',
    });

    expect(result.success).toBe(true);
    expect(requestBody.model).toBe('deepseek-reasoner');
    expect(result.model).toBe('deepseek-reasoner');
  });
});
