const assert=require('node:assert/strict'),fs=require('node:fs');

(async()=>{
 const {fence,buildQuickPhrase,searchPhrases}=await import('../modules/learn-life/data.mjs');
 const {createLifeSession}=await import('../modules/learn-life/engine.mjs');
 const ids=fence.phrases.map(p=>p.id),tasks=fence.stages.flatMap(s=>s.tasks);
 assert.equal(fence.stages.length,4);
 assert.equal(tasks.length,20);
 for(const phrase of ['hammer-please','hold-gate','block-under','old-concrete','water-break','deep-enough','repeat-please'])assert(ids.includes(phrase),phrase+' covers the real workday');
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);
 for(const task of tasks){
  assert(ids.includes(task.answer),task.id+' answer exists');
  assert(task.choices.includes(task.answer),task.id+' answer is offered');
  assert.equal(new Set(task.choices).size,task.choices.length,task.id+' choices are distinct');
  assert(task.choices.every(id=>ids.includes(id)),task.id+' options exist');
 }
 for(const stage of fence.stages)assert(stage.objectIds.every(id=>fence.objects.some(o=>o.id===id)),stage.id+' objects exist');
 assert.deepEqual(buildQuickPhrase('hand','hammer'),{nl:'Kun je me de hamer even aangeven?',uk:'Можеш подати мені молоток?'});
 assert.equal(searchPhrases(fence.phrases,'вода')[0]?.id,'water-break');
 assert.equal(searchPhrases(fence.phrases,'лопата')[0]?.id,'give-shovel');
 assert.equal(searchPhrases(fence.phrases,'waterpas')[0]?.id,'check-level');
 assert.equal(buildQuickPhrase('missing','hammer'),null);
 const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 let session=createLifeSession(fence,storage),first=tasks[0];
 assert.equal(session.done(),0);
 assert.equal(session.answer(first.id,'missing'),null,'an unknown option cannot change progress');
 const wrong=first.choices.find(id=>id!==first.answer);
 assert.equal(session.answer(first.id,wrong).correct,false);
 assert.deepEqual(session.state.missed,[first.answer]);
 assert.equal(session.done(),0);
 assert.equal(session.answer(first.id,first.answer).correct,true);
 assert.equal(session.done(),1);
 assert.equal(session.reviewQueue()[0],first.answer,'missed phrase comes first in speaking practice');
 assert.equal(session.favourite(first.answer),true);
 session=createLifeSession(fence,storage);
 assert.equal(session.done(),1,'progress resumes after reload');
 assert.equal(session.state.favourites[0],first.answer);
 assert.equal(session.next(fence.stages[0].id).id,tasks[1].id);
 assert.equal(session.speak(first.answer),true);
 assert(!session.state.missed.includes(first.answer));
 for(const task of tasks.slice(1))assert.equal(session.answer(task.id,task.answer).correct,true);
 assert.equal(session.done(),20);
 for(const stage of fence.stages){assert.equal(session.complete(stage.id),stage.tasks.length);assert.equal(session.next(stage.id),null)}
 assert.equal(createLifeSession(fence,{getItem(){return '{broken'},setItem(){throw Error('storage blocked')}}).done(),0);
 const html=fs.readFileSync('learn-life.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),home=fs.readFileSync('modules/home-showcase/ui.js','utf8');
 assert(html.includes('id="quick"')&&html.includes('id="speak"')&&html.includes('id="stageNav"')&&html.includes('id="phraseSearch"'));
 for(const path of ['./learn-life.html','./modules/learn-life/style.css?v=2','./modules/learn-life/data.mjs?v=2','./modules/learn-life/engine.mjs','./modules/learn-life/ui.mjs?v=2'])assert(sw.includes('"'+path+'"'),path+' cached for offline use');
 assert(home.includes("lifeLink.href='./learn-life.html'"));
 console.log('PASS: Learn Life four-stage scenario, 20 contextual decisions, phrase builder, wrong-first speaking queue, saved progress, blocked storage and offline assets');
})().catch(error=>{console.error(error);process.exitCode=1});
