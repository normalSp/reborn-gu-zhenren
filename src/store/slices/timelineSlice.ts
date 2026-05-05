import { create } from 'zustand';

// ─── 时间线节点类型 ───
export interface TimelineNode {
  id: string;
  displayTitle: string;
  preview: string;
  domain: string;
  allowedDomains: string[];
  startingRealm: { grand: number; sub: string };
  realmRange: string;
  needLifeboundGu: boolean;
  needAperture: boolean;
  talentCategory: 'mortal' | 'immortal';
  guTierRange: [number, number];
  startingYuanStone: number;
  baseCapacity: number;
  /** v1.6: 可选势力ID列表（按域自动推导，不需在JSON中定义） */
  factionOptions?: string[];
  /** v1.6: 随机蛊数量 */
  startingGuCount?: number;
  /** v1.6: 是否需要势力选择 */
  needFactionSelection?: boolean;
  /** v1.6: 是否需要蛊虫选择 */
  needGuSelection?: boolean;
  /** v1.6: 是否需要杀招选择（仅蛊仙） */
  needKillerMoveSelection?: boolean;
}

/** v1.6: 为节点填充缺失字段的默认值 */
export function normalizeTimelineNode(node: TimelineNode): TimelineNode {
  if (!node.needFactionSelection) node.needFactionSelection = true;
  if (!node.needGuSelection) node.needGuSelection = true;
  if (!node.startingGuCount) {
    const r = node.startingRealm.grand;
    node.startingGuCount = r <= 2 ? 1 : r <= 4 ? 2 : r === 5 ? 3 : r <= 7 ? 3 : 4;
  }
  if (node.needKillerMoveSelection === undefined) {
    node.needKillerMoveSelection = node.startingRealm.grand >= 6;
  }
  return node;
}

// ─── 势力选择 ───
export interface FactionSelection {
  factionId: string;
  factionName: string;
  domain: string;
  starterGu: { name: string; tier: number; path: string; rank: string } | null;
  bonus: { resourceMult: number; talentBonus: number; desc: string };
}

// ─── 蛊虫选择 ───
export interface GuSelection {
  name: string;
  tier: number;
  path: string;
  rank: string;
  description: string;
  isGuaranteed: boolean;
}

// ─── 杀招选择 ───
export interface KillerMoveSelection {
  name: string;
  path: string;
  level: number;
  effect: string;
  coreGu: string[];
  cost: string;
}

// ─── 洞天福地配置 ───
export interface ApertureConfig {
  areaMu: number;          // 面积（亩）
  resourceNodes: number;   // 资源节点数量
  timeFlowRatio: number;   // 光阴流速比
  defenseLevel: number;    // 防御阵法等级 0-3
}

// ─── 本命蛊选择 ───
export interface LifeboundGuSelection {
  guName: string;
  tier: number;
  path: string;
  rarity: string;
  description: string;
}

// ─── Timeline 配置 Slice ───
interface TimelineSlice {
  selectedNodeId: string | null;
  selectedNode: TimelineNode | null;
  selectedDomain: string;
  timelineTalents: string[];
  lifeboundGu: LifeboundGuSelection | null;
  apertureConfig: ApertureConfig | null;
  apertureRemainingPoints: number;
  startingYuanStone: number;
  startingGuList: Array<{ name: string; tier: number; path: string; rarity: string; description: string }>;
  configStep: 'talent' | 'faction' | 'gu' | 'lifebound' | 'aperture' | 'killermove' | 'resource' | 'complete';

  // P1修复: 蛊仙主修/辅修流派
  primaryPath: string;
  secondaryPath: string;

  // v1.6: 新增字段
  factionId: string;
  factionBonus: FactionSelection['bonus'] | null;
  guaranteedGu: GuSelection | null;
  randomGuPool: GuSelection[];
  selectedGuList: GuSelection[];
  guPoolSeed: number;
  guRerollsRemaining: number;
  selectedKillerMoves: KillerMoveSelection[];
  killerMovePool: KillerMoveSelection[];

  // Actions
  selectNode: (nodeId: string, nodes: TimelineNode[]) => void;
  setConfigStep: (step: TimelineSlice['configStep']) => void;
  setSelectedDomain: (domain: string) => void;
  selectTimelineTalent: (talentId: string) => void;
  deselectTalent: (talentId: string) => void;
  selectLifeboundGu: (gu: LifeboundGuSelection) => void;
  allocateAperturePoints: (config: Partial<ApertureConfig>) => void;
  setStartingResources: (yuanStone: number, guList: TimelineSlice['startingGuList']) => void;
  // P1: 主修/辅修流派选择
  setPrimaryPath: (path: string) => void;
  setSecondaryPath: (path: string) => void;
  
  // v1.6: 新增 actions
  selectFaction: (selection: FactionSelection) => void;
  selectStartingGu: (gu: GuSelection) => void;
  deselectStartingGu: (guName: string) => void;
  rerollGuPool: (pool: GuSelection[], setSeed: number) => void;
  selectKillerMove: (move: KillerMoveSelection) => void;

  getTimelineConfig: () => {
    node: TimelineNode | null; domain: string; talents: string[];
    lifeboundGu: LifeboundGuSelection | null; apertureConfig: ApertureConfig | null;
    startingYuanStone: number; startingGuList: TimelineSlice['startingGuList'];
    factionId: string; factionBonus: FactionSelection['bonus'] | null;
    guaranteedGu: GuSelection | null; selectedGuList: GuSelection[];
    selectedKillerMoves: KillerMoveSelection[];
  };
  resetTimelineConfig: () => void;
}

