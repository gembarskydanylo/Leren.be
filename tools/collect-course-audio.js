// Collects every text the course player (modules/course-player) can speak for the new languages and writes
// audio/<lang>/texts.tsv ("hash<TAB>text") for tools/make-audio-azure.sh. Same hash as app.js audioHash().
// Texts: each card's target text, the exam listening and speaking prompts, and the first speaking model.
// Run from the repo root: node tools/collect-course-audio.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),ctx=vm.createContext({console});
for(const f of ['modules/courses/en.js','modules/courses/en12.js','modules/courses/en-exam.js','modules/courses/en-exam12.js','modules/courses/fr.js'])
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const norm=t=>String(t||'').trim().replace(/\s+/g,' ').toLowerCase();
function hash(t){let h=0x811c9dc5;const s=norm(t);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')}
for(const [lang,pack] of Object.entries(ctx.LerenCourseData)){
 const T=new Set(),add=t=>{t=String(t||'').trim();if(t)T.add(t)};
 for(const ch of pack.curriculum.chapters)for(const tab of ch[2])for(const w of pack.data[tab].items)add(w[pack.text]);
 for(const E of Object.values(ctx.LerenCourseExams||{}).filter(e=>e.lang===lang)){E.listening.forEach(i=>add(i.say));E.speaking.forEach(i=>{add(i.say);add(i.model.split(' / ')[0])})}
 const rows=new Map([...T].map(t=>[hash(t),t])),dir=path.join(root,'audio',lang);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'texts.tsv'),[...rows].map(([h,t])=>h+'\t'+t.replace(/[\t\n]/g,' ')).join('\n')+'\n');
 console.log(lang+': '+rows.size+' texts');
}
