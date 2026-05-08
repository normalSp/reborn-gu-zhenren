import { describe, expect, it } from 'vitest';
import {
  canUseFromNormalButton,
  getGuUseEntry,
  resolveGuUse,
  shouldShowUseButton,
  validateGuUseRegistry,
} from './gu-use-registry';

describe('gu-use-registry', () => {
  it('keeps scene gated Gu out of normal click use', () => {
    const entry = getGuUseEntry('妇人心蛊');
    expect(entry.useMode).toBe('scene_gated');
    expect(shouldShowUseButton(entry)).toBe(true);
    expect(canUseFromNormalButton(entry)).toBe(false);

    const result = resolveGuUse(entry, { type: 'self' });
    expect(result.success).toBe(false);
    expect(result.consumesGu).toBe(false);
  });

  it('allows hong yun qi tian gu as a one-use strategic action', () => {
    const entry = getGuUseEntry('鸿运齐天蛊');
    expect(entry.useMode).toBe('consumable');
    expect(entry.consumesGu).toBe(true);

    const result = resolveGuUse(entry, { type: 'self' });
    expect(result.success).toBe(true);
    expect(result.attributeDeltas.气运).toBe(3);
    expect(result.flags['guUse.hong_yun_qi_tian_used']).toBe(true);
  });

  it('requires registered Gu use entries to carry lore and balance metadata', () => {
    expect(validateGuUseRegistry()).toEqual([]);
  });
});
