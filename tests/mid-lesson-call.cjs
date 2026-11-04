const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.parentElement=null;this.className='';this.textContent='';this.disabled=false}
 append(...items){for(const item of items)this.appendChild(item)}
 appendChild(item){this.children.push(item);item.parentElement=this;return item}
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 focus(){this.ownerDocument.activeElement=this}
 remove(){if(!this.parentElement)return;this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 querySelectorAll(selector){const out=[];const match=e=>selector==='button'?e.tagName==='BUTTON':selector.startsWith('.')?e.className.split(/\s+/).includes(selector.slice(1)):selector==='button:not(:disabled)'?e.tagName==='BUTTON'&&!e.disabled:false;const walk=e=>{for(const child of e.children){if(match(child))out.push(child);walk(child)}};walk(this);return out}
 click(){this.onclick?.({target:this})}
}
function fixture(initial={},level='A1.1'){
 let now=1000000,tick=null,timerId=0,active=true,eligible=false,boundary=false;
 const data={...initial},listeners={};
 class FakeDate extends Date{static now(){return now}}
 const doc={hidden:false,activeElement:null,body:null,createElement(tag){const e=new Element(tag);e.ownerDocument=doc;return e},addEventListener(type,fn){listeners[type]=fn},removeEventListener(type,fn){if(listeners[type]===fn)delete listeners[type]}};
 doc.body=doc.createElement('body');const originalFocus=doc.createElement('button');doc.activeElement=originalFocus;
 const math=Object.create(Math);math.random=()=>0;
 const ctx=vm.createContext({document:doc,sessionStorage:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v},Date:FakeDate,Math:math,setInterval:fn=>(tick=fn,++timerId),clearInterval(){}});
 vm.runInContext(fs.readFileSync('modules/learning-path/invitation.js','utf8'),ctx);
 const call=ctx.LerenMidLessonCall.create({active:()=>active,eligible:()=>eligible,boundary:()=>boundary,level:()=>level,language:()=> 'uk',speak:text=>spoken.push(text)});
 const spoken=[];
 function advance(ms){for(let i=0;i<ms/1000;i++){now+=1000;tick()}}
 return {call,data,doc,originalFocus,spoken,advance,set active(v){active=v},set eligible(v){eligible=v},set boundary(v){boundary=v},get time(){return JSON.parse(data['leren-mid-lesson-call-v1']||'{}').elapsed||0},listeners};
}
function find(root,predicate){if(predicate(root))return root;for(const child of root.children){const found=find(child,predicate);if(found)return found}return null}
const x=fixture();
x.doc.hidden=true;x.eligible=true;x.boundary=true;x.advance(30000);assert.equal(x.time,0,'hidden time does not count');
x.doc.hidden=false;x.active=false;x.advance(30000);assert.equal(x.time,0,'time outside an active lesson does not count');
x.active=true;x.eligible=false;x.advance(180000);assert.equal(x.doc.body.children.length,0,'a learner with no completed lesson sees no call');
x.eligible=true;x.boundary=false;x.advance(1000);assert.equal(x.doc.body.children.length,0,'the call waits for a safe question boundary');
x.boundary=true;x.advance(1000);
let overlay=x.doc.body.children[0];assert(overlay,'the call appears after active study time and a completed lesson');
const dialog=find(overlay,e=>e.className==='midcall-card');
assert.equal(dialog.getAttribute('aria-labelledby'),'midcallTitle');
const title=find(dialog,e=>e.id==='midcallTitle');assert(title,'the accessible dialog title exists');
assert(find(dialog,e=>e.textContent==='Noor'),'the fictional caller name is shown');
assert(find(dialog,e=>e.textContent==='Wil je morgen met mij fietsen?'),'the first varied invitation is shown in Dutch');
const choices=dialog.querySelectorAll('.midcall-choice');assert.equal(choices.length,3,'yes, no and maybe responses are available');
choices[0].click();
overlay=x.doc.body.children[0];
assert(find(overlay,e=>e.className==='midcall-result'),'choosing an answer shows the friend response');
const starts=['Leuk!','Top!','Jammer!','Geen probleem.','Dat is goed.','We spreken af'];const dutchReply=find(overlay,e=>e.className==='midcall-dutch'&&starts.some(prefix=>e.textContent.startsWith(prefix)));assert(dutchReply,'the caller responds in Dutch');
find(overlay,e=>e.className==='midcall-listen').click();assert(x.spoken.length===1,'the selected response can be spoken');
x.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(x.doc.body.children.length,0,'Escape ends the call');
assert.equal(x.doc.activeElement,x.originalFocus,'focus returns to the lesson');
x.advance(600000);assert.equal(x.doc.body.children.length,0,'the event does not repeat in the same app session');
x.call.destroy();
const reload=fixture(x.data);reload.active=true;reload.eligible=true;reload.boundary=true;reload.advance(300000);assert.equal(reload.doc.body.children.length,0,'the event stays dismissed after a reload in the same tab session');reload.call.destroy();
for(const [level,expected] of [['A1.1','Wil je morgen met mij fietsen?'],['A1.2','Heb je morgen zin om samen te gaan fietsen?'],['A2','Als het morgen mooi weer is, zullen we dan gaan fietsen?']]){
 const learner=fixture({},level);learner.eligible=true;learner.boundary=true;learner.advance(181000);
 const text=find(learner.doc.body,e=>e.className==='midcall-dutch'&&e.textContent===expected);assert(text,level+' uses an invitation matched to the course level');learner.call.destroy();
}
console.log('PASS: active-time gate, lesson progress gate, safe boundary, randomized Dutch call, answer feedback, speech, keyboard dismissal, focus return and once-per-session persistence');
