const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),sw=read('sw.js');
const ctx=vm.createContext({console,localStorage:{getItem:()=>null,setItem(){}}});
vm.runInContext(read('modules/word-builder/art.js'),ctx);vm.runInContext(read('modules/word-builder/game.js'),ctx);
const {LerenWordArt:art,LerenWordBuilder:wb}=ctx;
const words=wb.WORDS.map(w=>w[0]);
assert.equal(new Set(words).size,words.length,'Words must be unique');
assert.deepEqual([...art.keys].sort(),[...words].sort(),'Every word needs exactly one illustration');
for(const w of wb.WORDS){
 assert(/^[a-z]+$/.test(w[0]),'Single lowercase word without spaces: '+w[0]);
 assert(['de','het'].includes(w[1]),'Article for '+w[0]);
 for(let i=3;i<7;i++)assert(w[i]&&w[i].trim(),'Translation '+i+' for '+w[0]);
 assert(!/[Ѐ-ӿ]/.test(w[6])&&/[؀-ۿ]/.test(w[6]),'Arabic translation must be Arabic: '+w[0]);
 const svg=art.svg(w[0],w[3]);assert(svg.startsWith('<svg')&&svg.includes('viewBox="0 0 160 120"'));
 assert(!svg.toLowerCase().includes('>'+w[0]+'<'),'The picture must not spell the answer: '+w[0]);
}
for(const l of ['uk','en','fr','ar']){const t=wb.tr(l);for(const k of ['title','sub','ask','hint','hintLetter','erase','wrong','show','right','plural','next','done','again','other'])assert(t[k],l+'.'+k)}
assert(html.includes('["wb","🔤",true]')&&html.includes('wb:wbStart'),'Game must be registered in Games');
const files=JSON.parse(sw.match(/const APP_FILES = (\[[^;]+\]);/)[1]);
for(const [f,v] of [['art.js',114],['game.js',114],['style.css',113]])assert(files.includes('./modules/word-builder/'+f+'?v='+v)&&html.includes('./modules/word-builder/'+f+'?v='+v),'Offline asset '+f);
assert(files.includes('./img/games/wb-v114.webp')&&fs.existsSync('img/games/wb-v114.webp'));
console.log('PASS: '+words.length+' illustrated words with articles, plurals and 4 languages; registered game, offline assets');
