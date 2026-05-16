import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = join(rootDir, 'artifacts', 'v0.9.0', 'post-visual-expansion', 'V001');
const baseUrl = process.env.REBORNG_CAPTURE_BASE_URL ?? 'http://127.0.0.1:5173';
const startedServerTimeoutMs = 60_000;

const outputFiles = [
  'qingmao-desktop-overview.png',
  'qingmao-moonlight-action.png',
  'qingmao-white-jade-guard.png',
  'qingmao-forbidden-failure.png',
  'qingmao-mobile-reduced-motion.png',
  'qingmao-v090-public-feature-short.webm',
  'qingmao-internal-review-short.webm',
  'manifest.json',
];

const fatalConsolePatterns = [
  /Maximum update depth exceeded/i,
  /\[PIPE\]\s+ZOD_FAIL/i,
  /Cannot read properties/i,
  /Uncaught/i,
  /ReferenceError/i,
  /TypeError/i,
];

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

function toRepoPath(filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}

async function cleanupKnownOutputs() {
  mkdirSync(artifactDir, { recursive: true });
  for (const fileName of outputFiles) {
    const filePath = join(artifactDir, fileName);
    if (existsSync(filePath)) {
      let removed = false;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          unlinkSync(filePath);
          removed = true;
          break;
        } catch (error) {
          if (!['EBUSY', 'EPERM'].includes(error?.code) || attempt === 7) throw error;
          await sleep(250);
        }
      }
      if (!removed) throw new Error(`Failed to remove stale capture output: ${filePath}`);
    }
  }
}

function probeServer(url) {
  return new Promise(resolveProbe => {
    const request = http.get(url, response => {
      response.resume();
      resolveProbe(response.statusCode !== undefined && response.statusCode < 500);
    });
    request.setTimeout(2_000, () => {
      request.destroy();
      resolveProbe(false);
    });
    request.on('error', () => resolveProbe(false));
  });
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await probeServer(url)) return true;
    await sleep(500);
  }
  return false;
}

async function ensureDevServer() {
  if (await probeServer(baseUrl)) {
    return { spawned: false, process: null };
  }

  const child = process.platform === 'win32'
    ? spawn(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5173'],
        {
          cwd: rootDir,
          env: { ...process.env, BROWSER: 'none' },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
    : spawn(
        'npm',
        ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
        {
          cwd: rootDir,
          env: { ...process.env, BROWSER: 'none' },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

  let recentOutput = '';
  child.stdout.on('data', chunk => {
    recentOutput = `${recentOutput}${chunk.toString('utf8')}`.slice(-4_000);
  });
  child.stderr.on('data', chunk => {
    recentOutput = `${recentOutput}${chunk.toString('utf8')}`.slice(-4_000);
  });

  if (!(await waitForServer(baseUrl, startedServerTimeoutMs))) {
    child.kill();
    throw new Error(`Timed out waiting for Vite at ${baseUrl}.\n${recentOutput}`);
  }

  return { spawned: true, process: child };
}

function stopDevServer(server) {
  if (!server.spawned || !server.process) return;
  if (process.platform === 'win32' && server.process.pid) {
    spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', `taskkill /PID ${server.process.pid} /T /F`],
      { stdio: 'ignore' },
    );
    return;
  }
  server.process.kill();
}

function installConsoleGuards(page) {
  const errors = [];
  page.on('console', message => {
    const text = message.text();
    if (fatalConsolePatterns.some(pattern => pattern.test(text))) {
      errors.push(`[${message.type()}] ${text}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`[pageerror] ${error.message}`);
  });
  return errors;
}

async function openQingmaoBattlefield(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`${baseUrl}/?e2e=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__REBORN_E2E__, null, { timeout: 30_000 });
  await page.evaluate(() => window.__REBORN_E2E__.startQingmaoMortalBattlefieldDemo());
  await page.getByTestId('battlefield-overlay').waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByTestId('battlefield-qingmao-entrance').waitFor({ state: 'visible', timeout: 30_000 });
}

async function waitForEntrance(page) {
  await page.getByTestId('battlefield-qingmao-entrance').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="battlefield-qingmao-entrance"]');
    const state = node?.getAttribute('data-entrance-timeline');
    return state === 'complete' || state === 'reduced';
  }, null, { timeout: 5_000 });
}

async function captureOverlay(page, fileName) {
  const targetPath = join(artifactDir, fileName);
  await page.getByTestId('battlefield-overlay').screenshot({
    path: targetPath,
    animations: 'disabled',
  });
  return targetPath;
}

async function captureDesktopOverview(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await openQingmaoBattlefield(page);
  await waitForEntrance(page);
  const filePath = await captureOverlay(page, 'qingmao-desktop-overview.png');
  await context.close();
  return { filePath, consoleErrors };
}

async function captureMoonlight(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await openQingmaoBattlefield(page);
  await page.getByTestId('battlefield-action-gu:月光蛊').click();
  await page.getByTestId('battlefield-cell-c3_1').click();
  await page.getByTestId('battlefield-execute-action').click();
  await page.getByTestId('battlefield-step-gu_use').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'moon-transition';
  }, null, { timeout: 5_000 });
  const filePath = await captureOverlay(page, 'qingmao-moonlight-action.png');
  await context.close();
  return { filePath, consoleErrors };
}

async function captureWhiteJade(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await openQingmaoBattlefield(page);
  await page.getByTestId('battlefield-action-gu:白玉蛊').click();
  await page.getByTestId('battlefield-execute-action').click();
  await page.getByTestId('battlefield-step-gu_use').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'white-jade-transition';
  }, null, { timeout: 5_000 });
  const filePath = await captureOverlay(page, 'qingmao-white-jade-guard.png');
  await context.close();
  return { filePath, consoleErrors };
}

