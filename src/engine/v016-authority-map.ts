export type V016PrimaryNavigation = 'map' | 'actions' | 'role' | 'gu_dao' | 'world' | 'records';

export type V016LegacyEntry =
  | 'free_goal'
  | 'gu_inventory'
  | 'kill_moves'
  | 'refine'
  | 'material_bag'
  | 'attributes'
  | 'aperture'
  | 'characters'
  | 'dao_marks'
  | 'achievements'
  | 'events'
  | 'qingmao_demo'
  | 'mortal_battle_demo'
  | 'group_battle_demo'
  | 'large_group_battle_demo'
  | 'training_ground'
  | 'squad'
  | 'merchant'
  | 'inheritance'
  | 'story_anchor'
  | 'ending';

export type V016VisibilityMode = 'primary' | 'hub_tab' | 'scene_gated' | 'dev_drawer';

export interface V016NavigationResolution {
  legacyEntry: V016LegacyEntry;
  target: V016PrimaryNavigation;
  mode: V016VisibilityMode;
  authorityNote: string;
}

export interface V016AuthorityEntry {
  id: string;
  domain: 'action' | 'npc_faction' | 'economy' | 'combat' | 'high_tier' | 'ai';
  owner: 'ui' | 'store_action' | 'local_engine' | 'deepseek' | 'mirofish';
  allowed: string[];
  forbiddenInV016: string[];
}

export const V016_PRIMARY_NAVIGATION: readonly V016PrimaryNavigation[] = [
  'map',
  'actions',
  'role',
  'gu_dao',
  'world',
  'records',
];

export const V016_LEGACY_ENTRY_RESOLUTIONS: readonly V016NavigationResolution[] = [
  { legacyEntry: 'free_goal', target: 'actions', mode: 'hub_tab', authorityNote: 'World Intent Engine and living-world patch gate keep final authority.' },
  { legacyEntry: 'gu_inventory', target: 'gu_dao', mode: 'hub_tab', authorityNote: 'Owned Gu state remains the source of truth.' },
  { legacyEntry: 'kill_moves', target: 'gu_dao', mode: 'hub_tab', authorityNote: 'Kill move state and combat engines remain the source of truth.' },
  { legacyEntry: 'refine', target: 'gu_dao', mode: 'hub_tab', authorityNote: 'Refine UI shows boundaries and cannot grant recipe success.' },
  { legacyEntry: 'material_bag', target: 'gu_dao', mode: 'hub_tab', authorityNote: 'materialBag shows existing owned materials only.' },
  { legacyEntry: 'attributes', target: 'role', mode: 'hub_tab', authorityNote: 'Player stat calculations remain unchanged.' },
  { legacyEntry: 'aperture', target: 'role', mode: 'hub_tab', authorityNote: 'Aperture state remains unchanged.' },
  { legacyEntry: 'characters', target: 'role', mode: 'hub_tab', authorityNote: 'Character atlas cannot write NPC relationship facts.' },
  { legacyEntry: 'dao_marks', target: 'role', mode: 'hub_tab', authorityNote: 'Dao mark display cannot add dao-mark settlement.' },
  { legacyEntry: 'achievements', target: 'role', mode: 'hub_tab', authorityNote: 'Achievement awarding rules remain unchanged.' },
  { legacyEntry: 'events', target: 'records', mode: 'hub_tab', authorityNote: 'Event log records facts but does not create facts.' },
  { legacyEntry: 'qingmao_demo', target: 'world', mode: 'dev_drawer', authorityNote: 'Demo launch does not represent formal story combat.' },
  { legacyEntry: 'mortal_battle_demo', target: 'world', mode: 'dev_drawer', authorityNote: 'Demo launch does not represent formal story combat.' },
  { legacyEntry: 'group_battle_demo', target: 'world', mode: 'dev_drawer', authorityNote: 'Demo launch does not represent formal group combat.' },
  { legacyEntry: 'large_group_battle_demo', target: 'world', mode: 'dev_drawer', authorityNote: 'Demo launch does not represent formal formation warfare.' },
  { legacyEntry: 'training_ground', target: 'world', mode: 'scene_gated', authorityNote: 'Training display cannot add new training rewards.' },
  { legacyEntry: 'squad', target: 'world', mode: 'scene_gated', authorityNote: 'Squad display waits for v0.17 combat deepening.' },
  { legacyEntry: 'merchant', target: 'world', mode: 'scene_gated', authorityNote: 'Merchant display cannot open formal market inventory or prices.' },
  { legacyEntry: 'inheritance', target: 'world', mode: 'scene_gated', authorityNote: 'Inheritance display cannot imply acquired inheritance.' },
  { legacyEntry: 'story_anchor', target: 'world', mode: 'scene_gated', authorityNote: 'Story anchor display cannot grant fate-layer authority.' },
  { legacyEntry: 'ending', target: 'world', mode: 'scene_gated', authorityNote: 'Ending display cannot open ending resolution.' },
];

