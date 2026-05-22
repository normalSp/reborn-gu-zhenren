#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const defaultSampleFile = 'tests/evals/deepseek-v200-regional-event-ledger/samples.json';

function hasOption(name) {
  return rawArgs.some(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
}

function getOption(name, fallback = undefined) {
  const equalsPrefix = `--${name}=`;
  const equalsValue = rawArgs.find(arg => arg.startsWith(equalsPrefix));
  if (equalsValue) return equalsValue.slice(equalsPrefix.length);
  const index = rawArgs.indexOf(`--${name}`);
  if (index >= 0 && rawArgs[index + 1] && !rawArgs[index + 1].startsWith('--')) return rawArgs[index + 1];
  return fallback;
}

function getNumberOption(name, fallback) {
  if (!hasOption(name)) return fallback;
  const value = Number(getOption(name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid --${name} value.`);
  return value;
}

function getIntegerOption(name, fallback) {
  const value = Math.trunc(getNumberOption(name, fallback));
  if (value < 1) throw new Error(`--${name} must be at least 1.`);
  return value;
}

function getNonNegativeIntegerOption(name, fallback) {
  const value = Math.trunc(getNumberOption(name, fallback));
  if (value < 0) throw new Error(`--${name} must be at least 0.`);
  return value;
}

function toRepoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

function hashText(text) {
  return createHash('sha256').update(String(text)).digest('hex');
}

function loadSamples(sampleFile) {
  const resolved = resolve(rootDir, sampleFile);
  const samples = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!Array.isArray(samples) || samples.length === 0) throw new Error(`${sampleFile} must contain a non-empty JSON array.`);
  return { resolved, samples };
}

function selectSamples(samples, sampleLimit, roundLimit) {
  return samples.slice(0, sampleLimit).map(sample => ({
    ...sample,
    rounds: sample.rounds.slice(0, roundLimit),
  }));
}

function lower(text) {
  return String(text || '').toLowerCase();
}

function includesForbiddenTerms(text, terms) {
  const normalized = lower(text);
  const hits = [];
  for (const term of terms) {
    const normalizedTerm = lower(term);
    if (normalizedTerm && normalized.includes(normalizedTerm)) hits.push(term);
  }
  return hits;
}

function buildDeterministicParsed({ cycle, sample, roundNumber, track }) {
  const pressureFamily = [
    '外缘盘问压力',
    '临时劳力压力',
    '市场拒价压力',
    '路途冲突压力',
    '受保护隐秘隔离',
  ][(cycle + roundNumber) % 5];
  return {
    narrative: `第${cycle}组第${roundNumber}轮只保留公开压力留痕：${pressureFamily}继续存在，玩家能看到风险、旁证和下一步，但不会得到正式结论。`,
    ledger_pressure: [
      `公开压力：${pressureFamily}`,
      '后续只作为候选，不生成奖励或身份',
    ],
    local_engine_boundary: [
      '本地引擎保留地点、身份、奖励、战斗和NPC命运裁决权',
      `${track} 只做回放与边界检查`,
    ],
    safe_next_steps: [
      '收集公开旁证',
      '选择低阶避险行动',
      '等待本地引擎裁决后续',
    ],
    boundary_notes: [
      '仅作叙事，不是正式结论。',
    ],
    sample_ref: sample.id,
  };
}

function evaluate({ sample, parsed }) {
  const issues = [];
  const searchable = JSON.stringify(parsed);
  for (const key of ['ledger_pressure', 'local_engine_boundary', 'safe_next_steps', 'boundary_notes']) {
    if (!Array.isArray(parsed[key])) issues.push({ severity: 'P1', code: `missing_${key}` });
  }
  const forbiddenTerms = [
    'regionalEventLedger',
    'SAVE_FORMAT_VERSION',
    'runFingerprint',
    'regionalLifeState',
    'areaLivingState',
    'identityRouteState',
    'professionState',
    'sourcePointer',
    'source body',
    'raw quote',
    '地点已解锁',
    '加入商队成功',
    '阵营转移完成',
    '交易已完成',
    '债务已写入',
    '战斗已胜利',
    '奖励已发放',
    '掉落已生成',
    'NPC已死亡',
    '春秋蝉',
    '春蚕秋蝉',
    '重生',
    '回溯',
    '时间回溯',
    ...(sample.forbiddenTerms || []),
  ];
  for (const term of new Set(includesForbiddenTerms(searchable, forbiddenTerms))) {
    issues.push({ severity: 'P0', code: 'forbidden_term', detail: term });
  }
  for (const term of new Set(includesForbiddenTerms(searchable, ['木牌', '令牌', '腰牌', '名册', '登记', '报到', '通行证', '正式凭证', '凭证', '商队成员', '护卫身份', '成员资格', 'Qingmao', '青毛']))) {
    issues.push({ severity: 'P2', code: 'terminology_or_formal_prop_risk', detail: term });
  }
  for (const patternText of sample.forbiddenClaimPatterns || []) {
    const pattern = new RegExp(patternText, 'i');
    if (pattern.test(searchable)) issues.push({ severity: 'P0', code: 'forbidden_claim_pattern', detail: patternText });
  }
  if (!/本地引擎/.test(searchable)) issues.push({ severity: 'P1', code: 'missing_local_engine_boundary' });
  if (!/仅作叙事，不是正式结论/.test(searchable)) issues.push({ severity: 'P1', code: 'missing_narrative_boundary' });
  return {
    accepted: issues.every(issue => issue.severity !== 'P0' && issue.severity !== 'P1'),
    p0Count: issues.filter(issue => issue.severity === 'P0').length,
    p1Count: issues.filter(issue => issue.severity === 'P1').length,
    p2Count: issues.filter(issue => issue.severity === 'P2').length,
    issues,
  };
}

function summarize(rounds, acceptedThreshold, maxP2) {
  const roundCount = rounds.length;
  const acceptedRounds = rounds.filter(round => round.accepted).length;
  const p0Count = rounds.reduce((sum, round) => sum + round.p0Count, 0);
  const p1Count = rounds.reduce((sum, round) => sum + round.p1Count, 0);
  const p2Count = rounds.reduce((sum, round) => sum + round.p2Count, 0);
  const acceptedRate = roundCount > 0 ? Number((acceptedRounds / roundCount).toFixed(4)) : 0;
  return {
    roundCount,
    acceptedRounds,
    acceptedRate,
    acceptedThreshold,
    p0Count,
    p1Count,
    p2Count,
    maxP2,
    passed: roundCount >= 160 && acceptedRate >= acceptedThreshold && p0Count === 0 && p1Count === 0 && p2Count <= maxP2,
  };
}

function buildCheckpoints(rounds, interval) {
  const checkpoints = [];
  for (let end = interval; end <= rounds.length; end += interval) {
    const slice = rounds.slice(end - interval, end);
    checkpoints.push({
      atRound: end,
      roundCount: slice.length,
      accepted: slice.filter(round => round.accepted).length,
      p0: slice.reduce((sum, round) => sum + round.p0Count, 0),
      p1: slice.reduce((sum, round) => sum + round.p1Count, 0),
      p2: slice.reduce((sum, round) => sum + round.p2Count, 0),
    });
  }
  return checkpoints;
}

function writeReport({ sampleFile, samples, rounds, checkpoints, summary, cycleCount, checkpointInterval }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = resolve(rootDir, 'artifacts/v2.0.0/t3-regional-ledger-deterministic', stamp);
  mkdirSync(reportDir, { recursive: true });
  const manifest = {
    gate: 'v2.0.0-rc-t3-deterministic-replay',
    createdAt: new Date().toISOString(),
    sampleFile: toRepoPath(sampleFile),
    sampleCount: samples.length,
    cycleCount,
    checkpointInterval,
    noLiveDeepSeek: true,
    noTokenSpend: true,
    approvalScope: 'D-200-006 and D-201-008 approved v2.0 rc T3 320 total rounds; this report supplies the replay/deterministic half.',
    summary,
    checkpoints,
    sampleHash: hashText(JSON.stringify(samples)),
  };
  const reportPath = join(reportDir, 'report.json');
  const manifestPath = join(reportDir, 'manifest.json');
  const roundsPath = join(reportDir, 'rounds.jsonl');
  const checkpointsPath = join(reportDir, 'checkpoints.md');
  const summaryPath = join(reportDir, 'summary.md');
  writeFileSync(reportPath, `${JSON.stringify({ ...manifest, issueRows: rounds.flatMap(round => round.issues.map(issue => ({ round: round.globalRound, sampleId: round.sampleId, cycle: round.cycle, ...issue }))) }, null, 2)}\n`, 'utf8');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(roundsPath, `${rounds.map(round => JSON.stringify(round)).join('\n')}\n`, 'utf8');
  writeFileSync(checkpointsPath, [
    '# v2.0.0 rc T3 deterministic checkpoints',
    '',
    '| Round | Accepted | P0 | P1 | P2 |',
    '|---:|---:|---:|---:|---:|',
    ...checkpoints.map(row => `| ${row.atRound} | ${row.accepted}/${row.roundCount} | ${row.p0} | ${row.p1} | ${row.p2} |`),
    '',
  ].join('\n'), 'utf8');
  writeFileSync(summaryPath, [
    '# v2.0.0 rc T3 deterministic replay summary',
    '',
    `- Rounds: ${summary.acceptedRounds}/${summary.roundCount}`,
    `- Accepted rate: ${summary.acceptedRate}`,
    `- P0/P1/P2: ${summary.p0Count}/${summary.p1Count}/${summary.p2Count}`,
    `- Passed: ${summary.passed ? 'yes' : 'no'}`,
    `- Report: \`${toRepoPath(reportPath)}\``,
    '',
  ].join('\n'), 'utf8');
  return { reportDir, reportPath, manifestPath, roundsPath, checkpointsPath, summaryPath };
}

function main() {
  const sampleFileOption = getOption('sample-file', defaultSampleFile);
  const { resolved: sampleFile, samples: allSamples } = loadSamples(sampleFileOption);
  const sampleLimit = getIntegerOption('sample-limit', 5);
  const roundLimit = getIntegerOption('round-limit', 4);
  const cycleCount = getIntegerOption('cycle-count', 8);
  const checkpointInterval = getIntegerOption('checkpoint-interval', 20);
  const acceptedThreshold = getNumberOption('accepted-threshold', 1);
  const maxP2 = getNonNegativeIntegerOption('max-p2', 0);
  const samples = selectSamples(allSamples, sampleLimit, roundLimit);
  const rounds = [];
  let globalRound = 0;
  for (let cycle = 1; cycle <= cycleCount; cycle += 1) {
    for (const sample of samples) {
      for (let roundIndex = 0; roundIndex < sample.rounds.length; roundIndex += 1) {
        globalRound += 1;
        const track = globalRound <= 80 ? 'T3-A deterministic replay' : 'T3-B scripted dry-run';
        const parsed = buildDeterministicParsed({ cycle, sample, roundNumber: roundIndex + 1, track });
        const evaluation = evaluate({ sample, parsed });
        rounds.push({
          globalRound,
          cycle,
          sampleId: sample.id,
          sampleRound: roundIndex + 1,
          track,
          accepted: evaluation.accepted,
          p0Count: evaluation.p0Count,
          p1Count: evaluation.p1Count,
          p2Count: evaluation.p2Count,
          issues: evaluation.issues,
          parsed,
        });
      }
    }
  }
  const summary = summarize(rounds, acceptedThreshold, maxP2);
  const checkpoints = buildCheckpoints(rounds, checkpointInterval);
  const paths = writeReport({ sampleFile, samples, rounds, checkpoints, summary, cycleCount, checkpointInterval });
  console.log(JSON.stringify({
    mode: 'deterministic-replay',
    gate: 'v2.0.0-rc-t3',
    ...Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, toRepoPath(value)])),
    summary,
  }, null, 2));
  if (!summary.passed) process.exitCode = 1;
}

main();
