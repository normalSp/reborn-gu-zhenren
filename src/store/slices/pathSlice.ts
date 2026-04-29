import type { PathType, PathLevel } from '../../types';

interface PathSlice {
  primaryPath: PathType | null;
  secondaryPaths: PathType[];
  pathLevels: Record<PathType, PathLevel>;
  daoMarks: Record<PathType, number>;
  setPrimaryPath: (path: PathType) => void;
  addSecondaryPath: (path: PathType) => void;
  addDaoMarks: (path: PathType, amount: number) => void;
}

export const createPathSlice = (set: any, get: any): PathSlice => ({
  primaryPath: null,
  secondaryPaths: [],
  pathLevels: {},
  daoMarks: {},
  setPrimaryPath: (path) => set({ primaryPath: path }),
  addSecondaryPath: (path) => set((s: PathSlice) => ({
    secondaryPaths: s.secondaryPaths.includes(path) ? s.secondaryPaths : [...s.secondaryPaths, path],
  })),
  addDaoMarks: (path, amount) => set((s: PathSlice) => ({
    daoMarks: { ...s.daoMarks, [path]: (s.daoMarks[path] || 0) + amount },
  })),
});