async function captureForbidden(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await openQingmaoBattlefield(page);
  await page.evaluate(() => window.__REBORN_E2E__.triggerQingmaoForbiddenThresholdFailure());
  await page.getByTestId('battlefield-step-failure').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'forbidden-transition';
  }, null, { timeout: 5_000 });
  const filePath = await captureOverlay(page, 'qingmao-forbidden-failure.png');
  await context.close();
  return { filePath, consoleErrors };
}

async function captureMobileReduced(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await openQingmaoBattlefield(page);
  await page.getByTestId('battlefield-tab-retreat').click();
  await page.getByTestId('battlefield-action-retreat:edge').click();
  await page.getByTestId('battlefield-execute-action').waitFor({ state: 'visible' });
  const filePath = await captureOverlay(page, 'qingmao-mobile-reduced-motion.png');
  await context.close();
  return { filePath, consoleErrors };
}

async function performShortReviewFlow(page) {
  await openQingmaoBattlefield(page);
  await waitForEntrance(page);
  await sleep(600);

  await page.getByTestId('battlefield-action-gu:月光蛊').click();
  await page.getByTestId('battlefield-cell-c3_1').click();
  await page.getByTestId('battlefield-execute-action').click();
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'moon-transition';
  }, null, { timeout: 5_000 });
  await sleep(800);

  await openQingmaoBattlefield(page);
  await page.getByTestId('battlefield-action-gu:白玉蛊').click();
  await page.getByTestId('battlefield-execute-action').click();
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'white-jade-transition';
  }, null, { timeout: 5_000 });
  await sleep(800);

  await openQingmaoBattlefield(page);
  await page.evaluate(() => window.__REBORN_E2E__.triggerQingmaoForbiddenThresholdFailure());
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="battlefield-effect-layer"]');
    return layer?.getAttribute('data-qingmao-polish') === 'forbidden-transition';
  }, null, { timeout: 5_000 });
  await sleep(1_000);
}

async function captureReviewVideo(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: artifactDir,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  const consoleErrors = installConsoleGuards(page);
  await performShortReviewFlow(page);
  const video = page.video();
  await context.close();
  if (!video) throw new Error('Playwright did not create a review video.');

  const tempPath = await video.path();
  const targetPath = join(artifactDir, 'qingmao-v090-public-feature-short.webm');
  if (existsSync(targetPath)) unlinkSync(targetPath);
  renameSync(tempPath, targetPath);
  return { filePath: targetPath, consoleErrors };
}

function buildFileEntry(filePath, role) {
  const buffer = readFileSync(filePath);
  const stat = statSync(filePath);
  return {
    file: toRepoPath(filePath),
    role,
    bytes: stat.size,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

function readPackageVersion() {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return packageJson.version;
}

function writeManifest(entries) {
  const manifestPath = join(artifactDir, 'manifest.json');
  const manifest = {
    captureId: `v001-qingmao-${new Date().toISOString()}`,
    packageVersion: readPackageVersion(),
    baseUrl,
    status: 'public_candidate_material',
    boundary: [
      'Shows the v0.9.0 locked Qingmao mortal-battle UI sample.',
      'Approved by the user as a small v0.9.0 public candidate material pack; final channel posting still needs caption/title review.',
      'Does not imply Immortal Gu, rank ten, eternal life, Fate Gu ownership, or mortal Treasure Yellow Heaven trade.',
    ],
    files: entries,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return buildFileEntry(manifestPath, 'capture_manifest');
}

function assertNoConsoleErrors(results) {
  const errors = results.flatMap(result => result.consoleErrors);
  if (errors.length > 0) {
    throw new Error(`Fatal browser console errors during capture:\n${errors.join('\n')}`);
  }
}

async function main() {
  await cleanupKnownOutputs();
  const server = await ensureDevServer();
  const browser = await chromium.launch();

  try {
    const results = [];
    results.push(await captureDesktopOverview(browser));
    results.push(await captureMoonlight(browser));
    results.push(await captureWhiteJade(browser));
    results.push(await captureForbidden(browser));
    results.push(await captureMobileReduced(browser));
    results.push(await captureReviewVideo(browser));

    assertNoConsoleErrors(results);

    const entries = [
      buildFileEntry(results[0].filePath, 'desktop_overview'),
      buildFileEntry(results[1].filePath, 'moonlight_action'),
      buildFileEntry(results[2].filePath, 'white_jade_guard'),
      buildFileEntry(results[3].filePath, 'forbidden_failure'),
      buildFileEntry(results[4].filePath, 'mobile_reduced_motion'),
      buildFileEntry(results[5].filePath, 'short_review_video'),
    ];
    entries.push(writeManifest(entries));

    console.log(`Qingmao V001 capture complete: ${toRepoPath(artifactDir)}`);
    for (const entry of entries) {
      console.log(`${entry.role}: ${entry.file} (${entry.bytes} bytes)`);
    }
  } finally {
    await browser.close();
    stopDevServer(server);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
