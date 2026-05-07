import type { FactionStanding, CharacterRelation, NpcRelationMatrix, PlayerFaction, SquadMember, FactionEvent } from '../../types';

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

  // ═══ v0.7.0: 玩家势力系统 ═══
  /** 玩家自创势力 */
  playerFaction: PlayerFaction | null;
  /** 势力事件日志 */
  factionEvents: FactionEvent[];
  /** 创建势力 */
  createFaction: (name: string, domain: string, type: PlayerFaction['type']) => boolean;
  /** 解散势力 */
  disbandFaction: () => void;
  /** 招募成员 */
  recruitMember: (member: SquadMember) => boolean;
  /** 开除成员 */
  dismissMember: (memberId: string) => void;
  /** 升级势力 */
  upgradeFaction: () => boolean;
  /** 每回合势力维护扣费 */
  tickFactionMaintenance: () => void;
  /** 势力贸易收入 */
  tickFactionTrade: () => void;
  /** 更新成员忠诚度 */
  updateMemberLoyalty: (memberId: string, delta: number) => void;
  /** 获取当前成员数 */
  getMemberCount: () => number;
  /** v0.7.0 P2: 从动态NPC招募为队友 */
  recruitDynamicNPC: (dynamicNpcId: string) => boolean;
}

/** 势力等级基础槽位映射 */
const BASE_SLOTS_BY_LEVEL: Record<number, number> = {
  1: 3, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5, 7: 6, 8: 7, 9: 8, 10: 12,
};

/** 势力最大成员数（等级→上限） */
function maxMembersForLevel(level: number, type: PlayerFaction['type']): number {
  // 5转山寨上限6人，蛊仙仙门上限12人
  const isMortalFaction = type === '正派' || type === '魔道' || type === '家族'; // 凡间势力类型
  // 简化：5转以下势力上限由level决定但不超过6；蛊仙势力按等级
  return BASE_SLOTS_BY_LEVEL[level] || (3 + level);
}

/** 势力维护公式 — 设计大纲§1.2.3修正版 + v0.7.0-pre双轨修正
 *  @returns 本势力本币：5转返回元石，6转+返回仙元石 */
function calcMaintenanceCost(faction: PlayerFaction, realm: number): number {
  const baseSlot = BASE_SLOTS_BY_LEVEL[faction.level] || 3;
  const baseValue = faction.level * 12 + Math.max(0, faction.members.length - baseSlot) * 12;
  // 5转势力直接产出元石，6转+产出仙元石（消除仙元→元石换算混淆）
  return realm >= 6 ? baseValue : baseValue * 100;
}

/** 势力贸易收入 — 设计大纲§1.2.3 + v0.7.0-pre双轨修正
 *  @returns 本势力本币：5转返回元石，6转+返回仙元石 */
