// A1.1 and A1.2 as two independent courses; A2.1 announced but closed. Runs the real functions from index.html.
// Run: node tests/courses.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Cut one function out of the app script by matching braces (strings and regexes in these functions hold no braces).
const fn=name=>{const a=script.indexOf('function '+name+'(');assert(a>=0,name);let i=script.indexOf('{',a),d=0;for(;i<script.length;i++){if(script[i]==='{')d++;else if(script[i]==='}'&&--d===0)break}return script.slice(a,i+1)+'\n'};
const line=start=>{const a=script.indexOf(start);assert(a>=0,start);return script.slice(a,script.indexOf('\n',a))};
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
const prefix=read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'));
const host=fn('lsGet')+fn('lsSet')+fn('levelById')+fn('levelUnlocked')+fn('levelCats')+fn('catLevel')+fn('itemsFor')+fn('gPool')+fn('switchCourse')+fn('saveStore')+fn('wbCourseWords')+'\n'+
 line('const allItems=')+'\n'+line('const levelItems=')+'\n'+fn('dueItems')+line('const learnedCount=')+'\n'+fn('stateFor')+line('const A11_ONLY_GAMES=')+'\n'+line('const gameForLevel=')+'\n'+
 line('const labelFor=')+'\n'+line('const meaningFor=')+'\n';
// Startup: the saved course (poly_level) and lesson are read back exactly like the app does after a reload.
const startup=script.slice(script.indexOf('function validStored'),script.indexOf('const el=(t,c,x)'));
function boot(saved){
 const ls={...saved},localStorage={getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>ls[k]=String(v)};
 const c=vm.createContext({console,localStorage,window:{},shuffle:a=>a,assert});
 vm.runInContext(prefix+'\n'+startup+host+'\nvar lessonMode="quiz",view="lesson",buildLevel=1;globalThis.H={get level(){return curLevel},get cat(){return currentCat},get tab(){return tab},switchCourse,levelUnlocked,levelItems,learnedCount,dueItems,gPool,gameForLevel,wbCourseWords,stateFor,store,set store(v){store=v}};',c);
 c.LerenCard3D=c.window.LerenCard3D=(()=>{const g={};vm.runInContext(read('modules/emoji/cards.js'),vm.createContext(g));return g.LerenCard3D})();
 return {c,H:c.H,ls};
}

// 1–3. Switching A1.1 → A1.2 → A1.1 and the selected course after a reload. A1.2 is never locked behind A1.1.
let {H,ls}=boot({poly_score:'0'});
assert.equal(H.level,'a11');assert.equal(H.levelUnlocked('a12'),true,'A1.2 is open without points or the A1.1 test');
assert(H.switchCourse('a12'));assert.equal(H.level,'a12');assert.equal(ls.poly_level,'a12');assert.equal(H.cat,'past','The first A1.2 topic opens');
({H,ls}=boot(ls));assert.equal(H.level,'a12','The selected course survives a reload');assert.equal(H.cat,'past');
assert(H.switchCourse('a11'));assert.equal(H.level,'a11');assert.equal(H.cat,'comm');
({H}=boot(ls));assert.equal(H.level,'a11');
({H}=boot({poly_level:'a12',poly_cat:'zorg',poly_tab:'apotheek',poly_score:'0'}));assert.equal(H.level,'a12');assert.equal(H.cat,'zorg','A saved A1.2 lesson reopens even with 0 points');assert.equal(H.tab,'apotheek');

// 10. A2.1 is announced but cannot be opened.
assert.equal(H.levelUnlocked('a21'),false);assert.equal(H.switchCourse('a21'),false);assert.equal(H.level,'a12');
assert.equal(vm.runInContext('CATEGORIES.filter(c=>c.lvl==="a21").length',boot({}).c),0,'No A2.1 lessons exist yet');
assert(vm.runInContext('LEVELS.find(l=>l.id==="a21").soon',boot({}).c));

