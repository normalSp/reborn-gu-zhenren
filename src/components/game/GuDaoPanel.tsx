import { useState } from 'react';
import { GuInventoryPanel } from './GuInventoryPanel';
import { KillMovePanel } from './KillMovePanel';
import { MaterialBagPanel } from './MaterialBagPanel';
import { RefinePanel } from './RefinePanel';

type GuDaoTab = 'gu_inventory' | 'kill_moves' | 'refine' | 'material_bag';

const TABS: Array<{ id: GuDaoTab; label: string; hint: string }> = [
  { id: 'gu_inventory', label: '蛊虫', hint: '已拥有蛊虫、养用提示和状态。' },
  { id: 'kill_moves', label: '杀招', hint: '已知杀招、候选杀招和战斗边界。' },
  { id: 'refine', label: '炼蛊', hint: '残方、失败代价、缺口和未开放边界。' },
  { id: 'material_bag', label: '蛊材', hint: '已有蛊材和来源提示，不新增发放。' },
];

const tabClass = (active: boolean) =>
  `rounded-sm border px-3 py-1.5 text-xs font-button transition-micro ${
    active
      ? 'border-rg-jade-400/70 bg-rg-jade-500/12 text-rg-jade-200'
      : 'border-rg-ink-300/15 bg-rg-ink-700/30 text-rg-paper-200/55 hover:text-rg-paper-100'
  }`;

export function GuDaoPanel() {
  const [tab, setTab] = useState<GuDaoTab>('gu_inventory');
  const activeTab = TABS.find(item => item.id === tab) || TABS[0];

  return (
    <div className="flex h-full min-h-0 flex-col font-panel" data-testid="gu-dao-panel">
      <div className="shrink-0 border-b border-rg-ink-300/10 bg-rg-ink-900/30 px-3 py-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="蛊道工作台">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tabClass(tab === item.id)}
              onClick={() => setTab(item.id)}
              data-testid={`gu-dao-tab-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/45" data-testid="gu-dao-boundary-note">
          {activeTab.hint} 蛊道工作台只归并入口，不私算蛊方成功、材料消耗、蛊虫奖励或高阶交易。
        </p>
      </div>

      <div className="min-h-0 flex-1" data-testid={`gu-dao-content-${tab}`}>
        {tab === 'gu_inventory' && <GuInventoryPanel />}
        {tab === 'kill_moves' && <KillMovePanel />}
        {tab === 'refine' && <RefinePanel />}
        {tab === 'material_bag' && <MaterialBagPanel />}
      </div>
    </div>
  );
}
