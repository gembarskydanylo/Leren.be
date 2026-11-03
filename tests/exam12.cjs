// Final exam A1.2 and the shared exam engine. Run: node tests/exam12.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=require(__dirname+'/lib/app-source.cjs')(),sw=read('sw.js');
const ctx=vm.createContext({console,uiLang:'uk',lsGet:()=>({}),lsSet(){},shuffle:a=>a.slice(),window:{},DATA:{}});ctx.window=ctx;
vm.runInContext(read('course-curriculum.js'),ctx);
for(const f of ['exam-core','exam11','exam12-data','exam12'])vm.runInContext(read('modules/exam/'+f+'.js'),ctx);
const {EXAM11,EXAM12,EXAM12_DATA:D}=ctx;

// A1.1 exam keeps its content after moving the engine into exam-core.js.
assert.equal(EXAM11.texts().length,205);assert.equal(EXAM11.speakScript().length,22);assert.equal(EXAM11.chips().length,5);
assert.equal(EXAM11.data.WRITE.length,4);assert.equal(EXAM11.data.LEZEN.length,24);assert.equal(EXAM11.data.GRAM.length,26);

// A1.2 exam: every part has content and consistent answers.
for(const k of ['open','texts','chips','speakScript','_quiz','_write','_speak'])assert.equal(typeof EXAM12[k],'function');
assert(D.LEZEN.length>=15&&D.LUISTEREN.length>=12&&D.GRAM.length>=25&&D.WRITE.length>=12&&D.SPREKEN.length===6);
for(const x of D.LEZEN){assert(D.TEXTS[x.t],'Reading text '+x.t);assert(x.o.length>=2&&new Set(x.o).size===x.o.length,'Reading options '+x.q.uk);assert(x.q.uk&&x.q.en)}
for(const t of Object.values(D.TEXTS))assert(t.title&&t.body.length>80&&t.uk.length>80);
for(const x of D.LUISTEREN){assert(D.DLG[x.d],'Listening text '+x.d);assert(new Set(x.o).size===x.o.length);assert(x.q.uk&&x.q.en)}
for(const lines of Object.values(D.DLG))for(const l of lines)assert(l[1]&&l[2],'Listening line with translation');
const covered=new Set(D.LEZEN.map(x=>x.t)),heard=new Set(D.LUISTEREN.map(x=>x.d));
assert.equal(covered.size,Object.keys(D.TEXTS).length,'Every reading text has questions');assert.equal(heard.size,Object.keys(D.DLG).length,'Every listening text has questions');
for(const g of D.GRAM){
 assert(g.e&&g.e.uk&&g.u,'Grammar explanation and translation');
 if(g.s){assert(g.s.includes('___'));assert.equal(new Set(g.o).size,g.o.length,'Grammar options '+g.s)}
 else assert.equal(g.w.join(' '),g.a,'Word order item uses exactly the answer words: '+g.a);
}
const rules=[/ben\b|is\b/,/heb\b/,/gelogeerd|gewerkt/,/ingevuld|aangekomen|opgestaan/,/was\b|had\b/,/dan\b|als\b|-ste|goedkoopste/,/hem|haar|ons/,/omdat|want/,/sinds/,/^Ga\b|^___ rechtdoor|Sla\b/,/ga\b|gaan\b/];
const gramText=D.GRAM.map(g=>g.s?g.s.replace('___',g.o[0]):g.a).join('\n');
for(const r of rules)assert(r.test(gramText)||D.GRAM.some(g=>r.test(g.s||g.a)),'A1.2 grammar rule covered: '+r);
// Writing: each model text passes its own checklist and the general checks, and no common-mistake tip fires on it.
for(const w of D.WRITE){
 assert(w.checks.length>=5,'Checklist '+w.id);assert(w.task&&w.task_uk&&w.model&&w.model_uk&&w.title.uk&&w.title.en);
 for(const [label,re] of w.checks)assert(re.test(w.model),'Model of '+w.id+' misses: '+label);
 for(const [re,tip] of D.COMMON)assert(!re.test(w.model),'Tip fires on the model of '+w.id+': '+tip.uk);
 if(w.form)continue;
 const t=w.model,lines=t.split(/\n+/).map(x=>x.trim()).filter(Boolean),sign=lines.length>1&&/(groetjes|groeten|tot \S+)[,!]?$/i.test(lines[lines.length-2])&&/^[A-Z]/.test(lines[lines.length-1])?lines[lines.length-1]:'';
 const sents=t.split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>2&&x!==sign&&!/^(hallo|beste|dag|hoi|lieve|groetjes|groeten)\b/i.test(x)&&!/,$/.test(x)&&x.split(/\s+/).length>1);
 assert(sents.every(x=>/^[A-Z’'0-9]/.test(x)&&/[.!?]$/.test(x)),'Capitals and full stops in the model of '+w.id);
 assert(sents.length>=(w.min||5),'Enough sentences in the model of '+w.id);assert(sign,'Signature in the model of '+w.id);
}
assert(D.WRITE.filter(w=>w.form).length>=2,'At least two forms');
// Tips catch the typical A1.2 mistakes and leave correct sentences alone.
const tip=s=>D.COMMON.some(([re])=>re.test(s));
for(const s of ['Ik kom niet, omdat ik ben ziek.','Ik kom niet omdat ik ben moe','Ik heb gegaan naar Gent.','Ik ben gewerkt.','Hij is groter als ik.','Ik ben geopstaan.'])assert(tip(s),'Tip expected: '+s);
for(const s of ['Ik kom niet, omdat ik ziek ben.','omdat ik moet werken.','Ik ben naar Gent gegaan.','Ik heb gewerkt.','Hij is groter dan ik.','Ik ben opgestaan.'])assert(!tip(s),'No tip expected: '+s);
for(const t of D.SPREKEN){assert.equal(t.qa.length,6);for(const q of t.qa)assert(q[0]&&q[1]&&q[2]&&q[3]&&!q[1].includes(' / '),'Speaking item '+q[0])}
assert(EXAM12.texts().length>=100,'Exam texts are offered for recording');assert.equal(EXAM12.chips().length,4);
assert(EXAM12.speakScript().length>=18);

// Registered in the app: Tests → A1.2, offline cache, Peter's long-text limit.
for(const f of ['exam-core','exam11','exam12-data','exam12']){const url=html.match(new RegExp('<script src="(\\./modules/exam/'+f+'\\.js\\?v=\\d+)"'))[1];assert(sw.includes('"'+url+'"'),'Offline: '+url)}
assert(html.indexOf('exam/exam-core.js')<html.indexOf('exam/exam11.js')&&html.indexOf('exam/exam12-data.js')<html.indexOf('exam/exam12.js'),'Load order');
assert(html.includes('curLevel==="a12"&&window.EXAM12?()=>EXAM12.open()'));
assert(read('modules/test-library/ui.js').includes("level==='a12'?u.exam12:u.exam"));
assert(read('tools/ai-worker.js').includes('["exam11", "exam12"].includes(body.focus)'));
assert(read('tools/collect-audio-texts.js').includes('EXAM12.texts()'));
console.log(`PASS: A1.1 exam unchanged; A1.2 exam ${D.LEZEN.length} reading, ${D.LUISTEREN.length} listening, ${D.GRAM.length} grammar, ${D.WRITE.length} writing tasks with valid models and tips, ${D.SPREKEN.length*6} speaking questions; registered offline and in Tests`);
