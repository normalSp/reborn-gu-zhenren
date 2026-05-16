import { STORAGE_KEYS } from '../store/storageKeys';

export type DiagnosticCategory = 'audio' | 'battle' | 'e2e' | 'economy' | 'system';

export interface DiagnosticLogEntry {
  id: string;
  category: DiagnosticCategory;
  severity: 'info' | 'warning' | 'error';
  message: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = STORAGE_KEYS.DIAGNOSTICS;
const MAX_ENTRIES = 120;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readEntries(): DiagnosticLogEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: DiagnosticLogEntry[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // diagnostics must never break gameplay
  }
}

export function recordDiagnostic(entry: Omit<DiagnosticLogEntry, 'id' | 'createdAt'>): DiagnosticLogEntry {
  const full: DiagnosticLogEntry = {
    ...entry,
    id: `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  writeEntries([...readEntries(), full]);
  return full;
}

export function getDiagnosticLog(): DiagnosticLogEntry[] {
  return readEntries();
}

export function clearDiagnosticLog(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
