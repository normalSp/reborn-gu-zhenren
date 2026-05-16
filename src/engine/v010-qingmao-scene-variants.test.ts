import { describe, expect, it } from 'vitest';
import {
  buildQingmaoSceneVariantViews,
  getQingmaoSceneVariantManifest,
  listQingmaoSceneVariantSpecs,
} from './v010-qingmao-scene-variants';

function regionEntry(slotId: string, canDepart: boolean, blockers: string[] = []): any {
  return {
    actionSlot: { id: slotId, displayName: slotId },
    canDepart,
    blockers,
    warnings: [],
  };
}

function resourceEntry(actionId: string, canResolve: boolean, blockers: string[] = []): any {
  return {
    action: { id: actionId, displayName: actionId },
    canResolve,
    blockers,
    warnings: [],
  };
}

function combatReadiness(templateId: string, status: string, warnings: string[] = []): any {
  return {
    template: { id: templateId, displayName: templateId },
    status,
    blockers: [],
    warnings,
  };
}

describe('v0.10.0-b4 Qingmao scene variants', () => {
  it('keeps scene variants as non-persistent readability metadata', () => {
    const manifest = getQingmaoSceneVariantManifest();
    expect(manifest._meta.version).toBe('v0.10.0-b4-first-cut');
    expect(manifest._meta.saveFormatImpact).toBe('none');
    expect(manifest._meta.boundary).toContain('do not unlock');
    expect(listQingmaoSceneVariantSpecs().map(variant => variant.id)).toEqual([
      'clan_school_courtyard',
      'front_mountain_patrol',
      'moonlit_resource_grove',
    ]);
  });

  it('projects runtime action/resource/combat matches into readable variant cards', () => {
    const views = buildQingmaoSceneVariantViews({
      regionEntries: [
        regionEntry('clan_school_training', true),
        regionEntry('mountain_patrol', false, ['AP不足']),
      ],
      resourceEntries: [
        resourceEntry('moonlight_grass_gathering', true),
        resourceEntry('white_jade_gap_review', false, ['缺口展示']),
      ],
      combatReadiness: [
        combatReadiness('qingmao_encounter_clan_school_spar', 'ready_for_local_validation'),
        combatReadiness('qingmao_encounter_wolf_shadow_pressure', 'candidate_only', ['等待后续验证']),
      ],
    });

    const clan = views.find(view => view.id === 'clan_school_courtyard');
    const patrol = views.find(view => view.id === 'front_mountain_patrol');
    const resource = views.find(view => view.id === 'moonlit_resource_grove');

    expect(clan?.status).toBe('playable');
    expect(clan?.asset?.status).toBe('candidate');
    expect(clan?.forbiddenSummary).toContain('蛊虫或材料掉落');
    expect(patrol?.status).toBe('readiness');
    expect(patrol?.warnings.join('')).toContain('等待后续验证');
    expect(resource?.status).toBe('playable');
    expect(resource?.linkedRuntimeLabels).toContain('moonlight_grass_gathering');
    expect(resource?.blockers).toContain('缺口展示');
  });
});
