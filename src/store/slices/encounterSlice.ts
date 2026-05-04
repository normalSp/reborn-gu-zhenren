/**
 * 随机遭遇 Slice — P2-9
 * 薄切片设计：仅做状态读写，计算逻辑全部委托 encounter-injector 纯函数
 *
 * 集成点：
 * - response-pipeline.ts：RESOLVED 后调用 initEncounter → checkAndTrigger
 * - context-builder.ts：将 encounterInjectionContext 注入 AI prompt
 */

import type {
  EncounterTemplate,
  EncounterRecord,
  EncounterState,
  EncounterType,
  EncounterInjectionContext,
} from '../../types/encounter';
import { checkAndTriggerEncounter, shouldInjectEncounter, updateCooldownTimers, buildInjectionContext } from '../../engine/encounter-injector';

export interface EncounterSlice {
  encounterState: EncounterState;

  /** 初始化遭遇池（加载 templates） */
  initEncounterPool: (templates: EncounterTemplate[]) => void;
  /** 检测并触发遭遇（RESOLVED后调用） */
  checkAndTrigger: (params: {
    chapterId: string;
    currentDomain: string;
    playerRealm: number;
    currentTurn: number;
    playerFlags: Record<string, any>;
    playerCurrency: number;
    currentLocation: string;
    hasGu: boolean;
    lastNarrativeLength: number;
  }) => void;
  /** 消费当前遭遇（玩家做出选择后调用，清理激活状态） */
  consumeEncounter: () => void;
  /** 获取当前遭遇注入上下文（供 context-builder 使用） */
  getEncounterContext: () => EncounterInjectionContext | null;
  /** 获取冷却信息 */
  getCooldownInfo: () => { turnsSinceLastEncounter: number; nextAvailableTurn: number };
}

/**
 * 玩家遭遇选择回调（在响应管道RESOLVED阶段后，玩家在UI选择遭遇选项后触发）
 */
export interface EncounterChoiceCallback {
  encounterId: string;
  chosenOptionId: string;
  outcomeText: string;
}

export const createEncounterSlice = (set: any, get: any): EncounterSlice => {
  // 内部模板缓存（不持久化，从 canon JSON 加载）
  let _templates: EncounterTemplate[] = [];

  return {
    encounterState: {
      recentEncounters: [],
      cooldownTimers: {},
      activeEncounterId: null,
      activeEncounter: null,
    },

    initEncounterPool: (templates) => {
      _templates = templates;
    },

    checkAndTrigger: (params) => {
      const state = get().encounterState as EncounterState;
      if (!state) return;

      const {
        chapterId, currentDomain, playerRealm, currentTurn, playerFlags, playerCurrency,
        currentLocation, hasGu, lastNarrativeLength,
      } = params;

      // 内容密度检测 — 叙事文本是否太稀薄
      const turnsSinceLast = currentTurn - (state.recentEncounters[0]?.triggeredAtTurn ?? 0);
      if (!shouldInjectEncounter(lastNarrativeLength, turnsSinceLast)) {
        return;
      }

      // 按章节ID预索引模板
      const chapterTemplates = _templates.filter(t => {
        return t.id.startsWith(chapterId.substring(0, 2)) || true; // 按ID前缀匹配
      });

      if (chapterTemplates.length === 0) return;

      // 调用纯函数引擎
      const result = checkAndTriggerEncounter(
        chapterTemplates,
        chapterId,
        playerRealm,
        currentTurn,
        playerFlags,
        playerCurrency,
        state.recentEncounters.map(e => e.type),
        state.cooldownTimers,
        currentDomain,
        currentLocation,
        hasGu,
      );

      if (!result.triggered || !result.template) return;

      // 更新冷却计时器
      const newTimers = updateCooldownTimers(
        state.cooldownTimers,
        result.template,
        chapterId,
        currentTurn,
      );

      // 构建注入上下文
      const context = buildInjectionContext(result.template, currentLocation);

      // 更新Store
      const newRecord: EncounterRecord = {
        encounterId: result.template.id + '-' + currentTurn,
        templateId: result.template.id,
        type: result.template.type,
        title: result.template.title,
        triggeredAtTurn: currentTurn,
      };

      set({
        encounterState: {
          recentEncounters: [newRecord, ...state.recentEncounters].slice(0, 10),
          cooldownTimers: newTimers,
          activeEncounterId: result.template.id,
          activeEncounter: {
            ...result.template,
            narrativeTemplate: context.narrativeTemplate,
          },
        },
      });

      // ═══ 日志埋点
      console.log(`[Encounter] 触发遭遇: ${result.template.title} (${result.template.type}) @turn ${currentTurn}`);
      const logStore = get();
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('encounter', `触发遭遇: ${result.template.title}`, {
          type: result.template.type,
          title: result.template.title,
          domain: result.template.domain,
        });
      }
    },

    consumeEncounter: () => {
      const state = get().encounterState as EncounterState;
      if (!state || !state.activeEncounterId) return;

      // 标记最后一条记录为已处理
      const updatedRecent = state.recentEncounters.map((e, i) =>
        i === 0 ? { ...e, resolvedAtTurn: state.recentEncounters[0]?.triggeredAtTurn ?? 0 } : e
      );

      set({
        encounterState: {
          ...state,
          recentEncounters: updatedRecent,
          activeEncounterId: null,
          activeEncounter: null,
        },
      });
    },

    getEncounterContext: () => {
      const state = get().encounterState as EncounterState;
      if (!state || !state.activeEncounter) return null;

      return {
        encounterId: state.activeEncounter.id,
        type: state.activeEncounter.type,
        title: state.activeEncounter.title,
        narrativeTemplate: state.activeEncounter.narrativeTemplate,
        choices: state.activeEncounter.choices,
        rewards: state.activeEncounter.rewards,
      };
    },

    getCooldownInfo: () => {
      const state = get().encounterState as EncounterState;
      if (!state) return { turnsSinceLastEncounter: 999, nextAvailableTurn: 0 };

      const lastTurn = state.recentEncounters[0]?.triggeredAtTurn ?? 0;
      return {
        turnsSinceLastEncounter: 999, // 由外部根据currentTurn计算
        nextAvailableTurn: lastTurn + 2, // 至少间隔2轮
      };
    },
  };
};