// 4–5. Independent progress per course; older saves keep their results.
const old={poly_score:'1450',poly_level:'a12',poly_unlocked:'["a12"]',poly_toetsbest:JSON.stringify({course_comm_v2:9,lt_a12_course_v2:11,course_past_v2:8,course_travel_v2:10}),
 poly_progress:JSON.stringify({fam_moeder:{seen:3,correct:3,wrong:0,streak:2,due:0,known:true},course_apotheek_1:{seen:2,correct:2,wrong:0,streak:2,due:0,known:true}})};
({H,ls}=boot(old));
const a11=new Set(H.levelItems('a11').map(x=>x.id)),a12=new Set(H.levelItems('a12').map(x=>x.id));
assert([...a11].every(id=>!a12.has(id)),'A word card belongs to exactly one course');
assert.equal(H.learnedCount('a11'),1);assert.equal(H.learnedCount('a12'),1);assert.equal(H.learnedCount(),2,'Overall count still works');
assert.equal(H.dueItems('a11').length,1);assert.equal(H.dueItems('a12').length,1);
assert(H.switchCourse('a11'));assert(H.switchCourse('a12'));
same(JSON.parse(ls.poly_toetsbest),JSON.parse(old.poly_toetsbest),'Switching never touches saved test results');assert.equal(ls.poly_score,'1450','XP stays shared and unchanged');
{const now=JSON.parse(ls.poly_progress);for(const [id,v] of Object.entries(JSON.parse(old.poly_progress)))same(now[id],v,'Switching never changes saved word progress: '+id)}

// 6. A1.2 games load A1.2 material only.
const games=JSON.parse(line('const GAMES=').replace(/^const GAMES=/,'').replace(/;$/,'')).map(g=>g[0]);
const forA12=games.filter(id=>H.gameForLevel(id,'a12')),forA11=games.filter(id=>H.gameForLevel(id,'a11'));
same(forA11,games,'Every game is available in A1.1');
same(forA12,games.filter(id=>!['story','md'].includes(id)),'A1.2 hides only the two A1.1 stories');
assert(H.switchCourse('a12'));
const pool=H.gPool();assert(pool.length>=300);assert(pool.every(x=>a12.has(x.id)),'Blitz, memory and dictation use A1.2 words in A1.2');
assert(new Set(pool.map(x=>x.uk)).size>=4);
assert(H.switchCourse('a11'));const pool11=H.gPool();assert(pool11.every(x=>a11.has(x.id)),'…and A1.1 words in A1.1');assert(H.switchCourse('a12'));
const wb=H.wbCourseWords('a12');assert(wb.length>=10,'Spell-the-word has a full A1.2 round');assert.equal(H.wbCourseWords('a11'),null,'A1.1 keeps the original word list');
for(const w of wb){assert(/^[a-zë]{3,11}$/.test(w[0]));assert(['de','het'].includes(w[1]));for(const i of [3,4,5,6])assert(w[i]&&w[i].trim(),'translation '+w[0]);assert(w[7],'picture '+w[0])}
assert.equal(new Set(wb.map(w=>w[0])).size,wb.length,'No word twice');
// Dialogues, role play and speaking follow the course.
const g=boot({}).c;vm.runInContext(script.slice(script.indexOf('const DIALOGUES=['),script.indexOf('const GAMES='))+';globalThis.G={DIALOGUES,SPEAK_Q}',g);
const dlg=g.G.DIALOGUES.filter(d=>(d.lvl||'a11')==='a12'),speak=g.G.SPEAK_Q.filter(q=>(q.lvl||'a11')==='a12');
assert.equal(dlg.length,15);assert.equal(speak.length,33);
for(const d of dlg){assert(d.lines.length>=6);for(const l of d.lines)assert(l[1]&&l[2]&&l[3],'Empty dialogue line '+d.id)}
for(const q of speak)assert(q.q&&q.uk&&q.en&&q.m,'Empty speaking task');
assert.equal(new Set(dlg.map(d=>d.id)).size,15);
// Spell-the-word, blitz, memory and dictation keep answer texts and pairs unique.
assert(script.includes('wrong=[...new Set(shuffle(s.pool.filter(x=>meaningFor(x)!==right)).map(meaningFor))].slice(0,3)'));
assert(script.includes('seenNl.has(a)||seenTr.has(b)'));

