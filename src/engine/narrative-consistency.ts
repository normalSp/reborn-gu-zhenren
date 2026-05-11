import guDatabaseRaw from '../canon/gu-database.json';
import immortalGuRaw from '../canon/immortal-gu.json';
import type { NarrativeJSON } from '../types';
import { annotateNarrativeGuChoices } from './v080-narrative-gu-affordances';
import { sanitizeOriginIdentityText } from './v080-origin-lifebound-closure';

const guDatabase = guDatabaseRaw as Record<string, any>;
const immortalGu = immortalGuRaw as Record<string, any>;

const KNOWN_GU_NAMES = new Set<string>([
  ...Object.keys(guDatabase).filter(key => !key.startsWith('_')),
  ...Object.keys(immortalGu).filter(key => !key.startsWith('_')),
]);

export interface RewardConsistencyIssue {
  kind: 'unknown_gu_reward' | 'missing_gu_state_update' | 'essence_text_mismatch' | 'start_profile_identity_mismatch';
  name?: string;
  detail: string;
}

export interface ChoiceAffordanceIssue {
  kind: 'unowned_gu_use' | 'unknown_gu_affordance' | 'missing_gu_affordance' | 'utility_mismatch' | 'forbidden_gu_gate';
  name: string;
  choiceId?: string;
  detail: string;
  utilityId?: string;
}

export interface NarrativeConsistencyResult {
  narrative: NarrativeJSON;
  rewardIssues: RewardConsistencyIssue[];
  choiceIssues: ChoiceAffordanceIssue[];
}

function ownedGuNames(store: any): Set<string> {
  return new Set((store?.inventory || []).map((gu: any) => gu?.name || gu?.specId).filter(Boolean));
}

function pendingGuAdds(update: any): Set<string> {
  const raw = update?.gu_inventory?.add;
  if (!raw) return new Set();
  if (Array.isArray(raw)) {
    return new Set(raw.map((entry: any) => typeof entry === 'string' ? entry : entry?.name || entry?.specId).filter(Boolean));
  }
  if (typeof raw === 'object') return new Set(Object.keys(raw));
  return new Set();
}

function ensureDiscovery(update: any, name: string, reason: string): any {
  const next = { ...(update || {}) };
  const discoveries = { ...(next.discoveries || {}) };
  const add = Array.isArray(discoveries.add) ? [...discoveries.add] : [];
  add.push({
    id: `ai_unverified_gu_${name}_${Date.now()}`,
    name,
    type: 'unknown',
    source: 'ai-rumor',
    note: reason,
    runtimeAllowed: false,
  });
  next.discoveries = { ...discoveries, add };
  return next;
}

function extractAcquiredGuNames(text: string): string[] {
  const names = new Set<string>();
  const pattern = /(获得|得到|收下|收入|捡到|拿到|炼成|买下|夺得|发现了?一只|发现了?这只)[^。；，、\n]{0,12}?([\u4e00-\u9fa5]{1,12}蛊)/g;
  for (const match of text.matchAll(pattern)) {
    const name = match[2]?.replace(/^(了|一只|这只|那只|「|『)/, '');
    if (name && !name.includes('蛊材')) names.add(name);
  }
  return [...names];
}

function sanitizeEssenceText(text: string, store: any, issues: RewardConsistencyIssue[]): string {
  const essence = store?.vitals?.essence;
  const max = Math.max(1, Number(essence?.max || 1));
  const current = Number(essence?.current || 0);
  const pct = current / max;
  if (pct < 0.5) return text;
  const patterns = [
    /真元所剩无几/g,
    /真元近乎枯竭/g,
    /真元即将耗尽/g,
    /真元不足四成/g,
    /真元不足三成/g,
    /真元仅余不足四成/g,
  ];
  let next = text;
  for (const pattern of patterns) {
    if (pattern.test(next)) {
      issues.push({
        kind: 'essence_text_mismatch',
        detail: `当前真元 ${current}/${max}，不允许描述为所剩无几。`,
      });
      next = next.replace(pattern, '真元尚余过半');
    }
  }
  return next;
}

