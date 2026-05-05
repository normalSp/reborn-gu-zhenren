import type { MortalAperture, ImmortalAperture, ApertureStorage, ImmortalApertureGrade, GuInstance } from '../../types';

/**
 * P4: 福地等级评定参数（方案A — 正常游玩路线）
 * 评定时五项加权，满分100
 */
const GRADE_WEIGHTS = {
  daoMarks: 0.30,       // 道痕总量占比
  guRefined: 0.10,      // 炼化蛊虫数
  famousScenes: 0.20,   // 完成名场面数
  killerMoves: 0.20,    // 杀招掌握数
  talent: 0.20,         // 资质加成
};

/**
 * 方案A：根据蛊师阶段积累评定福地等级
 * 返回 { grade, areaRange, flowRange, nodeRange }
 */
export function evaluateApertureGrade(
  daoMarksTotal: number,
  guRefinedCount: number,
  famousScenesCompleted: number,
  killerMovesKnown: number,
  talentLevel: number, // 1-10
): { grade: ImmortalApertureGrade; areaRange: [number, number]; flowRange: [number, number]; nodeRange: [number, number] } {
  // 归一化：最大道痕约500，最大炼化约50，最大名场面约10，最大杀招约10，资质1-10
  const daoScore = Math.min(100, (daoMarksTotal / 500) * 100);
  const guScore = Math.min(100, (guRefinedCount / 50) * 100);
  const sceneScore = Math.min(100, (famousScenesCompleted / 10) * 100);
  const killScore = Math.min(100, (killerMovesKnown / 10) * 100);
  const talentScore = talentLevel * 10;

  const total = Math.round(
    daoScore * GRADE_WEIGHTS.daoMarks +
    guScore * GRADE_WEIGHTS.guRefined +
    sceneScore * GRADE_WEIGHTS.famousScenes +
    killScore * GRADE_WEIGHTS.killerMoves +
    talentScore * GRADE_WEIGHTS.talent
  );

  if (total >= 80) {
    return { grade: '上等福地', areaRange: [601, 900], flowRange: [20, 33], nodeRange: [3, 6] };
  } else if (total >= 50) {
    return { grade: '中等福地', areaRange: [301, 600], flowRange: [10, 20], nodeRange: [2, 4] };
  } else {
    return { grade: '小福地', areaRange: [100, 300], flowRange: [5, 8], nodeRange: [1, 2] };
  }
}

/**
 * 方案B：点数分配参数（timeline快速开局）
 * 总点数 = 转数 × 15
 */
export function getTimelineAperturePoints(realm: number): number {
  return realm * 15;
}

/** 空仙窍存储初始值 */
const EMPTY_APERTURE_STORAGE: ApertureStorage = {
  gu: [],
  materials: {},
  immortalMaterials: {},
};

interface ApertureSlice {
  aperture: MortalAperture | ImmortalAperture | null;
  /** P4: 仙窍独立存储 — 升仙后所有蛊虫/蛊材存放于此，无限容量 */
  apertureInventory: ApertureStorage;
  initializeMortalAperture: (aperture: MortalAperture) => void;
  initializeAperture: (aperture: ImmortalAperture) => void;
  /** P4: 升仙时迁移空窍 inventory → apertureInventory + 解除 capacity 限制 */
  migrateToApertureStorage: () => void;
  tickAperture: (externalTime: number) => void;
  /** P4: 设置资源节点启用状态 */
  setNodeActive: (nodeId: string, active: boolean) => void;
}

export const createApertureSlice = (set: any, get: any): ApertureSlice => ({
  aperture: null,
  apertureInventory: { ...EMPTY_APERTURE_STORAGE },

  initializeMortalAperture: (aperture) => {
    set({ aperture });
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('system', '空窍初始化', {
        type: 'mortal',
        rank: (aperture as any).rank,
        primevalSeaColor: (aperture as any).primevalSea?.colorName,
      });
    }
  },

  initializeAperture: (aperture) => {
    set({ aperture });
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('system', `仙窍初始化: ${aperture.grade || aperture.type}`, {
        type: aperture.type,
        grade: (aperture as any).grade,
        areaMu: (aperture as any).area_mu,
        timeFlowRatio: (aperture as any).time_flow_ratio,
      });
    }
  },

  /**
   * P4: 升仙迁移 —— 将空窍 inventory + materialBag 全部迁移到仙窍存储
   * 清空空窍 capacity 限制，设置 materialBagCapacity = Infinity
   */
  migrateToApertureStorage: () => {
    const state = get() as any;
    const inventory: GuInstance[] = state.inventory || [];
    const materialBag: Record<string, number> = state.materialBag || {};

    // 迁移蛊虫到仙窍
    const apertureInv: ApertureStorage = {
      gu: [...inventory],
      materials: { ...materialBag },
      immortalMaterials: state.apertureInventory?.immortalMaterials || {},
    };

    // 清空空窍，解除容量
    set({
      apertureInventory: apertureInv,
      materialBagCapacity: Infinity,
    });

    // 记录日志
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('system', `升仙迁移: ${inventory.length} 只蛊虫 + ${Object.values(materialBag).reduce((a: number, b: number) => a + b, 0)} 份蛊材迁入仙窍`, {
        guCount: inventory.length,
        materialCount: Object.keys(materialBag).length,
      });
    }
  },

  tickAperture: (externalDays: number) => {
    const state = get() as any;
    const aperture = state.aperture as ImmortalAperture | null;
    if (!aperture || aperture.type === 'mortal') return;
    const { resource_nodes, dao_mark_density } = aperture;
    const timeMultiplier = externalDays * aperture.time_flow_ratio;
    if (timeMultiplier <= 0) return;

    // P4: 资源节点产出写入仙窍存储
    const currentStorage: ApertureStorage = state.apertureInventory || { ...EMPTY_APERTURE_STORAGE };
    const newMaterials = { ...currentStorage.materials };
    const newImmortalMaterials = { ...currentStorage.immortalMaterials };

    for (const node of resource_nodes) {
      if (node.active === false) continue; // P4: 跳过关闭的节点
      const daoBonus = 1 + ((dao_mark_density[node.type] || 0) * 0.01);
      const output = Math.floor(node.output_rate * timeMultiplier * (node.quality / 100) * daoBonus);
      if (output <= 0) continue;

      if (node.grade === '仙材') {
        newImmortalMaterials[node.name] = (newImmortalMaterials[node.name] || 0) + output;
      } else {
        newMaterials[node.name] = (newMaterials[node.name] || 0) + output;
      }
    }

    set({
      apertureInventory: {
        ...currentStorage,
        materials: newMaterials,
        immortalMaterials: newImmortalMaterials,
      },
    });

    // 道痕密度>100产出仙元石
    const totalDao = Object.values(dao_mark_density as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    if (totalDao > 100) {
      const immortalOutput = Math.floor(timeMultiplier * totalDao * 0.001);
      if (immortalOutput > 0) {
        const currentImmortalCurrency = state.immortalCurrency || 0;
        set({ immortalCurrency: currentImmortalCurrency + immortalOutput });
      }
    }
  },

  /** P4: 切换资源节点开关 */
  setNodeActive: (nodeId: string, active: boolean) => {
    const aperture = get().aperture as ImmortalAperture | null;
    if (!aperture) return;
    const updatedNodes = aperture.resource_nodes.map(n =>
      n.id === nodeId ? { ...n, active } : n
    );
    set({ aperture: { ...aperture, resource_nodes: updatedNodes } });
  },
});
