// Learning insights (modules/insights/core.js): active minutes, daily goal, streak (time zones and daylight-saving changes),
// skills per course, grammar slips, Peter's advice, and the new rewards (modules/rewards). Run: node tests/insights.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),same=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);
const ctx=vm.createContext({console});vm.runInContext(read('modules/insights/core.js'),ctx);const I=ctx.LerenInsights;

// 1. Active time: only visible learning screens with recent input; one tick adds at most 15 s.
assert.equal(I.credit(0,5000,4000,true),5000);
assert.equal(I.credit(0,5000,4000,false),0,'hidden tab or a non-learning screen');
assert.equal(I.credit(0,200000,100000,true),0,'no input for more than 90 s');
assert.equal(I.credit(0,3600e3,3599e3,true),15000,'a sleeping computer adds at most 15 s');
assert.equal(I.credit(5000,5000,5000,true),0);assert.equal(I.credit(9000,5000,5000,true),0,'clock moved back');
{let m={};for(let i=0;i<70;i++){const d=new Date(2026,0,1+i);m=I.addTime(m,60000,I.day(d))}
 assert.equal(Object.keys(m.days).length,60,'last 60 days kept');assert.equal(I.minutesOn(m,'2026-03-11'),1);assert.equal(I.minutesOn(m,'2026-01-01'),0);
 assert.equal(I.minutesOn(I.addTime(I.addTime({},590e3,'2026-11-02'),9e3,'2026-11-02'),'2026-11-02'),9,'590 s + 9 s = 9 min (whole minutes only)');
 same(I.cleanMinutes({days:{'2026-11-02':-5,'bad':10,'2026-11-01':120}}),{days:{'2026-11-01':120}},'broken values dropped');}
// 2. Goal: 5/10/15/20/30 minutes, default 10 (the old points goal is not a minute value).
assert.equal(I.goal(undefined),10);assert.equal(I.goal(15),15);assert.equal(I.goal('30'),30);assert.equal(I.goal(50),10);assert.equal(I.goal(100),10);

// 3. Streak: consecutive local days; a missed day starts a new streak but keeps the best; never lowers on a clock ahead.
{let s={};for(const d of ['2026-03-27','2026-03-28','2026-03-29','2026-03-30','2026-03-31'])s=I.streakAdvance(s,d); // EU summer time starts on 29 March 2026
 same([s.n,s.best,s.last],[5,5,'2026-03-31'],'over the spring daylight-saving change');
 s={};for(const d of ['2026-10-24','2026-10-25','2026-10-26'])s=I.streakAdvance(s,d);assert.equal(s.n,3,'over the autumn change');
 s=I.streakAdvance(s,'2026-10-26');assert.equal(s.n,3,'same day counts once');
 s=I.streakAdvance(s,'2026-10-29');same([s.n,s.best],[1,3],'missed days: new streak, best kept');
 same(I.streakView({n:6,last:'2026-11-01'},'2026-11-02'),{n:6,best:6,last:'2026-11-01',today:false},'old save, yesterday: still alive');
 assert.equal(I.streakView({n:6,last:'2026-10-30',best:9},'2026-11-02').n,0);assert.equal(I.streakView({n:6,last:'2026-10-30',best:9},'2026-11-02').best,9);
 same(I.streakView({n:2,last:'2026-12-31'},'2026-01-01').n,0);same(I.streakView({n:2,last:'2026-12-31'},'2027-01-01').n,2,'over new year');
 const ahead=I.streakAdvance({n:4,last:'2026-11-05',best:4},'2026-11-02');same([ahead.n,ahead.last,ahead.best],[4,'2026-11-05',4],'a date from a clock ahead never lowers anything');
 assert.equal(I.dayNum('2026-03-30')-I.dayNum('2026-03-29'),1);assert.equal(I.dayNum('2026-10-26')-I.dayNum('2026-10-25'),1);}