function sanitizeStartProfileIdentityText(text: string, store: any, issues: RewardConsistencyIssue[]): string {
  const originSanitized = sanitizeOriginIdentityText(text, store);
  if (originSanitized.changed) {
    issues.push({
      kind: 'start_profile_identity_mismatch',
      detail: originSanitized.detail || '出身深线身份边界已降级。',
    });
    return originSanitized.text;
  }

  const flags = store?.flags || {};
  const startProfileId = String(flags._start_profile || '');
  if (!startProfileId || startProfileId === 'start_qingmaoshan_guyue') return text;

  const replacement = String(flags._start_role || flags._faction_name || '外来蛊师');
  const forbiddenIdentityPatterns = [
    /古月山寨族学弟子/g,
    /古月山寨弟子/g,
    /古月一族弟子/g,
    /古月家族弟子/g,
    /古月族学弟子/g,
    /古月族人/g,
    /族学弟子/g,
  ];

  let next = text;
  for (const pattern of forbiddenIdentityPatterns) {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      issues.push({
        kind: 'start_profile_identity_mismatch',
        detail: `开局路由为 ${startProfileId}，AI 文本不得把玩家写成古月族人，已改为「${replacement}」。`,
      });
    }
  }
  return next;
}

function sanitizeChoiceText(choice: any, store: any, owned: Set<string>, issues: ChoiceAffordanceIssue[]): any {
  const text = String(choice?.text || '');
  const useMatch = text.match(/使用[「『]?([\u4e00-\u9fa5]{1,12}蛊)[」』]?/);
  if (!useMatch) return choice;
  const name = useMatch[1];
  const temporaryTokens = store?.flags?.temporaryGuUse || store?.flags?.sceneGuTokens || {};
  if (owned.has(name) || temporaryTokens?.[name]) return choice;
  issues.push({
    kind: 'unowned_gu_use',
    name,
    choiceId: choice?.id,
    detail: `玩家未持有 ${name}，也没有场景授权，不能显示为可执行使用。`,
  });
  return {
    ...choice,
    text: text.replace(useMatch[0], `寻找「${name}」线索`),
    risk_note: `${choice?.risk_note || ''}${choice?.risk_note ? '；' : ''}系统校验：你尚未持有${name}，此选项已降级为线索行动。`,
  };
}

export function sanitizeNarrativeConsistency(narrative: NarrativeJSON, store: any): NarrativeConsistencyResult {
  const rewardIssues: RewardConsistencyIssue[] = [];
  const choiceIssues: ChoiceAffordanceIssue[] = [];
  const owned = ownedGuNames(store);
  const pendingAdds = pendingGuAdds(narrative.state_update);
  let stateUpdate = narrative.state_update;
  let text = sanitizeStartProfileIdentityText(
    sanitizeEssenceText(narrative.narrative.text, store, rewardIssues),
    store,
    rewardIssues
  );

  for (const name of extractAcquiredGuNames(text)) {
    if (owned.has(name) || pendingAdds.has(name)) continue;
    const known = KNOWN_GU_NAMES.has(name);
    rewardIssues.push({
      kind: known ? 'missing_gu_state_update' : 'unknown_gu_reward',
      name,
      detail: known
        ? `叙事声称获得 ${name}，但没有合法 gu_inventory.add。`
        : `叙事声称获得未登记蛊虫 ${name}，只能转为线索。`,
    });
    stateUpdate = ensureDiscovery(stateUpdate, name, known ? '叙事声称获得蛊虫，但缺少合法库存写入，转为待确认线索。' : 'AI 提到未登记蛊虫，转为待审线索。');
    text = text.replace(new RegExp(`(获得|得到|收下|收入|捡到|拿到|炼成|买下|夺得)(了|一只|这只|那只|「|『)?${name}`, 'g'), `听闻了「${name}」线索`);
  }

  const guChoiceResult = annotateNarrativeGuChoices({
    ...narrative,
    narrative: {
      ...narrative.narrative,
      text,
    },
    state_update: stateUpdate,
  }, store);
  choiceIssues.push(...guChoiceResult.issues.map(issue => ({
    kind: issue.kind,
    name: issue.sourceName || '未知蛊虫',
    choiceId: issue.choiceId,
    detail: issue.detail,
    utilityId: issue.utilityId,
  })));

  const choices = (guChoiceResult.narrative.narrative.choices || []).map(choice => {
    const sanitized = choice;
    return {
      ...sanitized,
      text: sanitizeStartProfileIdentityText(
        sanitizeEssenceText(String(sanitized.text || ''), store, rewardIssues),
        store,
        rewardIssues
      ),
      risk_note: sanitizeStartProfileIdentityText(
        sanitizeEssenceText(String(sanitized.risk_note || ''), store, rewardIssues),
        store,
        rewardIssues
      ),
    };
  });

  return {
    narrative: {
      ...narrative,
      narrative: {
        ...narrative.narrative,
        text,
        choices,
      },
      state_update: stateUpdate,
    },
    rewardIssues,
    choiceIssues,
  };
}
