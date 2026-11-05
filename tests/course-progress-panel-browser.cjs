// Tapping the active course card (arrow) opens a progress panel: current topic, its progress, Continue button and what the learner can already do.
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
  await page.goto(base);await page.waitForSelector('.fh-courses');
  assert.equal(await page.locator('.fh-course-panel').isVisible(),false,'panel is closed at first');
  await page.click('.fh-course.is-active');await page.waitForSelector('.fh-course-panel:not([hidden])');
  assert.equal(await page.getAttribute('.fh-course.is-active','aria-expanded'),'true');
  const txt=await page.locator('.fh-course-panel').innerText();
  assert.match(txt,/A1\.1/);assert.match(txt,/Зараз ти вивчаєш/);assert.match(txt,/Частина 1 з \d+/);assert.match(txt,/Вже вмієш/);
  await page.click('.fh-course.is-active');assert.equal(await page.locator('.fh-course-panel').isVisible(),false,'second tap closes it');
  await page.click('.fh-course.is-active');await page.click('.fh-pp-go');
  await page.waitForFunction(()=>document.getElementById('learningPath').dataset.screen&&document.getElementById('learningPath').dataset.screen!=='home');
  assert.deepEqual(errors,[]);console.log('PASS: course progress panel opens/closes and Continue starts the lesson');
 }finally{await browser.close();server.close()}
})();
