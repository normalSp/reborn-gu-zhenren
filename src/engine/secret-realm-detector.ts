/**
 * ═══ 天地秘境检测器 — B1.9 ═══
 * 检测玩家当前位置是否为天地秘境，提供炼蛊加成标记
 */
import realmsRaw from '../canon/secret-realms.json';
import { useStore } from '../store';

export interface SecretRealmInfo {
  name: string;
  path: string;
  hasRefineBonus: boolean;
  bonusDescription?: string;
}

/** 具有炼蛊加成的秘境路径映射 */
const REFINE_BONUS_REALMS: Record<string, { paths: string[]; bonus: string }> = {
  '落天河': { paths: ['水道', '冰道'], bonus: '水道/冰道炼蛊成功率+20%' },
  '荡魂山': { paths: ['魂道', '暗道'], bonus: '魂道/暗道炼蛊成功率+20%' },
  '火山口秘境': { paths: ['火道'], bonus: '火道炼蛊成功率+20%' },
  '古木秘境': { paths: ['木道', '毒道'], bonus: '木道/毒道炼蛊成功率+20%' },
  '剑道崖': { paths: ['剑道', '金道'], bonus: '剑道/金道炼蛊成功率+20%' },
  '冰魄深渊': { paths: ['冰道', '水道'], bonus: '冰道/水道炼蛊成功率+20%' },
  '风暴之眼': { paths: ['风道', '雷道'], bonus: '风道/雷道炼蛊成功率+20%' },
};

/**
 * 检测当前位置是否为天地秘境
 */
export function detectCurrentRealm(): SecretRealmInfo | null {
  const store = useStore.getState() as any;
  const position = store.playerPosition;
  if (!position?.region) return null;

  // 检查是否在已知的秘境区域
  const region = position.region;
  const bonusInfo = REFINE_BONUS_REALMS[region];
  if (bonusInfo) {
    return {
      name: region,
      path: bonusInfo.paths[0] || '未知',
      hasRefineBonus: true,
      bonusDescription: bonusInfo.bonus,
    };
  }

  // 也检查 playerPosition 中的 area 字段
  const area = position.area || '';
  const areaBonus = REFINE_BONUS_REALMS[area];
  if (areaBonus) {
    return {
      name: area,
      path: areaBonus.paths[0] || '未知',
      hasRefineBonus: true,
      bonusDescription: areaBonus.bonus,
    };
  }

  return null;
}

/**
 * 检查指定流派在当前秘境中是否有炼蛊加成
 */
export function hasRealmRefineBonus(guPath: string): boolean {
  const realm = detectCurrentRealm();
  if (!realm?.hasRefineBonus) return false;
  const bonusInfo = REFINE_BONUS_REALMS[realm.name];
  return bonusInfo?.paths.includes(guPath) ?? false;
}

/**
 * 加载所有天地秘境列表
 */
export function getAllRealms(): string[] {
  const data = realmsRaw as any;
  const realms: string[] = [];
  const tiandiData = data['天地秘境'];
  if (tiandiData) {
    for (const [key] of Object.entries(tiandiData)) {
      if (!key.startsWith('说明')) realms.push(key);
    }
  }
  return realms;
}
