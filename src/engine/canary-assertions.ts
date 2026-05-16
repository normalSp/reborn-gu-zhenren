// ═══ Layer 4 金丝雀断言引擎 ═══
// 12条确定性状态感知断言（C01-C12）
// 运行在 Layer 3 语义规则引擎之前，约2ms
// 详见 doc/canary-assertion-rules.md

import type { NarrativeJSON } from '../types';
import type { RootStore } from '../store';
import npcsRaw from '../canon/npcs.json';
import { getSelectedTalentIds } from './modifier-engine';

// ─── 玩家状态快照（轻量） ───
interface PlayerSnapshot {
  realmGrand: number;
  attributes: { 资质: number; 体魄: number; 心智: number; 气运: number };
  healthMax: number;
  essenceMax: number;
  inventory: Array<{ name: string; tier: number; path: string }>;
}

// ─── 断言结果 ───
export interface CanaryResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  level: 'critical' | 'warning';
  details: string;
}

export interface CanaryValidationResult {
  passed: boolean;
  results: CanaryResult[];
  failedCritical: CanaryResult[];
  failedWarning: CanaryResult[];
  recommendation: 'accept' | 'reject' | 'warn_only';
}

// ─── 累计Warning追踪（C09跨调用计数） ───
let c09WarningCount = 0;
export function resetC09Counter() { c09WarningCount = 0; }

// ─── NPC名单（威慑型NPC不应友善） ───
const DETERRENCE_NPCS = ['方源', '古月方源', '太白云生', '无极魔尊'];

// ─── 爽文禁词列表 ───
const POWER_FANTASY_WORDS = [
  '热血沸腾', '充满希望', '美好未来', '前途无量', '轻松愉快', '皆大欢喜',
];

// ─── 越级合理性标记词 ───
const REALM_JUSTIFICATION_WORDS = [
  '杀招', '仙蛊', '道痕', '底牌', '代价', '反噬', '重伤', '耗尽', '燃烧',
  '偷袭', '借助', '天时', '地利',
];

// ═══════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════

const CN_NUM: Record<string, number> = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };

function parseRealmNum(s: string): number | null {
  // 先尝试阿拉伯数字
  const arabic = s.match(/(\d+)转/);
  if (arabic) return parseInt(arabic[1], 10);
  // 再尝试中文数字
  const cn = s.match(/([一二三四五六七八九])转/);
  if (cn) return CN_NUM[cn[1]] || null;
  return null;
}

function extractRealm(text: string): number | null {
  return parseRealmNum(text);
}

function extractOpponentRealm(text: string): number | null {
  const regex = /([\d一二三四五六七八九]+)转(蛊师|蛊仙|强者|高手)/g;
  const matches = text.match(regex);
  if (!matches) return null;
  // 同时处理数值型匹配结果
  const realms = matches.map(m => parseRealmNum(m)).filter((n): n is number => n !== null);
  return realms.length > 0 ? Math.max(...realms) : null;
}

function contains(text: string, words: string[]): boolean {
  return words.some(w => text.includes(w));
}

function countHits(text: string, words: string[]): number {
  return words.filter(w => text.includes(w)).length;
}

// ═══════════════════════════════════════════
// C01: 越级战斗合理性守卫 ⚠️ Warning
// ═══════════════════════════════════════════
function c01_RealmCrossCheck(text: string, player: PlayerSnapshot): CanaryResult {
  const opponentRealm = extractOpponentRealm(text);
  if (!opponentRealm || opponentRealm <= player.realmGrand) {
    return { ruleId: 'C01', ruleName: '越级战斗合理性', passed: true, level: 'warning', details: '' };
  }

  const victoryWords = ['战胜', '击败', '打倒', '打退', '击杀'];
  if (!contains(text, victoryWords)) {
    return { ruleId: 'C01', ruleName: '越级战斗合理性', passed: true, level: 'warning', details: '' };
  }

  if (contains(text, REALM_JUSTIFICATION_WORDS)) {
    return { ruleId: 'C01', ruleName: '越级战斗合理性', passed: true, level: 'warning', details: '' };
  }

  return {
    ruleId: 'C01', ruleName: '越级战斗合理性', passed: false, level: 'warning',
    details: `跨境界战斗（玩家${player.realmGrand}转 vs ${opponentRealm}转）缺少越级合理性标记（杀招/道痕/代价等）`,
  };
}

