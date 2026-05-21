#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  addFinding,
  exitWithSummary,
  forbiddenTextKeys,
  readJson,
  root,
  summarizeFindings,
  walkObject,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'mirofish-base-pack-inventory';
const baseDir = path.join(root, '指导大纲/vMiroFish/基础包');
const manifestPath = path.join(baseDir, 'manifest.json');
const coveragePath = path.join(baseDir, 'coverage_report.json');
const expectedCount = 2340;
const findings = [];

function checkEqual(actual, expected, severity, code, message, ref) {
  if (actual !== expected) {
    addFinding(findings, severity, code, `${message}: expected=${expected} actual=${actual}`, ref);
  }
}

function checkBoolean(actual, expected, code, message, ref) {
  if (actual !== expected) addFinding(findings, 'P0', code, `${message}: expected=${expected} actual=${actual}`, ref);
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

if (!fs.existsSync(manifestPath)) addFinding(findings, 'P1', 'missing_manifest', 'manifest.json is missing', manifestPath);
if (!fs.existsSync(coveragePath)) addFinding(findings, 'P1', 'missing_coverage', 'coverage_report.json is missing', coveragePath);

if (manifest) {
  checkEqual(manifest.chapterPackages, expectedCount, 'P1', 'manifest_chapter_packages', 'manifest chapterPackages mismatch', manifestPath);
  checkEqual(manifest.runtimeAuthority, 'candidate_only', 'P0', 'manifest_runtime_authority', 'manifest runtimeAuthority must remain candidate_only', manifestPath);
  checkEqual(manifest.canonAuthority, 'human_review_required', 'P0', 'manifest_canon_authority', 'manifest canonAuthority must remain human_review_required', manifestPath);
  checkBoolean(manifest.runtimeVisible, false, 'manifest_runtime_visible', 'manifest runtimeVisible must remain false', manifestPath);
  checkBoolean(manifest.deepSeekVisible, false, 'manifest_deepseek_visible', 'manifest deepSeekVisible must remain false', manifestPath);
  checkBoolean(manifest.quoteRedacted, true, 'manifest_quote_redacted', 'manifest quoteRedacted must remain true', manifestPath);
  checkEqual(manifest.redaction?.chaptersWritten, expectedCount, 'P1', 'manifest_chapters_written', 'redaction chaptersWritten mismatch', manifestPath);
  const removedFields = new Set((manifest.redaction?.removedForbiddenFieldCounts || []).map(item => item.fieldName));
  for (const key of forbiddenTextKeys) {
    if (!removedFields.has(key)) addFinding(findings, 'P2', 'manifest_missing_removed_field_count', `redaction removedForbiddenFieldCounts missing ${key}`, manifestPath);
  }
}

if (coverage) {
  checkEqual(coverage.totals?.packages, expectedCount, 'P1', 'coverage_packages', 'coverage totals.packages mismatch', coveragePath);
  checkEqual(coverage.continuity?.expected, expectedCount, 'P1', 'coverage_expected', 'coverage continuity.expected mismatch', coveragePath);
  for (const field of ['missing', 'extras', 'duplicates']) {
    const value = coverage.continuity?.[field];
    if (!Array.isArray(value) || value.length !== 0) {
      addFinding(findings, 'P1', `coverage_${field}`, `coverage continuity.${field} must be an empty array`, coveragePath);
    }
  }
  checkEqual(coverage.totals?.sourcePointersBad, 0, 'P1', 'coverage_bad_source_pointers', 'sourcePointersBad must remain zero', coveragePath);
  checkEqual(coverage.totals?.sourcePointers, coverage.totals?.sourcePointersComplete, 'P1', 'coverage_source_pointer_completeness', 'sourcePointers must equal sourcePointersComplete', coveragePath);
  checkEqual(coverage.totals?.forbiddenKeyHitsInRebornGExport, 0, 'P0', 'coverage_forbidden_export_keys', 'forbiddenKeyHitsInRebornGExport must remain zero', coveragePath);
  checkEqual(coverage.reborngExport?.runtimeAuthority, 'candidate_only', 'P0', 'coverage_runtime_authority', 'reborngExport runtimeAuthority must remain candidate_only', coveragePath);
  checkEqual(coverage.reborngExport?.canonAuthority, 'human_review_required', 'P0', 'coverage_canon_authority', 'reborngExport canonAuthority must remain human_review_required', coveragePath);
  if ((coverage.totals?.hiddenFacts || 0) > 0) {
    addFinding(findings, 'Info', 'coverage_hidden_facts_present', `hiddenFacts=${coverage.totals.hiddenFacts}; inventory only, not visible context`, coveragePath);
  }
}

const chapterPattern = /^ri_lw_ch_(\d{4})\.json$/;
const chapterFiles = fs.existsSync(baseDir)
  ? fs.readdirSync(baseDir).filter(name => chapterPattern.test(name)).sort()
  : [];
const seen = new Set();
const duplicates = [];
const extras = [];
const parseFailures = [];
const forbiddenKeyHits = [];
const authorityHits = [];

for (const fileName of chapterFiles) {
  const match = fileName.match(chapterPattern);
  const numeric = Number(match?.[1]);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > expectedCount) extras.push(fileName);
  if (seen.has(fileName)) duplicates.push(fileName);
  seen.add(fileName);

  const filePath = path.join(baseDir, fileName);
  let data;
  try {
    data = readJson(filePath);
  } catch (error) {
    parseFailures.push({ fileName, message: error.message });
    continue;
  }

  walkObject(data, (key, value, pathParts) => {
    if (forbiddenTextKeys.has(key)) {
      forbiddenKeyHits.push({ fileName, path: pathParts.join('.') });
    }
    if (key === 'runtimeAuthority' && value !== 'candidate_only') {
      authorityHits.push({ severity: 'P0', fileName, path: pathParts.join('.'), value, message: 'runtimeAuthority must not exceed candidate_only' });
    }
    if (key === 'canonAuthority' && !['human_review_required', 'candidate_only'].includes(value)) {
      authorityHits.push({ severity: 'P0', fileName, path: pathParts.join('.'), value, message: 'canonAuthority must remain human_review_required/candidate_only' });
    }
    if (key === 'runtimeVisible' && value === true) {
      authorityHits.push({ severity: 'P0', fileName, path: pathParts.join('.'), value, message: 'runtimeVisible must not be true' });
    }
    if (key === 'deepSeekVisible' && value === true) {
      authorityHits.push({ severity: 'P0', fileName, path: pathParts.join('.'), value, message: 'deepSeekVisible must not be true' });
    }
  });
}

