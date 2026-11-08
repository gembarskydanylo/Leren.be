// Multilingual engine, step 1 (nothing visible yet): the course registry, per-language progress keys, and a learning-path
// core that takes a progress key and a card text field. The Dutch course and the progress of current learners must stay
// exactly as before. Run: node tests/multilang-engine.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const mem=(init={})=>{const m=new Map(Object.entries(init));return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
const load=(...files)=>{const c=vm.createContext({console});vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'))+'\nglobalThis.fixture={DATA,LerenCurriculum};',c);for(const f of files)vm.runInContext(typeof f==='string'&&f.endsWith('.js')&&!f.includes('\n')?read(f):f,c);return c};

// 1. Registry
{const c=load('modules/courses/registry.js'),R=c.LerenCourses;
 const s=mem();assert.equal(R.current(s),'nl','Dutch by default');
 assert.deepEqual([...R.available(s).map(x=>x.id)],['nl'],'English and French are not offered yet');
 assert.equal(R.choose(s,'en'),false,'cannot pick a planned course');s.setItem('leren_learn_lang','en');assert.equal(R.current(s),'nl','a planned course falls back to Dutch');
 s.setItem('leren_learn_lang','xx');assert.equal(R.current(s),'nl','unknown falls back to Dutch');
 const p=mem({leren_multilang:'1'});assert.deepEqual([...R.available(p).map(x=>x.id)],['nl','en','fr','de'],'preview shows the planned courses');assert.equal(R.choose(p,'fr'),true);assert.equal(R.current(p),'fr');
 assert.equal(R.key('leren_path_v1','nl'),'leren_path_v1','Dutch keeps its key');assert.equal(R.key('leren_path_v1'),'leren_path_v1');
 assert.equal(R.key('leren_path_v1','en'),'leren_path_v1@en');assert.equal(R.key('poly_toetsbest','fr'),'poly_toetsbest@fr');
 for(const shared of ['poly_streak','leren_xp_v2','leren_minutes_v2','leren_goal_min','poly_score'])assert.equal(R.key(shared,'en'),shared,shared+' is shared by all languages');
 assert.equal(R.key('leren_path_v1','de'),'leren_path_v1@de','German has its own keys');assert.throws(()=>R.key('leren_path_v1','es'));assert.throws(()=>R.key('evil','en'));
 assert.equal(R.name('fr','uk'),'Французька');assert.equal(R.name('de','uk'),'Німецька');assert.equal(R.COURSES.de.status,'planned');assert.equal(R.VOICE.de,'de-DE');assert.equal(R.VOICE.en,'en-GB');assert.deepEqual([...R.COURSES.en.levels],['1.1','1.2']);
 // Every per-course key the app really uses exists in the code (catches typos in the list).
 const app=read('app.js')+read('modules/learning-path/core.js')+read('modules/course-player/ui.js');for(const k of R.PER_COURSE)assert(app.includes(k),'per-course key used by the app: '+k)}

// 2. The Dutch route is built by the same rules as before and kept in the same key.
{const c=load('modules/courses/registry.js','modules/learning-path/core.js'),core=c.LerenLearningPath,{DATA,LerenCurriculum}=c.fixture;
 const def=core.catalog(DATA,LerenCurriculum),nl=core.catalog(DATA,LerenCurriculum,{text:'nl'});
 assert.deepEqual(JSON.parse(JSON.stringify(def.lessons)),JSON.parse(JSON.stringify(nl.lessons)),'default = Dutch');
 const a2=new Set(LerenCurriculum.a2Ids||[]);
 def.chapters.forEach((ch,i)=>assert.equal(ch.level,a2.has(ch.id)?'A2':i<12?'A1.1':'A1.2','Dutch level rule unchanged: '+ch.id));
 const expected=def.chapters.flatMap(ch=>ch.tabs.flatMap(t=>(DATA[t]?.items||[]).filter(w=>w.id&&w.nl&&w.uk).map(w=>w.id)));
 assert.deepEqual([...def.lessons.flatMap(l=>l.ids)],[...expected],'same cards, same order');
 assert(def.lessons.length>100,'the Dutch course is all there ('+def.lessons.length+' lessons)');
 // A current learner: their saved route is read from leren_path_v1 and written back there; nothing else appears.
 const s=mem({leren_path_v1:JSON.stringify({version:1,started:true,entry:def.lessons[0].id,completed:{[def.lessons[0].id]:5},mistakes:[],session:null,placement:null})});
 const m=core.create(def,s);assert.equal(m.state.completed[def.lessons[0].id],5,'existing progress read');m.begin(def.lessons[1].id);
 assert.deepEqual([...s.m.keys()],['leren_path_v1'],'Dutch writes only its old key');assert.equal(JSON.parse(s.m.get('leren_path_v1')).completed[def.lessons[0].id],5,'progress kept');

 // 3. Another language: its own key, its own text field, explicit levels; the Dutch route is untouched.
 const enData={e_hi:{items:[{id:'en:hello',en:'hello',uk:'привіт'},{id:'en:bye',en:'goodbye',uk:'до побачення'},{id:'en:nl_only',nl:'hallo',uk:'привіт'}]}};
 const enCur={chapters:[['greet','Greetings',['e_hi'],'1.1']],advanced:[]};
 const en=core.catalog(enData,enCur,{text:'en'});assert.deepEqual([...en.lessons[0].ids],['en:hello','en:bye'],'cards by the English text field');assert.equal(en.chapters[0].level,'1.1','level from the curriculum');
 const me=core.create(en,s,{key:c.LerenCourses.key('leren_path_v1','en')});me.begin(en.lessons[0].id);
 assert(s.m.has('leren_path_v1@en'),'English route in its own key');assert.equal(JSON.parse(s.m.get('leren_path_v1')).completed[def.lessons[0].id],5,'Dutch route untouched');}

// 4. Sync and backups treat a language-suffixed key like its base key.
{const c=vm.createContext({console,crypto:globalThis.crypto,TextEncoder});vm.runInContext(read('modules/sync/merge.js'),c);const M=c.LerenMerge;
 const route=done=>JSON.stringify({version:1,completed:done,mistakes:[]});
 const a=route({x:3}),b=route({y:4});
 assert.equal(M.mergeKey('leren_path_v1@en',undefined,a,b),M.mergeKey('leren_path_v1',undefined,a,b),'same merge rule for @en');
 const merged=JSON.parse(M.mergeKey('leren_path_v1@fr',undefined,a,b));assert.deepEqual([...Object.keys(merged.completed).sort()],['x','y'],'lessons from both devices kept');
 (async()=>{
  const bad=await M.readBackup(JSON.stringify(await M.buildBackup({'leren_path_v1@en':'{"completed":"oops"}'})),k=>/^(poly_|leren_)/.test(k));
  assert.equal(bad.ok,false,'a broken English route makes the backup invalid, like a broken Dutch one');
  const good=await M.readBackup(JSON.stringify(await M.buildBackup({'leren_path_v1@en':route({x:2}),leren_path_v1:route({y:1})})),k=>/^(poly_|leren_)/.test(k));
  assert.equal(good.ok,true,JSON.stringify(good));
  console.log('PASS: multilingual engine step 1 — registry (Dutch default, planned courses hidden), Dutch route and storage unchanged, per-language keys, sync/backup rules for @en/@fr');
 })().catch(e=>{console.error(e);process.exit(1)});
}
