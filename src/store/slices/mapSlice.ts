import type { MapLocation } from '../../types';

/** 五域名录 */
const MAJOR_DOMAINS = new Set(['南疆', '北原', '东海', '西漠', '中洲']);

interface MapSlice {
  knownLocations: MapLocation[];
  rumorLocations: MapLocation[];
  playerPosition: { x: number; y: number; region: string };
  exploredRegions: string[];
  fogOfWar: boolean;
  /** P0.2: 跨域访问计数 */
  domainsVisited: number;
  discoverLocation: (loc: MapLocation) => void;
  addRumorLocation: (loc: MapLocation) => void;
  promoteRumorLocation: (id: string) => void;
  movePlayer: (pos: { x: number; y: number; region: string }) => void;
  revealRegion: (region: string) => void;
  /** P2补完: 标记跨域访问（切换域时调用） */
  markDomainVisited: (region: string) => void;
}

export const createMapSlice = (set: any, get: any): MapSlice => ({
  knownLocations: [],
  rumorLocations: [],
  playerPosition: { x: 0.5, y: 0.5, region: '' },
  exploredRegions: [],
  fogOfWar: true,
  domainsVisited: 0,
  discoverLocation: (loc) => set((s: MapSlice) => {
    const known: MapLocation = {
      ...loc,
      discovered: true,
      isRumor: false,
      credibility: Math.max(70, loc.credibility ?? 100),
      source: loc.source || 'player_visit',
    };
    const knownLocations = s.knownLocations.some(item => item.id === known.id)
      ? s.knownLocations.map(item => item.id === known.id ? { ...item, ...known } : item)
      : [...s.knownLocations, known];
    return {
      knownLocations,
      rumorLocations: s.rumorLocations.filter(item => item.id !== known.id),
    };
  }),
  addRumorLocation: (loc) => set((s: MapSlice) => {
    const rumor: MapLocation = {
      ...loc,
      discovered: false,
      isRumor: true,
      type: loc.type || 'rumor',
      source: loc.source || 'ai_rumor',
      credibility: Math.max(0, Math.min(100, loc.credibility ?? 35)),
    };
    const rumorLocations = s.rumorLocations.some(item => item.id === rumor.id)
      ? s.rumorLocations.map(item => item.id === rumor.id ? { ...item, ...rumor } : item)
      : [...s.rumorLocations, rumor];
    return { rumorLocations };
  }),
  promoteRumorLocation: (id) => set((s: MapSlice) => {
    const rumor = s.rumorLocations.find(item => item.id === id);
    if (!rumor) return {};
    const known: MapLocation = {
      ...rumor,
      discovered: true,
      isRumor: false,
      source: rumor.source === 'ai_rumor' ? 'manual_review' : rumor.source,
      credibility: Math.max(70, rumor.credibility ?? 70),
    };
    const knownLocations = s.knownLocations.some(item => item.id === id)
      ? s.knownLocations.map(item => item.id === id ? { ...item, ...known } : item)
      : [...s.knownLocations, known];
    return {
      knownLocations,
      rumorLocations: s.rumorLocations.filter(item => item.id !== id),
    };
  }),
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
      description: `${pos.region || '未知区域'}的已抵达地点。后续会随章节、传闻核验和资源发现补全设施与风险。`,
      dangerLevel: 'medium',
      source: 'player_visit',
      credibility: 100,
      isRumor: false,
      actions: ['探索周边', '打听消息'],
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
  // P2补完: 域切换时显式标记跨域访问
  markDomainVisited: (region) => set((s: MapSlice) => ({
    exploredRegions: s.exploredRegions.includes(region)
      ? s.exploredRegions
      : [...s.exploredRegions, region],
    domainsVisited: s.domainsVisited + 1,
  })),
});
