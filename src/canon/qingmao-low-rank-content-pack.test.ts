import { describe, expect, it } from 'vitest';

import pack from './qingmao-low-rank-content-pack.json';
import guExpressionSpecs from './gu-expression-specs.json';
import pathRegistry from './path-registry.json';

describe('v0.10.0-b2 Qingmao low-rank content pack', () => {
  const contentPack = pack as any;
  const expressionNames = new Set((guExpressionSpecs as any).entries.map((entry: any) => entry.guName));
  const runtimeAllowedPaths = new Set(
    (pathRegistry as any).paths
      .filter((path: any) => path.runtimeAllowed)
      .map((path: any) => path.id),
  );

  it('is a candidate-only canon source with no save-format impact', () => {
    expect(contentPack._meta.version).toBe('v0.10.0-b2-first-cut');
    expect(contentPack._meta.status).toBe('candidate_review');
    expect(contentPack._meta.runtimeActivation).toBe('not_active');
    expect(contentPack._meta.saveFormatImpact).toBe('none');
  });

  it('keeps the approved small content-pack size', () => {
    expect(contentPack.guCandidates.length).toBeGreaterThanOrEqual(12);
    expect(contentPack.guCandidates.length).toBeLessThanOrEqual(18);
    expect(contentPack.behaviorTemplates.length).toBeGreaterThanOrEqual(4);
    expect(contentPack.behaviorTemplates.length).toBeLessThanOrEqual(6);
    expect(contentPack.encounterTemplates.length).toBeGreaterThanOrEqual(3);
    expect(contentPack.encounterTemplates.length).toBeLessThanOrEqual(5);
  });

  it('references existing Gu expression specs and runtime-allowed paths only', () => {
    for (const candidate of contentPack.guCandidates) {
      expect(expressionNames.has(candidate.expressionRef), candidate.guName).toBe(true);
      expect(runtimeAllowedPaths.has(candidate.path), candidate.guName).toBe(true);
      expect(candidate.rankBand[0]).toBeGreaterThanOrEqual(1);
      expect(candidate.rankBand[1]).toBeLessThanOrEqual(3);
      expect(['candidate_only', 'runtime_candidate']).toContain(candidate.activation);
      expect(typeof candidate.qingmaoRole, candidate.guName).toBe('string');
    }
  });

  it('keeps behavior and encounter templates tied to pack Gu ids', () => {
    const ids = new Set(contentPack.guCandidates.map((candidate: any) => candidate.id));
    for (const template of contentPack.behaviorTemplates) {
      expect(template.battlefieldScale).toBe('battlefield_5x3');
      for (const id of template.exampleGuIds) expect(ids.has(id), `${template.id}:${id}`).toBe(true);
    }
    for (const encounter of contentPack.encounterTemplates) {
      expect(['local_engine_only', 'candidate_clue_only']).toContain(encounter.rewardPolicy);
      for (const id of encounter.recommendedGuIds) expect(ids.has(id), `${encounter.id}:${id}`).toBe(true);
    }
  });

  it('does not smuggle high-rank or blocked lore into the low-rank pack', () => {
    const serialized = JSON.stringify(contentPack);
    for (const term of ['仙蛊', '十转', '永生蛊', '宝黄天', '宿命蛊归属']) {
      expect(serialized.includes(term), term).toBe(false);
    }
    expect(serialized.includes('Spring Autumn Cicada')).toBe(true);
    expect(serialized.includes('normal attack')).toBe(true);
  });
});
