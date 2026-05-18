import { useState } from 'react';
import { ActionPanel } from './ActionPanel';
import { FreeGoalPanel } from './FreeGoalPanel';

type ActionHubTab = 'current' | 'free_goal';

const TABS: Array<{ id: ActionHubTab; label: string; hint: string }> = [
  { id: 'current', label: '当前行动', hint: '场景行动、青茅行动、资源和战斗候选。' },
  { id: 'free_goal', label: '自由目标', hint: '长期目标、本地裁决、路线/交易/社会机会。' },
];

const tabClass = (active: boolean) =>
  `rounded-sm border px-3 py-1.5 text-xs font-button transition-micro ${
    active
      ? 'border-rg-gold-400/70 bg-rg-gold-500/12 text-rg-gold-200'
      : 'border-rg-ink-300/15 bg-rg-ink-700/30 text-rg-paper-200/55 hover:text-rg-paper-100'
  }`;

export function ActionHubPanel() {
  const [tab, setTab] = useState<ActionHubTab>('current');
  const activeTab = TABS.find(item => item.id === tab) || TABS[0];

  return (
    <div className="flex h-full min-h-0 flex-col font-panel" data-testid="action-hub-panel">
      <div className="shrink-0 border-b border-rg-ink-300/10 bg-rg-ink-900/30 px-3 py-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="行动工作台">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tabClass(tab === item.id)}
              onClick={() => setTab(item.id)}
              data-testid={`action-hub-tab-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-rg-paper-200/45" data-testid="action-hub-boundary-note">
          {activeTab.hint} 候选、只读和正式前置必须由本地引擎区分，DeepSeek 不写奖励、地点、阵营或 NPC 生死。
        </p>
      </div>

      <div className="min-h-0 flex-1" data-testid={`action-hub-content-${tab}`}>
        {tab === 'current' ? <ActionPanel /> : <FreeGoalPanel />}
      </div>
    </div>
  );
}
