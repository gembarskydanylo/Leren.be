// Regression coverage for top desktop navigation and real audio-button state.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8');
function oneLine(name){const start=source.indexOf('function '+name+'(');assert(start>=0);return source.slice(start,source.indexOf('\n',start))}
function scrollCase(position,dockTop,nextBottom){const moves=[],ctx=vm.createContext({innerHeight:800,setTimeout:f=>f(),getComputedStyle:()=>({position}),window:{scrollBy:value=>moves.push(value)},$:id=>id==='nx'?{closest:()=>null,getBoundingClientRect:()=>({bottom:nextBottom})}:{getBoundingClientRect:()=>({top:dockTop})}});vm.runInContext(oneLine('revealNext')+';revealNext()',ctx);return moves}
assert.equal(scrollCase('sticky',100,700).length,0,'Top desktop navigation must not force a scroll after every answer');
assert.equal(scrollCase('fixed',700,650).length,0,'A visible Next button stays put');
assert.equal(scrollCase('fixed',700,780)[0].top,94,'Mobile Next moves just above the bottom dock');
const calls=[],button={},done=()=>{},bridge=source.match(/window\.LerenLessonWidgets=\{[\s\S]*?\n\};/)[0];
const ctx=vm.createContext({window:{},uiLang:'uk',targetLang:'nl',autoSpeech:false,say:(...args)=>calls.push(args)});vm.runInContext(bridge,ctx);
ctx.window.LerenLessonWidgets.speak('hallo',true,button,done);assert.equal(calls.length,0,'Automatic playback still respects the setting');
ctx.window.LerenLessonWidgets.speak('hallo',false,button,done);assert.equal(calls[0][0],'hallo');assert.equal(calls[0][1],button);assert.equal(calls[0][2],done,'The existing player receives the actual UI button and completion callback');
function element(){return {attrs:{},classList:{on:false,add(){this.on=true},remove(){this.on=false}},setAttribute(k,v){this.attrs[k]=v}}}
const old=element(),active=element(),state=vm.createContext({document:{querySelectorAll:()=>[old]},$:()=>null});vm.runInContext(oneLine('updateSpeechState'),state);state.updateSpeechState(true,active);assert.equal(active.classList.on,true);assert.equal(active.attrs['aria-busy'],'true');assert.equal(old.attrs['aria-busy'],'false');
console.log('PASS: stable desktop/mobile answer navigation, preserved Auto setting, actual player button/callback forwarding and accessible speaking state');

// First-time visitors must still load when browser storage is denied.
const denied=vm.createContext({localStorage:{getItem(){throw Error('denied')}}});const start=source.indexOf('const releaseFirstVisit=');vm.runInContext(oneLine('lsGet')+'\n'+source.slice(start,source.indexOf('\n',start))+';globalThis.first=releaseFirstVisit',denied);assert.equal(denied.first,true);
