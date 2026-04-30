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

// ─── 5D: AI响应归一化器（Zod校验前运行，覆盖全部AI变体） ───
function normalizeAIResponse(parsed: any): void {
  // 0. narrative为纯字符串 → 包裹为对象 { text }
  if (typeof parsed.narrative === 'string') {
    parsed.narrative = { text: parsed.narrative };
  }
  if (!parsed.narrative || typeof parsed.narrative !== 'object') parsed.narrative = {};

  // 1. 顶层映射: choices/options→narrative.choices, stateUpdate/stateUpdates→state_update
  if (parsed.choices && !parsed.narrative.choices) parsed.narrative.choices = parsed.choices;
  if (parsed.options && !parsed.narrative.choices) parsed.narrative.choices = parsed.options;
  if (!parsed.state_update) {
    parsed.state_update = parsed.stateUpdate || parsed.stateUpdates || undefined;
  }
  if (!parsed.narrative?.choices?.length) return;

  // 2. 选项内部归一化
  for (const choice of parsed.narrative.choices) {
    let nested: any = choice.outcomes || choice.consequences || choice.outcome;
    if (typeof nested === 'string') nested = { description: nested };
    if (!nested) continue;
    if (!choice.risk_note && nested.description) choice.risk_note = nested.description;
    // 5E: choice.risk 可能被AI写入中文描述 → 移到 risk_note 并重新推断
    if (choice.risk && !['high','medium','low'].includes(choice.risk)) {
      if (!choice.risk_note) choice.risk_note = choice.risk;
      choice.risk = undefined;
    }
    if (nested.risk && !choice.risk) {
      const r = nested.risk;
      choice.risk = r === '高' ? 'high' : r === '低' ? 'low' : r === '中' ? 'medium' : r;
    }
    if (!choice.risk) {
      const d = nested.description || '';
      if (/危险|反噬|致命|重伤|代价/.test(d)) choice.risk = 'high';
      else if (/安全|稳妥|返回|退出/.test(d)) choice.risk = 'low';
      else choice.risk = 'medium';
    }
  }
}

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
    console.log(`%c[PIPE] FETCHING %c→ system=${messages.system.length}c user=${messages.user.length}c`,
      'color:#b8860b', 'color:#999');

    const response = await callDeepSeek<any>(
      messages.system,
      messages.user,
      { apiKey: key, maxRetries: this.config.maxNetworkRetries, timeoutMs: 45000 }
    );

    if (!response.success || !response.data) {
      console.log(`%c[PIPE] API_FAIL %c→ ${response.error}`,'color:#e85050','color:#999');
      return { success: false, error: `AI 响应失败${attemptLabel}: ${response.error || '未知'}` };
    }
    console.log(`%c[PIPE] API_OK %c→ ${response.elapsedMs}ms tokens=${response.tokens?.total_tokens || '?'}`,
      'color:#30d080','color:#999');

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

    // 5D: 归一化——前移至Zod之前，覆盖所有AI格式变体
    console.log(`%c[PIPE] NORMALIZE %c→ keys=${Object.keys(parsed).join(',')} choices=${parsed.narrative?.choices?.length || '?'}`,
      'color:#888','color:#999');
    normalizeAIResponse(parsed);
    // normalize后快照第一个选项
    if (parsed.narrative?.choices?.[0]) {
      const c = parsed.narrative.choices[0];
      console.log(`%c[PIPE] NORMALIZED %c→ choice[0].risk=${c.risk} risk_note=${(c.risk_note||'').slice(0,30)}`,
        'color:#30d080','color:#999');
    }

    // Zod格式验证
    console.log('%c[PIPE] ZOD_ENTER','color:#888');
    this.state = 'VALIDATING_FORMAT';
    const zodResult = NarrativeJSONSchema.safeParse(parsed);
    if (!zodResult.success) {
      const issues = zodResult.error?.issues || [];
      const errStr = issues.slice(0,3).map((e:any) => `${e.path?.join?.('.')||'?'}: ${e.message}`).join(' | ');
      console.log(`%c[PIPE] ZOD_FAIL %c→ ${errStr}`,'color:#e85050','color:#f88');
      const errors = issues.map((e:any) => `${e.path?.join?.('.')||'?'}: ${e.message}`).join('; ');
      if (this.config.maxJsonRetries > 0) {
        const fixRetry = await callDeepSeek<any>(
          messages.system,
          messages.user + `\n\n[系统] JSON格式问题：${errors}。请修正后重新输出。`,
          { apiKey: key, maxRetries: 1, timeoutMs: 45000 }
        );
        if (fixRetry.success && fixRetry.data) {
          const retryParsed = typeof fixRetry.data === 'string' ? JSON.parse(fixRetry.data) : fixRetry.data;
          normalizeAIResponse(retryParsed); // 5D: retry路径也归一化
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
      console.log(`%c[PIPE] ZOD_PASS %c→ choices=${parsed?.narrative?.choices?.length || 0}`,
        'color:#30d080','color:#999');
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
      console.log(`%c[PIPE] PROCESS %c→ isOpening=${isOpening} choiceId=${choiceId||'START'} ctx_sys=${context.systemPrompt.length}c ctx_user=${baseMessages.user.length}c`,
        'color:#b8860b;font-weight:bold','color:#999');

      // 阶段2-4: 获取+解析+格式验证
      const fetchResult = await this.fetchAndValidate(key, baseMessages, startTime, '');
      if (!fetchResult.success) {
        console.log(`%c[PIPE] FETCH_FAIL %c→ ${fetchResult.error}`,'color:#e85050','color:#f88');
        return { state: 'ERROR', error: fetchResult.error, elapsedMs: Date.now() - startTime };
      }

      let parsed = fetchResult.parsed;

      // ═══ 阶段5: Layer 4 金丝雀断言（前置过滤） ═══
      this.state = 'VALIDATING_L4';
      console.log('%c[PIPE] L4_ENTER','color:#888');
      let canaryResult: CanaryValidationResult | undefined;
      try {
      if (parsed?.narrative?.text) {
        canaryResult = validateCanaryAssertions(parsed as NarrativeJSON, store);
        if (canaryResult.recommendation === 'reject') {
          const ruleNames = canaryResult.failedCritical.map(r => r.ruleName).join('、');
          console.log(`%c[PIPE] L4_REJECT %c→ ${ruleNames}`,'color:#e85050','color:#f88');
          return {
            state: 'ERROR',
            error: `Layer 4 金丝雀断言不通过: ${canaryResult.failedCritical.map(r => r.ruleName).join('、')}`,
            elapsedMs: Date.now() - startTime,
          };
        }
      }
      } catch (l4Err: any) {
        console.log(`%c[PIPE] CRASH_L4 %c→ ${l4Err?.message}`,'color:#e85050','color:#f88');
        throw l4Err;
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
          console.log(`%c[PIPE] L3_REJECT %c→ ${semanticResult.failedRules.map(r=>r.ruleName).join('、')}`,'color:#e85050','color:#f88');
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
      console.log(`%c[PIPE] RESOLVED %c→ elapsed=${Date.now()-startTime}ms textLen=${narrative.narrative.text.length} choices=${narrative.narrative.choices.length} hasState=${!!narrative.state_update}`,
        'color:#30d080;font-weight:bold','color:#999');

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
      console.log(`%c[PIPE] CRASH %c→ ${err?.message}`,'color:#e85050;font-weight:bold','color:#f88');
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
