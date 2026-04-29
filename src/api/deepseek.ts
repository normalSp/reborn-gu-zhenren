const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

interface DeepSeekConfig {
  apiKey: string;
  maxRetries?: number;
  timeoutMs?: number;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cached_tokens: number;
}

interface DeepSeekResponse<T = any> {
  success: boolean;
  data?: T;
  tokens?: TokenUsage;
  elapsedMs?: number;
  error?: string;
  retries?: number;
}

async function callDeepSeek<T = any>(
  systemPrompt: string,
  userMessage: string,
  config: DeepSeekConfig
): Promise<DeepSeekResponse<T>> {
  const maxRetries = config.maxRetries ?? 2;
  const timeoutMs = config.timeoutMs ?? 30000;
  let lastError: string = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;
        if (attempt < maxRetries) {
          await delay(Math.pow(2, attempt) * 1000); // 指数退避: 1s, 2s
          continue;
        }
        return { success: false, error: lastError, retries: attempt };
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      const elapsedMs = Date.now() - startTime;

      if (!content) {
        lastError = 'Empty response content';
        if (attempt < maxRetries) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        return { success: false, error: lastError, retries: attempt };
      }

      let parsed: T;
      try {
        parsed = JSON.parse(content);
      } catch {
        lastError = 'JSON parse failed';
        if (attempt < maxRetries) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        return { success: false, error: lastError, retries: attempt };
      }

      const tokens: TokenUsage = {
        prompt_tokens: json.usage?.prompt_tokens ?? 0,
        completion_tokens: json.usage?.completion_tokens ?? 0,
        total_tokens: json.usage?.total_tokens ?? 0,
        cached_tokens: json.usage?.prompt_cache_hit_tokens ?? 0,
      };

      return { success: true, data: parsed, tokens, elapsedMs, retries: attempt };
    } catch (err: any) {
      lastError = err?.message || 'Unknown error';
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      return { success: false, error: lastError, retries: attempt };
    }
  }

  return { success: false, error: lastError, retries: maxRetries };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const apiKey = {
  get: (): string | null => localStorage.getItem('deepseek_api_key'),
  set: (key: string) => localStorage.setItem('deepseek_api_key', key),
  remove: () => localStorage.removeItem('deepseek_api_key'),
};

export { callDeepSeek, apiKey };
export type { DeepSeekConfig, DeepSeekResponse, TokenUsage };
