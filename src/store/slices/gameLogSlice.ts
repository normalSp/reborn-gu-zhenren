// ═══════════════════════════════════════════════════════════
// gameLogSlice — 游戏事件日志系统（事件溯源模式）
// 记录所有关键游戏事件，支持导出为 JSON 文件
// ═══════════════════════════════════════════════════════════

export type GameLogCategory =
  | 'narrative'
  | 'combat'
  | 'economy'
  | 'system'
  | 'achievement'
  | 'encounter'
  | 'npc'
  | 'gu'
  | 'pipeline'
  | 'map'
  | 'faction'
  | 'death';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  category: GameLogCategory;
  message: string;
  summary: string;
  detail: string;
  location?: string;
  actors?: string[];
  gains?: string[];
  losses?: string[];
  danger?: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  importance?: number;
  archived?: boolean;
  data?: Record<string, unknown>;
}

const MAX_GAME_LOG = 2000;
const MAX_ARCHIVE_LOG = 4000;
let entryCounter = 0;

export interface GameLogSlice {
  /** 游戏事件日志（持久化） */
  gameLog: GameLogEntry[];
  /** 归档日志：普通事件超出上限后迁入，关键事件仍留在 gameLog */
  gameLogArchive: GameLogEntry[];

  /** 添加一条事件日志 */
  addGameLog: (category: GameLogCategory, message: string, data?: Record<string, unknown>) => void;
  /** 手动归档旧普通日志 */
  archiveGameLog: (keepRecent?: number) => void;

  /** 导出日志为 JSON 字符串（含元数据） */
  exportGameLog: () => string;

  /** 清空日志 */
  clearGameLog: () => void;
}

export const createGameLogSlice = (set: any, get: any): GameLogSlice => ({
  gameLog: [],
  gameLogArchive: [],

  addGameLog: (category, message, data?) => {
    const state = get() as any;
    const summary = typeof data?.summary === 'string' ? data.summary : message;
    const detail = typeof data?.detail === 'string' ? data.detail : message;
    const entry: GameLogEntry = {
      id: `log-${++entryCounter}-${Date.now()}`,
      timestamp: Date.now(),
      turn: state.turn ?? 0,
      category,
      message,
      summary,
      detail,
      location: typeof data?.location === 'string' ? data.location : undefined,
      actors: Array.isArray(data?.actors) ? data.actors.map(String) : undefined,
      gains: Array.isArray(data?.gains) ? data.gains.map(String) : undefined,
      losses: Array.isArray(data?.losses) ? data.losses.map(String) : undefined,
      danger: typeof data?.danger === 'string' ? data.danger as GameLogEntry['danger'] : 'none',
      importance: typeof data?.importance === 'number' ? data.importance : (category === 'death' || category === 'achievement' ? 3 : 1),
      archived: false,
      data,
    };
    set((s: any) => {
      const next = [...(s.gameLog || []), entry];
      if (next.length <= MAX_GAME_LOG) return { gameLog: next };
      const overflowCount = next.length - MAX_GAME_LOG;
      const overflow = next.slice(0, overflowCount);
      const keep = next.slice(overflowCount);
      const criticalOverflow = overflow.filter(log => (log.importance || 1) >= 3);
      const archivedOverflow = overflow
        .filter(log => (log.importance || 1) < 3)
        .map(log => ({ ...log, archived: true }));
      return {
        gameLog: [...criticalOverflow, ...keep].slice(-MAX_GAME_LOG),
        gameLogArchive: [...(s.gameLogArchive || []), ...archivedOverflow].slice(-MAX_ARCHIVE_LOG),
      };
    });
  },

  archiveGameLog: (keepRecent = 300) => {
    set((s: any) => {
      const logs = (s.gameLog || []) as GameLogEntry[];
      if (logs.length <= keepRecent) return {};
      const archiveCandidates = logs.slice(0, Math.max(0, logs.length - keepRecent));
      const keepCandidates = logs.slice(Math.max(0, logs.length - keepRecent));
      const critical = archiveCandidates.filter(log => (log.importance || 1) >= 3);
      const ordinary = archiveCandidates
        .filter(log => (log.importance || 1) < 3)
        .map(log => ({ ...log, archived: true }));
      return {
        gameLog: [...critical, ...keepCandidates],
        gameLogArchive: [...(s.gameLogArchive || []), ...ordinary].slice(-MAX_ARCHIVE_LOG),
      };
    });
  },

  exportGameLog: () => {
    const state = get() as any;
    const logs = (state.gameLog || []) as GameLogEntry[];
    const archived = (state.gameLogArchive || []) as GameLogEntry[];
    const meta = {
      playerName: state.profile?.name || '无名蛊师',
      realm: state.profile?.realm?.label || '未知',
      turn: state.turn || 0,
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
      archivedEntries: archived.length,
    };
    return JSON.stringify({ meta, entries: logs, archive: archived }, null, 2);
  },

  clearGameLog: () => set({ gameLog: [], gameLogArchive: [] }),
});
