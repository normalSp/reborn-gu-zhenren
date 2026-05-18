import {
  listV017CounterBoundaryViews,
  listV017SquadTacticViews,
  type V017CounterBoundaryRule,
  type V017SquadTacticRule,
} from '../../engine/v017-combat-deepening';

type V017CombatBoundaryPanelProps = {
  compact?: boolean;
};

function blockedSummary(values: string[]): string {
  const labels: Record<string, string> = {
    reward_grant: '奖励',
    gu_grant: '蛊虫发放',
    formal_currency_reward: '正式元石奖励',
    formal_extortion_profit: '正式勒索收益',
    formal_material_drop: '正式材料掉落',
    beast_loot: '兽材掉落',
    location_unlock: '地点解锁',
    faction_transfer: '阵营转移',
    npc_death: 'NPC 生死',
    hidden_fact_reveal: '隐藏事实',
    auto_kill: '自动击杀',
    unstoppable_hit: '必中无解',
    high_rank_killer_move: '高阶杀招',
    instant_refinement: '瞬间炼化',
    recipe_unlock: '蛊方解锁',
    invincible_state: '无敌状态',
    auto_victory: '自动胜利',
    normal_attack_button: '普通攻击化',
    direct_damage: '直接伤害',
    inheritance_unlock: '传承开放',
    treasure_grant: '宝物发放',
    route_success: '路线成功',
    formal_wolf_tide_resolution: '狼潮结局',
    village_fate_result: '山寨命运结论',
    formal_reputation_change: '正式声望变化',
    currency_reward: '元石奖励',
    permanent_injury: '永久伤残',
    canon_result: '正史结局',
  };
  return values.slice(0, 4).map(value => labels[value] || value).join(' / ');
}

function CounterCard({ item, compact }: { item: V017CounterBoundaryRule; compact?: boolean }) {
  return (
    <div className="rounded-md border border-rg-gold/16 bg-rg-ink-900/28 p-2" data-testid={`v017-counter-boundary-${item.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-rg-paper-100">{item.displayName}</div>
          <p className={`mt-1 text-[10px] leading-relaxed text-rg-paper-200/52 ${compact ? 'line-clamp-2' : ''}`}>{item.summary}</p>
        </div>
        <span className="rg-chip rg-chip--gold shrink-0">反制</span>
      </div>
      <div className="mt-2 line-clamp-2 text-[10px] text-rg-jade-300/62">
        {item.counterHints.slice(0, 3).join(' / ')}
      </div>
      <div className="mt-1 line-clamp-1 text-[10px] text-rg-blood-400/58">
        禁止：{blockedSummary(item.blockedImplications)}
      </div>
    </div>
  );
}

function TacticCard({ item, compact }: { item: V017SquadTacticRule; compact?: boolean }) {
  return (
    <div className="rounded-md border border-rg-jade-400/14 bg-rg-ink-900/24 p-2" data-testid={`v017-squad-tactic-${item.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-rg-paper-100">{item.displayName}</div>
          <p className={`mt-1 text-[10px] leading-relaxed text-rg-paper-200/52 ${compact ? 'line-clamp-2' : ''}`}>{item.summary}</p>
        </div>
        <span className="rg-chip rg-chip--jade shrink-0">小队</span>
      </div>
      <div className="mt-2 line-clamp-1 text-[10px] text-rg-jade-300/62">
        {item.tacticTags.slice(0, 4).join(' / ')}
      </div>
      <div className="mt-1 line-clamp-1 text-[10px] text-rg-blood-400/58">
        禁止：{blockedSummary(item.blockedEffects)}
      </div>
    </div>
  );
}

export function V017CombatBoundaryPanel({ compact = false }: V017CombatBoundaryPanelProps) {
  const counters = listV017CounterBoundaryViews();
  const tactics = listV017SquadTacticViews();
  const counterLimit = compact ? 4 : 4;
  const tacticLimit = compact ? 3 : 4;

  return (
    <section className="space-y-2" data-testid="v017-combat-boundary-panel">
      <div>
        <h3 className="text-xs font-semibold text-rg-paper-100">v0.17 战斗反制与小队边界</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/42">
          只读提示；不发放奖励、不改地点/阵营、不决定 NPC 生死，也不给 DeepSeek 新权限。
        </p>
      </div>
      <div className={`grid gap-2 ${compact ? 'sm:grid-cols-2' : ''}`}>
        {counters.slice(0, counterLimit).map(item => (
          <CounterCard key={item.id} item={item} compact={compact} />
        ))}
      </div>
      <div className={`grid gap-2 ${compact ? 'sm:grid-cols-2' : ''}`}>
        {tactics.slice(0, tacticLimit).map(item => (
          <TacticCard key={item.id} item={item} compact={compact} />
        ))}
      </div>
    </section>
  );
}
