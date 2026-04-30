import { callDeepSeek, apiKey } from '../api/deepseek';
import { NarrativeJSONSchema } from '../schemas/narrative.schema';
import { validateNarrativeSemantics } from './semantic-validator';
import { validateCanaryAssertions } from './canary-assertions';
import { applyStateUpdate } from './state-update-applier';
import { contextBuilder } from './context-builder';
import { useStore } from '../store';
import type { NarrativeJSON, AIContext } from '../types';
import type { SemanticValidationResult } from './semantic-validator';
import type { CanaryValidationResult } from './canary-assertions';

// ─── 管道状态 ───
export type PipeState =
  | 'IDLE'
  | 'BUILDING_CONTEXT'
  | 'FETCHING'
  | 'PARSING'
  | 'VALIDATING_L4'
  | 'VALIDATING_L3'
  | 'VALIDATING_L3_RETRY'
  | 'VALIDATING_FORMAT'
  | 'RESOLVED'
  | 'ERROR';

// ─── 管道结果 ───
export interface PipeResult {
  state: PipeState;
  narrative?: NarrativeJSON;
  validation?: SemanticValidationResult;
  canary?: CanaryValidationResult;
  error?: string;
  tokens?: { prompt: number; completion: number; total: number };
  elapsedMs?: number;
  retries?: number;
}

// ─── 配置 ───
interface PipelineConfig {
  maxJsonRetries: number;
  maxNetworkRetries: number;
  maxSemanticRetries: number;
  mode: 'canon' | 'if';
}

const DEFAULT_CONFIG: PipelineConfig = {
  maxJsonRetries: 1,
  maxNetworkRetries: 2,
  maxSemanticRetries: 1, // L3 critical违规后最多修正重试1次
  mode: 'canon',
};

// ─── 构建L3修正提示 ───
function buildSemanticRetryPrompt(semanticResult: SemanticValidationResult, originalText: string): string {
  const criticalRules = semanticResult.failedRules.filter(r => r.level === 'critical');
  const ruleNames = criticalRules.map(r => r.ruleName).join('、');

  let prompt = `天意检校发现你的叙事存在严重违规！\n\n`;
  prompt += `违规规则：${ruleNames}\n\n`;
  for (const rule of criticalRules) {
    prompt += `- ${rule.ruleName}：${rule.details}\n`;
  }
  prompt += `\n请重新生成叙事文本和选项，确保：\n`;
  prompt += `1. NPC不会无条件友善、信任或免费送资源\n`;
  prompt += `2. 境界体系不可逾越——高境界绝对压制低境界\n`;
  prompt += `3. 所有机缘都有对等代价\n`;
  prompt += `4. 保持黑暗现实叙事基调\n`;
  prompt += `5. 叙事文本200-500字\n`;
  prompt += `\n请严格按照JSON格式重新输出，不要输出任何JSON以外的文字。`;

  return prompt;
}

