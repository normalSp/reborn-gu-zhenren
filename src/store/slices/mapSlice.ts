import type { MapLocation } from '../../types';

/** 五域名录 */
const MAJOR_DOMAINS = new Set(['南疆', '北原', '东海', '西漠', '中洲']);

interface MapSlice {
  knownLocations: MapLocation[];
  playerPosition: { x: number; y: number; region: string };
  exploredRegions: string[];
  fogOfWar: boolean;
  /** P0.2: 跨域访问计数 */
  domainsVisited: number;
  discoverLocation: (loc: MapLocation) => void;
  movePlayer: (pos: { x: number; y: number; region: string }) => void;
  revealRegion: (region: string) => void;
}

export const createMapSlice = (set: any, get: any): MapSlice => ({
  knownLocations: [],
  playerPosition: { x: 0.5, y: 0.5, region: '' },
  exploredRegions: [],
  fogOfWar: true,
  domainsVisited: 0,
  discoverLocation: (loc) => set((s: MapSlice) => ({
    knownLocations: [...s.knownLocations, { ...loc, discovered: true }],
  })),
  // ═══ P1.5: 移动到新位置时自动标记已发现 ═══
  movePlayer: (pos) => set((s: MapSlice) => {
    const newLocation: MapLocation = {
      id: `loc_${pos.region}_${Math.round(pos.x * 100)}_${Math.round(pos.y * 100)}`,
      name: pos.region || '未知区域',
      region: pos.region,
      x: pos.x,
      y: pos.y,
      discovered: true,
      type: 'settlement',
    };
    const exists = s.knownLocations.some(l => l.id === newLocation.id);
    return { 
      playerPosition: pos,
      knownLocations: exists ? s.knownLocations : [...s.knownLocations, newLocation],
    };
  }),
  // ═══ P0.2: 首次访问五域时递增 domainsVisited ═══
  revealRegion: (region) => set((s: MapSlice) => ({
    exploredRegions: s.exploredRegions.includes(region)
      ? s.exploredRegions
      : [...s.exploredRegions, region],
    domainsVisited: (!s.exploredRegions.includes(region) && MAJOR_DOMAINS.has(region))
      ? s.domainsVisited + 1
      : s.domainsVisited,
  })),
});
