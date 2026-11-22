// LerenBe 3.0 quality audit · the grammar notes Lexi explains from (tools/ai-worker.js GRAMMAR_NL / _FR / _EN) state true rules:
// geen also replaces "no article" (Ik heb geen tijd), plurals are always «de», diminutives in -je are «het», perfectum with
// «zijn» for movement / change verbs, Belgian French meal words and numbers, French «de» after negation but not after être.
// Old wrong or absolute wordings must not come back. Static check, no model call.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const src = fs.readFileSync(path.join(__dirname, '..', 'tools', 'ai-worker.js'), 'utf8');
const block = name => { const i = src.indexOf('const ' + name + ' = `'); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('`;', i)) };
const NL = block('GRAMMAR_NL'), FR = block('GRAMMAR_FR'), EN = block('GRAMMAR_EN');
for (const [re, why] of [
 [/verb in 2nd position/, 'V2 word order'], [/inversion/, 'inversion after a first time/place word'], [/particle goes to the end/, 'separable verbs'],
 [/geen instead of een or no article before a noun/, 'geen also for nouns without an article'], [/niet otherwise/, 'niet'],
 [/diminutives -je are het/, 'diminutives are het'], [/plurals always de/, 'plurals take de'], [/de\/het must be learned with the noun/, 'no invented de/het rule'],
 [/zijn for movement\/change: gaan, komen, blijven, worden/, 'perfectum with zijn'], [/no -t when jij comes after the verb/, 'Werk jij?'],
 [/Questions: question word \+ verb \+ subject/, 'question word order']]) assert.match(NL, re, 'Dutch notes: ' + why);
assert.doesNotMatch(NL, /geen before an indefinite noun/, 'the old geen rule left out nouns without an article');
assert.doesNotMatch(NL, /de-words are always|all nouns [^.]* de\b|words ending in [^.]* are always (de|het)/, 'no invented absolute de/het rule');
assert.match(FR, /déjeuner = breakfast, dîner = lunch, souper = evening meal/, 'Belgian French meals');
assert.doesNotMatch(FR, /déjeuner = lunch/, 'the old garbled meal note');
assert.match(FR, /quatre-vingts \(80\)/, 'Belgium says quatre-vingts, not huitante');
assert.match(FR, /not after être/, 'Ce n\'est pas un chat');
assert.match(EN, /he\/she\/it \+ -s/, 'English 3rd person -s');
// the ask prompt tells Lexi not to present a rule with exceptions as absolute
assert.match(src, /state only rules that are true for \$\{T\.name\}; if there is no simple rule, say so/);
console.log('PASS: grammar notes — V2/inversion, separable verbs, geen/niet (also without an article), de/het (learned with the noun; -je het; plurals de), perfectum with zijn, Belgian French meals and numbers, de after negation except être');
