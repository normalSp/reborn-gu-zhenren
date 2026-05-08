import { describe, expect, it } from 'vitest';
import guDatabaseRaw from '../canon/gu-database.json';
import npcsRaw from '../canon/npcs.json';
import achievementsRaw from '../canon/achievements.json';
import extremeAffinityRaw from '../canon/extreme-physique-daomark-affinity.json';
import { isRuntimePathAllowed } from './path-registry';

function dataEntries<T = any>(record: Record<string, T>): Array<[string, T]> {
  return Object.entries(record).filter(([key]) => !key.startsWith('_')) as Array<[string, T]>;
}

describe('v0.7.0-a combat data foundation', () => {
  it('keeps extreme physique affinity paths inside the runtime path registry', () => {
    for (const [physique, config] of dataEntries(extremeAffinityRaw as Record<string, any>)) {
      for (const path of Object.keys(config.primaryPaths || {})) {
        expect(isRuntimePathAllowed(path), `${physique}.primaryPaths.${path}`).toBe(true);
      }
      for (const path of config.forbiddenPaths || []) {
        expect(isRuntimePathAllowed(path), `${physique}.forbiddenPaths.${path}`).toBe(true);
      }
      for (const path of Object.keys(config.backlashPaths || {})) {
        expect(isRuntimePathAllowed(path), `${physique}.backlashPaths.${path}`).toBe(true);
      }
    }
  });

  it('defines combatStatus for at least 30 core Gu entries', () => {
    const entries = dataEntries(guDatabaseRaw as Record<string, any>);
    const combatReady = entries.filter(([, spec]) => spec.combatStatus);
    expect(combatReady.length).toBeGreaterThanOrEqual(30);

    for (const [name, spec] of combatReady.slice(0, 42)) {
      const status = spec.combatStatus;
      expect(isRuntimePathAllowed(spec.path), `${name}.path`).toBe(true);
      expect(typeof status.role, `${name}.combatStatus.role`).toBe('string');
      expect(typeof status.runtimeCombatAllowed, `${name}.combatStatus.runtimeCombatAllowed`).toBe('boolean');
      expect(typeof status.cooldown, `${name}.combatStatus.cooldown`).toBe('number');
      expect(status.resourceCost, `${name}.combatStatus.resourceCost`).toBeTruthy();
      expect(status.riskTier, `${name}.combatStatus.riskTier`).toBeTruthy();
    }
  });

  it('seeds adventureTrust and interestDrive for core NPCs', () => {
    const npcs = Object.entries((npcsRaw as any).npcDatabase || {}).slice(0, 30);
    expect(npcs.length).toBeGreaterThanOrEqual(30);
    for (const [name, npc] of npcs) {
      expect(typeof (npc as any).adventureTrust, `${name}.adventureTrust`).toBe('number');
      expect(typeof (npc as any).interestDrive, `${name}.interestDrive`).toBe('number');
      expect((npc as any).adventureTrust).toBeGreaterThanOrEqual(0);
      expect((npc as any).adventureTrust).toBeLessThanOrEqual(100);
      expect((npc as any).interestDrive).toBeGreaterThanOrEqual(0);
      expect((npc as any).interestDrive).toBeLessThanOrEqual(100);
    }
  });

  it('does not let mortal achievements bypass the immortal-stone economy', () => {
    for (const achievement of (achievementsRaw as any).achievements || []) {
      const immortalReward = achievement.reward?.immortalCurrency || 0;
      if (immortalReward <= 0) continue;
      const condition = String(achievement.condition || '');
      expect(/realmNum\s*>=\s*6|immortalGuCount|ascensionSuccessCount/.test(condition), achievement.id).toBe(true);
    }
  });
});
