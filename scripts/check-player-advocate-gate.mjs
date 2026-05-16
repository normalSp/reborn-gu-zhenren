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
const roundRows = text
  .split(/\r?\n/)
  .filter(line => /^\|\s*\d+\s*\|/.test(line));
const uniqueRounds = new Set(
  roundRows
    .map(line => line.match(/^\|\s*(\d+)\s*\|/)?.[1])
    .filter(Boolean)
);

if (uniqueRounds.size < minRounds) {
  console.error(`[player-advocate-gate] insufficient rounds: found ${uniqueRounds.size}, expected >= ${minRounds}`);
  process.exit(1);
}

const hasConclusion = /##\s+结论/.test(text);
if (!hasConclusion) {
  console.error('[player-advocate-gate] missing conclusion section: ## 结论');
  process.exit(1);
}

console.log(`[player-advocate-gate] ok file=${file} rounds=${uniqueRounds.size} min=${minRounds}`);
