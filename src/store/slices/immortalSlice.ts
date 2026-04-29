import type { ImmortalAperture } from '../../types';

interface ImmortalSlice {
  aperture: ImmortalAperture | null;
  initializeAperture: (aperture: ImmortalAperture) => void;
  tickAperture: (externalTime: number) => void;
}

export const createImmortalSlice = (set: any, get: any): ImmortalSlice => ({
  aperture: null,
  initializeAperture: (aperture) => set({ aperture }),
  tickAperture: (_externalTime: number) => {
    // 留空，阶段3B实现仙窍经营结算
  },
});
