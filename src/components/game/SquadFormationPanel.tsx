/**
 * ═══ v0.7.0 小队编成面板 — SquadFormationPanel.tsx ═══
 * 设计大纲§1.4.1: 双列表（候选成员+当前编队）、战术姿态选择、出战确认
 * ~200行
 */
import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import type { SquadMember } from '../../types';

const TACTICAL_POSTURES = ['合击', '牵制', '掠阵', '斩首'] as const;
const MAX_SQUAD_SIZE = 4;

interface MemberCardProps {
  member: SquadMember;
  action?: 'add' | 'remove' | 'none';
  onClick?: () => void;
  compact?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, action, onClick, compact }) => {
  const interestLabel = member.interestDrive >= 60 ? 'mercenary' : member.interestDrive >= 30 ? 'willing_cautious' : 'willing_eager';
  const labelColors: Record<string, string> = {
    'willing_eager': 'text-green-400',
    'willing_cautious': 'text-blue-400',
    'mercenary': 'text-yellow-400',
  };

  return (
    <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">
          {member.name}
          <span className="text-xs text-gray-500 ml-1">({member.path}{member.realm}转)</span>
        </div>
        {!compact && (
          <div className="text-xs text-gray-500 mt-1">
            信任:<span className={member.adventureTrust >= 70 ? 'text-green-400' : 'text-gray-400'}>{member.adventureTrust}</span>
            {' '}利益:<span className={member.interestDrive >= 60 ? 'text-yellow-400' : 'text-gray-400'}>{member.interestDrive}</span>
            {' '}<span className={labelColors[interestLabel] || 'text-gray-400'}>{interestLabel}</span>
          </div>
        )}
        <div className="flex gap-2 text-xs text-gray-600 mt-1">
          <span>HP:{member.hp}/{member.maxHp}</span>
          <span>ATK:{member.atk}</span>
          <span>DEF:{member.def}</span>
        </div>
      </div>
      {action === 'add' && (
        <button
          className="ml-2 text-xs bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded flex-shrink-0"
          onClick={onClick}
        >邀请</button>
      )}
      {action === 'remove' && (
        <button
          className="ml-2 text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded flex-shrink-0"
          onClick={onClick}
        >移出</button>
      )}
    </div>
  );
};

export const SquadFormationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const playerFaction = useStore(s => (s as any).playerFaction);
  const partyState = useStore(s => (s as any).partyState) || { members: [], maxSize: MAX_SQUAD_SIZE, formation: null };
  const profile = useStore(s => s.profile);
  const advanceTurn = useStore(s => (s as any).advanceTurn);
  const ap = useStore(s => s.gameTime?.ap || 0);

  const [formation, setFormation] = useState<string>(partyState.formation || '牵制');

  // 当前队伍成员
  const squadMembers = useMemo(() => partyState.members || [], [partyState]);

  // 势力中可用成员（不在队伍中的）
  const availableMembers = useMemo(() => {
    if (!playerFaction?.members) return [];
    const squadIds = new Set(squadMembers.map((m: SquadMember) => m.id));
    return playerFaction.members.filter((m: SquadMember) => !squadIds.has(m.id) && m.alive);
  }, [playerFaction, squadMembers]);

  const handleAddToSquad = (member: SquadMember) => {
    if (squadMembers.length >= MAX_SQUAD_SIZE) return;
    if (ap < 1) return;

    const store = (useStore.getState() as any);
    const newParty = {
      ...partyState,
      members: [...squadMembers, member],
      formation: formation || '牵制',
    };
    store.setState?.({ partyState: newParty });
    // 消耗1AP
    if (typeof advanceTurn === 'function') {
      advanceTurn(1);
    }
  };

  const handleRemoveFromSquad = (member: SquadMember) => {
    const store = (useStore.getState() as any);
    const newParty = {
      ...partyState,
      members: squadMembers.filter((m: SquadMember) => m.id !== member.id),
    };
    store.setState?.({ partyState: newParty });
  };

  const handleSetFormation = (f: string) => {
    setFormation(f);
    const store = (useStore.getState() as any);
    store.setState?.({ partyState: { ...partyState, formation: f } });
  };

  // 计算总战力
  const totalPower = squadMembers.reduce((sum: number, m: SquadMember) =>
    sum + m.atk + m.def + m.maxHp * 0.3, 0);
  const powerStars = Math.min(5, Math.ceil(totalPower / 200));
  const powerLabel = powerStars <= 2 ? '可挑战野兽级' : powerStars <= 3 ? '可挑战荒兽级' : '可挑战上古荒兽级';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-amber-400 mb-2">
          队伍编成（{squadMembers.length}/{MAX_SQUAD_SIZE}人）
        </h2>

        {/* 战术姿态 */}
        <div className="mb-4">
          <span className="text-xs text-gray-500 mr-2">战术姿态：</span>
          <div className="flex gap-2 mt-1">
            {TACTICAL_POSTURES.map(p => (
              <button
                key={p}
                className={`px-3 py-1 rounded text-sm ${formation === p ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => handleSetFormation(p)}
              >{p}</button>
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {formation === '合击' && '两人攻击同一目标+15%伤害'}
            {formation === '牵制' && '牵制最强敌人使其闪避-20%'}
            {formation === '掠阵' && '每回合自动恢复最低HP队友5%HP'}
            {formation === '斩首' && '首击+10%暴击，优先集火最弱敌人'}
          </div>
        </div>

        {/* 当前编队 */}
        <div className="mb-4">
          <h3 className="text-sm text-gray-400 mb-2">当前编队</h3>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: MAX_SQUAD_SIZE }).map((_, i) => {
              const member = squadMembers[i];
              return member ? (
                <MemberCard key={member.id} member={member} action="remove" onClick={() => handleRemoveFromSquad(member)} />
              ) : (
                <div key={`empty_${i}`} className="bg-gray-800/50 rounded p-2 border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm h-20">
                  空位
                </div>
              );
            })}
          </div>
        </div>

        {/* 战力评估 */}
        <div className="mb-4 text-center text-sm">
          <span className="text-gray-500">队伍总战力：</span>
          <span className="text-amber-400">{'★'.repeat(powerStars)}{'☆'.repeat(5 - powerStars)}</span>
          <span className="text-gray-500 ml-2">({powerLabel})</span>
        </div>

        {/* 可邀请NPC */}
        <div>
          <h3 className="text-sm text-gray-400 mb-2">
            可邀请 ({availableMembers.length}人可用)
            <span className="text-xs text-gray-600 ml-2">（调NPC入队消耗1AP）</span>
          </h3>
          {availableMembers.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">无可用成员。招募NPC加入势力后可编入队伍。</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableMembers.map((m: SquadMember) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  action="add"
                  onClick={() => handleAddToSquad(m)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded"
            onClick={onClose}
          >
            确认编队{squadMembers.length > 0 ? '并出发' : ''}
          </button>
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            onClick={onClose}
          >取消</button>
        </div>
      </div>
    </div>
  );
};
