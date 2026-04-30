/**
 * 分级日志系统 (4D.14)
 * 用于记录游戏运行时的关键事件，方便后续分析和调试
 *
 * 级别:
 *   debug - 开发调试信息
 *   info  - 正常游戏事件（购买、炼制、突破等）
 *   warn  - 警告（L3/L4轻度违规、异常但可恢复）
 *   error - 错误（API失败、L3/L4严重违规、管道中断）
 *   audit - 审计（经济流水、存档、模式切换等关键操作）
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private buffer: LogEntry[] = [];
  private maxBuffer = 500;
  private minLevel: LogLevel = 'debug';

  setLevel(level: LogLevel) { this.minLevel = level; }

  private levelRank: Record<LogLevel, number> = {
    debug: 0, info: 1, warn: 2, error: 3, audit: 4,
  };

  private log(level: LogLevel, category: string, message: string, data?: Record<string, any>) {
    if (this.levelRank[level] < this.levelRank[this.minLevel]) return;
    const entry: LogEntry = { timestamp: Date.now(), level, category, message, data };
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) this.buffer.splice(0, this.buffer.length - this.maxBuffer);

    // 控制台输出
    const prefix = `[${level.toUpperCase()}]`;
    const style = level === 'error' ? 'color:red' : level === 'warn' ? 'color:orange' : level === 'audit' ? 'color:gold' : '';
    console.log(`%c${prefix} [${category}] ${message}`, style, data ? data : '');
  }

  debug(category: string, message: string, data?: Record<string, any>) { this.log('debug', category, message, data); }
  info(category: string, message: string, data?: Record<string, any>) { this.log('info', category, message, data); }
  warn(category: string, message: string, data?: Record<string, any>) { this.log('warn', category, message, data); }
  error(category: string, message: string, data?: Record<string, any>) { this.log('error', category, message, data); }
  audit(category: string, message: string, data?: Record<string, any>) { this.log('audit', category, message, data); }

  /** 获取所有日志（用于分析/导出） */
  getEntries(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.buffer];
    return this.buffer.filter(e => e.level === level);
  }

  /** 最近N条日志 */
  getRecent(n: number = 20): LogEntry[] {
    return this.buffer.slice(-n);
  }

  /** 统计各级别数量 */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0, audit: 0 };
    for (const e of this.buffer) stats[e.level]++;
    return stats;
  }

  /** 导出为JSON */
  export(): string { return JSON.stringify(this.buffer, null, 2); }

  /** 清空缓冲 */
  clear() { this.buffer = []; }
}

export const logger = new Logger();

// ─── 便捷方法 ───
export function logGameEvent(event: string, data?: Record<string, any>) {
  logger.audit('game', event, data);
}

export function logEconomy(action: string, amount: number, balance: number) {
  logger.audit('economy', `${action}: ${amount}元石`, { action, amount, balance });
}

export function logPipeline(phase: string, details?: any) {
  logger.info('pipeline', phase, details);
}

export function logL3Validation(result: any) {
  if (result.recommendation === 'reject') {
    logger.error('L3', result.details || 'Critical violation', result);
  } else if (result.recommendation === 'warn_only') {
    logger.warn('L3', result.details || 'Warning', result);
  }
}

export function logL4Validation(result: any) {
  const criticals = result.results?.filter((r: any) => !r.passed && r.level === 'critical');
  if (criticals?.length > 0) {
    logger.error('L4', `${criticals.length} critical rule(s) failed`, { criticals });
  }
  const warns = result.results?.filter((r: any) => !r.passed && r.level === 'warning');
  if (warns?.length > 0) {
    logger.warn('L4', `${warns.length} warning(s)`, { warns });
  }
}