// ═══════════════════════════════════════════
// C02: 方源角色锁 ⚡ Critical
// ═══════════════════════════════════════════
function c02_FangYuanLock(text: string): CanaryResult {
  if (!text.includes('方源') && !text.includes('古月方源')) {
    return { ruleId: 'C02', ruleName: '方源角色锁', passed: true, level: 'critical', details: '' };
  }
  const forbidden = ['信任', '友善', '欣赏', '交朋友', '全力支持', '看好你'];
  if (contains(text, forbidden)) {
    const hits = forbidden.filter(w => text.includes(w));
    return { ruleId: 'C02', ruleName: '方源角色锁', passed: false, level: 'critical', details: `方源出现违禁词: ${hits.join('、')}` };
  }
  return { ruleId: 'C02', ruleName: '方源角色锁', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C03: 境界跳跃检测 ⚡ Critical
// ═══════════════════════════════════════════
function c03_RealmJump(narrative: NarrativeJSON, player: PlayerSnapshot): CanaryResult {
  const update = narrative.state_update?.player?.realm;
  if (!update || typeof update === 'string' || update.action !== 'set') {
    return { ruleId: 'C03', ruleName: '境界跳跃检测', passed: true, level: 'critical', details: '' };
  }
  const newRealm = extractRealm(update.value);
  if (!newRealm) return { ruleId: 'C03', ruleName: '境界跳跃检测', passed: true, level: 'critical', details: '' };
  if (newRealm - player.realmGrand >= 2) {
    return { ruleId: 'C03', ruleName: '境界跳跃检测', passed: false, level: 'critical', details: `境界从${player.realmGrand}转跳到${newRealm}转（跨越${newRealm - player.realmGrand}转）` };
  }
  return { ruleId: 'C03', ruleName: '境界跳跃检测', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C04: 免费午餐检测 ⚡ Critical
// ═══════════════════════════════════════════
function c04_FreeLunchCheck(narrative: NarrativeJSON, text: string): CanaryResult {
  const adds = narrative.state_update?.gu_inventory?.add;
  if (!adds || adds.length === 0) {
    return { ruleId: 'C04', ruleName: '免费午餐检测', passed: true, level: 'critical', details: '' };
  }
  const highRarity = adds.filter(g => ['epic', 'legendary', 'divine'].includes(g.rarity));
  if (highRarity.length === 0) {
    return { ruleId: 'C04', ruleName: '免费午餐检测', passed: true, level: 'critical', details: '' };
  }
  // C04白名单：NPC交易/教学/有偿帮助场景
  const npcTradeWords = ['长老', '教你', '帮你采集', '代价', '帮你', '报酬', '条件'];
  if (contains(text, npcTradeWords)) {
    return { ruleId: 'C04', ruleName: '免费午餐检测', passed: true, level: 'critical', details: '' };
  }
  const costWords = ['代价', '风险', '但是', '换取', '条件', '如果失败', '需要', '付出'];
  if (!contains(text, costWords)) {
    return { ruleId: 'C04', ruleName: '免费午餐检测', passed: false, level: 'critical', details: `获得${highRarity.map(g => g.name).join('、')}（稀有度${highRarity[0].rarity}）但未提及代价` };
  }
  return { ruleId: 'C04', ruleName: '免费午餐检测', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C05: 属性突变检测 ⚠️ Warning
// ═══════════════════════════════════════════
function c05_AttrSpike(narrative: NarrativeJSON, text: string, player: PlayerSnapshot): CanaryResult {
  const attrs = narrative.state_update?.player?.attributes;
  if (!attrs) return { ruleId: 'C05', ruleName: '属性突变检测', passed: true, level: 'warning', details: '' };
  // 白名单：合理修炼场景
  const trainingWords = ['修炼', '刻苦', '修行', '训练', '锻炼', '磨砺', '岁月'];
  const isTraining = contains(text, trainingWords);
  const harshWords = ['代价', '反噬', '燃烧寿命', '天意', '机缘', '奇遇'];
  const isHarsh = contains(text, harshWords);
  // 合理修炼默认±5，苛刻条件±8
  const threshold = isHarsh ? 8 : (isTraining ? 5 : 3);
  const attrKeys = ['资质', '体魄', '心智', '气运'] as const;

  for (const key of attrKeys) {
    const change = attrs[key];
    if (change && Math.abs(change.value) > threshold) {
      return { ruleId: 'C05', ruleName: '属性突变检测', passed: false, level: 'warning', details: `${key}变化±${Math.abs(change.value)}超过阈值±${threshold}` };
    }
  }
  return { ruleId: 'C05', ruleName: '属性突变检测', passed: true, level: 'warning', details: '' };
}

// ═══════════════════════════════════════════
// C06: 生命/真元溢出检测 ⚡ Critical
// ═══════════════════════════════════════════
function c06_VitalOverflow(narrative: NarrativeJSON, player: PlayerSnapshot): CanaryResult {
  const health = narrative.state_update?.player?.health;
  const essence = narrative.state_update?.player?.essence;
  if (health && health.current > health.max) {
    return { ruleId: 'C06', ruleName: '生命/真元溢出', passed: false, level: 'critical', details: `生命值${health.current}溢出上限${health.max}` };
  }
  if (essence && essence.current > essence.max) {
    return { ruleId: 'C06', ruleName: '生命/真元溢出', passed: false, level: 'critical', details: `真元${essence.current}溢出上限${essence.max}` };
  }
  return { ruleId: 'C06', ruleName: '生命/真元溢出', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C07: 选择结构完整性 ⚡ (5E: downgrade to warning—AI normalization often defaults to medium)
// ═══════════════════════════════════════════
function c07_ChoiceStructure(narrative: NarrativeJSON): CanaryResult {
  const choices = narrative.narrative.choices;
  if (!choices || choices.length < 2) {
    return { ruleId: 'C07', ruleName: '选择结构完整性', passed: false, level: 'critical', details: '选项不足2个' };
  }
  const hasHigh = choices.some(c => c.risk === 'high');
  const hasLow = choices.some(c => c.risk === 'low');
  if (!hasHigh && !hasLow) {
    return { ruleId: 'C07', ruleName: '选择结构完整性', passed: false, level: 'warning', details: '所有选项均为中风险，建议增加高低风险多样性' };
  }
  return { ruleId: 'C07', ruleName: '选择结构完整性', passed: true, level: 'warning', details: '' };
}

// ═══════════════════════════════════════════
// C08: 叙事长度硬边界 ⚡ Critical
// ═══════════════════════════════════════════
function c08_TextBoundary(text: string): CanaryResult {
  if (text.length < 80) {
    return { ruleId: 'C08', ruleName: '叙事长度边界', passed: false, level: 'critical', details: `叙事文本过短（${text.length}字<80字）` };
  }
  if (text.length > 900) {
    return { ruleId: 'C08', ruleName: '叙事长度边界', passed: false, level: 'critical', details: `叙事文本过长（${text.length}字>900字）` };
  }
  return { ruleId: 'C08', ruleName: '叙事长度边界', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C09: 爽文禁词检测 ⚠️ Warning
// ═══════════════════════════════════════════
function c09_PowerFantasy(text: string): CanaryResult {
  const hits = countHits(text, POWER_FANTASY_WORDS);
  if (hits === 0) {
    // 没有新违规但累计可能>3，不清零
    return { ruleId: 'C09', ruleName: '爽文禁词检测', passed: true, level: 'warning', details: '' };
  }
  c09WarningCount += hits;
  const matched = POWER_FANTASY_WORDS.filter(w => text.includes(w));
  if (c09WarningCount >= 3) {
    return { ruleId: 'C09', ruleName: '爽文禁词检测', passed: false, level: 'warning', details: `累计${c09WarningCount}次爽文禁词（本次: ${matched.join('、')}）→升级为reject` };
  }
  return { ruleId: 'C09', ruleName: '爽文禁词检测', passed: true, level: 'warning', details: `爽文禁词${matched.join('、')}（累计${c09WarningCount}/3）` };
}

// ═══════════════════════════════════════════
// C10: 核心NPC威慑力守卫 ⚡ Critical
// ═══════════════════════════════════════════
function c10_NPCDeterrence(text: string): CanaryResult {
  for (const npc of DETERRENCE_NPCS) {
    if (!text.includes(npc)) continue;
    const warmWords = ['拍了拍', '露出微笑', '温和地说', '和蔼'];
    if (contains(text, warmWords)) {
      const hits = warmWords.filter(w => text.includes(w));
      return { ruleId: 'C10', ruleName: 'NPC威慑力守卫', passed: false, level: 'critical', details: `${npc}出现友善描写: ${hits.join('、')}` };
    }
  }
  return { ruleId: 'C10', ruleName: 'NPC威慑力守卫', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C11: 蛊虫死后销毁守卫 ⚡ Critical
// ═══════════════════════════════════════════
function c11_GuDestruction(text: string): CanaryResult {
  if (!contains(text, ['杀死', '击杀', '毙命', '陨落'])) {
    return { ruleId: 'C11', ruleName: '蛊虫死后销毁', passed: true, level: 'critical', details: '' };
  }
  if (!contains(text, ['获得了', '得到了', '取走了', '收走']) || !text.includes('蛊')) {
    return { ruleId: 'C11', ruleName: '蛊虫死后销毁', passed: true, level: 'critical', details: '' };
  }
  const justificationWords = ['传承', '考验', '试炼', '认可', '继承', '春秋蝉', '魂道', '梦境', '算计已久', '偷袭得手', '瞬间击杀'];
  if (!contains(text, justificationWords)) {
    return { ruleId: 'C11', ruleName: '蛊虫死后销毁', passed: false, level: 'critical', details: '杀死敌人后获得蛊虫但无正当获取手段（传承/考验/特殊手段）' };
  }
  return { ruleId: 'C11', ruleName: '蛊虫死后销毁', passed: true, level: 'critical', details: '' };
}

// ═══════════════════════════════════════════
// C12: 仙窍转化守卫 ⚠️ Warning
// ═══════════════════════════════════════════
function c12_ApertureTransform(text: string): CanaryResult {
  if (!contains(text, ['蛊仙', '仙尊', '真君'])) {
    return { ruleId: 'C12', ruleName: '仙窍转化守卫', passed: true, level: 'warning', details: '' };
  }
  if (!contains(text, ['陨落', '身死', '死亡', '殒命'])) {
    return { ruleId: 'C12', ruleName: '仙窍转化守卫', passed: true, level: 'warning', details: '' };
  }
  const transformWords = ['福地', '洞天', '仙窍落下', '仙窍落地', '天地二气'];
  if (!contains(text, transformWords)) {
    return { ruleId: 'C12', ruleName: '仙窍转化守卫', passed: false, level: 'warning', details: '蛊仙死亡未提及仙窍转化福地/洞天' };
  }
  return { ruleId: 'C12', ruleName: '仙窍转化守卫', passed: true, level: 'warning', details: '' };
}

// ═══════════════════════════════════════════
// C13: NPC 角色身份一致性守卫 ⚠️ Warning
// ═══════════════════════════════════════════
// 检测叙事中NPC被赋予的头衔/身份是否与canon数据一致
// 高Title错配（如古月方正→大长老）→ critical
// 一般Title偏差 → warning
const CRITICAL_TITLE_MISMATCH: Record<string, string[]> = {
  // 古月山寨成员不可担任山寨高层
  '古月方正': ['族长', '大长老', '太上长老', '家老', '寨主'],
  '古月漠北': ['族长', '大长老', '太上长老', '家老'],
  '古月青书': ['族长', '大长老', '太上长老', '家老'],
  '古月赤城': ['族长', '大长老', '太上长老', '家老'],
  '古月药乐': ['族长', '大长老', '太上长老', '家老'],
};

function c13_NPCRoleConsistency(text: string, store: RootStore): CanaryResult {
  const npcDb = (npcsRaw as any).npcDatabase as Record<string, any>;
  if (!npcDb) {
    return { ruleId: 'C13', ruleName: 'NPC角色一致性', passed: true, level: 'warning', details: '' };
  }

  const flags: Record<string, any> = (store as any).flags || {};

  // 匹配模式：{人名}（是/作为/担任/成为/当上）{头衔}
  const rolePattern = /(古月\S{1,3}|[^\s，。、]{2,4})(?:是|作为|担任|成为|当上|已是|已是|身为一?)([^\s，。、]{2,6}(?:长老|族长|寨主|首领|堂主|宗主|仙尊|魔尊|蛊仙|蛊师|强者|高手|天才|傀儡|棋子))/g;

  let match: RegExpExecArray | null;
  const mismatches: string[] = [];

  while ((match = rolePattern.exec(text)) !== null) {
    const npcName = match[1];
    const claimedTitle = match[2];
    const npcData = npcDb[npcName];

    if (!npcData) continue; // 不在数据库中的NPC跳过

    // 检查flags中是否有身份覆盖
    const overrideKey = `npc_${npcName}_title_override`;
    const flagOverride = flags[overrideKey];
    if (flagOverride && claimedTitle.includes(flagOverride)) {
      continue; // flags已覆盖，允许
    }

    // 检查dynamicTitles中是否匹配
    if (npcData.dynamicTitles) {
      const allTitles = Object.values(npcData.dynamicTitles) as string[];
      const anyTitleMatch = allTitles.some((t: string) => t.includes(claimedTitle));
      if (anyTitleMatch) continue;
    }

    // 检查canon title/rank是否匹配
    const canonTitle = npcData.title || '';
    const canonRank = npcData.rank || '';
    if (canonTitle.includes(claimedTitle) || canonRank.includes(claimedTitle)) {
      continue;
    }

    // 检查关键错配列表
    const criticalMismatchList = CRITICAL_TITLE_MISMATCH[npcName];
    if (criticalMismatchList && criticalMismatchList.some(t => claimedTitle.includes(t))) {
      mismatches.push(`[CRITICAL] ${npcName}被赋予「${claimedTitle}」，但canon中该角色不可担任此职位`);
    } else {
      mismatches.push(`${npcName}被赋予「${claimedTitle}」，canon身份为「${canonTitle} ${canonRank}」`);
    }
  }

  if (mismatches.length === 0) {
    return { ruleId: 'C13', ruleName: 'NPC角色一致性', passed: true, level: 'warning', details: '' };
  }

  const hasCritical = mismatches.some(m => m.startsWith('[CRITICAL]'));
  return {
    ruleId: 'C13',
    ruleName: 'NPC角色一致性',
    passed: !hasCritical,
    level: hasCritical ? 'critical' : 'warning',
    details: mismatches.join('；'),
  };
}

// ═══════════════════════════════════════════
// C14: 仙蛊唯一性守卫 ⚡ Critical (P3)
// ═══════════════════════════════════════════
// 同一仙蛊世间只能存在一只，不可出现"两只春秋蝉"等描述
const UNIQUE_IMMORTAL_GU = ['春秋蝉','定仙游','坚持仙蛊','宿命蛊','梦蝶蛊','智慧蛊','至尊仙胎蛊','力量蛊','天元宝皇莲','升炼','天机'];
function c14_ImmortalGuUniqueness(text: string): CanaryResult {
  for (const gu of UNIQUE_IMMORTAL_GU) {
    const count = (text.match(new RegExp(gu, 'g')) || []).length;
    if (count >= 2) {
      return { ruleId:'C14', ruleName:'仙蛊唯一性', passed:false, level:'critical', details:`${gu}出现${count}次——仙蛊世间只能存在一只` };
    }
  }
  return { ruleId:'C14', ruleName:'仙蛊唯一性', passed:true, level:'critical', details:'' };
}

// ═══════════════════════════════════════════
// C15: 方源位置一致性 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c15_FangYuanLocation(text: string, store: RootStore): CanaryResult {
  if (!text.includes('方源')) return { ruleId:'C15', ruleName:'方源位置一致性', passed:true, level:'warning', details:'' };
  const currentDomain = (store as any).currentDomain || '南疆';
  // 检测：方源在南疆时，不应在其他域被描写为"出现"
  const otherDomains = ['北原','东海','西漠','中洲'].filter(d => d !== currentDomain);
  for (const d of otherDomains) {
    if (text.includes(d) && contains(text, ['方源出现在','方源正在','方源来到'])) {
      return { ruleId:'C15', ruleName:'方源位置一致性', passed:false, level:'warning', details:`方源被描写为在${d}域活动，但当前域为${currentDomain}——跨域位置矛盾` };
    }
  }
  return { ruleId:'C15', ruleName:'方源位置一致性', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C16: 中洲正道约束 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c16_ZhongzhouOrthodox(text: string, store: RootStore): CanaryResult {
  if ((store as any).currentDomain !== '中洲') return { ruleId:'C16', ruleName:'中洲正道约束', passed:true, level:'warning', details:'' };
  const evilMethods = ['魔道手段','血祭','炼魂','夺舍','邪术','禁忌之法'];
  if (contains(text, evilMethods) && !contains(text, ['迫不得已','走投无路','堕入魔道','背叛正道'])) {
    return { ruleId:'C16', ruleName:'中洲正道约束', passed:false, level:'warning', details:'中洲正道NPC主动提议使用魔道手段但无正当理由' };
  }
  return { ruleId:'C16', ruleName:'中洲正道约束', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C17: 北原血统约束 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c17_BeiyuanBloodline(text: string, store: RootStore): CanaryResult {
  if ((store as any).currentDomain !== '北原') return { ruleId:'C17', ruleName:'北原血统约束', passed:true, level:'warning', details:'' };
  if (contains(text, ['觉醒黄金血脉','血脉觉醒','巨阳血脉']) && !contains(text, ['北原','黄金家族','王庭','血缘','试炼'])) {
    return { ruleId:'C17', ruleName:'北原血统约束', passed:false, level:'warning', details:'非北原血统者被描写为觉醒黄金血脉——血统应有域限制' };
  }
  return { ruleId:'C17', ruleName:'北原血统约束', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C18: 东海散修约束 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c18_DonghaiLooseCultivator(text: string, store: RootStore): CanaryResult {
  if ((store as any).currentDomain !== '东海') return { ruleId:'C18', ruleName:'东海散修约束', passed:true, level:'warning', details:'' };
  const orgWords = ['宗门纪律','按时报到','统一号令','队列整齐','令行禁止'];
  if (contains(text, orgWords) && !contains(text, ['散修联盟','新成立的','第一次','前所未有'])) {
    return { ruleId:'C18', ruleName:'东海散修约束', passed:false, level:'warning', details:'东海散修表现出宗门式组织纪律性——自由散漫是东海底色' };
  }
  return { ruleId:'C18', ruleName:'东海散修约束', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C19: 西漠生存约束 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c19_XimoSurvival(text: string, store: RootStore): CanaryResult {
  if ((store as any).currentDomain !== '西漠') return { ruleId:'C19', ruleName:'西漠生存约束', passed:true, level:'warning', details:'' };
  if (contains(text, ['浪费水','倒掉水','随意用水','水多得是']) && !contains(text, ['绿洲深处','水源充足','人祖遗迹'])) {
    return { ruleId:'C19', ruleName:'西漠生存约束', passed:false, level:'warning', details:'西漠NPC在非特殊情况下浪费水资源——水就是权力' };
  }
  return { ruleId:'C19', ruleName:'西漠生存约束', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C20: 南疆家族约束 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c20_NanjiangFamily(text: string, store: RootStore): CanaryResult {
  if ((store as any).currentDomain !== '南疆') return { ruleId:'C20', ruleName:'南疆家族约束', passed:true, level:'warning', details:'' };
  if (contains(text, ['外人','进入家族','权力核心','参与决策']) && !contains(text, ['联姻','入赘','为家族','多年效力'])) {
    return { ruleId:'C20', ruleName:'南疆家族约束', passed:false, level:'warning', details:'外人轻易进入南疆家族权力核心——家族封闭性是南疆底色' };
  }
  return { ruleId:'C20', ruleName:'南疆家族约束', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C21: 仙级战斗力阈值 ⚡ Critical (P3)
// ═══════════════════════════════════════════
function c21_ImmortalPowerThreshold(text: string, player: PlayerSnapshot): CanaryResult {
  if (player.realmGrand >= 6) return { ruleId:'C21', ruleName:'仙级战力阈值', passed:true, level:'critical', details:'' };
  if (contains(text, ['八转战力','亚仙尊','仙尊级别','毁天灭地','破碎虚空']) && !contains(text, ['传承','借用','临时','代价','反噬沉睡'])) {
    return { ruleId:'C21', ruleName:'仙级战力阈值', passed:false, level:'critical', details:'非蛊仙NPC展示八转级别战斗力且无合理代价说明' };
  }
  return { ruleId:'C21', ruleName:'仙级战力阈值', passed:true, level:'critical', details:'' };
}

// ═══════════════════════════════════════════
// C22: 仙蛊材料获取限制 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c22_ImmortalMaterialLock(text: string, player: PlayerSnapshot): CanaryResult {
  if (player.realmGrand >= 6) return { ruleId:'C22', ruleName:'仙蛊材料限制', passed:true, level:'warning', details:'' };
  if (contains(text, ['仙蛊材料','仙蕴','天地精华','大道碎片']) && !contains(text, ['机缘','传承','遗迹','试炼','考验'])) {
    return { ruleId:'C22', ruleName:'仙蛊材料限制', passed:false, level:'warning', details:'非蛊仙获得仙级材料但无正当获取途径(机缘/传承/遗迹)' };
  }
  return { ruleId:'C22', ruleName:'仙蛊材料限制', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C23: 天意关注度递增 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c23_HeavenWillAttention(text: string, player: PlayerSnapshot): CanaryResult {
  if (!contains(text, ['天意','天道','天庭注意','被注视'])) return { ruleId:'C23', ruleName:'天意关注递增', passed:true, level:'warning', details:'' };
  // 转数越高，天意关注应越明显——但四转以下不应该被夸张描写
  if (player.realmGrand < 4 && contains(text, ['天意降临','天道直接','天庭亲自'])) {
    return { ruleId:'C23', ruleName:'天意关注递增', passed:false, level:'warning', details:'低境界蛊师被描写为受到天意/天庭过度关注——天意关注应随境界递增' };
  }
  return { ruleId:'C23', ruleName:'天意关注递增', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C24: 大机缘代价守卫 ⚡ Critical (P3)
// ═══════════════════════════════════════════
function c24_GreatOpportunityCost(text: string): CanaryResult {
  if (!contains(text, ['大机缘','传承现世','远古遗迹','天道恩赐','仙尊遗留'])) return { ruleId:'C24', ruleName:'大机缘代价', passed:true, level:'critical', details:'' };
  const costWords = ['代价','风险','反噬','考验','试炼','危险','有可能','不确定','九死一生'];
  if (!contains(text, costWords)) {
    return { ruleId:'C24', ruleName:'大机缘代价', passed:false, level:'critical', details:'大机缘描写未提及任何代价/风险——蛊界机缘必有代价' };
  }
  return { ruleId:'C24', ruleName:'大机缘代价', passed:true, level:'critical', details:'' };
}

// ═══════════════════════════════════════════
// C25: 拍卖行诚信守卫 ⚠️ Warning (P3)
// ═══════════════════════════════════════════
function c25_AuctionIntegrity(text: string): CanaryResult {
  if (!contains(text, ['宝黄天','拍卖','竞拍','出价'])) return { ruleId:'C25', ruleName:'拍卖行诚信', passed:true, level:'warning', details:'' };
  const cheats = ['假货','赝品','欺骗','暗中操作','内定'];
  if (contains(text, cheats) && !contains(text, ['被揭露','被发现','受到惩罚','天庭介入'])) {
    return { ruleId:'C25', ruleName:'拍卖行诚信', passed:false, level:'warning', details:'拍卖行出现欺诈行为但无正当后果——宝黄天应保持基本诚信' };
  }
  return { ruleId:'C25', ruleName:'拍卖行诚信', passed:true, level:'warning', details:'' };
}

// ═══════════════════════════════════════════
// C26: 天赋效果校验 ⚡ Critical (P4)
// ═══════════════════════════════════════════
// 检测AI叙事是否违反已选天赋的benefits/costs约束
const TALENT_VIOLATIONS: Record<string, { benefits: string[]; costs: string[]; violations: string[] }> = {
  '百毒不侵': { benefits: ['毒素免疫'], costs: ['医道蛊虫效果减半'], violations: ['中毒','剧毒','毒性发作','毒发','被毒素'] },
  '百兽亲和': { benefits: ['兽类不会主动攻击'], costs: [], violations: ['被兽类攻击','猛兽来袭','兽群冲向你','被兽围攻'] },
  '影中行者': { benefits: ['隐匿不易被发现'], costs: [], violations: ['被人发现','当场抓住','暴露身形','被人认出'] },
  '铁骨': { benefits: ['骨头坚硬','肉身强韧'], costs: [], violations: ['骨折','骨骼碎裂','骨头断裂'] },
  '炎道亲和': { benefits: ['火行亲和'], costs: ['水道蛊虫炼化+1级'], violations: ['被火烧伤','火焰吞噬了你','火焰灼烧'] },
  '水道亲和': { benefits: ['水行亲和'], costs: ['炎道蛊虫炼化+1级'], violations: ['溺水','被水冲走','水压'] },
  '百炼蛊师': { benefits: ['炼蛊成功率+20%'], costs: [], violations: ['炼蛊大失败','炼蛊全毁','炼蛊失败'] },
  '阵眼天成': { benefits: ['破阵成功率+25%'], costs: [], violations: ['被困在阵法中','无法破阵','阵法将你困住'] },
  '天资卓绝': { benefits: ['修行速度+30%'], costs: ['体质虚弱'], violations: ['体魄惊人','肉身强横','轻松扛住'] },
  '毒道亲和': { benefits: ['毒道亲和'], costs: [], violations: ['毒道反噬','被自己的毒所伤','中毒倒地'] },
};

function c26_TalentEffectValidation(text: string, store: RootStore): CanaryResult {
  const talentIds = getSelectedTalentIds(store as any);
  if (!talentIds || talentIds.length === 0) return { ruleId:'C26', ruleName:'天赋效果校验', passed:true, level:'critical', details:'' };

  // 获取已选天赋的名称列表
  const knownNames = new Set(Object.keys(TALENT_VIOLATIONS));
  let activeNames: string[] = [];

  // 尝试从P4天赋池匹配
  try {
    const { P4_TALENTS } = require('../data/talents-p4');
    activeNames = talentIds
      .map((id: string) => P4_TALENTS.find((t: any) => t.id === id)?.name)
      .filter(Boolean);
  } catch {
    // 如果P4_TALENTS不可用，尝试从旧天赋匹配
    try {
      const { INITIAL_TALENTS } = require('../data/talents');
      activeNames = talentIds
        .map((id: string) => INITIAL_TALENTS.find((t: any) => t.id === id)?.name)
        .filter(Boolean);
    } catch { /* ignore */ }
  }

  // 对每个已选天赋，检查叙事是否违反
  for (const name of activeNames) {
    if (!knownNames.has(name)) continue;
    const rule = TALENT_VIOLATIONS[name];
    if (!rule) continue;

    for (const v of rule.violations) {
      if (text.includes(v)) {
        return {
          ruleId:'C26', ruleName:'天赋效果校验', passed:false, level:'critical',
          details:`玩家持有天赋"${name}"(benefits:${rule.benefits.join('/')})，但叙事中出现"${v}"——违反天赋约束`
        };
      }
    }
  }

  return { ruleId:'C26', ruleName:'天赋效果校验', passed:true, level:'critical', details:'' };
}

// ═══════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════
export function validateCanaryAssertions(
  narrative: NarrativeJSON,
  store: RootStore
): CanaryValidationResult {
  const text = narrative.narrative.text || '';

  const player: PlayerSnapshot = {
    realmGrand: store.profile.realm.grand,
    attributes: store.attributes,
    healthMax: store.vitals.health.max,
    essenceMax: store.vitals.essence.max,
    inventory: store.inventory,
  };

  const results: CanaryResult[] = [
    c01_RealmCrossCheck(text, player),
    c02_FangYuanLock(text),
    c03_RealmJump(narrative, player),
    c04_FreeLunchCheck(narrative, text),
    c05_AttrSpike(narrative, text, player),
    c06_VitalOverflow(narrative, player),
    c07_ChoiceStructure(narrative),
    c08_TextBoundary(text),
    c09_PowerFantasy(text),
    c10_NPCDeterrence(text),
    c11_GuDestruction(text),
    c12_ApertureTransform(text),
    c13_NPCRoleConsistency(text, store),
    // ═══ P3新增: C14-C25 ═══
    c14_ImmortalGuUniqueness(text),
    c15_FangYuanLocation(text, store),
    c16_ZhongzhouOrthodox(text, store),
    c17_BeiyuanBloodline(text, store),
    c18_DonghaiLooseCultivator(text, store),
    c19_XimoSurvival(text, store),
    c20_NanjiangFamily(text, store),
    c21_ImmortalPowerThreshold(text, player),
    c22_ImmortalMaterialLock(text, player),
    c23_HeavenWillAttention(text, player),
    c24_GreatOpportunityCost(text),
    c25_AuctionIntegrity(text),
    c26_TalentEffectValidation(text, store),
  ];

  const failedCritical = results.filter(r => !r.passed && r.level === 'critical');
  const failedWarning = results.filter(r => !r.passed && r.level === 'warning');

  let recommendation: CanaryValidationResult['recommendation'] = 'accept';
  if (failedCritical.length > 0) {
    recommendation = 'reject';
  } else if (failedWarning.length >= 2) {
    recommendation = 'reject'; // 2个以上warning→reject
  } else if (failedWarning.length > 0) {
    recommendation = 'warn_only';
  }

  return {
    passed: failedCritical.length === 0,
    results,
    failedCritical,
    failedWarning,
    recommendation,
  };
}
