import { describe, expect, it } from 'vitest';

import {
  buildV017CombatEventCandidate,
  buildV017OutcomeBackflowView,
  buildV017TraceReviewFromSteps,
  getV017CombatDeepeningRules,
  listV017CombatPreparationViews,
  listV017CounterBoundaryViews,
  listV017SquadTacticViews,
} from './v017-combat-deepening';
import type { BattleOutcomeSummary, BattleResolutionStep } from '../types';

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 170,
    currentChapterId: 'qingmaoshan',
    sceneSessionState: { sceneId: 'v017_combat_test' },
    profile: { realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    inventory: [
      { id: 'moonlight', name: '月光蛊', currentState: 'normal' },
      { id: 'white_jade', name: '白玉蛊', currentState: 'normal' },
      { id: 'scout', name: '侦察蛊', currentState: 'normal' },
    ],
    ...overrides,
  };
}

describe('v0.17.0 combat deepening rules', () => {
  it('keeps MiroFish-derived rules candidate-reviewed and non-persistent', () => {
    const rules = getV017CombatDeepeningRules();

    expect(rules._meta.status).toBe('candidate_review');
    expect(rules._meta.runtimeActivation).toBe('local_validation_only');
    expect(rules._meta.saveFormatImpact).toBe('none');
    expect(rules._meta.miroFishPackageIds).toEqual([
      'v017_low_rank_combat_encounter_pack',
      'v017_killer_move_counter_boundary_pack',
      'v017_squad_formation_tactics_pack',
    ]);
    expect(Object.keys(rules).join(' ')).not.toMatch(/quote/i);
    expect(JSON.stringify(rules)).not.toMatch(/originalText|rawText|原文正文/i);
  });

  it('promotes only safe low-rank combat samples to local validation readiness', () => {
    const views = listV017CombatPreparationViews(store());

    expect(views.filter(item => item.status === 'ready_for_local_validation')).toHaveLength(3);
    expect(views.find(item => item.id === 'v017_combat_flower_wine_cave_risk')?.status).toBe('candidate_only');
    expect(views.every(item => item.blockedOutcomes.includes('reward_grant'))).toBe(true);
    expect(views.every(item => item.blockedOutcomes.includes('npc_death'))).toBe(true);
    expect(views.every(item => item.sourcePointerCount > 0)).toBe(true);
  });

  it('builds valid combat candidates without beast specs, rewards, locations, or save changes', () => {
    const result = buildV017CombatEventCandidate('v017_combat_clan_school_moonblade_drill', store());

    expect(result.saveFormatImpact).toBe('none');
    expect(result.validation?.valid).toBe(true);
    expect(result.candidate?.source).toBe('engine');
    expect(result.candidate?.scale).toBe('battlefield_5x3');
    expect(result.candidate?.gridPresetId).toBe('skirmish_5x3');
    expect(result.candidate?.dropPolicyId).toBe('local_engine_only');
    expect(result.candidate?.enemySpecIds).toBeUndefined();
    expect(result.candidate?.summary).toContain('禁止直接发放奖励');
    expect(result.validation?.spec?.availableGu).toContain('月光蛊');
  });

  it('keeps cave/inheritance pressure candidate-only and blocks high-rank implications', () => {
    const result = buildV017CombatEventCandidate('v017_combat_flower_wine_cave_risk', store());
    const counters = listV017CounterBoundaryViews();
    const liquor = counters.find(item => item.id === 'v017_counter_liquor_worm_support_boundary');

    expect(result.candidate).toBeNull();
    expect(result.warnings.join('；')).toContain('候选');
    expect(liquor?.blockedImplications).toContain('normal_attack_button');
    expect(liquor?.blockedImplications).toContain('inheritance_unlock');
  });

  it('exposes squad and formation hints as read-only effects', () => {
    const tactics = listV017SquadTacticViews();
    const wolfTide = tactics.find(item => item.id === 'v017_squad_wolf_tide_defense_line');

    expect(wolfTide?.allowedEffects).toContain('formation_hint');
    expect(wolfTide?.blockedEffects).toContain('formal_wolf_tide_resolution');
    expect(tactics.every(item => item.blockedEffects.includes('npc_death') || item.blockedEffects.includes('location_unlock') || item.blockedEffects.includes('formal_wolf_tide_resolution'))).toBe(true);
  });

  it('formats battle trace and outcome backflow without adding authority', () => {
    const step: BattleResolutionStep = {
      id: 'step_1',
      round: 1,
      kind: 'gu_use',
      sourceName: '月光蛊',
      message: '月刃沿直线切过空地，被遮挡削弱。',
      visual: { motif: 'moonlight', primaryTint: '#B9D7FF', motion: 'slash' },
      tags: ['v017', 'counter'],
    };
    const trace = buildV017TraceReviewFromSteps([step]);
    expect(trace.lines[0]).toContain('月刃');
    expect(trace.boundary).toContain('不补写正式奖励');

    const outcome: BattleOutcomeSummary = {
      id: 'battle_outcome_v017_test',
      encounterId: 'v017_test',
      scale: 'battlefield_5x3',
      result: 'retreat',
      summary: '族学月刃练习：撤退。玩家保住真元余裕。',
      winner: 'escaped',
      roundsTaken: 2,
      hpDelta: -4,
      essenceDelta: -8,
      consumedGu: [],
      daoMarkDelta: {},
      createdTurn: 170,
      steps: ['月刃被遮挡削弱。'],
    };
    const backflow = buildV017OutcomeBackflowView(outcome);
    expect(backflow.lines.join(' ')).toContain('retreat');
    expect(backflow.boundary).toContain('不得追加奖励');
    expect(backflow.saveFormatImpact).toBe('none');
  });
});
