import { describe, expect, it } from 'vitest';

import {
  buildQingmaoCombatEventCandidate,
  getQingmaoLowRankContentPack,
  listQingmaoCombatTemplateReadiness,
} from './v010-qingmao-combat-pack';

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 18,
    currentChapterId: 'qingmaoshan',
    sceneSessionState: { sceneId: 'qingmao_b2_test' },
    profile: { realm: { grand: 1, sub: '中阶', label: '一转中阶' } },
    inventory: [
      { id: 'moonlight', name: '月光蛊', currentState: 'normal' },
      { id: 'white_jade', name: '白玉蛊', currentState: 'normal' },
      { id: 'scout', name: '侦察蛊', currentState: 'normal' },
    ],
    ...overrides,
  };
}

describe('v0.10.0-b2 Qingmao combat pack readiness', () => {
  it('keeps the content pack candidate-only and non-persistent', () => {
    const pack = getQingmaoLowRankContentPack();
    expect(pack._meta.status).toBe('candidate_review');
    expect(pack._meta.runtimeActivation).toBe('not_active');
    expect(pack._meta.saveFormatImpact).toBe('none');
  });

  it('promotes only the first 2-3 templates to local validation readiness', () => {
    const readiness = listQingmaoCombatTemplateReadiness();
    expect(readiness.filter(item => item.status === 'ready_for_local_validation')).toHaveLength(3);
    expect(readiness.filter(item => item.status === 'candidate_only')).toHaveLength(1);
    expect(readiness.every(item => item.blockers.length === 0)).toBe(true);
  });

  it('builds a valid 5x3 clan-school combat candidate without reward activation', () => {
    const result = buildQingmaoCombatEventCandidate('qingmao_encounter_clan_school_spar', store());
    expect(result.saveFormatImpact).toBe('none');
    expect(result.candidate?.scale).toBe('battlefield_5x3');
    expect(result.candidate?.source).toBe('engine');
    expect(result.candidate?.engineValidation).toBe('pending');
    expect(result.candidate?.dropPolicyId).toBe('local_engine_only');
    expect(result.validation?.valid).toBe(true);
    expect(result.validation?.spec?.availableGu).toContain('月光蛊');
    expect(result.validation?.spec?.gridPresetId).toBe('skirmish_5x3');
  });

  it('downgrades unknown or unowned combat context without creating persistence', () => {
    const missing = buildQingmaoCombatEventCandidate('missing_template', store());
    expect(missing.candidate).toBeNull();
    expect(missing.blockers[0]).toContain('未知青茅战斗模板');

    const noGu = buildQingmaoCombatEventCandidate('qingmao_encounter_front_mountain_patrol', store({ inventory: [] }));
    expect(noGu.candidate?.entryValidation?.valid).toBe(true);
    expect(noGu.candidate?.validationIssues?.join('；')).toContain('玩家没有可登记凡战蛊虫');
    expect(noGu.saveFormatImpact).toBe('none');
  });
});