const initialState = {
  selectedNodeId: null as string | null,
  selectedNode: null as TimelineNode | null,
  selectedDomain: '',
  timelineTalents: [] as string[],
  lifeboundGu: null as LifeboundGuSelection | null,
  apertureConfig: null as ApertureConfig | null,
  apertureRemainingPoints: 0,
  startingYuanStone: 0,
  startingGuList: [] as TimelineSlice['startingGuList'],
  configStep: 'faction' as const,
  // v1.6: 新增
  factionId: '',
  factionBonus: null as FactionSelection['bonus'] | null,
  guaranteedGu: null as GuSelection | null,
  randomGuPool: [] as GuSelection[],
  selectedGuList: [] as GuSelection[],
  guPoolSeed: 0,
  guRerollsRemaining: 3,
  selectedKillerMoves: [] as KillerMoveSelection[],
  // P1: 流派选择
  primaryPath: '',
  secondaryPath: '',
  killerMovePool: [] as KillerMoveSelection[],
};

export const createTimelineSlice = (set: any, get: any): TimelineSlice => ({
  ...initialState,

  selectNode: (nodeId, nodes) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    normalizeTimelineNode(node);
    const isMortal = node.talentCategory === 'mortal';
    
    set({
      selectedNodeId: nodeId,
      selectedNode: node,
      selectedDomain: node.allowedDomains.length === 1 ? node.allowedDomains[0] : '',
      configStep: 'faction',
      timelineTalents: [],
      lifeboundGu: null,
      apertureConfig: null,
      startingYuanStone: 0,
      startingGuList: [],
      factionId: '',
      factionBonus: null,
      guaranteedGu: null,
      randomGuPool: [],
      selectedGuList: [],
      guPoolSeed: 0,
      guRerollsRemaining: 3,
      selectedKillerMoves: [],
      killerMovePool: [],
      primaryPath: '',
      secondaryPath: '',
    });
  },

  setConfigStep: (step) => set({ configStep: step }),
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),
  selectTimelineTalent: (talentId) => set((s: TimelineSlice) => ({
    timelineTalents: s.timelineTalents.includes(talentId) ? s.timelineTalents : [...s.timelineTalents, talentId],
  })),
  deselectTalent: (talentId) => set((s: TimelineSlice) => ({
    timelineTalents: s.timelineTalents.filter(id => id !== talentId),
  })),
  selectLifeboundGu: (gu) => set({ lifeboundGu: gu }),
  allocateAperturePoints: (config) => set((s: TimelineSlice) => ({
    apertureConfig: { ...(s.apertureConfig || { areaMu: 100, resourceNodes: 1, timeFlowRatio: 1.0, defenseLevel: 0 }), ...config },
  })),
  setStartingResources: (yuanStone, guList) => set({ startingYuanStone: yuanStone, startingGuList: guList }),
  setPrimaryPath: (path) => set({ primaryPath: path, secondaryPath: '' }),
  setSecondaryPath: (path) => set((s: TimelineSlice) => ({ secondaryPath: s.secondaryPath === path ? '' : path })),

  // v1.6: 新 actions
  selectFaction: (selection) => set({
    factionId: selection.factionId,
    factionBonus: selection.bonus,
    guaranteedGu: selection.starterGu ? {
      name: selection.starterGu.name, tier: selection.starterGu.tier,
      path: selection.starterGu.path, rank: selection.starterGu.rank,
      description: `${selection.factionName}保底蛊`, isGuaranteed: true,
    } : null,
  }),
  selectStartingGu: (gu) => set((s: TimelineSlice) => ({
    selectedGuList: s.selectedGuList.find(g => g.name === gu.name)
      ? s.selectedGuList : [...s.selectedGuList, gu],
  })),
  deselectStartingGu: (guName) => set((s: TimelineSlice) => ({
    selectedGuList: s.selectedGuList.filter(g => g.name !== guName),
  })),
  rerollGuPool: (pool, seed) => set({ randomGuPool: pool, guPoolSeed: seed, guRerollsRemaining: Math.max(0, (get() as TimelineSlice).guRerollsRemaining - 1) }),
  selectKillerMove: (move) => set((s: TimelineSlice) => {
    const exists = s.selectedKillerMoves.some(m => m.name === move.name);
    if (exists) {
      // toggle: 已选则取消
      return { selectedKillerMoves: s.selectedKillerMoves.filter(m => m.name !== move.name) };
    }
    if (s.selectedKillerMoves.length >= 2) {
      return s; // 已达上限
    }
    return { selectedKillerMoves: [...s.selectedKillerMoves, move] };
  }),

  getTimelineConfig: () => {
    const s = get() as TimelineSlice;
    return {
      node: s.selectedNode, domain: s.selectedDomain, talents: s.timelineTalents,
      lifeboundGu: s.lifeboundGu, apertureConfig: s.apertureConfig,
      startingYuanStone: s.startingYuanStone, startingGuList: s.startingGuList,
      factionId: s.factionId, factionBonus: s.factionBonus,
      guaranteedGu: s.guaranteedGu, selectedGuList: s.selectedGuList,
      selectedKillerMoves: s.selectedKillerMoves,
      primaryPath: s.primaryPath, secondaryPath: s.secondaryPath,
    };
  },

  resetTimelineConfig: () => set(initialState),
});
