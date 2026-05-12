import fragmentsRaw from '../canon/fragment-recipes.json';
import guDatabaseRaw from '../canon/gu-database.json';
import immortalGuRaw from '../canon/immortal-gu.json';
import type { StateUpdate } from '../schemas/narrative.schema';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';
import { filterRuntimePathRecord, isRuntimePathAllowed } from './path-registry';

export type AiRewardAction = 'accepted' | 'mapped' | 'rumorOnly' | 'dropped';
export type AiRewardField =
  | 'materials.add'
  | 'recipe_fragments.add'
  | 'recipes.unlock'
  | 'gu_inventory.add'
  | 'player.dao_marks'
  | 'player.path_levels'
  | 'dao_marks'
  | 'path_levels'
  | 'combat_result'
  | 'dynamic_npcs.add';

export interface AiRewardIssue {
  field: AiRewardField;
  key: string;
  action: AiRewardAction;
  reason: string;
  suggestedKey?: string;
}

export interface AiDiscovery {
  type: 'material' | 'recipe' | 'path' | 'location' | 'npc_request' | 'trade' | 'unknown';
  name: string;
  note: string;
  source: 'ai-rumor';
}

export interface AiStateUpdateValidationContext {
  realmGrand?: number;
  currentChapterId?: string;
  currentDomain?: string;
  narrativeText?: string;
  allowImmortalMaterials?: boolean;
}

export interface AiRewardValidationResult {
  sanitized: StateUpdate & {
    recipe_fragments?: { add?: string[] };
    discoveries?: { add?: AiDiscovery[] };
  };
  accepted: AiRewardIssue[];
  mapped: AiRewardIssue[];
  rumorOnly: AiRewardIssue[];
  dropped: AiRewardIssue[];
  issues: AiRewardIssue[];
}

const fragments = ((fragmentsRaw as any).fragments || []) as Array<{ id: string; targetGu?: string }>;
const knownFragmentIds = new Set(fragments.map(fragment => fragment.id));
const guDatabase = guDatabaseRaw as Record<string, any>;
const immortalGuDatabase = immortalGuRaw as Record<string, any>;

function cloneStateUpdate(update: any): AiRewardValidationResult['sanitized'] {
  if (!update || typeof update !== 'object') return {} as any;
  return JSON.parse(JSON.stringify(update));
}

function pushIssue(result: AiRewardValidationResult, issue: AiRewardIssue): void {
  result.issues.push(issue);
  result[issue.action].push(issue);
}

function ensureDiscoveries(result: AiRewardValidationResult): AiDiscovery[] {
  const sanitized = result.sanitized as any;
  if (!sanitized.discoveries) sanitized.discoveries = {};
  if (!Array.isArray(sanitized.discoveries.add)) sanitized.discoveries.add = [];
  return sanitized.discoveries.add;
}

function addDiscovery(result: AiRewardValidationResult, discovery: AiDiscovery): void {
  const discoveries = ensureDiscoveries(result);
  if (!discoveries.some(item => item.type === discovery.type && item.name === discovery.name)) {
    discoveries.push(discovery);
  }
}

function isNonMaterialObjectName(name: string): boolean {
  return /戒指|令牌|钥匙|地图|卷轴|书信|信物|腰牌|玉简/.test(name);
}

function getRecipeName(value: unknown): string {
  if (typeof value === 'string') return value.replace(/蛊方$/, '');
  if (value && typeof value === 'object') {
    const obj = value as any;
    return String(obj.targetGu || obj.name || obj.id || '').replace(/蛊方$/, '');
  }
  return '';
}

function isKnownGuName(name: string): boolean {
  return !!guDatabase[name] || !!immortalGuDatabase[name];
}

function sanitizePathRecord(
  result: AiRewardValidationResult,
  field: AiRewardField,
  record: Record<string, any> | undefined,
): Record<string, any> | undefined {
  if (!record) return undefined;
  const next = filterRuntimePathRecord(record) || {};
  for (const path of Object.keys(record)) {
    if (!isRuntimePathAllowed(path)) {
      pushIssue(result, {
        field,
        key: path,
        action: 'dropped',
        reason: '流派未在原著运行时注册表中确认，已阻止写入数值状态。',
      });
      addDiscovery(result, {
        type: 'path',
        name: path,
        note: 'AI尝试写入未确认流派，已作为待审线索保留。',
        source: 'ai-rumor',
      });
    }
  }
  return next;
}