function calcTradeIncome(faction: PlayerFaction, realm: number): number {
  const base = 80;
  const max = 300;
  const levelFactor = faction.level * 10;
  const memberFactor = faction.members.length * 5;
  const randomBonus = Math.floor(Math.random() * 50);
  const immortalValue = Math.min(max, base + levelFactor + memberFactor + randomBonus);
  // 5转势力直接产出元石，6转+产出仙元石
  return realm >= 6 ? immortalValue : immortalValue * 100;
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

  // ═══ v0.7.0: 玩家势力状态 ═══
  playerFaction: null,
  factionEvents: [],

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

  // ═══ v0.7.0: 创建势力 — 设计大纲§1.2.2 双轨制 ═══
  createFaction: (name, domain, type) => {
    const fullStore = get() as any;
    if ((get() as FactionSlice).playerFaction) {
      console.warn('[FactionSlice] 已有势力，无法重复创建');
      return false;
    }

    const realm = fullStore.profile?.realm?.grand || 1;
    // 5转山寨: 8000元石, 6转仙门: 3000仙元石
    if (realm >= 6) {
      const cost = 3000;
      if ((fullStore.immortalCurrency || fullStore.currency || 0) < cost) {
        console.warn(`[FactionSlice] 仙元石不足: 需要${cost}, 当前${fullStore.immortalCurrency}`);
        return false;
      }
      // 扣费
      set({ immortalCurrency: Math.max(0, (fullStore.immortalCurrency || 0) - cost) } as any);
    } else if (realm >= 5) {
      const cost = 8000;
      if ((fullStore.currency || 0) < cost) {
        console.warn(`[FactionSlice] 元石不足: 需要${cost}, 当前${fullStore.currency}`);
        return false;
      }
      set({ currency: Math.max(0, (fullStore.currency || 0) - cost) } as any);
    } else {
      console.warn(`[FactionSlice] 境界不足: 至少需要5转`);
      return false;
    }

    const turn = fullStore.turn || 1;
    const levelCap = realm >= 6 ? 10 : 5;
    const faction: PlayerFaction = {
      id: `faction_${turn}_${Date.now()}`,
      name,
      domain,
      type,
      level: 1,
      reputation: 100,
      resources: { 元石: 500, 仙元石: realm >= 6 ? 100 : 0, 蛊材: {} },
      members: [],
      maxMembers: BASE_SLOTS_BY_LEVEL[1] || 3,
      foundedAt: turn,
    };

    set({
      playerFaction: faction,
      factionEvents: [{
        id: `fe_${Date.now()}`,
        type: 'opportunity',
        description: `势力「${name}」于${domain}正式成立！${type === '魔道' ? '魔道中人纷纷侧目。' : '各方势力投来关注的目光。'}`,
        choices: [],
        resolved: true,
      }],
    } as any);

    const logStore = fullStore;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('faction', `创建势力: ${name} (${type}, ${domain})`, { faction });
    }
    return true;
  },

  // ═══ v0.7.0: 解散势力 ═══
  disbandFaction: () => {
    set({ playerFaction: null, factionEvents: [] });
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('faction', '势力已解散');
    }
  },

  // ═══ v0.7.0: 招募成员 — 设计大纲§1.3 ═══
  recruitMember: (member) => {
    const faction = (get() as FactionSlice).playerFaction;
    if (!faction) return false;
    if (faction.members.length >= faction.maxMembers) {
      console.warn(`[FactionSlice] 势力已满: ${faction.members.length}/${faction.maxMembers}`);
      return false;
    }

    const newMember: SquadMember = {
      ...member,
      loyalty: member.loyalty || 50,
      adventureTrust: member.adventureTrust || 40,
      interestDrive: member.interestDrive || 30,
      alive: true,
    };

    set({
      playerFaction: {
        ...faction,
        members: [...faction.members, newMember],
      },
      factionEvents: [
        ...(get() as FactionSlice).factionEvents,
        {
          id: `fe_recruit_${Date.now()}`,
          type: 'recruitment' as const,
          description: `${newMember.name} 加入了势力「${faction.name}」`,
          choices: [],
          resolved: false,
        },
      ],
    } as any);

    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('faction', `招募成员: ${newMember.name}`, { memberId: newMember.id });
    }
    return true;
  },

  // ═══ v0.7.0: 开除成员 ═══
  dismissMember: (memberId) => {
    const faction = (get() as FactionSlice).playerFaction;
    if (!faction) return;

    const dismissed = faction.members.find(m => m.id === memberId);
    set({
      playerFaction: {
        ...faction,
        members: faction.members.filter(m => m.id !== memberId),
      },
    } as any);

    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function' && dismissed) {
      logStore.addGameLog('faction', `开除成员: ${dismissed.name}`);
    }
  },

  // ═══ v0.7.0: 升级势力 ═══
  upgradeFaction: () => {
    const faction = (get() as FactionSlice).playerFaction;
    if (!faction) return false;

    const fullStore = get() as any;
    const realm = fullStore.profile?.realm?.grand || 1;
    const levelCap = realm >= 6 ? 10 : 5;
    if (faction.level >= levelCap) return false;

    // 升级消耗：等级×200仙元石 + 声望消耗
    const isImmortal = realm >= 6;
    const cost = faction.level * (isImmortal ? 200 : 500); // 凡人势力升级更贵
    const currency = isImmortal ? (fullStore.immortalCurrency || 0) : (fullStore.currency || 0);

    if (currency < cost) return false;

    const newLevel = faction.level + 1;
    const newMaxMembers = maxMembersForLevel(newLevel, faction.type);

    set({
      ...(isImmortal
        ? { immortalCurrency: Math.max(0, currency - cost) }
        : { currency: Math.max(0, currency - cost) }
      ) as any,
      playerFaction: {
        ...faction,
        level: newLevel,
        maxMembers: newMaxMembers,
        reputation: faction.reputation + 50,
      },
    } as any);

    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('faction', `势力升级至${newLevel}级，成员上限${newMaxMembers}人`);
    }
    return true;
  },

  // ═══ v0.7.0: 每回合势力维护扣费 — 设计大纲§1.2.3 ═══
  tickFactionMaintenance: () => {
    const state = get() as FactionSlice;
    const faction = state.playerFaction;
    if (!faction) return;

    const fullStore = get() as any;
    const realm = fullStore.profile?.realm?.grand || 1;
    const cost = calcMaintenanceCost(faction, realm);

    if (realm >= 6) {
      const currentCurrency = fullStore.immortalCurrency || 0;
      set({ immortalCurrency: Math.max(0, currentCurrency - cost) } as any);
    } else {
      // 5转势力维护直接扣元石（公式已返回元石值）
      const currentCurrency = fullStore.currency || 0;
      set({ currency: Math.max(0, currentCurrency - cost) } as any);
    }

    const logStore = fullStore;
    if (cost > 0 && typeof logStore.addGameLog === 'function') {
      const currencyName = realm >= 6 ? '仙元石' : '元石';
      logStore.addGameLog('economy', `势力维护: -${cost}${currencyName} (等级${faction.level}, ${faction.members.length}名成员)`);
    }
  },

  // ═══ v0.7.0: 势力贸易收入 — 设计大纲§1.2.3 ═══
  tickFactionTrade: () => {
    const state = get() as FactionSlice;
    const faction = state.playerFaction;
    if (!faction) return;

    const fullStore = get() as any;
    const realm = fullStore.profile?.realm?.grand || 1;
    const income = calcTradeIncome(faction, realm);

    if (realm >= 6) {
      const current = fullStore.immortalCurrency || 0;
      set({ immortalCurrency: current + income } as any);
    } else {
      // 5转势力贸易收入直接为元石（公式已返回元石值）
      const current = fullStore.currency || 0;
      set({ currency: current + income } as any);
    }
  },

  // ═══ v0.7.0: 更新成员忠诚度 ═══
  updateMemberLoyalty: (memberId, delta) => {
    const faction = (get() as FactionSlice).playerFaction;
    if (!faction) return;

    set({
      playerFaction: {
        ...faction,
        members: faction.members.map(m =>
          m.id === memberId
            ? { ...m, loyalty: Math.max(0, Math.min(100, m.loyalty + delta)) }
            : m,
        ),
      },
    } as any);
  },

  // ═══ v0.7.0: 获取当前成员数 ═══
  getMemberCount: () => {
    return ((get() as FactionSlice).playerFaction?.members || []).length;
  },

  // ═══ v0.7.0 P2: 从动态NPC招募为队友 ═══
  recruitDynamicNPC: (dynamicNpcId: string) => {
    const fullStore = get() as any;
    const npc = fullStore.dynamicNPCs?.[dynamicNpcId];
    if (!npc) {
      console.warn(`[FactionSlice] 动态NPC ${dynamicNpcId} 不存在`);
      return false;
    }

    if (!npc.recruit_eligible) {
      console.warn(`[FactionSlice] ${npc.name} 好感度${npc.affinity}不足，无法招募（需>=60）`);
      return false;
    }

    // 转换为SquadMember
    const squadMember = {
      id: `squad_${dynamicNpcId}`,
      name: npc.name,
      npcId: dynamicNpcId, // 保持来源追溯
      path: npc.path,
      realm: npc.realm,
      loyalty: Math.min(100, npc.affinity), // 好感度→忠诚度映射
      personality: (() => {
        const p = npc.personality || '';
        if (p.includes('忠') || p.includes('诚')) return 'loyal' as const;
        if (p.includes('狡') || p.includes('狡猾')) return 'cunning' as const;
        if (p.includes('莽') || p.includes('冲动')) return 'reckless' as const;
        if (p.includes('谨慎') || p.includes('胆小')) return 'cautious' as const;
        if (p.includes('无私') || p.includes('善良')) return 'selfless' as const;
        return 'cautious' as const; // 默认谨慎
      })(),
      alive: true,
      hp: npc.hp || npc.maxHp || 100,
      maxHp: npc.maxHp || 100,
      atk: npc.atk || 20,
      def: npc.def || 5,
      adventureTrust: Math.min(100, Math.floor(npc.affinity * 0.8)),
      interestDrive: Math.min(100, Math.floor(npc.plot_participation * 0.5)),
    };

    // 调用现有招募逻辑
    const result = (get() as any).recruitMember(squadMember);
    if (result) {
      // 从动态NPC注册表中移除（已转为正式队友）
      const newNPCs = { ...fullStore.dynamicNPCs };
      delete newNPCs[dynamicNpcId];
      set({ dynamicNPCs: newNPCs } as any);

      if (typeof fullStore.addGameLog === 'function') {
        fullStore.addGameLog('npc', `${npc.name} 从路人甲正式加入势力，成为你的队友！`, {
          dynamicNpcId, name: npc.name, affinity: npc.affinity,
        });
      }
    }
    return result;
  },
});
