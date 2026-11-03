// Browser check of the course switcher on phone and desktop. Needs Playwright with Chromium; skipped otherwise.
// Run: node tests/courses-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium ('+e.message.split('\n')[0]+')');server.close();return}
 const checked=[];
 try{
  for(const [name,viewport] of [['phone',{width:390,height:844}],['desktop',{width:1366,height:900}]]){
   for(const theme of ['light','dark']){
    const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
    await page.addInitScript(([release,theme])=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('leren_release_seen',JSON.stringify(release));localStorage.setItem('poly_theme',theme);
     localStorage.setItem('poly_toetsbest',JSON.stringify({course_comm_v2:9,course_travel_v2:10}));sessionStorage.setItem('seeded','1')}},[release,theme]);
    await page.goto(base);await page.waitForSelector('.fh-courses');
    if(theme==='dark')await page.evaluate(()=>{document.documentElement.dataset.theme='dark'});
    // The switcher is the first thing under the header, with three cards.
    const cards=page.locator('.fh-course');assert.equal(await cards.count(),3);
    const first=await page.evaluate(()=>{const r=document.getElementById('learningPath'),s=document.querySelector('.fh-courses');return [...r.children].find(e=>!e.hidden&&e.offsetHeight>0)===s});assert(first,'Course switcher sits right under the header');
    assert.equal(await cards.nth(0).getAttribute('aria-pressed'),'true');
    const a21=cards.nth(2);assert(await a21.isDisabled(),'A2.1 cannot be opened');assert.match(await a21.innerText(),/Незабаром/);
    const width=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert(width,'No horizontal scroll on '+name);
    for(const i of [0,1,2]){const b=await cards.nth(i).boundingBox();assert(b&&b.height>=44&&b.width>=90,'Card is large enough to tap')}
    await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`courses-${name}-${theme}-a11.png`)});
    // A1.1 → A1.2 in one tap: highlighted, lessons and topics of A1.2, saved.
    await cards.nth(1).click();await page.waitForFunction(()=>document.querySelector('.fh-course[data-level="A1.2"]')?.getAttribute('aria-pressed')==='true');
    assert.match(await page.locator('.fh-eyebrow').first().innerText(),/A1\.2/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('poly_level')),'a12');
    const titles=await page.locator('.fh-topic-title').allInnerTexts();assert(titles.length>=1);
    await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`courses-${name}-${theme}-a12.png`)});
    // Reload keeps A1.2.
    await page.reload();await page.waitForSelector('.fh-courses');assert.equal(await page.locator('.fh-course[data-level="A1.2"]').getAttribute('aria-pressed'),'true');
    // Start an A1.2 lesson, answer one card, then switch back to A1.1 and again to A1.2: the A1.2 lesson resumes.
    await page.locator('.fh-primary').first().click();await page.waitForSelector('.lp-card');
    if(await page.locator('.lp-card .lp-primary').count())await page.locator('.lp-card .lp-primary').first().click();
    await page.waitForSelector('.fh-study-actions .lp-primary');await page.locator('.fh-study-actions .lp-primary').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_path_v1')));assert.equal(saved.course,'A1.2');assert.equal(saved.session.index,1);
    await page.evaluate(()=>learningPath.home());await page.waitForSelector('.fh-courses');
    await page.locator('.fh-course[data-level="A1.1"]').click();await page.waitForFunction(()=>document.querySelector('.fh-course[data-level="A1.1"]')?.getAttribute('aria-pressed')==='true');
    assert.equal(await page.evaluate(()=>localStorage.getItem('poly_level')),'a11');assert.match(await page.locator('.fh-eyebrow').first().innerText(),/A1\.1/);
    await page.locator('.fh-course[data-level="A1.2"]').click();await page.waitForFunction(()=>document.querySelector('.fh-course[data-level="A1.2"]')?.getAttribute('aria-pressed')==='true');
    const back=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_path_v1')));assert.equal(back.session.index,1,'Switching courses keeps the paused A1.2 lesson');
    // Games follow the course: A1.2 hides the two A1.1 stories, spell-the-word uses A1.2 words.
    await page.evaluate(()=>setView('games'));await page.waitForSelector('[data-game]');
    const games=await page.locator('[data-game]').evaluateAll(n=>n.map(e=>e.dataset.game));assert(!games.includes('story')&&!games.includes('md'));assert(games.includes('wb')&&games.includes('bl')&&games.includes('dlg'));
    await page.locator('[data-game="wb"]').click();await page.waitForSelector('.wb');
    const ok=await page.evaluate(()=>{const n=wbCourseWords().map(w=>w[0]);return n.length>=10&&[...document.querySelectorAll('.wb-slot,.wb-slots *')].length>0&&!!document.querySelector('.wb-art img, .wb-art svg')});assert(ok,'Spell-the-word shows an A1.2 word with a picture');
    // Tests open on A1.2 and old results stay saved.
    await page.evaluate(()=>setView('toets'));await page.waitForSelector('.tl-block');
    assert.equal(await page.locator('.tl-block').count(),4,'Four A1.2 test blocks');
    const best=await page.evaluate(()=>JSON.parse(localStorage.getItem('poly_toetsbest')));assert.equal(best.course_comm_v2,9);assert.equal(best.course_travel_v2,10);
    assert.deepEqual(errors,[],'No page errors on '+name+' '+theme);
    checked.push(name+'/'+theme);await ctx.close();
   }
  }
 }finally{await browser.close();server.close()}
 console.log('PASS: course switcher on '+checked.join(', ')+': under the header, three cards, closed A2.1, one-tap switch, reload, paused lesson kept, A1.2 games and tests, old results kept');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
