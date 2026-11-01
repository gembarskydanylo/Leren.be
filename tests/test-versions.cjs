// Updated A1.2 tests get new IDs: old results stay saved, are not counted for the new version,
// and the new version is passed on its own. Run: node tests/test-versions.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({console,assert,shuffle:x=>x});
vm.runInContext(read('modules/test-library/ui.js'),c);
vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored')),c);
const start=script.indexOf('const DIPH_UI = '),end=script.indexOf('\nlet toetsId',start);
vm.runInContext(script.slice(start,end)+'\n'+script.slice(script.indexOf('const BUILD_BANK='),script.indexOf('const SENT='))+'\nLerenTestLibrary.ensureCombined(TOETS);globalThis.fixture={TOETS,LerenCurriculum};',c);
const {TOETS,LerenCurriculum}=c.fixture,byId=id=>TOETS.find(t=>t.id===id);

// 1. Changed tests have new IDs; the old IDs are gone from the catalogue.
const renamed={course_travel_v2:'course_travel_v3',course_wonen_v2:'course_wonen_v3',course_grammar2_v2:'course_grammar2_v3','block_a12-1-4_v109':'block_a12-1-4_v171','block_a12-5-8_v109':'block_a12-5-8_v171'};
for(const [oldId,newId] of Object.entries(renamed)){assert(!byId(oldId),'Old ID must not be reused: '+oldId);assert(byId(newId),'Missing '+newId)}
for(const id of ['travel','wonen','grammar2'])assert.equal(LerenCurriculum.testId(id),renamed['course_'+id+'_v2']);
// Unchanged tests keep their IDs (A1.1 chapters, A1.1 blocks, untouched A1.2 chapters, exams and level test).
for(const id of ['course_comm_v2','course_shopping_v2','course_past_v2','course_holiday_v2','course_service_v2','course_contact_v2','course_reading_v2','block_a11-1-6_v109','block_a11-7-12_v109','lt_a12_course_v2','t10_course_v2','course_reading_texts_v1','course_thursday_order_v1'])assert(byId(id),'Unchanged test lost its ID: '+id);
assert.equal(LerenCurriculum.testId('comm'),'course_comm_v2');
// The learning path opens chapter tests through the same mapping.
assert(html.includes('TOETS.find(t=>t.id===LerenCurriculum.testId(id))'),'Learning path must open the current test version');

// 2. Saved results: an old perfect score stays in storage but does not pass the new version.
const saved={course_travel_v2:10,course_wonen_v2:10,course_grammar2_v2:10,'block_a12-1-4_v109':12,'block_a12-5-8_v109':12,course_comm_v2:7};
const best=JSON.parse(JSON.stringify(saved));
const passed=t=>best[t.id]!=null&&best[t.id]>=Math.ceil(t.questions.length*(t.pass||70)/100);
for(const newId of Object.values(renamed))assert.equal(passed(byId(newId)),false,'Old result must not count for '+newId);
assert(passed(byId('course_comm_v2')),'Unchanged tests keep their result');
const blocks=c.LerenTestLibrary.blocks(TOETS,'a12');assert(blocks.every(b=>b.tests.every(t=>!Object.hasOwn(saved,t.id)||t.id==='course_comm_v2')));

// 3. Finishing the new version runs the real save code from index.html: it records the new ID and keeps the old entries.
const saveCode=script.match(/const bestMap = lsGet\("poly_toetsbest",\{\}\)[^\n]*\n[^\n]*\n[^\n]*bestMap\[test\.id\] = toetsRight;[^\n]*\n/)[0];
const storage={poly_toetsbest:JSON.stringify(saved)};
const run=(test,toetsRight)=>{const x=vm.createContext({test,toetsRight,lsGet:(k,d)=>k in storage?JSON.parse(storage[k]):d,lsSet:(k,v)=>storage[k]=JSON.stringify(v)});vm.runInContext(saveCode+';globalThis.out={prev,gain};',x);return x.out};
const travel=byId('course_travel_v3');
let r=run(travel,8);assert.equal(r.prev,0,'The new version starts without a previous best');assert.equal(r.gain,80,'XP for the new version is earned independently');
let stored=JSON.parse(storage.poly_toetsbest);assert.equal(stored.course_travel_v3,8);
for(const [k,v] of Object.entries(saved))assert.equal(stored[k],v,'Old result must stay saved: '+k);
r=run(travel,6);assert.equal(r.prev,8);assert.equal(r.gain,0);assert.equal(JSON.parse(storage.poly_toetsbest).course_travel_v3,8,'A weaker retry does not lower the best');
best.course_travel_v3=8;assert(passed(travel),'The new version is passed on its own result');
console.log('PASS: 5 changed A1.2 tests got new IDs, unchanged IDs kept, old results stay saved but do not count, new versions are passed and rewarded independently');
