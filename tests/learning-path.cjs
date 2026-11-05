const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx=vm.createContext({console});
vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'))+'\nglobalThis.fixture={DATA,LerenCurriculum};',ctx);
vm.runInContext(read('modules/learning-path/core.js'),ctx);
const core=ctx.LerenLearningPath,course=core.catalog(ctx.fixture.DATA,ctx.fixture.LerenCurriculum);
assert.equal(course.chapters.length,37);assert.equal(course.chapters.filter(c=>c.level==='A1.2').length,16);assert.equal(course.chapters.filter(c=>c.level==="A2").length,9);assert.equal(course.chapters.filter(c=>c.level==='A1.1').length,12);
assert(course.chapters.every(c=>c.lessons.length));
const expected=course.chapters.flatMap(c=>c.tabs.flatMap(t=>(ctx.fixture.DATA[t]?.items||[]).map(w=>w.id)));
const actual=course.lessons.flatMap(l=>l.ids);
assert.equal(new Set(actual).size,actual.length);assert.equal(actual.length,expected.length);assert(expected.every(id=>actual.includes(id)),'Every course card must appear, including final small chunks');
assert(course.lessons.every(l=>l.ids.length>0&&l.ids.length<=5));
assert(!course.lessons.some(l=>l.tab==='diphthongs'),'Supplementary pronunciation stays in free practice');
function storage(initial={}){const data={...initial};return {getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v,data}}
let s=storage(),m=core.create(course,s);m.start();const first=course.lessons[0];assert.equal(m.recommended().id,first.id);m.begin(first.id);
assert.equal(m.nextPhase(),false);assert.equal(m.finish(),null);assert.equal(m.advance('stale',true),false);
for(let phase=0;phase<3;phase++){
 while(m.current()){
  const w=m.current();assert(m.advance(w.id,true));assert.equal(m.advance(w.id,true),false);
  m=core.create(course,s);assert.equal(m.state.session.phase,phase,'Reload must preserve phase');
 }
 if(phase<2)assert(m.nextPhase());
}
const result=m.finish();assert.equal(result.correct,first.ids.length);assert(m.mastered(first.id));assert.equal(m.stats('comm').done,1);
assert.equal(m.recommended().id,course.lessons[1].id);assert.equal(core.create(course,s).recommended().id,course.lessons[1].id);
assert.equal(m.continueRoute().id,course.lessons[1].id);
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
// Complete both courses: each route ends at the end of its own course (no silent jump from A1.1 into A1.2).
const full=core.create(course,storage());full.start();let visited=0;
const cnt=lvl=>course.lessons.filter(l=>course.chapters.find(c=>c.id===l.chapter).level===lvl).length,a11=cnt('A1.1'),a12=cnt('A1.2'),a2=cnt('A2');assert(a2>0,'A2 has lessons on the route');
for(const level of ['A1.1','A1.2','A2']){
 assert(full.setCourse(level));assert.equal(full.course,level);
 while(full.recommended()){
  const l=full.recommended();assert.equal(course.chapters.find(c=>c.id===l.chapter).level,level,'The route stays inside the selected course');full.begin(l.id);
  for(let phase=0;phase<3;phase++){while(full.current())full.advance(full.current().id,true);if(phase<2)full.nextPhase()}
  full.finish();visited++;assert(visited<=course.lessons.length);
 }
 same(full.courseStats(level),{done:{'A1.1':a11,'A1.2':a12,A2:a2}[level],total:{'A1.1':a11,'A1.2':a12,A2:a2}[level]});
}
assert.equal(visited,course.lessons.length);same(full.stats(),{done:a2,total:a2},'Overall stats follow the selected course');
assert.equal(full.setCourse('A3'),false,'A course without lessons cannot be selected');assert.equal(full.course,'A2');

