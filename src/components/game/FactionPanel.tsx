/**
 * ═══ v0.7.0 势力管理面板 — FactionPanel.tsx ═══
 * 设计大纲§1.2: 三Tab布局（总览/成员/事件），支持创建/招募/维护
 * ~300行
 */
import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import type { SquadMember, PlayerFaction, FactionEvent } from '../../types';

const DOMAINS = ['南疆', '北原', '东海', '西漠', '中洲'] as const;
const FACTION_TYPES = ['正派', '魔道', '散修联盟', '家族'] as const;
const DOMAIN_TEMPLATES: Record<string, string[]> = {
  '南疆': ['XX山寨', 'XX洞府', 'XX山'],
  '北原': ['XX部', 'XX王庭', '黄金XX'],
  '东海': ['XX岛', 'XX盟', 'XX楼'],
  '西漠': ['XX绿洲', 'XX古城', 'XX沙海'],
  '中洲': ['XX派', 'XX门', 'XX院'],
};

type Tab = 'overview' | 'members' | 'events';

export const FactionPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<string>('南疆');
  const [factionType, setFactionType] = useState<PlayerFaction['type']>('散修联盟');

  const playerFaction = useStore(s => (s as any).playerFaction as PlayerFaction | null);
  const factionEvents = useStore(s => (s as any).factionEvents as FactionEvent[]);
  const createFaction = useStore(s => (s as any).createFaction as (n: string, d: string, t: string) => boolean);
  const disbandFaction = useStore(s => (s as any).disbandFaction as () => void);
  const recruitMember = useStore(s => (s as any).recruitMember as (m: SquadMember) => boolean);
  const dismissMember = useStore(s => (s as any).dismissMember as (id: string) => void);
  const upgradeFaction = useStore(s => (s as any).upgradeFaction as () => boolean);
  const currency = useStore(s => s.currency);
  const immortalCurrency = useStore(s => s.immortalCurrency);
  const realm = useStore(s => s.profile.realm.grand);
  const characterRelations = useStore(s => (s as any).characterRelations || []);

  // 可用NPC筛选（好感>=60, 已在势力跳过）
  const availableNPCs = useMemo(() => {
    return characterRelations
      .filter((r: any) => r.affinity >= 60 && r.relation_type !== 'enemy')
      .filter((r: any) => !playerFaction?.members.some(m => m.name === r.name || m.npcId === r.character_id))
      .map((r: any) => ({
        ...r,
        recruitBaseLoyalty: Math.floor(r.affinity / 2),
      }));
  }, [characterRelations, playerFaction]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createFaction(name.trim(), domain, factionType);
  };

  const handleRecruitNPC = (npc: any) => {
    const member: SquadMember = {
      id: `sm_${Date.now()}`,
      name: npc.name,
      npcId: npc.character_id,
      path: npc.path || '未知',
      realm: realm,
      loyalty: npc.recruitBaseLoyalty || 40,
      personality: 'cautious',
      alive: true,
      hp: 100 + realm * 50,
      maxHp: 100 + realm * 50,
      atk: 20 + realm * 10,
      def: 10 + realm * 5,
      adventureTrust: 40,
      interestDrive: 30,
    };
    recruitMember(member);
  };

  // 未创建势力 → 显示创建表单
  if (!playerFaction) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div
          className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto text-gray-200"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-amber-400 mb-4">创立势力</h2>

          <label className="block text-sm text-gray-400 mb-1">势力名称（8字以内）</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 mb-4"
            maxLength={8}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入势力名..."
          />

          <label className="block text-sm text-gray-400 mb-1">所属域</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {DOMAINS.map(d => (
              <button
                key={d}
                className={`px-3 py-1 rounded text-sm ${domain === d ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setDomain(d)}
              >{d}</button>
            ))}
          </div>

          {domain && DOMAIN_TEMPLATES[domain] && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-gray-500 w-full">模板参考：</span>
              {DOMAIN_TEMPLATES[domain].map(t => (
                <button
                  key={t}
                  className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded hover:bg-gray-600"
                  onClick={() => setName(t.replace('XX', ''))}
                >{t}</button>
              ))}
            </div>
          )}

          <label className="block text-sm text-gray-400 mb-1">势力类型</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {FACTION_TYPES.map(t => (
              <button
                key={t}
                className={`px-3 py-1 rounded text-sm ${factionType === t ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setFactionType(t)}
              >{t}</button>
            ))}
          </div>

          <div className="text-sm text-gray-500 mb-4">
            {realm >= 6
              ? `创建消耗：3,000仙元石（当前：${immortalCurrency || 0}）`
              : `创建消耗：8,000元石（当前：${currency || 0}）`}
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded disabled:opacity-50"
              disabled={!name.trim()}
              onClick={handleCreate}
            >创建势力</button>
            <button
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
              onClick={onClose}
            >取消</button>
          </div>
        </div>
      </div>
    );
  }

  // 已有势力 → 管理面板
  const isImmortal = realm >= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-0 w-full max-w-2xl max-h-[85vh] flex flex-col text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-amber-400">{playerFaction.name}</h2>
            <span className="text-xs text-gray-500">
              {playerFaction.type} · {playerFaction.domain} · Lv.{playerFaction.level}
            </span>
          </div>
          <button className="text-gray-500 hover:text-red-400 text-sm" onClick={disbandFaction}>解散</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['overview', 'members', 'events'] as Tab[]).map(t => (
            <button
              key={t}
              className={`flex-1 py-2 text-sm ${tab === t ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setTab(t)}
            >
              {{ overview: '总览', members: `成员(${playerFaction.members.length}/${playerFaction.maxMembers})`, events: '事件' }[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">等级</span><span className="ml-2 text-amber-300">{playerFaction.level}</span></div>
                <div><span className="text-gray-500">声望</span><span className="ml-2">{playerFaction.reputation}</span></div>
                <div><span className="text-gray-500">成员</span><span className="ml-2">{playerFaction.members.length}/{playerFaction.maxMembers}</span></div>
                <div><span className="text-gray-500">元石</span><span className="ml-2">{playerFaction.resources.元石}</span></div>
              </div>
              <div className="text-xs text-gray-500">
                创建于第{playerFaction.foundedAt}回合 · 维护费≈{isImmortal ? `${playerFaction.level * 12 + Math.max(0, playerFaction.members.length - 3) * 12}仙元/轮` : '按元石折算'}
              </div>
              <button
                className="w-full bg-amber-700 hover:bg-amber-600 text-white py-2 rounded text-sm disabled:opacity-50"
                onClick={upgradeFaction}
                disabled={playerFaction.level >= (isImmortal ? 10 : 5)}
              >
                升级势力 (Lv.{playerFaction.level + 1})
              </button>
            </div>
          )}

          {tab === 'members' && (
            <div className="space-y-3">
              {playerFaction.members.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">暂无成员，从下方NPC中招募</p>
              )}
              {playerFaction.members.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded p-3">
                  <div>
                    <div className="text-sm">{m.name} <span className="text-xs text-gray-500">({m.path}{m.realm}转)</span></div>
                    <div className="text-xs text-gray-500">
                      忠诚:{m.loyalty} · 信任:{m.adventureTrust} · 利益:{m.interestDrive}
                    </div>
                    <div className="w-24 h-1 bg-gray-700 rounded mt-1">
                      <div className="h-1 bg-amber-500 rounded" style={{ width: `${m.loyalty}%` }} />
                    </div>
                  </div>
                  <button
                    className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => dismissMember(m.id)}
                  >开除</button>
                </div>
              ))}
              {availableNPCs.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">可招募NPC（好感≥60）：</div>
                  {availableNPCs.map(npc => (
                    <div key={npc.character_id} className="flex items-center justify-between bg-gray-800 rounded p-2 mb-1">
                      <div className="text-sm">{npc.name} <span className="text-xs text-green-400">好感{npc.affinity}</span></div>
                      <button
                        className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded"
                        onClick={() => handleRecruitNPC(npc)}
                        disabled={playerFaction.members.length >= playerFaction.maxMembers}
                      >招募</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-2">
              {factionEvents.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">暂无势力事件</p>
              )}
              {factionEvents.map(evt => (
                <div key={evt.id} className="bg-gray-800 rounded p-3 text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                    evt.type === 'recruitment' ? 'bg-green-900 text-green-300' :
                    evt.type === 'conflict' ? 'bg-red-900 text-red-300' :
                    evt.type === 'opportunity' ? 'bg-blue-900 text-blue-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>{evt.type}</span>
                  <span className="text-gray-300">{evt.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="m-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};
