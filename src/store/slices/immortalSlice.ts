import type { MortalAperture, ImmortalAperture } from '../../types';

interface ApertureSlice {
  aperture: MortalAperture | ImmortalAperture | null;
  initializeMortalAperture: (aperture: MortalAperture) => void;
  initializeAperture: (aperture: ImmortalAperture) => void;
  tickAperture: (externalTime: number) => void;
}

export const createApertureSlice = (set: any, get: any): ApertureSlice => ({
  aperture: null,
  initializeMortalAperture: (aperture) => {
    set({ aperture });
    // ═══ 日志埋点: 空窍初始化
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
    // ═══ 日志埋点: 仙窍初始化
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('system', `仙窍初始化: ${aperture.type}`, {
        type: aperture.type,
        areaMu: (aperture as any).area_mu,
        timeFlowRatio: (aperture as any).time_flow_ratio,
      });
    }
  },
  tickAperture: (externalDays: number) => {
    const aperture = get().aperture as ImmortalAperture | null;
    if (!aperture || aperture.type === 'mortal') return;
    const { resource_nodes, dao_mark_density } = aperture;
    const timeMultiplier = externalDays * aperture.time_flow_ratio;
    if (timeMultiplier <= 0) return;

    // 资源节点产出蛊材
    for (const node of resource_nodes) {
      const daoBonus = 1 + ((dao_mark_density[node.type] || 0) * 0.01);
      const output = Math.floor(node.output_rate * timeMultiplier * node.quality * daoBonus);
      if (output > 0) {
        (get() as any).addMaterial?.(`${node.type}蛊材`, output);
      }
    }

    // 道痕密度>100产出仙元石
    const totalDao = Object.values(dao_mark_density as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    if (totalDao > 100) {
      const immortalOutput = Math.floor(timeMultiplier * totalDao * 0.001);
      if (immortalOutput > 0) {
        set((s: ApertureSlice) => ({
          aperture: s.aperture ? { ...s.aperture } : null,
        } as any));
        (get() as any).immortalCurrency = ((get() as any).immortalCurrency || 0) + immortalOutput;
      }
    }
  },
});
