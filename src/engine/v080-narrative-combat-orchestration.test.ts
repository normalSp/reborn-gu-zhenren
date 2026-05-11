import { describe, expect, it } from 'vitest';
import {
  buildCombatOutcomeLedgerEntry,
  buildBattleOutcomeSummary,
  evaluateCombatEncounterEntry,
  formatCombatEncounterForPrompt,
  normalizeCombatEncounterScale,
} from './v080-narrative-combat-orchestration';

function store(overrides: Record<string, unknown> = {}) {
  return {
    turn: 40,
    profile: { realm: { grand: 3, label: '三转中阶' } },
    inventory: [{ name: '月光蛊' }, { name: '石皮蛊' }],
    apertureInventory: { gu: [] },
    killMoves: [],
    sceneSessionState: { sceneId: 'qingmao_forest_night' },
    ...overrides,
  };
}

describe('v0.8.0-c2.3 narrative combat orchestration', () => {
  it('normalizes combat scales without using AI as settlement authority', () => {
    expect(normalizeCombatEncounterScale('1v1')).toBe('duel');
    expect(normalizeCombatEncounterScale('battle')).toBe('group_5x3');
    expect(normalizeCombatEncounterScale('ambush_7x5')).toBe('group_7x5');
    expect(normalizeCombatEncounterScale('skirmish')).toBe('battlefield_5x3');
  });

  it('validates legal candidates and exposes owned combat Gu', () => {
    const validation = evaluateCombatEncounterEntry({
      id: 'fight_1',
      type: 'ambush',
      title: '月下伏击',
      summary: '山林间有敌人借遮蔽逼近。',
      risk: 'medium',
      scale: 'group_5x3',
    }, store());

    expect(validation.valid).toBe(true);
    expect(validation.spec?.availableGu).toContain('月光蛊');
    expect(validation.spec?.scale).toBe('group_5x3');
  });

  it('lets local route policy decide AI combat candidates and downgrade unknown scale safely', () => {
    const hunt = evaluateCombatEncounterEntry({
      id: 'fight_hunt',
      type: 'environment',
      title: '荒兽踪迹',
      summary: '山谷里有荒兽与兽群残痕。',
      risk: 'high',
    }, store());
    expect(hunt.valid).toBe(true);
    expect(hunt.spec?.scale).toBe('group_7x5');

    const unknownScale = evaluateCombatEncounterEntry({
      id: 'fight_unknown_scale',
      type: 'pursuit',
      title: '追击',
      summary: '敌人从林间逼近。',
      risk: 'medium',
      scale: 'weird_scale' as any,
    }, store());
    expect(unknownScale.valid).toBe(true);
    expect(unknownScale.spec?.scale).toBe('battlefield_5x3');
    expect(unknownScale.warnings.join('')).toContain('未知战斗规模 weird_scale');
  });

  it('downgrades invalid or over-realm candidates to hints', () => {
    const validation = evaluateCombatEncounterEntry({
      id: 'fight_blocked',
      type: 'pursuit',
      title: '高阶追杀',
      summary: '七转强者降临。',
      risk: 'high',
      requiredRealmGrand: 7,
    }, store({ profile: { realm: { grand: 3, label: '三转中阶' } } }));

    expect(validation.valid).toBe(false);
    expect(validation.downgradedTo).toBe('danger_hint');
    expect(validation.blockers.join('')).toContain('当前境界不足');
  });

  it('builds battle outcome summary and scene ledger entry for next narrative prompt', () => {
    const validation = evaluateCombatEncounterEntry({
      id: 'fight_2',
      type: 'ambush',
      title: '林间截杀',
      summary: '敌人试图逼出你的底牌。',
      risk: 'low',
      scale: 'duel',
    }, store());
    const spec = validation.spec!;
    const outcome = buildBattleOutcomeSummary({
      encounter: spec,
      result: 'retreat',
      turn: 41,
      playbackSteps: [{ kind: 'settlement', message: '撤到山石之后，敌人没有追来。' }],
    });
    const ledger = buildCombatOutcomeLedgerEntry(outcome, 'qingmao_forest_night');

    expect(outcome.result).toBe('retreat');
    expect(ledger.actionType).toBe('combat');
    expect(String(ledger.systemResult.result)).toBe('retreat');
    expect(formatCombatEncounterForPrompt({ status: 'resolved', spec, validation, startedTurn: 40, outcomeSummary: outcome })).toContain('不得改写胜负');
  });
});
