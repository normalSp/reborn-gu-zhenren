import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();

export const forbiddenTextKeys = new Set([
  'quote',
  'originalText',
  'excerpt',
  'verbatim',
  'rawText',
  'sourceText',
]);

export const allowedVisibility = new Set([
  'public',
  'player_visible',
  'hidden_ref_only',
  'private',
  'deferred',
]);

export const allowedPromotionStatus = new Set([
  'raw_candidate',
  'intake_accepted',
  'fact_card_draft',
  'rule_draft',
  'test_sample',
  'runtime_promoted',
  'deferred',
  'quarantined',
  'rejected',
]);

export const highRiskUses = new Set([
  'deepseek_visible_context',
  'player_visible_hidden_body',
  'runtime_authority',
  'canon_promotion',
  'formal_location',
  'formal_faction',
  'formal_reward',
  'npc_life_death',
  'public_release_wording',
]);

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export function walkObject(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkObject(item, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, [...pathParts, key]);
    walkObject(child, visitor, [...pathParts, key]);
  }
}

export function addFinding(findings, severity, code, message, ref = undefined) {
  findings.push({ severity, code, message, ...(ref ? { ref } : {}) });
}

export function summarizeFindings(findings) {
  return {
    p0: findings.filter(item => item.severity === 'P0').length,
    p1: findings.filter(item => item.severity === 'P1').length,
    p2: findings.filter(item => item.severity === 'P2').length,
    info: findings.filter(item => item.severity === 'Info').length,
  };
}

export function writeReport(report, relativeDir, explicitPath = undefined) {
  const outPath = explicitPath
    ? path.resolve(root, explicitPath)
    : path.join(root, relativeDir, timestampForPath(), 'report.json');
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outPath;
}

export function exitWithSummary(label, reportPath, findings, okMessage) {
  const summary = summarizeFindings(findings);
  console.log(`[${label}] ${okMessage} report=${reportPath} P0=${summary.p0} P1=${summary.p1} P2=${summary.p2} Info=${summary.info}`);
  if (summary.p0 > 0 || summary.p1 > 0) process.exit(1);
}

export function listFilesRecursive(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, predicate));
    } else if (predicate(fullPath, entry)) {
      results.push(fullPath);
    }
  }
  return results.sort((a, b) => a.localeCompare(b));
}

function parseScalarList(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  if (typeof value !== 'string') return [value];
  return value
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map(item => item.trim().replace(/^["'`]|["'`]$/g, ''))
    .filter(Boolean);
}

function parseMarkdownEntry(file) {
  const text = fs.readFileSync(file, 'utf8');
  const entry = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    entry[key] = value.trim();
  }
  const arrayFields = ['sourcePointers', 'allowedUses', 'forbiddenUses', 'mirofishRefs', 'intakeReviewRefs', 'testSampleRefs'];
  for (const field of arrayFields) entry[field] = parseScalarList(entry[field]);
  return Object.keys(entry).length > 0 ? entry : null;
}

export function collectKnowledgeEntries(knowledgeDir) {
  const files = listFilesRecursive(
    knowledgeDir,
    file => /\.(json|md)$/i.test(file) && path.basename(file).toLowerCase() !== 'readme.md',
  );
  const entries = [];
  const parseFailures = [];
  for (const file of files) {
    try {
      if (/\.json$/i.test(file)) {
        const data = readJson(file);
        const values = Array.isArray(data)
          ? data
          : Array.isArray(data.entries)
            ? data.entries
            : data && typeof data === 'object' && data.id
              ? [data]
              : [];
        for (const value of values) entries.push({ ...value, __file: file });
      } else {
        const value = parseMarkdownEntry(file);
        if (value) entries.push({ ...value, __file: file });
      }
    } catch (error) {
      parseFailures.push({ file, message: error.message });
    }
  }
  return { entries, files, parseFailures };
}

export function parseMarkdownTableRows(file) {
  if (!fs.existsSync(file)) return [];
  const rows = [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\|\s*-+/.test(line)) continue;
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
    if (cells.length >= 2) rows.push(cells);
  }
  return rows;
}

export function collectMatrixIds(matrixFile) {
  const ids = new Set();
  for (const cells of parseMarkdownTableRows(matrixFile)) {
    const id = cells[0];
    if (/^V\d+-/.test(id)) ids.add(id);
  }
  return ids;
}
