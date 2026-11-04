// Clickjacking guard (boot.js): a page on ANOTHER origin that puts the app in an <iframe> sees only a link that opens
// lerenbe.com in the whole tab; the app itself stays hidden. A frame from the SAME origin (our widgets, tests) is untouched.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/frame-guard-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json','.woff':'font/woff'};
const files=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)});
let appUrl='';
const evil=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(`<!doctype html><title>other site</title><iframe id="f" src="${appUrl}" style="width:390px;height:700px"></iframe>`)});
(async()=>{
 await new Promise(r=>files.listen(0,'127.0.0.1',r));await new Promise(r=>evil.listen(0,'127.0.0.1',r));
 appUrl='http://127.0.0.1:'+files.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');files.close();evil.close();return}
 try{
  const ctx=await browser.newContext({serviceWorkers:'block'});await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  // 1. Cross-origin frame (other port = other origin): only the link is visible, and it targets the whole tab.
  const page=await ctx.newPage();await page.goto('http://127.0.0.1:'+evil.address().port+'/');
  const frame=await (await page.waitForSelector('#f')).contentFrame();await frame.waitForSelector('#lbeFramed',{timeout:15000});
  const r=await frame.evaluate(()=>{const a=document.getElementById('lbeFramed');return {link:getComputedStyle(a).display!=='none',target:a.target,href:a.href,
   others:[...document.body.children].filter(e=>e!==a&&getComputedStyle(e).display!=='none').map(e=>e.tagName+'#'+e.id)}});
  assert(r.link,'link shown');assert.equal(r.target,'_top');assert.equal(r.href,appUrl);assert.deepEqual(r.others,[],'app hidden in a foreign frame');
  // 2. Top-level visit and same-origin frame: no guard.
  const own=await ctx.newPage();await own.goto(appUrl);await own.waitForTimeout(800);
  assert.equal(await own.evaluate(()=>!!document.getElementById('lbeFramed')),false,'no guard at top level');
  await own.evaluate(u=>{const f=document.createElement('iframe');f.id='same';f.src=u;document.body.appendChild(f)},appUrl);
  const same=await (await own.waitForSelector('#same')).contentFrame();await same.waitForLoadState('load');await own.waitForTimeout(800);
  assert.equal(await same.evaluate(()=>!!document.getElementById('lbeFramed')),false,'same-origin frame untouched');
  console.log('PASS: foreign frame shows only a link to the whole tab; top level and same-origin frames untouched');
 }finally{await browser.close();files.close();evil.close()}
})().catch(e=>{console.error(e);process.exit(1)});
