import { describe, expect, it } from 'vitest';
import { INITIAL_TALENTS } from '../data/talents';
import { P4_TALENTS } from '../data/talents-p4';
import { getModifierCoverageRowsForSource } from './modifier-engine';
import {
  classifyPromiseEffectClaim,
  getPromiseEffectCoverageRules,
  validatePromiseEffectCoverageRelease,
} from './v080-promise-effect-coverage';

function collectTalentCoverageRows(talents: Array<Record<string, any>>) {
  return talents.flatMap(talent => {
    const displayClaims = [
      ...(talent.benefits ?? []),
      ...(talent.costs ?? []),
      talent.triggerScene,
      talent.effectRange,
    ].filter(Boolean);
    return getModifierCoverageRowsForSource('talent', String(talent.id), displayClaims)
      .map(row => ({ talentId: talent.id, talentName: talent.name, ...row }));
  });
}

describe('v080 promise effect coverage', () => {
  it('keeps release-facing needs_downgrade rows cleared', () => {
    const rules = getPromiseEffectCoverageRules();

    expect(validatePromiseEffectCoverageRelease()).toEqual([]);
    expect(rules.some(rule => rule.status === 'needs_downgrade')).toBe(false);
  });

  it('requires any remaining planned rows to explain owner, phase, and next entry point', () => {
    const planned = getPromiseEffectCoverageRules().filter(rule => rule.status === 'planned_needs_system');

    for (const rule of planned) {
      expect(rule.ownerPhase).toMatch(/^v0\.8\.0-/);
      expect(rule.reason.length).toBeGreaterThan(0);
      expect(rule.nextStep?.length).toBeGreaterThan(0);
    }
  });

  it('classifies c1.1 field promises and c1.2 origin/lifebound promises as runtime active', () => {
    const rules = getPromiseEffectCoverageRules();
    const fieldRule = rules.find(rule => rule.id === 'field-action-runtime');
    const originRule = rules.find(rule => rule.id === 'origin-lifebound-pre-c2');

    expect(fieldRule).toBeTruthy();
    expect(originRule).toBeTruthy();

    const field = classifyPromiseEffectClaim(fieldRule!.matchAny[0], 'talent', 'field-talent');
    const origin = classifyPromiseEffectClaim(originRule!.matchAny[0], 'talent', 'origin-talent');

    expect(field.status).toBe('runtime_active');
    expect(field.ownerPhase).toBe('v0.8.0-c1.1');
    expect(origin.status).toBe('runtime_active');
    expect(origin.ownerPhase).toBe('v0.8.0-c1.2');
  });

  it('keeps the P4 talent selector free of planned system and downgrade rows', () => {
    const rows = collectTalentCoverageRows(P4_TALENTS);
    const releaseBlockers = rows.filter(row =>
      row.status === 'planned_needs_system' || row.status === 'needs_downgrade'
    );

    expect(releaseBlockers).toEqual([]);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('keeps legacy and P4 talent pools from leaking stale planned display debt', () => {
    const rows = collectTalentCoverageRows([...P4_TALENTS, ...INITIAL_TALENTS]);
    const planned = rows.filter(row => row.status === 'planned_needs_system');
    const downgrade = rows.filter(row => row.status === 'needs_downgrade');

    expect(planned).toEqual([]);
    expect(downgrade).toEqual([]);
  });
});
