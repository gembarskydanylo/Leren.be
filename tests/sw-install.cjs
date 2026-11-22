// Service Worker install regression: optional cache failures must not block updates.
// Run: node tests/sw-install.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('sw.js','utf8');
// The atomic app shell: the page, the manifest, Lexi's engine and every script / style of index.html (APP_SHELL in sw.js).
const shellCtx=vm.createContext({self:{addEventListener(){}}});vm.runInContext(source+';globalThis.__s=APP_SHELL',shellCtx);
const critical=[...new Set(['./','./index.html','./manifest.webmanifest','./modules/lexi/engine.js?v=5',...shellCtx.__s])];
assert.ok(critical.length>70&&critical.includes('./app.js?v=264')&&critical.includes('./modules/learning-path/ui.js?v='+(source.match(/learning-path\/ui\.js\?v=(\d+)/)||[])[1]),'the shell holds app.js and the learning path');
async function simulate(fail){
 const handlers={},added=[],opened=[],deleted=[];
 let waiting=0,claimed=0;
 const old=['leren-be-v167','unrelated-cache'];
 const cache={
  async addAll(files){assert.deepEqual(Array.from(files),critical);if(fail==='critical'||fail==='shell-script')throw Error('critical asset unavailable');added.push(...files)},
  async add(file){if(fail==='optional'&&file.includes('img/'))throw Error('optional image unavailable');if(fail==='quota'&&added.length>=600){const e=Error('The quota has been exceeded.');e.name='QuotaExceededError';throw e}if(fail==='slow')await new Promise(r=>setTimeout(r,1));added.push(file)},
 };
 const caches={open:async name=>{opened.push(name);return cache},keys:async()=>old,delete:async key=>{deleted.push(key);return true}};
 const self={addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{waiting++},clients:{claim:async()=>{claimed++}}};
 const ctx=vm.createContext({self,caches,Promise,URL,Response,console});
 vm.runInContext(source,ctx,{timeout:2000});
 let install;handlers.install({waitUntil:p=>install=p});
 let error=null;try{await install}catch(e){error=e}
 if(fail==='critical'||fail==='shell-script'){
  assert(error,'critical failure must reject installation');assert.equal(waiting,0);
  return;
 }
 assert.equal(error,null);assert.equal(waiting,1);
 assert(opened.every(name=>name==='leren-be-v264'));
 assert(added.includes('./index.html'));assert(added.includes('./dict/nl.json'));assert(added.includes('./modules/learning-path/invitation.js?v=2'));assert(added.includes('./modules/learning-path/invitation.css?v=1'));
 if(fail==='optional')assert(added.length<1051,'some optional files should fail');
 else if(fail==='quota')assert.equal(added.length,600,'cache quota: the shell and the files that fit are kept, the update still installs');
 else assert.equal(added.length,1080); // LerenBe 3.0: +28 files (Lexi, home v2, design system, LIFE i18n), −4 unused PNGs
 let activate;handlers.activate({waitUntil:p=>activate=p});await activate;
 assert.deepEqual(deleted,['leren-be-v167']);assert.equal(claimed,1);
}
(async()=>{
 await simulate(null);
 await simulate('optional');
 await simulate('critical');
 await simulate('shell-script'); // e.g. modules/learning-path/ui.js fails: the update waits, the old release keeps its whole cache
 await simulate('quota'); // storage full while caching optional media
 await simulate('slow'); // slow network: every file still arrives, one batch of 20 at a time
 console.log('PASS: full install, optional failure tolerance, critical failure safety, cache quota, slow network, cache activation');
})().catch(e=>{console.error(e);process.exitCode=1});
