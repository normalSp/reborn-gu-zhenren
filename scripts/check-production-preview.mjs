import { spawn, execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const port = Number(process.env.PREVIEW_PORT || 4182);
const url = `http://127.0.0.1:${port}/?e2e=1`;
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const previewCommand = process.platform === 'win32' ? 'cmd.exe' : npxBin;
const previewArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', `npx vite preview --host 127.0.0.1 --port ${port}`]
  : ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)];
const preview = spawn(previewCommand, previewArgs, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

const logs = [];
preview.stdout.on('data', chunk => logs.push(String(chunk)));
preview.stderr.on('data', chunk => logs.push(String(chunk)));

function stopPreview() {
  if (!preview.pid || preview.killed) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' });
    } catch {
      preview.kill('SIGTERM');
    }
    return;
  }
  preview.kill('SIGTERM');
}

async function waitForPreview(timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (preview.exitCode !== null) {
      throw new Error(`vite preview exited early with code ${preview.exitCode}\n${logs.join('')}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error(`vite preview did not become ready within ${timeoutMs}ms\n${logs.join('')}`);
}

try {
  await waitForPreview();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });
  const messages = [];
  page.on('console', message => messages.push(`[${message.type()}] ${message.text()}`));
  page.on('pageerror', error => messages.push(`[pageerror] ${error.message}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
  const rootBox = await page.locator('#root').boundingBox().catch(() => null);
  await browser.close();

  const fatal = messages.filter(message =>
    message.includes('[pageerror]')
    || /TypeError|ReferenceError|Cannot read/.test(message)
  );
  if (fatal.length > 0 || rootHtml.trim().length === 0 || !rootBox || rootBox.height <= 0) {
    console.error(JSON.stringify({ url, bodyText: bodyText.slice(0, 500), rootBox, fatal, messages }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      ok: true,
      url,
      bodyText: bodyText.slice(0, 160),
      rootHeight: rootBox.height,
      consoleMessages: messages.slice(0, 10),
    }, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  stopPreview();
}
