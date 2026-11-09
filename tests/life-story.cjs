// LerenBe LIFE Engine 2.0 (modules/learn-life/story-engine.mjs) and story 1 «Перший день у Бельгії»:
// data rules, branches by the learner's choice (ticket: had → straight to the tram; buy → extra scene at the machine),
// several right answers with the character's reaction, `repeat` with an explanation and no penalty, choices
// remembered across stories (people met, flags), three skills (understanding, grammar = word order, speaking =
// recognised words), three help levels, best XP per scene, old saved progress still valid, blocked storage.
// Run: node tests/life-story.cjs
const assert=require('node:assert/strict');
(async()=>{
 const {STORIES,ROADMAP,storyById}=await import('../modules/learn-life/stories/index.mjs');
 const E=await import('../modules/learn-life/story-engine.mjs');
 const S=storyById('first-day');assert(S&&STORIES.includes(S));
 assert.equal(ROADMAP.length,15);assert.deepEqual(ROADMAP.filter(r=>r.stage===1).map(r=>r.id),['first-day','supermarket','town-hall','first-workday','fence']);
 // ---- data rules for every ready story
 for(const T of STORIES){assert(ROADMAP.find(r=>r.id===T.id)?.ready,T.id+' ready');const texts=new Set(),ids=new Set();
  for(const sc of T.scenes){assert(!ids.has(sc.id));ids.add(sc.id);const stepIds=new Set(sc.steps.filter(x=>x.id).map(x=>x.id));
   for(const st of sc.steps){assert(['line','reply','listen','find','say'].includes(st.type));if(st.who)assert(T.cast[st.who],T.id+': cast '+st.who);if(st.nl)texts.add(st.nl);
    if(st.type==='reply'){assert(st.options.some(o=>o.ok),sc.id+': a right reply');assert(st.options.some(o=>o.repeat),sc.id+': a way to ask again');
     for(const o of st.options){texts.add(o.nl);if(!o.ok&&!o.repeat)assert(o.why,sc.id+': wrong reply explained');if(o.react){assert(T.cast[o.react.who]&&o.react.nl&&o.react.uk);texts.add(o.react.nl)}if(o.goto)assert(stepIds.has(o.goto),sc.id+': goto '+o.goto)}}
    if(st.type==='listen')assert(Number.isInteger(st.answer)&&st.options[st.answer]&&st.why&&new Set(st.options).size===st.options.length);
    if(st.type==='find')for(const it of st.items){texts.add(it.nl);if(st.ask.includes(it.id))texts.add(it.q||'Waar is '+it.nl+'?')}}}
  assert(T.scenes.length>=5&&T.scenes.length<=8);assert(texts.size>=30&&texts.size<=70,T.id+': phrases '+texts.size);for(const t of texts)assert(!/[Ѐ-ӿ]/.test(t),t)}
 // ---- speaking: words and their order are separate
 assert.deepEqual(E.sayCheck('Ik kom uit Oekraïne.','ik kom uit oekraine'),{speaking:1,grammar:1});
 const shuffled=E.sayCheck('Ik kom uit Oekraïne.','uit oekraine kom ik');assert.equal(shuffled.speaking,1,'all words heard');assert(shuffled.grammar<E.SAY_PASS,'but the order is wrong');
 assert.deepEqual(E.sayCheck('Tot morgen, Annick!','tot morgen anik',['Annick']),{speaking:1,grammar:1},'names do not count');
 assert(E.sayCheck('Ik kom uit Oekraïne.','ik ben moe').speaking<E.SAY_PASS);
 // ---- a run helper: choose(step) → option index for reply steps
 const mk=()=>{const m=new Map();return {m,st:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))}}};
 const play=(sess,sceneId,choose=st=>st.options.findIndex(o=>o.ok))=>{const r=sess.play(sceneId);let g=0;const seen=[];
  while(!r.finished&&g++<200){const x=r.step;seen.push(x.type+(x.id?':'+x.id:''));
   if(x.type==='line')r.next();else if(x.type==='reply')r.answer(choose(x));else if(x.type==='listen')r.answer(x.answer);
   else if(x.type==='find')x.ask.forEach(id=>r.answer(id));else r.answer([x.nl])}
  return {...r.finish(),seen,lines:sess.play(sceneId)&&null}};
 // Path A: a ticket already → no machine scene
 {const {st}=mk(),s=E.createStorySession(S,st);assert.equal(s.state.mode,'learn');
  const ticketAnswer=nl=>x=>{const i=x.options.findIndex(o=>o.nl===nl);return i>=0?i:x.options.findIndex(o=>o.ok)};
  const a=play(s,'station',ticketAnswer('Ja, ik heb al een ticket.'));assert.equal(a.correct,a.total);assert.equal(s.state.flags.ticket,'had');
  assert(!s.visibleScenes().some(x=>x.id==='machine'),'no machine scene with a ticket');assert.equal(s.nextScene().id,'meet');
  const tram=s.play('tram');const lines=[];let g=0;while(!tram.finished&&g++<50){const x=tram.step;if(x.type==='line'){lines.push(x.nl);tram.next()}else if(x.type==='listen')tram.answer(x.answer)}
  assert(lines.includes('Vergeet niet je ticket te scannen.')&&!lines.some(l=>/nieuwe ticket/.test(l)),'the tram scene follows the choice');}
 // Path B: no ticket → the machine scene appears; both answers are right, neither costs points
 const {m:mem,st}=mk();let s=E.createStorySession(S,st);
 const b=play(s,'station',x=>{const i=x.options.findIndex(o=>o.nl==='Nee, waar kan ik een ticket kopen?');return i>=0?i:x.options.findIndex(o=>o.ok)});
 assert.equal(b.correct,b.total,'a different right answer is not a mistake');assert.equal(s.state.flags.ticket,'buy');
 assert.deepEqual(s.visibleScenes().map(x=>x.id),['station','machine','meet','tram','flat','neighbour','tomorrow']);assert.equal(s.nextScene().id,'machine');
 // repeat explains the word and costs nothing; a wrong answer is explained
 {const r=s.play('station');r.next();let x=r.step;const rep=r.answer(x.options.findIndex(o=>o.repeat));assert.equal(rep.repeat,true);
  while(!(r.step.type==='reply'&&r.step.explain)){const y=r.step;if(y.type==='line')r.next();else r.answer(y.options.findIndex(o=>o.ok))}
  const tk=r.step;assert.match(r.answer(tk.options.findIndex(o=>o.repeat)).explain,/квиток/,'the word is explained');
  const wrong=r.answer(tk.options.findIndex(o=>!o.ok&&!o.repeat));assert.equal(wrong.ok,false);assert.match(wrong.why,/ticket/);
  const right=r.answer(tk.options.findIndex(o=>o.set?.ticket==='buy'));assert.equal(right.ok,true);assert(right.react?.nl,'the character reacts')}
 // the rest of path B, Jan's invitation remembered
 for(const id of ['machine','meet','tram','flat'])assert.equal(play(s,id).correct,play(s,id).total);
 const n=play(s,'neighbour',x=>{const i=x.options.findIndex(o=>o.set?.coffee==='tea');return i>=0?i:x.options.findIndex(o=>o.ok)});assert.equal(n.correct,n.total);
 assert.equal(s.state.flags.coffee,'tea');play(s,'tomorrow');assert.equal(s.nextScene(),null);
 const memory=E.readMemory(st);assert.deepEqual({...memory.met},{annick:true,jan:true},'people met are remembered for later stories');
 assert.equal(memory.flags['first-day.coffee'],'tea');assert.equal(memory.flags['first-day.ticket'],'buy');
 // XP and skills
 const maxB=s.maxXp();assert.equal(s.xp(),maxB);assert(maxB>85,'the extra scene adds XP: '+maxB);
 const sk=s.state.skills;assert(sk.understand[1]>0&&sk.grammar[1]>0&&sk.speaking[1]>0,'three skills counted');
 // say: right words in the wrong order fail on grammar, tiles count only grammar
 {const r=s.play('meet');r.next();const x=r.step;assert.equal(x.type,'say');
  const w=r.answer(['uit oekraine kom ik']);assert.equal(w.ok,false);assert.equal(w.speaking,true);assert.equal(w.grammar,false);assert.match(w.why,/порядок/);
  assert.equal(r.answer({tiles:x.nl}).ok,true,'tiles in the right order');const f=(()=>{while(!r.finished){const y=r.step;if(y.type==='line')r.next();else r.answer(y.options.findIndex(o=>o.ok))}return r.finish()})();
  assert.deepEqual([...f.skills.grammar],[0,1],'a first wrong order counts once');assert.deepEqual([...f.skills.speaking],[1,1]);assert.equal(f.correct,f.total-1)}
 // records, replays and modes
 for(const sc of s.visibleScenes())E.recordXp(st,S.id,sc.id,s.state.best[sc.id]*E.XP_PER_STEP);
 const rec=JSON.parse(mem.get(E.XP_KEY));assert.equal(Object.values(rec).reduce((a,v)=>a+v,0),maxB);assert.equal(E.recordXp(st,S.id,'station',0),rec['first-day:station']);
 for(const m of E.MODES){s.setMode(m);assert.equal(E.createStorySession(S,st).state.mode,m)}assert.deepEqual([...E.MODES],['learn','practice','real']);
 // older saved progress (engine 1) still loads: best per scene and the mode
 {const {st:o}=mk();o.setItem('leren_life_story_v1_first-day',JSON.stringify({mode:'real',best:{station:3,tram:99,ghost:2},missed:['Hallo!']}));
  const old=E.createStorySession(S,o);assert.equal(old.state.mode,'real');assert.equal(old.state.best.station,3);assert.equal(old.state.best.tram,E.gradedSteps(S.scenes.find(x=>x.id==='tram')).length,'capped');
  assert(!('ghost' in old.state.best));assert.deepEqual([...old.state.missed],['Hallo!']);assert.deepEqual({...old.state.flags},{})}
 // blocked storage
 const bad=E.createStorySession(S,{getItem:()=>'{broken',setItem(){throw Error('blocked')}});assert.equal(bad.xp(),0);const r0=bad.play('station');r0.next();assert.equal(r0.answer(99),null);
 console.log(`PASS: LIFE Engine 2.0 — branches (ticket had/buy, ${S.scenes.length} scenes incl. 1 by choice), several right answers with reactions, repeat explains and costs nothing, people and choices remembered, 3 skills (word order checked), 3 help levels, ${maxB} XP on the longer path, old progress loads`);
})().catch(e=>{console.error(e);process.exit(1)});
