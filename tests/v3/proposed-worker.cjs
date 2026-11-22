// LerenBe 3.0 · runs every production test that loads the AI Worker (tools/ai-worker.js) against the PROPOSED Worker
// docs/integration-3.0/ai-worker.lexi-proposed.js, so the Lexi patch is shown not to break any existing AI function
// (limits, prompt caching, explanation language, reports, exams, dialogue rules). Mocked model API, test key only, no
// network, nothing deployed. Builds a temporary copy: tests/ and tools/ copied, tools/ai-worker.js = the proposal, every
// other top-level entry linked to the repo (read only).
//   node tests/v3/proposed-worker.cjs   → PASS / FAIL per test, exit 1 on any FAIL
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
const repo = path.join(__dirname, '..', '..'), L = fs.mkdtempSync(path.join(os.tmpdir(), 'lerenbe-worker-'));
const links = [];
for (const e of fs.readdirSync(repo)) {
 if (e === 'tests' || e === 'tools' || e === '.git') continue;
 fs.symlinkSync(path.join(repo, e), path.join(L, e)); links.push(path.join(L, e));
}
fs.cpSync(path.join(repo, 'tests'), path.join(L, 'tests'), {recursive: true, filter: s => !s.includes(path.join('tests', 'v3'))});
fs.cpSync(path.join(repo, 'tools'), path.join(L, 'tools'), {recursive: true});
fs.copyFileSync(path.join(repo, 'docs/integration-3.0/ai-worker.lexi-proposed.js'), path.join(L, 'tools', 'ai-worker.js'));
const tests = fs.readdirSync(path.join(L, 'tests')).filter(f => f.endsWith('.cjs') && /ai-worker\.js/.test(fs.readFileSync(path.join(L, 'tests', f), 'utf8'))).sort();
let fail = 0;
for (const f of tests) {
 const r = spawnSync(process.execPath, [path.join(L, 'tests', f)], {cwd: L, encoding: 'utf8', timeout: 10 * 60000, maxBuffer: 1 << 26});
 const out = (r.stdout || '') + (r.stderr || ''), ok = r.status === 0;
 if (!ok) fail++;
 console.log((ok ? 'PASS ' : 'FAIL ') + f + (ok ? '' : '\n   ' + out.trim().split('\n').filter(l => !/^\s+at /.test(l)).slice(-10).join('\n   ')));
}
console.log(`\nProposed Worker against the production Worker tests: ${tests.length - fail} pass, ${fail} fail (${tests.length} tests)`);
for (const l of links) fs.unlinkSync(l);
fs.rmSync(L, {recursive: true, force: true});
process.exit(fail ? 1 : 0);
