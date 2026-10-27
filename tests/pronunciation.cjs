// Exercise real playback routing: bom and boom must keep their own clip and teacher.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let voice='peter',last;
class Audio {constructor(src){last=this;this.src=src}pause(){}play(){return Promise.resolve()}}
const ctx=vm.createContext({Audio,targetLang:'nl',window:{speechSynthesis:{cancel(){}}},updateSpeechState(){},lsGet:(k,f)=>k==='leren_char'?voice:f});
vm.runInContext('let speechToken=0;\n'+script.slice(script.indexOf('const audioNorm='),script.indexOf('// Device speech.')),ctx);
vm.runInContext('audioSets={m:new Set([audioHash("bom"),audioHash("boom"),audioHash("kat")]),f:new Set([audioHash("bom"),audioHash("boom"),audioHash("kat")])}',ctx);
assert.equal(ctx.audioHash('bom'),'7dc692a9');assert.equal(ctx.audioHash('boom'),'c79493aa');assert.notEqual(ctx.audioHash('bom'),ctx.audioHash('boom'));
for(const [teacher,folder] of [['peter','nl'],['dafna','nl-f']]){
 voice=teacher;
 for(const [word,hash] of [['bom','7dc692a9'],['boom','c79493aa']]){
  assert.equal(ctx.playRecorded(word),true);assert.equal(last.src,`audio/${folder}/pronunciation-v105/${hash}.m4a`);assert.equal(last.preservesPitch,true);
  const bytes=fs.readFileSync(last.src);assert(bytes.length>5000);assert.equal(bytes.toString('ascii',4,8),'ftyp');
 }
 ctx.playRecorded('kat');assert.equal(last.src,`audio/${folder}/${ctx.audioHash('kat')}.m4a`,'Other words retain their existing clips');
}
const files=JSON.parse(fs.readFileSync('sw.js','utf8').match(/const APP_FILES = (\[[^;]+\]);/)[1]);
for(const folder of ['nl','nl-f'])for(const h of ['7dc692a9','c79493aa'])assert(files.includes(`./audio/${folder}/pronunciation-v105/${h}.m4a`));
console.log('PASS: distinct bom/boom hashes, corrected Peter/Dafna routing, pitch preserved, existing words unchanged, four valid M4A assets and offline preloading');
