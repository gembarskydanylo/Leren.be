// /guides/ in a real browser: on phones (320×640, 390×844), a tablet and a desktop, with and without JavaScript, the
// hub and the four guides show their h1 and text, have no horizontal scroll and no page errors; without JavaScript the
// hub still lists all four guides; the hub in English (?lang=en) shows no "test version" label.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/guides-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff'};
const server=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
const pages=['guides/','guides/niderlandska-dlia-ukraintsiv-belhiia.html','guides/nt2-dlia-pochatkivtsiv.html','guides/niderlandska-povsiakdenne-zhyttia.html','guides/movna-pidhotovka-intehratsiia-belhiia.html'];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const B='http://127.0.0.1:'+server.address().port+'/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const done=[];
 try{
  for(const [w,h] of [[320,640],[390,844],[820,1180],[1280,800]])for(const js of [true,false]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},javaScriptEnabled:js}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   for(const p of pages){
    await page.goto(B+p);
    const r=await page.evaluate(()=>{const h1=document.querySelector('h1');return {h1:h1&&h1.getBoundingClientRect().height>0?h1.textContent.trim():'',over:document.documentElement.scrollWidth-innerWidth,text:document.body.innerText.length,links:[...document.querySelectorAll('nav.related a')].filter(a=>a.getBoundingClientRect().height>0).length}});
    const tag=w+'x'+h+(js?'':'/no-js')+' '+p;
    assert(r.h1,tag+': visible h1');assert(r.over<=1,tag+': no horizontal scroll ('+r.over+'px)');assert(r.text>(p==='guides/'?300:1500),tag+': text visible ('+r.text+')');
    if(p==='guides/')assert.equal(r.links,4,tag+': hub lists the four guides');
   }
   assert.deepEqual(errors,[],w+'x'+h);done.push(w+'x'+h+(js?'':' no-JS'));await ctx.close();
  }
  const ctx=await browser.newContext(),page=await ctx.newPage();await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.goto(B+'guides/?lang=en');await page.waitForFunction(()=>document.querySelector('h1').textContent==='Dutch for your day');
  assert(!/test version/i.test(await page.textContent('footer')),'English hub: no test label');await ctx.close();
  console.log('PASS: guides in the browser — hub + 4 guides on '+done.join(', ')+': visible h1 and text, hub lists 4 guides, no horizontal scroll, no errors; English hub without a test label');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
