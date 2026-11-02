// Insights in the real app (phone and desktop, light and dark): a new learner and a learner with old saved data.
// Skills per course, daily goal in minutes, streak, rewards with reasons, Peter's advice opening the exercise.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/insights-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const html=read('index.html'),release=html.match(/const RELEASE_VERSION="(\d+)"/)[1],script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const pctx=vm.createContext({console});vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'))+'\nglobalThis.fixture={DATA,LerenCurriculum};',pctx);vm.runInContext(read('modules/learning-path/core.js'),pctx);
const course=pctx.LerenLearningPath.catalog(pctx.fixture.DATA,pctx.fixture.LerenCurriculum);
const commLessons=course.chapters.find(c=>c.id==='comm').lessons,a11Words=course.chapters.filter(c=>c.level==='A1.1').flatMap(c=>c.lessons.flatMap(l=>l.ids));
const SHOTS=process.env.SHOTS||require('node:os').tmpdir();
// Old data: 60 learned words, a 6-day streak until yesterday, the old points goal, topic "Знайомство" done, A1.1 mock exam 70%, an old badge.
function oldData(){
 const store={};a11Words.slice(0,60).forEach(id=>store[id]={seen:3,correct:3,wrong:0,streak:2,due:Date.now()+5*864e5,known:true});
 const completed={};commLessons.forEach(l=>completed[l.id]=l.ids.length);
 return {poly_progress:JSON.stringify(store),poly_score:'420',poly_goal:'100',leren_path_v1:JSON.stringify({version:1,started:true,entry:commLessons[0].id,completed,mistakes:[],session:null,placement:null}),
  leren_exam11:JSON.stringify({best:{proef:70,lezen:80}}),poly_toetsbest:JSON.stringify({course_comm_v2:9}),leren_achievements_v1:JSON.stringify({version:1,earned:{'xp-100':'2026-01-05T10:00:00.000Z'}})};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 const done=[];
 try{
  for(const [name,viewport] of [['phone',{width:390,height:844}],['desktop',{width:1366,height:900}]])for(const theme of ['light','dark'])for(const who of ['new','old']){
   const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(([r,theme,data])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();const y=new Date();y.setDate(y.getDate()-1);const day=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const base={leren_release_seen:JSON.stringify(r),poly_theme:theme,poly_ui:'uk',leren_home_v1:'path',...(data||{})};if(data)base.poly_streak=JSON.stringify({n:6,last:day(y)});
    for(const [k,v] of Object.entries(base))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,theme,who==='old'?oldData():null]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath&&window.EXAM12&&window.LerenInsights);
   const tag=name+'/'+theme+'/'+who;
   // Header and goal: minutes, default 10; old points goal ignored but kept.
   assert.equal(await page.evaluate(()=>goalMin()),10,tag);
   if(who==='old'){
    const st=await page.evaluate(()=>({streak:streakState(),earned:rewards.state.earned,score,toets:localStorage.getItem('poly_toetsbest'),goal:localStorage.getItem('poly_goal')}));
    assert.equal(st.streak.n,6,tag+': streak kept');assert.equal(st.score,420,'score unchanged');assert.equal(st.toets,'{"course_comm_v2":9}');assert.equal(st.goal,'100','old setting not deleted');
    for(const id of ['words-50','chapter-1','exam-1','streak-3','lesson-1','lesson-5'])assert(st.earned[id],tag+': earned from saved results: '+id);
    for(const id of ['streak-7','words-100','course-a11','chapter-5'])assert(!st.earned[id],tag+': not yet '+id);
    assert.equal(st.earned['xp-100'],'2026-01-05T10:00:00.000Z','old badge date kept');
   }
   // Progress screen: Peter and the four skills of the current course.
   await page.evaluate(()=>setView('progress'));await page.waitForSelector('#insSkills');
   assert.match(await page.locator('#insSkills h3').innerText(),/Навички · A1\.1/);assert.equal(await page.locator('#insSkills .ins-row').count(),4);
   assert.equal(await page.locator('#insSkills .ins-row[data-skill="spreken"] .ins-pct').count(),0,'no speaking percentage');
   assert.match(await page.locator('#insSkills .ins-row[data-skill="spreken"]').innerText(),/Усних відповідей у мікрофон: 0/);
   assert.match(await page.locator('#insSkills .ins-row[data-skill="lezen"]').innerText(),who==='old'?/Іспит A1\.1: 80%/:/Ще немає відповідей/);
   if(who==='new')assert.match(await page.locator('#insPeter').innerText(),/Поки все добре/);
   assert.match(await page.locator('#progressPanel .pp-goal-v').innerText(),/^0 \/ 10 хв$/);
   if(who==='old'){const tile=page.locator('#rewardsPanel .rw-tile[data-badge="words-50"]');assert.match(await tile.innerText(),/✓ Вивчено 50 слів/);assert.match(await page.locator('#rewardsPanel .rw-tile[data-badge="course-a12"]').innerText(),/Пройдено всі уроки курсу A1\.2/)}
   await page.screenshot({path:path.join(SHOTS,`insights-${name}-${theme}-${who}-progress.png`),fullPage:false});
   // Text and background differ in this theme (cards follow light/dark).
   const colors=await page.evaluate(()=>{const s=getComputedStyle(document.getElementById('insSkills'));return [s.color,s.backgroundColor]});assert.notEqual(colors[0],colors[1]);
   if(theme==='dark')assert.match(colors[1],/rgb\(39, 31, 25\)/,'dark card');
   // Goal choice: 5, 10, 15, 20, 30 minutes.
   await page.evaluate(()=>openGoalModal());assert.equal(await page.locator('#goalModal .goal-opt').count(),5);assert.equal(await page.locator('#goalModal .goal-opt.correct').getAttribute('data-goal'),'10');
   await page.locator('#goalModal .goal-opt[data-goal="15"]').click();assert.equal(await page.evaluate(()=>goalMin()),15);await page.locator('#goalModal .goal-opt[data-goal="10"]').click();await page.locator('#goalModal .btn.primary').click();
   // Active minutes: nothing on a non-learning screen or without input; real input on a lesson counts.
   const act=await page.evaluate(()=>{const now=Date.now();setView('dict');actTick=now-5000;actMark();const a=actStep(now);setView('lesson');actTick=now-5000;actInput=now-100000;const b=actStep(now);actTick=now-5000;actMark();const c=actStep(now);return [a,b,c]});
   assert.deepEqual(act,[0,0,5000]);
   // Reaching the goal adds one streak day, once.
   const goal=await page.evaluate(()=>{const m=lsGet('leren_minutes_v1',{days:{}});const own=LerenMerge.minutesView(lsGet('leren_minutes_v2',{})).days[dayStr()]||0;m.days[dayStr()]=Math.max(0,595-own);lsSet('leren_minutes_v1',m);/* v174 data + this device's seconds = 9:55; +5 s → 10 min */const now=Date.now();actTick=now-5000;actMark();actStep(now);
    const first=streakState();const again=goalCheck();return {n:first.n,today:first.today,again,earned:Object.keys(rewards.state.earned),label:$('progressPanel').querySelector('.pp-goal').classList.contains('done')}});
   assert.equal(goal.n,who==='old'?7:1,tag+': streak +1');assert(goal.today&&goal.again===false&&goal.label);
   if(who==='old')assert(goal.earned.includes('streak-7'),'7-day badge');else assert(!goal.earned.includes('streak-3'));
   if(who==='old'&&theme==='light'){
    // Peter's advice from real results: reading is good, omdat is not → the omdat exercise opens directly.
    await page.evaluate(()=>{let s={};for(let i=0;i<12;i++)s=LerenInsights.skillLog(s,'a11','lezen',true);lsSet('leren_skills_v1',s);lsSet('leren_slips_v1',{a11:{omdat:'010010'}});setView('progress')});
    const tip=page.locator('#insPeter .ins-tip').first();assert.equal(await tip.locator('p').innerText(),'Ти добре читаєш, але часто помиляєшся в реченнях з omdat. Сьогодні потренуємо це правило.');
    await page.screenshot({path:path.join(SHOTS,`insights-${name}-peter.png`)});
    await tip.locator('button').click();await page.waitForSelector('#card .om-line');assert.equal(await page.evaluate(()=>view),'games');
    // The same advice on the home screen, with its own button.
    await page.evaluate(()=>setView('path'));const adv=page.locator('#learningPath .fh-advice');await adv.waitFor();assert.match(await adv.innerText(),/omdat/);
    await page.screenshot({path:path.join(SHOTS,`insights-${name}-home-advice.png`)});
    await adv.locator('.fh-advice-btn').click();await page.waitForSelector('#card .om-line');
    // Playing the exercise is recorded: right answers make the advice go away.
    await page.evaluate(()=>{lsSet('leren_slips_v1',{a11:{omdat:'010010'+'1'.repeat(14)}})});
    // Weak listening → the listening exercise of the topic; due words → review in the route; weak test → that test.
    await page.evaluate(()=>{let s={};for(let i=0;i<12;i++)s=LerenInsights.skillLog(s,'a11','luisteren',i%2===0);lsSet('leren_skills_v1',s);setView('progress')});
    await page.locator('#insPeter .ins-tip[data-kind="skill"] button').click();assert.deepEqual(await page.evaluate(()=>[view,mode]),['lesson','audio']);
    await page.evaluate(()=>{lsSet('leren_skills_v1',{});for(const id of LerenLearningPath.catalog(DATA,LerenCurriculum).chapters[0].lessons[0].ids.slice(0,4)){const s=stateFor(id);s.due=Date.now()-864e5}saveStore();setView('progress')});
    await page.locator('#insPeter .ins-tip[data-kind="due"] button').click();assert.deepEqual(await page.evaluate(()=>[view,learningPath.model.state.session.kind,learningPath.model.state.session.ids.length]),['path','review',4]);
    await page.evaluate(()=>{lsSet('poly_toetsbest',{...lsGet('poly_toetsbest',{}),[TOETS.find(t=>(t.lvl||'a11')==='a11'&&t.kind!=='leveltest').id]:1});setView('progress')});
    await page.locator('#insPeter .ins-tip[data-kind="test"] button').click();assert.equal(await page.evaluate(()=>view),'toets');assert(await page.evaluate(()=>!!toetsId));
    // Exam answers count for the exam's course only (A1.2 here), A1.1 stays as it was.
    const sk=await page.evaluate(async()=>{lsSet('leren_skills_v1',{});lsSet('leren_skills_v2',{});EXAM12._quiz('lezen',true);for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,5));const it=EXAM12._current();if(!it||document.querySelector('#card .ex-end'))break;[...document.querySelectorAll('#card .ex-opts .opt')].find(x=>x.textContent===it.ok).click();document.querySelector('#card #nx').click()}return LerenMerge.skillsView(skillsStore())});
    assert(sk.a12.lezen.n>=14&&sk.a12.lezen.ok===sk.a12.lezen.n,'A1.2 reading counted: '+JSON.stringify(sk.a12.lezen));assert.equal(sk.a11.lezen.n,0);
    await page.evaluate(()=>{switchCourse('a12');setView('progress')});assert.match(await page.locator('#insSkills .ins-row[data-skill="lezen"]').innerText(),/100% правильних · \d+ відповід/);
   }
   assert.deepEqual(errors,[],'No page errors: '+tag);done.push(tag);await ctx.close();
  }
  console.log('PASS: '+done.length+' runs ('+done.join(', ')+'): skills per course without a speaking %, goal 5–30 min (default 10), active minutes only with input on learning screens, streak +1 once, old data kept (streak, score, tests, badge dates) and new badges from saved results with reasons, Peter\'s advice (omdat example) opening the exercise from Progress and Home, listening/review/test advice, exam answers counted per course');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
