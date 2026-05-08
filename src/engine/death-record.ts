import type { DeathRecord } from '../types';

function compactList(values: unknown[], fallback: string): string[] {
  const list = values
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .slice(-5);
  return list.length > 0 ? list : [fallback];
}

function buildClosingPoem(name: string, cause: string, realm: string): { title: string; poem: string } {
  const title = `${name}道陨诗`;
  const causeLine = cause.length > 12 ? cause.slice(0, 12) : cause;
  const poem = [
    `寒灯照影问前尘，${realm}霜刃已临身。`,
    `一念贪生终有价，半途求道未成真。`,
    `${causeLine}埋荒草，残蛊无声伴旧痕。`,
    '若有来生重踏路，仍将败处炼初心。',
  ].join('\n');
  return { title, poem };
}

export function buildDeathRecordFallback(state: any): DeathRecord {
  const profile = state?.profile || {};
  const name = profile.name || '无名蛊师';
  const realm = profile.realm?.label || '一转初阶';
  const cause = state?.deathCause || '未知原因';
  const turn = state?.deathTurn || state?.turn || 1;
  const chapter = state?.currentChapterId || state?.flags?.currentChapter || state?.currentDomain || '无名之地';
  const achievements = Array.isArray(state?.unlockedAchievements) ? state.unlockedAchievements.length : 0;
  const keyChoices = compactList(
    Array.isArray(state?.keyEvents) ? state.keyEvents.map((event: any) => event.summary) : [],
    '未留下足以传世的选择。',
  );
  const relations = Array.isArray(state?.characterRelations)
    ? state.characterRelations.slice(-3).map((r: any) => r.name).filter(Boolean)
    : [];
  const { title, poem } = buildClosingPoem(name, cause, realm);

  return {
    cause,
    turn,
    chapter,
    realm,
    achievementCount: achievements,
    lifeSummary: `${name}以${realm}之身行至第${turn}回，死于${cause}。此生牵连${relations.length > 0 ? relations.join('、') : '寥寥数人'}，成就${achievements}项，所行之路仍有未竟处。`,
    closingPoem: poem,
    poemTitle: title,
    majorChoices: keyChoices,
    deathCauseTags: [cause, realm, chapter].filter(Boolean).slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}