export const V016_AUTHORITY_ENTRIES: readonly V016AuthorityEntry[] = [
  {
    id: 'ui_grouping',
    domain: 'action',
    owner: 'ui',
    allowed: ['group panels', 'hide legacy toolbar entries', 'label candidate/read-only/scene-gated content'],
    forbiddenInV016: ['grant rewards', 'unlock locations', 'change faction', 'decide NPC life or capture'],
  },
  {
    id: 'action_panel',
    domain: 'action',
    owner: 'store_action',
    allowed: ['execute existing local actions', 'write through existing approved store actions'],
    forbiddenInV016: ['expand world intent authority', 'write new persistent fields'],
  },
  {
    id: 'free_goal_panel',
    domain: 'action',
    owner: 'local_engine',
    allowed: ['preview and confirm local intent through living-world patch gates', 'show route/trade/social candidates'],
    forbiddenInV016: ['turn goals into formal tasks by UI copy', 'grant route success or faction transfer'],
  },
  {
    id: 'npc_relations_legacy',
    domain: 'npc_faction',
    owner: 'store_action',
    allowed: ['remain historical relationship state'],
    forbiddenInV016: ['override livingWorldState.npcMemories as public reaction authority'],
  },
  {
    id: 'living_world_social',
    domain: 'npc_faction',
    owner: 'local_engine',
    allowed: ['read public memories', 'read faction pressure', 'read action consequences'],
    forbiddenInV016: ['write formal standing', 'write warrants', 'write recruitment', 'decide NPC life'],
  },
  {
    id: 'material_bag',
    domain: 'economy',
    owner: 'store_action',
    allowed: ['display existing owned materials'],
    forbiddenInV016: ['invent sources', 'consume materials through UI-only actions'],
  },
  {
    id: 'shop_refine_legacy',
    domain: 'economy',
    owner: 'local_engine',
    allowed: ['show historical shop/refine panels under scene-gated boundaries'],
    forbiddenInV016: ['open formal price table', 'open shop inventory', 'complete recipe success', 'grant Gu'],
  },
  {
    id: 'battlefield_demo',
    domain: 'combat',
    owner: 'local_engine',
    allowed: ['launch demo scenes from dev drawer'],
    forbiddenInV016: ['represent story combat trigger', 'grant victory rewards'],
  },
  {
    id: 'high_tier_world',
    domain: 'high_tier',
    owner: 'ui',
    allowed: ['show scene-gated or read-only high-tier panels'],
    forbiddenInV016: ['imply Immortal Gu ownership', 'open Treasure Yellow Heaven trade', 'open fate or ending resolution'],
  },
  {
    id: 'deepseek_runtime',
    domain: 'ai',
    owner: 'deepseek',
    allowed: ['write narrative', 'write candidates', 'write clues', 'write rumors', 'write pressure text'],
    forbiddenInV016: ['write rewards', 'write locations', 'write faction identity', 'write NPC life', 'write canon facts'],
  },
];

export function listV016PrimaryNavigation(): V016PrimaryNavigation[] {
  return [...V016_PRIMARY_NAVIGATION];
}

export function getV016NavigationResolution(entry: V016LegacyEntry): V016NavigationResolution | undefined {
  return V016_LEGACY_ENTRY_RESOLUTIONS.find(item => item.legacyEntry === entry);
}

export function listV016AuthorityEntries(): V016AuthorityEntry[] {
  return [...V016_AUTHORITY_ENTRIES].map(item => ({
    ...item,
    allowed: [...item.allowed],
    forbiddenInV016: [...item.forbiddenInV016],
  }));
}
