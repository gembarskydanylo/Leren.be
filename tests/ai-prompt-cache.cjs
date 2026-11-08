// Prompt caching in tools/ai-worker.js: the system prompt goes to Anthropic as text blocks — the stable part first with
// cache_control, the per-turn notes after it — and the blocks joined are exactly the prompt the tutor had before (same text,
// same order). The cached part is long enough to be cached (Claude Haiku 5.5 minimum: 512 tokens) and holds no notes.
// No key, no network. Run: node tests/ai-prompt-cache.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../tools/ai-worker.js'),'utf8');
const sb={console};vm.createContext(sb);vm.runInContext(src.slice(0,src.indexOf('export default'))+'\nthis.T={chatSystem,askSystem,memoSystem,learnerNotes,askedNote};',sb);
const T=sb.T;
(async()=>{
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))).default;
 const limiter={async limit(){return {success:true}}},kv=new Map(),RATE={async get(k){return kv.get(k)??null},async put(k,v){kv.set(k,v)}};
 const env={PROVIDER:'anthropic',ANTHROPIC_KEY:'sk-test',RATE,PER_IP:limiter,IP_CEIL:limiter,ALL:limiter};
 const real=globalThis.fetch,sent=[],logs=[],realLog=console.log;
 globalThis.fetch=async(url,opt)=>{sent.push(JSON.parse(opt.body));return {ok:true,status:200,json:async()=>({stop_reason:'end_turn',usage:{input_tokens:120,cache_read_input_tokens:1800,cache_creation_input_tokens:0,output_tokens:90},
  content:[{type:'text',text:JSON.stringify(opt.body.includes('"answer"')?{answer:'Відповідь',examples:[]}:{learner_in_target:'Ik werk in Gent.',reply:'Leuk!',translation:'Чудово!',correction:{has_error:false,severity:'minor',original:'',corrected:'',explanation:''}})}]})}};
 console.log=(...a)=>{logs.push(a.join(' '))};
 const req=b=>new Request('https://x/',{method:'POST',headers:{Origin:'https://lerenbe.com','Content-Type':'application/json','CF-Connecting-IP':'203.0.113.9','X-Leren-Device':'dddddddddddddddddddddddd'},body:JSON.stringify(b)});
 const profile={topic:'werk',weak:['de kapstokhaak'],learned:12};
 try{
  const msgs=[{role:'user',content:'Hallo!'},{role:'assistant',content:'Hallo! Waar werk je?'},{role:'user',content:'Ik werk in Gent.'}];
  for(const body of [{mode:'chat',target:'nl',lang:'uk',level:'a11',style:'teacher',profile,messages:msgs},{mode:'ask',target:'nl',lang:'en',level:'a12',profile,messages:[{role:'user',content:'Wat is het verschil tussen de en het?'}]}]){
   const r=await worker.fetch(req(body),env,{waitUntil(){}});assert.equal(r.status,200,await r.text());
   const s=sent.at(-1).system;assert(Array.isArray(s),body.mode+': system as blocks');
   assert.deepEqual(s[0].cache_control,{type:'ephemeral'},body.mode+': first block cached');assert(!s.slice(1).some(b=>b.cache_control),'only one breakpoint');
   assert(s[0].text.length>2600,body.mode+': cached part long enough ('+s[0].text.length+' chars)');
   assert(!s[0].text.includes('de kapstokhaak'),body.mode+': learner notes are not in the cached part');assert(s.slice(1).map(b=>b.text).join('').includes('de kapstokhaak'),body.mode+': notes still sent');
   // Same text, same order as the single-string prompt.
   const joined=s.map(b=>b.text).join(''),notes=T.learnerNotes(profile,body.mode,'','teacher')+(body.mode==='chat'?T.askedNote(msgs.slice(-12)):'');
   const before=body.mode==='chat'?T.chatSystem('nl','uk','a11',undefined,undefined,notes,'teacher'):T.askSystem('nl','en','a12',undefined,notes);
   assert.equal(joined,before,body.mode+': model sees exactly the old prompt');
   assert(!joined.includes('\u0001'),'no marker leaks');
  }
  // Two chat turns with different notes share the cached block byte for byte.
  await worker.fetch(req({mode:'chat',target:'nl',lang:'uk',level:'a11',style:'teacher',profile:{...profile,learned:13},messages:[...msgs,{role:'assistant',content:'Leuk!'},{role:'user',content:'Ik ben kok.'}]}),env,{waitUntil(){}});
  assert.equal(sent.at(-1).system[0].text,sent[0].system[0].text,'cached block identical across turns');
  // Usage goes to the log so the cache hit rate can be checked in Cloudflare.
  assert(logs.some(l=>/^AI_USAGE .*"cache_read":1800/.test(l)),'usage logged');
  console.log=realLog;console.log(`PASS: prompt caching — stable part cached (${sent[0].system[0].text.length} chars chat, ${sent[1].system[0].text.length} ask), notes after it, model sees the identical prompt, usage logged`);
 }finally{globalThis.fetch=real;console.log=realLog}
})().catch(e=>{console.error(e);process.exit(1)});