export function validateAIStateUpdate(
  update: StateUpdate | undefined,
  context: AiStateUpdateValidationContext = {},
): AiRewardValidationResult {
  const result: AiRewardValidationResult = {
    sanitized: cloneStateUpdate(update),
    accepted: [],
    mapped: [],
    rumorOnly: [],
    dropped: [],
    issues: [],
  };
  const sanitized = result.sanitized as any;
  const realmGrand = context.realmGrand ?? 1;
  const allowImmortalMaterials = context.allowImmortalMaterials || realmGrand >= 6;

  if (sanitized.materials?.add) {
    const nextMaterials: Record<string, number> = {};
    for (const [materialName, rawQty] of Object.entries(sanitized.materials.add)) {
      const quantity = Number(rawQty);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        pushIssue(result, {
          field: 'materials.add',
          key: materialName,
          action: 'dropped',
          reason: '材料数量不是正数。',
        });
        continue;
      }

      const entry = getMaterialEntry(materialName);
      if (entry) {
        if (entry.isImmortalMaterial && !allowImmortalMaterials) {
          pushIssue(result, {
            field: 'materials.add',
            key: materialName,
            action: 'rumorOnly',
            reason: '仙材不能在凡人/低阶场景中直接获得。',
          });
          addDiscovery(result, {
            type: 'material',
            name: materialName,
            note: 'AI提到仙材，但当前境界不足，未写入背包。',
            source: 'ai-rumor',
          });
          continue;
        }
        nextMaterials[materialName] = (nextMaterials[materialName] || 0) + quantity;
        pushIssue(result, {
          field: 'materials.add',
          key: materialName,
          action: 'accepted',
          reason: '材料存在于项目材料注册表。',
        });
        continue;
      }

      const alias = resolveMaterialAlias(materialName);
      if (alias) {
        nextMaterials[alias.id] = (nextMaterials[alias.id] || 0) + quantity;
        pushIssue(result, {
          field: 'materials.add',
          key: materialName,
          action: 'mapped',
          reason: '材料命中登记别名，已映射为项目真相源 key。',
          suggestedKey: alias.id,
        });
        continue;
      }

      if (isNonMaterialObjectName(materialName)) {
        pushIssue(result, {
          field: 'materials.add',
          key: materialName,
          action: 'rumorOnly',
          reason: '该名称像剧情物件而非蛊材，未写入材料背包。',
        });
        addDiscovery(result, {
          type: 'unknown',
          name: materialName,
          note: 'AI生成的疑似剧情物件，需人工决定是否登记为道具或线索。',
          source: 'ai-rumor',
        });
      } else {
        pushIssue(result, {
          field: 'materials.add',
          key: materialName,
          action: 'dropped',
          reason: '材料未登记，已阻止写入背包。',
        });
      }
    }
    sanitized.materials.add = nextMaterials;
  }

  if (sanitized.recipes?.unlock) {
    const unlocks = Array.isArray(sanitized.recipes.unlock) ? sanitized.recipes.unlock : [sanitized.recipes.unlock];
    for (const value of unlocks) {
      const recipeName = getRecipeName(value);
      if (!recipeName) continue;
      pushIssue(result, {
        field: 'recipes.unlock',
        key: recipeName,
        action: 'rumorOnly',
        reason: isKnownGuName(recipeName)
          ? 'AI不能直接解锁完整蛊方，需由引擎事件或残方系统完成。'
          : '目标蛊未登记，视为可疑蛊方线索。',
      });
      addDiscovery(result, {
        type: 'recipe',
        name: recipeName,
        note: 'AI声称获得蛊方，但完整蛊方解锁为引擎私有动作，未写入炼蛊系统。',
        source: 'ai-rumor',
      });
    }
    delete sanitized.recipes;
  }

  if (sanitized.recipe_fragments?.add) {
    const nextFragments: string[] = [];
    for (const fragmentId of sanitized.recipe_fragments.add) {
      if (knownFragmentIds.has(fragmentId)) {
        nextFragments.push(fragmentId);
        pushIssue(result, {
          field: 'recipe_fragments.add',
          key: fragmentId,
          action: 'accepted',
          reason: '残方 ID 已登记。',
        });
      } else {
        pushIssue(result, {
          field: 'recipe_fragments.add',
          key: fragmentId,
          action: 'dropped',
          reason: '残方 ID 未登记，已阻止写入。',
        });
      }
    }
    sanitized.recipe_fragments.add = nextFragments;
  }

  if (sanitized.gu_inventory?.add) {
    sanitized.gu_inventory.add = sanitized.gu_inventory.add.filter((gu: any) => {
      if (!isKnownGuName(gu?.name || '')) {
        pushIssue(result, {
          field: 'gu_inventory.add',
          key: gu?.name || '未知蛊虫',
          action: 'rumorOnly',
          reason: '蛊虫未登记，AI不能直接创造有数值效果的新蛊。',
        });
        addDiscovery(result, {
          type: 'unknown',
          name: gu?.name || '未知蛊虫',
          note: 'AI尝试添加未登记蛊虫，需先进入canon白名单。',
          source: 'ai-rumor',
        });
        return false;
      }
      if ((gu?.tier || 0) >= 6 || !!immortalGuDatabase[gu?.name]) {
        pushIssue(result, {
          field: 'gu_inventory.add',
          key: gu?.name || '未知仙蛊',
          action: 'rumorOnly',
          reason: '仙蛊不能通过AI叙事直接获得，需走唯一性和专门事件。',
        });
        addDiscovery(result, {
          type: 'unknown',
          name: gu?.name || '未知仙蛊',
          note: 'AI尝试直接添加仙蛊，已阻止写入。',
          source: 'ai-rumor',
        });
        return false;
      }
      if (isRuntimePathAllowed(gu?.path)) return true;
      pushIssue(result, {
        field: 'gu_inventory.add',
        key: `${gu?.name || '未知蛊虫'}:${gu?.path || '未知流派'}`,
        action: 'dropped',
        reason: '蛊虫 path 未通过原著运行时注册表。',
      });
      addDiscovery(result, {
        type: 'path',
        name: gu?.path || '未知流派',
        note: `AI尝试添加蛊虫「${gu?.name || '未知蛊虫'}」时使用非法流派。`,
        source: 'ai-rumor',
      });
      return false;
    });
  }

  if (sanitized.player?.dao_marks) {
    sanitized.player.dao_marks = sanitizePathRecord(result, 'player.dao_marks', sanitized.player.dao_marks);
  }
  if (sanitized.player?.path_levels) {
    sanitized.player.path_levels = sanitizePathRecord(result, 'player.path_levels', sanitized.player.path_levels);
  }
  if (sanitized.dao_marks) {
    sanitized.dao_marks = sanitizePathRecord(result, 'dao_marks', sanitized.dao_marks);
  }
  if (sanitized.path_levels) {
    sanitized.path_levels = sanitizePathRecord(result, 'path_levels', sanitized.path_levels);
  }

  if (sanitized.combat_result) {
    pushIssue(result, {
      field: 'combat_result',
      key: 'combat_result',
      action: 'rumorOnly',
      reason: 'AI不能直接写入正式战斗胜负、伤害、掉落或伤势；必须先登记 combat_event_candidates，由本地 battlefield 引擎结算。',
    });
    addDiscovery(result, {
      type: 'unknown',
      name: 'AI战斗结算尝试',
      note: 'AI尝试直接写入 combat_result，已降级为待审线索；正式战果必须来自本地战斗引擎。',
      source: 'ai-rumor',
    });
    delete sanitized.combat_result;
  }

  if (sanitized.dynamic_npcs?.add) {
    sanitized.dynamic_npcs.add = sanitized.dynamic_npcs.add.map((npc: any) => {
      if (!npc?.path || isRuntimePathAllowed(npc.path)) return npc;
      pushIssue(result, {
        field: 'dynamic_npcs.add',
        key: `${npc.name || '未知NPC'}:${npc.path}`,
        action: 'dropped',
        reason: '动态 NPC path 未确认，已移除该 path 字段。',
      });
      const { path: _path, ...rest } = npc;
      return rest;
    });
  }

  return result;
}

