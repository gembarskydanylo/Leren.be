// Error reports (POST /errors): the app, the service worker and the AI worker.
// - worker: a valid report is logged as one "APP_ERROR" line with trimmed fields, behind its own limiter (ERRS) and
//   without touching the AI limiters; wrong origin, unknown kind, bad JSON and big bodies are refused; no ERRS = off;
// - page: an uncaught error, an unhandled rejection and a CSP violation are each sent once, with the release version,
//   at most 5 different reports per page; nothing is sent on other hosts unless the test flag is set;
// - service worker: an unhandled rejection inside the worker is reported on lerenbe.com only.
// Run: node tests/error-reports.cjs (the page part needs Playwright with Chromium and is skipped otherwise)
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const root=path.join(__dirname,'..');
(async()=>{
 // ---- Worker
 const src=fs.readFileSync(path.join(root,'tools/ai-worker.js'),'utf8');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))).default;
 const limiter=max=>{const c=new Map(),keys=[];return {keys,async limit({key}){keys.push(key);const n=(c.get(key)||0)+1;c.set(key,n);return {success:n<=max}}}};
 const env=()=>({ANTHROPIC_KEY:'sk-test',ERRS:limiter(3),PER_IP:limiter(99),IP_CEIL:limiter(99),ALL:limiter(99)});
 const post=(body,{origin='https://lerenbe.com',p='/errors',raw}={})=>new Request('https://leren-ai.example'+p,{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain','CF-Connecting-IP':'203.0.113.9'},body:raw??JSON.stringify(body)});
 const logs=[],log=console.log;console.log=(...a)=>logs.push(a.join(' '));
 const good={kind:'error',msg:'TypeError: x is undefined\nnext line',src:'https://lerenbe.com/index.html:10:5',stack:'at f (index.html:10:5)',v:'180',page:'/',ui:'uk',online:true,ua:'Mozilla/5.0 (iPhone)',secret:'never logged'};
 try{
  let e=env(),r=await worker.fetch(post(good),e,{});assert.equal(r.status,200);
  const line=logs.find(l=>l.startsWith('APP_ERROR '));assert(line,'logged');const o=JSON.parse(line.slice(10));
  assert.equal(o.kind,'error');assert.equal(o.msg,'TypeError: x is undefined next line','control characters flattened');assert.equal(o.v,'180');assert.equal(o.ua,'Mozilla/5.0 (iPhone)');assert(!('secret' in o),'unknown fields dropped');
  assert.equal(e.PER_IP.keys.length+e.IP_CEIL.keys.length+e.ALL.keys.length,0,'AI limiters untouched');assert.equal(e.ERRS.keys.length,1);
  assert(!e.ERRS.keys[0].includes('203.0.113.9'),'IP is hashed');
  for(let i=0;i<2;i++)await worker.fetch(post(good),e,{});assert.equal((await worker.fetch(post(good),e,{})).status,429,'own limit: 3 a minute in this test');
  assert.equal((await worker.fetch(post({...good,msg:'x'.repeat(5000)}),env(),{})).status,200);assert(JSON.parse(logs.at(-1).slice(10)).msg.length===300,'message cut to 300');
  assert.equal((await worker.fetch(post(good,{origin:'https://evil.example'}),env(),{})).status,403);
  assert.equal((await worker.fetch(post({...good,kind:'chat'}),env(),{})).status,400);
  assert.equal((await worker.fetch(post(null,{raw:'{'}),env(),{})).status,400);
  assert.equal((await worker.fetch(post(null,{raw:'x'.repeat(9000)}),env(),{})).status,413);
  const noBinding=env();delete noBinding.ERRS;assert.equal((await worker.fetch(post(good),noBinding,{})).status,503,'no ERRS binding: reports are off');
  const n=logs.filter(l=>l.startsWith('APP_ERROR ')).length;e=env();r=await worker.fetch(post({mode:'chat'},{p:'/'}),{...e,AI_OFF:'1'},{});assert.equal(r.status,503,'AI path unchanged');assert.equal(logs.filter(l=>l.startsWith('APP_ERROR ')).length,n);
 }finally{console.log=log}
 // ---- Service worker
 for(const [host,want] of [['lerenbe.com',1],['127.0.0.1',0]]){
  const h={},sent=[];const ctx={self:{location:{hostname:host,origin:'https://'+host},navigator:{onLine:true,userAgent:'UA'},addEventListener:(t,f)=>h[t]=f,registration:{},clients:{}},
   caches:{},fetch:async(u,o)=>{sent.push([u,JSON.parse(o.body)]);return {}},URL,console};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),ctx);
  const err=new Error('Partial response');h.unhandledrejection({reason:err});h.unhandledrejection({reason:err});
  assert.equal(sent.length,want,host);if(want){assert.equal(sent[0][0],'https://leren-ai.gembarsky-d.workers.dev/errors');assert.equal(sent[0][1].kind,'sw');assert.match(sent[0][1].v,/^\d+$/)}
 }
 // ---- Page
 let chromium;try{({chromium}=require('playwright'))}catch{console.log('PASS (worker, service worker); page part SKIPPED: no Playwright');return}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
 const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
 let browser;try{browser=await chromium.launch()}catch{console.log('PASS (worker, service worker); page part SKIPPED: no Chromium');server.close();return}
 try{
  for(const flag of [true,false]){
   const ctx=await browser.newContext({serviceWorkers:'block'}),page=await ctx.newPage(),reports=[];
   await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{const q=r.request();if(q.url().endsWith('/errors'))reports.push(JSON.parse(q.postData()));r.abort()});
   await page.addInitScript(([r,f])=>{localStorage.setItem('leren_release_seen',JSON.stringify(r));if(f)localStorage.setItem('leren_err_test','1')},[release,flag]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);
   await page.evaluate(()=>{Promise.reject(new Error('rejected in test'))});await page.waitForTimeout(100);
   await page.evaluate(()=>{for(let i=0;i<2;i++)setTimeout(()=>{throw new Error('boom in test')});
    const i=document.createElement('img');i.src='data:,x';document.dispatchEvent(new SecurityPolicyViolationEvent('securitypolicyviolation',{effectiveDirective:'img-src',violatedDirective:'img-src',blockedURI:'https://bad.example/x.png',originalPolicy:'',disposition:'enforce',statusCode:200}));
    for(let i=0;i<9;i++)setTimeout(()=>{throw new Error('many '+i)})});
   await page.waitForTimeout(400);
   if(!flag){assert.equal(reports.length,0,'nothing is sent outside lerenbe.com');await ctx.close();continue}
   const byKind=k=>reports.filter(r=>r.kind===k);if(process.env.DEBUG)console.log(reports.map(r=>r.kind+':'+r.msg));
   assert.equal(reports.filter(r=>r.msg.includes('boom in test')).length,1,'the same error is sent once');assert.equal(byKind('rejection')[0].msg,'rejected in test');
   assert.equal(byKind('csp').length,1);assert.match(byKind('csp')[0].msg,/^img-src https:\/\/bad\.example/);
   assert.equal(reports.length,5,'at most 5 reports per page: '+reports.map(r=>r.msg).join(' | '));
   for(const r of reports){assert.equal(r.v,release);assert.equal(r.page,'/index.html');assert.equal(typeof r.ua,'string')}
   assert.match(reports.find(r=>r.msg.includes('boom')).src,/:\d+:\d+$/,'file:line:column');
   await ctx.close();
  }
  console.log('PASS: error reports — worker logs one trimmed APP_ERROR line behind its own limiter (AI limits untouched, bad origin/kind/JSON/size refused, off without ERRS); service worker reports on lerenbe.com only; the page sends uncaught errors, rejections and CSP violations once each with the release, at most 5, and nothing on other hosts');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
