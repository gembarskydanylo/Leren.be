// Independent read-only release audit. Run from any cwd: node tests/diagnostics/lerenbe273-audit.cjs
// Checks desired invariants, not the implementation. Exit 1 on confirmed defects. Deliberately outside tests/*.cjs.
// Does not touch application files, real learner storage, a network, Firebase or AI.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const ctx={};vm.createContext(ctx);for(const f of ['modules/learning-path/core.js','modules/guided/core.js'])vm.runInContext(read(f),ctx);
const course={lessons:[{id:'a',ids:['w1'],chapter:'ch'},{id:'b',ids:['w2'],chapter:'ch'}],chapters:[{id:'ch',level:'A1.1'}],cards:new Map([['w1',{id:'w1'}],['w2',{id:'w2'}]])};
const tests=[
 ['P1: a second open model must preserve another tab’s completed lesson',()=>{
  const s=memory(),a=ctx.LerenLearningPath.create(course,s),b=ctx.LerenLearningPath.create(course,s);a.begin('a');
  for(let p=0;p<3;p++){a.advance('w1',true);if(p<2)a.nextPhase()}a.finish();assert.equal(JSON.parse(s.getItem('leren_path_v1')).completed.a,1);
  b.begin('b');assert.equal(JSON.parse(s.getItem('leren_path_v1')).completed.a,1,'stale tab erased completed lesson a');
 }],
 ['P1: essential module failure must prevent activation/deletion of the prior cache',async()=>{
  const handlers={},keys=new Set(['leren-be-v264']),files=new Set();let skipped=false,promise;
  const cache={addAll:async xs=>xs.forEach(x=>files.add(x)),add:async f=>{if(f.includes('modules/learning-path/core.js'))throw Error('HTTP 503');files.add(f)}};
  const sandbox={self:{location:{origin:'http://localhost'},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{skipped=true},clients:{claim:async()=>{}}},caches:{open:async n=>{keys.add(n);return cache},keys:async()=>[...keys],delete:async n=>keys.delete(n)},console,URL};
  vm.createContext(sandbox);vm.runInContext(read('sw.js'),sandbox);handlers.install({waitUntil:p=>promise=p});let rejected=false;try{await promise}catch{rejected=true}
  if(!rejected){handlers.activate({waitUntil:p=>promise=p});await promise}
  assert(rejected||(!skipped&&keys.has('leren-be-v264')),'503 for the required route core still activates v273 and deletes v264');
 }],
 ['P2: an extended daily plan must survive reloading',()=>{
  const s=memory(),G=ctx.LerenGuided,now=new Date('2026-11-26T12:00:00Z'),steps=G.plan({date:G.day(now),goal:30,pace:'intensive',practice:true});
  const state=G.start(s,{steps,course:'A1.1',now});for(const step of state.steps)G.complete(s,state,step.id,{});
  G.extend(s,state,steps);for(const step of state.steps)if(!step.done)G.complete(s,state,step.id,{});G.extend(s,state,steps);
  assert.equal(state.steps.length,15);assert(G.today(s,now),'15-step plan written by extend() is rejected by today() after reload');
 }]
];
(async()=>{let failures=0;for(const[name,test]of tests)try{await test();console.log('PASS '+name)}catch(e){failures++;console.error('FAIL '+name+'\n  '+e.message)}console.log(`${tests.length-failures} pass / ${failures} fail`);process.exitCode=failures?1:0})().catch(e=>{console.error(e);process.exitCode=1});
