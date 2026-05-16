import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEEPSEEK_DEFAULT_MODEL, callDeepSeek, hashPromptPrefix } from './deepseek';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('callDeepSeek observability', () => {
  it('keeps the approved runtime default on the evaluated Flash model', () => {
    expect(DEEPSEEK_DEFAULT_MODEL).toBe('deepseek-v4-flash');
  });

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
          prompt_cache_miss_tokens: 25,
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
      cache_miss_tokens: 25,
      cache_hit_ratio: 0.75,
    });
  });

  it('derives cache miss tokens when DeepSeek omits the explicit miss field', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({ message: 'ok' }),
          },
        },
      ],
      usage: {
        prompt_tokens: 80,
        completion_tokens: 10,
        total_tokens: 90,
        prompt_cache_hit_tokens: 20,
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const result = await callDeepSeek('system', 'user', {
      apiKey: 'test-key',
    });

    expect(result.success).toBe(true);
    expect(result.tokens?.cache_miss_tokens).toBe(60);
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
