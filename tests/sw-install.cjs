// Service Worker install regression. Run: node tests/sw-install.cjs
// LerenBe 273 (Codex P1-02): every page, script and stylesheet of the release (the app shell) must be in the new cache before
// the update installs; one unavailable shell file (503, network error) fails the install, so the working release and its
// cache stay. Optional media must not block an update. Older caches are deleted only when the new shell is complete.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('sw.js','utf8');
const CACHE=(source.match(/const CACHE_NAME = "([^"]+)"/)||[])[1];
const info=vm.createContext({self:{addEventListener(){},location:{origin:'http://x',hostname:'x'}},console,URL});
vm.runInContext(source+';this.__F=APP_FILES;this.__S=shellFiles();',info);
const APP=[...info.__F],SHELL=[...info.__S];
async function simulate(fail,{evict=null}={}){
 const handlers={},added=new Set(),opened=[],deleted=[];
 let waiting=0,claimed=0,installed=false;
 const old=['leren-be-v167','unrelated-cache',CACHE];
 const cache={
  async addAll(){throw Error('install must check every shell file itself (cache.add per file)')},
  async add(file){
   if(typeof fail==='string'&&fail.startsWith('shell:')&&file===fail.slice(6))throw Error('HTTP 503');
   if(fail==='optional'&&file.includes('img/'))throw Error('optional image unavailable');
   if(fail==='quota'&&added.size>=600){const e=Error('The quota has been exceeded.');e.name='QuotaExceededError';throw e}
   if(fail==='slow')await new Promise(r=>setTimeout(r,1));
   added.add(file);
  },
  async match(file){return added.has(file)&&!(installed&&file===evict)?{}:undefined},
 };
 const caches={open:async name=>{opened.push(name);return cache},keys:async()=>old,delete:async key=>{deleted.push(key);return true}};
 const self={addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{waiting++},clients:{claim:async()=>{claimed++}},location:{origin:'http://x',hostname:'x'}};
 const ctx=vm.createContext({self,caches,Promise,URL,Response,console,setTimeout});
 vm.runInContext(source,ctx,{timeout:2000});
 let install;handlers.install({waitUntil:p=>install=p});
 let error=null;try{await install}catch(e){error=e}
 if(typeof fail==='string'&&fail.startsWith('shell:')){
  assert(error,'a missing shell file must reject the installation: '+fail);assert.equal(waiting,0,'no skipWaiting: '+fail);
  return;
 }
 assert.equal(error,null);assert.equal(waiting,1);
 assert(opened.every(name=>name===CACHE));
 for(const f of SHELL)assert(added.has(f),'shell file cached: '+f);
 assert(added.has('./dict/nl.json'));assert(added.has('./modules/learning-path/invitation.js?v=2'));assert(added.has('./modules/learning-path/invitation.css?v=1'));
 if(fail==='optional')assert(added.size<APP.length,'some optional files should fail');
 else if(fail==='quota')assert.equal(added.size,600,'cache quota: the shell and the files that fit are kept, the update still installs');
 else assert.equal(added.size,1085); // LerenBe 3.0: +28 files (Lexi, home v2, design system, LIFE i18n), −4 unused PNGs; TEST-050: +3 (guided/core.js, today/ui.js, today/style.css); TEST-050 focus: +2 (focus-lesson/ui.js, focus-lesson/style.css)
 installed=true;let activate;handlers.activate({waitUntil:p=>activate=p});await activate;
 if(evict)assert.deepEqual(deleted,[],'a shell file vanished before activation: the previous caches stay');
 else assert.deepEqual(deleted,['leren-be-v167']);
 assert.equal(claimed,1);
}
(async()=>{
 // The shell: every script and stylesheet the release has, the pages and the manifest; media is not in it.
 assert(SHELL.length>=100,'shell lists the scripts and stylesheets ('+SHELL.length+')');
 for(const f of ['./','./index.html','./manifest.webmanifest','./app.js?v=275','./modules/learning-path/core.js?v=275','./modules/guided/core.js?v=275','./modules/focus-lesson/style.css?v=1'])assert(SHELL.includes(f),'in the shell: '+f);
 assert(!SHELL.some(f=>/\.(png|webp|jpg|m4a|json|woff2?)(\?|$)/.test(f)),'no media in the shell');
 const html=fs.readFileSync('index.html','utf8');
 for(const [,f] of html.matchAll(/<(?:script src|link rel="stylesheet" href)="(\.\/[^"]+)"/g))assert(SHELL.includes(f),'first-screen file in the shell: '+f);
 await simulate(null);
 await simulate('optional');
 for(const f of SHELL)await simulate('shell:'+f); // every single shell file, not a sample
 await simulate('quota'); // storage full while caching optional media
 await simulate('slow'); // slow network: every file still arrives, one batch of 20 at a time
 await simulate(null,{evict:'./modules/learning-path/core.js?v=275'}); // evicted between install and activate
 console.log('PASS: full install, optional failure tolerance, '+SHELL.length+' shell files each required (503 → no install, previous cache kept), cache quota, slow network, activation only with a complete shell');
})().catch(e=>{console.error(e);process.exitCode=1});
