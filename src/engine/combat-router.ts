/**
 * 叙事战斗路由器 — P2-4b
 *
 * 双层匹配引擎：扫描AI叙事文本关键词 + 当前章节上下文.
 * 纯函数：输入文本→输出触发结果，无副作用.
 */
import type { NarrativeCombatTrigger, CombatConstraint, DuelEnemy, DuelMove } from '../types';
import constraintsRaw from '../canon/combat-constraints.json';

const constraints = constraintsRaw as any;
const scenes: any[] = constraints.scenes || [];

/** 已知的章节ID集合 */
const knownChapterIds = new Set<string>(['qingmaoshan', 'shanglu_qiusheng', 'nanjiang_chutan']);

/**
 * 检测叙事文本中是否包含战斗触发关键词
 * 双层匹配：关键词 + 章节上下文
 */
export function detectCombat(
  narrativeText: string,
  currentChapterId: string | null,
): NarrativeCombatTrigger | null {
  if (!narrativeText || !currentChapterId) return null;
  if (!knownChapterIds.has(currentChapterId)) return null;

  // 筛选：当前章节对应的场景
  const chapterScenes = scenes.filter((s: any) => s.chapterId === currentChapterId);
  if (chapterScenes.length === 0) return null;

  for (const scene of chapterScenes) {
    const keywords: string[] = scene.triggerKeywords || [];
    const matched = keywords.some((kw: string) => narrativeText.includes(kw));
    if (!matched) continue;

    return buildTrigger(scene);
  }

  return null;
}

function buildTrigger(scene: any): NarrativeCombatTrigger {
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
    baseChance: scene.baseChance,
    recommendedRealm: scene.recommendedRealm,
    statBridge: scene.statBridge,
  };

  return { sceneId: scene.sceneId, combatType: 'narrative', narrativeConstraint: constraint };
}

function realmToNum(realm: string): number {
  const map: Record<string, number> = { '凡人': 0, '一转蛊师': 1, '二转蛊师': 2, '三转蛊师': 3, '四转蛊师': 4, '五转蛊师': 5 };
  return map[realm] ?? 1;
}
