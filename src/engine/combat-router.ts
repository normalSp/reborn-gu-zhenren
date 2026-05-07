/**
 * 叙事战斗路由器 — P2-4b + v0.7.0-a 关键词分级增强
 *
 * 双层匹配引擎 + 三级关键词权重：扫描AI叙事文本关键词 + 当前章节上下文.
 * 纯函数：输入文本→输出触发结果，无副作用.
 */
import type { NarrativeCombatTrigger, CombatConstraint, DuelEnemy, DuelMove } from '../types';
import constraintsRaw from '../canon/combat-constraints.json';
import chaptersRaw from '../canon/chapters.json';

const constraints = constraintsRaw as any;
const scenes: any[] = constraints.scenes || [];

/** CR7修复: 从 chapters.json 动态读取全部30章ID，替换硬编码3章 */
const knownChapterIds = (() => {
  const ids = new Set<string>();
  try {
    const chaptersData = chaptersRaw as any;
    const domains = chaptersData.domains || {};
    for (const domainChapters of Object.values(domains) as any[]) {
      if (!Array.isArray(domainChapters)) continue;
      for (const ch of domainChapters) {
        if (ch?.id) ids.add(ch.id);
      }
    }
  } catch { /* fallback to empty set — no combat routing until chapters load */ }
  return ids;
})();

// ═══ v0.7.0-a: 关键词分级体系 ═══
const KEYWORD_TIERS = {
  explicit: {
    keywords: ['决斗', '厮杀', '酣战', '搏杀', '击杀', '斩首', '围攻', '伏击'],
    weight: 1.0,
    minMatchCount: 1,
  },
  implicit: {
    keywords: ['对峙', '剑拔弩张', '杀气', '敌意', '不善', '拦路', '追踪'],
    weight: 0.6,
    minMatchCount: 2,
  },
  environmental: {
    keywords: ['蛊狼', '兽群', '毒雾', '瘴气', '崩塌', '洪流', '雷暴'],
    weight: 0.3,
    minMatchCount: 1,
    requiresChapterContext: true,
  },
} as const;

export interface KeywordTierResult {
  tier: 'explicit' | 'implicit' | 'environmental';
  weight: number;
  matchedKeywords: string[];
}

/** 分析叙事文本中的战斗关键词层级 */
export function analyzeKeywordTiers(narrativeText: string): KeywordTierResult | null {
  if (!narrativeText) return null;

  // 按权重优先级检测：explicit > implicit > environmental
  for (const [tier, config] of Object.entries(KEYWORD_TIERS)) {
    const matched = config.keywords.filter(kw => narrativeText.includes(kw));
    if (matched.length >= config.minMatchCount) {
      return {
        tier: tier as KeywordTierResult['tier'],
        weight: config.weight,
        matchedKeywords: matched,
      };
    }
  }
  return null;
}

/**
 * 检测叙事文本中是否包含战斗触发关键词
 * v0.7.0-a增强：三层匹配 — 关键词层级 + 章节场景关键词 + 章节上下文
 */
export function detectCombat(
  narrativeText: string,
  currentChapterId: string | null,
): NarrativeCombatTrigger | null {
  if (!narrativeText || !currentChapterId) return null;
  if (!knownChapterIds.has(currentChapterId)) return null;

  // v0.7.0-a: 先做关键词分级检测，确定叙事中的战斗烈度
  const tierResult = analyzeKeywordTiers(narrativeText);

  // 筛选：当前章节对应的场景
  const chapterScenes = scenes.filter((s: any) => s.chapterId === currentChapterId);
  if (chapterScenes.length === 0) return null;

  for (const scene of chapterScenes) {
    const keywords: string[] = scene.triggerKeywords || [];
    const sceneMatched = keywords.some((kw: string) => narrativeText.includes(kw));

    // v0.7.0-a: environmental级需额外匹配场景关键词
    if (!sceneMatched) {
      if (tierResult?.tier === 'environmental' && KEYWORD_TIERS.environmental.requiresChapterContext) {
        continue; // environmental级必须同时命中场景关键词
      }
      continue;
    }

    // v0.7.0-a: 按关键词层级修正场景触发概率
    const tierWeight = tierResult?.weight ?? 1.0;
    const adjustedChance = (scene.baseChance ?? 0.5) * tierWeight;

    return buildTrigger(scene, adjustedChance);
  }

  return null;
}

function buildTrigger(scene: any, adjustedChance?: number): NarrativeCombatTrigger {
  const effectiveChance = adjustedChance ?? scene.baseChance ?? 0.5;

  if (scene.combatType === 'duel') {
    const dc = scene._duelConfig || {};
    const moves: DuelMove[] = (dc.enemyMoves || []).map((m: any) => ({
      name: m.name,
      damageMultiplier: m.damageMultiplier,
      pathBonus: m.pathBonus || 0,
      description: m.description,
    }));

    const enemy: DuelEnemy = {
      name: dc.enemyName || scene.name,
      realm: dc.enemyRealm || '二转蛊师',
      realmNum: realmToNum(dc.enemyRealm),
      hp: dc.enemyHp || 80,
      maxHp: dc.enemyHp || 80,
      attack: dc.enemyAttack || 25,
      defense: dc.enemyDefense || 8,
      accuracy: 70,
      evasion: 30,
      path: dc.enemyPath || '力道',
      gu: [],
      moves,
    };

    return { sceneId: scene.sceneId, combatType: 'duel', duelEnemy: enemy };
  }

  // narrative type
  const constraint: CombatConstraint = {
    sceneId: scene.sceneId,
    combatType: 'narrative',
    scale: scene.scale,
    mustHappen: scene.mustHappen,
    mustNotHappen: scene.mustNotHappen,
    keyFactions: scene.keyFactions,
    keyNPCs: scene.keyNPCs,
    strategicChoiceCount: scene.strategicChoiceCount,
    narrativeStyle: scene.narrativeStyle,
    baseChance: effectiveChance,
    recommendedRealm: scene.recommendedRealm,
    statBridge: scene.statBridge,
  };

  return { sceneId: scene.sceneId, combatType: 'narrative', narrativeConstraint: constraint };
}

function realmToNum(realm: string): number {
  const map: Record<string, number> = { '凡人': 0, '一转蛊师': 1, '二转蛊师': 2, '三转蛊师': 3, '四转蛊师': 4, '五转蛊师': 5, '六转蛊仙': 6, '七转蛊仙': 7, '八转蛊仙': 8, '九转蛊仙': 9 };
  return map[realm] ?? 1;
}
