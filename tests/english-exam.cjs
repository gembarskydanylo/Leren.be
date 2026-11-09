// English 1.1 final exam content and answer checking (modules/courses/en-exam.js, modules/course-player/exam.js copy).
// Run: node tests/english-exam.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),c=vm.createContext({console});
vm.runInContext(read('modules/courses/en-exam.js'),c);vm.runInContext(read('modules/course-player/exam.js'),c);
const E=c.LerenCourseExams.en11,UI=c.LerenCourseExamUI;
assert.equal(E.lang,'en');assert.equal(E.level,'1.1');assert.equal(E.passPct,70);
const reading=E.reading.flatMap(t=>[...t.items]);
assert.equal(E.reading.length,3,'three reading texts');assert.equal(reading.length,9);assert.equal(E.listening.length,8);assert.equal(E.writing.length,8);assert.equal(E.speaking.length,5);
const scored=[...reading,...E.listening,...E.writing],ids=scored.map(x=>x.id).concat(E.speaking.map(x=>x.id));assert.equal(new Set(ids).size,ids.length,'unique ids');
for(const it of scored){for(const l of ['uk','en','fr','ar'])assert(it.why?.[l]?.length>10,it.id+': explanation in '+l);
 if(it.options){assert.equal(it.options.length,3,it.id);assert(Number.isInteger(it.answer)&&it.options[it.answer],it.id+': answer');assert.equal(new Set(it.options).size,3,it.id+': distinct options')}}
for(const it of E.listening)assert(it.say&&/[a-z]/i.test(it.say),it.id+': text for the voice');
for(const it of E.speaking)assert(it.say&&it.model,it.id);
// Writing checker
const W=Object.fromEntries(E.writing.map(w=>[w.id,w])),ok=(id,a)=>E.check(W[id],a);
for(const w of E.writing.filter(w=>w.kind==='order')){assert(ok(w.id,w.answer),w.id+' model');assert(ok(w.id,w.tiles.join(' ')),w.id+' tiles in order');assert(!ok(w.id,[...w.tiles].reverse().join(' ')),w.id+' wrong order refused')}
assert(ok('w4',"I'd like a coffee please"),'straight apostrophe, no comma');assert(ok('w4','I would like a coffee, please.'),'contraction written out');
for(const a of ['My name is Olena.','my name is Danylo','I’m Taras','I am Anna Kovalenko'])assert(ok('w5',a),'w5 ok: '+a);
for(const a of ['Olena','My name','I like coffee',''])assert(!ok('w5',a),'w5 refused: '+a);
for(const a of ['am','AM',"'m",'I am from Ukraine.',"I'm from Ukraine"])assert(ok('w6',a),'w6 ok: '+a);for(const a of ['is','are','I is from Ukraine'])assert(!ok('w6',a),'w6 refused: '+a);
for(const a of ['I have two children.',"I've got two children",'i have got two children'])assert(ok('w7',a),'w7 ok: '+a);for(const a of ['I have two childs','I has two children','I have two child'])assert(!ok('w7',a),'w7 refused: '+a);
for(const a of ['How much is it?','how much is this','How much does it cost?'])assert(ok('w8',a),'w8 ok: '+a);for(const a of ['How many is it?','How much are they?'])assert(!ok('w8',a),'w8 refused: '+a);
// Never presented as an official certificate.
for(const l of ['uk','en','fr','ar']){assert.match(UI.COPY[l].note,/CEFR|CECR/);assert.match(UI.COPY[l].note,/Cambridge/);assert(/(не|not|pas|ليس)/.test(UI.COPY[l].note),l+': says it is not official')}
assert(!/certif(icate|icat) (of|de) (completion|réussite)|офіційний сертифікат lerenbe/i.test(read('modules/course-player/exam.js')),'no claim of an official certificate');
console.log('PASS: English 1.1 exam — 9 reading + 8 listening + 8 writing (scored) + 5 speaking (practice), explanations in 4 languages, tolerant writing check, not an official certificate');
// English 1.2 exam (modules/courses/en-exam12.js): same structure, A2 checks.
{const c2=vm.createContext({console});vm.runInContext(read('modules/courses/en-exam.js'),c2);vm.runInContext(read('modules/courses/en-exam12.js'),c2);
 const E2=c2.LerenCourseExams.en12;assert(c2.LerenCourseExams.en11,'1.1 exam still there');assert.equal(E2.lang,'en');assert.equal(E2.level,'1.2');assert.equal(E2.passPct,70);
 const rd=E2.reading.flatMap(t=>[...t.items]);assert.equal(rd.length,9);assert.equal(E2.listening.length,8);assert.equal(E2.writing.length,8);assert.equal(E2.speaking.length,5);
 const sc=[...rd,...E2.listening,...E2.writing],ids2=sc.map(x=>x.id).concat(E2.speaking.map(x=>x.id));assert.equal(new Set(ids2).size,ids2.length);
 for(const it of sc){for(const l of ['uk','en','fr','ar'])assert(it.why?.[l]?.length>10,'1.2 '+it.id+': explanation in '+l);
  if(it.options){assert.equal(it.options.length,3);assert.equal(new Set(it.options).size,3);assert(it.options[it.answer])}}
 const W2=Object.fromEntries(E2.writing.map(w=>[w.id,w])),ok2=(id,a)=>E2.check(W2[id],a);
 for(const w of E2.writing.filter(w=>w.kind==='order')){assert(ok2(w.id,w.answer));assert(ok2(w.id,w.tiles.join(' ')));assert(!ok2(w.id,[...w.tiles].reverse().join(' ')))}
 assert(ok2('w3',"I'm going to visit my parents"));assert(ok2('w3','I am going to visit my parents.'));
 for(const a of ['was','WAS','Yesterday I was at home.'])assert(ok2('w5',a),'w5 ok '+a);for(const a of ['were','is','am'])assert(!ok2('w5',a),'w5 refused '+a);
 for(const a of ['bought','She bought a new phone last week.'])assert(ok2('w6',a));for(const a of ['buyed','buy','brought'])assert(!ok2('w6',a),'w6 refused '+a);
 for(const a of ["I've got a headache.",'I have a headache','i have got a headache','My head hurts.'])assert(ok2('w7',a),'w7 ok '+a);for(const a of ['I am headache','I have headache'])assert(!ok2('w7',a),'w7 refused '+a);
 for(const a of ['Would you like to come to dinner?','would you like to come for dinner','Do you want to come to dinner?'])assert(ok2('w8',a),'w8 ok '+a);for(const a of ['You like dinner?','Would you like dinner'])assert(!ok2('w8',a),'w8 refused '+a);
 // Pass message names the level of the exam taken.
 for(const l of ['uk','en','fr','ar'])assert(UI.COPY[l].pass.includes('{l}'),l+': pass message uses the exam level');
 assert(!/certif(icate|icat) (of|de) (completion|réussite)/i.test(read('modules/courses/en-exam12.js')));}
console.log('PASS: English 1.2 exam — 9 + 8 + 8 scored, 5 speaking practice, A2 writing checks (was, bought, headache, invitation)');
