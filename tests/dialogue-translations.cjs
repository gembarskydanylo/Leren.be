// Every dialogue line has French and Arabic, and the games show the line in the learner's language.
// Run: node tests/dialogue-translations.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({console,window:{}});
vm.runInContext(read('modules/dialogues/translations.js'),c);c.window.LerenDialogueTr=c.LerenDialogueTr;
vm.runInContext(read('course-curriculum.js')+';var uiLang="uk";'+script.slice(script.indexOf('const gTr='),script.indexOf('\n',script.indexOf('const gTr=')))+'\n'+script.slice(script.indexOf('const DIALOGUES=['),script.indexOf('const GAMES='))+';globalThis.X={DIALOGUES,dlgLineTr,gTr,set:l=>uiLang=l};',c);
const {DIALOGUES,dlgLineTr,gTr}=c.X,arabic=/[؀-ۿ]/,cyr=/[Ѐ-ӿ]/;
assert.equal(DIALOGUES.length,35);assert.equal(JSON.stringify(Object.keys(c.LerenDialogueTr).sort()),JSON.stringify(DIALOGUES.map(d=>d.id).sort()),'One translation entry per dialogue');
let lines=0;
for(const d of DIALOGUES){
 for(const lang of ['uk','en','fr','ar'])assert(d.title[lang]&&d.title[lang].trim(),'Title '+lang+' '+d.id);
 assert(arabic.test(d.title.ar)&&!arabic.test(d.title.fr)&&!cyr.test(d.title.fr),'Title scripts '+d.id);
 for(const l of d.lines){lines++;
  assert.equal(l.length,6,'nl, uk, en, fr, ar per line: '+d.id);
  for(const i of [1,2,3,4,5])assert(String(l[i]).trim(),'Empty field '+i+' in '+d.id);
  assert(!arabic.test(l[4])&&!cyr.test(l[4])&&/[a-zà-ÿ]/i.test(l[4]),'French line '+d.id+': '+l[4]);
  assert(arabic.test(l[5])&&!cyr.test(l[5]),'Arabic line '+d.id+': '+l[5]);
  assert.notEqual(l[4],l[3],'French must not be the English text: '+l[4]);
  if(/\?\s*$/.test(l[1]))assert(/\?\s*$/.test(l[4])&&/[?؟]\s*$/.test(l[5]),'Questions stay questions: '+l[1]);
 }
}
for(const [lang,i] of [['uk',2],['en',3],['fr',4],['ar',5]]){c.X.set(lang);for(const d of DIALOGUES)for(const l of d.lines)assert.equal(dlgLineTr(l),l[i]);assert.equal(gTr(DIALOGUES[0].title),DIALOGUES[0].title[lang])}
const files=JSON.parse(read('sw.js').match(/const APP_FILES = (\[[^;]+\]);/)[1]),url=html.match(/<script src="(\.\/modules\/dialogues\/translations\.js\?v=\d+)"/)[1];
assert(files.includes(url),'Translations are available offline');
assert(html.indexOf(url)<html.indexOf('<script>'),'Loaded before the app script');
console.log('PASS: '+DIALOGUES.length+' dialogues, '+lines+' lines with French and Arabic, titles in four languages, shown in the learner language, offline');
