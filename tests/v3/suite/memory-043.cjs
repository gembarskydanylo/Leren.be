// TEST-043 · Memory regression (Chromium + CDP DOM counters after a settle and a full collection; not a phone).
// Quiz rounds, view switches and Lexi open/close must not grow event listeners or DOM nodes. (TEST-043 saw ≈ 222 nodes per
// Lexi cycle; LerenBe 3.0 traced it to the lab itself holding an element handle, fixed in tools/test-043/perf-lab.cjs.)
const assert = require('node:assert/strict');
const {run} = require('../tools/test-043/perf-lab.cjs');
(async () => {
 let o; try { o = await run({rounds: 40}) } catch (e) { if (/Executable doesn't exist|Cannot find module 'playwright'/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 assert.ok(o.quiz.listenersPerRound <= 0.1, 'quiz: listeners per round ' + o.quiz.listenersPerRound);
 assert.ok(o.quiz.nodesPerRound <= 1, 'quiz: DOM nodes per round ' + o.quiz.nodesPerRound);
 assert.ok(o.views.listenersPerSwitch <= 0.2, 'views: listeners per switch ' + o.views.listenersPerSwitch);
 assert.ok(o.views.nodesPerSwitch <= 3, 'views: DOM nodes per switch ' + o.views.nodesPerSwitch);
 assert.equal(o.lexi.listenersPerCycle, 0, 'Lexi: no listener left behind');
 // LerenBe 3.0: P-1 was the lab holding an element handle (tools/test-043/perf-lab.cjs); measured 0 nodes per cycle over 50 cycles
 assert.ok(o.lexi.nodesPerCycle <= 5, 'Lexi: retained DOM nodes per open/close ' + o.lexi.nodesPerCycle);
 assert.ok(o.lexi.heapKBPerCycle <= 50, 'Lexi: JS heap per cycle ' + o.lexi.heapKBPerCycle + ' KB');
 assert.equal(o.longTasksTotal.maxMs < 200, true, 'no long task ≥ 200 ms');
 console.log(`PASS: memory — quiz ${o.quiz.rounds} rounds: ${o.quiz.listenersPerRound} listeners / ${o.quiz.nodesPerRound} nodes per round; views: ${o.views.listenersPerSwitch} / ${o.views.nodesPerSwitch}; Lexi: 0 listeners, ${o.lexi.nodesPerCycle} nodes, ${o.lexi.heapKBPerCycle} KB heap per cycle; quiz ${o.quizMsPerRound} ms per round`);
})().catch(e => { console.error(e); process.exit(1) });
