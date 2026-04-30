// ═══ Layer 4 金丝雀断言引擎 ═══
// 12条确定性状态感知断言（C01-C12）
// 运行在 Layer 3 语义规则引擎之前，约2ms
// 详见 doc/canary-assertion-rules.md

import type { NarrativeJSON } from '../types';
import type { RootStore } from '../store';

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
  if (!update || update.action !== 'set') {
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
// C07: 选择结构完整性 ⚡ Critical
// ═══════════════════════════════════════════
function c07_ChoiceStructure(narrative: NarrativeJSON): CanaryResult {
  const choices = narrative.narrative.choices;
  if (!choices || choices.length < 2) {
    return { ruleId: 'C07', ruleName: '选择结构完整性', passed: false, level: 'critical', details: '选项不足2个' };
  }
  const hasHigh = choices.some(c => c.risk === 'high');
  const hasLow = choices.some(c => c.risk === 'low');
  if (!hasHigh || !hasLow) {
    return { ruleId: 'C07', ruleName: '选择结构完整性', passed: false, level: 'critical', details: `缺少${!hasHigh ? '高风险' : ''}${!hasLow ? '低风险' : ''}选项` };
  }
  return { ruleId: 'C07', ruleName: '选择结构完整性', passed: true, level: 'critical', details: '' };
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