// 4. The day is the learner's own date: the same instant is another day in Brussels and in New York.
{const run=tz=>execFileSync(process.execPath,['-e',`require(${JSON.stringify(path.join(root,'modules/insights/core.js'))});process.stdout.write(LerenInsights.day(new Date(Date.UTC(2026,10,2,3,30))))`],{env:{...process.env,TZ:tz}}).toString();
 assert.equal(run('Europe/Brussels'),'2026-11-02');assert.equal(run('America/New_York'),'2026-11-01');assert.equal(run('Asia/Tokyo'),'2026-11-02');
 // Local midnight right after the spring change in Brussels is still the right date.
 assert.equal(execFileSync(process.execPath,['-e',`require(${JSON.stringify(path.join(root,'modules/insights/core.js'))});const d=new Date(2026,2,29,0,30);d.setDate(d.getDate()+1);process.stdout.write(LerenInsights.day(d))`],{env:{...process.env,TZ:'Europe/Brussels'}}).toString(),'2026-03-30');}

// 5. Skills per course; percentages only from 10 checked answers; speaking only counts.
{let s={};for(let i=0;i<12;i++)s=I.skillLog(s,'a12','lezen',i!==0);for(let i=0;i<4;i++)s=I.skillLog(s,'a12','luisteren',true);s=I.spoke(I.spoke(s,'a12'),'a12');s=I.skillLog(s,'a11','lezen',false);
 const a12=I.summary(s,'a12',{best:{lezen:90,luisteren:70},wbest:{a:100,b:60},sp:{verleden:[0,1],zorg:[2]}}),a11=I.summary(s,'a11',{});
 same([a12.lezen.n,a12.lezen.ok,a12.lezen.pct,a12.lezen.exam],[12,11,92,90]);assert.equal(a12.luisteren.pct,null,'4 answers: no percentage yet');
 same([a12.schrijven.tasks,a12.schrijven.avg],[2,80]);same(a12.spreken,{n:2,exam:3});assert(!('pct' in a12.spreken),'no speaking percentage');
 same([a11.lezen.n,a11.lezen.ok,a11.luisteren.n],[1,0,0],'A1.1 and A1.2 apart');
 assert.equal(I.skillLog(s,'a21','lezen',true).a21,undefined);assert.equal(I.summary({},'a11',null).lezen.n,0);
 let r={};for(let i=0;i<40;i++)r=I.skillLog(r,'a11','lezen',true);assert.equal(r.a11.lezen.r.length,30,'recent window of 30');
 same(I.cleanSkills({a11:{lezen:{ok:9,n:3,r:'1x0'}}}).a11.lezen,{ok:3,n:3,r:'10'},'broken values repaired');}

// 6. Grammar points of real exam data.
{const ectx=vm.createContext({console,uiLang:'uk',lsGet:()=>({}),lsSet(){},shuffle:a=>a.slice(),window:{},DATA:{}});ectx.window=ectx;vm.runInContext(read('modules/exam/exam-core.js'),ectx);vm.runInContext(read('modules/exam/exam12-data.js'),ectx);const C=ectx.window.EXAM12_DATA.COMMON,G=ectx.window.EXAM12_DATA.GRAM;
 same(C.map(([re])=>I.tipTag(re)),['perfectum','perfectum','omdat','vergelijking','scheidbaar','spelling']);
 const tags=G.filter(g=>!g.w).map(g=>I.tagGram({gap:g.s,o:g.o}));assert(tags.includes('perfectum')&&tags.includes('omdat'),'exam grammar questions get their points: '+[...new Set(tags)]);}

