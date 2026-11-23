// LRN-004 · no fixed exam dates. The exam screen of course 1.1 showed «Thu 29.10 / Fri 30.10» (a past exam) in every language,
// and the AI exam coach must never invent a date: it may only use a date the learner gives.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const DATE = /\b(0?[1-9]|[12]\d|3[01])[./](0?[1-9]|1[0-2])\b|\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Пн|Вт|Ср|Чт|Пт|Сб|Нд|Lun|Mar|Mer|Jeu|Ven)\b\.? ?\d/;
for (const f of ['modules/exam/exam11.js', 'modules/exam/exam12.js']) {
 const whens = [...read(f).matchAll(/when:"([^"]*)"/g)].map(m => m[1]);
 assert.ok(whens.length >= 4, f + ': the «when» line in 4 languages');
 for (const w of whens) assert.doesNotMatch(w, DATE, f + ': a fixed date on the exam screen: ' + w);
}
const worker = read('tools/ai-worker.js');
assert.equal(worker, read('docs/integration-3.0/ai-worker.lexi-proposed.js'), 'both Worker files identical');
const coach = worker.slice(worker.indexOf('const EXAM11_COACH'), worker.indexOf('\n', worker.indexOf('Be encouraging', worker.indexOf('const EXAM11_COACH'))));
assert.match(coach, /Do not claim an exam date or how many days remain unless the learner provides the date/, 'the coach may not invent a date');
// prompt texts: no calendar dates (the API version header 2023-06-01 and the build tag are not prompt text)
const prompts = worker.replace(/"anthropic-version": "[^"]+"/g, '').replace(/^\/\/.*$/gm, '');
for (const m of prompts.matchAll(/`[^`]*`|"[^"\n]{40,}"/g)) {
 assert.doesNotMatch(m[0], /\b20\d\d-\d\d-\d\d\b|\b(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])\.\b|\b\d{1,2} (januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/i, 'a date in a prompt: ' + m[0].slice(0, 80));
}
console.log('PASS: no fixed exam dates on the exam screens (A1.1, A1.2 × 4 languages); the AI coach only uses a date the learner gives; no dates in the Worker prompts');
