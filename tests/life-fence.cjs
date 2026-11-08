// LerenBe LIFE: original fence pilot content and isolated storage. Run: node tests/life-fence.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'modules/life/fence/mission.js'),'utf8');
const page=fs.readFileSync(path.join(root,'modules/life/fence/index.html'),'utf8');
const ctx=vm.createContext({});vm.runInContext(src,ctx);
const M=ctx.LerenLifeFence;
assert.equal(M.stateKey,'leren_life_fence_v1');
assert.equal(M.scenes.length,6);assert(M.vocabulary.length>=20);
const ids=new Set();for(const s of M.scenes){
 assert(!ids.has(s.id),'unique scene ID');ids.add(s.id);
 assert(s.title&&s.context&&s.prompt&&s.phrase&&s.translate&&s.grammar&&s.feedback);
 assert.equal(s.options.length,3);assert(Number.isInteger(s.correct)&&s.correct>=0&&s.correct<s.options.length);
 assert.equal(s.options[s.correct],s.phrase,'canonical phrase is correct option');
 assert.equal(M.grade(s.id,s.correct).correct,true);
 s.options.forEach((_,i)=>assert.equal(M.grade(s.id,i).correct,i===s.correct));
}
assert.equal(M.grade('no-such-scene',0),null);
assert.equal(M.normalize('  Hoeveel  centimeter  dieper? '),'hoeveel centimeter dieper');
const words=M.vocabulary.map(w=>w.nl);
for(const w of ['de hamer','de schroefmachine','de waterpas','de diepte','de hoogte','diep','niet te diep','hoeveel centimeter?','de paal'])assert(words.includes(w),w);
for(const w of M.vocabulary)assert(w.nl&&w.uk&&['tools','fence','measure'].includes(w.cat));
assert(page.includes('src="mission.js"'),'page loads mission data');
assert(page.includes('nl-BE'),'Belgian Dutch speech');
assert(page.includes('noindex,nofollow'),'pilot is not publicly indexed');
assert(page.includes('localStorage.getItem(M.stateKey)'),'isolated progress');
assert(!page.includes('leren_path_v1'),'does not access existing Dutch route');
assert(!page.includes('innerHTML'),'no dynamic HTML injection');
console.log('PASS: LIFE fence pilot — 6 scenes, vocabulary, answers, isolated storage and accessible standalone page');
