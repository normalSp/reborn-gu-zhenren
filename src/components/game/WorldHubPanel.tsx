import { useState } from 'react';
import { useStore } from '../../store';
import { EndingResolverPanel } from './EndingResolverPanel';
import { ConflictAftermathPanel } from './ConflictAftermathPanel';
import { IdentityReplayPanel } from './IdentityReplayPanel';
import { InheritanceLandPanel } from './InheritanceLandPanel';
import { LowRankSurvivalEconomyPanel } from './LowRankSurvivalEconomyPanel';
import { MerchantPanel } from './MerchantPanel';
import { RegionSamplePanel } from './RegionSamplePanel';
import { RegionalEventLedgerPanel } from './RegionalEventLedgerPanel';
import { RegionalLifePanel } from './RegionalLifePanel';
import { RouteLocationPanel } from './RouteLocationPanel';
import { RuntimeAgentProposalPanel } from './RuntimeAgentProposalPanel';
import { SocialPressurePanel } from './SocialPressurePanel';
import { SquadFormationPanel } from './SquadFormationPanel';
import { StoryAnchorPanel } from './StoryAnchorPanel';
import { TrainingGroundPanel } from './TrainingGroundPanel';

type WorldTab = 'overview' | 'route_location' | 'survival_economy' | 'social_pressure' | 'region_sample' | 'conflict_aftermath' | 'regional_life' | 'regional_ledger' | 'agent_proposal' | 'identity_replay' | 'story_anchor' | 'inheritance' | 'ending' | 'merchant' | 'training_ground' | 'squad' | 'dev_demo';

const TABS: Array<{ id: WorldTab; label: string }> = [
  { id: 'overview', label: '总览' },
  { id: 'route_location', label: '路线' },
  { id: 'survival_economy', label: '生存' },
  { id: 'social_pressure', label: '社会' },
  { id: 'region_sample', label: '区域' },
  { id: 'conflict_aftermath', label: '冲突' },
  { id: 'regional_life', label: '活世' },
  { id: 'regional_ledger', label: '账本' },
  { id: 'agent_proposal', label: '意图' },
  { id: 'identity_replay', label: '身份' },
  { id: 'story_anchor', label: '宿命' },
  { id: 'inheritance', label: '传承' },
  { id: 'ending', label: '终局' },
  { id: 'merchant', label: '商会' },
  { id: 'training_ground', label: '道场' },
  { id: 'squad', label: '小队' },
  { id: 'dev_demo', label: '演武' },
];

const tabClass = (active: boolean) =>
  `rounded-sm border px-3 py-1.5 text-xs font-button transition-micro ${
    active
      ? 'border-rg-blood-400/70 bg-rg-blood-500/12 text-rg-blood-100'
      : 'border-rg-ink-300/15 bg-rg-ink-700/30 text-rg-paper-200/55 hover:text-rg-paper-100'
  }`;

