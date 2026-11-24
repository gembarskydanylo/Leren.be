// TEST-050 · Guided learning («Сьогодні з Lexi»), logic and wiring without a browser.
// Covers: preferred name (clean, edit, delete, consent), profile migration (only new keys), the one-time name question for
// existing learners, today's plan sized by daily goal and pace, resume, no double XP for a step, the name kept on the
// device (SYNC_SKIP), offline files in the Service Worker, texts in uk/en/fr/ar, no network code in the new modules.
// Run: node tests/test050-guided.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const ctx = vm.createContext({console}); vm.runInContext(read('modules/guided/core.js'), ctx); const G = ctx.LerenGuided;
function storage(init = {}) { const d = {...init}; return {d, getItem: k => k in d ? d[k] : null, setItem: (k, v) => { d[k] = String(v) }, removeItem: k => { delete d[k] }} }
const deq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m); // values come from a vm realm
const NOW = new Date(2026, 10, 23, 10), TOMORROW = new Date(2026, 10, 24, 9);

// ---- name
for (const n of ['Марія', 'محمد', 'Zoë', "O'Neil", 'Jean-Luc', 'Олена Петрівна']) assert.equal(G.cleanName(n), n, 'keeps ' + n);
assert.equal(G.cleanName('  Марія  '), 'Марія');
assert.equal(G.cleanName('<b>x</b>'), 'bx/b', 'no markup brackets');
assert.equal(G.cleanName('{{evil}}'), 'evil');
assert.equal(G.cleanName('A' + String.fromCharCode(0x202e) + 'B' + String.fromCharCode(0x200b) + 'C' + String.fromCharCode(7)), 'ABC', 'no bidi override / zero-width / control');
assert.equal([...G.cleanName('я'.repeat(80))].length, 40, '≤ 40 characters');
assert.equal(G.cleanName('   '), '');
{
 const s = storage();
 deq({...G.name(s)}, {name: '', forAI: false});
 assert.equal(G.setName(s, ' Марія ', false), 'Марія'); deq({...G.name(s)}, {name: 'Марія', forAI: false}, 'saved without AI consent');
 assert.equal(G.setForAI(s, true), true); assert.equal(G.name(s).forAI, true, 'consent is separate');
 G.setName(s, 'Maria', false); deq({...G.name(s)}, {name: 'Maria', forAI: false}, 'edit resets consent unless given again');
 G.setName(s, '', true); assert.equal(s.d.leren_learner_name, undefined, 'empty name = deleted');
 G.setName(s, 'X'); G.clearName(s); assert.equal(s.d.leren_learner_name, undefined, 'delete');
 s.d.leren_learner_name = '{bad'; assert.equal(G.name(s).name, '', 'damaged value is ignored');
 s.d.leren_learner_name = JSON.stringify({name: '<i>', forAI: 'yes'}); deq({...G.name(s)}, {name: 'i', forAI: false});
}
console.log('PASS: name — any script, cleaned, ≤40, edit/delete, AI consent separate');

// ---- profile migration and the one-time question
{
 const old = {poly_score: '420', leren_path_v1: JSON.stringify({completed: {a: 5}}), leren_achievements_v1: '{"version":1,"earned":{}}', poly_ui: 'fr', leren_rec_voice: '"f"'};
 const s = storage(old);
 assert.equal(G.profile(s).exists, false);
 assert.equal(G.askName(s, true), true, 'existing learner without a name: ask once');
 assert.equal(G.askName(s, false), false, 'a new learner gets the first run instead');
 G.saveProfile(s, {namePrompt: 'later', source: 'existing'});
 assert.equal(G.askName(s, true), false, '«Later» is not asked again');
 for (const [k, v] of Object.entries(old)) assert.equal(s.d[k], v, 'unchanged: ' + k);
 deq(Object.keys(s.d).sort(), [...Object.keys(old), 'leren_profile_v1'].sort(), 'only the profile key is added');
 const s2 = storage(); G.setName(s2, 'Ola'); assert.equal(G.askName(s2, true), false, 'name known: no question');
 s.d.leren_profile_v1 = '{"v":1,"goals":["hack","work"],"pace":"turbo","namePrompt":"x"}';
 const p = G.profile(s); deq([...p.goals], ['work']); assert.equal(p.pace, 'balanced'); assert.equal(p.namePrompt, null);
}
console.log('PASS: profile — only new keys, old progress untouched, «Later» asked once, damaged profile repaired');

// ---- personalisation: daily goal and pace
const lessons = (goal, pace) => G.plan({date: '2026-11-23', review: 4, goal, pace, practice: true}).filter(s => s.kind === 'lesson').length;
assert.equal(lessons(5, 'balanced'), 1); assert.equal(lessons(10, 'balanced'), 1); assert.equal(lessons(15, 'balanced'), 2); assert.equal(lessons(20, 'balanced'), 2); assert.equal(lessons(30, 'balanced'), 3);
assert.equal(lessons(5, 'calm'), 1); assert.equal(lessons(20, 'calm'), 1); assert.equal(lessons(20, 'intensive'), 3);
{
 const a = G.plan({date: 'd', review: 9, goal: 10, pace: 'balanced', practice: true});
 deq(a.map(s => s.kind), ['review', 'lesson', 'practice'], 'review → new material → practice');
 assert.equal(a[0].words, 5, 'review ≤ 5 words');
 deq(G.plan({date: 'd', review: 0, goal: 5, pace: 'calm', practice: true}).map(s => s.kind), ['lesson'], 'calm 5 min: one lesson only');
 assert.equal(G.plan({date: 'd', paused: 'comm:x:2', goal: 15})[0].lesson, 'comm:x:2', 'a paused lesson comes first');
 const mins = st => st.reduce((a, s) => a + s.min, 0);
 assert(mins(G.plan({date: 'd', review: 5, goal: 20, pace: 'intensive', practice: true})) > mins(G.plan({date: 'd', review: 5, goal: 5, pace: 'calm', practice: true})), 'longer goal = longer session');
}
console.log('PASS: personalisation — session size follows daily goal and pace, order review → lesson → practice');

