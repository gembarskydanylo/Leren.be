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
