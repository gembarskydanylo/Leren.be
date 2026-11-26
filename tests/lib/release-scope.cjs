// Which changed files make a new release (a new Service Worker cache name) necessary?
// A release is needed when a change can reach learners through the app or its offline cache: the app shell, scripts,
// styles, modules, data, pictures, audio, fonts, the web manifest, sw.js, and every page or file the Service Worker
// precaches. Files that never reach the app do not need one: tests, documentation, audits, CI and repo tooling,
// server-side code deployed separately (tools/, wrangler.toml, firestore.rules, firebase.json), store listings,
// crawler files (robots.txt, sitemap.xml, CNAME, .well-known/), and HTML pages outside the offline cache, which the
// Service Worker always fetches from the network first (navigation), so a new version arrives without a release.
// Anything not on the "no release" list counts as an app change: an unknown file asks for a release, never the reverse.
const {execSync} = require('node:child_process'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const NO_RELEASE = [
 /^tests\//, /^docs\//, /^audits\//, /^\.github\//, /^\.claude\//, /^graphify-out\//, /^tools\//, /^store\//,
 /\.md$/i, /^README\.txt$/, /^CARDS-MANIFEST\.csv$/, /^\.gitignore$/, /^\.mcp\.json$/,
 /^wrangler\.toml$/, /^firestore\.rules$/, /^firebase\.json$/,
 /^robots\.txt$/, /^sitemap\.xml$/, /^CNAME$/, /^\.nojekyll$/, /^\.well-known\//
];
// Final offline list of a sw.js source (after its loops and pushes), as site paths without "./" and without "?v=…".
function precached(swSource) {
 const c = {self: {addEventListener() {}, location: {origin: 'http://x', hostname: 'x'}}, console, URL, caches: {}, fetch: () => Promise.reject(new Error('no network'))};
 vm.createContext(c); vm.runInContext(swSource + ';this.__F = APP_FILES', c);
 return new Set([...c.__F].map(f => String(f).replace(/^\.\//, '').replace(/\?.*$/, '')).map(f => f === '' ? 'index.html' : f));
}
// Is this changed path an app change? `cached` is the union of the offline lists before and after.
function isAppChange(file, cached) {
 if (cached.has(file)) return true;                         // anything the Service Worker keeps offline
 if (NO_RELEASE.some(re => re.test(file))) return false;
 if (/\.html$/i.test(file) && file !== 'index.html') return false; // network-first navigation, not precached
 return true;                                               // scripts, styles, modules, data, media, manifest, sw.js, unknown
}
// Files changed between `prev` (a git revision) and the working tree, tracked and untracked, deletions included.
function changedFiles(repo, prev) {
 const run = c => execSync(c, {cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28}).split('\n').filter(Boolean);
 return [...new Set([...run(`git diff --name-only ${prev} --`), ...run('git ls-files --others --exclude-standard')])].sort();
}
function releaseScope(repo, prev) {
 const cur = precached(fs.readFileSync(path.join(repo, 'sw.js'), 'utf8'));
 let before = new Set(); try { before = precached(execSync(`git show ${prev}:sw.js`, {cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28})) } catch {}
 const cached = new Set([...cur, ...before]), changed = changedFiles(repo, prev);
 return {changed, app: changed.filter(f => isAppChange(f, cached)), other: changed.filter(f => !isAppChange(f, cached))};
}
module.exports = {NO_RELEASE, precached, isAppChange, changedFiles, releaseScope};
