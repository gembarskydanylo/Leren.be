// English 1.1 course data (modules/courses/en.js): six chapters, 18 topics of 10 cards (180), every card translated
// (uk/fr/ar/nl) with an icon, one rule per topic in the four interface languages, no duplicate English text in the course
// and no duplicate translation inside a topic (a choice must have one right answer), and the route core builds 36 lessons
// of level 1.1. Run: node tests/english-course-data.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),c=vm.createContext({console});
vm.runInContext(read('modules/courses/en.js'),c);vm.runInContext(read('modules/learning-path/core.js'),c);
const P=c.LerenCourseData.en,dup=xs=>[...xs].filter((x,i,a)=>a.indexOf(x)!==i);
assert.equal(P.text,'en');assert.equal(P.curriculum.chapters.length,6,'six chapters');
const tabs=P.curriculum.chapters.flatMap(ch=>[...ch[2]]);assert.equal(tabs.length,18);assert.deepEqual(dup(tabs),[],'each topic once');
for(const ch of P.curriculum.chapters){assert.equal(ch[3],'1.1',ch[0]+': level 1.1');for(const l of ['uk','en','fr','ar'])assert(P.curriculum.chapterNames[ch[0]]?.[l],ch[0]+' name '+l)}
const all=[];
for(const t of tabs){const topic=P.data[t];assert(topic,'topic '+t);assert.equal(topic.items.length,10,t+': 10 cards');for(const l of ['uk','en','fr','ar'])assert(topic.title[l],t+' title '+l);
 for(const w of topic.items){assert.match(w.id,/^en:[a-z0-9_]+$/,w.id);for(const k of ['en','uk','fr','ar','nl','icon'])assert(typeof w[k]==='string'&&w[k].trim(),w.id+': '+k);assert(!/[Ѐ-ӿ]/.test(w.en),w.id+': English text in Latin letters');all.push(w)}
 for(const l of ['uk','fr','ar'])assert.deepEqual(dup(topic.items.map(w=>w[l])),[],t+': duplicate '+l+' translation');
 for(const l of ['uk','en','fr','ar'])assert(P.grammar[t]?.[l]?.length>20,t+': rule in '+l)}
assert.equal(all.length,180);assert.deepEqual(dup(all.map(w=>w.id)),[],'unique ids');assert.deepEqual(dup(all.map(w=>w.en.toLowerCase())),[],'no English text twice');
const course=c.LerenLearningPath.catalog(P.data,P.curriculum,{text:'en'});assert.equal(course.lessons.length,36,'36 lessons of 5');
assert(course.chapters.every(ch=>ch.level==='1.1'));assert(course.lessons.every(l=>l.ids.length===5));
console.log('PASS: English 1.1 — 6 chapters, 18 topics, 180 cards in 4 translations, rules in 4 languages, 36 lessons');
