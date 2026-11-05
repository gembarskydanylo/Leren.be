const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const fn=name=>{const s=script.indexOf('function '+name+'(');return script.slice(s,script.indexOf('\n}',s)+2)};
const welcome=script.slice(script.indexOf('const WELCOME_UI='),script.indexOf('function welcomeScreen('));
const mk=()=>({text:'',children:[],dataset:{},classList:{add(){}},append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)}});
const flat=n=>[n.text||'',...(n.children||[]).flatMap(flat)];
// 1. Welcome screen: four languages, three outcomes, primary start + optional tour, shown once, then the level question follows.
for(const lang of ['uk','en','fr','ar']){
 const store={},calls=[];
 const ctx=vm.createContext({uiLang:lang,lsGet:(k,d)=>store[k]??d,lsSet:(k,v)=>{store[k]=v},el:(tag,cls,text)=>Object.assign(mk(),{text:text||'',tag,cls}),setTimeout:f=>f(),
  popup:build=>{const p=mk();build(p,()=>{},mk());ctx.panel=p}});
 vm.runInContext(welcome+fn('welcomeScreen')+`;globalThis.run=()=>welcomeScreen(()=>calls.push('then'),()=>calls.push('tour'))`,ctx);
 ctx.calls=calls;vm.runInContext('globalThis.calls=calls',ctx);
 ctx.run();
 const texts=flat(ctx.panel);assert(texts.some(t=>t.includes('7')),lang+': title promises a 7-day outcome');
 const list=ctx.panel.children.find(c=>c.cls==='welcome-list');assert.equal(list.children.length,3,lang+': three outcomes');
 const buttons=ctx.panel.children.filter(c=>c.tag==='button');assert.equal(buttons.length,2,lang+': start + tour');
 buttons[0].onclick();assert.equal(store.leren_welcome_seen,true);assert.deepEqual(calls,['then']);
 buttons[1].onclick();assert.equal(store.leren_level_asked,true);assert(calls.includes('tour'));
}
// 2. firstRun shows the welcome first for new learners, never for returning ones.
{
 let shown=0;const store={};
 const ctx=vm.createContext({lsGet:(k,d)=>store[k]??d,lsSet:(k,v)=>{store[k]=v},welcomeScreen:()=>shown++,startTour(){},popup(){},growU:()=>({}),el:()=>mk(),setTimeout(){}});
 vm.runInContext(fn('firstRun')+';globalThis.fr=firstRun',ctx);
 ctx.fr();assert.equal(shown,1,'new learner sees the welcome screen');
 store.leren_welcome_seen=true;ctx.fr();assert.equal(shown,1,'welcome is shown once');
 store.leren_tour_done=true;store.leren_welcome_seen=false;shown=0;ctx.fr();assert.equal(shown,0,'returning learner skips it');
}
// 3. Home progress card: streak, goal, points, level lessons, one tap to the full progress screen; four languages.
const src=fs.readFileSync('modules/focused-home/ui.js','utf8');
for(const lang of ['uk','en','fr','ar']){
 const dom={createElement:tag=>({tag,className:'',textContent:'',children:[],attrs:{},append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)},setAttribute(k,v){this.attrs[k]=v},set onclick(f){this._c=f},get onclick(){return this._c}}),createElementNS:()=>({setAttribute(){},appendChild(){}})};
 const win={};const ctx=vm.createContext({window:win,document:dom,globalThis:{},requestAnimationFrame(){},addEventListener(){}});
 vm.runInContext(src,ctx);
 let more=0;
 const card=win.LerenFocus.progressCard({lang,streak:5,min:7,goal:10,points:120,done:3,total:12,onMore:()=>more++});
 const t=flat({text:card.textContent,children:card.children.map(function f(c){return{text:c.textContent,children:c.children.map(f)}})});
 assert(t.some(x=>x.includes('5'))&&t.some(x=>x.includes('120'))&&t.some(x=>x.includes('7 / 10')),lang+': streak, points and goal values');
 assert(t.some(x=>x.includes('3')&&x.includes('12')),lang+': level lessons');
 const btn=card.children[0].children[1];btn.onclick();assert.equal(more,1,lang+': one tap to full progress');
 const done=win.LerenFocus.progressCard({lang,streak:0,min:15,goal:10,points:0,done:0,total:0,onMore(){}});
 assert(flat({text:'',children:done.children.map(function f(c){return{text:c.textContent,children:c.children.map(f)}})}).some(x=>x.includes('10 / 10')),lang+': goal capped at 100%');
}
// 4. Home wires the card in and the bridge exposes the numbers.
assert(fs.readFileSync('modules/learning-path/ui.js','utf8').includes('LerenFocus.progressCard'));
assert(script.includes('stats:()=>({streak:streakState().n,min:minutesToday(),goal:goalMin(),points:score})'));
console.log('PASS: welcome screen in four languages shown once, then level question; home progress card with streak, goal, points and link to full progress');
