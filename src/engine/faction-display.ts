import factionDataRaw from '../canon/faction-data.json';

interface FactionRecord {
  id: string;
  name?: string;
  standing?: number;
  type?: string;
  domain?: string;
}

const factionData = factionDataRaw as any;

function flattenFactions(): FactionRecord[] {
  const groups = factionData.factions || {};
  const records: FactionRecord[] = [];
  if (Array.isArray(groups)) return groups;
  for (const value of Object.values(groups)) {
    if (Array.isArray(value)) records.push(...(value as FactionRecord[]));
  }
  return records;
}

const FACTION_NAME_BY_ID = new Map<string, string>();
const FACTION_RECORD_BY_ID = new Map<string, FactionRecord>();

for (const faction of flattenFactions()) {
  if (!faction?.id) continue;
  FACTION_RECORD_BY_ID.set(faction.id, faction);
  FACTION_NAME_BY_ID.set(faction.id, faction.name || faction.id);
}

const FALLBACK_NAMES: Record<string, string> = {
  guyue_shanzhai: '古月山寨',
  shangjia: '商家',
  wujia: '武家',
  tiejia: '铁家',
  moja: '墨家',
  huangjin: '黄金家族',
  tianting: '天庭',
  changshengtian: '长生天',
  shadow_sect: '影宗',
  sanxiu: '散修',
};

export function resolveFactionDisplayName(factionId: string): string {
  if (!factionId) return '未知势力';
  return FACTION_NAME_BY_ID.get(factionId) || FALLBACK_NAMES[factionId] || factionId;
}

export function resolveFactionRecord(factionId: string): FactionRecord | undefined {
  return FACTION_RECORD_BY_ID.get(factionId);
}

export function getInitialFactionStanding(
  factionId: string,
  context: { realmGrand?: number; timelineNodeId?: string; identity?: string } = {},
): number {
  const realmGrand = Number(context.realmGrand || 1);
  const configured = Number(resolveFactionRecord(factionId)?.standing ?? 0);

  if (factionId === 'guyue_shanzhai' && realmGrand <= 2) {
    return 10;
  }

  if (realmGrand >= 6) {
    return Math.max(10, Math.min(30, configured || 20));
  }

  if (/商队|商人|商业/.test(String(context.identity || '')) || factionId === 'shangjia') {
    return Math.max(5, Math.min(15, configured || 10));
  }

  if (/散修/.test(String(context.identity || '')) || factionId === 'sanxiu') {
    return 0;
  }

  return Math.max(-5, Math.min(15, configured));
}
