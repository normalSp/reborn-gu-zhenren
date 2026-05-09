import { callDeepSeek, apiKey } from '../api/deepseek';
import { NarrativeJSONSchema } from '../schemas/narrative.schema';
import { validateNarrativeSemantics } from './semantic-validator';
import { validateCanaryAssertions } from './canary-assertions';
import { buildAIStateUpdateRetryHint, validateAIStateUpdate, type AiRewardValidationResult } from './ai-state-update-validator';
import { applyStateUpdate } from './state-update-applier';
import { contextBuilder } from './context-builder';
import { checkChapterGoals } from './goal-checker';
import { buildDeathRecordFallback } from './death-record';
import { sanitizeNarrativeConsistency } from './narrative-consistency';
import { useStore } from '../store';
import type { ActiveDialogue, Choice, DialogueActionCard, DialogueActionCardCategory, NarrativeJSON, AIContext } from '../types';
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
  // P1修复: 当narrative对象缺text字段时填入空串作降级，避免ZOD验证narrative.text required崩溃
  // AI有时返回 { narrative: { choices: [...] } } 而缺text — 对叙事管道来说空文本可接受（choices仍然有效）
  if (typeof parsed.narrative?.text !== 'string') {
    parsed.narrative.text = '';
  }

  // 1. 顶层映射: choices/options→narrative.choices, stateUpdate/stateUpdates→state_update
  if (parsed.choices && !parsed.narrative.choices) parsed.narrative.choices = parsed.choices;
  if (parsed.options && !parsed.narrative.choices) parsed.narrative.choices = parsed.options;
  if (!parsed.state_update) {
    parsed.state_update = parsed.stateUpdate || parsed.stateUpdates || undefined;
  }
  if (!parsed.narrative?.choices?.length) return;

  // 1.5 state_update内部归一化 — 修正AI常见的字段格式错误
  if (parsed.state_update && typeof parsed.state_update === 'object') {
    const su = parsed.state_update;
    // player: AI有时返回字符串(如"天资")而非对象 → 清空
    if (typeof su.player === 'string') delete su.player;
    // essence: AI有时返回 {current: undefined, max: undefined} → 清空
    if (su.player?.essence && su.player.essence.current === undefined && su.player.essence.max === undefined) {
      delete su.player.essence;
    }
    // health: 同理，content/max都为undefined时清空
    if (su.player?.health && su.player.health.current === undefined && su.player.health.max === undefined) {
      delete su.player.health;
    }
    // gu_inventory: AI有时返回数组[]而非{add,remove}对象 → 自动转换为 {add: array} 格式
    if (Array.isArray(su.gu_inventory) && su.gu_inventory.length > 0) {
      su.gu_inventory = { add: su.gu_inventory };
    } else if (Array.isArray(su.gu_inventory)) {
      delete su.gu_inventory; // 空数组无实际变更
    }
    // 6A: gu_inventory.add 字段名修正 — AI常见错误: rank→tier
    if (su.gu_inventory?.add && Array.isArray(su.gu_inventory.add)) {
      for (const item of su.gu_inventory.add) {
        if (typeof item.rank === 'number' && item.tier === undefined) {
          item.tier = item.rank;
        }
        if (item.rarity === undefined || item.rarity === '') {
          // 从name推断：含"仙"→传说，"凡"→普通 默认→稀有
          const gn = (item.name || '').toString();
          if (gn.includes('仙')) item.rarity = '传说';
          else if (gn.includes('凡')) item.rarity = '普通';
          else item.rarity = '稀有';
        }
        if (item.description === undefined) {
          item.description = `${item.name}（${item.tier || 1}转${item.path || '未知'}蛊虫）`;
        }
      }
    }
    // 6B: dao_marks/path_levels 顶层→player层迁移
    if (su.dao_marks && !su.player?.dao_marks) {
      if (!su.player) su.player = {};
      su.player.dao_marks = su.dao_marks;
    }
    if (su.path_levels && !su.player?.path_levels) {
      if (!su.player) su.player = {};
      su.player.path_levels = su.path_levels;
    }
  }

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

