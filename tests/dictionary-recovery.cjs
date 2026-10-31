// Regression tests for dictionary recovery after a temporary network failure.
// Run: node tests/dictionary-recovery.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('tools/dict-ui.js', 'utf8');
const start = source.indexOf('const DICT={');
const end = source.indexOf('function dictCorpus()', start);
assert(start >= 0 && end > start, 'Dictionary loading implementation must be present');
const loader = source.slice(start, end);
const listeners = {};
let now = 100000, calls = 0, shouldFail = true, renders = 0;
const entries = [{w:'fiets',p:'n',uk:'велосипед'}];
const ctx = vm.createContext({
 Date: {now:()=>now},
 Promise, Error, Array, Map, String,
 window: {addEventListener:(name,fn)=>{listeners[name]=fn}},
 DX: {build:list=>({entries:list})},
 allVocab:()=>[],
 fetch:async()=>{
   calls++;
   if(shouldFail) throw Error('offline');
   return {ok:true,json:async()=>entries.map(e=>({...e}))};
 },
 runSearch:()=>{renders++}
});
vm.runInContext(loader, ctx);
const state = vm.runInContext('DICT',ctx);
(async()=>{
 const fallback = await vm.runInContext('dictLoad()',ctx);
 assert.equal(state.offline,true,'failure should enter fallback mode');
 assert.equal(fallback.entries.length,0,'fallback should remain usable');
 assert.equal(calls,1);
 await vm.runInContext('dictLoad()',ctx);
 assert.equal(calls,1,'retry should be throttled during outage');
 shouldFail=false;
 now+=30001;
 const recovered=await vm.runInContext('dictLoad()',ctx);
 assert.equal(calls,2,'retry should fetch after cooldown');
 assert.equal(recovered.entries.length,1,'full dictionary should replace fallback');
 assert.equal(state.offline,false);
 assert.equal(state.retryAt,0);
 await vm.runInContext('dictLoad()',ctx);
 assert.equal(calls,2,'successful dictionary should be cached');
 // A separate offline session should recover immediately when the browser goes online.
 vm.runInContext('DICT.ix=null;DICT.offline=false',ctx);
 shouldFail=true;
 await vm.runInContext('dictLoad()',ctx);
 assert.equal(state.offline,true);
 shouldFail=false;
 listeners.online();
 // Allow the asynchronous event handler to complete.
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.offline,false,'online event should restore the full dictionary');
 assert.equal(state.ix.entries.length,1);
 assert(renders>=1,'online recovery should refresh dictionary results');
 console.log('PASS: dictionary fallback, cooldown, recovery, cache, online event');
})().catch(e=>{console.error(e);process.exitCode=1});
