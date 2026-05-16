import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'src', 'canon', 'qingmao-visual-assets.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const errors = [];
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const seenIds = new Set();
const activeIds = [];
const statusCounts = new Map();

const VALID_STATUSES = new Set(['active', 'candidate', 'review-only', 'blocked']);
const VALID_ROLES = new Set(['attack', 'defense', 'support', 'scene_reference', 'background', 'atmosphere']);
const VALID_ADMISSIONS = new Set(['runtime_active', 'generic_candidate', 'specific_scene_only', 'review_only', 'blocked']);
const VALID_RUNTIME_LAYERS = new Set(['gu_asset', 'scene_background', 'atmosphere', 'review_reference', 'blocked']);
const VALID_RUNTIME_SCOPES = new Set(['qingmao_mortal_battlefield', 'scene_specific', 'forbidden_for_b3']);
const VALID_SCENE_BINDINGS = new Set(['generic', 'scene_specific', 'forbidden']);
const SPECIFIC_CHARACTER_MARKERS = [
  'fang-yuan',
  'bai-ning-bing',
  'qing-shu',
  'gu-yue-qing-shu',
  'spring-autumn-cicada',
];

function addError(message) {
  errors.push(`[qingmao-assets] ${message}`);
}

function publicAssetPath(src) {
  return path.join(repoRoot, 'public', src.replace(/^\/+/, ''));
}

for (const entry of entries) {
  if (!entry || typeof entry !== 'object') {
    addError('manifest contains a non-object entry');
    continue;
  }

  const id = String(entry.id || '');
  const status = String(entry.status || '');
  const src = String(entry.src || '');
  const role = String(entry.role || '');
  const admission = String(entry.admission || '');
  const runtimeLayer = String(entry.runtimeLayer || '');
  const runtimeScope = String(entry.runtimeScope || '');
  const sceneBinding = String(entry.sceneBinding || '');

  if (!id) addError('entry is missing id');
  if (seenIds.has(id)) addError(`duplicate asset id: ${id}`);
  seenIds.add(id);
  statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

  if (!VALID_STATUSES.has(status)) {
    addError(`${id || '<missing>'} has invalid status: ${status || '<missing>'}`);
  }
  if (!VALID_ROLES.has(role)) addError(`${id || '<missing>'} has invalid role: ${role || '<missing>'}`);
  if (!VALID_ADMISSIONS.has(admission)) addError(`${id || '<missing>'} has invalid admission: ${admission || '<missing>'}`);
  if (!VALID_RUNTIME_LAYERS.has(runtimeLayer)) addError(`${id || '<missing>'} has invalid runtimeLayer: ${runtimeLayer || '<missing>'}`);
  if (!VALID_RUNTIME_SCOPES.has(runtimeScope)) addError(`${id || '<missing>'} has invalid runtimeScope: ${runtimeScope || '<missing>'}`);
  if (!VALID_SCENE_BINDINGS.has(sceneBinding)) addError(`${id || '<missing>'} has invalid sceneBinding: ${sceneBinding || '<missing>'}`);

  if (status === 'active') activeIds.push(id);

  if (status !== 'blocked') {
    if (!src.startsWith('/rebrng/')) {
      addError(`${id} must use a public /rebrng/ asset path, got: ${src || '<missing>'}`);
      continue;
    }

    if (!existsSync(publicAssetPath(src))) addError(`${id} references a missing file: ${src}`);
  }

  if (status === 'active') {
    if (admission !== 'runtime_active') addError(`${id} is active but admission is not runtime_active`);
    if (sceneBinding !== 'generic') addError(`${id} is active but sceneBinding is not generic`);
    if (role === 'scene_reference') addError(`${id} cannot be active while role is scene_reference`);
    if (runtimeScope !== 'qingmao_mortal_battlefield') addError(`${id} is active but runtimeScope is not qingmao_mortal_battlefield`);
    if (role === 'background' && !entry.compositionContractId) addError(`${id} is an active background but has no compositionContractId`);
    if (role === 'background' && !src.startsWith('/rebrng/scenes/s0-qingmao/')) {
      addError(`${id} is an active background but does not live under /rebrng/scenes/s0-qingmao/`);
    }
    if (role === 'background' && runtimeLayer !== 'scene_background') {
      addError(`${id} is an active background but runtimeLayer is not scene_background`);
    }
    if (role === 'background' && SPECIFIC_CHARACTER_MARKERS.some(marker => id.includes(marker) || src.includes(marker))) {
      addError(`${id} looks scene-specific and cannot be an active generic background`);
    }
  }

  if (status === 'candidate' && sceneBinding === 'scene_specific') {
    addError(`${id} is scene-specific and must be review-only, not candidate`);
  }

  if (status === 'review-only' && admission === 'runtime_active') {
    addError(`${id} is review-only but admission is runtime_active`);
  }

  if (status === 'blocked' && admission !== 'blocked') {
    addError(`${id} is blocked but admission is not blocked`);
  }
}

for (const requiredId of ['moonlight-gu', 'white-jade-gu', 'liquor-worm']) {
  if (!activeIds.includes(requiredId)) addError(`required active b3 asset is not active: ${requiredId}`);
}

if (activeIds.includes('spring-autumn-cicada')) {
  addError('spring-autumn-cicada must remain blocked for the b3 mortal-battle slice');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  const counts = [...statusCounts.entries()]
    .filter(([status]) => status)
    .map(([status, count]) => `${status}=${count}`)
    .join(', ');
  console.log(`[qingmao-assets] checked ${entries.length} entries; ${counts}; active=${activeIds.join(', ')}`);
}
