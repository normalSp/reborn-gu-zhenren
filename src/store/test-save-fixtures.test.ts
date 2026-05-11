import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import extremeAffinityRaw from '../canon/extreme-physique-daomark-affinity.json';
import { SAVE_FORMAT_VERSION } from './initialState';
import { isRuntimePathAllowed } from '../engine/path-registry';

const SAVE_DIR = path.join(process.cwd(), '测试存档', 'v0.7.0');
const EXTREME_PHYSIQUES = Object.keys(extremeAffinityRaw).filter(key => !key.startsWith('_'));
const VALID_SUB_RANKS = new Set(['初阶', '中阶', '高阶', '巅峰']);

function loadSaves(): Array<{ file: string; save: any; state: any }> {
  return fs.readdirSync(SAVE_DIR)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .map(file => {
      const save = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, file), 'utf8'));
      return { file, save, state: save.state || save };
    });
}

describe('v0.7.0 current-format test save fixtures', () => {
  it('keeps every test save on the current save format with visible narrative snapshots', () => {
    for (const { file, save, state } of loadSaves()) {
      expect(save.formatVersion, `${file} should use current save format`).toBe(SAVE_FORMAT_VERSION);
      expect(state.currentNarrative?.narrative?.text, `${file} should include visible narrative`).toBeTruthy();
      expect(state.profile?.realm?.label, `${file} should include player realm`).toBeTruthy();
      expect(state.attributes?.资质, `${file} should include attributes`).toBeTypeOf('number');
      expect(state.playerRole, `${file} should preserve original participant role`).toBe('original_participant');
      expect(state.cultivationState?.version, `${file} should include v0.8.0-b2 cultivation state`).toBe('v0.8.0-b2');
      expect(Array.isArray(state.cultivationState?.breakthroughHistory), `${file} should include breakthrough history`).toBe(true);
      expect(Array.isArray(state.cultivationState?.calamityLedger), `${file} should include calamity ledger`).toBe(true);
      expect(state.storyAnchorState?.version, `${file} should include v0.8.0-b3 story anchor state`).toBe('v0.8.0-b3');
      expect(['intact', 'fractured', 'destroyed'], `${file} should keep canonical fate state`).toContain(state.storyAnchorState?.fateState);
      expect(state.storyAnchorState?.anchorResults?.fate_war, `${file} should include fate war anchor result`).toBeTruthy();
      expect(Array.isArray(state.storyAnchorState?.ifBranchVectors), `${file} should include IF vector ledger`).toBe(true);
      expect(state.flags?.fateState, `${file} should mirror fateState for old prompt compatibility`).toBe(state.storyAnchorState?.fateState);
    }
  });

  it('gives every test save realm-appropriate Gu or Immortal Gu fixtures', () => {
    for (const { file, state } of loadSaves()) {
      const realmGrand = Number(state.profile?.realm?.grand || 1);

      if (realmGrand >= 6) {
        const apertureGu = Array.isArray(state.apertureInventory?.gu) ? state.apertureInventory.gu : [];
        expect(state.aperture?.type, `${file} should use canonical immortal aperture type`).not.toBe('immortal');
        expect(Array.isArray(state.aperture?.resource_nodes), `${file} should use resource_nodes`).toBe(true);
        expect(apertureGu.length, `${file} should include Immortal Gu in aperture storage`).toBeGreaterThan(0);
        expect(apertureGu.some((gu: any) => Number(gu?.tier || 0) >= 6), `${file} should include at least one Immortal Gu`).toBe(true);
        expect(state.vitals?.essenceType, `${file} should use immortal essence`).toBe('immortal');
      } else {
        const inventory = Array.isArray(state.inventory) ? state.inventory : [];
        expect(state.aperture?.type, `${file} should include a canonical mortal aperture`).toBe('mortal');
        expect(state.aperture?.rank, `${file} aperture rank should match realm`).toBe(realmGrand);
        expect(state.aperture?.subRank, `${file} aperture subRank should be valid`).toSatisfy((sub: string) => VALID_SUB_RANKS.has(sub));
        expect(inventory.length, `${file} should include mortal Gu in inventory`).toBeGreaterThan(0);
        expect(
          inventory.every((gu: any) => Number(gu?.tier || 0) <= realmGrand),
          `${file} should not grant above-realm Gu`,
        ).toBe(true);
      }
    }
  });

  it('covers every natural ten-extreme physique plus Pure Dream Reality Seeker as a hidden eleventh fixture', () => {
    const saves = loadSaves();
    const found = new Set<string>();

    for (const { file, save, state } of saves) {
      const physique = state.aperture?.extremePhysiqueType;
      if (!physique) continue;
      const affinity = (extremeAffinityRaw as Record<string, any>)[physique];
      const contextText = `${file} ${save.meta?.playerName || ''} ${save.meta?.description || ''} ${state.currentNarrative?.narrative?.text || ''}`;

      found.add(physique);
      expect(EXTREME_PHYSIQUES, `${file} should use registered extreme physique`).toContain(physique);
      expect(state.profile?.realm?.grand, `${file} should keep extreme physique in mortal stage`).toBeLessThan(6);
      expect(state.attributes?.资质, `${file} should mark ten-extreme aptitude`).toBe(10);
      expect(state.aperture?.type, `${file} should use mortal aperture`).toBe('mortal');
      expect(state.aperture?.capacityLocked, `${file} should lock ten-extreme capacity`).toBe(true);
      expect(state.aperture?.primevalSea?.fillPercent, `${file} should show high-pressure primeval sea`).toBeGreaterThanOrEqual(100);
      expect(contextText, `${file} should name its physique in file metadata or narrative`).toContain(physique);

      const primaryPaths = Object.keys(affinity?.primaryPaths || {});
      expect(primaryPaths.length, `${physique} should define affinity paths`).toBeGreaterThan(0);
      expect(primaryPaths.every(pathName => isRuntimePathAllowed(pathName)), `${physique} should only use runtime paths`).toBe(true);
      expect(primaryPaths, `${file} pathBuild.primary should follow affinity matrix`).toContain(state.pathBuild?.primary);
    }

    expect([...found].sort()).toEqual([...EXTREME_PHYSIQUES].sort());
    expect(found.has('纯梦求真体'), 'Pure Dream Reality Seeker should be covered as hidden eleventh physique').toBe(true);
  });
});
