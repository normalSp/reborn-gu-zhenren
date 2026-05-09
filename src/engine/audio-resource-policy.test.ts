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

  it('enables user-supplied local fan pack character themes after files are supplied', () => {
    const fangYuan = getCharacterBgmEntryByActor('方源');
    const dukeLong = getCharacterBgmEntryByActor('龙公');
    expect(fangYuan?.title).toBe('年轮');
    expect(dukeLong?.title).toBe('春泥');
    expect(fangYuan?.runtimeEnabled).toBe(true);
    expect(dukeLong?.runtimeEnabled).toBe(true);
    expect(fangYuan?.sourceTier).toBe('user_supplied_local_fan_pack');
    expect(dukeLong?.sourceTier).toBe('user_supplied_local_fan_pack');
  });

  it('selects a supplied high-light character cue when the local fan pack is present', () => {
    const cue = selectCharacterBgmCue({
      actors: ['方源'],
      tags: ['spring_autumn_cicada', 'desperate_reversal'],
      eventImportance: 20,
    }, characterBgmManifest);

    expect(cue?.title).toBe('年轮');
    expect(cue?.runtimeEnabled).toBe(true);
    expect(cue?.filePath).toBe('/audio/bgm/character/fang_yuan/nianlun.mp3');
    expect(cue?.score).toBeGreaterThanOrEqual(35);
  });

  it('can still preview disabled missing tracks without treating them as runtime assets', () => {
    const cue = selectCharacterBgmCue({
      actors: ['柳贯一'],
      tags: ['reverse_flow_river', 'desperate_reversal'],
      eventImportance: 20,
      allowDisabledForPreview: true,
    }, characterBgmManifest);

    expect(cue?.title).toBe('Lightning Moment dj');
    expect(cue?.runtimeEnabled).toBe(false);
  });

  it('rotates multi-track character themes in a deterministic way', () => {
    const redLotusTracks = new Set<string>();
    const maHongYunTracks = new Set<string>();

    for (let turn = 1; turn <= 12; turn += 1) {
      redLotusTracks.add(selectCharacterBgmCue({
        actors: ['红莲魔尊'],
        tags: ['red_lotus', 'fate_gu', 'time_path_scene'],
        eventImportance: 20,
        currentTurn: turn,
      }, characterBgmManifest)?.trackId ?? '');
      maHongYunTracks.add(selectCharacterBgmCue({
        actors: ['马鸿运'],
        tags: ['ma_hong_yun', 'luck_path', 'northern_plains'],
        eventImportance: 20,
        currentTurn: turn,
      }, characterBgmManifest)?.trackId ?? '');
    }

    expect(redLotusTracks).toContain('character_red_lotus_ruomeng');
    expect(redLotusTracks).toContain('character_red_lotus_meili_shenhua_dj');
    expect(maHongYunTracks).toContain('character_ma_hong_yun_zood_dingzhen');
    expect(maHongYunTracks).toContain('character_ma_hong_yun_i_got_smoke');
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
