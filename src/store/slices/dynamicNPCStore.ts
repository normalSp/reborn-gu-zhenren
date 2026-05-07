/**
 * dynamicNPCStore — v0.7.0 P2: 动态NPC注册表
 *
 * 管理AI叙事中动态生成的"路人甲"NPC生命周期：
 * - 注册/去重/查询
 * - 好感度递增
 * - 属性成长（基于互动/战斗/剧情参与度）
 * - LRU淘汰（上限500）
 * - 可招募状态标记
 */

import type { DynamicNPC, DynamicNPCAddPayload, DynamicNPCState } from '../../types';

/** 默认最大动态NPC数 */
const DEFAULT_MAX_DYNAMIC_NPCS = 500;

/** NPC属性成长公式 — 基于互动/战斗/剧情参与度 */
function calcDynamicNPCStats(npc: DynamicNPC): { hp: number; maxHp: number; atk: number; def: number } {
  const baseHp = 80;
  const baseAtk = 10;
  const baseDef = 5;

  const maxHp = Math.min(500, baseHp + npc.realm * 20 + npc.interaction_count * 2 + npc.battle_count * 5);
  const atk = Math.min(80, baseAtk + npc.realm * 5 + npc.battle_count * 3);
  const def = Math.min(40, baseDef + npc.realm * 3);
  const hp = Math.min(maxHp, npc.hp > 0 ? npc.hp : maxHp); // 保留当前HP，不超过max

  return { hp, maxHp, atk, def };
}

/** 判断是否可招募 */
function isRecruitEligible(npc: DynamicNPC): boolean {
  return npc.affinity >= 60 && npc.realm <= 5; // 5转以下可招募为队友
}

/** 计算NPC的LRU分数 — 越低越优先淘汰 */
function calcLRUScore(npc: DynamicNPC, currentTurn: number): number {
  const daysSinceUpdate = currentTurn - npc.updated_at;
  const baseScore = npc.updated_at; // 越早更新越优先淘汰
  const affinityPenalty = npc.affinity > 0 ? npc.affinity * 0.5 : 0; // 正向好感降低淘汰概率
  return baseScore - affinityPenalty;
}

export const createDynamicNPCStore = (set: any, get: any): DynamicNPCState => ({
  dynamicNPCs: {},
  maxDynamicNPCs: DEFAULT_MAX_DYNAMIC_NPCS,

  /** 添加或更新动态NPC */
  upsertDynamicNPC: (npc: DynamicNPC) => {
    const state = get() as DynamicNPCState & { turn: number };
    const currentTurn = state.turn || 1;
    const existing = state.dynamicNPCs[npc.id];

    const updated: DynamicNPC = {
      ...npc,
      updated_at: currentTurn,
      recruit_eligible: isRecruitEligible(npc),
    };

    // 属性成长
    const stats = calcDynamicNPCStats(updated);
    updated.hp = existing ? Math.min(stats.maxHp, existing.hp) : stats.maxHp;
    updated.maxHp = stats.maxHp;
    updated.atk = stats.atk;
    updated.def = stats.def;

    const newNPCs = { ...state.dynamicNPCs, [npc.id]: updated };

    // LRU淘汰检查
    if (Object.keys(newNPCs).length > (state.maxDynamicNPCs || DEFAULT_MAX_DYNAMIC_NPCS)) {
      // 找出最该淘汰的NPC（affinity<0且最老）
      const entries = Object.entries(newNPCs) as [string, DynamicNPC][];
      const evictCandidate = entries
        .filter(([, n]) => n.affinity < 10) // 仅淘汰低好感/无好感NPC
        .sort(([, a], [, b]) => calcLRUScore(a, currentTurn) - calcLRUScore(b, currentTurn))[0];

      if (evictCandidate) {
        delete newNPCs[evictCandidate[0]];
      }
    }

    set({ dynamicNPCs: newNPCs } as any);
  },

  /** 更新好感度 */
  updateDynamicNPCAffinity: (npcId: string, delta: number) => {
    const state = get() as DynamicNPCState & { turn: number };
    const npc = state.dynamicNPCs[npcId];
    if (!npc) return;

    const newAffinity = Math.max(-100, Math.min(100, npc.affinity + delta));
    const updated: DynamicNPC = {
      ...npc,
      affinity: newAffinity,
      updated_at: state.turn || 1,
      recruit_eligible: newAffinity >= 60,
    };
    const stats = calcDynamicNPCStats(updated);
    updated.hp = npc.hp;
    updated.maxHp = stats.maxHp;
    updated.atk = stats.atk;
    updated.def = stats.def;

    set({ dynamicNPCs: { ...state.dynamicNPCs, [npcId]: updated } } as any);
  },

  /** 增加互动计数 */
  incrementDynamicNPCInteraction: (npcId: string) => {
    const state = get() as DynamicNPCState & { turn: number };
    const npc = state.dynamicNPCs[npcId];
    if (!npc) return;

    const updated: DynamicNPC = {
      ...npc,
      interaction_count: npc.interaction_count + 1,
      plot_participation: Math.min(100, npc.plot_participation + 5),
      updated_at: state.turn || 1,
    };
    const stats = calcDynamicNPCStats(updated);
    updated.hp = npc.hp;
    updated.maxHp = stats.maxHp;
    updated.atk = stats.atk;
    updated.def = stats.def;

    set({ dynamicNPCs: { ...state.dynamicNPCs, [npcId]: updated } } as any);
  },

  /** 增加共同战斗计数 */
  incrementDynamicNPCBattle: (npcId: string) => {
    const state = get() as DynamicNPCState & { turn: number };
    const npc = state.dynamicNPCs[npcId];
    if (!npc) return;

    const updated: DynamicNPC = {
      ...npc,
      battle_count: npc.battle_count + 1,
      plot_participation: Math.min(100, npc.plot_participation + 10),
      updated_at: state.turn || 1,
    };
    const stats = calcDynamicNPCStats(updated);
    updated.hp = npc.hp;
    updated.maxHp = stats.maxHp;
    updated.atk = stats.atk;
    updated.def = stats.def;

    set({ dynamicNPCs: { ...state.dynamicNPCs, [npcId]: updated } } as any);
  },

  /** LRU淘汰最老的NPC */
  evictLRU: () => {
    const state = get() as DynamicNPCState & { turn: number };
    const entries = Object.entries(state.dynamicNPCs) as [string, DynamicNPC][];
    if (entries.length <= 1) return;

    // 筛选可淘汰的NPC（好感度低且非可招募）
    const evictable = entries.filter(([, n]) => !n.recruit_eligible && n.affinity < 20);
    if (evictable.length === 0) return;

    const currentTurn = state.turn || 1;
    evictable.sort(([, a], [, b]) => calcLRUScore(a, currentTurn) - calcLRUScore(b, currentTurn));

    const toEvict = evictable[0];
    if (toEvict) {
      const newNPCs = { ...state.dynamicNPCs };
      delete newNPCs[toEvict[0]];
      set({ dynamicNPCs: newNPCs } as any);
    }
  },

  /** 获取可招募列表 (affinity>=60) */
  getRecruitableNPCs: () => {
    const state = get() as DynamicNPCState;
    return Object.values(state.dynamicNPCs).filter(n => n.recruit_eligible);
  },
});
