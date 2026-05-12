const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_DEFAULT_MODEL = 'deepseek-chat';

interface DeepSeekConfig {
  apiKey: string;
  /** Runtime model. Keep default cheap/stable; use stronger models only after eval gates. */
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
  /** v0.7.0: 动态temperature，叙事0.85/战斗0.65/默认0.7 */
  temperature?: number;
  /** v0.7.0: 最大上下文token预算，超出时启用滑动窗口 */
  maxContextTokens?: number;
}

/** v0.7.0: 动态temperature函数 — 审查报告P4修复 */
export function getDynamicTemperature(contextType: 'narrative' | 'combat' | 'default'): number {
  switch (contextType) {
    case 'narrative': return 0.85;  // 叙事需要多样性
    case 'combat':    return 0.65;  // 战斗需要一致性
    default:          return 0.70;
  }
}

/** v0.7.0: 滑动窗口截断 — 审查报告P1修复，MAX_CONTEXT_TOKENS=8000 */
export function applySlidingWindow(messages: Array<{role: string; content: string}>, maxTokens: number = 8000): Array<{role: string; content: string}> {
  let estimatedTokens = 0;
  const result: Array<{role: string; content: string}> = [];
  // 从最新的消息往前累加，保留最近的对话
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokenEstimate = Math.ceil(messages[i].content.length * 0.4); // ~0.4 tokens/char for Chinese
    if (estimatedTokens + msgTokenEstimate > maxTokens && result.length > 0) break;
    estimatedTokens += msgTokenEstimate;
    result.unshift(messages[i]);
  }
  return result;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cached_tokens: number;
  cache_hit_ratio: number;
}

interface DeepSeekResponse<T = any> {
  success: boolean;
  data?: T;
  tokens?: TokenUsage;
  model?: string;
  temperature?: number;
  prompt_prefix_hash?: string;
  elapsedMs?: number;
  error?: string;
  retries?: number;
}

function hashPromptPrefix(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function callDeepSeek<T = any>(
  systemPrompt: string,
  userMessage: string,
  config: DeepSeekConfig
): Promise<DeepSeekResponse<T>> {
  const maxRetries = config.maxRetries ?? 2;
  const timeoutMs = config.timeoutMs ?? 30000;
  const model = config.model?.trim() || DEEPSEEK_DEFAULT_MODEL;
  const temperature = config.temperature ?? getDynamicTemperature('default');
  const promptPrefixHash = hashPromptPrefix(systemPrompt);
  let lastError: string = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // v0.7.0: 启用 response_format 约束 JSON 输出 + 动態 temperature
      const bodyObj: any = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        response_format: { type: 'json_object' },
      };
      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(bodyObj),
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
        return { success: false, error: lastError, retries: attempt, model, temperature, prompt_prefix_hash: promptPrefixHash };
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
        return { success: false, error: lastError, retries: attempt, model, temperature, prompt_prefix_hash: promptPrefixHash };
      }

      let parsed: T;
      try {
        // 5B: 剥离 markdown 代码块包裹 + 清理首尾空白
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
        }
        parsed = JSON.parse(cleanContent);
      } catch {
        lastError = 'JSON parse failed';
        if (attempt < maxRetries) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        return { success: false, error: lastError, retries: attempt, model, temperature, prompt_prefix_hash: promptPrefixHash };
      }

      const promptTokens = json.usage?.prompt_tokens ?? 0;
      const cachedTokens = json.usage?.prompt_cache_hit_tokens ?? 0;
      const tokens: TokenUsage = {
        prompt_tokens: promptTokens,
        completion_tokens: json.usage?.completion_tokens ?? 0,
        total_tokens: json.usage?.total_tokens ?? 0,
        cached_tokens: cachedTokens,
        cache_hit_ratio: promptTokens > 0 ? cachedTokens / promptTokens : 0,
      };

      return {
        success: true,
        data: parsed,
        tokens,
        model,
        temperature,
        prompt_prefix_hash: promptPrefixHash,
        elapsedMs,
        retries: attempt,
      };
    } catch (err: any) {
      lastError = err?.message || 'Unknown error';
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      return { success: false, error: lastError, retries: attempt, model, temperature, prompt_prefix_hash: promptPrefixHash };
    }
  }

  return { success: false, error: lastError, retries: maxRetries, model, temperature, prompt_prefix_hash: promptPrefixHash };
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
export { DEEPSEEK_DEFAULT_MODEL, hashPromptPrefix };
export type { DeepSeekConfig, DeepSeekResponse, TokenUsage };
