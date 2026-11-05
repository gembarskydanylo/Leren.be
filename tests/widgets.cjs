const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
function element(){return {dataset:{},style:{},attrs:{},children:[],handlers:{},isConnected:true,hidden:false,textContent:'',classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.handlers[k]=f},append(...els){this.children.push(...els)},appendChild(el){this.children.push(el)},replaceChildren(...els){this.children=els},querySelectorAll(){return this.children},contains(){return true},setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:200,height:200}}}}
function dom(){const nodes=new Map();const get=k=>{if(!nodes.has(k))nodes.set(k,element());return nodes.get(k)};return {get,document:{addEventListener:()=>{},getElementById:get,querySelector:get,querySelectorAll:()=>[],createElement:element,documentElement:element(),head:element(),body:element(),currentScript:{src:'https://example.com/modules/diphthongs/widget.js'}}}}
function clock(){
 const {get,document}=dom(),timers=new Map(),spoken=[];let id=0;
 const parent={location:{origin:'https://example.com'},postMessage(){},LerenLessonWidgets:{getLanguage:()=> 'fr',speak:(...x)=>spoken.push(x),stop(){}}};
 const window={parent,addEventListener(){}};
 const context=vm.createContext({window,document,location:{origin:'https://example.com'},URLSearchParams,requestAnimationFrame:()=>{},setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(read('modules/clock/clock.js')+read('modules/clock/widget.js'),context);
 const dial=get('clockDial'),event=a=>({clientX:100+80*Math.sin(a*Math.PI/180),clientY:100-80*Math.cos(a*Math.PI/180),pointerId:1,isPrimary:true,button:0,preventDefault(){}});
 dial.handlers.pointerdown(event(330));assert.equal(get('digitalTime').textContent,'14:55');
 dial.handlers.pointermove(event(350));assert.equal(get('digitalTime').textContent,'15:00');
 dial.handlers.pointerup(event(350));for(const f of timers.values())f();timers.clear();assert.equal(spoken.at(-1)[1],true);
 window.speakCurrentTime();assert.equal(spoken.at(-1)[1],false);
 dial.handlers.pointerdown(event(10));dial.handlers.pointermove(event(330));assert.equal(get('digitalTime').textContent,'14:55');dial.handlers.pointercancel();
 // The short hand moves the hours and keeps the minutes: at 14:55 it points at 87.5°; drag it on by two hours.
 const near=(a,r)=>({clientX:100+r*Math.sin(a*Math.PI/180),clientY:100-r*Math.cos(a*Math.PI/180),pointerId:2,isPrimary:true,button:0,preventDefault(){}});
 dial.handlers.pointerdown(near(87.5,40));dial.handlers.pointermove(near(117.5,40));assert.equal(get('digitalTime').textContent,'15:55','hour hand: +1 hour');
 dial.handlers.pointermove(near(150,40));assert.equal(get('digitalTime').textContent,'16:55','hour hand: +2 hours, minutes stay');
 dial.handlers.pointermove(near(60,40));assert.equal(get('digitalTime').textContent,'13:55','hour hand goes back too');dial.handlers.pointercancel();
 // a touch far from the hour hand still takes the minute hand
 dial.handlers.pointerdown(near(270,80));assert.equal(get('digitalTime').textContent,'13:45','minute hand');dial.handlers.pointercancel();
 assert.equal(document.documentElement.lang,'fr');assert.match(get('clockQuizTab').textContent,/Régler/);
 window.clockSetMode('quiz');assert.equal(get('clockQuizPanel').hidden,false);
 window.clockSetMode('learn');assert.equal(get('clockLearnOutput').hidden,false);
 assert.equal(timers.size,0);
 console.log('PASS: actual clock pointer rollover both directions, shared/automatic speech, French UI, quiz mode, timer cancellation');
}
async function cache(){
 const listeners={},cacheFiles=[],removed=[];const context=vm.createContext({self:{addEventListener:(k,f)=>listeners[k]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async files=>cacheFiles.push(...files),add:async file=>cacheFiles.push(file)}),keys:async()=>['leren-be-v79',read('sw.js').match(/const CACHE_NAME = "([^"]+)"/)[1],'other-app'],delete:async k=>removed.push(k)}});
 vm.runInContext(read('sw.js'),context);let promise;
 listeners.install({waitUntil:p=>promise=p});await promise;
 listeners.activate({waitUntil:p=>promise=p});await promise;
 for(const file of ['clock/widget.html','clock/clock.js','clock/widget.js','diphthongs/widget.html','diphthongs/widget.css','diphthongs/widget.js','diphthongs/words.json'])assert(cacheFiles.some(url=>url.split('?')[0]==='./modules/'+file));
 assert.deepEqual(removed,['leren-be-v79']);for(const file of cacheFiles)assert(fs.existsSync(file.split('?')[0]));
 assert(!require(__dirname+'/lib/app-source.cjs')().includes('frame.srcdoc='));
 console.log('PASS: new cache preloads all lesson dependencies, removes old app cache, preserves unrelated caches; clock has one HTML source');
}
(async()=>{clock();await cache()})().catch(e=>{console.error(e);process.exitCode=1});
// The integration must route through the existing selected-voice player and honor Auto.
{
 const source=require(__dirname+'/lib/app-source.cjs')().match(/window\.LerenLessonWidgets=\{[\s\S]*?\n\};/)[0],calls=[];
 const c=vm.createContext({window:{},uiLang:'fr',targetLang:'nl',autoSpeech:false,say:x=>calls.push(x)});
 vm.runInContext(source,c);c.window.LerenLessonWidgets.speak('huis',true);assert.equal(calls.length,0);
 c.window.LerenLessonWidgets.speak('huis');assert.deepEqual(calls,['huis']);
 vm.runInContext('autoSpeech=true',c);c.window.LerenLessonWidgets.speak('boek',true);assert.deepEqual(calls,['huis','boek']);
 assert.equal(c.window.LerenLessonWidgets.getLanguage(),'fr');
 console.log('PASS: host voice bridge honors Auto off/on and always permits explicit playback');
}
