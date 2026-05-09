/**
 * 随机遭遇系统单元测试 — P2-9
 */

import { describe, it, expect } from 'vitest';
import {
  checkAndTriggerEncounter,
  buildInjectionContext,
  shouldInjectEncounter,
  updateCooldownTimers,
} from '../engine/encounter-injector';
import type { EncounterTemplate } from '../types/encounter';

// ─── 测试用模板工厂 ───
function makeTemplate(overrides: Partial<EncounterTemplate> = {}): EncounterTemplate {
  const defaultConditions = {
    minRealm: 1, maxRealm: 5, region: '南疆', locationKeyword: ['any' as string], minTurn: 1,
    cooldown: { sameType: 3, sameChapter: 2 } as { sameType: number; sameChapter: number },
  };
  return {
    id: overrides.id || 'test_danger_001',
    type: overrides.type || 'danger',
    category: overrides.category || 'combat',
    title: overrides.title || 'Test Encounter',
    description: overrides.description || 'A test encounter',
    narrativeTemplate: overrides.narrativeTemplate || 'You encounter {location}.',
    triggerConditions: { ...defaultConditions, ...(overrides.triggerConditions as any) },
    choices: overrides.choices || [
      { id: 'fight', text: 'Fight', risk: 'medium', outcome: 'Combat' },
      { id: 'flee', text: 'Flee', risk: 'low', outcome: 'Escape' },
    ],
    rewards: overrides.rewards || { currency: [1, 10] },
  } as EncounterTemplate;
}

// ─── 固定种子的伪随机（测试可重复性） ───
function fixedSeeder(sequence: number[]) {
  let i = 0;
  return () => sequence[i++ % sequence.length];
}

describe('encounter-injector', () => {
  describe('shouldInjectEncounter', () => {
    it('should inject when narrative is very short (<100 chars)', () => {
      expect(shouldInjectEncounter(50, 2)).toBe(true);
    });

    it('should not inject when narrative is rich and recent', () => {
      expect(shouldInjectEncounter(400, 1)).toBe(false);
    });

    it('should inject after 5+ turns without encounter', () => {
      expect(shouldInjectEncounter(200, 5)).toBe(true);
    });

    it('should inject after 3+ turns with normal narrative', () => {
      expect(shouldInjectEncounter(200, 3)).toBe(true);
    });
  });

  describe('checkAndTriggerEncounter - 境界过滤', () => {
    const templates = [
      makeTemplate({ id: 'low_only', triggerConditions: { minRealm: 1, maxRealm: 2, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 2, sameChapter: 1 } } }),
      makeTemplate({ id: 'mid_only', triggerConditions: { minRealm: 3, maxRealm: 4, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 2, sameChapter: 1 } } }),
    ];

    it('should filter out templates outside realm range', () => {
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 1/*realm*/, 5/*turn*/,
        {}, 100, [], {}, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.01]), // template selection→first, trigger→yes
      );
      expect(result.triggered).toBe(true);
      expect(result.template?.id).toBe('low_only');
    });

    it('should return no match when no templates match realm', () => {
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 6/*realm too high*/, 5,
        {}, 100, [], {}, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.01]),
      );
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('no_realm_match');
    });
  });

  describe('checkAndTriggerEncounter - 冷却机制', () => {
    const templates = [
      makeTemplate({ id: 'cd_test', triggerConditions: { minRealm: 1, maxRealm: 5, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 3, sameChapter: 2 } } }),
    ];

    it('should block encounter if same type recently triggered', () => {
      const cooldowns = { 'type-danger': 4, 'ch-test_chapter': 4 }; // type trigger at turn 4
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 5/*current turn*/, // diff=1 < sameType(3)
        {}, 100, ['danger'], cooldowns, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.01]),
      );
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('all_on_cooldown');
    });

    it('should allow encounter after cooldown expires', () => {
      const cooldowns = { 'type-danger': 1, 'ch-test_chapter': 1 };
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 6/*current turn*/, // diff=5 > sameType(3)
        {}, 100, [], cooldowns, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.01]),
      );
      expect(result.triggered).toBe(true);
    });
  });

  describe('checkAndTriggerEncounter - 概率判定', () => {
    const templates = [
      makeTemplate({ id: 'prob_test', triggerConditions: { minRealm: 1, maxRealm: 5, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 5, sameChapter: 3 } } }),
    ];

    it('should fail when random roll exceeds threshold', () => {
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 10,
        {}, 100, [], {}, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.99]), // select first template, trigger roll = 0.99 > 0.45
      );
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('probability_check_failed');
    });

    it('should apply encounter risk modifiers before triggering', () => {
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 10,
        {}, 100, [], {}, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.40]), // base 0.45 would pass, Mojia 0.3825 should fail
        { store: { flags: { _faction: 'mojia_oasis' }, selectedTalents: [] }, operation: 'encounter' },
      );
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('probability_check_failed');
    });
  });

  describe('checkAndTriggerEncounter - 元石/蛊虫要求', () => {
    it('should filter out templates requiring gu when player has none', () => {
      const templates = [
        makeTemplate({ id: 'need_gu', triggerConditions: { minRealm: 1, maxRealm: 5, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 1, sameChapter: 1 }, requiresGu: true } }),
      ];
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 5,
        {}, 100, [], {}, '南疆', '青茅山', false/*no gu*/,
        fixedSeeder([0.01, 0.01]),
      );
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('all_on_cooldown');
    });

    it('should filter out templates requiring currency when player is poor', () => {
      const templates = [
        makeTemplate({ id: 'need_money', triggerConditions: { minRealm: 1, maxRealm: 5, region: '南疆', locationKeyword: ['any'], minTurn: 1, cooldown: { sameType: 1, sameChapter: 1 }, minCurrency: 50 } }),
      ];
      const result = checkAndTriggerEncounter(
        templates, 'test_chapter', 3, 5,
        {}, 10/*poor*/, [], {}, '南疆', '青茅山', true,
        fixedSeeder([0.01, 0.01]),
      );
      expect(result.triggered).toBe(false);
    });
  });

  describe('buildInjectionContext', () => {
    it('should replace {location} placeholder', () => {
      const template = makeTemplate({ narrativeTemplate: '在{location}发现一只蛊虫。' });
      const ctx = buildInjectionContext(template, '青茅山');
      expect(ctx.narrativeTemplate).toContain('青茅山');
      expect(ctx.narrativeTemplate).not.toContain('{location}');
      expect(ctx.type).toBe('danger');
      expect(ctx.choices).toHaveLength(2);
    });
  });

  describe('updateCooldownTimers', () => {
    it('should update type and chapter timers', () => {
      const template = makeTemplate({ id: 'cd_test', type: 'social' });
      const result = updateCooldownTimers({}, template, 'qingmaoshan', 42);
      expect(result['type-social']).toBe(42);
      expect(result['ch-qingmaoshan']).toBe(42);
    });

    it('should not mutate original timers', () => {
      const original = { 'type-danger': 10 };
      const template = makeTemplate({ id: 'cd_test', type: 'exploration' });
      const result = updateCooldownTimers(original, template, 'test_ch', 50);
      expect(original['type-exploration']).toBeUndefined();
      expect(result['type-exploration']).toBe(50);
    });
  });
});
