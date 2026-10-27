const assert=require('node:assert/strict'),fs=require('node:fs');
const files=new Set();
for(const [path,start] of [['modules/emoji/cards.js','globalThis.LerenCard3D'],['modules/emoji/renderer.js','const exact']]){const s=fs.readFileSync(path,'utf8'),i=s.indexOf(start),seg=s.slice(i,s.indexOf('};',i));for(const m of seg.matchAll(/"[^"]+":"([a-z0-9-]+)"/g))files.add(m[1])}
assert(files.size>300,'maps parsed');
for(const f of files)assert(fs.existsSync('img/emoji/'+f+'.png'),'missing picture img/emoji/'+f+'.png');
const fx=[...files].filter(f=>f.startsWith('fx-'));assert(fx.length>=200,'complete replacement pictures in use');
assert(fs.existsSync('img/emoji/FLUENT-LICENSE.txt'),'MIT licence for the Fluent pictures is shipped');
console.log('PASS: '+files.size+' mapped pictures exist ('+fx.length+' complete Fluent 3D replacements, MIT licence present)');
