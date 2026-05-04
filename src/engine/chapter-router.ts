/**
 * 章节路由引擎 — P2核心模块
 *
 * 将章节推进从"线性查找下一章"升级为"条件路由图"。
 * 纯函数设计：接收store数据→计算可达章节列表→按优先级排序→输出路由建议。
 * 不直接引用 Zustand store，通过依赖注入接收数据。
 */

import type {
  ChapterDefinition,
  ChapterRecord,
  ChapterRoute,
  ChapterRouteResult,
  ProximityEvent,
} from '../types';
import { detectNearEvents, detectDomainEvents } from './proximity-detector';

// ─── 条件表达式求值器（简化版，支持 triggerConditions 语法）───
// 语法: realm_gte(N) | turn_gte(N) | flag(name) | flag_eq(name,value)
//       and(a,b,...) | or(a,b,...)

function evalCondition(
  expr: string,
  context: { realm: number; turn: number; flags: Record<string, any> }
): boolean {
  const trimmed = expr.trim();

  // or(a, b, c, ...)
  const orMatch = trimmed.match(/^or\((.+)\)$/);
  if (orMatch) {
    const args = splitArgs(orMatch[1]);
    return args.some(a => evalCondition(a, context));
  }

  // and(a, b, c, ...)
  const andMatch = trimmed.match(/^and\((.+)\)$/);
  if (andMatch) {
    const args = splitArgs(andMatch[1]);
    return args.every(a => evalCondition(a, context));
  }

  // realm_gte(N)
  const realmGte = trimmed.match(/^realm_gte\((\d+)\)$/);
  if (realmGte) return context.realm >= parseInt(realmGte[1], 10);

  // turn_gte(N)
  const turnGte = trimmed.match(/^turn_gte\((\d+)\)$/);
  if (turnGte) return context.turn >= parseInt(turnGte[1], 10);

  // flag_eq(name, value)
  const flagEq = trimmed.match(/^flag_eq\((\w+),\s*(\w+)\)$/);
  if (flagEq) return context.flags[flagEq[1]] === flagEq[2];

  // flag(name)
  const flag = trimmed.match(/^flag\((\w+)\)$/);
  if (flag) return context.flags[flag[1]] !== undefined && context.flags[flag[1]] !== false;

  // 直接布尔
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // 兜底：未识别表达式 → 默认通过
  console.warn(`[ChapterRouter] 未识别的触发条件表达式: "${trimmed}"，默认通过`);
  return true;
}

