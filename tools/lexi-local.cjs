#!/usr/bin/env node
// LerenBe 3.0 · local test environment for Lexi: the app of this tree + the PROPOSED Lexi Worker
// (docs/integration-3.0/ai-worker.lexi-proposed.js, unchanged), both on this Mac only. Nothing is deployed; the production
// Worker (leren-ai), lerenbe.com, Firebase and their keys are not used.
//
//   node tools/lexi-local.cjs            → asks for a TEST Anthropic key (hidden input; Enter = mock answers, no AI)
//   open http://localhost:8080/__lexi-local   (once per browser: points the app at the local Worker, then opens the app)
//
// - The app is served on 127.0.0.1:8080 and opened as http://localhost:8080 (the app allows a local AI endpoint and its
//   Service Worker only on localhost). A Samsung joins over USB: chrome://inspect → Port forwarding 8080 → 127.0.0.1:8080.
// - /lexi-ai/ runs the Worker in this process with in-memory KV and rate limiters (same limits as wrangler.toml). The
//   request reaches it with Origin https://lerenbe.com, because the Worker serves only that origin; nothing else changes.
// - The key stays in this process's memory: never printed, never written to a file, never sent anywhere but
//   api.anthropic.com. Use a separate key with a spending limit (console.anthropic.com → API keys / Limits).
// - Spending guard: at most LEXI_MAX_CALLS model calls per run (default 150); after that the Worker gets an error, as if
//   the model were down. Token use is printed after every call.
// Environment (all optional): LEXI_PORT (8080), LEXI_MODEL (the Worker's default), LEXI_MAX_CALLS (150),
// LEXI_TEST_ANTHROPIC_KEY (skips the prompt; avoid it in shell history), LEXI_MOCK=1 (no key, no prompt).
'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto'), readline = require('node:readline');
const repo = path.join(__dirname, '..'), PORT = +(process.env.LEXI_PORT || 8080), MAX = +(process.env.LEXI_MAX_CALLS || 150);
const WORKER = path.join(repo, 'docs/integration-3.0/ai-worker.lexi-proposed.js');
const T = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.tsv': 'text/plain', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon'};

function askKey() {
 if (process.env.LEXI_MOCK === '1') return Promise.resolve('');
 if (process.env.LEXI_TEST_ANTHROPIC_KEY) return Promise.resolve(process.env.LEXI_TEST_ANTHROPIC_KEY.trim());
 if (!process.stdin.isTTY) return Promise.resolve('');
 return new Promise(res => {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: true});
  let muted = false; rl._writeToOutput = s => { if (!muted || /\r|\n/.test(s)) process.stdout.write(muted ? '\n' : s) };
  rl.question('TEST Anthropic key (hidden; Enter = mock answers, no AI): ', k => { rl.close(); res(k.trim()) }); muted = true;
 });
}

const stats = {mode: 'mock', calls: 0, refused: 0, in: 0, out: 0, cacheRead: 0, cacheWrite: 0, started: new Date().toISOString()};
function mockAnswer(body) {
 const sys = JSON.stringify(body.system || ''), last = String((body.messages || []).at(-1)?.content || '').slice(0, 60);
 const text = /"memory"/.test(JSON.stringify(body.output_config || {})) ? {memory: 'Mock notes.'}
  : {reply: 'Mock: ' + last, reply_nl: 'Mock: ' + last, translation: '(mock)', correction: null, answer: 'Mock-відповідь Lexi (без AI). ' + (sys.includes('exercise') ? 'Бачу вправу.' : ''), examples: [{lang: 'nl', text: 'Ik woon in Gent.', translation: 'Я живу в Генті.'}]};
 return {ok: true, status: 200, json: async () => ({stop_reason: 'end_turn', usage: {input_tokens: 0, output_tokens: 0}, content: [{type: 'text', text: JSON.stringify(text)}]})};
}
function guardFetch(key) {
 const real = globalThis.fetch;
 globalThis.fetch = async (url, opts = {}) => {
  if (!String(url).startsWith('https://api.anthropic.com/')) throw new Error('lexi-local: blocked request to ' + String(url).slice(0, 60));
  const body = JSON.parse(opts.body || '{}');
  if (!key) { stats.calls++; return mockAnswer(body) }
  if (stats.calls >= MAX) { stats.refused++; console.log(`lexi-local: spending guard — ${MAX} model calls reached, refusing`); return {ok: false, status: 529, json: async () => ({error: {type: 'overloaded_error', message: 'lexi-local spending guard'}})} }
  stats.calls++;
  const r = await real(url, opts), j = await r.json(), u = j.usage || {};
  stats.in += u.input_tokens || 0; stats.out += u.output_tokens || 0; stats.cacheRead += u.cache_read_input_tokens || 0; stats.cacheWrite += u.cache_creation_input_tokens || 0;
  console.log(`lexi-local: call ${stats.calls}/${MAX} ${r.status} · tokens in ${u.input_tokens || 0} (cache read ${u.cache_read_input_tokens || 0}, write ${u.cache_creation_input_tokens || 0}) out ${u.output_tokens || 0} · run total in ${stats.in} out ${stats.out}`);
  return {ok: r.ok, status: r.status, json: async () => j};
 };
}
function limiter(limit) { const hits = new Map(); return {async limit({key}) { const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < 60000); if (a.length >= limit) { hits.set(key, a); return {success: false} } a.push(now); hits.set(key, a); return {success: true} }} }

