// LerenBe LIFE story engine (modules/learn-life/story-engine.mjs) and story 1 «Перший день у Бельгії»
// (stories/first-day.mjs): data shape, every graded step answerable, `repeat` never counts as a mistake, first-try
// scoring, best XP per scene kept and recorded once, saved progress and mode, speaking check tolerant to case and
// punctuation, blocked storage. Run: node tests/life-story.cjs
const assert=require('node:assert/strict');
(async()=>{
 const {STORIES,ROADMAP,storyById}=await import('../modules/learn-life/stories/index.mjs');
 const E=await import('../modules/learn-life/story-engine.mjs');
 const S=storyById('first-day');assert(S&&STORIES.includes(S));assert.equal(S.lang,'nl');assert.equal(S.level,'A1');
 assert.equal(ROADMAP.length,15,'15 stories in the plan');assert.equal(new Set(ROADMAP.map(r=>r.id)).size,15);
 assert.deepEqual(ROADMAP.filter(r=>r.stage===1).map(r=>r.id),['first-day','supermarket','town-hall','first-workday','fence'],'stage 1 as planned');
 assert(S.scenes.length>=5&&S.scenes.length<=8,'5–8 scenes');
 const nlTexts=new Set();let graded=0;
 for(const sc of S.scenes){assert(sc.id&&sc.title&&sc.icon&&sc.steps.length);
  for(const st of sc.steps){
   assert(['line','reply','listen','find','say'].includes(st.type),st.type);
   if(st.who)assert(S.cast[st.who],'cast '+st.who);
   if(st.type==='line'||st.type==='listen'||st.type==='say'){assert(st.nl&&st.uk,sc.id);nlTexts.add(st.nl)}
   if(st.type==='reply'){assert.equal(st.options.filter(o=>o.ok).length,1,sc.id+': one right reply');assert(st.options.some(o=>o.repeat),sc.id+': a way to ask again');
    for(const o of st.options){assert(o.nl&&o.uk);nlTexts.add(o.nl);if(!o.ok&&!o.repeat)assert(o.why,sc.id+': wrong reply explained')}}
   if(st.type==='listen'){assert(Number.isInteger(st.answer)&&st.options[st.answer]&&st.why);assert.equal(new Set(st.options).size,st.options.length)}
   if(st.type==='find'){assert(st.ask.every(id=>st.items.some(i=>i.id===id)));st.items.forEach(i=>nlTexts.add(i.nl))}
   if(['reply','listen','find','say'].includes(st.type))graded++}}
 assert(nlTexts.size>=30&&nlTexts.size<=60,'30–50 useful phrases: '+nlTexts.size);
 for(const t of nlTexts)assert(!/[Ѐ-ӿ]/.test(t),'Dutch in Latin letters: '+t);
 // speaking check
 assert.equal(E.sayScore('Ik kom uit Oekraïne.','ik kom uit oekraine'),1,'case, punctuation and accents ignored');
 assert.equal(E.sayScore('Tot morgen, Annick!','tot morgen anik',['Annick']),1,'a misheard name does not count');assert(E.sayScore('Tot morgen, Annick!','tot ziens',['Annick'])<E.SAY_PASS);
 assert(E.sayScore('Ik kom uit Oekraïne.','ik ben moe')<E.SAY_PASS);
 // a perfect play of every scene
 const mem=new Map(),st={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,String(v))};
 let s=E.createStorySession(S,st);assert.equal(s.state.mode,'learn');assert.equal(s.nextScene().id,'station');
 const playAll=(sess,{mistakes=false}={})=>{const out=[];for(const sc of S.scenes){const r=sess.play(sc.id);let guard=0;
  while(!r.finished&&guard++<200){const step=r.step;
   if(step.type==='line'){r.next();continue}
   if(step.type==='reply'){const rep=step.options.findIndex(o=>o.repeat);assert.equal(r.answer(rep).repeat,true,'repeat is not an answer');
    if(mistakes){const bad=step.options.findIndex(o=>!o.ok&&!o.repeat);assert.equal(r.answer(bad).ok,false)}
    assert.equal(r.answer(step.options.findIndex(o=>o.ok)).ok,true);continue}
   if(step.type==='listen'){if(mistakes)assert.equal(r.answer((step.answer+1)%step.options.length).ok,false);assert.equal(r.answer(step.answer).ok,true);continue}
   if(step.type==='find'){for(const id of step.ask){if(mistakes){const wrong=step.items.find(i=>i.id!==id).id;assert.equal(r.answer(wrong).ok,false)}assert.equal(r.answer(id).ok,true)}continue}
   if(step.type==='say'){if(mistakes)assert.equal(r.answer('dank je').ok,false);assert.equal(r.answer(step.nl.toUpperCase()).ok,true);continue}}
  out.push(r.finish())}return out};
 const perfect=playAll(s);assert(perfect.every(r=>r.correct===r.total),'repeat never costs a point');
 const total=perfect.reduce((n,r)=>n+r.xp,0);assert.equal(total,graded*E.XP_PER_STEP);assert.equal(s.xp(),total);assert.equal(s.maxXp(),total);
 for(const sc of S.scenes)assert.equal(E.recordXp(st,S.id,sc.id,s.state.best[sc.id]*E.XP_PER_STEP),s.state.best[sc.id]*E.XP_PER_STEP);
 const rec=JSON.parse(mem.get(E.XP_KEY));assert.equal(Object.values(rec).reduce((a,b)=>a+b,0),total);assert(Object.keys(rec).every(k=>/^first-day:[a-z-]+$/.test(k)));
 // replay with mistakes: nothing new, best kept; mistakes go to the review list
 s=E.createStorySession(S,st);assert.equal(s.nextScene(),null,'all scenes done after reload');
 const again=playAll(s,{mistakes:true});assert(again.every(r=>r.correct===0&&r.gained===0));assert.equal(s.xp(),total,'best result kept');
 assert(s.state.missed.length>=5,'missed phrases saved for review');
 assert.equal(E.recordXp(st,S.id,'station',0),JSON.parse(mem.get(E.XP_KEY))['first-day:station'],'a weaker result never lowers the record');
 // mode is saved; broken or blocked storage starts clean
 s.setMode('real');assert.equal(E.createStorySession(S,st).state.mode,'real');
 const bad=E.createStorySession(S,{getItem:()=>'{broken',setItem(){throw Error('blocked')}});assert.equal(bad.xp(),0);assert.equal(bad.state.mode,'learn');
 const r=bad.play('station');r.next();assert.equal(r.answer(99),null,'unknown option ignored');
 console.log(`PASS: LIFE story engine + «Перший день у Бельгії» — ${S.scenes.length} scenes, ${graded} graded steps, ${nlTexts.size} Dutch phrases, ${total} XP, repeat without penalty, best-per-scene XP, review list, saved mode`);
})().catch(e=>{console.error(e);process.exit(1)});
