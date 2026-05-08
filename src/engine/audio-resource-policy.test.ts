import { describe, expect, it } from 'vitest';
import { audioSourceManifest, characterBgmManifest, getCharacterBgmEntryByActor, validateAudioSourceManifest } from './audio-resource-policy';
import { selectCharacterBgmCue } from './character-bgm-trigger';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function publicPathFromAudioUrl(filePath: string): string {
  const relative = filePath.replace(/^\//, '');
  return fileURLToPath(new URL(`../../public/${relative}`, import.meta.url));
}

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

  it('selects a runtime-safe free fallback cue for public package character highlights', () => {
    const cue = selectCharacterBgmCue({
      actors: ['方源'],
      tags: ['spring_autumn_cicada', 'desperate_reversal'],
      eventImportance: 20,
    }, characterBgmManifest);

    expect(cue?.title).toContain('免费替代');
    expect(cue?.runtimeEnabled).toBe(true);
    expect(cue?.filePath).toBe('/audio/bgm/scene/reverse_flow_river.ogg');
  });

  it('runtime enabled audio files exist and are non-empty', () => {
    const runtimeFiles = [
      ...audioSourceManifest.tracks.filter(track => track.runtimeEnabled).map(track => track.filePath),
      ...audioSourceManifest.sfx.filter(sfx => sfx.runtimeEnabled).map(sfx => sfx.filePath),
    ];

    expect(runtimeFiles.length).toBeGreaterThanOrEqual(10);
    for (const filePath of runtimeFiles) {
      const abs = publicPathFromAudioUrl(filePath);
      expect(existsSync(abs), filePath).toBe(true);
      expect(statSync(abs).size, filePath).toBeGreaterThan(0);
    }
  });
});
