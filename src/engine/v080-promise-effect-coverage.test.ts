import { describe, expect, it } from 'vitest';
import {
  classifyPromiseEffectClaim,
  getPromiseEffectCoverageRules,
  validatePromiseEffectCoverageRelease,
} from './v080-promise-effect-coverage';

describe('v080 promise effect coverage', () => {
  it('keeps release-facing needs_downgrade rows cleared', () => {
    const rules = getPromiseEffectCoverageRules();

    expect(validatePromiseEffectCoverageRelease()).toEqual([]);
    expect(rules.some(rule => rule.status === 'needs_downgrade')).toBe(false);
  });

  it('requires planned rows to explain owner, phase, and next entry point', () => {
    const planned = getPromiseEffectCoverageRules().filter(rule => rule.status === 'planned_needs_system');

    expect(planned.length).toBeGreaterThan(0);
    for (const rule of planned) {
      expect(rule.ownerPhase).toMatch(/^v0\.8\.0-/);
      expect(rule.reason.length).toBeGreaterThan(0);
      expect(rule.nextStep?.length).toBeGreaterThan(0);
    }
  });

  it('classifies c1.1 field promises as runtime active and c1.2 promises as planned', () => {
    const rules = getPromiseEffectCoverageRules();
    const fieldRule = rules.find(rule => rule.id === 'field-action-runtime');
    const originRule = rules.find(rule => rule.id === 'origin-lifebound-pre-c2');

    expect(fieldRule).toBeTruthy();
    expect(originRule).toBeTruthy();

    const field = classifyPromiseEffectClaim(fieldRule!.matchAny[0], 'talent', 'field-talent');
    const origin = classifyPromiseEffectClaim(originRule!.matchAny[0], 'talent', 'origin-talent');

    expect(field.status).toBe('runtime_active');
    expect(field.ownerPhase).toBe('v0.8.0-c1.1');
    expect(origin.status).toBe('planned_needs_system');
    expect(origin.ownerPhase).toBe('v0.8.0-c1.2');
  });
});
