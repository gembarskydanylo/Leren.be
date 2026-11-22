// LerenBe 3.0 (PR #63) · Lexi memory study: 40 cycles of «open Lexi → send a message → get the reply → close», Chromium + CDP,
// mocked AI on localhost, emulated phone (not a real one). TEST-043 had reported ≈ 222 DOM nodes left per cycle; memory-043
// showed that was its lab holding an element handle. This test looks at everything else that can keep a closed chat alive:
//   DOM nodes, event listeners, documents and JS heap after a full collection (CDP counters);
//   detached nodes = nodes Blink still holds − nodes reachable from the document (light DOM + open shadow roots);
//   references: a WeakRef to each closed chat host must be collectable;
//   timers: setInterval / setTimeout / requestAnimationFrame still pending after the chat closed;
//   reopening: after the 40 cycles the chat opens once, answers, and closes cleanly.
//   node tests/v3/suite/lexi-memory-063.cjs  (NODE_PATH with playwright)  → PASS line with the numbers, exit 1 on failure
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path');
const {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const CYCLES = 40, WARMUP = 3, S = '.lexi-host >> ';
(async () => {
 let B; try { B = await browser({viewport: {width: 390, height: 844}, hasTouch: true}) } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 try {
  let calls = 0;
  await B.ctx.route('**/mock-ai/', r => { calls++; const b = JSON.parse(r.request().postData() || '{}'); r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(b.mode === 'memo' ? {memory: ''} : {reply: 'Goed zo!', translation: 'Добре!', correction: null})}) });
  const page = await B.ctx.newPage(), cdp = await B.ctx.newCDPSession(page), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(([r, ai]) => {
   if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); for (const [k, v] of Object.entries({leren_release_seen: JSON.stringify(r), poly_ui: 'uk', poly_target: 'nl', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(ai)})) localStorage.setItem(k, v) }
   // timer bookkeeping: which intervals / timeouts / animation frames are still pending
   const live = {iv: new Set(), to: new Set(), raf: new Set()}; window.__timers = live;
   const si = setInterval, ci = clearInterval, st = setTimeout, ct = clearTimeout, ra = requestAnimationFrame, ca = cancelAnimationFrame;
   window.setInterval = (f, ...a) => { const id = si(f, ...a); live.iv.add(id); return id };
   window.clearInterval = id => { live.iv.delete(id); return ci(id) };
   window.setTimeout = (f, ms, ...a) => { const id = st((...x) => { live.to.delete(id); typeof f === 'function' ? f(...x) : 0 }, ms, ...a); live.to.add(id); return id };
   window.clearTimeout = id => { live.to.delete(id); return ct(id) };
   window.requestAnimationFrame = f => { const id = ra(t => { live.raf.delete(id); f(t) }); live.raf.add(id); return id };
   window.cancelAnimationFrame = id => { live.raf.delete(id); return ca(id) };
   window.__hosts = [];
  }, [rel, B.base + '/mock-ai/']);
  await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => !!window.LerenLexi && typeof lexiOpen === 'function', null, {timeout: 20000});
  const cycle = async i => {
   await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => !!document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'));
   const n0 = calls; await page.fill(S + '#draft', 'Hallo ' + i); await page.click(S + 'button.send');
   for (let k = 0; k < 100 && calls === n0; k++) await page.waitForTimeout(30);
   await page.waitForFunction(() => { const r = document.querySelector('.lexi-host')?.shadowRoot; return !!r && !r.querySelector('.lexi-thinking') && /Goed zo/.test(r.textContent) }, null, {timeout: 10000});
   await page.evaluate(() => { window.__hosts.push(new WeakRef(document.querySelector('.lexi-host'))); lexiClose() });
   return !!(await page.evaluate(() => document.querySelector('.lexi-host')));
  };
  // Blink frees DOM only on a full collection; speech retries keep utterances ≈ 2.5 s by design (app.js ttsSpeak) — settle first.
  const measure = async () => {
   await page.waitForTimeout(4000); const h = () => {}; cdp.on('HeapProfiler.addHeapSnapshotChunk', h); await cdp.send('HeapProfiler.takeHeapSnapshot', {reportProgress: false}); cdp.off('HeapProfiler.addHeapSnapshotChunk', h);
   await cdp.send('HeapProfiler.collectGarbage'); const d = await cdp.send('Memory.getDOMCounters'), heap = await cdp.send('Runtime.getHeapUsage');
   const p = await page.evaluate(() => { let n = 0; const walk = root => { const w = document.createTreeWalker(root, 0xFFFFFFFF); let x = w.currentNode; while (x) { n++; if (x.shadowRoot) walk(x.shadowRoot); x = w.nextNode() } }; walk(document);
    return {reachable: n, hostsAlive: window.__hosts.filter(r => r.deref()).length, aliveIdx: window.__hosts.map((r, i) => r.deref() ? i : -1).filter(i => i >= 0).join(','), hostsInDom: document.querySelectorAll('.lexi-host').length, intervals: window.__timers.iv.size, timeouts: window.__timers.to.size, frames: window.__timers.raf.size} });
   return {nodes: d.nodes, listeners: d.jsEventListeners, documents: d.documents, heapKB: Math.round(heap.usedSize / 1024), detached: d.nodes - p.reachable, ...p};
  };
  for (let i = 0; i < WARMUP; i++) await cycle(i);
  const a = await measure(); let leftOpen = 0;
  for (let i = 0; i < CYCLES; i++) if (await cycle(i)) leftOpen++;
  const b = await measure(), per = k => +((b[k] - a[k]) / CYCLES).toFixed(2);
  const r = {nodes: per('nodes'), detached: per('detached'), listeners: per('listeners'), heapKB: per('heapKB')};
  // reopen after the cycles: one host, works, closes
  await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => !!document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'));
  const hostsOpen = await page.evaluate(() => document.querySelectorAll('.lexi-host').length), n0 = calls;
  await page.fill(S + '#draft', 'Nog een keer'); await page.click(S + 'button.send');
  await page.waitForFunction(() => /Goed zo/.test(document.querySelector('.lexi-host')?.shadowRoot?.textContent || ''), null, {timeout: 10000});
  await page.evaluate(() => lexiClose()); const after = await page.evaluate(() => document.querySelectorAll('.lexi-host').length);
  const msg = `${CYCLES} cycles: nodes ${r.nodes} / detached ${r.detached} / listeners ${r.listeners} / heap ${r.heapKB} KB per cycle; documents ${a.documents}→${b.documents}; closed hosts alive after GC ${b.hostsAlive} of ${CYCLES + WARMUP} (only the last: cycle ${b.aliveIdx || '-'}); pending intervals ${a.intervals}→${b.intervals}, timeouts ${a.timeouts}→${b.timeouts}, frames ${b.frames}; model requests ${calls}`;
  console.log('INFO: ' + msg + '; before ' + JSON.stringify(a) + '; after ' + JSON.stringify(b));
  assert.equal(leftOpen, 0, 'every close removes the chat host');
  // Measured (2026-11-22): only the most recently closed chat may still answer a WeakRef after the collection, and it is freed
  // by the next cycles (before the 40 cycles: cycle 2 alive; after: cycle 42 alive, cycle 2 gone) — bounded, one instance, no pile-up.
  // It happens only after a reply (not for open/close without sending); DOM counters show it is not growing either.
  assert.ok(b.hostsAlive <= 1, 'at most the last closed chat is still reachable (' + b.hostsAlive + ': cycles ' + b.aliveIdx + ')');
  assert.ok(!b.aliveIdx || b.aliveIdx === String(CYCLES + WARMUP - 1), 'only the most recent chat may wait for collection, not an old one (alive: cycle ' + b.aliveIdx + ')');
  assert.ok(!a.aliveIdx || !b.aliveIdx.split(',').includes(a.aliveIdx), 'the chat that was last before the cycles is freed later (cycle ' + a.aliveIdx + ')');
  assert.ok(r.nodes <= 2, 'DOM nodes per cycle ' + r.nodes); assert.ok(r.detached <= 2, 'detached nodes per cycle ' + r.detached);
  assert.ok(r.listeners <= 0.1, 'listeners per cycle ' + r.listeners); assert.ok(r.heapKB <= 40, 'heap per cycle ' + r.heapKB + ' KB');
  assert.equal(b.documents, a.documents, 'no extra documents');
  assert.ok(b.intervals <= a.intervals, 'no interval left running by closed chats (' + a.intervals + ' → ' + b.intervals + ')');
  assert.ok(b.timeouts <= a.timeouts + 2, 'no growing pile of pending timeouts (' + a.timeouts + ' → ' + b.timeouts + ')');
  assert.equal(hostsOpen, 1, 'reopened: exactly one chat'); assert.equal(after, 0, 'reopened chat closes'); assert.ok(calls > n0, 'reopened chat sends');
  assert.deepEqual(errors, [], 'no page errors');
  console.log('PASS: Lexi memory — ' + msg + '; reopened chat works');
 } finally { await B.close() }
})().catch(e => { console.error(e); process.exit(1) });
