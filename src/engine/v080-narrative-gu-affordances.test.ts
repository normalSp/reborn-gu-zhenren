import { describe, expect, it } from 'vitest';
import type { NarrativeJSON } from '../types';
import {
  annotateNarrativeGuChoices,
  buildNarrativeGuAffordancePromptInject,
  buildSelectedChoiceNarrativeGuContext,
  collectNarrativeGuAffordances,
  validateNarrativeGuUseSuggestion,
} from './v080-narrative-gu-affordances';

function store(overrides: Record<string, any> = {}) {
  return {
    inventory: [],
    apertureInventory: { gu: [] },
    killMoves: [],
    flags: {},
    currentNarrative: null,
    ...overrides,
  } as any;
}

function narrative(choices: any[]): NarrativeJSON {
  return {
    narrative: {
      text: '山路被藤索与暗门封住，暗处有巡夜弟子和尸毒痕迹。蛊虫手段可以成为候选解法，但正式收益、胜负和资源变化不能由叙事模型直接决定。',
      choices,
    },
    state_update: {},
  };
}

describe('v0.8.0-a3 narrative Gu affordances', () => {
  it('builds prompt affordances from owned Gu instead of generic inventory text', () => {
    const s = store({
      inventory: [
        { id: 'g1', name: '月光蛊', tier: 1, path: '光道' },
        { id: 'g2', name: '侦察蛊', tier: 2, path: '智道' },
        { id: 'g3', name: '酒虫', tier: 1, path: '食道' },
      ],
    });

    const affordances = collectNarrativeGuAffordances(s);
    expect(affordances.some(item => item.sourceName === '月光蛊' && item.utilityId === 'cut_rope' && item.category === 'obstacle_breaking')).toBe(true);
    expect(affordances.some(item => item.sourceName === '侦察蛊' && item.utilityId === 'spot_ambush' && item.category === 'reconnaissance')).toBe(true);
    expect(affordances.some(item => item.sourceName === '酒虫' && item.utilityId === 'refine_primeval_essence' && item.category === 'refinement')).toBe(true);

    const prompt = buildNarrativeGuAffordancePromptInject(s);
    expect(prompt).toContain('choices[].gu_affordance');
    expect(prompt).toContain('月光蛊/cut_rope');
    expect(prompt).toContain('侦察蛊/spot_ambush');
  });

  it('covers required narrative utility categories with concrete Gu examples', () => {
    const s = store({
      inventory: [
        { id: 'g1', name: '侦察蛊' },
        { id: 'g2', name: '追踪蛊' },
        { id: 'g3', name: '治愈蛊' },
        { id: 'g4', name: '净水蛊' },
        { id: 'g5', name: '月光蛊' },
        { id: 'g6', name: '月影蛊' },
        { id: 'g7', name: '熊力蛊' },
        { id: 'g8', name: '血颅蛊' },
      ],
    });
    const categories = new Set(collectNarrativeGuAffordances(s).map(item => item.category));
    expect(categories.has('reconnaissance')).toBe(true);
    expect(categories.has('tracking')).toBe(true);
    expect(categories.has('healing')).toBe(true);
    expect(categories.has('detox')).toBe(true);
    expect(categories.has('obstacle_breaking')).toBe(true);
    expect(categories.has('concealment')).toBe(true);
    expect(categories.has('intimidation')).toBe(true);
    expect(categories.has('forbidden_ritual')).toBe(true);
  });

  it('annotates available choices and downgrades missing Gu choices to clues', () => {
    const s = store({
      inventory: [{ id: 'g1', name: '月光蛊' }],
    });
    const result = annotateNarrativeGuChoices(narrative([
      {
        id: 'c1',
        text: '使用月光蛊切断绳索',
        risk: 'medium',
        risk_note: '会留下月芒痕迹',
        gu_affordance: { sourceType: 'gu', sourceName: '月光蛊', utilityId: 'cut_rope', category: 'obstacle_breaking' },
      },
      {
        id: 'c2',
        text: '使用追踪蛊追索脚印',
        risk: 'low',
        risk_note: '需要时间',
        gu_affordance: { sourceType: 'gu', sourceName: '追踪蛊', utilityId: 'follow_fugitive', category: 'tracking' },
      },
    ]), s);

    const [available, missing] = result.narrative.narrative.choices;
    expect(available.guAffordances?.[0].status).toBe('available');
    expect(available.guAffordances?.[0].categoryLabel).toBe('破障');
    expect(missing.text).toContain('寻找');
    expect(missing.guAffordances?.[0].status).toBe('missing');
    expect(result.issues.some(issue => issue.kind === 'missing_gu_affordance')).toBe(true);
  });

  it('blocks unknown Gu, mismatched utilities, and ordinary combat effects from formal execution', () => {
    const s = store({
      inventory: [{ id: 'g1', name: '月光蛊' }],
    });

    expect(validateNarrativeGuUseSuggestion({
      guName: '未登记蛊',
      utilityId: 'spot_ambush',
      category: 'reconnaissance',
      sceneValidated: true,
    }, s).allowed).toBe(false);

    expect(validateNarrativeGuUseSuggestion({
      guName: '月光蛊',
      utilityId: 'spot_ambush',
      category: 'reconnaissance',
      sceneValidated: true,
    }, s).allowed).toBe(false);

    const ordinary = validateNarrativeGuUseSuggestion({
      guName: '月光蛊',
      utilityId: 'cut_rope',
      category: 'obstacle_breaking',
      sceneValidated: true,
    }, s);
    expect(ordinary.allowed).toBe(true);
    expect(ordinary.executable).toBe(false);
    expect(ordinary.reason).toContain('战斗引擎');
  });

  it('allows registered forbidden Gu only after scene validation and keeps the next choice context explicit', () => {
    const s = store({
      inventory: [{ id: 'g1', name: '妇人心蛊' }],
    });

    const unvalidated = validateNarrativeGuUseSuggestion({
      guName: '妇人心蛊',
      utilityId: 'forbidden_poison_refinement',
      category: 'detox',
    }, s);
    expect(unvalidated.allowed).toBe(true);
    expect(unvalidated.executable).toBe(false);

    const validated = validateNarrativeGuUseSuggestion({
      guName: '妇人心蛊',
      utilityId: 'forbidden_poison_refinement',
      category: 'detox',
      sceneValidated: true,
      sceneTags: ['毒道', '尸体'],
    }, s);
    expect(validated.allowed).toBe(true);
    expect(validated.executable).toBe(true);

    const annotated = annotateNarrativeGuChoices(narrative([{
      id: 'c1',
      text: '压下妇人心蛊的毒意，只记录尸毒门槛',
      risk: 'high',
      risk_note: '禁忌蛊风险极高',
      gu_affordance: { sourceType: 'gu', sourceName: '妇人心蛊', utilityId: 'forbidden_poison_refinement', category: 'detox' },
    }]), s).narrative;
    const contextStore = store({ ...s, currentNarrative: annotated });
    const choiceContext = buildSelectedChoiceNarrativeGuContext(contextStore, 'c1');
    expect(choiceContext).toContain('玩家本轮选择详情');
    expect(choiceContext).toContain('妇人心蛊');
    expect(choiceContext).toContain('forbidden');
  });
});
