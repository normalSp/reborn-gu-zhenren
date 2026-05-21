#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  addFinding,
  exitWithSummary,
  forbiddenTextKeys,
  listFilesRecursive,
  readJson,
  root,
  summarizeFindings,
  walkObject,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'mirofish-dual-repo-pipeline';
const defaultTopic = 'southern_border_low_rank_outer_edge_life_slice';
const defaultVersion = 'v1.7.0';
const defaultMiroFishRepo = 'D:\\workspace\\CodeBuddyWorkSpace\\2026-05-12-task-1\\MiroFish';
const stageOrder = new Map([
  ['a1', 0],
  ['request', 1],
  ['export', 2],
  ['intake', 3],
  ['complete', 4],
]);

function parseArgs(argv) {
  const result = {
    version: process.env.MIROFISH_TARGET_VERSION || process.env.npm_config_target_version || process.env.npm_config_version || defaultVersion,
    topic: process.env.MIROFISH_TOPIC || process.env.npm_config_topic || defaultTopic,
    stage: process.env.MIROFISH_STAGE || process.env.npm_config_stage || 'a1',
    mirofishRepo: process.env.MIROFISH_REPO || defaultMiroFishRepo,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (key === 'version' || key === 'target-version') result.version = value;
      if (key === 'topic') result.topic = value;
      if (key === 'stage') result.stage = value;
      if (key === 'mirofish-repo') result.mirofishRepo = value;
      continue;
    }
    const next = argv[i + 1];
    if ((arg === '--version' || arg === '--target-version') && next && !next.startsWith('--')) {
      result.version = next;
      i += 1;
      continue;
    }
    if (arg === '--topic' && next && !next.startsWith('--')) {
      result.topic = next;
      i += 1;
      continue;
    }
    if (arg === '--stage' && next && !next.startsWith('--')) {
      result.stage = next;
      i += 1;
      continue;
    }
    if (arg === '--mirofish-repo' && next && !next.startsWith('--')) {
      result.mirofishRepo = next;
      i += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') result.help = true;
  }
  return result;
}

function usage() {
  console.log(`Usage:
  npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=${defaultTopic} --stage=a1

Stages:
  a1       foundation only
  request  requires RebornG request docs
  export   requires RebornG export-ready package/handoff/report
  intake   requires RebornG intake review
  complete requires test matrix or rule-draft reference

Optional:
  --mirofish-repo=<absolute path> (or MIROFISH_REPO env)
`);
}

function requireStage(current, required) {
  return (stageOrder.get(current) ?? -1) >= stageOrder.get(required);
}

function normalize(text) {
  return String(text || '').replace(/\\/g, '/');
}