/** 分割逗号分隔的参数（处理嵌套括号） */
function splitArgs(argsStr: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsStr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

// ─── 检查章节前置条件 ───
function checkPrerequisites(
  chapter: ChapterDefinition,
  context: { realm: number; turn: number; flags: Record<string, any> },
  completedChapterIds: Set<string>
): boolean {
  // 触发条件（triggerConditions 表达式）
  if (chapter.triggerConditions) {
    if (!evalCondition(chapter.triggerConditions, context)) return false;
  }

  // 如果是互斥章节，检查 alternatives 是否已被选择
  // （在 routeReachableChapters 层面检查）

  return true;
}

// ─── 判断章节是否已完成 ───
function isChapterCompleted(chapterId: string, history: ChapterRecord[]): boolean {
  return history.some(
    r => r.chapterId === chapterId && r.completedAt !== undefined
  );
}

// ─── 判断章节是否进行中 ───
function isChapterActive(chapterId: string, history: ChapterRecord[]): boolean {
  return history.some(
    r => r.chapterId === chapterId && r.completedAt === undefined
  );
}

// ─── 主路由函数 ───
export function routeReachableChapters(params: {
  currentDomain: string;
  currentChapterId: string | null;
  chapterHistory: ChapterRecord[];
  flags: Record<string, any>;
  realm: number;
  turn: number;
  chaptersData: {
    domains: Record<string, ChapterDefinition[]>;
    global: Array<{
      eventId: string;
      name: string;
      description: string;
      triggerChapter: string;
      rippleStrength: string;
      affectedDomains: string[];
    }>;
  };
}): ChapterRouteResult {
  const {
    currentDomain,
    currentChapterId,
    chapterHistory,
    flags,
    realm,
    turn,
    chaptersData,
  } = params;

  const context = { realm, turn, flags };
  const completedIds = new Set(
    chapterHistory.filter(r => r.completedAt).map(r => r.chapterId)
  );
  const allReachable: ChapterRoute[] = [];

  // ─── 1. 扫描当前域的所有章节 ───
  const domainChapters = chaptersData.domains[currentDomain] || [];
  for (const chapter of domainChapters) {
    // 跳过已完成的章节
    if (completedIds.has(chapter.id)) continue;
    // 跳过当前正在进行的章节
    if (chapter.id === currentChapterId && isChapterActive(chapter.id, chapterHistory)) continue;

    if (checkPrerequisites(chapter, context, completedIds)) {
      allReachable.push({
        chapterId: chapter.id,
        domain: chapter.domain,
        displayName: chapter.displayName,
        prerequisites: {
          requiredFlags: extractFlagRequirements(chapter.triggerConditions),
          requiredRealm: extractRealmGate(chapter.triggerConditions),
        },
        alternatives: [], // P1章无互斥，P2+五域章使用
        isExclusive: false,
        domainOpeningChapter: chapter.domainOpeningChapter,
        priority: chapter.domainOpeningChapter ? 100 : chapter.economyTier || 50,
      });
    }
  }

  // ─── 2. 如果当前域章节全部完成，扫描相邻域的入口章 ───
  if (domainChapters.length > 0 && allReachable.length === 0) {
    // 查找当前域最后一章的 exitTriggers
    const lastChapter = domainChapters[domainChapters.length - 1];
    if (lastChapter?.exitTriggers) {
      const exitMatch = lastChapter.exitTriggers.match(/→(.+)域/);
      if (exitMatch) {
        const targetDomain = exitMatch[1];
        const targetChapters = chaptersData.domains[targetDomain] || [];
        const openingChapter = targetChapters.find(c => c.domainOpeningChapter);
        if (openingChapter && checkPrerequisites(openingChapter, context, completedIds)) {
          allReachable.push({
            chapterId: openingChapter.id,
            domain: openingChapter.domain,
            displayName: `【跨域】${openingChapter.displayName}`,
            prerequisites: {
              requiredFlags: [],
              requiredDomain: targetDomain,
            },
            alternatives: [],
            isExclusive: false,
            domainOpeningChapter: true,
            priority: 90, // 跨域路由略低于域内同章
          });
        }
      }
    }
  }

  // ─── 3. 扫描全局事件表 ───
  const upcomingEvents: ProximityEvent[] = detectNearEvents({
    globalEvents: chaptersData.global,
    currentDomain,
    currentChapterId,
    flags,
    completedIds,
    chapterHistory,
  });

  // ─── 3b. 扫描域内事件表（P2-2b） ───
  const domainEventsData = (chaptersData as any).domain_events || [];
  const domainProximityEvents = detectDomainEvents({
    domainEvents: domainEventsData,
    currentDomain,
    currentChapterId,
    completedIds,
  });
  upcomingEvents.push(...domainProximityEvents);
  upcomingEvents.sort((a, b) => a.distance - b.distance);

  // ─── 4. 排序：priority 降序 → domainOpeningChapter 优先 ───
  allReachable.sort((a, b) => {
    if (a.domainOpeningChapter !== b.domainOpeningChapter) {
      return a.domainOpeningChapter ? -1 : 1;
    }
    return b.priority - a.priority;
  });

  // ─── 5. 推荐：单一路由 → 直接推荐；多路由 → 取最优先 ───
  const recommended = allReachable.length === 1
    ? allReachable[0]
    : allReachable.length > 0
      ? allReachable[0]
      : undefined;

  return {
    reachable: allReachable,
    recommended,
    upcomingEvents,
  };
}

// ─── 辅助：从 triggerConditions 提取 flag 需求 ───
function extractFlagRequirements(expr: string | undefined): string[] {
  if (!expr) return [];
  const matches = expr.matchAll(/flag\((\w+)\)/g);
  return [...matches].map(m => m[1]);
}

// ─── 辅助：从 triggerConditions 提取境界门 ───
function extractRealmGate(expr: string | undefined): number | undefined {
  if (!expr) return undefined;
  const match = expr.match(/realm_gte\((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
}
