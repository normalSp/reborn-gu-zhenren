import type { FactionStanding, CharacterRelation, NpcRelationMatrix } from '../../types';

interface FactionSlice {
  standings: Record<string, FactionStanding>;
  characterRelations: CharacterRelation[];
  /** P2-13: NPC关系双向好感矩阵 */
  npcRelations: NpcRelationMatrix;
  updateStanding: (factionId: string, delta: number) => void;
  updateRelation: (charId: string, update: Partial<CharacterRelation>) => void;
  /** P2-13: 从已有NPC数据初始化关系矩阵 */
  initNpcRelations: (npcDatabase: Record<string, any>) => void;
  /** P2-13: 更新两个NPC之间的双向好感 */
  updateNpcRelation: (npcIdA: string, npcIdB: string, deltaAtoB: number, deltaBtoA?: number) => void;
  /** P2-13: 获取NPC间好感值 */
  getNpcAffinity: (npcIdA: string, npcIdB: string) => number;
  /** P2-13: 每轮NPC关系漂移 */
  tickNpcRelations: () => void;
  /** P2补完: 已知NPC计数（用于成就检测） */
  knownNpcCount: number;
  incrementKnownNpcCount: () => void;
}

/** 从NPC关系类型推导初始好感值 */
function relationToAffinity(relationType: string): number {
  const map: Record<string, number> = {
    'family': 60,
    'mentor': 50,
    'ally': 40,
    'friend': 30,
    'romance': 70,
    'stranger': 0,
    'rival': -20,
    'enemy': -40,
  };
  return map[relationType] || 0;
}

export const createFactionSlice = (set: any, get: any): FactionSlice => ({
  standings: {},
  characterRelations: [],
  npcRelations: { matrix: {}, lastUpdatedTurn: 0 },
  knownNpcCount: 0,

  updateStanding: (factionId, delta) => set((s: FactionSlice) => ({
    standings: {
      ...s.standings,
      [factionId]: {
        ...s.standings[factionId],
        standing: Math.max(-100, Math.min(100, (s.standings[factionId]?.standing || 0) + delta)),
      },
    },
  })),
  updateRelation: (charId, update) => set((s: FactionSlice) => ({
    characterRelations: s.characterRelations.map(r =>
      r.character_id === charId ? { ...r, ...update } : r
    ),
  })),

  // ═══ P2-13: 初始化NPC关系网络 ═══
  initNpcRelations: (npcDatabase) => {
    const matrix: Record<string, Record<string, number>> = {};
    const npcEntries = Object.entries(npcDatabase);

    // 双层遍历构建初始关系
    for (const [idA, dataA] of npcEntries) {
      const a = dataA as any;
      if (!a || a.role === 'minor') continue;
      if (!matrix[idA]) matrix[idA] = {};

      for (const [idB, dataB] of npcEntries) {
        if (idA === idB) continue;
        const b = dataB as any;
        if (!b || b.role === 'minor') continue;

        // 同家族 → 基础好感40
        if (a.familyId && b.familyId && a.familyId === b.familyId) {
          matrix[idA][idB] = 40;
        }
        // 同师门 → 基础好感30
        else if (a.master === b.master && a.master) {
          matrix[idA][idB] = 30;
        }
        // 同势力/同域 → 基础好感15
        else if ((a.faction && a.faction === b.faction) || (a.domain === b.domain)) {
          matrix[idA][idB] = 15;
        }
        // 敌对势力 → 基础恶感-30
        else if (a.enemyFaction && a.enemyFaction === b.faction) {
          matrix[idA][idB] = -30;
        } else if (b.enemyFaction && b.enemyFaction === a.faction) {
          matrix[idA][idB] = -30;
        }
        // 默认中立
        else {
          matrix[idA][idB] = 0;
        }
      }
    }

    set({
      npcRelations: { matrix, lastUpdatedTurn: (get() as any).turn || 1 },
    });
  },

  // ═══ P2-13: 更新NPC关系 ═══
  updateNpcRelation: (npcIdA, npcIdB, deltaAtoB, deltaBtoA) => {
    set((s: FactionSlice) => {
      const matrix = { ...s.npcRelations.matrix };
      if (!matrix[npcIdA]) matrix[npcIdA] = {};
      if (!matrix[npcIdB]) matrix[npcIdB] = {};

      matrix[npcIdA] = { ...matrix[npcIdA], [npcIdB]: Math.max(-100, Math.min(100, (matrix[npcIdA][npcIdB] || 0) + deltaAtoB)) };
      // deltaBtoA 默认取 deltaAtoB 的一半（互惠效应）
      const dBA = deltaBtoA ?? Math.round(deltaAtoB * 0.5);
      matrix[npcIdB] = { ...matrix[npcIdB], [npcIdA]: Math.max(-100, Math.min(100, (matrix[npcIdB][npcIdA] || 0) + dBA)) };

      return {
        npcRelations: { matrix, lastUpdatedTurn: (s.npcRelations.lastUpdatedTurn || 0) },
      };
    });
  },

  // ═══ P2-13: 获取NPC好感 ═══
  getNpcAffinity: (npcIdA, npcIdB) => {
    const state = get() as FactionSlice;
    return state.npcRelations.matrix[npcIdA]?.[npcIdB] || 0;
  },

  // ═══ P2-13: 每轮NPC关系自然漂移 ═══
  tickNpcRelations: () => {
    const state = get() as FactionSlice;
    const matrix = { ...state.npcRelations.matrix };
    let changed = false;

    for (const [idA, relations] of Object.entries(matrix)) {
      for (const [idB, affinity] of Object.entries(relations)) {
        // 负向好感的加深趋势（冤冤相报）
        if (affinity < -20 && Math.random() < 0.02) {
          matrix[idA] = { ...matrix[idA], [idB]: Math.max(-100, affinity - 2) };
          changed = true;
        }
        // 正向好感的缓慢衰减（久不联系则淡去）
        if (affinity > 20 && affinity < 60 && Math.random() < 0.05) {
          matrix[idA] = { ...matrix[idA], [idB]: Math.max(0, affinity - 1) };
          changed = true;
        }
      }
    }

    if (changed) {
      set({
        npcRelations: { matrix, lastUpdatedTurn: (get() as any).turn || 1 },
      });
    }
  },
  incrementKnownNpcCount: () => set((s: FactionSlice) => ({
    knownNpcCount: (s.knownNpcCount || 0) + 1,
  })),
});
