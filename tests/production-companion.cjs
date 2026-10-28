// Production integration: keep resumable sessions local while merging course results.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Load the real merge functions, with the production key policy replaced only for this isolated fixture.
const x=vm.createContext({syncable:()=>true});vm.runInContext(script.slice(script.indexOf('const syncEq='),script.indexOf('function syncApply(')),x);
const route=(completed,session)=>JSON.stringify({version:1,started:true,completed,mistakes:[],session});
const localSession={kind:'lesson',lesson:'comm:hallo:0',phase:1,index:1,ids:['hello'],answers:[false]};
const cloudSession={...localSession,phase:2,index:0,answers:[]};
const local={leren_path_v1:route({one:5},localSession),leren_achievements_v1:JSON.stringify({version:1,earned:{'xp-100':'2026-10-26T10:00:00Z'}}),poly_score:'100'};
const cloud={leren_path_v1:route({two:4},cloudSession),leren_achievements_v1:JSON.stringify({version:1,earned:{'lesson-1':'2026-10-26T11:00:00Z'}}),poly_score:'250'};
const merged=x.syncMerge({},local,cloud),path=JSON.parse(merged.leren_path_v1);
assert.deepEqual(path.session,localSession);assert.deepEqual(path.completed,{one:5,two:4});assert.equal(merged.poly_score,'250');assert.equal(Object.keys(JSON.parse(merged.leren_achievements_v1).earned).length,2);
assert.deepEqual(JSON.parse(x.syncMerge({}, {}, cloud).leren_path_v1).session,cloudSession);
// Award persistence is idempotent and survives blocked storage; production uses the existing CAS.
const r=vm.createContext({});r.window=r;vm.runInContext(fs.readFileSync('modules/rewards/core.js','utf8'),r);
const disk=new Map(),storage={getItem:k=>disk.get(k),setItem:(k,v)=>disk.set(k,v)};let model=r.LerenRewards.create(storage);
assert.equal(model.observe({xp:250,lessons:1}).length,3);assert.equal(model.observe({xp:250,lessons:1}).length,0);
model=r.LerenRewards.create(storage);assert.equal(Object.keys(model.state.earned).length,3);
const blocked=r.LerenRewards.create({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});blocked.observe({xp:100});assert.equal(blocked.persistent,false);
assert(html.includes('const RELEASE_VERSION="149"'));assert(!html.includes('leren_beta_progress_v1'));assert(html.includes('currentDocument.updateTime='));assert(!html.includes('modules/personal-coach/'));
console.log('PASS: production route session preserved across cloud conflicts; results, gifts and XP merge; existing CAS retained; durable awards; production release and beta scope');
