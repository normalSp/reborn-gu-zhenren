import type { PathLevel } from '../types';

export interface PathDaoMarkSource {
  pathBuild?: {
    primary?: string | null;
    secondary?: string[] | null;
    path_levels?: Record<string, PathLevel> | null;
    dao_marks?: Record<string, number> | null;
  } | null;
  primaryPath?: string | null;
  secondaryPaths?: string[] | null;
  pathLevels?: Record<string, PathLevel> | null;
  daoMarks?: Record<string, number> | null;
  aperture?: {
    dao_mark_density?: Record<string, number> | null;
  } | null;
  inventory?: Array<{ path?: string; baseCost?: number }> | null;
  killMoves?: Array<{ path?: string; baseCost?: number }> | null;
}

export interface NormalizedPathDaoMarkState {
  primary: string;
  secondary: string[];
  pathLevels: Record<string, PathLevel>;
  daoMarks: Record<string, number>;
  apertureDensity: Record<string, number>;
  totalMarks: number;
  topDaoMarks: Array<[string, number]>;
  softTendency: Array<[string, number]>;
}

function normalizeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function mergeMarks(...sources: Array<Record<string, number> | null | undefined>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [path, value] of Object.entries(source)) {
      if (!path) continue;
      out[path] = Math.max(out[path] || 0, normalizeNumber(value));
    }
  }
  return out;
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))];
}

export function normalizePathDaoMarkState(source: PathDaoMarkSource): NormalizedPathDaoMarkState {
  const pathBuild = source.pathBuild || {};
  const primary = String(pathBuild.primary || source.primaryPath || '');
  const secondary = cleanStringList(pathBuild.secondary?.length ? pathBuild.secondary : source.secondaryPaths);
  const pathLevels = {
    ...(source.pathLevels || {}),
    ...(pathBuild.path_levels || {}),
  };
  const apertureDensity = mergeMarks(source.aperture?.dao_mark_density || undefined);
  const daoMarks = mergeMarks(
    source.daoMarks || undefined,
    pathBuild.dao_marks || undefined,
    apertureDensity,
  );
  const totalMarks = Object.values(daoMarks).reduce((sum, value) => sum + normalizeNumber(value), 0);
  const topDaoMarks = Object.entries(daoMarks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const softTendency = Object.entries(
    [...(source.inventory || []), ...(source.killMoves || [])].reduce((acc: Record<string, number>, item: any) => {
      if (!item?.path) return acc;
      acc[item.path] = (acc[item.path] || 0) + (item.baseCost ? 3 : 2);
      return acc;
    }, {}),
  ).sort(([, a], [, b]) => b - a).slice(0, 3);

  return {
    primary,
    secondary,
    pathLevels,
    daoMarks,
    apertureDensity,
    totalMarks,
    topDaoMarks,
    softTendency,
  };
}
