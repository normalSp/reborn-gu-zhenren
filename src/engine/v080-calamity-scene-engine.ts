import sceneSpecsRaw from '../canon/v080-calamity-scene-specs.json';
import type { CalamityPreview, CalamitySceneKind, CalamitySceneSpec, CombatEncounterScale } from '../types';
import { buildCalamityPreview } from './v080-cultivation-calamity-engine';

interface SceneTemplate {
  kind: CalamitySceneKind;
  label: string;
  omen: string;
  entry: string;
  responses: CalamitySceneSpec['allowedResponses'];
  consequences: string[];
  combatScale?: CombatEncounterScale;
  tags: string[];
}

const sceneTemplates = (sceneSpecsRaw as { entries: SceneTemplate[] }).entries;

export function listCalamitySceneTemplates(): SceneTemplate[] {
  return sceneTemplates.slice();
}

function lowerTags(preview: CalamityPreview): Set<string> {
  return new Set((preview.tags || []).map(tag => String(tag).toLowerCase()));
}

export function selectCalamitySceneKind(preview: CalamityPreview, store: any = {}): CalamitySceneKind {
  const tags = lowerTags(preview);
  const name = String(preview.name || '');
  const resourceCount = Array.isArray(store?.aperture?.resource_nodes) ? store.aperture.resource_nodes.length : 0;

  if (tags.has('beast') || tags.has('desolate_beast') || name.includes('荒兽')) return 'desolate_beast_invasion';
  if (tags.has('human_calamity') || tags.has('enemy') || name.includes('人劫') || name.includes('敌袭')) return 'human_calamity';
  if (tags.has('killer_move') || tags.has('killer_move_pressure') || tags.has('formation') || preview.category === 'heavenly_tribulation') {
    return 'immortal_killer_pressure';
  }
  if (resourceCount >= 3 && preview.affectedResourceNodeIds.length >= 2) return 'resource_node_imbalance';
  if (preview.severity >= 4) return 'dao_mark_manifestation';
  return 'natural_disaster';
}

export function buildCalamitySceneSpec(input: {
  store: any;
  preview?: CalamityPreview | null;
  kind?: CalamitySceneKind;
  sceneId?: string;
}): CalamitySceneSpec | null {
  const preview = input.preview || buildCalamityPreview({ store: input.store });
  if (!preview) return null;

  const kind = input.kind || selectCalamitySceneKind(preview, input.store);
  const template = sceneTemplates.find(item => item.kind === kind) || sceneTemplates[0];
  const realmGrand = Number(input.store?.profile?.realm?.grand || 6);
  const sceneId = input.sceneId || input.store?.sceneSessionState?.sceneId || input.store?.currentChapterId || 'calamity_scene';
  const affected = preview.affectedResourceNodeIds || [];
  const combatScale = template.combatScale || (kind === 'human_calamity' ? 'group_5x3' : undefined);

  return {
    id: `calamity_scene_${preview.id}_${kind}_${Number(input.store?.turn || 1)}`,
    previewId: preview.id,
    name: `${preview.name} - ${template.label}`,
    kind,
    category: preview.category,
    path: preview.path,
    severity: preview.severity,
    sceneId,
    realmGrand,
    countdown: preview.countdown,
    affectedResourceNodeIds: affected,
    omenText: `${template.omen} 路 ${preview.path}，严重度 ${preview.severity}。`,
    entryText: template.entry,
    allowedResponses: template.responses,
    possibleConsequences: template.consequences,
    combatScale,
    tags: [...new Set([...preview.tags, ...template.tags, kind])],
  };
}

export function formatCalamitySceneForPrompt(spec: CalamitySceneSpec | null | undefined): string {
  if (!spec) return '';
  const affected = spec.affectedResourceNodeIds.length > 0 ? spec.affectedResourceNodeIds.join('、') : '暂未锁定';
  return [
    '【灾劫场景规格】',
    `${spec.name}：${spec.omenText}`,
    `类型：${spec.kind}；倒计时：${spec.countdown}；影响资源点：${affected}。`,
    `可写入剧情的处理方向：${spec.allowedResponses.join(' / ')}。`,
    `可能后果：${spec.possibleConsequences.join('；')}。`,
    'DeepSeek 只能写预兆、压迫和选择描述；面积、资源、道痕、伤势、蛊虫损伤和战斗胜负必须等本地引擎结算。',
  ].join('\n');
}
