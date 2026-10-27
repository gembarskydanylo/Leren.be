const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx=vm.createContext({assert});
vm.runInContext(fs.readFileSync('course-curriculum.js','utf8')+'\n'+script.slice(0,script.indexOf('function validStored')),ctx);
const files=JSON.parse(fs.readFileSync('sw.js','utf8').match(/const APP_FILES = (\[[^;]+\]);/)[1]);
const curriculumUrl=html.match(/<script src="([^"]*course-curriculum\.js[^\"]*)"/)[1];
assert(/\?v=\d+$/.test(curriculumUrl),'New HTML must not load an older cached course script');
assert(files.includes(curriculumUrl),'The exact course-script URL must be available offline');
const ids=vm.runInContext('CATEGORIES.map(c=>c.id)',ctx);
for(const id of ids){
 for(const lang of ['uk','en','fr','ar']){
  const info=vm.runInContext(`LerenCurriculum.topicInfo(${JSON.stringify(id)},${JSON.stringify(lang)})`,ctx);
  assert(info.title&&info.description&&info.dutch,`Incomplete topic ${id}/${lang}`);
  assert(!/^\d+\./.test(info.title),'Primary label should explain the situation');
  assert(fs.existsSync(info.image),`Missing illustration for ${id}`);
  assert(files.includes(info.image),`Illustration unavailable offline for ${id}`);
 }
}
assert.equal(new Set(ids.map(id=>vm.runInContext(`LerenCurriculum.topicInfo('${id}').image`,ctx))).size,21);
// Execute the actual navigation callbacks: catalog -> topic -> lesson -> catalog.
class Element{
 constructor(tag='',cls='',text=''){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];this.attrs={};this.dataset={};this.hidden=false;this.scrollTop=300}
 append(...children){this.children.push(...children)}appendChild(child){this.children.push(child)}
 replaceChildren(...children){this.children=[...children]}
 setAttribute(k,v){this.attrs[k]=v}
 focus(){this.focused=true}
 querySelector(selector){if(selector==='.sheet-panel')return panel;return this.children.find(c=>c.attrs?.['aria-selected']==='true')}
}
const panel=new Element(),nodes={};
for(const id of ['catNav','subNav','topicCatalog','topicDetail','topicsSheet','topicHero','topicsTitle','topicsIntro','lblCat','lblSub','topicBack'])nodes[id]=new Element();
const nav=vm.createContext({
 LerenCurriculum:ctx.LerenCurriculum,CATEGORIES:vm.runInContext('CATEGORIES',ctx),
 uiLang:'uk',currentCat:'comm',tab:'questions',mode:'study',view:'lesson',lessonMode:'study',cardOwner:'lesson',saved:0,rounds:0,closed:0,
 $:id=>nodes[id],el:(...args)=>new Element(...args),ico:()=>new Element(),
 levelCats:()=>vm.runInContext("CATEGORIES.filter(c=>c.lvl==='a11')",ctx),
 getUI:()=>vm.runInContext('UI.uk',ctx),tabVisible:()=>true,renderLevelNav(){},renderTopicBar(){},updateModeButtons(){},
 saveStore(){nav.saved++},newRound(){nav.rounds++},closeSheet(){nav.closed++}
});
const start=script.indexOf('function topicPickerUI()'),end=script.indexOf('\nfunction bindNavSlider',start);
vm.runInContext(script.slice(start,end)+'\nbuildNav()',nav);
const forms=nodes.catNav.children.find(c=>c.children.some(e=>e.textContent==='Анкети й документи'));
assert(forms,'Translated topic card is available');forms.onclick();
assert.equal(nav.currentCat,'forms');assert.equal(nodes.topicCatalog.hidden,true);assert.equal(nodes.topicDetail.hidden,false);assert.equal(panel.scrollTop,0);
assert.equal(nodes.subNav.children.length,6,'Only this chapter’s five lessons and whole-topic option');
nodes.topicBack.onclick();assert.equal(nodes.topicCatalog.hidden,false);assert.equal(nodes.topicDetail.hidden,true);assert.equal(panel.scrollTop,300,'Back preserves the position in the course overview');
forms.onclick();const phone=nodes.subNav.children.find(c=>c.children.some(e=>e.textContent==='Телефон'));phone.onclick();
assert.equal(nav.tab,'telefoon');assert.equal(nav.closed,1);assert(nav.saved>0);
assert.equal(vm.runInContext("CATEGORIES.find(c=>c.id==='grammar').tabs.includes('diphthongs')",ctx),true);
console.log('PASS: 21 translated illustrated topics, exact offline script URL, category/lesson navigation and saved selection');
