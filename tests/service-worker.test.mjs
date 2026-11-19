import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, readdir } from 'node:fs/promises';

const script = await readFile('dist/sw.js', 'utf8');
const origin = 'https://yijing.test';
const absolute = value => new URL(typeof value === 'string' ? value : value.url, origin).href;

function harness({ stores = new Map(), offline = false, fail = '' } = {}) {
  const handlers = new Map();
  const state = { offline, fail, claimed: false, skipped: false, requests: [] };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) {
          for (const request of requests) {
            const response = await fetcher(request);
            if (!response.ok) throw new Error('Failed to precache');
            store.set(absolute(request), response);
          }
        },
        async match(key) { return store.get(absolute(key))?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(key) { return stores.delete(key); },
  };
  async function fetcher(request) {
    const url = absolute(request);
    state.requests.push(url);
    if (state.offline) throw new Error('Offline');
    if (url.endsWith(state.fail) && state.fail) return new Response('missing', { status: 404 });
    const pathname = new URL(url).pathname;
    try { return new Response(await readFile(`dist${pathname}`)); }
    catch { return new Response('missing', { status: 404 }); }
  }
  class WorkerRequest extends Request {
    constructor(url, options) { super(absolute(url), options); }
  }
  const self = {
    location: { origin },
    addEventListener: (type, callback) => handlers.set(type, callback),
    clients: { claim: async () => { state.claimed = true; } },
    skipWaiting: async () => { state.skipped = true; },
  };
  vm.runInNewContext(script, { self, caches, fetch: fetcher, Request: WorkerRequest, Response, URL });
  async function dispatch(type, extra = {}) {
    const tasks = [];
    let response;
    handlers.get(type)({
      waitUntil: task => tasks.push(task), respondWith: task => { response = task; }, ...extra,
    });
    await Promise.all(tasks);
    return response;
  }
  return { stores, state, dispatch };
}

test('build precaches HTML, all JS/CSS, manifest, icons and privacy; ready only after install', async () => {
  const h = harness();
  await h.dispatch('install');
  assert.equal(h.state.skipped, false, 'an update must not replace the running app automatically');
  await h.dispatch('activate');
  assert.equal(h.state.claimed, true);
  for (const file of await readdir('dist/assets')) {
    assert(h.state.requests.includes(`${origin}/assets/${file}`), `${file} must be precached`);
  }
  for (const file of ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'privacy.html']) {
    assert(h.state.requests.includes(`${origin}/${file}`));
  }
  let status;
  await h.dispatch('message', { data: { type: 'OFFLINE_STATUS' }, ports: [{ postMessage: value => { status = value; } }] });
  assert.equal(status.ready, true);
  assert.match(status.version, /^[0-9a-f]{16}$/);
  for (const size of [192, 512]) {
    const icon = await readFile(`dist/icon-${size}.png`);
    assert.equal(icon.readUInt32BE(16), size); assert.equal(icon.readUInt32BE(20), size);
  }
});

test('first-visit offline reload, query URLs and privacy use the complete cached build', async () => {
  const h = harness(); await h.dispatch('install'); await h.dispatch('activate');
  h.state.offline = true;
  for (const path of ['/', '/?source=installed', '/privacy.html', ... (await readdir('dist/assets')).map(x => `/assets/${x}`)]) {
    const response = await h.dispatch('fetch', { request: new Request(origin + path) });
    assert.equal(response.status, 200, path);
    assert((await response.text()).length > 0);
  }
  const html = await (await h.dispatch('fetch', { request: new Request(origin + '/') })).text();
  assert.equal(html, await readFile('dist/index.html', 'utf8'));
});

test('failed installation deletes partial new cache and keeps old working cache', async () => {
  const old = new Map([['old asset', new Response('old')]]);
  const h = harness({ stores: new Map([['yijing-practice-v3', old]]), fail: '/index.html' });
  await assert.rejects(h.dispatch('install'));
  assert.deepEqual([...h.stores.keys()], ['yijing-practice-v3']);
  assert.equal(h.state.claimed, false);
});

test('activation cleans only Yijing caches and update activation requires a message', async () => {
  const h = harness({ stores: new Map([
    ['yijing-practice-v3', new Map()], ['yijing-offline-old', new Map()], ['other-app', new Map()],
  ]) });
  await h.dispatch('install'); await h.dispatch('activate');
  assert(!h.stores.has('yijing-practice-v3')); assert(!h.stores.has('yijing-offline-old'));
  assert(h.stores.has('other-app'));
  assert.equal(h.state.skipped, false);
  await h.dispatch('message', { data: { type: 'SKIP_WAITING' } });
  assert.equal(h.state.skipped, true);
});

test('API, POST, external media and worker updates bypass the cache', async () => {
  const h = harness(); await h.dispatch('install');
  for (const request of [
    new Request(origin + '/api/presence'), new Request(origin + '/api/presence', { method: 'POST' }),
    new Request('https://youtube.com/watch?v=example'), new Request(origin + '/sw.js'),
    new Request(origin + '/unknown.js'),
  ]) assert.equal(await h.dispatch('fetch', { request }), undefined);
});
