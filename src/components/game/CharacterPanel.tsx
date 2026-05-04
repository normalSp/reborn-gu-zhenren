import { useStore } from '../../store';
import { CHAR_IMAGE_MAP } from '../../data/image-maps';

const RELATION_COLORS: Record<string, string> = {
  friend: 'var(--gu-life-verdant)',
  rival: 'var(--gu-life-crimson)',
  romance: 'var(--gu-trace-gold-bright)',
  family: 'var(--gu-life-azure)',
  mentor: 'var(--gu-trace-gold)',
  ally: 'var(--gu-life-verdant)',
  enemy: 'var(--gu-life-crimson)',
  stranger: 'var(--gu-trace-slate-light)',
};

const RELATION_LABELS: Record<string, string> = {
  friend: '友人',
  rival: '劲敌',
  romance: '情缘',
  family: '家人',
  mentor: '师长',
  ally: '盟友',
  enemy: '仇敌',
  stranger: '路人',
};

export function CharacterPanel() {
  const characterRelations = useStore(s => s.characterRelations);
  const standings = useStore(s => s.standings);
  const initDialogue = useStore((s: any) => s.initDialogue);
  const activeDialogue = useStore((s: any) => s.activeDialogue);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── 角色关系网 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">
            人物图鉴
            <span className="text-rg-paper-200/40 text-xs font-panel ml-2">
              （{characterRelations.length}人）
            </span>
          </h3>
          {characterRelations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-rg-paper-200/30 text-xs font-panel mb-1">
                尚未结识任何人
              </p>
              <p className="text-rg-paper-200/20 text-xs font-panel">
                江湖路远，缘分未至
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {characterRelations.map((char, i) => {
                const color = RELATION_COLORS[char.relation_type] || 'var(--gu-trace-slate-light)';
                const label = RELATION_LABELS[char.relation_type] || char.relation_type;
                const trustPct = Math.min(100, Math.max(0, char.trust));
                const affinityPct = Math.min(100, Math.max(0, (char.affinity + 100) / 2));
                return (
                  <div
                    key={char.character_id || `npc-${i}`}
                    className="bg-rg-ink-800/50 border border-rg-ink-300/8 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {CHAR_IMAGE_MAP[char.name] && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-rg-gold/20 shrink-0">
                          <img src={`/rebrng/characters/canon/${CHAR_IMAGE_MAP[char.name]}`}
                            alt={char.name} loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="text-rg-paper-200 text-sm font-panel font-semibold">
                        {char.name}
                      </span>
                      <span
                        className="text-xs font-panel px-2 py-0.5 rounded-sm"
                        style={{ background: color, color: 'var(--gu-text-primary)' }}
                      >
                        {label}
                      </span>
                      {typeof initDialogue === 'function' && (
                        activeDialogue?.npcId === char.character_id ? (
                          <span className="text-[10px] text-rg-gold-400/50 cursor-default">对话中</span>
                        ) : (
                          <button
                            className="text-[10px] text-rg-gold-400 hover:underline cursor-pointer"
                            onClick={() => {
                              const npcFaction = (standings as any)?.[char.character_id]?.faction_id || char.character_id;
                              initDialogue(char.character_id, char.name, '性格未详', npcFaction, char.affinity || 0);
                            }}
                          >对话</button>
                        )
                      )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-rg-paper-200/50 text-xs font-panel w-12">好感</span>
                        <div className="flex-1 h-1.5 bg-rg-ink-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${affinityPct}%`,
                              background: char.affinity >= 0
                                ? 'linear-gradient(90deg, var(--gu-life-verdant), var(--gu-success))'
                                : 'linear-gradient(90deg, var(--gu-life-crimson), var(--gu-life-crimson-dim))',
                            }}
                          />
                        </div>
                        <span className="text-rg-paper-200/60 text-xs font-panel w-8 text-right tabular-nums">
                          {char.affinity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rg-paper-200/50 text-xs font-panel w-12">信任</span>
                        <div className="flex-1 h-1.5 bg-rg-ink-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${trustPct}%`,
                              background: 'linear-gradient(90deg, var(--gu-life-azure), var(--gu-info))',
                            }}
                          />
                        </div>
                        <span className="text-rg-paper-200/60 text-xs font-panel w-8 text-right tabular-nums">
                          {char.trust}
                        </span>
                      </div>
                    </div>

                    {char.known_secrets?.length > 0 && (
                      <div className="mt-2 text-xs font-panel">
                        <span className="text-rg-paper-200/40">已知秘密: </span>
                        <span className="text-rg-paper-200/50">
                          {char.known_secrets.slice(0, 3).join('、')}
                          {char.known_secrets.length > 3 ? ` 等${char.known_secrets.length}条` : ''}
                        </span>
                      </div>
                    )}
                    {char.revealed_to_them?.length > 0 && (
                      <div className="mt-1 text-xs font-panel">
                        <span className="text-rg-paper-200/40">已暴露: </span>
                        <span className="text-rg-paper-200/50">
                          {char.revealed_to_them.slice(0, 3).join('、')}
                          {char.revealed_to_them.length > 3 ? ` 等${char.revealed_to_them.length}条` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 势力声望 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">势力声望</h3>
          {Object.keys(standings).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-rg-paper-200/30 text-xs font-panel mb-1">
                尚未与任何势力建立关系
              </p>
              <p className="text-rg-paper-200/20 text-xs font-panel">
                行走江湖，声名未显
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(standings).map(([factionId, data]) => {
                const pct = (data.standing + 100) / 2;
                const tierColor =
                  data.standing >= 60
                    ? 'text-rg-gold'
                    : data.standing >= 30
                      ? 'text-rg-jade-400'
                      : data.standing >= 0
                        ? 'text-rg-paper-200'
                        : data.standing >= -30
                          ? 'text-rg-gold'
                          : data.standing >= -60
                            ? 'text-orange-400'
                            : 'text-rg-blood-400';
                return (
                  <div key={factionId} className="flex items-center gap-3">
                    <span className="text-rg-paper-200/80 text-xs font-panel w-20 truncate">
                      {factionId}
                    </span>
                    <div className="flex-1 h-2 bg-rg-ink-900 rounded-full overflow-hidden relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-rg-ink-300/40" />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${data.standing >= 0 ? 'bg-rg-jade-500/70' : 'bg-rg-blood-500/70'}`}
                        style={{
                          width: `${Math.abs(data.standing) / 2}%`,
                          marginLeft: data.standing >= 0 ? '50%' : `${50 - Math.abs(data.standing) / 2}%`,
                        }}
                      />
                    </div>
                    <span className="text-rg-paper-200/80 text-xs font-panel w-8 text-right tabular-nums">
                      {data.standing}
                    </span>
                    <span className={`text-xs font-panel ${tierColor} w-12 text-right`}>
                      {data.reputation_tier || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