const missing = [];
for (let index = 1; index <= expectedCount; index += 1) {
  const expected = `ri_lw_ch_${String(index).padStart(4, '0')}.json`;
  if (!seen.has(expected)) missing.push(expected);
}

if (chapterFiles.length !== expectedCount) {
  addFinding(findings, 'P1', 'chapter_count_mismatch', `chapter file count mismatch: expected=${expectedCount} actual=${chapterFiles.length}`, baseDir);
}
if (missing.length) addFinding(findings, 'P1', 'missing_chapters', `missing chapter files: ${missing.slice(0, 20).join(', ')}`, baseDir);
if (extras.length) addFinding(findings, 'P1', 'extra_chapters', `extra chapter files: ${extras.slice(0, 20).join(', ')}`, baseDir);
if (duplicates.length) addFinding(findings, 'P1', 'duplicate_chapters', `duplicate chapter files: ${duplicates.slice(0, 20).join(', ')}`, baseDir);
if (parseFailures.length) addFinding(findings, 'P1', 'chapter_parse_failures', `chapter parse failures: ${parseFailures.slice(0, 10).map(item => item.fileName).join(', ')}`, baseDir);
if (forbiddenKeyHits.length) addFinding(findings, 'P0', 'chapter_forbidden_text_keys', `forbidden text keys found: ${forbiddenKeyHits.slice(0, 10).map(item => `${item.fileName}:${item.path}`).join(', ')}`, baseDir);
for (const hit of authorityHits.slice(0, 20)) {
  addFinding(findings, hit.severity, 'chapter_authority_violation', `${hit.fileName}:${hit.path} ${hit.message}: ${hit.value}`, path.join(baseDir, hit.fileName));
}

const findingSummary = summarizeFindings(findings);
const report = {
  version: 'v1.6.0',
  mode: 'report_only',
  baseDir: '指导大纲/vMiroFish/基础包',
  checkedAt: new Date().toISOString(),
  summary: {
    acceptedForArchiveInventory: findingSummary.p0 === 0 && findingSummary.p1 === 0,
    acceptedForKnowledgeIndex: false,
    acceptedForRuntimeCanon: false,
    acceptedForDeepSeekVisibleContext: false,
    ...findingSummary,
  },
  manifest: {
    exists: fs.existsSync(manifestPath),
    chapterPackages: manifest?.chapterPackages ?? null,
    runtimeAuthority: manifest?.runtimeAuthority ?? null,
    canonAuthority: manifest?.canonAuthority ?? null,
    runtimeVisible: manifest?.runtimeVisible ?? null,
    deepSeekVisible: manifest?.deepSeekVisible ?? null,
    quoteRedacted: manifest?.quoteRedacted ?? null,
  },
  coverage: {
    exists: fs.existsSync(coveragePath),
    packages: coverage?.totals?.packages ?? null,
    sourcePointers: coverage?.totals?.sourcePointers ?? null,
    sourcePointersBad: coverage?.totals?.sourcePointersBad ?? null,
    forbiddenKeyHitsInRebornGExport: coverage?.totals?.forbiddenKeyHitsInRebornGExport ?? null,
  },
  chapters: {
    expected: expectedCount,
    actual: chapterFiles.length,
    missing,
    extras,
    duplicates,
    parseFailures,
    forbiddenKeyHits: forbiddenKeyHits.slice(0, 100),
  },
  findings,
};

const reportPath = writeReport(report, 'artifacts/v1.6.0/mirofish-base-pack-inventory');
exitWithSummary(label, reportPath, findings, `chapters=${chapterFiles.length}`);
