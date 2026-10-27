const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({console,assert,shuffle:x=>x});
vm.runInContext(read('modules/test-library/ui.js'),c);
vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored')),c);
const start=script.indexOf('const DIPH_UI = '),end=script.indexOf('\nlet toetsId',start);
vm.runInContext(script.slice(start,end)+'\n'+script.slice(script.indexOf('const BUILD_BANK='),script.indexOf('const SENT='))+'\nglobalThis.fixture={TOETS,LerenCurriculum};',c);
const api=c.LerenTestLibrary,tests=c.fixture.TOETS,original=tests.filter(t=>t.kind!=='block'),snapshot=JSON.stringify(original);
api.ensureCombined(tests);api.ensureCombined(tests);
assert.equal(tests.filter(t=>t.kind==='block').length,4,'Idempotent combined banks');
for(const level of ['a11','a12']){
 const blocks=api.blocks(tests,level),all=blocks.flatMap(b=>b.tests);
 assert.equal(all.length,level==='a11'?12:8);assert.equal(new Set(all.map(t=>t.id)).size,all.length);
 for(const b of blocks){
  const t=tests.find(t=>t.block===b.id);assert.equal(t.questions.length,b.tests.length*3);
  assert(t.questions.every(q=>q.opts.length===4&&q.ok>=0&&q.ok<4));
  b.tests.forEach(chapter=>assert.equal(t.questions.filter(q=>chapter.questions.includes(q)).length,3));
 }
}
assert.equal(JSON.stringify(original),snapshot,'Existing tests and diphthongs are unchanged');
class Element{
 constructor(tag,cls='',text=''){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];this.attrs={};this.dataset={};this.classList={add:x=>this.className+=' '+x,remove:x=>this.className=this.className.split(' ').filter(v=>v!==x).join(' ')};}
 append(...xs){this.children.push(...xs)}appendChild(x){this.children.push(x);return x}replaceChildren(...xs){this.children=xs}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
}
const flat=e=>[e,...e.children.flatMap(flat)],card=new Element('section');let opened=null,exam=0,changed=null;
const best={course_comm_v2:7},o={card,el:(...args)=>new Element(...args),tests,level:'a11',lang:'uk',best,open:t=>opened=t,topicInfo:c.fixture.LerenCurriculum.topicInfo,exam:()=>exam++,unlocked:()=>false,changeLevel:id=>changed=id};
function nodes(cls){return flat(card).filter(e=>e.className.split(' ').includes(cls))}
api.render(o);assert.equal(nodes('tl-block').length,2);assert.equal(nodes('tl-row').length,0,'No catalogue wall on entry');assert(nodes('tl-progress-label').some(e=>e.textContent==='Складено тем: 1 з 6'));
nodes('tl-block')[0].onclick();assert.equal(nodes('tl-row').length,7);assert.equal(nodes('is-passed').length,1);
nodes('tl-row')[0].onclick();assert.equal(opened.kind,'block');assert.equal(opened.questions.length,18);
api.render(o);assert.equal(nodes('tl-row').length,7,'Return preserves collection');nodes('tl-back')[0].onclick();
nodes('tl-utility').find(e=>e.id==='examPick').onclick();assert.equal(exam,1);
api.render(o);nodes('tl-utility').find(e=>e.id!=='examPick').onclick();
const rest=nodes('tl-row').map(e=>e.dataset.test);assert(rest.includes('diphthongs'));assert(rest.includes('lt_a12_course_v2'));
assert.deepEqual(new Set(rest),new Set(tests.filter(t=>t.lvl==='a11'&&t.group!=='chapter'&&t.kind!=='block').map(t=>t.id)),'Every old test remains reachable exactly once');assert.equal(rest.length,new Set(rest).size);
nodes('tl-back')[0].onclick();nodes('tl-level')[1].onclick();assert.equal(changed,'a12','Host retains responsibility for unlock policy');
for(const lang of ['uk','en','fr','ar']){o.lang=lang;o.level='a12';api.render(o);assert.equal(nodes('tl-block').length,2);assert.equal(card.dir,lang==='ar'?'rtl':'ltr');nodes('tl-block')[1].onclick();assert.equal(nodes('tl-row').length,5);nodes('tl-back')[0].onclick();}
assert.equal(JSON.stringify(best),JSON.stringify({course_comm_v2:7}),'Rendering must never alter saved bests');
const offline=JSON.parse(read('sw.js').match(/const APP_FILES = (\[[^;]+\]);/)[1]);for(const name of ['first-steps','everyday','practice']){const path='img/tests/'+name+'-v109.webp';assert(offline.includes('./'+path));assert(fs.statSync(path).size<100000)}
assert(html.includes('if(!levelUnlocked(id))'));assert(!html.includes('poly_curlevel'));assert(html.includes('LerenTestLibrary.ensureCombined(TOETS)'));
console.log('PASS: 12/8 topics partitioned without overlap, four stable balanced tests, every legacy test reachable, saved results untouched, collection return, host unlock policy, four languages and offline art');
