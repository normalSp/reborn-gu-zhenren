#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

function printHelp() {
  console.log(`Usage:
  node scripts/check-player-advocate-gate.mjs --file <record.md> --min-rounds <n>
  node scripts/check-player-advocate-gate.mjs <record.md> <n>

Examples:
  npm run check:player-advocate-gate -- 指导大纲/v0.14.0/codex/00-总览/v0.14.0-a1-Player-Advocate走查记录.md 10
  npm run check:player-advocate-gate -- 指导大纲/v0.14.0/codex/00-总览/v0.14.0-rc-Player-Advocate-50轮走查记录.md 50
`);
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

const positionalArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const file = readOption('--file') || positionalArgs[0];
const minRounds = Number(readOption('--min-rounds') || positionalArgs[1]);

if (!file || !Number.isFinite(minRounds) || minRounds <= 0) {
  console.error('[player-advocate-gate] missing required record file or min rounds');
  printHelp();
  process.exit(1);
}

if (!existsSync(file)) {
  console.error(`[player-advocate-gate] record not found: ${file}`);
  process.exit(1);
}

const text = readFileSync(file, 'utf8');

const requiredSections = ['验收指标', '轮次记录', '发现', '结论'];
for (const section of requiredSections) {
  if (!new RegExp(`##\\s+${section}`).test(text)) {
    console.error(`[player-advocate-gate] missing required section: ## ${section}`);
    process.exit(1);
  }
}

const placeholderPatterns = [
  /YYYY-MM-DD/,
  /\bTBD\b/i,
  /草案\s*\/\s*已完成/,
];
for (const pattern of placeholderPatterns) {
  if (pattern.test(text)) {
    console.error(`[player-advocate-gate] unresolved placeholder found: ${pattern}`);
    process.exit(1);
  }
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

const roundRows = text
  .split(/\r?\n/)
  .filter(line => /^\|\s*\d+\s*\|/.test(line))
  .map(line => ({ line, cells: splitMarkdownRow(line) }));

const seenRounds = new Set();
let understoodRounds = 0;
let confusedRounds = 0;

for (const row of roundRows) {
  const [round, goal, context, input, feedback, understood, evaluation, category, handling] = row.cells;
  if (!round || !/^\d+$/.test(round)) continue;

  if (seenRounds.has(round)) {
    console.error(`[player-advocate-gate] duplicate round: ${round}`);
    process.exit(1);
  }
  seenRounds.add(round);

  const requiredCells = [goal, context, input, feedback, understood, evaluation, category, handling];
  if (requiredCells.some(cell => !cell)) {
    console.error(`[player-advocate-gate] incomplete round row: ${row.line}`);
    process.exit(1);
  }

  const normalizedUnderstanding = understood.toLowerCase();
  const yesValues = new Set(['yes', 'y', '是', '理解', '可理解', 'pass', '通过']);
  const noValues = new Set(['no', 'n', '否', '不理解', 'fail', '失败']);
  if (yesValues.has(normalizedUnderstanding)) {
    understoodRounds += 1;
  } else if (noValues.has(normalizedUnderstanding)) {
    confusedRounds += 1;
  } else {
    console.error(`[player-advocate-gate] understanding cell must be yes/no: round=${round} value=${understood}`);
    process.exit(1);
  }
}

if (seenRounds.size < minRounds) {
  console.error(`[player-advocate-gate] insufficient rounds: found ${seenRounds.size}, expected >= ${minRounds}`);
  process.exit(1);
}

const requiredUnderstandingRate = minRounds >= 50 ? 0.85 : 0.8;
const understandingRate = understoodRounds / seenRounds.size;
if (understandingRate < requiredUnderstandingRate) {
  console.error(`[player-advocate-gate] understanding rate too low: ${(understandingRate * 100).toFixed(1)}%, expected >= ${(requiredUnderstandingRate * 100).toFixed(0)}%`);
  process.exit(1);
}

const maxConfusedRounds = minRounds >= 50 ? 5 : 2;
if (confusedRounds > maxConfusedRounds) {
  console.error(`[player-advocate-gate] too many confused rounds: ${confusedRounds}, expected <= ${maxConfusedRounds}`);
  process.exit(1);
}

if (!/是否通过本阶段 Player Advocate gate[^\n]*[:：][^\n]*(通过|pass)/i.test(text)) {
  console.error('[player-advocate-gate] conclusion must explicitly pass the gate');
  process.exit(1);
}

console.log(`[player-advocate-gate] ok file=${file} rounds=${seenRounds.size} min=${minRounds} understandingRate=${(understandingRate * 100).toFixed(1)}% confused=${confusedRounds}`);
