const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),html=require(__dirname+'/lib/app-source.cjs')();
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
// Validate the lesson database before any browser initialization runs.
vm.runInNewContext(fs.readFileSync(path.join(root,'course-curriculum.js'),'utf8')+'\n'+script.slice(0,script.indexOf('function validStored'))+`
 const ids=new Set();
 for(const d of Object.values(DATA))for(const item of d.items){
  if(!item.id||ids.has(item.id))throw Error('Missing or duplicate card ID: '+item.id);
  ids.add(item.id);
  for(const lang of ['nl','en','fr','uk','ar'])if(!item[lang])throw Error('Missing '+lang+' for '+item.id);
 }
`);
function fn(name){const start=script.indexOf('function '+name+'(');assert(start>=0,name);return script.slice(start,script.indexOf('\n}',start)+2)}
const saved={},ctx=vm.createContext({xp:0,stats:0,saves:0,
 addXP(n){ctx.xp+=n},weekState:()=>saved.week||{played:[],done:false},
 lsSet:(_,v)=>{saved.week=v},saveStore:()=>{ctx.saves++},updateStats:()=>{ctx.stats++},toast:()=>{},gU:()=>({})});
vm.runInContext(fn('gameDone'),ctx);
for(const id of ['rp','mm','dlg','bl','dc'])vm.runInContext(`gameDone('${id}',10)`,ctx);
assert.equal(ctx.xp,150);assert.equal(ctx.saves,5);assert.equal(ctx.stats,5);
vm.runInContext("gameDone('dc',10)",ctx);assert.equal(ctx.xp,160);assert.equal(saved.week.played.length,5);
let removed=0;const syncCtx=vm.createContext({syncSnapshot:()=>({poly_score:'12'}),localStorage:{removeItem:()=>removed++,setItem:()=>{}}});
vm.runInContext('const syncable=()=>true;\n'+fn('syncApply'),syncCtx);
for(const bad of ['null','[]','"invalid"'])assert.throws(()=>vm.runInContext(`syncApply(${bad})`,syncCtx));
assert.equal(removed,0,'invalid cloud data must not delete local progress');
// Execute the actual role-play render callback with a minimal DOM substitute.
class Element{constructor(){this.children=[];this.isConnected=true;this.classList={add(){}}}append(...xs){this.children.push(...xs)}appendChild(x){this.children.push(x)} }
let timers=[],speech=0,steps=0;const card=new Element(),state={d:{title:{},hint:'',lines:[['B','Hallo']]},role:'B',lvl:1,i:0,log:[],ok:0};
const rp=vm.createContext({gState:state,view:'games',gU:()=>({}),gTr:()=>'',gHead:()=>card,el:()=>new Element(),tgt:x=>x,dlgLineTr:()=>'',gBar(){},shuffle:x=>x,DIALOGUES:[],say:()=>speech++,setTimeout:f=>timers.push(f),rpStep:()=>steps++});
vm.runInContext(fn('rpRender')+'\nrpRender()',rp);
const options=card.children.at(-1);options.children[0].onclick();options.children[0].onclick();
assert.equal(state.i,1);assert.equal(state.ok,1);assert.equal(speech,1);assert.equal(timers.length,1);
rp.view='lesson';timers[0]();assert.equal(steps,0,'leaving game cancels delayed transition');
// Cache entries and manifest assets must all exist locally.
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');new vm.Script(sw);
// Execute the complete SW top-level declarations: APP_FILES is extended after install registration.
// Event handlers are registered but never invoked in this isolated VM.
function swManifest(source){
 const context=vm.createContext({self:{addEventListener(){}},console});
 vm.runInContext(source+'\n;globalThis.__files=APP_FILES;',context,{timeout:2000});
 return Array.from(context.__files);
}
const appFiles=swManifest(sw);
assert(appFiles.length>100,'Unexpectedly small precache manifest');
assert.equal(new Set(appFiles).size,appFiles.length,'Duplicate offline assets in APP_FILES');
for(const file of appFiles){
 const local=file.split("?")[0].replace(/^\.\//,'');
 assert(fs.existsSync(path.join(root,local)),`Missing offline asset: ${file}`);
}
assert(appFiles.some(f=>f.split('?')[0]==='./dict/nl.json'),'Dictionary missing from offline cache');
// LRN-002 (264): the final list (after every loop and push) has only local paths of this site, one version per file, and
// every script / style that index.html loads is cached with exactly the version index.html asks for (an older version
// in the cache means the offline app runs stale code); the atomic app shell is part of the list.
for(const f of appFiles){assert(/^\.\//.test(f)&&!/^\.\/\//.test(f)&&!f.includes('..')&&!/^[a-z]+:/i.test(f),'Offline asset outside the site: '+f)}
const byPath=new Map();for(const f of appFiles){const p=f.split('?')[0];assert(!byPath.has(p),'Two versions of one offline asset: '+byPath.get(p)+' / '+f);byPath.set(p,f)}
const shellHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of shellHtml.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="(\.?\/?[^"#:]+\?v=[^"]+)"/g)){const ref='./'+m[1].replace(/^\.?\//,'');const cached=byPath.get(ref.split('?')[0]);assert(cached,'index.html loads a file the offline cache lacks: '+ref);assert.equal(cached,ref,'offline cache holds another version than index.html loads')}
const shellCtx=vm.createContext({self:{addEventListener(){}},console});vm.runInContext(sw+'\n;globalThis.__s=APP_SHELL;',shellCtx,{timeout:2000});const shell=Array.from(shellCtx.__s);
const htmlRefs=[...new Set([...shellHtml.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="(\.?\/?[^"#:]+\?v=[^"]+)"/g)].map(m=>'./'+m[1].replace(/^\.?\//,'')))];
assert.deepEqual([...shell].sort(),[...htmlRefs].sort(),'APP_SHELL in sw.js must list exactly the scripts / styles index.html loads');for(const f of shell)assert(appFiles.includes(f),'app shell file outside APP_FILES: '+f);
// Negative regression: an asset appended after event registration must also be checked.
const ghost='./__missing_precache_regression__.js';
assert(swManifest(sw+'\nAPP_FILES.push("'+ghost+'");').includes(ghost));
assert(!fs.existsSync(path.join(root,ghost)),'Regression sentinel unexpectedly exists');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
for(const item of [...manifest.icons,...manifest.screenshots])assert(fs.existsSync(path.join(root,item.src)),`Missing manifest asset: ${item.src}`);
(async()=>{
 const worker=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'tools/ai-worker.js'),'utf8')).toString('base64'));
 for(const body of [null,[],true,'invalid']){
 const req=new Request('https://example.test/',{method:'POST',headers:{Origin:'http://localhost:8765','Content-Type':'application/json'},body:JSON.stringify(body)});
 const response=await worker.default.fetch(req,{});assert.equal(response.status,400);
 }
 console.log(`PASS: game XP persistence, weekly bonus, repeated clicks, navigation timer, cloud data guards, worker validation, syntax and ${appFiles.length} offline assets`);
})().catch(e=>{console.error(e);process.exitCode=1});
