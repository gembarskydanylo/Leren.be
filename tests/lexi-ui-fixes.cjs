// Lexi UI fixes of releases 262–264 live in modules/lexi/ (chat.js, copy.js, mock.js, chat.css), which were generated from the
// TEST-030 design lab (Leren.be-test, tools/lexi-ui-port.cjs). The lab does not have these fixes yet, so a new generation
// copied into this repo would silently undo them. This test fails if any of them disappears. The same list guards the
// generator (docs/integration-3.0/lexi-ui-port-guard.patch); lab sync: docs/integration-3.0/lexi-lab-sync-264.patch.
// Run: node tests/lexi-ui-fixes.cjs
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const dir = path.join(__dirname, '..', 'modules/lexi');
const KEEP = {
 'chat.js': [['context action from reply_type', 'function actionFor('], ['explanation in the interface language', 'result.explain?'], ['older-Worker fallback: a short reply ending with a question', 'c.length<=240'], ['«explain more simply» request', "kind==='simpler'"]],
 'copy.js': [['«Explain more simply» label', 'simpler:('], ['«Show examples» label', 'showExamples:('], ['«Try again» label', 'retry:('], ['speaking-practice caption', 'eyebrow:(']],
 'chat.css': [['keyboard layout on tablets / landscape', '.lexi-keyboard .lexi-app{height:var(--lexi-viewport-height']],
 'mock.js': [['mock correction carries has_error', 'has_error:true']],
};
const lost = [];
for (const [f, marks] of Object.entries(KEEP)) { const src = fs.readFileSync(path.join(dir, f), 'utf8'); for (const [name, mark] of marks) if (!src.includes(mark)) lost.push(f + ': ' + name) }
assert.deepEqual(lost, [], 'Lexi UI fixes lost (a regeneration from the stale TEST-030 lab?):\n - ' + lost.join('\n - '));
// the guard patch for the generator checks the same list
const guard = fs.readFileSync(path.join(__dirname, '..', 'docs/integration-3.0/lexi-ui-port-guard.patch'), 'utf8');
for (const marks of Object.values(KEEP)) for (const [, mark] of marks) assert.ok(guard.includes(JSON.stringify(mark).slice(1, -1)) || guard.includes(mark), 'generator guard misses: ' + mark);
console.log('PASS: Lexi UI keeps the fixes of releases 262–264 (10 markers in chat.js, copy.js, chat.css, mock.js); the generator guard checks the same list');
