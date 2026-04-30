import type { ImmortalAperture } from '../../types';

interface ImmortalSlice {
  aperture: ImmortalAperture | null;
  initializeAperture: (aperture: ImmortalAperture) => void;
  tickAperture: (externalTime: number) => void;
}

export const createImmortalSlice = (set: any, get: any): ImmortalSlice => ({
  aperture: null,
  initializeAperture: (aperture) => set({ aperture }),
  tickAperture: (externalDays: number) => {
    const aperture = get().aperture as ImmortalAperture | null;
    if (!aperture) return;
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
        set((s: ImmortalSlice) => ({
          aperture: s.aperture ? { ...s.aperture } : null,
        } as any));
        (get() as any).immortalCurrency = ((get() as any).immortalCurrency || 0) + immortalOutput;
      }
    }
  },
});
