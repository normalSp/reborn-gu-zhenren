import { useState } from 'react';
import { AchievementPanel } from './AchievementPanel';
import { AperturePanel } from './AperturePanel';
import { AttributeDetailPanel } from './AttributeDetailPanel';
import { CharacterPanel } from './CharacterPanel';
import { DaoMarkPanel } from './DaoMarkPanel';

type RoleTab = 'attributes' | 'aperture' | 'characters' | 'dao_marks' | 'achievements';

const TABS: Array<{ id: RoleTab; label: string }> = [
  { id: 'attributes', label: '属性' },
  { id: 'aperture', label: '空窍' },
  { id: 'characters', label: '人物' },
  { id: 'dao_marks', label: '道痕' },
  { id: 'achievements', label: '成就' },
];

const tabClass = (active: boolean) =>
  `rounded-sm border px-3 py-1.5 text-xs font-button transition-micro ${
    active
      ? 'border-rg-gold-400/70 bg-rg-gold-500/12 text-rg-gold-200'
      : 'border-rg-ink-300/15 bg-rg-ink-700/30 text-rg-paper-200/55 hover:text-rg-paper-100'
  }`;

export function RoleHubPanel() {
  const [tab, setTab] = useState<RoleTab>('attributes');

  return (
    <div className="flex h-full min-h-0 flex-col font-panel" data-testid="role-hub-panel">
      <div className="shrink-0 border-b border-rg-ink-300/10 bg-rg-ink-900/30 px-3 py-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="角色工作台">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tabClass(tab === item.id)}
              onClick={() => setTab(item.id)}
              data-testid={`role-hub-tab-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1" data-testid={`role-hub-content-${tab}`}>
        {tab === 'attributes' && <AttributeDetailPanel />}
        {tab === 'aperture' && <AperturePanel aperture={null} />}
        {tab === 'characters' && <CharacterPanel />}
        {tab === 'dao_marks' && <DaoMarkPanel />}
        {tab === 'achievements' && <AchievementPanel />}
      </div>
    </div>
  );
}
