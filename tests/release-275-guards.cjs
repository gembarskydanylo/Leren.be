// Release 275 regression guards for the defects of the independent Codex audit of 273 (docs/audits/CODEX-LERENBE-273-AUDIT.md):
// P1-01 a second open tab erased finished lessons, P2-01 the daily plan was lost after more than 12 steps, P2-03 failed
// writes were reported as saved. Node only (vm), synthetic data, no network. P1-02 (Service Worker): tests/sw-install.cjs
// and tests/sw-partial-offline.cjs; P2-02 (80% known words): tests/multitab-browser.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const memory=()=>{const m=new Map();return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
const ctx={};vm.createContext(ctx);for(const f of ['modules/learning-path/core.js','modules/guided/core.js'])vm.runInContext(read(f),ctx);
const P=ctx.LerenLearningPath,G=ctx.LerenGuided;
const ids=n=>Array.from({length:n},(_,i)=>'w'+i);
const course={lessons:[{id:'a',ids:['w0','w1'],chapter:'ch'},{id:'b',ids:['w2','w3'],chapter:'ch'},{id:'c',ids:['w4','w5'],chapter:'ch'}],chapters:[{id:'ch',level:'A1.1'}],cards:new Map(ids(6).map(id=>[id,{id}]))};
const stored=s=>JSON.parse(s.getItem('leren_path_v1'));
// play a whole lesson: answers per phase (true/false per card)
function play(m,id,ok=[true,true]){assert(m.begin(id));for(let p=0;p<3;p++){m.state.session.ids.forEach((w,i)=>assert(m.advance(w,ok[i])));if(p<2)assert(m.nextPhase())}return m.finish()}
const checks=[];const check=(name,fn)=>checks.push([name,fn]);

check('P1-01 Codex scenario: B opened before A finished, B starts a lesson → A’s lesson stays finished',()=>{
 const s=memory(),a=P.create(course,s),b=P.create(course,s);play(a,'a');b.begin('b');
 assert.equal(stored(s).completed.a,2);assert.equal(stored(s).session.lesson,'b','B owns its open lesson');
 assert.equal(P.create(course,s).state.completed.a,2,'after reload');
});
check('P1-01 three tabs, each finishes a lesson, every stale tab saves last',()=>{
 const s=memory(),t=[P.create(course,s),P.create(course,s),P.create(course,s)];
 play(t[0],'a');play(t[1],'b');play(t[2],'c');t[0].home();t[1].home();
 assert.deepEqual({...stored(s).completed},{a:2,b:2,c:2});
});
check('P1-01 best result is kept across tabs (no lowering), a better result elsewhere wins',()=>{
 const s=memory(),a=P.create(course,s),b=P.create(course,s);play(a,'a',[true,false]);play(b,'a',[true,true]);a.home();
 assert.equal(stored(s).completed.a,2);
 const c=P.create(course,s);play(c,'a',[false,false]);assert.equal(stored(s).completed.a,2,'a worse retry never lowers the best');
});
check('P1-01 mistakes: fixed in one tab stays fixed, a new one in another tab is kept',()=>{
 const s=memory(),a=P.create(course,s);play(a,'a',[false,true]);assert.deepEqual([...stored(s).mistakes],['w0']);
 const b=P.create(course,s),c=P.create(course,s);
 assert(b.beginReview());b.state.session.ids.forEach(w=>b.advance(w,true));b.finish();assert.deepEqual([...stored(s).mistakes],[],'fixed in B');
 play(c,'b',[true,false]); // C still had w0 from its start; it adds w3
 assert.deepEqual([...stored(s).mistakes],['w3'],'C keeps its new mistake and does not bring back the fixed one');
});
check('P1-01 sync(): an open tab takes in a lesson finished elsewhere without writing',()=>{
 const s=memory(),a=P.create(course,s),b=P.create(course,s);play(a,'a');const before=s.getItem('leren_path_v1');
 assert.equal(b.sync(),true);assert.equal(b.state.completed.a,2);assert.equal(b.recommended().id,'b','next lesson moves on');
 assert.equal(s.getItem('leren_path_v1'),before,'sync never writes');assert.equal(b.sync(),false,'nothing new');
});
check('P1-01 a lesson paused in one tab survives an idle tab’s save; the idle tab offers to resume it',()=>{
 const s=memory(),a=P.create(course,s),b=P.create(course,s);a.begin('b');a.advance('w2',true);
 b.save();assert.equal(stored(s).session.lesson,'b');assert.equal(stored(s).session.index,1);
 assert.equal(P.create(course,s).recommended().id,'b','after reload the paused lesson is offered');
 const c=P.create(course,s);c.home();assert.equal(stored(s).session,null,'a tab that closes the lesson itself does close it');
});
check('P1-01 a tab playing a lesson keeps it when another tab starts one (storage event while in the lesson)',()=>{
 const s=memory(),a=P.create(course,s),b=P.create(course,s);b.begin('c');b.advance('w4',true);a.sync();a.begin('a');
 b.sync(false);assert.equal(b.state.session.lesson,'c','not swapped under the running lesson');b.advance('w5',true);
 assert.equal(stored(s).session.lesson,'c','the tab that plays writes its own lesson');assert.equal(stored(s).session.index,2);
});
check('P1-01 storage that cannot be read: saves still work, no crash',()=>{
 const s=memory();let broken=false;const st={getItem:k=>{if(broken)throw Error('denied');return s.getItem(k)},setItem:s.setItem};
 const a=P.create(course,st);broken=true;play(a,'a');broken=false;assert.equal(stored(s).completed.a,2);
});
check('P1-01 other courses (EN/FR keys) are merged under their own key',()=>{
 const s=memory(),a=P.create(course,s,{key:'leren_path_v1@en'}),b=P.create(course,s,{key:'leren_path_v1@en'});play(a,'a');b.begin('c');
 assert.equal(JSON.parse(s.getItem('leren_path_v1@en')).completed.a,2);assert.equal(s.getItem('leren_path_v1'),null,'Dutch key untouched');
});

