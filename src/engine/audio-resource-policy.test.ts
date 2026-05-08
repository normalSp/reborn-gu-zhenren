import { describe, expect, it } from 'vitest';
import { audioSourceManifest, characterBgmManifest, getCharacterBgmEntryByActor, validateAudioSourceManifest } from './audio-resource-policy';
import { selectCharacterBgmCue } from './character-bgm-trigger';

describe('v0.7.0-c audio resource policy', () => {
  it('rejects AI/synthetic BGM and combat SFX as runtime policy', () => {
    const issues = validateAudioSourceManifest(audioSourceManifest);
    expect(issues.filter(issue => issue.severity === 'error')).toEqual([]);
    expect(audioSourceManifest.policy.aiOrSyntheticBgmAllowed).toBe(false);
    expect(audioSourceManifest.policy.aiOrSyntheticCombatSfxAllowed).toBe(false);
  });

  it('keeps Fang Yuan and Duke Long character themes as reviewed but disabled until files are supplied', () => {
    const fangYuan = getCharacterBgmEntryByActor('方源');
    const dukeLong = getCharacterBgmEntryByActor('龙公');
    expect(fangYuan?.title).toBe('年轮');
    expect(dukeLong?.title).toBe('春泥');
    expect(fangYuan?.runtimeEnabled).toBe(false);
    expect(dukeLong?.runtimeEnabled).toBe(false);
  });

  it('can preview a high-light character cue without enabling missing audio files', () => {
    const cue = selectCharacterBgmCue({
      actors: ['方源'],
      tags: ['spring_autumn_cicada', 'desperate_reversal'],
      eventImportance: 20,
      allowDisabledForPreview: true,
    }, characterBgmManifest);

    expect(cue?.title).toBe('年轮');
    expect(cue?.runtimeEnabled).toBe(false);
    expect(cue?.score).toBeGreaterThanOrEqual(35);
  });
});