// ═══════════════════════════════════════════════
// 响应管道
// ═══════════════════════════════════════════════
export class ResponsePipeline {
  private state: PipeState = 'IDLE';
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): PipeState {
    return this.state;
  }

  // ─── 单次获取+解析+验证 ───
  private async fetchAndValidate(
    key: string,
    messages: { system: string; user: string },
    startTime: number,
    attemptLabel: string
  ): Promise<{ success: true; parsed: any; tokens?: any } | { success: false; error: string }> {
    this.state = 'FETCHING';
    const response = await callDeepSeek<any>(
      messages.system,
      messages.user,
      { apiKey: key, maxRetries: this.config.maxNetworkRetries, timeoutMs: 45000 }
    );

    if (!response.success || !response.data) {
      return { success: false, error: `AI 响应失败${attemptLabel}: ${response.error || '未知'}` };
    }

    // 解析JSON
    this.state = 'PARSING';
    let parsed: any;
    try {
      parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch {
      // JSON解析失败——注入反馈重试
      if (this.config.maxJsonRetries > 0) {
        const fixRetry = await callDeepSeek<any>(
          messages.system,
          messages.user + '\n\n[系统] JSON不合法，请严格按格式重新输出。只输出JSON。',
          { apiKey: key, maxRetries: 1, timeoutMs: 45000 }
        );
        if (!fixRetry.success || !fixRetry.data) {
          return { success: false, error: `JSON解析重试失败: ${fixRetry.error || '未知'}` };
        }
        try {
          parsed = typeof fixRetry.data === 'string' ? JSON.parse(fixRetry.data) : fixRetry.data;
        } catch {
          return { success: false, error: 'JSON解析重试后仍然失败' };
        }
      } else {
        return { success: false, error: 'AI响应JSON解析失败' };
      }
    }

    // Zod格式验证
    this.state = 'VALIDATING_FORMAT';
    const zodResult = NarrativeJSONSchema.safeParse(parsed);
    if (!zodResult.success) {
      const errors = zodResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      if (this.config.maxJsonRetries > 0) {
        const fixRetry = await callDeepSeek<any>(
          messages.system,
          messages.user + `\n\n[系统] JSON格式问题：${errors}。请修正后重新输出。`,
          { apiKey: key, maxRetries: 1, timeoutMs: 45000 }
        );
        if (fixRetry.success && fixRetry.data) {
          const retryParsed = typeof fixRetry.data === 'string' ? JSON.parse(fixRetry.data) : fixRetry.data;
          const retryZod = NarrativeJSONSchema.safeParse(retryParsed);
          if (!retryZod.success) {
            return { success: false, error: `Zod验证重试后仍失败` };
          }
          parsed = retryZod.data;
        } else {
          return { success: false, error: `Zod验证失败: ${errors}` };
        }
      } else {
        return { success: false, error: `Zod验证失败: ${errors}` };
      }
    } else {
      parsed = zodResult.data;
    }

    return { success: true, parsed };
  }

  // ─── 主处理入口 ───
  async process(
    choiceId: string | null,
    isOpening: boolean = false
  ): Promise<PipeResult> {
    const key = apiKey.get();
    if (!key) {
      return { state: 'ERROR', error: 'API Key 未设置' };
    }

    const startTime = Date.now();
    const store = useStore.getState();

    try {
      // 阶段1: 构建上下文
      this.state = 'BUILDING_CONTEXT';
      const context = contextBuilder.buildFullContext(store, this.config.mode, isOpening);
      const baseMessages = contextBuilder.buildMessages(context, choiceId || undefined);

      // 阶段2-4: 获取+解析+格式验证
      const fetchResult = await this.fetchAndValidate(key, baseMessages, startTime, '');
      if (!fetchResult.success) {
        return { state: 'ERROR', error: fetchResult.error, elapsedMs: Date.now() - startTime };
      }

      let parsed = fetchResult.parsed;

      // ═══ 阶段5: Layer 4 金丝雀断言（前置过滤） ═══
      this.state = 'VALIDATING_L4';
      let canaryResult: CanaryValidationResult | undefined;
      if (parsed?.narrative?.text) {
        canaryResult = validateCanaryAssertions(parsed as NarrativeJSON, store);
        if (canaryResult.recommendation === 'reject') {
          return {
            state: 'ERROR',
            error: `Layer 4 金丝雀断言不通过: ${canaryResult.failedCritical.map(r => r.ruleName).join('、')}`,
            elapsedMs: Date.now() - startTime,
          };
        }
      }

      // ═══ 阶段6: Layer 3 语义验证 + 反馈修正重试 ═══
      this.state = 'VALIDATING_L3';
      let semanticResult: SemanticValidationResult | undefined;

      if (parsed?.narrative?.text) {
        semanticResult = validateNarrativeSemantics(parsed.narrative.text);

        // L3 critical违规 → 反馈修正重试（Layer 2 补全核心）
        if (semanticResult.recommendation === 'reject' && this.config.maxSemanticRetries > 0) {
          this.state = 'VALIDATING_L3_RETRY';

          // 构建修正提示
          const retryPrompt = buildSemanticRetryPrompt(semanticResult, parsed.narrative.text);

          // 以 user message 追加修正提示，让AI基于之前的对话上下文修正
          const retryMessages = {
            system: baseMessages.system,
            user: baseMessages.user + '\n\n[天意检校·修正要求]\n' + retryPrompt,
          };

          const retryResult = await this.fetchAndValidate(key, retryMessages, startTime, '(修正重试)');

          if (retryResult.success) {
            parsed = retryResult.parsed;
            // 重新验证修正后的结果
            if (parsed?.narrative?.text) {
              semanticResult = validateNarrativeSemantics(parsed.narrative.text);
              // 修正后仍有critical→放弃，返回ERROR
              if (semanticResult.recommendation === 'reject') {
                return {
                  state: 'ERROR',
                  error: `Layer 3 语义验证修正重试后仍不通过: ${semanticResult.failedRules.map(r => r.ruleName).join('、')}`,
                  validation: semanticResult,
                  elapsedMs: Date.now() - startTime,
                  retries: 1,
                };
              }
            }
          } else {
            return {
              state: 'ERROR',
              error: `语义修正重试失败: ${retryResult.error}`,
              elapsedMs: Date.now() - startTime,
            };
          }
        }

        // 修正后仍有warning但无critical → warn_only，可接受
        if (semanticResult && semanticResult.recommendation === 'reject') {
          return {
            state: 'ERROR',
            error: `Layer 3 语义验证不通过: ${semanticResult.failedRules.map(r => r.ruleName).join('、')}`,
            validation: semanticResult,
            elapsedMs: Date.now() - startTime,
          };
        }
      }

      // ─── 所有验证通过，进入 RESOLVED 阶段 ───
      this.state = 'RESOLVED';
      const narrative = parsed as NarrativeJSON;

      useStore.getState().setCurrentNarrative(narrative);
      useStore.getState().appendMessage({
        role: 'assistant',
        content: narrative.narrative.text,
      });

      applyStateUpdate(narrative.state_update);

      // ═══ 死亡检测：叙事导致HP归零 → 触发game_over ═══
      const updatedStore = useStore.getState();
      if ((updatedStore as any).isDead && (updatedStore as any).screenState !== 'game_over') {
        (updatedStore as any).setScreenState?.('game_over');
      }

      // 最终 L3 验证
      if (narrative.narrative.text) {
        semanticResult = validateNarrativeSemantics(narrative.narrative.text);
      }

      return {
        state: 'RESOLVED',
        narrative,
        validation: semanticResult,
        canary: canaryResult,
        elapsedMs: Date.now() - startTime,
      };
    } catch (err: any) {
      this.state = 'ERROR';
      return {
        state: 'ERROR',
        error: err?.message || '管道处理异常',
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  reset(): void {
    this.state = 'IDLE';
  }
}

export function createPipeline(config?: Partial<PipelineConfig>): ResponsePipeline {
  return new ResponsePipeline(config);
}