(async () => {
 const key = await askKey(); stats.mode = key ? 'live' : 'mock';
 if (key && !/^sk-ant-/.test(key)) { console.log('lexi-local: that does not look like an Anthropic key (sk-ant-…); stopping.'); process.exit(2) }
 guardFetch(key);
 const worker = (await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(WORKER, 'utf8')).toString('base64'))).default;
 const kv = new Map();
 const env = {PROVIDER: 'anthropic', ANTHROPIC_KEY: key || 'mock', RATE_SALT: crypto.randomBytes(16).toString('hex'), ...(process.env.LEXI_MODEL ? {MODEL: process.env.LEXI_MODEL} : {}),
  RATE: {async get(k) { return kv.get(k) ?? null }, async put(k, v) { kv.set(k, v) }}, PER_IP: limiter(12), IP_CEIL: limiter(40), ALL: limiter(300)};
 const server = http.createServer(async (q, r) => {
  const u = new URL(q.url, 'http://localhost');
  if (u.pathname === '/__lexi-local') { r.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
   return r.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Lexi local</title><body style="font:16px system-ui;padding:24px"><p>Lexi: local Worker (${stats.mode === 'live' ? 'real AI, test key' : 'mock answers, no AI'}). Opening the app…</p><script>localStorage.setItem('leren_ai_endpoint', JSON.stringify(location.origin + '/lexi-ai/'));setTimeout(()=>location.replace('/'),800)</script>`) }
  if (u.pathname === '/__lexi-local/status') { r.writeHead(200, {'content-type': 'application/json', 'cache-control': 'no-store'}); return r.end(JSON.stringify({...stats, max: MAX})) }
  if (u.pathname === '/lexi-ai/' || u.pathname === '/lexi-ai') {
   if (q.method === 'OPTIONS') { r.writeHead(204, {'access-control-allow-origin': q.headers.origin || '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'Content-Type, X-Leren-Device'}); return r.end() }
   const chunks = []; for await (const c of q) chunks.push(c);
   const headers = {'Origin': 'https://lerenbe.com', 'Content-Type': q.headers['content-type'] || 'application/json', 'CF-Connecting-IP': '127.0.0.1'};
   if (q.headers['x-leren-device']) headers['X-Leren-Device'] = q.headers['x-leren-device'];
   const pending = [];
   try {
    const res = await worker.fetch(new Request('https://leren-ai.local/', {method: q.method, headers, body: q.method === 'POST' ? Buffer.concat(chunks) : undefined}), env, {waitUntil: p => pending.push(Promise.resolve(p).catch(() => {}))});
    const h = {}; res.headers.forEach((v, k) => { if (k !== 'access-control-allow-origin') h[k] = v }); h['access-control-allow-origin'] = q.headers.origin || '*';
    r.writeHead(res.status, h); r.end(Buffer.from(await res.arrayBuffer()));
   } catch (e) { console.log('lexi-local: worker error', e.message); r.writeHead(500); r.end() }
   await Promise.all(pending); return;
  }
  let f = path.join(repo, decodeURIComponent(u.pathname)); if (u.pathname.endsWith('/')) f = path.join(f, 'index.html');
  if (!f.startsWith(repo + path.sep) || /[\\/]\.(git|github)([\\/]|$)/.test(f)) { r.writeHead(403); return r.end() }
  fs.stat(f, (e, s) => { if (e || !s.isFile()) { r.writeHead(404); return r.end() } r.writeHead(200, {'content-type': T[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache'}); fs.createReadStream(f).pipe(r) });
 });
 server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nLexi local test environment — ${stats.mode === 'live' ? 'REAL AI with your test key (max ' + MAX + ' model calls)' : 'MOCK answers, no AI, no cost'}`);
  console.log(`  1. Open http://localhost:${PORT}/__lexi-local  (once per browser; then the app opens)`);
  console.log(`  2. Samsung: USB debugging + chrome://inspect → Port forwarding ${PORT} → 127.0.0.1:${PORT}, then the same address on the phone`);
  console.log(`  Status: http://localhost:${PORT}/__lexi-local/status · Stop: Ctrl+C\n`);
 });
 process.on('SIGINT', () => { console.log(`\nlexi-local: ${stats.calls} model calls, tokens in ${stats.in} (cache read ${stats.cacheRead}, write ${stats.cacheWrite}) out ${stats.out}.`); process.exit(0) });
})().catch(e => { console.error('lexi-local:', e.message); process.exit(1) });
