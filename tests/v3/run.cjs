// LerenBe 3.0 · runs the LerenBe 3.0 tests (copied unchanged from gembarskydanylo/Leren.be-test, release 262) against
// this production tree. Those tests read the app from `app/` (and the LIFE story engine from `life/`); here the app is the
// repo root, so each run builds a temporary layout: app → repo root, life → repo root, tests = tests/v3/suite (copied, so
// __dirname/.. is the layout), tools/test-043 = the TEST labs, tools/ai-worker.js = the PROPOSED Worker in
// docs/integration-3.0 (the production Worker in tools/ is not changed by this integration).
// Tests that only make sense inside Leren.be-test (its design lab, its git refs, its beta isolation) are listed in
// NOT_HERE with the reason and reported as NOT RUN — never as PASS.
//   node tests/v3/run.cjs [name-filter]      → PASS / FAIL / SKIP / NOT RUN per test, exit 1 on any FAIL
//   V3_VERBOSE=1 node tests/v3/run.cjs x      → also prints the whole output of each failing test
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
const repo = path.join(__dirname, '..', '..'), suite = path.join(__dirname, 'suite'), filter = new RegExp(process.argv[2] || '.');
const NOT_HERE = {
 'test-isolation.cjs': 'checks the Leren.be-test beta snapshot isolation (closed CSP, noindex); production is not isolated by design',
 'beta-daily.cjs': 'checks the beta snapshot daily marker of Leren.be-test',
 'sw-release-chain.cjs': 'walks the git refs of Leren.be-test (app/sw.js); production chain 226 → 263 is tests/v3/upgrade-prod.cjs',
 'sw-upgrade.cjs': 'archives older Leren.be-test refs (app/ + life/); production upgrade is tests/v3/upgrade-prod.cjs',
 'sw-manifests.cjs': 'compares with origin/main:app/sw.js of Leren.be-test; production chain is tests/v3/upgrade-prod.cjs',
 'lexi-keyboard-033.cjs': 'tests the design-lab source of the Lexi UI (Codex lab, only in Leren.be-test)',
 'lexi-mobile-033.cjs': 'tests the design-lab source of the Lexi UI (Codex lab, only in Leren.be-test)',
 'lexi-features-033.cjs': 'tests the design-lab source of the Lexi UI (Codex lab, only in Leren.be-test)',
 'lexi-integration.cjs': 'starts with tools/lexi-ui-port.cjs --check against design-lab (only in Leren.be-test); the app side of Lexi is covered by lexi-app, lexi-reliability-043, lesson-help-042, lexi-ai-038',
 'lexi-test-worker.cjs': 'checks the separate test Worker config of Leren.be-test (tools/lexi-test-worker.toml, lexi-test-server.cjs)',
 'personal-coach.cjs': 'tests the Leren.be-test root beta snapshot (modules/personal-coach, inline script), which is neither the 3.0 app nor production',
 'rewards.cjs': 'pins the older rewards copy of the Leren.be-test root beta snapshot (8 badges, inline script); production modules/rewards/core.js is byte-identical to the 3.0 app one (9 badges, incl. the first-exam badge)',
 'appcheck-verify.cjs': 'App Check prototype of Leren.be-test (tools/appcheck-verify.mjs); not part of this integration (App Check enforcement stays off)',
};
function layout() {
 const L = fs.mkdtempSync(path.join(os.tmpdir(), 'lerenbe-v3-'));
 fs.symlinkSync(repo, path.join(L, 'app')); fs.symlinkSync(repo, path.join(L, 'life'));
 fs.cpSync(suite, path.join(L, 'tests'), {recursive: true});
 fs.mkdirSync(path.join(L, 'tools'));
 fs.cpSync(path.join(__dirname, 'tools', 'test-043'), path.join(L, 'tools', 'test-043'), {recursive: true});
 fs.copyFileSync(path.join(repo, 'docs/integration-3.0/ai-worker.lexi-proposed.js'), path.join(L, 'tools', 'ai-worker.js'));
 for (const f of fs.readdirSync(path.join(__dirname, 'root'))) fs.copyFileSync(path.join(__dirname, 'root', f), path.join(L, f));
 fs.mkdirSync(path.join(L, 'docs', 'audits', 'test-043'), {recursive: true});
 return L;
}
const L = layout(), res = [];
for (const f of fs.readdirSync(path.join(L, 'tests')).filter(f => f.endsWith('.cjs')).sort()) {
 if (!filter.test(f)) continue;
 if (NOT_HERE[f]) { res.push(['NOT RUN', f, NOT_HERE[f]]); continue }
 const t0 = Date.now(), r = spawnSync(process.execPath, [path.join(L, 'tests', f)], {cwd: L, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 15 * 60000});
 const out = (r.stdout || '') + (r.stderr || ''), st = r.status === 0 ? (/^SKIP/m.test(out) && !/^PASS/m.test(out) ? 'SKIP' : 'PASS') : 'FAIL';
 res.push([st, f, ((Date.now() - t0) / 1000).toFixed(0) + 's', st === 'FAIL' ? [...out.split('\n').filter(l => /^(\S*Error|AssertionError|FAIL)/.test(l)).slice(0, 3), ...out.trim().split('\n').slice(-12)].join('\n   ') : out.trim().split('\n').filter(l => /^(PASS|SKIP)/.test(l)).slice(0, 3).join(' | ').slice(0, 300)]);
 console.log(res.at(-1).slice(0, 3).join(' '));
 if ((st === 'FAIL' && process.env.V3_VERBOSE) || process.env.V3_VERBOSE === 'all') console.log(out);
}
for (const [st, f, why] of res.filter(r => r[0] === 'NOT RUN')) console.log(st, f, '—', why);
const n = s => res.filter(r => r[0] === s).length;
console.log(`\nLerenBe 3.0 suite: ${n('PASS')} pass, ${n('FAIL')} fail, ${n('SKIP')} skip, ${n('NOT RUN')} not run (listed above)`);
for (const r of res.filter(r => r[0] === 'FAIL')) console.log('\nFAIL ' + r[1] + '\n   ' + r[3]);
// remove the two links first (never follow them into the repo), then the temporary copies
for (const l of ['app', 'life']) fs.unlinkSync(path.join(L, l));
fs.rmSync(L, {recursive: true, force: true});
process.exit(n('FAIL') ? 1 : 0);
