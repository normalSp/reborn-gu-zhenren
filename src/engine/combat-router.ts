/**
 * 叙事战斗路由器 — P2-4b + v0.7.0-a 关键词分级增强
 *
 * 双层匹配引擎 + 三级关键词权重：扫描AI叙事文本关键词 + 当前章节上下文.
 * 纯函数：输入文本→输出触发结果，无副作用.
 */
import type { CombatEventCandidate, NarrativeCombatTrigger, CombatConstraint, DuelEnemy, DuelMove } from '../types';
import constraintsRaw from '../canon/combat-constraints.json';
import chaptersRaw from '../canon/chapters.json';
import { hashNarrativeForCombat } from './combat-offer-lock';

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
      daoMarks: 0,
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

function idPart(value: unknown): string {
  const normalized = String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
  return normalized || 'unknown';
}

function textExcerpt(text: string, maxLength = 180): string {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

function riskFromChance(baseChance?: number): 'low' | 'medium' | 'high' {
  if (typeof baseChance !== 'number') return 'medium';
  if (baseChance <= 0.35) return 'high';
  if (baseChance >= 0.65) return 'low';
  return 'medium';
}

function riskFromEnemy(enemy: DuelEnemy): 'low' | 'medium' | 'high' {
  if ((enemy.realmNum || 1) >= 4 || enemy.hp >= 240) return 'high';
  if ((enemy.realmNum || 1) >= 2 || enemy.hp >= 140) return 'medium';
  return 'low';
}

function inferCandidateType(text: string): CombatEventCandidate['type'] {
  if (/伏击|拦路|截杀|埋伏|偷袭/.test(text)) return 'ambush';
  if (/第三方|旁观|搅局|介入/.test(text)) return 'third_party';
  if (/增援|援兵|支援/.test(text)) return 'reinforcement';
  if (/撤退|逃|脱身/.test(text)) return 'escape_window';
  if (/谈判|交涉|勒索/.test(text)) return 'negotiation';
  if (/追击|追杀|逼近|敌意/.test(text)) return 'pursuit';
  return 'environment';
}

export function buildCombatEventCandidateFromTrigger(
  trigger: NarrativeCombatTrigger,
  narrativeText: string,
  chapterId?: string | null,
  turn = 1,
): CombatEventCandidate | null {
  if (!trigger) return null;
  const sceneId = trigger.sceneId || chapterId || 'narrative_scene';
  const narrativeHash = hashNarrativeForCombat(String(narrativeText || '').slice(0, 1200));
  const id = `auto_combat_${idPart(chapterId)}_${idPart(sceneId)}_${narrativeHash}`;

  if (trigger.combatType === 'duel' && trigger.duelEnemy) {
    const enemy = trigger.duelEnemy;
    return {
      id,
      type: inferCandidateType(`${enemy.name} ${narrativeText}`),
      title: `${enemy.name}逼战`,
      summary: `${enemy.name}（${enemy.realm}）被叙事关键词识别为战斗威胁；正式入场、胜负、伤害与掉落必须由本地 battlefield 引擎结算。${textExcerpt(narrativeText)}`,
      risk: riskFromEnemy(enemy),
      source: 'engine',
      scale: '1v1',
      enemyHint: `${enemy.name}（${enemy.realm}，${enemy.path}）`,
      createdTurn: turn,
    };
  }

  if (trigger.combatType === 'narrative' && trigger.narrativeConstraint) {
    const constraint = trigger.narrativeConstraint;
    const mustHappen = constraint.mustHappen?.slice(0, 2).join('；') || '本地战斗候选已建立。';
    const mustNotHappen = constraint.mustNotHappen?.slice(0, 2).join('；') || '不得由 AI 直接结算胜负或奖励。';
    return {
      id,
      type: inferCandidateType(`${constraint.scale} ${constraint.narrativeStyle} ${constraint.mustHappen?.join(' ') || ''} ${narrativeText}`),
      title: constraint.sceneId || '剧情战斗候选',
      summary: `叙事触发战斗约束：${mustHappen} 禁止：${mustNotHappen} 正式入场、胜负、伤害与掉落必须由本地 battlefield 引擎结算。`,
      risk: riskFromChance(constraint.baseChance),
      source: 'engine',
      scale: constraint.scale,
      enemyHint: (constraint.keyNPCs?.[0] || constraint.keyFactions?.[0] || '剧情敌情'),
      createdTurn: turn,
    };
  }

  return null;
}