function readTextSafe(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function findFilesContaining(dir, topic, extensions) {
  if (!fs.existsSync(dir)) return [];
  const normalizedTopic = normalize(topic);
  return listFilesRecursive(dir, file => extensions.some(ext => file.toLowerCase().endsWith(ext)))
    .filter(file => normalize(path.basename(file)).includes(normalizedTopic) || normalize(readTextSafe(file)).includes(normalizedTopic));
}

function checkEqual(findings, actual, expected, severity, code, message, ref) {
  if (actual !== expected) {
    addFinding(findings, severity, code, `${message}: expected=${expected} actual=${actual}`, ref);
  }
}

function scanJsonForForbiddenKeys(findings, files) {
  for (const file of files.filter(item => item.toLowerCase().endsWith('.json'))) {
    let data;
    try {
      data = readJson(file);
    } catch (error) {
      addFinding(findings, 'P1', 'export_json_parse_failure', `${path.basename(file)}: ${error.message}`, file);
      continue;
    }
    const hits = [];
    const authorityHits = [];
    walkObject(data, (key, value, pathParts) => {
      if (forbiddenTextKeys.has(key)) hits.push(pathParts.join('.'));
      if (key === 'runtimeAuthority' && value !== 'candidate_only') {
        const pathText = pathParts.join('.');
        const topLevelNoAuthority = pathText === 'canonBoundary.runtimeAuthority' && value === 'none';
        if (!topLevelNoAuthority) {
          authorityHits.push(`${pathText}: runtimeAuthority=${value}`);
        }
      }
      if (key === 'runtimeVisible' && value === true) {
        authorityHits.push(`${pathParts.join('.')}: runtimeVisible=true`);
      }
      if (key === 'deepSeekVisible' && value === true) {
        authorityHits.push(`${pathParts.join('.')}: deepSeekVisible=true`);
      }
    });
    if (hits.length) {
      addFinding(findings, 'P0', 'export_forbidden_text_keys', `${path.basename(file)} has forbidden text keys: ${hits.slice(0, 10).join(', ')}`, file);
    }
    if (authorityHits.length) {
      addFinding(findings, 'P0', 'export_authority_violation', `${path.basename(file)} authority violations: ${authorityHits.slice(0, 10).join(', ')}`, file);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}

const findings = [];
if (!stageOrder.has(args.stage)) {
  addFinding(findings, 'P1', 'invalid_stage', `Unknown stage: ${args.stage}`, 'command line');
}

const baseDir = path.join(root, '指导大纲/vMiroFish/基础包');
const manifestPath = path.join(baseDir, 'manifest.json');
const coveragePath = path.join(baseDir, 'coverage_report.json');
const processDoc = path.join(root, '指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md');
const requestDir = path.join(root, '指导大纲/vMiroFish/requests', args.version);
const exportDir = path.join(root, '指导大纲/vMiroFish', args.version, 'exports');
const intakeDir = path.join(root, '指导大纲/vMiroFish/intake-reviews', args.version);
const versionDocDir = path.join(root, '指导大纲', args.version, 'codex/00-总览');
const matrixPath = path.join(versionDocDir, `${args.version}-测试矩阵.md`);
const demandPoolPath = path.join(versionDocDir, `${args.version}-需求决策池.md`);
const mirofishRepo = path.resolve(args.mirofishRepo);

if (!fs.existsSync(processDoc)) {
  addFinding(findings, 'P1', 'missing_process_doc', 'Dual-repo pipeline process doc is missing', processDoc);
}

let manifest = null;
let coverage = null;
try {
  manifest = readJson(manifestPath);
} catch (error) {
  addFinding(findings, 'P1', 'manifest_parse_failure', error.message, manifestPath);
}
try {
  coverage = readJson(coveragePath);
} catch (error) {
  addFinding(findings, 'P1', 'coverage_parse_failure', error.message, coveragePath);
}

if (!fs.existsSync(manifestPath)) addFinding(findings, 'P1', 'missing_manifest', 'Full-book base manifest is missing', manifestPath);
if (!fs.existsSync(coveragePath)) addFinding(findings, 'P1', 'missing_coverage', 'Full-book base coverage report is missing', coveragePath);
if (manifest) {
  checkEqual(findings, manifest.chapterPackages, 2340, 'P1', 'manifest_chapter_count', 'manifest chapterPackages mismatch', manifestPath);
  checkEqual(findings, manifest.runtimeAuthority, 'candidate_only', 'P0', 'manifest_runtime_authority', 'manifest runtimeAuthority must remain candidate_only', manifestPath);
  checkEqual(findings, manifest.canonAuthority, 'human_review_required', 'P0', 'manifest_canon_authority', 'manifest canonAuthority must remain human_review_required', manifestPath);
  checkEqual(findings, manifest.runtimeVisible, false, 'P0', 'manifest_runtime_visible', 'manifest runtimeVisible must remain false', manifestPath);
  checkEqual(findings, manifest.deepSeekVisible, false, 'P0', 'manifest_deepseek_visible', 'manifest deepSeekVisible must remain false', manifestPath);
  checkEqual(findings, manifest.quoteRedacted, true, 'P0', 'manifest_quote_redacted', 'manifest quoteRedacted must remain true', manifestPath);
}
if (coverage) {
  checkEqual(findings, coverage.totals?.packages, 2340, 'P1', 'coverage_package_count', 'coverage package count mismatch', coveragePath);
  checkEqual(findings, coverage.totals?.sourcePointersBad, 0, 'P1', 'coverage_bad_source_pointers', 'coverage sourcePointersBad must remain zero', coveragePath);
  checkEqual(findings, coverage.totals?.forbiddenKeyHitsInRebornGExport, 0, 'P0', 'coverage_forbidden_key_hits', 'coverage forbiddenKeyHitsInRebornGExport must remain zero', coveragePath);
}

if (!fs.existsSync(mirofishRepo)) {
  addFinding(findings, 'P1', 'missing_mirofish_repo', `MiroFish repo not found: ${mirofishRepo}`, mirofishRepo);
} else {
  const packagePath = path.join(mirofishRepo, 'package.json');
  const specialExportScript = path.join(mirofishRepo, 'backend/scripts/build_living_world_special_export.py');
  const specialExportService = path.join(mirofishRepo, 'backend/app/services/living_world_special_export.py');
  if (!fs.existsSync(packagePath)) addFinding(findings, 'P1', 'mirofish_missing_package_json', 'MiroFish package.json missing', packagePath);
  if (!fs.existsSync(specialExportScript)) addFinding(findings, 'P1', 'mirofish_missing_special_export_script', 'Special export script missing', specialExportScript);
  if (!fs.existsSync(specialExportService)) addFinding(findings, 'P1', 'mirofish_missing_special_export_service', 'Special export service missing', specialExportService);
}

if (!fs.existsSync(path.join(root, '指导大纲/vMiroFish/requests'))) {
  addFinding(findings, 'P1', 'missing_request_root', 'RebornG request root is missing', path.join(root, '指导大纲/vMiroFish/requests'));
}
if (!fs.existsSync(path.join(root, '指导大纲/vMiroFish/intake-reviews'))) {
  addFinding(findings, 'P1', 'missing_intake_root', 'RebornG intake-review root is missing', path.join(root, '指导大纲/vMiroFish/intake-reviews'));
}

const requestFiles = findFilesContaining(requestDir, args.topic, ['.md']);
if (requireStage(args.stage, 'request') && requestFiles.length === 0) {
  addFinding(findings, 'P1', 'missing_topic_request', `No request markdown containing topic ${args.topic}`, requestDir);
}

const exportFiles = findFilesContaining(exportDir, args.topic, ['.json', '.md']);
if (requireStage(args.stage, 'export') && exportFiles.length === 0) {
  addFinding(findings, 'P1', 'missing_topic_export', `No export/handoff/report containing topic ${args.topic}`, exportDir);
}
scanJsonForForbiddenKeys(findings, exportFiles);

const intakeFiles = findFilesContaining(intakeDir, args.topic, ['.md']);
if (requireStage(args.stage, 'intake') && intakeFiles.length === 0) {
  addFinding(findings, 'P1', 'missing_topic_intake_review', `No intake review containing topic ${args.topic}`, intakeDir);
}
for (const file of intakeFiles) {
  const text = readTextSafe(file);
  if (!/(candidate_pool|rule_draft|test_sample|fact_card_draft|deferred|quarantined|rejected)/.test(text)) {
    addFinding(findings, 'P1', 'intake_missing_promotion_bucket', `${path.basename(file)} does not mention an allowed promotion bucket`, file);
  }
}

if (requireStage(args.stage, 'complete')) {
  const matrixText = readTextSafe(matrixPath);
  const demandText = readTextSafe(demandPoolPath);
  if (!matrixText.includes(args.topic) && !demandText.includes(args.topic)) {
    addFinding(findings, 'P1', 'missing_topic_in_matrix_or_demand_pool', `Topic ${args.topic} not found in test matrix or demand pool`, versionDocDir);
  }
}

const summary = summarizeFindings(findings);
const report = {
  version: args.version,
  topic: args.topic,
  stage: args.stage,
  mode: 'read_only',
  checkedAt: new Date().toISOString(),
  paths: {
    rebornGRoot: root,
    mirofishRepo,
    processDoc: path.relative(root, processDoc),
    requestDir: path.relative(root, requestDir),
    exportDir: path.relative(root, exportDir),
    intakeDir: path.relative(root, intakeDir),
  },
  summary: {
    acceptedForStage: summary.p0 === 0 && summary.p1 === 0,
    acceptedForRuntimeCanon: false,
    acceptedForDeepSeekVisibleContext: false,
    requestFiles: requestFiles.map(file => path.relative(root, file)),
    exportFiles: exportFiles.map(file => path.relative(root, file)),
    intakeFiles: intakeFiles.map(file => path.relative(root, file)),
    ...summary,
  },
  findings,
};

const reportPath = writeReport(report, `artifacts/${args.version}/mirofish-dual-repo-pipeline`);
exitWithSummary(label, reportPath, findings, `version=${args.version} topic=${args.topic} stage=${args.stage}`);
