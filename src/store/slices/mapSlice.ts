import type { MapLocation } from '../../types';

interface MapSlice {
  knownLocations: MapLocation[];
  playerPosition: { x: number; y: number; region: string };
  exploredRegions: Set<string>;
  fogOfWar: boolean;
  discoverLocation: (loc: MapLocation) => void;
  movePlayer: (pos: { x: number; y: number; region: string }) => void;
  revealRegion: (region: string) => void;
}

export const createMapSlice = (set: any, get: any): MapSlice => ({
  knownLocations: [],
  playerPosition: { x: 0, y: 0, region: '南疆' },
  exploredRegions: new Set(),
  fogOfWar: true,
  discoverLocation: (loc) => set((s: MapSlice) => ({
    knownLocations: [...s.knownLocations, { ...loc, discovered: true }],
  })),
  movePlayer: (pos) => set({ playerPosition: pos }),
  revealRegion: (region) => set((s: MapSlice) => ({
    exploredRegions: new Set([...s.exploredRegions, region]),
  })),
});
