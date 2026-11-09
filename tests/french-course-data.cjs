// French 1.1 course data (modules/courses/fr.js): six chapters, 18 topics of 10 cards (180), every card translated
// (uk/en/ar/nl) with an icon, one rule per topic in the four interface languages, no duplicate French text in the course and
// no duplicate translation inside a topic (a choice must have one right answer), Belgian French (septante, nonante, GSM,
// maison communale), and the route core builds 36 lessons of level 1.1 with ids that do not clash with English.
// Run: node tests/french-course-data.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),c=vm.createContext({console});
vm.runInContext(read('modules/courses/fr.js'),c);vm.runInContext(read('modules/courses/en.js'),c);vm.runInContext(read('modules/learning-path/core.js'),c);
const P=c.LerenCourseData.fr,dup=xs=>[...xs].filter((x,i,a)=>a.indexOf(x)!==i);
assert.equal(P.text,'fr');assert.equal(P.curriculum.chapters.length,6);assert(c.LerenCourseData.en,'English still loaded next to French');
const tabs=P.curriculum.chapters.flatMap(ch=>[...ch[2]]);assert.equal(tabs.length,18);assert.deepEqual(dup(tabs),[]);
for(const ch of P.curriculum.chapters){assert.equal(ch[3],'1.1');for(const l of ['uk','en','fr','ar'])assert(P.curriculum.chapterNames[ch[0]]?.[l],ch[0]+' name '+l)}
const all=[];
for(const t of tabs){const topic=P.data[t];assert(topic,'topic '+t);assert.equal(topic.items.length,10,t);for(const l of ['uk','en','fr','ar'])assert(topic.title[l],t+' title '+l);
 for(const w of topic.items){assert.match(w.id,/^fr:[a-z0-9_]+$/,w.id);for(const k of ['fr','uk','en','ar','nl','icon'])assert(typeof w[k]==='string'&&w[k].trim(),w.id+': '+k);
  assert(!/[Ѐ-ӿ]/.test(w.fr),w.id+': French in Latin letters');
  if(/[.?!]$/.test(w.fr))assert.match(w.fr,/^[A-ZÀ-Ý]/,w.id+': sentence starts with a capital');
  assert(!/[^\s][?!]$/.test(w.fr),w.id+': French space before ? and !');assert(!/\s{2}/.test(w.fr),w.id+': spacing');all.push(w)}
 for(const l of ['uk','en','ar'])assert.deepEqual(dup(topic.items.map(w=>w[l])),[],t+': duplicate '+l+' translation');
 for(const l of ['uk','en','fr','ar'])assert(P.grammar[t]?.[l]?.length>20,t+': rule in '+l)}
assert.equal(all.length,180);assert.deepEqual(dup(all.map(w=>w.id)),[]);assert.deepEqual(dup(all.map(w=>w.fr.toLowerCase())),[],'no French text twice');
// Belgian French.
const by=id=>all.find(w=>w.id==='fr:'+id);
assert.equal(by('septante').fr,'septante');assert.equal(by('nonante').fr,'nonante');assert.equal(by('quatre_vingts').fr,'quatre-vingts');
assert.match(by('gsm').fr,/GSM/);assert.equal(by('maison_communale').fr,'la maison communale');assert.match(P.grammar.fr_num.uk,/septante/);
// Days are lower case in French.
for(const id of ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'])assert.equal(by(id).fr,id);
// Engine: 36 lessons of five, all level 1.1, ids separate from English.
const course=c.LerenLearningPath.catalog(P.data,P.curriculum,{text:'fr'});assert.equal(course.lessons.length,36);assert(course.lessons.every(l=>l.ids.length===5&&l.ids.every(id=>id.startsWith('fr:'))));
const en=c.LerenCourseData.en,enTabs=new Set(en.curriculum.chapters.flatMap(ch=>[...ch[2]]));assert(tabs.every(t=>!enTabs.has(t)),'French topics do not reuse English topic ids');
console.log('PASS: French 1.1 — 6 chapters, 18 topics, 180 cards in 4 translations, rules in 4 languages, Belgian French, 36 lessons');
