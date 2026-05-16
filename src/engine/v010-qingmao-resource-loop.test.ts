import { describe, expect, it } from 'vitest';

import {
  buildQingmaoResourceLoopEntries,
  formatQingmaoResourceLoopContextForPrompt,
  getQingmaoResourceLoopSpec,
  resolveQingmaoResourceLoopAction,
} from './v010-qingmao-resource-loop';

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 21,
    currentChapterId: 'qingmaoshan',
    currentDomain: '南疆',
    materialBag: {},
    sceneSessionState: {
      sceneId: 'qingmao_b3_resource_loop_test',
      locationId: 'qingmaoshan_clan_school',
      actionBudget: { remainingAp: 2, maxAp: 3 },
      localActionLedger: [],
    },
    gameTime: { ap: 2, max_ap: 3, period: 'morning', day: 5, month: 2, year: 1, season: 'spring' },
    ...overrides,
  };
}

describe('v0.10.0-b3 Qingmao resource loop', () => {
  it('keeps the first cut runtime-active without save migration', () => {
    const spec = getQingmaoResourceLoopSpec();
    expect(spec._meta.status).toBe('runtime_active');
    expect(spec._meta.saveFormatImpact).toBe('none');
    expect(spec._meta.rewardBoundary).toContain('不掉蛊虫');
    expect(spec.actions).toHaveLength(3);
  });

  it('lists Moonlight and Liquor Worm material entries while keeping White Jade as gap-only', () => {
    const entries = buildQingmaoResourceLoopEntries({ store: store() });
    const moonlight = entries.find(entry => entry.action.id === 'moonlight_grass_gathering');
    const liquor = entries.find(entry => entry.action.id === 'liquor_worm_wine_errand');
    const whiteJade = entries.find(entry => entry.action.id === 'white_jade_gap_review');

    expect(moonlight?.status).toBe('available');
    expect(moonlight?.rewardPreview).toEqual([{ materialName: '月华草', quantity: 1, usage: 'feeding' }]);
    expect(moonlight?.fragmentRequirements.some(line => line.materialName === '月华草')).toBe(true);
    expect(liquor?.status).toBe('available');
    expect(liquor?.rewardPreview[0]?.materialName).toBe('美酒');
    expect(whiteJade?.status).toBe('gap_only');
    expect(whiteJade?.canResolve).toBe(false);
    expect(whiteJade?.gapRequirements.some(line => line.materialName === '碎玉片' && line.sourceStatus === 'not_approved')).toBe(true);
  });

  it('resolves Moonlight grass through local world-action ledger and no new save field', () => {
    const result = resolveQingmaoResourceLoopAction('moonlight_grass_gathering', {
      store: store(),
    });

    expect(result.success).toBe(true);
    expect(result.rewardMaterials).toEqual([{ materialName: '月华草', quantity: 1, usage: 'feeding' }]);
    expect(result.worldActionCandidate?.domain).toBe('field_action');
    expect(result.worldActionLedgerEntry?.actionType).toBe('resource');
    expect(result.worldActionLedgerEntry?.cost).toBe(1);
    expect(result.worldActionResolution?.rewardPolicy).toBe('local_engine_only');
    expect(result.worldActionResolution?.localFacts.join('\n')).toContain('不新增存档字段');
    expect(result.narrativeReturnContext?.promptSummary).toContain('DeepSeek');
    expect(result.saveFormatImpact).toBe('none');
  });

  it('blocks repeat material farming in the same scene', () => {
    const entries = buildQingmaoResourceLoopEntries({
      store: store({
        sceneSessionState: {
          sceneId: 'same_scene',
          actionBudget: { remainingAp: 2, maxAp: 3 },
          localActionLedger: [{
            id: 'scene_action_21_1',
            turn: 21,
            sceneId: 'same_scene',
            actionType: 'resource',
            source: 'qingmao_resource_loop:moonlight_grass_gathering',
            cost: 1,
            summary: '已巡采月华草',
            systemResult: {},
            risks: [],
          }],
        },
      }),
    });
    const moonlight = entries.find(entry => entry.action.id === 'moonlight_grass_gathering');

    expect(moonlight?.status).toBe('scene_used');
    expect(moonlight?.canResolve).toBe(false);
    expect(moonlight?.blockers.join('\n')).toContain('同一场景');
  });

  it('keeps rewards capped and gap-only entries non-producing', () => {
    const entries = buildQingmaoResourceLoopEntries({ store: store() });

    for (const entry of entries) {
      for (const reward of entry.rewardPreview) {
        expect(reward.quantity).toBeGreaterThanOrEqual(1);
        expect(reward.quantity).toBeLessThanOrEqual(2);
      }
    }

    const whiteJade = resolveQingmaoResourceLoopAction('white_jade_gap_review', { store: store() });
    expect(whiteJade.success).toBe(false);
    expect(whiteJade.rewardMaterials).toEqual([]);
    expect(whiteJade.worldActionResolution?.rewardPolicy).toBe('none');
    expect(whiteJade.message).toContain('只显示缺口');
  });

  it('formats the loop for DeepSeek without granting authority over rewards', () => {
    const prompt = formatQingmaoResourceLoopContextForPrompt({ store: store({ materialBag: { 月华草: 1 } }) });
    expect(prompt).toContain('青茅低阶炼养用资源小循环');
    expect(prompt).toContain('DeepSeek');
    expect(prompt).toContain('不得写入材料');
    expect(prompt).toContain('白玉蛊食料缺口核对');
  });
});
