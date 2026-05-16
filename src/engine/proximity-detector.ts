/**
 * 名场面距离检测器 — P2核心模块（P2-2a修复版）
 *
 * 判断玩家与全局名场面/事件的"距离"——基于rippleDomains逐域层级定义。
 * 纯函数设计：接收数据→计算距离→排序输出。
 * 用于：涟漪系统计算四层涟漪（L0完整参与/L1简化参与/L2涟漪叙事/L3长尾flag）
 *
 * P2-2a 修复内容：
 * - GlobalEventEntry消费rippleDomains（替代仅affectedDomains）
 * - 距离计算基于rippleDomains[当前域].level匹配
 * - L1/L2事件提取manifestation叙事文本
 * - 消费rippleStrength调整距离灵敏度（high=距离减半）
 * - 从chaptersData动态读取全部8个事件
 */

import type { ChapterRecord, ProximityEvent } from '../types';

/** rippleDomains中单个域的涟漪定义 */
interface RippleDomainEntry {
  level: 'L0' | 'L1' | 'L2' | 'L3';
  chapter?: string;
  manifestation: string;
  sceneConstraint?: {
    mustHappen: string[];
    mustNotHappen: string[];
    narrativeTheme: string;
  };
}

interface GlobalEventEntry {
  eventId: string;
  name: string;
  description: string;
  triggerChapter: string;
  rippleStrength: string;
  volume?: number;
  affectedDomains?: string[];
  rippleDomains?: Record<string, RippleDomainEntry>;
  l3GlobalFlags?: string[];
}

interface DetectParams {
  globalEvents: GlobalEventEntry[];
  currentDomain: string;
  currentChapterId: string | null;
  flags: Record<string, any>;
  completedIds: Set<string>;
  chapterHistory: ChapterRecord[];
}

/**
 * 检测与所有全局事件的距离
 *
 * 距离规则（P2-2a修复版）：
 * - 0：事件已完成或正处于触发章节中 — L0
 * - 15：high强度事件在相邻域（rippleStrength=high 且 rippleDomains[域].level=L1）— L1
 * - 30：medium强度事件在相邻域，或high事件在非相邻L1域 — L1
 * - 30：事件在远隔域且rippleDomains标记为L2（high强度降至30）— L2
 * - 60：事件在远隔域且rippleDomains标记为L2（medium保持60）— L2
 * - 100：事件在当前域无涟漪定义或L3长尾 — L3
 */
export function detectNearEvents(params: DetectParams): ProximityEvent[] {
  const { globalEvents, currentDomain, currentChapterId, completedIds } = params;

  const results: ProximityEvent[] = [];

  for (const event of globalEvents) {
    const rd = event.rippleDomains || {};
    const domainEntry = rd[currentDomain];
    const rippleLevel = domainEntry?.level || 'L3';

    let distance: number;
    let layer: ProximityEvent['layer'];
    let manifestation: string | undefined;

    // 规则1: 事件已完成 → L0
    if (completedIds.has(event.triggerChapter)) {
      distance = 0;
      layer = 'L0';
      manifestation = domainEntry?.manifestation;
    }
    // 规则2: 当前正处于事件触发章节 → L0
    else if (event.triggerChapter === currentChapterId) {
      distance = 0;
      layer = 'L0';
      manifestation = domainEntry?.manifestation;
    }
    // 规则3+: 基于rippleDomains的层级匹配
    else {
      switch (rippleLevel) {
        case 'L0':
          // 当前域是L0源发域但未在触发章节（可能在事件发生之前）
          distance = 15;
          layer = 'L1';
          manifestation = domainEntry?.manifestation;
          break;
        case 'L1':
          // L1相邻域 — 简化参与
          // high强度事件距离减半（更灵敏，玩家更早感知）
          distance = event.rippleStrength === 'high' ? 15 : 30;
          layer = 'L1';
          manifestation = domainEntry?.manifestation;
          break;
        case 'L2':
          // L2远隔域 — 涟漪叙事
          distance = event.rippleStrength === 'high' ? 30 : 60;
          layer = 'L2';
          manifestation = domainEntry?.manifestation;
          break;
        default:
          // L3全域网 — 长尾flag影响
          distance = 100;
          layer = 'L3';
          manifestation = domainEntry?.manifestation;
          break;
      }
    }

    results.push({
      eventId: event.eventId,
      name: event.name,
      domain: event.affectedDomains?.[0] || '未知',
      distance,
      layer,
      manifestation,
    });
  }

  // 按距离升序排序
  results.sort((a, b) => a.distance - b.distance);

  return results;
}

// ─── P2-2b: 域内事件检测 ───
interface DomainEventEntry {
  eventId: string;
  name: string;
  sourceDomain: string;
  triggerChapter: string;
  rippleStrength: 'low' | 'medium' | 'high';
  crossDomainMentions: Record<string, string>;
}

interface DomainDetectParams {
  domainEvents: DomainEventEntry[];
  currentDomain: string;
  currentChapterId: string | null;
  completedIds: Set<string>;
}

export function detectDomainEvents(params: DomainDetectParams): ProximityEvent[] {
  const { domainEvents, currentDomain, currentChapterId, completedIds } = params;

  const results: ProximityEvent[] = [];

  for (const event of domainEvents) {
    const isSourceDomain = currentDomain === event.sourceDomain;
    const isTriggerChapter = event.triggerChapter === currentChapterId;
    const isCompleted = completedIds.has(event.triggerChapter);

    // 仅在事件已完成或正处于触发章节时产生涟漪
    if (!isCompleted && !isTriggerChapter) continue;

    let distance: number;
    let layer: ProximityEvent['layer'];
    let manifestation: string | undefined;

    if (isSourceDomain) {
      // 源发域：L0完整参与
      distance = 0;
      layer = 'L0';
    } else {
      // 其他域：L2跨域提及
      distance = 60;
      layer = 'L2';
      manifestation = event.crossDomainMentions[currentDomain];
    }

    results.push({
      eventId: event.eventId,
      name: event.name,
      domain: event.sourceDomain,
      distance,
      layer,
      manifestation,
    });
  }

  results.sort((a, b) => a.distance - b.distance);

  return results;
}
