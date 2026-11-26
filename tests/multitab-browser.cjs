// Release 275 · browser regression for the Codex audit of 273 (Chromium, localhost, synthetic learner, no network, no SW):
// P1-01 two real tabs of the app: a lesson finished in A survives B starting the session, B sees it at once (storage
// event), after reloads the lesson and its 25 XP stay, the same result in B gives no XP twice, a paused lesson survives the
// other tab, word progress of both tabs is kept. P2-02 lessons finished with 0/5 do not make the conversation «known».
// P2-03 a refused write shows a visible warning in the Focus lesson and «not saved» in the profile (phone 360×780).
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const server=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname));if(f.endsWith(path.sep))f+='index.html';if(!f.startsWith(root)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(f).pipe(r)});
const SEED={poly_ui:'uk',leren_welcome_seen:'true',leren_tour_done:'true',leren_level_asked:'true',leren_onboarding_language_v1:'1',leren_start_known_v1:'"zero"',leren_release_seen:'"275"',leren_profile_v1:JSON.stringify({v:1,pace:'balanced',namePrompt:'done',source:'existing'})};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://localhost:'+server.address().port+'/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const results=[];
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
  const errors=[];const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.waitForFunction(()=>window.learningPath&&typeof recordPathResult==='function');return p};
  const a=await open();await a.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},SEED);await a.reload();await a.waitForFunction(()=>window.learningPath);
  const b=await open();
  const done=await a.evaluate(()=>{const m=learningPath.model,l=m.recommended();m.begin(l.id);for(let ph=0;ph<3;ph++){for(const id of l.ids)m.advance(id,true);if(ph<2)m.nextPhase()}m.finish();return {id:l.id,n:l.ids.length,gain:recordPathResult(l.id,l.ids.length,l.ids.length),xp:score}});
  assert.equal(done.gain,25);
  await b.waitForFunction(id=>Object.hasOwn(learningPath.model.state.completed,id),done.id,{timeout:5000}); // storage event
  const bView=await b.evaluate(id=>({next:learningPath.model.recommended().id,done:learningPath.model.courseStats(learningPath.model.course).done}),done.id);
  assert.notEqual(bView.next,done.id,'B offers the next lesson, not the finished one');assert.equal(bView.done,1);
  await b.evaluate(()=>learningPath.start());await b.waitForTimeout(300);
  const after=await b.evaluate(()=>({completed:JSON.parse(localStorage.getItem('leren_path_v1')).completed,xp:Number(localStorage.getItem('poly_score'))}));
  assert.equal(after.completed[done.id],done.n,'P1-01: B starting the session keeps A’s finished lesson');assert.equal(after.xp,25);
  await a.reload();await a.waitForFunction(()=>window.learningPath);await b.reload();await b.waitForFunction(()=>window.learningPath);
  for(const p of [a,b]){const s=await p.evaluate(id=>({c:learningPath.model.state.completed[id],xp:score}),done.id);assert.equal(s.c,done.n,'after reload');assert.equal(s.xp,25,'XP after reload')}
  const twice=await b.evaluate(([id,n])=>({gain:recordPathResult(id,n,n),xp:score}),[done.id,done.n]);assert.deepEqual(twice,{gain:0,xp:25},'the same result in the other tab gives no XP twice');
  results.push('two tabs: finished lesson kept, B updated live, 25 XP once');
  // A pauses a lesson, B (idle at home) saves → after reloading A the lesson resumes where it was
  const paused=await a.evaluate(()=>{learningPath.home();const m=learningPath.model,l=m.recommended();m.begin(l.id);m.advance(l.ids[0],true);m.advance(l.ids[1],true);return l.id});
  await b.waitForFunction(id=>learningPath.model.state.session?.lesson===id,paused,{timeout:5000});
  await b.evaluate(()=>learningPath.model.save());await a.reload();await a.waitForFunction(()=>window.learningPath);
  const resumed=await a.evaluate(()=>({id:learningPath.model.state.session?.lesson,index:learningPath.model.state.session?.index}));assert.deepEqual(resumed,{id:paused,index:2},'paused lesson resumes at card 3');
  results.push('paused lesson resumes after the other tab saved');
  // word progress: answers saved in both tabs are both kept
  await a.evaluate(()=>{store['audit-w1']={seen:3,correct:2,wrong:1,t:Date.now()};saveStore()});await b.evaluate(()=>{store['audit-w2']={seen:1,correct:1,wrong:0,t:Date.now()};saveStore()});
  const words=await a.evaluate(()=>JSON.parse(localStorage.getItem('poly_progress')));assert(words['audit-w1']&&words['audit-w2'],'both tabs’ word progress kept');assert.equal(words['audit-w1'].seen,3);
  results.push('word progress of both tabs kept');
  // P2-02: three lessons of «Знайомство» finished with 0 correct are not «known»; passed (5/5) they are
  const cov=await a.evaluate(()=>{const m=learningPath.model,ls=LerenLearningPath.catalog(DATA,LerenCurriculum).lessons.filter(l=>l.chapter==='comm'),keep=JSON.stringify(m.state.completed);
   m.state.completed={};for(const l of ls.slice(0,3))m.state.completed[l.id]=0;const zero={c:learningPath.talkCoverage(ls[3].id),ready:learningPath.talkReady(ls[3].id)};
   for(const l of ls.slice(0,4))m.state.completed[l.id]=l.ids.length;const full={c:learningPath.talkCoverage(ls[3].id),ready:learningPath.talkReady(ls[3].id)};
   m.state.completed=JSON.parse(keep);return {zero,full}});
  assert(cov.zero.c<0.7&&cov.zero.ready===false,'0/5 lessons are not known: '+JSON.stringify(cov.zero));
  assert(cov.full.c>=0.7&&cov.full.ready===true,'passed lessons are known: '+JSON.stringify(cov.full));
  results.push(`talk gate: 0/5 → ${cov.zero.c.toFixed(2)} (not ready), passed → ${cov.full.c.toFixed(2)} (ready)`);
  assert.deepEqual(errors,[],'no page errors');await ctx.close();

  // P2-03 on a phone: the browser refuses writes → warning in the Focus lesson, «not saved» in the profile, no sideways scroll
  const c=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,serviceWorkers:'block'});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
  const p=await c.newPage();const perr=[];p.on('pageerror',e=>perr.push(e.message));await p.goto(base);await p.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},SEED);await p.reload();await p.waitForFunction(()=>window.learningPath);
  await p.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(/^(leren_path_v1|leren_today_v1|leren_profile_v1|leren_learner_name|leren_goal_min)$/.test(k)){const e=new Error('quota');e.name='QuotaExceededError';throw e}return set.call(this,k,v)}});
  await p.evaluate(()=>learningPath.start());await p.waitForTimeout(400);
  const warn=await p.evaluate(()=>{const w=document.querySelector('#learningPath [data-save="failed"]');if(!w)return null;const r=w.getBoundingClientRect();return {text:w.textContent,visible:r.height>0&&r.width>0&&getComputedStyle(w).display!=='none',focus:document.documentElement.classList.contains('lp-focus'),hscroll:document.documentElement.scrollWidth>innerWidth}});
  assert(warn&&warn.visible&&warn.focus,'visible warning in the Focus lesson: '+JSON.stringify(warn));assert.match(warn.text,/Прогрес збережеться лише/);assert.equal(warn.hscroll,false);
  await p.evaluate(()=>{learningPath.home();openProfile()});await p.waitForSelector('[data-action="save-profile"]');await p.click('[data-action="save-profile"]');
  const status=await p.evaluate(()=>{const s=document.querySelector('.td-note[role="status"]');return {text:s?.textContent,state:s?.dataset.save}});
  assert.equal(status.state,'failed');assert.match(status.text,/Не вдалося зберегти/);
  assert.deepEqual(perr,[],'no page errors with refused writes');await c.close();
  results.push('refused writes: warning in Focus (360×780), profile says «not saved»');
  console.log('PASS: multitab/browser — '+results.join(' | '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