// 7. Peter's advice: the example from the brief, and every kind leads to an exercise.
{let sk={};for(let i=0;i<12;i++)sk=I.skillLog(sk,'a11','lezen',true);let sl={};for(const ok of [false,true,false,false,true,false])sl=I.slipLog(sl,'a11','omdat',ok);
 const f={lv:'a11',skills:I.summary(sk,'a11',{}),slips:I.cleanSlips(sl).a11,due:[],tests:[],lessonsDone:0,writeTask:null,tabs:[]},r=I.recommend(f);
 assert.equal(r.items[0].kind,'slip');same(r.items[0].action,{t:'game',id:'om'});assert.equal(r.strong,'lezen');
 assert.equal(I.say(r.items[0],'uk',r.strong),'Ти добре читаєш, але часто помиляєшся в реченнях з omdat. Сьогодні потренуємо це правило.');
 assert.equal(I.say(r.items[0],'en',r.strong),'You read well, but you often slip in sentences with omdat. Today we practise this rule.');
 for(const l of ['fr','ar'])assert(I.say(r.items[0],l,r.strong).includes('omdat'));
 // Weak listening, due words, a weak test, little speaking; max 3, the slip first.
 let s2={};for(let i=0;i<12;i++)s2=I.skillLog(s2,'a12','luisteren',i%2===0);
 const g={lv:'a12',skills:I.summary(s2,'a12',{}),slips:{},due:['a','b','c','d','e','f'],tests:[{id:'t1',title:'Wonen',best:3,total:10},{id:'t2',title:'X',best:9,total:10}],lessonsDone:8,writeTask:'w1',tabs:['separable']};
 const r2=I.recommend(g);same(r2.items.map(x=>x.kind),['skill','due','test']);same(r2.items[0].action,{t:'mode',mode:'audio'});same(r2.items[1].action,{t:'review',ids:['a','b','c','d','e']});same(r2.items[2].action,{t:'test',id:'t1'});
 assert.equal(I.say(r2.items[0],'uk',null),'На слух поки 50% правильних відповідей. Сьогодні послухаємо слова теми й оберемо переклад.');
 assert.equal(I.say(r2.items[1],'uk'),'6 слів пора повторити. Повторимо їх зараз — це 2–3 хвилини.');
 const r3=I.recommend({...g,skills:I.summary({},'a12',{}),due:[],tests:[]});same(r3.items.map(x=>x.kind),['speak']);assert.match(I.say(r3.items[0],'uk'),/0 усних відповідей/);
 same(I.recommend({lv:'a11',skills:I.summary({},'a11',{}),slips:{},due:['a','b'],tests:[],lessonsDone:0,tabs:[]}).items,[],'new learner: nothing to fix yet');
 same(I.recommend({...g,skills:I.summary({},'a12',{}),due:[],tests:[],canSpeak:false}).items,[],'no speech recognition: speaking is not suggested');
 // Each grammar point opens its own exercise; lesson tabs only when the course has them.
 const act=(tag,lv,tabs=[])=>I.recommend({lv,skills:I.summary({},lv,{}),slips:{[tag]:'000'},due:[],tests:[],lessonsDone:0,tabs}).items[0].action;
 same(act('perfectum','a12'),{t:'exam',lv:'a12',part:'grammatica'});same(act('meervoud','a12'),{t:'exam',lv:'a11',part:'meervoud'});same(act('spelling','a11'),{t:'game',id:'dc'});
 same(act('scheidbaar','a12',['separable']),{t:'tab',tab:'separable',mode:'quiz'});same(act('scheidbaar','a11'),{t:'exam',lv:'a11',part:'grammatica'});same(act('klinkers','a11',['klanken']),{t:'tab',tab:'klanken',mode:'quiz'});
 // Two slips out of 20 are not a weakness; three out of ten are.
 assert.equal(I.recommend({lv:'a11',skills:I.summary({},'a11',{}),slips:{omdat:'11111111110111111101'},due:[],tests:[],lessonsDone:0}).items.length,0);
 for(const l of ['uk','en','fr','ar'])for(const k of ['slip','skill','write','due','test','speak'])assert(I.label({kind:k},l),l+' '+k);}