// ---- session state: resume, no double XP, new day
{
 const s = storage(); const steps = G.plan({date: G.day(NOW), review: 3, goal: 15, practice: true});
 let st = G.start(s, {steps, course: 'A1.1', now: NOW});
 assert.equal(G.current(st).kind, 'review');
 assert.equal(G.complete(s, st, steps[0].id, {correct: 3, total: 3, gain: 0}), true);
 assert.equal(G.complete(s, st, steps[0].id, {correct: 3, total: 3, gain: 99}), false, 'a step counts once (double tap / back / reload)');
 st = G.today(s, NOW); assert.equal(G.position(st).index, 1, 'resume after reload at step 2');
 assert.equal(G.bind(s, st, st.steps[1].id, 'comm:phrases:0'), true);
 G.complete(s, st, st.steps[1].id, {correct: 5, total: 5, gain: 25});
 st = G.today(s, NOW); assert.equal(G.complete(s, st, st.steps[1].id, {gain: 25}), false, 'still once after reload');
 assert.equal(G.summary(st).gain, 25, 'XP in the summary = XP paid once');
 for (const x of st.steps.filter(x => !x.done)) G.complete(s, st, x.id, {});
 assert.equal(G.finished(G.today(s, NOW)), true);
 const more = G.extend(s, G.today(s, NOW), G.plan({date: G.day(NOW), goal: 10, practice: false}));
 assert.equal(G.finished(more), false, '«Continue learning» adds steps the same day'); assert.equal(more.round, 2);
 assert.equal(new Set(more.steps.map(x => x.id)).size, more.steps.length, 'step ids stay unique');
 assert.equal(G.today(s, TOMORROW), null, 'a new day starts a new session');
 s.d.leren_today_v1 = '{"v":1,"date":"' + G.day(NOW) + '","steps":[{"id":1}]}'; assert.equal(G.today(s, NOW), null, 'damaged session ignored');
}
console.log('PASS: session — resume after reload, a step pays once, «continue» extends, new day = new plan');

// ---- wiring in app.js / index.html / sw.js
const app = read('app.js'), html = read('index.html'), sw = read('sw.js'), lp = read('modules/learning-path/ui.js'), ui = read('modules/today/ui.js'), core = read('modules/guided/core.js');
const skip = app.match(/const SYNC_SKIP=new Set\(\[([^\]]*)\]/)[1];
for (const k of ['leren_learner_name', 'leren_today_v1']) assert(skip.includes('"' + k + '"'), k + ' stays on the device (not synced, not in backups)');
assert(!skip.includes('"leren_profile_v1"'), 'goals/pace follow the account like other settings');
const version = app.match(/RELEASE_VERSION="(\d+)"/)[1]; assert.equal(sw.match(/leren-be-v(\d+)/)[1], version, 'cache name = release');
for (const f of ['./modules/guided/core.js?v=1', './modules/today/ui.js?v=4', './modules/learning-path/ui.js?v=' + version, './app.js?v=' + version]) {
 assert(sw.includes('"' + f + '"'), 'offline: ' + f); assert(html.includes(f), 'index: ' + f);
}
assert(sw.includes('"./modules/today/style.css?v=3"') && ui.includes("'./modules/today/style.css?v=3'") && !html.includes('today/style.css'), 'Today styles: cached offline, loaded by today/ui.js, not render-blocking');
assert(sw.includes('"./img/lexi/lexi.webp"'), 'Lexi avatar works offline');
assert(html.indexOf('guided/core.js') < html.indexOf('learning-path/ui.js?v=') && html.indexOf('today/ui.js') < html.indexOf('learning-path/ui.js?v='), 'new modules load before the learning path');
for (const [n, src] of [['guided/core', core], ['today/ui', ui]]) {
 assert(!/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|navigator\.sendBeacon/.test(src), n + ': no network');
 assert(!/innerHTML|insertAdjacentHTML|outerHTML/.test(src), n + ': text only (name never parsed as HTML)');
}
assert(/if\(guidedOn\(\)\)startGuidedOnboarding\(\);else welcomeNl\(1\)/.test(app), 'Dutch: guided first run; other courses keep the old one');
assert(/if\(guidedOn\(\)\)\{todayHome\(\);return\}/.test(lp), 'home = Today');
for (const tab of ['today', 'learn', 'lexi', 'games', 'more']) assert(app.includes('"' + tab + '"'), 'dock tab ' + tab);
for (const id of ['profile', 'dict', 'progress', 'tests', 'life', 'clock', 'free', 'settings']) assert(new RegExp('id:"' + id + '"').test(app), 'More → ' + id);
console.log('PASS: wiring — name/session device-only, offline files, no network or HTML in new modules, Today + 5 tabs + More');

// ---- texts: same keys in uk/en/fr/ar
const tctx = vm.createContext({console, document: undefined}); vm.runInContext(ui, tctx);
const keys = o => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map(x => k + '.' + x) : [k]).sort();
const T = l => tctx.LerenToday.tr(l), base = keys(T('uk'));
for (const l of ['en', 'fr', 'ar']) deq(keys(T(l)), base, l + ': every text translated');
assert.notEqual(T('ar').start, T('uk').start); assert.notEqual(T('fr').start, T('en').start);
assert(/[؀-ۿ]/.test(T('ar').start), 'Arabic start button is Arabic');
console.log('PASS: texts — uk/en/fr/ar have the same keys (' + base.length + ')');