export function extractDialogueAffinityDelta(stateUpdate: any, npcName: string): number {
  const deltas = stateUpdate?.dynamic_npcs?.affinity_delta;
  if (!Array.isArray(deltas)) return 0;
  const match = deltas.find((item: any) => item?.name === npcName);
  return typeof match?.delta === 'number' ? match.delta : 0;
}

export function inferDialogueActionCategory(text: string): DialogueActionCardCategory {
  if (/接受|答应|接下|帮.*(猎|查|找|送|护)|追踪|猎杀|护送|参与/.test(text)) return 'accept_request';
  if (/拒绝|婉拒|推辞|暂缓|不接|离开/.test(text)) return 'decline_request';
  if (/讨价|谈判|报酬|条件|分成|交换|议价/.test(text)) return 'negotiate';
  if (/交易|购买|出售|买|卖|蛊材|货物|商路/.test(text)) return 'trade_interest';
  if (/挑衅|威胁|动手|杀|攻击|激怒|压迫/.test(text)) return 'hostility';
  if (/询问|追问|打听|请教|了解|局势|情报|来历|目的/.test(text)) return 'ask_more';
  if (/听闻|传闻|线索|消息|地点|黑市|帮派/.test(text)) return 'rumor';
  return 'reply';
}

export function buildDialogueActionCards(
  choices: Choice[] | undefined,
  activeDialogue: ActiveDialogue,
  turn: number,
): DialogueActionCard[] {
  if (!Array.isArray(choices)) return [];
  const topic = activeDialogue.pendingTopic || '闲聊';
  return choices.slice(0, 6).map((choice, index) => ({
    id: `${activeDialogue.dialogueId}_${choice.id || `c${index + 1}`}_${turn}`,
    npcId: activeDialogue.npcId,
    npcName: activeDialogue.npcName,
    topic,
    text: choice.text,
    risk: choice.risk || 'medium',
    riskNote: choice.risk_note || '未知风险',
    category: inferDialogueActionCategory(choice.text),
    status: 'pending' as const,
    createdTurn: turn,
    payload: {
      sourceChoiceId: choice.id,
      source: 'deepseek-dialogue-choice',
    },
  }));
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
    isResume: boolean = false
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
      const context = contextBuilder.buildFullContext(store, this.config.mode);
      // P1-6.3 动静分离：动态数据（元石余额/NPC关系/蛊虫状态）注入user message
      const dynamicCtx = contextBuilder.buildDynamicContext(store);
      const baseMessages = contextBuilder.buildMessages(context, choiceId || undefined, dynamicCtx);
      console.log(`%c[PIPE] PROCESS %c→ choiceId=${choiceId||'START'} ctx_sys=${context.systemPrompt.length}c ctx_user=${baseMessages.user.length}c dynamic=${dynamicCtx.length}c`,
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
          // ═══ 日志埋点: L4金丝雀断言拒绝
          try {
            const l4Log = useStore.getState() as any;
            if (typeof l4Log.addGameLog === 'function') {
              l4Log.addGameLog('pipeline', `L4金丝雀断言拒绝: ${ruleNames}`, { layer: 'L4', ruleNames });
            }
          } catch { /* skip */ }
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
          // ═══ 日志埋点: L3语义拒绝
          try {
            const l3Log = useStore.getState() as any;
            if (typeof l3Log.addGameLog === 'function') {
              l3Log.addGameLog('pipeline', `L3语义拒绝: ${semanticResult.failedRules.map(r=>r.ruleName).join('、')}`, { layer: 'L3', ruleNames: semanticResult.failedRules.map(r=>r.ruleName) });
            }
          } catch { /* skip */ }
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
      let narrative = parsed as NarrativeJSON;
      let rewardValidation: AiRewardValidationResult | undefined;
      if (narrative.state_update) {
        rewardValidation = validateAIStateUpdate(narrative.state_update, {
          realmGrand: (store as any).profile?.realm?.grand || 1,
          currentChapterId: (store as any).currentChapterId || '',
          currentDomain: (store as any).currentDomain || '南疆',
          narrativeText: narrative.narrative.text,
        });

        const shouldRetryReward = rewardValidation.issues.some(
          issue => issue.action === 'dropped' || issue.action === 'rumorOnly',
        );
        if (shouldRetryReward && this.config.maxSemanticRetries > 0) {
          const retryMessages = {
            system: baseMessages.system,
            user: baseMessages.user + '\n\n[真相源校验·奖励修正]\n' + buildAIStateUpdateRetryHint(rewardValidation),
          };
          const retryResult = await this.fetchAndValidate(key, retryMessages, startTime, '(奖励修正重试)');
          if (retryResult.success) {
            const retryNarrative = retryResult.parsed as NarrativeJSON;
            const retryValidation = validateAIStateUpdate(retryNarrative.state_update, {
              realmGrand: (store as any).profile?.realm?.grand || 1,
              currentChapterId: (store as any).currentChapterId || '',
              currentDomain: (store as any).currentDomain || '南疆',
              narrativeText: retryNarrative.narrative.text,
            });
            narrative = retryNarrative;
            rewardValidation = retryValidation;
          }
        }

        narrative.state_update = rewardValidation.sanitized as any;
        if (rewardValidation.issues.length > 0) {
          try {
            const rewardLog = useStore.getState() as any;
            if (typeof rewardLog.addGameLog === 'function') {
              rewardLog.addGameLog('pipeline', `AI奖励真相源校验：${rewardValidation.issues.length}项处理`, {
                issues: rewardValidation.issues,
              });
            }
          } catch { /* skip */ }
        }
      }
      const consistency = sanitizeNarrativeConsistency(narrative, store);
      narrative = consistency.narrative;
      if (consistency.rewardIssues.length > 0 || consistency.choiceIssues.length > 0) {
        try {
          const consistencyLog = useStore.getState() as any;
          if (typeof consistencyLog.addGameLog === 'function') {
            consistencyLog.addGameLog('pipeline', `叙事数值/奖励一致性校验：${consistency.rewardIssues.length + consistency.choiceIssues.length}项处理`, {
              rewardIssues: consistency.rewardIssues,
              choiceIssues: consistency.choiceIssues,
            });
          }
        } catch { /* skip */ }
      }
      console.log(`%c[PIPE] RESOLVED %c→ elapsed=${Date.now()-startTime}ms textLen=${narrative.narrative.text.length} choices=${narrative.narrative.choices.length} hasState=${!!narrative.state_update}`,
        'color:#30d080;font-weight:bold','color:#999');

      useStore.getState().setCurrentNarrative(narrative);
      useStore.getState().appendMessage({
        role: 'assistant',
        content: narrative.narrative.text,
      });

      applyStateUpdate(narrative.state_update);

      const dialogueStore = useStore.getState() as any;
      const activeDialogue = dialogueStore.activeDialogue;
      if (activeDialogue?.awaitingResponse && typeof dialogueStore.appendNpcMessage === 'function') {
        const affinityDelta = extractDialogueAffinityDelta(narrative.state_update, activeDialogue.npcName);
        const actionCards = buildDialogueActionCards(
          narrative.narrative.choices as Choice[],
          activeDialogue,
          dialogueStore.turn || 1,
        );
        dialogueStore.appendNpcMessage(narrative.narrative.text, affinityDelta);
        if (typeof dialogueStore.setDialogueActionCards === 'function') {
          dialogueStore.setDialogueActionCards(actionCards);
        }
      }

      // ═══ P2补完: 章节目标检测 — 打通目标→路由推进链路 ═══
      try {
        const chkStore = useStore.getState() as any;
        checkChapterGoals(chkStore, {
          chapterId: chkStore.currentChapterId || null,
          currentDomain: chkStore.currentDomain || '南疆',
          realmGrand: chkStore.profile?.realm?.grand || 1,
          turn: chkStore.turn || 1,
          currency: chkStore.currency || 0,
          flags: chkStore.flags || {},
        });
      } catch { /* goal checker not ready — silently skip */ }

      // ═══ P2-8成就钩子：每轮RESOLVED后检测成就条件 ═══
      try {
        const achStore = useStore.getState() as any;
        if (typeof achStore.checkAchievements === 'function') {
          const achState = {
            turn: achStore.turn || 1,
            realm: achStore.profile?.realm?.label || '一转初阶',
            realmNum: achStore.profile?.realm?.grand || 1,
            currency: achStore.currency || 0,
            guCount: Array.isArray(achStore.inventory) ? achStore.inventory.length : 0,
            refinedGuCount: achStore.refinedGuCount || 0,
            knownNpcCount: achStore.knownNpcCount || 0,
            knownLocations: Array.isArray(achStore.knownLocations) ? achStore.knownLocations.length : 0,
            factionStandings: achStore.factionStandings || {},
            daoHeart: achStore.daoHeart || { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
            flags: achStore.flags || {},
            deaths: achStore.deathCount || 0,
            combatWins: achStore.combatWins || achStore.combatStats?.wins || 0,
            totalBattlesFought: achStore.totalBattlesFought || 0,
            factionLevel: achStore.playerFaction?.level || 0,
            membersCount: achStore.playerFaction?.members?.length || achStore.partyState?.members?.length || 0,
            immortalGuCount: Array.isArray(achStore.inventory)
              ? achStore.inventory.filter((g: any) => g.isImmortalGu || g.tier >= 6).length
              : 0,
            ascensionSuccessCount: achStore.flags?.ascensionSuccessCount || (achStore.profile?.realm?.grand >= 6 ? 1 : 0),
            trainingGroundVisits: achStore.flags?.trainingGroundVisits || 0,
            huntSuccessCount: achStore.flags?.huntSuccessCount || 0,
            squadCombatWins: achStore.squadCombatWins || 0,
            squadMembersRecruited: achStore.squadMembersRecruited || 0,
            partyMembersCount: achStore.partyState?.members?.length || 0,
            squadMemberWoundedRescues: achStore.squadMemberWoundedRescues || 0,
            squadMemberDeaths: achStore.squadMemberDeaths || 0,
            squadComboSuccesses: achStore.squadComboSuccesses || 0,
            squadOverlevelEscapes: achStore.squadOverlevelEscapes || 0,
            hasExtremePhysique: !!(
              achStore.aperture?.extremePhysiqueType ||
              achStore.flags?._extremePhysiqueType ||
              achStore.flags?.ascendedExtremePhysiqueType
            ),
            singlePathDaoMarks: (path: string) => {
              const marks = achStore.daoMarks || achStore.pathBuild?.dao_marks || {};
              return marks[path] || 0;
            },
            crossDomainCount: achStore.domainsVisited || 0,
            renZuLegendsHeard: achStore.renZuLegendsHeard || 0,
            achievementsUnlocked: achStore.unlockedAchievements || [],
            chapterId: achStore.currentChapterId || null,
            domain: achStore.currentDomain || '南疆',
          };
          achStore.checkAchievements(achState);
        }
      } catch { /* achievement checker not ready — silently skip */ }

      // ═══ 日志埋点：叙事回复记录
      try {
        const logStore = useStore.getState() as any;
        if (typeof logStore.addGameLog === 'function') {
          const choices = narrative?.narrative?.choices?.length || 0;
          logStore.addGameLog('narrative', `天命已定 (${response.elapsedMs}ms, ${response.tokens?.total_tokens || '?'} tokens)`, {
            elapsedMs: response.elapsedMs,
            tokens: response.tokens?.total_tokens,
            choices,
            validated: validation?.passed ?? true,
          });
        }
      } catch { /* skip */ }

      // ═══ P2章节推进钩子：每轮RESOLVED后检测章节推进条件（支持多路由选项） ═══
      const chProgStore = useStore.getState() as any;
      if (typeof chProgStore.checkProgression === 'function') {
        const progResult = chProgStore.checkProgression();
        if (progResult?.shouldTransition) {
          console.log(`[Chapter] 章节推进触发: ${progResult.reason}`);
          // ═══ 日志埋点: 章节推进
          try {
            const chLog = useStore.getState() as any;
            if (typeof chLog.addGameLog === 'function') {
              chLog.addGameLog('narrative', `章节推进: ${progResult.reason}`, {
                chapterId: chLog.currentChapterId,
                nextChapterOptions: progResult.nextChapterOptions?.length,
                reason: progResult.reason,
              });
            }
          } catch { /* skip */ }

          // P2: 保存路由选项和临近事件到store（供ChapterTransition组件展示）
          if (progResult.nextChapterOptions?.length > 0) {
            useStore.setState({
              nextChapterOptions: progResult.nextChapterOptions,
              proximityEvents: progResult.proximityEvents || [],
            });
          }

          // P2: 多路由选项 → 需要玩家手动选择（不自动推进）
          if (progResult.nextChapterOptions?.length > 1) {
            console.log(`[Chapter] 多路由选项（${progResult.nextChapterOptions.length}条），等待玩家选择`);
            chProgStore.setTransitionState?.('transitioning');
          } else {
            // 单一路由 → 自动推进
            chProgStore.setTransitionState?.('transitioning');
          }
        }
      }

      // ═══ P2-4b 战斗触发钩子：扫描叙事文本检测战斗场景 ═══
      try {
        const { detectCombat } = await import('./combat-router');
        const store2 = useStore.getState() as any;
        const chapterFlag = store2.flags?.current_chapter_id || store2.currentChapterId;
        const trigger = detectCombat(narrative.narrative.text, chapterFlag);
        if (trigger) {
          if (trigger.combatType === 'duel' && trigger.duelEnemy) {
            if (typeof store2.initDuel === 'function') {
              const playerGu = (store2.gu_inventory || []).map((g: any) => ({ name: g.name || '蛊虫', path: g.path || '力道', tier: g.rank || 1 }));
              store2.initDuel({
                name: store2.playerName || '蛊师',
                realm: store2.realm || '一转蛊师',
                path: store2.path || '力道',
                daoMarks: store2.pathBuild?.dao_marks || {}, // P2补完: 传入完整道痕KV映射
                hp: store2.hp || 100, maxHp: store2.maxHp || 100,
                attack: store2.attack || 20, defense: store2.defense || 5,
                essence: { current: store2.essence?.current ?? 100, max: store2.essence?.max ?? 100 },
                gu: playerGu, moves: [],
              }, trigger.duelEnemy);
            }
          } else if (trigger.combatType === 'narrative' && trigger.narrativeConstraint) {
            if (typeof store2.setTransientCombatConstraint === 'function') {
              store2.setTransientCombatConstraint(trigger.narrativeConstraint);
            }
          }
        }
      } catch { /* combat-router not ready or import failed — silently skip */ }

      // ═══ P4.1: 消耗上一轮活跃遭遇（清理状态） ═══
      try {
        const encStore = useStore.getState() as any;
        if (typeof encStore.consumeEncounter === 'function' && encStore.activeEncounterId) {
          encStore.consumeEncounter();
        }
      } catch { /* skip */ }

      // ═══ P2-9 随机遭遇钩子：每轮RESOLVED后检测是否触发遭遇 ═══
      try {
        const encStore2 = useStore.getState() as any;
        if (typeof encStore2.checkAndTrigger === 'function') {
          const profile = encStore2.profile || {};
          const realmNum = profile.realm?.grand || 1;
          const flags = encStore2.flags || {};
          const currency = encStore2.currency || 0;
          const currentLoc = encStore2.currentPosition || encStore2.playerPosition;
          const locStr = currentLoc?.area || currentLoc?.region || '南疆';
          const hasGu = Array.isArray(encStore2.inventory) && encStore2.inventory.length > 0;
          const chapterId = encStore2.currentChapterId || 'qingmaoshan';
          const currentDomain = encStore2.currentDomain || '南疆';

          encStore2.checkAndTrigger({
            chapterId,
            currentDomain,
            playerRealm: realmNum,
            currentTurn: encStore.turn || 1,
            playerFlags: flags,
            playerCurrency: currency,
            currentLocation: locStr,
            hasGu,
            lastNarrativeLength: narrative.narrative.text?.length || 0,
          });
        }
      } catch { /* encounter system not ready — silently skip */ }

      // ═══ 回合推进：每轮RESOLVED后自动推进turn/gameTime（续档不计入） ═══
      if (!isResume) {
        (useStore.getState() as any).advanceTurn?.();
        // P2-6: 债务利息+阈值检测
        const debtStore = useStore.getState() as any;
        if (typeof debtStore.applyDebtInterest === 'function') debtStore.applyDebtInterest();
      }

      // ═══ 死亡检测：叙事导致HP归零 → 生成死亡摘要并触发game_over ═══
      const updatedStore = useStore.getState();
      if ((updatedStore as any).isDead && (updatedStore as any).screenState !== 'game_over') {
        // 填充 deathRecord（死亡摘要）
        const s = updatedStore as any;
        if (!s.deathRecord) {
          useStore.setState({
            deathRecord: buildDeathRecordFallback(s),
          });
        }
        // ═══ 日志埋点: 死亡事件
        try {
          if (typeof (updatedStore as any).addGameLog === 'function') {
            (updatedStore as any).addGameLog('system', `蛊师陨落: ${s.deathCause || '未知原因'}`, {
              cause: s.deathCause,
              turn: s.turn,
              chapter: s.flags?.currentChapter,
              realm: s.profile?.realm?.label,
              achievementCount: (s.unlockedAchievements?.length) || 0,
            });
          }
        } catch { /* skip */ }
        // ═══ P2-10 起源解锁钩子：GameOver时检测起源解锁条件 ═══
        try {
          if (typeof (updatedStore as any).checkAndUnlock === 'function') {
            const gameState: Record<string, any> = {
              maxRealm: (updatedStore as any).maxRealmReached || (updatedStore as any).profile?.realm?.grand || 1,
              kills: (updatedStore as any).combatStats?.kills || (updatedStore as any).kills || 0,
              totalCurrencyEarned: (updatedStore as any).totalCurrencyEarned || (updatedStore as any).currency || 0,
              domainsVisited: (updatedStore as any).domainsVisited || 1,
              exploredLocations: Array.isArray((updatedStore as any).knownLocations) ? (updatedStore as any).knownLocations.length : 0,
              renZuLegendsHeard: (updatedStore as any).renZuLegendsHeard || 0,
              daoHeartMercy: (updatedStore as any).daoHeart?.mercy || 0,
              deathCount: (updatedStore as any).deathCount || 0,
              flags: updatedStore.flags || {},
            };
            const newOrigins = (updatedStore as any).checkAndUnlock(gameState);
            if (newOrigins?.length > 0) {
              console.log(`[OriginUnlock] 新解锁起源: ${newOrigins.join(', ')}`);
              // ═══ 日志埋点: 起源解锁
              try {
                if (typeof (updatedStore as any).addGameLog === 'function') {
                  (updatedStore as any).addGameLog('achievement', `起源解锁: ${newOrigins.join(', ')}`, { origins: newOrigins });
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* origin unlock not ready — silently skip */ }
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
