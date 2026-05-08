import { describe, expect, it } from 'vitest';
import {
  canUseFromNormalButton,
  getGuUseEntry,
  isGuUseTargetAllowed,
  resolveGuUse,
  resolveSceneGatedGuUseSuggestion,
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

  it('allows multiple healing or shielding Gu to target self and allies', () => {
    for (const guName of ['月霓裳', '治愈蛊', '金风送爽蛊']) {
      const entry = getGuUseEntry(guName);
      expect(entry.targetRule).toBe('self_or_known_ally');
      expect(isGuUseTargetAllowed(entry, { type: 'self' })).toBe(true);
      expect(isGuUseTargetAllowed(entry, { type: 'known_npc', id: 'npc_shang_xin_ci', name: '商心慈' })).toBe(true);
      expect(isGuUseTargetAllowed(entry, { type: 'squad_member', id: 'member_1', name: '队友' })).toBe(true);

      const result = resolveGuUse(entry, { type: 'known_npc', id: 'npc_shang_xin_ci', name: '商心慈' });
      expect(result.success).toBe(true);
      expect(result.attributeDeltas).toEqual({});
      expect(result.targetedEffect?.target.name).toBe('商心慈');
      expect(result.targetedEffect?.sourceGu).toBe(guName);
    }
  });

  it('allows hong yun qi tian gu to choose self or known ally and consume once', () => {
    const entry = getGuUseEntry('鸿运齐天蛊');
    expect(entry.useMode).toBe('consumable');
    expect(entry.consumesGu).toBe(true);

    const selfResult = resolveGuUse(entry, { type: 'self' });
    expect(selfResult.success).toBe(true);
    expect(selfResult.attributeDeltas.气运).toBe(3);

    const allyResult = resolveGuUse(entry, { type: 'known_npc', id: 'npc_tai_bai', name: '太白云生' });
    expect(allyResult.success).toBe(true);
    expect(allyResult.attributeDeltas.气运).toBeUndefined();
    expect(allyResult.targetedEffect?.target.name).toBe('太白云生');
    expect(allyResult.consumesGu).toBe(true);
  });

  it('validates strategic targeted Gu and rejects invalid target categories', () => {
    const renRuGu = getGuUseEntry('人如故');
    expect(resolveGuUse(renRuGu, { type: 'known_npc', name: '黑楼兰' }).success).toBe(true);
    expect(resolveGuUse(renRuGu, { type: 'aperture_or_location', name: '仙窍' }).success).toBe(false);

    const luckGu = getGuUseEntry('气运蛊');
    expect(resolveGuUse(luckGu, { type: 'scene_target', name: '敌方首领' }).success).toBe(true);
  });

  it('requires engine-validated scenes for woman heart and blood skull gu', () => {
    const womanHeart = getGuUseEntry('妇人心蛊');
    const rejected = resolveSceneGatedGuUseSuggestion(
      womanHeart,
      { type: 'scene_target', name: '尸体' },
      { sceneValidated: false },
    );
    expect(rejected.success).toBe(false);

    const accepted = resolveSceneGatedGuUseSuggestion(
      womanHeart,
      { type: 'scene_target', name: '尸体' },
      { sceneValidated: true, sceneTags: ['毒道', '尸体'] },
    );
    expect(accepted.success).toBe(true);
    expect(accepted.consumesGu).toBe(true);

    const bloodSkull = getGuUseEntry('血颅蛊');
    const invalidTarget = resolveSceneGatedGuUseSuggestion(
      bloodSkull,
      { type: 'known_npc', name: '路人' },
      { sceneValidated: true, sceneTags: ['同族'] },
    );
    expect(invalidTarget.success).toBe(false);
  });

  it('requires registered Gu use entries to carry lore and balance metadata', () => {
    expect(validateGuUseRegistry()).toEqual([]);
  });
});