// 8. Rewards: new badges once, explained, old ones kept.
{const rctx=vm.createContext({window:{},console});rctx.window=rctx;vm.runInContext(read('modules/rewards/core.js'),rctx);vm.runInContext(read('modules/rewards/gifts.js'),rctx);
 const R=rctx.LerenRewards,ids=R.badges.map(b=>b.id);assert.equal(new Set(ids).size,ids.length);
 for(const id of ['streak-3','streak-7','streak-14','streak-30','words-50','words-100','chapter-1','chapter-5','exam-1','course-a11','course-a12'])assert(ids.includes(id),id);
 assert.equal(JSON.stringify(ids.slice(0,13)),JSON.stringify(['xp-100','xp-250','xp-500','xp-1000','xp-2500','xp-5000','xp-10000','lesson-1','lesson-5','lesson-10','chapter-1','perfect-1','streak-7']),'old IDs and order unchanged');
 const m={};const store={getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=v}};m[R.KEY]=JSON.stringify({version:1,earned:{'xp-100':'2026-01-05T10:00:00.000Z'}});
 const model=R.create(store),facts={xp:150,lessons:3,chapters:1,perfect:0,streak:6,words:64,exams:1,a11:0,a12:0};
 const added=model.observe(facts,'2026-11-02T10:00:00.000Z').map(b=>b.id).sort();same(added,['chapter-1','exam-1','lesson-1','streak-3','words-50'].sort());
 same(model.observe(facts,'2026-11-03T10:00:00.000Z'),[],'no badge twice');assert.equal(model.state.earned['xp-100'],'2026-01-05T10:00:00.000Z','old date kept');
 same(model.observe({...facts,words:120,a11:1,streak:14},'2026-11-04T10:00:00.000Z').map(b=>b.id).sort(),['course-a11','streak-14','streak-7','words-100']);
 // Names and reasons exist in four languages (ui.js), gifts have distinct names.
 rctx.document={};vm.runInContext(read('modules/rewards/ui.js'),rctx);
 for(const l of ['uk','en','fr','ar'])for(const b of R.badges){assert(R.name(b,l),'name '+l+' '+b.id);assert(R.reason(b,l),'reason '+l+' '+b.id)}
 assert.equal(R.reason(R.badges.find(b=>b.id==='words-50'),'uk'),'Вивчено 50 слів (2 правильні відповіді поспіль)');
 assert.equal(R.reason(R.badges.find(b=>b.id==='exam-1'),'uk'),'Пробний іспит у застосунку (A1.1 або A1.2) — 60% і більше. Це навчальна нагорода, а не офіційний результат іспиту');
 assert.equal(R.EXAM_BADGE_PCT,60);assert.equal(R.name(R.badges.find(b=>b.id==='exam-1'),'uk'),'Перший складений іспит');
 for(const l of ['en','fr','ar'])assert.match(R.reason(R.badges.find(b=>b.id==='exam-1'),l),/60/);
 assert.equal(R.reason(R.badges.find(b=>b.id==='chapter-1'),'uk'),'Завершено першу тему маршруту');}

// 9. Wiring in the app: one source for the goal and the streak, counted in every skill.
{const html=require(__dirname+'/lib/app-source.cjs')();
 // The reward threshold is the reward's own constant; exam scores are never compared with it elsewhere.
 assert(html.includes('e.best.proef>=LerenRewards.EXAM_BADGE_PCT'));assert(!/proef>=60/.test(html+read('modules/exam/exam-core.js')));
 // A finished lesson is a success whatever the daily goal: the result screen shows it before the goal note.
 const lp=read('modules/learning-path/ui.js');assert(lp.indexOf("bridge.goalText(g)")<lp.indexOf("node('h3','',t(result.kind==='lesson'?'result':'resultReview'))"));
 for(const l of ['uk','en','fr','ar']){const u=I.ui(l);assert(u.lessonDone&&u.goalMet&&u.goalLeft(4,10).includes('4'))}
 assert.equal(I.ui('uk').goalLeft(4,10),'Мета дня: 4 з 10 хв. Урок зараховано — решту можна добрати пізніше.');
 assert(!/dailyGoal\(\)/.test(html),'the points goal is gone');assert(html.includes('<script src="./modules/insights/core.js?v=174"></script>'));assert(read('sw.js').includes('"./modules/insights/core.js?v=174"'));
 for(const hook of ['skillLog(mode==="audio"?"luisteren":"lezen",ok)','skillLog("schrijven",good)','slipLog("klinkers",ok)','slipLog("werkwoorden",ok)','slipLog("scheidbaar",ok)','slipLog("omdat",!s.tries)','listenOnce(a=>{skillSpoke();ok(a)}'])assert(html.includes(hook),hook);
 const core=read('modules/exam/exam-core.js');assert(core.includes('examLog(KEY,it,ok)')&&core.includes('examSpoke(KEY)')&&core.includes('practice:part=>'));}
console.log('PASS: active minutes (hidden, idle, sleep), goal 5–30 min default 10, streak across DST/new year/time zones without losing the best, skills per course (no speaking %), exam grammar points, Peter\'s advice with the omdat example and direct exercises, 9 new badges once with reasons in 4 languages, old badges kept');