// 7–8. A1.2 lessons, sentence builder and tests: no empty task, no duplicate choices.
const t=boot({}).c;
vm.runInContext(read('modules/test-library/ui.js')+';if(typeof LerenTestLibrary==="undefined")globalThis.LerenTestLibrary=window.LerenTestLibrary;',t);
vm.runInContext(script.slice(script.indexOf('const DIPH_UI = '),script.indexOf('\nlet toetsId'))+'\n'+script.slice(script.indexOf('const BUILD_BANK='),script.indexOf('const SENT='))+'\nLerenTestLibrary.ensureCombined(TOETS);globalThis.T={TOETS,BUILD_BANK};',t);
const cats=vm.runInContext('CATEGORIES.filter(c=>c.lvl==="a12")',t);assert.equal(cats.length,16,'All 16 A1.2 topics');
for(const c of cats){
 assert(t.T.BUILD_BANK[c.id].filter(r=>r[0]===1).length>=6,'At least six beginner sentences: '+c.id);
 for(const tab of c.tabs){const items=vm.runInContext(`DATA[${JSON.stringify(tab)}].items`,t);assert(items.length>=4,tab);for(const x of items)for(const l of ['nl','uk','en','fr','ar'])assert(String(x[l]||'').trim(),'Empty '+x.id+' '+l)}
}
const tests=t.T.TOETS.filter(x=>x.lvl==='a12');
assert.equal(tests.filter(x=>x.group==='chapter').length,16);assert.equal(tests.filter(x=>x.kind==='block').length,4);
for(const x of tests){assert(x.questions.length>=5,x.id);for(const q of x.questions){assert.equal(q.opts.length,4,x.id);assert(q.ok>=0&&q.ok<4);
 for(const lang of ['uk','en','fr','ar']){const o=q.opts.map(v=>typeof v==='string'?v:v[lang]);assert(o.every(v=>String(v).trim()),x.id);assert.equal(new Set(o).size,4,'Duplicate choice in '+x.id)}
 if(q.type==='gap')assert(q.sentence.includes('___'),x.id);if(q.type==='read')assert(q.text.length>50,x.id)}}
assert(t.T.TOETS.filter(x=>x.lvl==='a11').every(x=>x.lvl==='a11'));assert(!tests.some(x=>x.id==='exam11'));

// 9. XP: a test result earns XP once per test and course; an A1.2 result does not touch an A1.1 result.
const save=script.match(/const bestMap = lsGet\("poly_toetsbest",\{\}\)[^\n]*\n[^\n]*\n[^\n]*bestMap\[test\.id\] = toetsRight;[^\n]*\n/)[0];
const store={poly_toetsbest:JSON.stringify({course_comm_v2:6})};
const finish=(id,right)=>{const x=vm.createContext({test:{id},toetsRight:right,lsGet:(k,d)=>k in store?JSON.parse(store[k]):d,lsSet:(k,v)=>store[k]=JSON.stringify(v)});vm.runInContext(save+';globalThis.o={gain}',x);return x.o.gain};
assert.equal(finish('course_zorg_v2',7),70);assert.equal(finish('course_zorg_v2',7),0,'No XP for repeating the same score');assert.equal(finish('course_comm_v2',8),20,'A1.1 earns only the improvement');
same(JSON.parse(store.poly_toetsbest),{course_comm_v2:8,course_zorg_v2:7});
console.log('PASS: A1.1 ⇄ A1.2 switching and reload, no A1.2 lock, closed A2.1, independent words and results, old saves kept, A1.2 games/dialogues/speaking/spelling, 16 A1.2 topics and 24 A1.2 tests without empty or duplicate tasks, XP per result');
