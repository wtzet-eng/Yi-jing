import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { HEXAGRAMS } from '../src/data/hexagrams';
import sources from '../docs/line-sources.json' with { type: 'json' };

let server: Server;
let origin: string;
let version: string;
let broken: boolean;
let legacy: boolean;
let script: string;
const mime: Record<string, string> = {
  html: 'text/html', js: 'application/javascript', css: 'text/css',
  json: 'application/json', png: 'image/png', svg: 'image/svg+xml',
};

test.beforeEach(async () => {
  version = 'first'; broken = false; legacy = false;
  script = await readFile('dist/sw.js', 'utf8');
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url!, 'http://localhost').pathname;
    res.setHeader('Cache-Control', 'no-store');
    if (pathname === '/sw.js') {
      res.setHeader('Content-Type', 'application/javascript');
      if (legacy) {
        // Reproduce v3: a registered worker with HTML/icons but no precached bundle.
        res.end(`self.addEventListener('install', e => { e.waitUntil(caches.open('yijing-practice-v3').then(c => c.add('/index.html'))); self.skipWaiting(); }); self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));`);
      } else {
        let worker = script.replace(/const VERSION = "[^"]+"/, `const VERSION = "test-${version}"`);
        if (broken) worker = worker.replace('const PRECACHE_ASSETS = [', 'const PRECACHE_ASSETS = ["/missing.js",');
        res.end(worker);
      }
      return;
    }
    if (pathname === '/missing.js' || pathname.startsWith('/api/')) {
      res.writeHead(503); res.end('Unavailable'); return;
    }
    try {
      const file = pathname === '/' ? '/index.html' : pathname;
      if (file.includes('..')) throw new Error('Invalid path');
      const data = await readFile(`dist${file}`);
      res.setHeader('Content-Type', mime[file.split('.').pop()!] || 'application/octet-stream');
      res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('all 384 lines remain present and 375 match verified English descriptions', () => {
  const normalize = (text: string) => text.replace(/\s+/g, ' ').replace(/^[ .]+|[ .]+$/g, '');
  expect(Object.keys(HEXAGRAMS)).toHaveLength(64);
  let checked = 0;
  for (const [number, hexagram] of Object.entries(HEXAGRAMS)) {
    expect(Object.keys(hexagram.lines)).toEqual(['1', '2', '3', '4', '5', '6']);
    for (const text of Object.values(hexagram.lines)) expect(text.length).toBeGreaterThan(10);
    const source = sources.sources[number as keyof typeof sources.sources];
    for (const [line, text] of Object.entries(source.lines)) {
      expect(normalize(hexagram.lines[line]), `${number}.${line}`).toBe(normalize(text));
      checked++;
    }
  }
  expect(checked).toBe(375);
  expect(sources.missingEnglishLines).toHaveLength(9);
});

test('first visit saves complete app, then offline reopening, casting and practice work', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await expect(page.getByRole('status')).toHaveText('Ready for offline use');
  // Chromium's actual installability checks, including manifest icons and worker.
  const cdp = await context.newCDPSession(page);
  const result = await cdp.send('Page.getInstallabilityErrors');
  expect(result.installabilityErrors).toEqual([]);
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  reopened.on('pageerror', error => errors.push(error.message));
  await reopened.addInitScript(() => { Math.random = () => 0.9; });
  await reopened.goto(`${origin}/?source=installed`);
  await expect(reopened.getByRole('status')).toContainText('Offline — casting');
  await reopened.getByRole('button', { name: 'Cast Hexagram', exact: true }).click();
  await expect(reopened.getByText('Hidden dragon, no need to act.', { exact: true })).toBeVisible();
  await reopened.getByRole('button', { name: 'Line 1 (yang)', exact: true }).click();
  await expect(reopened.getByText("You're offline — the practice continues with simplified responses")).toBeVisible();
  await expect(reopened.getByText('The Origination. What sensations are present in your body right now?', { exact: true })).toBeVisible();
  await reopened.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(reopened.locator('body')).toContainText('Privacy');
  await reopened.goto(origin);
  await expect(reopened.getByRole('button', { name: 'Cast Hexagram', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('update waits for consent, preserves unrelated cache, and works offline', async ({ page, context }) => {
  await page.goto(origin);
  await expect(page.getByRole('status')).toHaveText('Ready for offline use');
  await page.evaluate(() => caches.open('unrelated-cache'));
  version = 'second';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  const updateButton = page.getByRole('button', { name: /Update ready/ });
  await expect(updateButton).toBeVisible();
  expect(await page.evaluate(() => caches.keys())).toContain('yijing-offline-test-first');
  await updateButton.click();
  await expect(page.getByRole('status')).toHaveText('Ready for offline use');
  await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(expect.arrayContaining(['unrelated-cache', 'yijing-offline-test-second']));
  expect(await page.evaluate(() => caches.keys())).not.toContain('yijing-offline-test-first');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Offline — casting');
});

test('failed update keeps working offline copy', async ({ page, context }) => {
  await page.goto(origin);
  await expect(page.getByRole('status')).toHaveText('Ready for offline use');
  version = 'broken'; broken = true;
  await page.evaluate(async () => {
    const reg = (await navigator.serviceWorker.getRegistration())!;
    const failed = new Promise<void>(resolve => reg.addEventListener('updatefound', () => {
      const worker = reg.installing!;
      worker.addEventListener('statechange', () => { if (worker.state === 'redundant') resolve(); });
    }, { once: true }));
    await reg.update(); await failed;
  });
  expect(await page.evaluate(() => caches.keys())).not.toContain('yijing-offline-test-broken');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Offline — casting');
});

test('existing v3 worker migrates to a complete offline build', async ({ page, context }) => {
  legacy = true;
  await page.goto(origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  legacy = false;
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  await page.getByRole('button', { name: /Update ready/ }).click();
  await expect(page.getByRole('status')).toHaveText('Ready for offline use');
  expect(await page.evaluate(() => caches.keys())).not.toContain('yijing-practice-v3');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Cast Hexagram', exact: true })).toBeVisible();
});