const now=new Date('2026-11-26T12:00:00Z');
function finishAll(s,st){for(const step of st.steps)if(!step.done)G.complete(s,st,step.id,{correct:4,total:5,gain:5})}
check('P2-01 «Continue learning» many times: the plan survives every reload, totals of the day are kept',()=>{
 const s=memory(),steps=G.plan({date:G.day(now),goal:30,pace:'intensive',practice:true});assert.equal(steps.length,5);
 let st=G.start(s,{steps,course:'A1.1',now});finishAll(s,st);
 for(let round=2;round<=30;round++){st=G.today(s,now);assert(st,'plan readable before round '+round);st=G.extend(s,st,steps);assert(st.steps.length<=G.MAX_STEPS);
  const again=G.today(s,now);assert(again,'plan readable after extend, round '+round);assert.equal(again.steps.length,st.steps.length);finishAll(s,st)}
 const sum=G.summary(G.today(s,now));assert.equal(sum.steps,150);assert.equal(sum.correct,600);assert.equal(sum.gain,750);
 const ids=G.today(s,now).steps.map(x=>x.id);assert.equal(new Set(ids).size,ids.length,'step ids unique');
});
check('P2-01 a step is paid once, also after compaction (no double counting)',()=>{
 const s=memory(),steps=G.plan({date:G.day(now),goal:30,pace:'intensive',practice:true});let st=G.start(s,{steps,course:'A1.1',now});finishAll(s,st);
 for(let i=0;i<12;i++){st=G.extend(s,G.today(s,now),steps);finishAll(s,st)}
 const before=G.summary(G.today(s,now));const last=G.today(s,now).steps.at(-1);assert.equal(G.complete(s,G.today(s,now),last.id,{correct:5,total:5,gain:25}),false);
 assert.deepEqual(G.summary(G.today(s,now)),before);
});
check('P2-01 a stored plan longer than the limit is still refused (corrupt data)',()=>{
 const s=memory();s.setItem(G.TODAY_KEY,JSON.stringify({v:1,date:G.day(now),course:'A1.1',steps:Array.from({length:G.MAX_STEPS+1},(_,i)=>({id:'x'+i,kind:'lesson',min:6,done:false})),paid:[],badges:[],round:1}));
 assert.equal(G.today(s,now),null);
});
check('P2-03 a write that fails is reported (saveOk=false) and the plan stays usable on this page',()=>{
 const s={getItem:()=>null,setItem:()=>{const e=Error('quota');e.name='QuotaExceededError';throw e},removeItem(){}};
 const st=G.start(s,{steps:G.plan({date:G.day(now),goal:10}),course:'A1.1',now});assert.equal(G.saveOk,false);
 assert.equal(G.today(s,now),st,'in-memory plan on this page');G.complete(s,st,st.steps[0].id,{correct:1,total:1});assert.equal(G.today(s,now).steps[0].done,true);
 assert.equal(G.saveProfile(s,{pace:'calm'}),null,'profile save reports failure');assert.equal(G.setName(s,'Olena'),'','name save reports failure');
 const ok=memory();G.start(ok,{steps:G.plan({date:G.day(now),goal:10}),course:'A1.1',now});assert.equal(G.saveOk,true,'a later successful write clears it');
 assert.equal(G.today(ok,now).course,'A1.1');
});
check('P2-03 the screens use the result: profile shows «not saved», the route shows a warning in Focus',()=>{
 const today=read('modules/today/ui.js'),ui=read('modules/learning-path/ui.js'),app=read('app.js');
 assert.match(today,/status\.textContent=ok\?t\.prof\.saved:t\.prof\.failed/);for(const l of ['Не вдалося зберегти','Could not save','Échec de l’enregistrement','تعذّر الحفظ'])assert(today.includes(l),l);
 assert.match(app,/return named&&prof&&goal\}/);assert.match(ui,/function saveWarning\(\)\{if\(model\.persistent&&G\?\.saveOk!==false\)return/);
 assert.match(ui,/root\.appendChild\(focusBar\(\)\);saveWarning\(\);return/);
});
(async()=>{let failed=0;for(const [name,fn] of checks){try{await fn();console.log('  ok '+name)}catch(e){failed++;console.error('FAIL '+name+'\n',e)}}
 if(failed){process.exitCode=1;return}
 console.log('PASS: release 275 guards — '+checks.length+' checks (two/three tabs, best result, mistakes, sync, paused lesson, EN key, long daily plan, paid once, refused writes)');
})();