// Independent progress per course.
{
 let st=storage(),x=core.create(course,st);x.start();
 const first11=x.recommended();x.begin(first11.id);x.advance(x.current().id,true);x.advance(x.current().id,true);
 assert(x.setCourse('A1.2'));assert.equal(x.state.session,null,'An A1.1 lesson in progress is parked, not shown in A1.2');
 const first12=x.recommended();assert.equal(first12.chapter,'past');same(x.courseStats('A1.2'),{done:0,total:a12});
 x.begin(first12.id);for(let phase=0;phase<3;phase++){while(x.current())x.advance(x.current().id,phase!==2||x.state.session.index>0);if(phase<2)x.nextPhase()}x.finish();
 assert.equal(x.courseStats('A1.2').done,1);assert.equal(x.courseStats('A1.1').done,0,'A1.2 progress never counts for A1.1');
 const wrong=first12.ids[0];assert.deepEqual(Array.from(x.mistakes()),[wrong]);
 x=core.create(course,st);assert.equal(x.course,'A1.2','Selected course survives a reload');assert.equal(x.courseStats('A1.2').done,1);
 assert(x.setCourse('A1.1'));assert.equal(x.state.session.lesson,first11.id,'Switching back restores the paused A1.1 lesson');assert.equal(x.state.session.index,2);
 assert.equal(x.mistakes().length,0,'A1.2 mistakes are reviewed in A1.2 only');assert.equal(x.beginReview(),false);
 x=core.create(course,st);assert.equal(x.course,'A1.1');assert.equal(x.state.session.index,2);assert(x.setCourse('A1.2'));assert.equal(x.recommended().id,x.course==='A1.2'&&course.lessons.filter(l=>l.chapter==='past')[1].id);
 // Saves from before the course switcher (one route over both courses) keep every completed lesson and the paused lesson.
 const done11=course.lessons[0].id,done12=course.lessons[a11].id,paused=course.lessons[a11+1];
 const old={version:1,started:true,entry:course.lessons[0].id,completed:{[done11]:5,[done12]:4},mistakes:[],session:{kind:'lesson',lesson:paused.id,ids:paused.ids,phase:1,index:0,answers:[]},placement:null};
 x=core.create(course,storage({[core.KEY]:JSON.stringify(old)}));
 assert.equal(x.course,'A1.2','The course of the paused lesson becomes the active course');assert.equal(x.recommended().id,paused.id);
 assert.equal(x.courseStats('A1.1').done,1);assert.equal(x.courseStats('A1.2').done,1);assert.equal(x.state.completed[done11],5);assert.equal(x.state.completed[done12],4);
 assert(x.setCourse('A1.1'));assert.equal(x.recommended().id,course.lessons[1].id,'The old route start is kept for A1.1');
 const fresh=core.create(course,storage({[core.KEY]:JSON.stringify({...old,session:null})}));assert.equal(fresh.course,'A1.1');
}
// A weak result never locks the learner; wrong words are saved for a targeted review.
m.state.session.phase=2;
while(m.current())m.advance(m.current().id,false);
const weak=m.finish();assert.equal(weak.correct,0);assert.equal(m.mastered(weak.id),false);assert(m.state.mistakes.length);
const done=m.stats().done;assert(m.beginReview());
while(m.current())m.advance(m.current().id,true);
assert.equal(m.finish().kind,'review');assert.equal(m.state.mistakes.length,0);assert.equal(m.stats().done,done,'Review must not complete a different lesson');
// Placement suggests a start without claiming earlier lessons were mastered.
m=core.create(course,storage());m.place();
for(let i=0;i<12;i++){const w=m.placementCard();assert(w);assert(m.placementAnswer(w.id,i!==3));m=core.create(course,{getItem:()=>JSON.stringify(m.state),setItem(){}})}
assert(m.acceptPlacement());assert.equal(m.recommended().chapter,course.chapters[3].id);assert.equal(m.stats().done,0);
m=core.create(course,storage());m.place();for(let i=0;i<12;i++)m.placementAnswer(m.placementCard().id,true);assert(m.acceptPlacement());assert.equal(m.recommended().chapter,'past');assert.equal(m.course,'A1.2','Placement past A1.1 opens course A1.2');
// Corrupt data and denied browser storage cannot break startup.
for(const raw of ['{','null','[]','{"version":1,"completed":{"bad":999},"session":{"kind":"lesson","ids":["bad"],"phase":9}}']){
 const x=core.create(course,storage({[core.KEY]:raw}));assert.equal(x.state.session,null);assert.equal(x.stats().done,0);
}
const denied=core.create(course,{getItem(){throw Error('denied')},setItem(){throw Error('denied')}});denied.begin(first.id);assert.equal(denied.persistent,false);assert(denied.current());
// Real host rewards: improve a best once, including after page reload.
const from=script.indexOf('function recordPathResult('),to=script.indexOf('\nfunction start()',from),ledger={};
function host(){const x=vm.createContext({learningPath:{model:m},lsGet:k=>ledger[k],lsSet:(k,v)=>ledger[k]=v,rewardCheck(){},queueProgressSync(){},addXP(){},saveStore(){},updateStats(){}});vm.runInContext('const pathSessionRewards={};'+script.slice(from,to),x);return x}
let h=host();assert.equal(h.recordPathResult(first.id,2,first.ids.length),10);assert.equal(h.recordPathResult(first.id,2,first.ids.length),0);
h=host();assert.equal(h.recordPathResult(first.id,2,first.ids.length),0);assert.equal(h.recordPathResult(first.id,5,first.ids.length),15);assert.equal(h.recordPathResult('bad',5,5),0);
const files=JSON.parse(read('sw.js').match(/const APP_FILES = (\[[^;]+\]);/)[1]);for(const file of ['core.js','ui.js','style.css'])assert(files.includes('./modules/learning-path/'+file+'?v='+({'core.js':'175','ui.js':'195','style.css':'195'})[file]));assert(files.includes('./modules/learning-path/invitation.js?v=2'));assert(files.includes('./modules/learning-path/invitation.css?v=1'));
new vm.Script(read('modules/learning-path/ui.js'));
console.log(`PASS: ${course.chapters.length} chapters, ${course.lessons.length} lessons, all ${actual.length} course cards; phase-by-phase resume, stale answers, next lesson, targeted review, 12-question placement, corrupt/blocked storage, repeat-safe host XP and offline dependencies`);
