// The service worker never tries to cache a partial (206) response: audio is fetched in ranges, and
// Cache.put rejects partial responses ("Partial response (status code 206) is unsupported").
// Full (200) responses are still cached. Run: node tests/sw-partial.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},puts=[];
const cache={put:(req,res)=>{puts.push([req.url,res.status]);return res.status===206?Promise.reject(new TypeError('Partial response')):Promise.resolve()}};
const ctx={self:{location:{origin:'https://lerenbe.com'},addEventListener:(t,f)=>handlers[t]=f,registration:{},clients:{}},caches:{open:async()=>cache,match:async()=>undefined,keys:async()=>[],delete:async()=>true},
 fetch:async req=>({status:req.status,ok:req.status>=200&&req.status<300,clone(){return this}}),URL,Response:{error:()=>({status:0})},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
(async()=>{
 const unhandled=[];process.on('unhandledRejection',e=>unhandled.push(e));
 for(const [url,status] of [['https://lerenbe.com/audio/nl/a.m4a',206],['https://lerenbe.com/audio/nl/b.m4a',200]]){
  let p;handlers.fetch({request:{url,method:'GET',mode:'no-cors',status,headers:{get:()=>null}},respondWith:x=>p=x});
  if(p){const r=await p;assert.equal(r.status,status)}
 }
 await new Promise(r=>setTimeout(r,20));
 assert(!puts.some(([,s])=>s===206),'a 206 response is never put in the cache: '+JSON.stringify(puts));
 assert(puts.some(([u,s])=>u.endsWith('b.m4a')&&s===200),'a 200 response is cached: '+JSON.stringify(puts));
 assert.deepEqual(unhandled,[]);
 console.log('PASS: partial (206) audio responses are served but not cached; full responses are cached; no unhandled rejection');
})().catch(e=>{console.error(e);process.exit(1)});
