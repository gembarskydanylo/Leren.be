const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const words=JSON.parse(fs.readFileSync('modules/diphthongs/words.json','utf8'));
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('modules/diphthongs/lesson-core.js','utf8'),ctx);
const core=ctx.LerenDiphthongsLesson;
function storage(initial={},blocked=false){const data={...initial};return {data,getItem(k){if(blocked)throw Error('blocked');return data[k]??null},setItem(k,v){if(blocked)throw Error('blocked');data[k]=v}}}
const make=(s=storage())=>core.create(words,s,()=>.3);
for(const w of words)for(const lang of ['uk','en','fr','ar'])assert(w.translations[lang]);
const s=storage({'lerenbe.diphthongs.best.v1':'100'}),m=make(s);assert.equal(m.legacyBest,100);
for(const sound of ['ui','ij/ei','ou/au']){m.sound(sound);m.learn();m.learn()}
assert.equal(m.state.learned.length,3);assert.equal(m.steps()[0],true);
for(const kind of ['battle','dict','quiz']){
 m.start(kind);assert.equal(m.round(kind).keys.length,m.limits[kind]);assert.equal(new Set(m.round(kind).keys).size,m.limits[kind]);
 if(kind==='quiz'){
  const deck=m.round(kind).keys.map(w=>m.word(w));assert(!deck.some(w=>['ooi','eeuw'].includes(w.pattern)));
  for(const g of m.groups)assert.equal(deck.filter(w=>m.group(w)===g).length,2);
  assert.equal(deck.filter(w=>w.pattern==='trema').length,2);
 }
 const q=m.current(kind);assert(m.answer(kind,q.answer,q.key));assert.equal(m.answer(kind,q.answer,q.key),false,'Repeated answers must be ignored');
 const reopened=make(s);assert.equal(reopened.current(kind).key,q.key);assert.equal(reopened.round(kind).answers[0],q.answer);
 assert(m.next(kind,q.key));assert.equal(m.next(kind,q.key),false,'A stale Next callback must not skip a question');
 while(!m.done(kind)){const q=m.current(kind);m.answer(kind,q.answer,q.key);m.next(kind,q.key)}
 assert.equal(m.count(kind),m.limits[kind]);assert.equal(m.state.best[kind],m.limits[kind]);assert.equal(m.current(kind),null);
 assert.equal(m.next(kind,'invalid'),false);assert.equal(m.answer(kind,'yes','invalid'),false);
}
assert(m.steps().every(Boolean));assert.equal(make(s).steps().every(Boolean),true);assert.equal(s.getItem('lerenbe.diphthongs.best.v1'),'100');
m.start('quiz');while(!m.done('quiz')){const q=m.current('quiz');m.answer('quiz',q.answer==='yes'?'no':'yes',q.key);m.next('quiz',q.key)}
assert.equal(m.count('quiz'),0);assert.equal(m.state.best.quiz,10);assert.equal(m.state.mistakes.quiz.length,10);
assert(m.start('quiz',true));assert.equal(m.round('quiz').mode,'review');while(!m.done('quiz')){const q=m.current('quiz');m.answer('quiz',q.answer,q.key);m.next('quiz',q.key)}
assert.equal(m.state.mistakes.quiz.length,0);assert.equal(m.state.best.quiz,10);assert.equal(m.start('quiz',true),false);
for(const raw of ['null','[]','true','"bad"','{','{"version":2,"learned":[],"best":{"quiz":999},"mistakes":{"quiz":["mooi","missing"]},"rounds":{"quiz":{"keys":["mooi"],"answers":[],"index":9,"mode":"full"}}}']){
 const x=make(storage({[core.KEY]:raw}));assert.equal(x.state.best.quiz,0);assert.equal(x.round('quiz'),null);assert.equal(x.state.mistakes.quiz.length,0);assert.equal(x.persistent,true);
}
const blocked=make(storage({},true));blocked.start('battle');assert.equal(blocked.persistent,false);assert(blocked.current('battle'));
// Execute the host's real XP function, independently from the lesson state.
const html=fs.readFileSync('index.html','utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start=source.indexOf('function recordDiphthongsResult('),end=source.indexOf('\nfunction renderDiphthongsProgress',start),ledger={};
function host(){const h=vm.createContext({xp:0,lsGet:k=>ledger[k],lsSet:(k,v)=>ledger[k]=v,addXP(n){h.xp+=n},saveStore(){},updateStats(){}});vm.runInContext('const diphthongsSessionBest={};'+source.slice(start,end),h);return h}
let h=host();assert.equal(h.recordDiphthongsResult('battle',3,6),15);assert.equal(h.recordDiphthongsResult('battle',3,6),0);assert.equal(h.recordDiphthongsResult('battle',6,6),15);
h=host();assert.equal(h.recordDiphthongsResult('battle',6,6),0,'Reload cannot award the same best twice');
for(const args of [['bad',6,6],['quiz',100,10],['quiz',3,3],['dict',NaN,8],['quiz',-1,10]])assert.equal(h.recordDiphthongsResult(...args),0);
assert.equal(h.recordDiphthongsResult('dict',8,8),40);assert.equal(h.recordDiphthongsResult('quiz',10,10),50);assert.equal(h.xp,90);
// Exact versioned dependencies must install offline together, including the model.
const files=JSON.parse(fs.readFileSync('sw.js','utf8').match(/const APP_FILES = (\[[^;]+\]);/)[1]);
for(const file of ['lesson-core.js','widget.js','widget.html','widget.css','words.json'])assert(files.includes('./modules/diphthongs/'+file+'?v=87'));
assert(html.includes('lesson-core.js?v=87'));assert(html.indexOf('lesson-core.js?v=87')<html.indexOf('widget.js?v=87'));
console.log('PASS: balanced full rounds, resume after an answered question, stale-click guards, all three milestones, mistake-only review, legacy best, corrupt/blocked storage, personal-best XP and exact offline dependencies');
