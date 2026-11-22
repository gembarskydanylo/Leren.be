// Course progress on the home: the «Я вчу» picker opens the levels with their progress, the route marks the current topic and «Continue» starts the lesson.
// (Production 226: a panel under the active course card; LerenBe 3.0 moved it into the picker.)
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!f.startsWith(root)||!fs.existsSync(f)){res.statusCode=404;return res.end()}if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk')});
  // LerenBe 3.0 integration: the progress panel of the old course card (.fh-course-panel) is replaced by the home «Я вчу»
  // picker (active level with its lesson count and progress bar), the route (current topic) and the «Your next lesson» button.
  await page.goto(base);await page.waitForSelector('.hv-pick-btn');
  assert.equal(await page.locator('#hvPickPanel').isVisible(),false,'panel is closed at first');
  await page.click('.hv-pick-btn');await page.waitForSelector('#hvPickPanel:not([hidden])');
  assert.equal(await page.getAttribute('.hv-pick-btn','aria-expanded'),'true');
  const txt=await page.locator('#hvPickPanel .hv-level.is-active').innerText();
  assert.match(txt,/A1\.1/);assert.match(txt,/0 \/ \d+/);assert.equal(await page.getAttribute('#hvPickPanel .hv-level.is-active','aria-pressed'),'true');
  assert.equal(await page.locator('#hvPickPanel .hv-level.is-active .hv-bar').count(),1,'progress bar of the active level');
  assert.equal(await page.locator('.hv-stop[data-state="current"]').count(),1,'the current topic is marked on the route');
  await page.click('.hv-pick-btn');assert.equal(await page.locator('#hvPickPanel').isVisible(),false,'second tap closes it');
  await page.locator('.fh-hero .fh-primary').first().click();
  await page.waitForFunction(()=>document.getElementById('learningPath').dataset.screen&&document.getElementById('learningPath').dataset.screen!=='home');
  assert.deepEqual(errors,[]);console.log('PASS: course progress (LerenBe 3.0 picker) opens/closes, shows the active level with its progress and the current topic; Continue starts the lesson');
 }finally{await browser.close();server.close()}
})();
