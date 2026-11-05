// "Kamer van Pieter & Sam" (A1 game): tile in A1.1/A1.2 only, 11 objects + Sam, 5 button tasks, 8 dialogues, stars.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/kamer-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
(async()=>{
 const LerenKamerTalks=()=>8;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
  await page.addInitScript(r=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_welcome_seen','true');localStorage.setItem('leren_release_seen',JSON.stringify(r))},release);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath);
  const tile=lv=>page.evaluate(l=>{curLevel=l;setView('games');renderGamesHome();return !!document.querySelector('[data-game="kamer1"]')},lv);
  assert.equal(await tile('a11'),true);assert.equal(await tile('a12'),true);assert.equal(await tile('a21'),false);
  // No menu: the first task starts at once, in the room with 11 objects and Sam.
  await page.evaluate(()=>{curLevel='a11';setView('games');renderGamesHome()});await page.click('[data-game="kamer1"]');await page.waitForSelector('.k-stage .k-room');
  assert.equal(await page.locator('.k-menu').count(),0,'no menu to choose from');assert.equal(await page.locator('.k-task').count(),0);
  assert.equal(await page.locator('.k-room [data-item]:not([data-item=sam])').count(),11,'11 objects');
  assert.equal(await page.locator('.k-room [data-item=sam]').count(),1,'Sam');
  // tasks: answer by looking at the DOM (right answers are known from the game data); "Next" goes to the next step
  const answerTask=async ti=>{
   for(let r=0;r<3;r++){
    if(ti===1){
     await page.waitForFunction(()=>/Waar is/.test(document.querySelector('.k-pieter .k-nl')?.textContent||''));
     const txt=await page.locator('.k-pieter .k-nl').first().textContent();const noun=txt.replace('Waar is ','').replace('?','').split(' ')[1];
     await page.evaluate(n=>document.querySelector('[data-item="'+n+'"]').click(),noun);
    }else{
     await page.waitForSelector('.k-choices:not(.is-done) .k-choice');
     const right=await page.evaluate(i=>{const hot=[...document.querySelectorAll('.k-obj.is-hint')][0]?.dataset.item;const O=LerenKamer.O;const col={tafel:'bruin',stoel:'rood',bed:'blauw'};
      if(i===0)return 'Dit is een '+O[hot][1]+'.';if(i===2)return 'Ik zie een '+O[hot][1]+'.';if(i===3)return col[hot];return O[hot][1]},ti);
     await page.locator('.k-choice',{hasText:right}).first().click();
    }
    await page.waitForTimeout(1000);
   }
   await page.waitForSelector('.k-result');
  };
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.leren_kamer1_v1));
  await answerTask(0);assert.equal((await saved()).at,0,'place is the current task until "Next"');
  await page.locator('.k-result .btn.primary').click();await page.waitForSelector('.k-choices, .k-pieter');assert.equal((await saved()).at,1,'"Next" opens task 2');
  // leaving in the middle keeps the place: the game opens at task 2 again
  await page.click('.k-close');await page.waitForSelector('[data-game="kamer1"]');
  await page.click('[data-game="kamer1"]');await page.waitForSelector('.k-stage .k-room');
  await page.waitForFunction(()=>/Waar is/.test(document.querySelector('.k-pieter .k-nl')?.textContent||''));
  for(let ti=1;ti<5;ti++){await answerTask(ti);await page.locator('.k-result .btn.primary').click()}
  // then the talks with Sam, one after another
  await page.waitForSelector('.k-samrow');assert.equal((await saved()).at,5,'after the tasks comes the first talk');
  assert(await page.evaluate(()=>document.querySelector('[data-item=sam]').classList.contains('talking')),'Sam turns');
  for(let d=0;d<LerenKamerTalks();d++){
   await page.waitForSelector('.k-choices .k-choice:not([disabled])');await page.locator('.k-choice',{hasText:/./}).first().click();
   if(!await page.locator('.k-result').count()){await page.locator('.k-choice:not([disabled])').first().click()}
   await page.waitForSelector('.k-result');await page.locator('.k-result .btn.primary').click();
  }
  // the end: all stars, start again from the beginning
  await page.waitForSelector('.k-finale');assert.equal(await page.locator('.k-stage').count(),0);
  const sv=await saved();assert.equal(Object.keys(sv.tasks).length,5,'all 5 tasks passed');assert.equal(Object.keys(sv.talks).length,8,'all 8 talks');assert.equal(sv.at,0);
  await page.locator('.k-finale .btn.primary').click();await page.waitForSelector('.k-stage .k-room');await page.waitForSelector('.k-choices .k-choice');
  assert.deepEqual(errors,[]);
  console.log('kamer1-browser OK');
 }finally{await browser.close();server.close()}
})();
