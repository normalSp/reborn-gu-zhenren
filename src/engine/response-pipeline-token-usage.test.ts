import { describe, expect, it } from 'vitest';
import type { DeepSeekResponse } from '../api/deepseek';
import {
  buildPipelineWarning,
  mergePipeTokenUsage,
  pipelineWarn,
  pipeTokenUsageFromResponse,
} from './response-pipeline';

describe('response pipeline token telemetry', () => {
  it('projects DeepSeek usage into pipeline-visible cache and prefix telemetry', () => {
    const response: DeepSeekResponse = {
      success: true,
      tokens: {
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
        cached_tokens: 75,
        cache_miss_tokens: 25,
        cache_hit_ratio: 0.75,
      },
      model: 'deepseek-chat',
      temperature: 0.7,
      prompt_prefix_hash: 'stable-prefix',
      elapsedMs: 320,
      retries: 0,
    };

    expect(pipeTokenUsageFromResponse(response, false)).toEqual({
      prompt: 100,
      completion: 20,
      total: 120,
      cached: 75,
      cacheMiss: 25,
      cacheHitRatio: 0.75,
      retryTotal: 0,
      calls: 1,
      model: 'deepseek-chat',
      temperature: 0.7,
      promptPrefixHash: 'stable-prefix',
    });
  });

  it('merges retry cost while preserving aggregate cache hit rate and latest model metadata', () => {
    const first = pipeTokenUsageFromResponse({
      success: true,
      tokens: {
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
        cached_tokens: 50,
        cache_miss_tokens: 50,
        cache_hit_ratio: 0.5,
      },
      model: 'deepseek-chat',
      temperature: 0.7,
      prompt_prefix_hash: 'stable-prefix',
    }, false);

    const retry = pipeTokenUsageFromResponse({
      success: true,
      tokens: {
        prompt_tokens: 80,
        completion_tokens: 15,
        total_tokens: 95,
        cached_tokens: 70,
        cache_miss_tokens: 10,
        cache_hit_ratio: 0.875,
      },
      model: 'deepseek-reasoner',
      temperature: 0.65,
      prompt_prefix_hash: 'retry-prefix',
    }, true);

    expect(mergePipeTokenUsage(first, retry)).toMatchObject({
      prompt: 180,
      completion: 35,
      total: 215,
      cached: 120,
      cacheMiss: 60,
      cacheHitRatio: 120 / 180,
      retryTotal: 95,
      calls: 2,
      model: 'deepseek-reasoner',
      temperature: 0.65,
      promptPrefixHash: 'retry-prefix',
    });
  });

  it('redacts sensitive prompt and token metadata from pipeline warnings', () => {
    const warning = buildPipelineWarning('unit-test-scope', new Error('boom'), {
      turn: 12,
      prompt: '完整 prompt 不应进入 warning',
      apiKey: 'sk-secret',
      nested: {
        userMessage: '玩家原始请求也应被遮蔽',
        safeStage: 'RESOLVED',
      },
      longText: 'x'.repeat(200),
    });

    expect(warning).toMatchObject({
      scope: 'unit-test-scope',
      message: 'boom',
      meta: {
        turn: 12,
        prompt: '[redacted]',
        apiKey: '[redacted]',
        nested: {
          userMessage: '[redacted]',
          safeStage: 'RESOLVED',
        },
      },
    });
    expect(String(warning.meta.longText)).toHaveLength(160);
  });

  it('keeps pipeline warnings non-blocking even if console logging fails', () => {
    const originalWarn = console.warn;
    console.warn = () => {
      throw new Error('console down');
    };

    try {
      expect(() => pipelineWarn('console-failure', new Error('optional system failed'), {
        token: 'secret-token',
      })).not.toThrow();
    } finally {
      console.warn = originalWarn;
    }
  });
});
