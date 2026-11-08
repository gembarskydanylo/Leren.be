// AI tutor: explanations follow the learner's language (the app setting by default, another language when the learner writes
// in it), and free conversation covers any everyday topic. Static check of the prompts; no API key or network.
// Run: node tests/ai-explain-language.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../tools/ai-worker.js'),'utf8'),sandbox={console};vm.createContext(sandbox);
vm.runInContext(source.slice(0,source.indexOf('export default'))+'\nthis.T={chatSystem,askSystem,schemaFor,EXPLAIN_RULE};',sandbox);
const {T}=sandbox;
for(const [lang,L] of [['uk','Ukrainian'],['en','English'],['fr','French'],['ar','Arabic']]){
 const chat=T.chatSystem('nl',lang,'a11',null,'peter','','teacher'),ask=T.askSystem('nl',lang,'a11','peter','');
 for(const [name,p] of [['chat',chat],['ask',ask]]){
  assert.match(p,/EXPLANATION LANGUAGE:/,name+'/'+lang+': rule present');
  assert(p.includes(`own language: ${L} by default`),name+'/'+lang+': default is the app language');
  assert.match(p,/Polish, Russian, Turkish, Romanian/,name+'/'+lang+': other languages named');
  assert(p.indexOf('EXPLANATION LANGUAGE')<p.indexOf('LANGUAGE RULE'),name+': the rule comes before the format rules that use it');
 }
 assert.match(chat,/anything else the learner wants to talk about/,'free topics');
 const sc=T.schemaFor('chat',L).properties;assert.match(sc.translation.description,/learner's own language/);assert.match(sc.correction.properties.explanation.description,/learner's own language/);
 const sa=T.schemaFor('ask',L).properties;assert.match(sa.answer.description,/learner's own language/);
}
// Everyday topics are welcome; only unrelated TASKS are declined (no contradiction with the free-topic line).
{const p=T.chatSystem('nl','uk','a11',null,'peter','','teacher');assert.match(p,/IS language practice: join in/);assert.doesNotMatch(p,/If the learner asks about something unrelated to learning languages/)}
// A role-play scene keeps its own situation (no free-topic text).
assert.doesNotMatch(T.chatSystem('nl','uk','a11','cafe','peter','','teacher'),/anything else the learner wants/);
// German at architecture level: the tutor can be asked for German (target 'de'), examples may be German.
{const de=T.chatSystem('de','uk','a11',null,'peter','','teacher');assert.match(de,/Standard German/);assert.match(de,/kein\/keine/);
 assert.deepEqual([...T.schemaFor('ask','Ukrainian').properties.examples.items.properties.lang.enum],['nl','en','fr','de'])}
console.log('PASS: explanation language follows the learner (4 app languages + others), free conversation on any everyday topic');