export function buildAIStateUpdateRetryHint(result: AiRewardValidationResult): string {
  const badMaterials = result.issues
    .filter(issue => issue.field === 'materials.add' && issue.action !== 'accepted')
    .map(issue => issue.key);
  const badFragments = result.issues
    .filter(issue => issue.field === 'recipe_fragments.add' && issue.action !== 'accepted')
    .map(issue => issue.key);
  const badPaths = result.issues
    .filter(issue => issue.reason.includes('流派'))
    .map(issue => issue.key);

  const lines = ['state_update语义问题：'];
  if (badMaterials.length > 0) lines.push(`- 未登记/不可获得材料：${badMaterials.join('、')}。只能使用当前允许奖励 key。`);
  if (badFragments.length > 0) lines.push(`- 未登记残方ID：${badFragments.join('、')}。只能返回 fragment-recipes.json 中存在的ID。`);
  if (badPaths.length > 0) lines.push(`- 非法流派：${badPaths.join('、')}。path 必须使用原著确认流派注册表。`);
  lines.push('- 不要直接返回 recipes.unlock；完整蛊方只能由引擎解锁。');
  lines.push('- 不要直接返回 combat_result；战斗只能先返回 combat_event_candidates，正式胜负/掉落由本地 battlefield 引擎结算。');
  return lines.join('\n');
}
