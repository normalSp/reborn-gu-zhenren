import { describe, expect, it } from 'vitest';

import board from './qingmao-region-board.json';

describe('v0.10.0 Qingmao region board truth source', () => {
  const regionBoard = board as any;

  it('records the approved v0.10.0-a1 scope without bumping save format', () => {
    expect(regionBoard.version).toBe('v0.10.0-a1');
    expect(regionBoard.regionId).toBe('qingmao_three_clans');
    expect(regionBoard.canonMode).toBe('canon-near+if');
    expect(regionBoard.saveFormatDecision.currentFormatVersion).toBe(21);
    expect(regionBoard.saveFormatDecision.bumpInA1).toBe(false);
  });

  it('covers all Qingmao start profiles without rewriting outside identities', () => {
    const startProfileIds = new Set(regionBoard.identityScope.map((item: any) => item.startProfileId));
    expect(startProfileIds).toEqual(new Set([
      'start_qingmaoshan_guyue',
      'start_qingmaoshan_xiongjia',
      'start_qingmaoshan_baijia',
      'start_qingmaoshan_shangjia_caravan',
      'start_qingmaoshan_wujia_branch',
      'start_qingmaoshan_tiejia_patrol',
      'start_qingmaoshan_sanxiu',
    ]));

    const nonGuYue = regionBoard.identityScope.filter((item: any) => item.startProfileId !== 'start_qingmaoshan_guyue');
    for (const scope of nonGuYue) {
      expect(scope.identityBoundary).toMatch(/不是|不能/);
      expect(scope.identityBoundary).toMatch(/古月|三寨|大族/);
    }
  });

  it('keeps DeepSeek candidate-only authority and local engine ownership', () => {
    expect(regionBoard.deepSeekBoundary.join('\n')).toContain('candidate clues only');
    for (const source of regionBoard.clueSources) {
      expect(['candidate_only', 'rumor_only']).toContain(source.aiAuthority);
    }
    for (const axis of regionBoard.pressureAxes) {
      expect(axis.engineMeaning).toMatch(/local|本地|AI/);
    }
  });

  it('marks persistent region commission state as a future save-format trigger', () => {
    const persistentSlots = regionBoard.actionSlots.filter((slot: any) => slot.requiresPersistentState);
    expect(persistentSlots.map((slot: any) => slot.id)).toContain('three_clan_commission');
    expect(regionBoard.saveFormatDecision.futureBumpTrigger).toContain('SAVE_FORMAT_VERSION');
  });
});
