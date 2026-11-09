// English course data: 1.1 (modules/courses/en.js) and 1.2 (modules/courses/en12.js), six chapters each, 18 topics of 10 cards
// (180 per level), every card translated
// (uk/fr/ar/nl) with an icon, one rule per topic in the four interface languages, no duplicate English text in the course
// and no duplicate translation inside a topic (a choice must have one right answer), and the route core builds 36 lessons
// of level 1.1. Run: node tests/english-course-data.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),c=vm.createContext({console});
vm.runInContext(read('modules/courses/en.js'),c);vm.runInContext(read('modules/courses/en12.js'),c);vm.runInContext(read('modules/courses/en12.js'),c);vm.runInContext(read('modules/learning-path/core.js'),c);
const P=c.LerenCourseData.en,dup=xs=>[...xs].filter((x,i,a)=>a.indexOf(x)!==i);
assert.equal(P.text,'en');assert.equal(P.curriculum.chapters.length,12,'six chapters per level (loading 1.2 twice adds nothing)');
const tabs=P.curriculum.chapters.flatMap(ch=>[...ch[2]]);assert.equal(tabs.length,36);assert.deepEqual(dup(tabs),[],'each topic once');
P.curriculum.chapters.forEach((ch,i)=>assert.equal(ch[3],i<6?'1.1':'1.2',ch[0]+': level'));
for(const ch of P.curriculum.chapters){for(const l of ['uk','en','fr','ar'])assert(P.curriculum.chapterNames[ch[0]]?.[l],ch[0]+' name '+l)}
const all=[];
for(const t of tabs){const topic=P.data[t];assert(topic,'topic '+t);assert.equal(topic.items.length,10,t+': 10 cards');for(const l of ['uk','en','fr','ar'])assert(topic.title[l],t+' title '+l);
 for(const w of topic.items){assert.match(w.id,/^en:[a-z0-9_]+$/,w.id);for(const k of ['en','uk','fr','ar','nl','icon'])assert(typeof w[k]==='string'&&w[k].trim(),w.id+': '+k);assert(!/[Ѐ-ӿ]/.test(w.en),w.id+': English text in Latin letters');all.push(w)}
 for(const l of ['uk','fr','ar'])assert.deepEqual(dup(topic.items.map(w=>w[l])),[],t+': duplicate '+l+' translation');
 for(const l of ['uk','en','fr','ar'])assert(P.grammar[t]?.[l]?.length>20,t+': rule in '+l)}
assert.equal(all.length,360);assert.deepEqual(dup(all.map(w=>w.id)),[],'unique ids');assert.deepEqual(dup(all.map(w=>w.en.toLowerCase())),[],'no English text twice');
// Quality review (stage 3) — guards against the fixed issues coming back.
const by=id=>all.find(w=>w.id==='en:'+id);
assert.equal(by('on_monday').en,'I work on Mondays.','habit: on Mondays');assert.equal(by('far').en,"It's a long way.",'natural British “far”');assert.equal(by('platform').en,'the platform');
assert.match(by('good_afternoon').fr,/^Bonjour/,'French greets with Bonjour in the afternoon (Bon après-midi is a goodbye)');
assert.equal(by('there_is').ar,'توجد حديقة.','feminine agreement');assert.equal(by('sofa').nl,'de zetel','Flemish word');
assert(!/«half drie»!/.test(P.grammar.en_time.uk),'clear rule for half past');
// Style: sentences start with a capital and end with . ? or !; vocabulary items (no verb) are lower case except names/days.
for(const w of all){const sentence=/[.?!]$/.test(w.en);if(sentence)assert.match(w.en,/^[A-Z]/,w.id+': sentence starts with a capital');
 assert(!/\s[,.?!]|\s{2}/.test(w.en),w.id+': spacing');assert(!/\bfar\.$/.test(w.en),w.id+': no bare “far.”')}
const course=c.LerenLearningPath.catalog(P.data,P.curriculum,{text:'en'});assert.equal(course.lessons.length,72,'36 lessons of 5 per level');
assert.equal(course.chapters.filter(ch=>ch.level==='1.1').length,6);assert.equal(course.chapters.filter(ch=>ch.level==='1.2').length,6);
// 1.1 lessons keep their ids (saved progress) and come first.
assert.deepEqual([...course.lessons.slice(0,36).map(l=>l.chapter).filter((x,i,a)=>a.indexOf(x)===i)],['en_hello','en_numbers','en_family','en_shopping','en_home','en_town']);
// 1.2 quality guards: past tense, British usage, Belgian life.
assert.equal(by('we_left').en,'We left at five.');assert.equal(by('gp').nl,'de huisarts');assert.equal(by('call_112').en,'Call 112!');assert.equal(by('on_holiday').en,"I'm on holiday.",'British: on holiday');
assert.match(P.grammar.en_email.uk,/Yours faithfully/);assert(course.lessons.every(l=>l.ids.length===5));
console.log('PASS: English 1.1 + 1.2 — 12 chapters, 36 topics, 360 cards in 4 translations, rules in 4 languages, 72 lessons');
