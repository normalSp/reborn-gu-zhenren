import pathRegistryRaw from '../canon/path-registry.json';

export type CanonicalPathStatus = 'confirmed' | 'prototype' | 'category_only' | 'blocked';

export interface PathRegistryEntry {
  id: string;
  canonicalStatus: CanonicalPathStatus;
  evidenceRef: string;
  runtimeAllowed: boolean;
  displayAllowed: boolean;
  notes: string;
}

const entries = ((pathRegistryRaw as any).paths || []) as PathRegistryEntry[];
const entryById = new Map(entries.map(entry => [entry.id, entry]));

export function getPathRegistryEntries(): PathRegistryEntry[] {
  return entries;
}

export function getPathRegistryEntry(path: string | undefined | null): PathRegistryEntry | undefined {
  if (!path) return undefined;
  return entryById.get(path);
}

export function isRuntimePathAllowed(path: string | undefined | null): boolean {
  const entry = getPathRegistryEntry(path);
  return !!entry && entry.canonicalStatus === 'confirmed' && entry.runtimeAllowed === true;
}

export function isDisplayPathAllowed(path: string | undefined | null): boolean {
  const entry = getPathRegistryEntry(path);
  return !!entry && entry.displayAllowed === true;
}

export function getRuntimePathNames(): string[] {
  return entries
    .filter(entry => entry.canonicalStatus === 'confirmed' && entry.runtimeAllowed)
    .map(entry => entry.id);
}

export function assertRuntimePathAllowed(path: string, source: string = 'unknown'): void {
  if (isRuntimePathAllowed(path)) return;
  const entry = getPathRegistryEntry(path);
  const status = entry?.canonicalStatus || 'unregistered';
  throw new Error(`[PathRegistry] ${source} uses illegal runtime path "${path}" (${status})`);
}

export function filterRuntimePathRecord<T>(record: Record<string, T> | undefined): Record<string, T> | undefined {
  if (!record) return undefined;
  const next: Record<string, T> = {};
  for (const [path, value] of Object.entries(record)) {
    if (isRuntimePathAllowed(path)) next[path] = value;
  }
  return next;
}
