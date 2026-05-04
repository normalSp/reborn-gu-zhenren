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
  | 'pipeline';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  category: GameLogCategory;
  message: string;
  data?: Record<string, unknown>;
}

const MAX_GAME_LOG = 2000;
let entryCounter = 0;

export interface GameLogSlice {
  /** 游戏事件日志（持久化） */
  gameLog: GameLogEntry[];

  /** 添加一条事件日志 */
  addGameLog: (category: GameLogCategory, message: string, data?: Record<string, unknown>) => void;

  /** 导出日志为 JSON 字符串（含元数据） */
  exportGameLog: () => string;

  /** 清空日志 */
  clearGameLog: () => void;
}

export const createGameLogSlice = (set: any, get: any): GameLogSlice => ({
  gameLog: [],

  addGameLog: (category, message, data?) => {
    const state = get() as any;
    const entry: GameLogEntry = {
      id: `log-${++entryCounter}-${Date.now()}`,
      timestamp: Date.now(),
      turn: state.turn ?? 0,
      category,
      message,
      data,
    };
    set((s: any) => ({
      gameLog: [...(s.gameLog || []), entry].slice(-MAX_GAME_LOG),
    }));
  },

  exportGameLog: () => {
    const state = get() as any;
    const logs = (state.gameLog || []) as GameLogEntry[];
    const meta = {
      playerName: state.profile?.name || '无名蛊师',
      realm: state.profile?.realm?.label || '未知',
      turn: state.turn || 0,
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
    };
    return JSON.stringify({ meta, entries: logs }, null, 2);
  },

  clearGameLog: () => set({ gameLog: [] }),
});