function WorldOverview() {
  const cards = [
    ['路线', '路线/地点范围只显示青茅到南疆早期外缘，不代表完整地点开放。'],
    ['生存', '低阶补给、食料、炼养用和交易窗口只做压力投影，不写库存、价格或消耗。'],
    ['社会', 'NPC 记忆、势力压力、公开事件和后续候选只读投影，不写正式关系或阵营。'],
    ['区域', '南疆低阶区域样板只读山路外缘、商队接触、散修落脚提示和城外缘门槛。'],
    ['冲突', '冲突后果只读伏击风险、追杀注意、反制缺口和小队准备，不写奖励、通缉或 NPC 生死。'],
    ['活世', '区域活世界合并路线、生存、社会、区域和冲突压力，只显示低阶生活候选。'],
    ['账本', 'WorldCore 将公开区域事件写入最小 regionalEventLedger，不写正式地点、身份、奖励或 NPC 生死。'],
    ['意图', 'L2/L3 agent 只生成 transient 候选表达，v3.7 proposal graph 只连接 synthetic/generic 多 NPC 与小势力公开压力。'],
    ['身份', '低阶身份路线只读商队临工、散修短活、护送候选、采集跑腿和消息跑腿，不写正式身份。'],
    ['宿命', '剧情锚点和高阶压力，只读或场景化显示，不授予宿命层权威。'],
    ['传承', '候选线索和试炼入口，不暗示玩家已获得传承。'],
    ['终局', '后期结局框架，不在低阶阶段开放裁决。'],
    ['商会', '交易窗口和公开接触可以显示，正式库存/价格表仍未开放。'],
    ['道场/小队', '保留作为世界/战斗承接入口，v0.17 再深化。'],
    ['演武', '开发/演示抽屉，不代表剧情战斗正式触发。'],
  ] as const;

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="world-hub-overview">
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-rg-paper-200/60">
          世界入口只负责受控显示高阶、剧情和演示内容。低阶青茅开局不常驻展示仙蛊、宝黄天、宿命裁决或结局承诺。
        </p>
        <div className="grid gap-2">
          {cards.map(([title, body]) => (
            <div key={title} className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/25 p-3">
              <p className="text-xs font-semibold text-rg-paper-100">{title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/48">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DevDemoDrawer() {
  const initBattlefieldDemo = useStore((s: any) => s.initBattlefieldDemo);
  const initQingmaoMortalBattlefieldDemo = useStore((s: any) => s.initQingmaoMortalBattlefieldDemo);
  const initBattlefieldGroupDemo = useStore((s: any) => s.initBattlefieldGroupDemo);
  const initBattlefieldLargeGroupDemo = useStore((s: any) => s.initBattlefieldLargeGroupDemo);
  const demos = [
    ['open-qingmao-battlefield-demo', '青茅', initQingmaoMortalBattlefieldDemo, '青茅山凡战视觉竖切，仅作演示。'],
    ['open-battlefield-demo', '凡战', initBattlefieldDemo, '正式凡战入口后续由剧情候选进入。'],
    ['open-battlefield-group-demo', '群像', initBattlefieldGroupDemo, '群像战演示，不代表正式群战已开放。'],
    ['open-battlefield-large-group-demo', '大阵', initBattlefieldLargeGroupDemo, '大场面演示，不代表正式大阵玩法已开放。'],
  ] as const;

  return (
    <div className="rg-scrollable h-full overflow-y-auto p-4" data-testid="debug-battlefield-demo-group">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-rg-paper-100">开发/演武抽屉</p>
          <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/45">
            这些入口用于验证战斗 UI 和视觉样板，不出现在正式底栏，也不代表剧情战斗已被触发。
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {demos.map(([testId, label, handler, hint]) => (
            <button
              key={testId}
              type="button"
              onClick={() => handler?.()}
              className="rounded-sm border border-rg-ink-300/15 bg-rg-ink-700/35 p-3 text-left transition-micro hover:border-rg-gold-400/45"
              data-testid={testId}
            >
              <span className="block text-sm font-semibold text-rg-gold-200">{label}</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-rg-paper-200/45">{hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorldHubPanel() {
  const [tab, setTab] = useState<WorldTab>('overview');

  return (
    <div className="flex h-full min-h-0 flex-col font-panel" data-testid="world-hub-panel">
      <div className="shrink-0 border-b border-rg-ink-300/10 bg-rg-ink-900/30 px-3 py-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="世界工作台">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tabClass(tab === item.id)}
              onClick={() => setTab(item.id)}
              data-testid={`world-hub-tab-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/45" data-testid="world-hub-boundary-note">
          世界入口默认只读或场景化；v3.7 意图候选只做 transient multi-NPC / small-faction proposal graph，不开放正式地点、阵营、奖励、NPC 生死、宝黄天交易或结局裁决。
        </p>
      </div>

      <div className="min-h-0 flex-1" data-testid={`world-hub-content-${tab}`}>
        {tab === 'overview' && <WorldOverview />}
        {tab === 'route_location' && <RouteLocationPanel />}
        {tab === 'survival_economy' && <LowRankSurvivalEconomyPanel />}
        {tab === 'social_pressure' && <SocialPressurePanel />}
        {tab === 'region_sample' && <RegionSamplePanel />}
        {tab === 'conflict_aftermath' && <ConflictAftermathPanel />}
        {tab === 'regional_life' && <RegionalLifePanel />}
        {tab === 'regional_ledger' && <RegionalEventLedgerPanel />}
        {tab === 'agent_proposal' && <RuntimeAgentProposalPanel />}
        {tab === 'identity_replay' && <IdentityReplayPanel />}
        {tab === 'story_anchor' && <StoryAnchorPanel />}
        {tab === 'inheritance' && <InheritanceLandPanel />}
        {tab === 'ending' && <EndingResolverPanel />}
        {tab === 'merchant' && <MerchantPanel />}
        {tab === 'training_ground' && <TrainingGroundPanel />}
        {tab === 'squad' && <SquadFormationPanel />}
        {tab === 'dev_demo' && <DevDemoDrawer />}
      </div>
    </div>
  );
}
