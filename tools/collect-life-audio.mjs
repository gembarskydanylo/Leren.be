// Collects every Dutch text the LerenBe LIFE stories speak and writes audio/nl/life-texts.tsv ("hash<TAB>text") for
// tools/make-audio-azure.sh (both voices: Annick and the learner's phrases sound female/male via audio/nl-f and audio/nl).
// Same hash as app.js audioHash(). Run from the repo root: node tools/collect-life-audio.mjs
import fs from 'node:fs';
import {STORIES} from '../modules/learn-life/stories/index.mjs';
const norm=t=>String(t||'').trim().replace(/\s+/g,' ').toLowerCase();
const hash=t=>{let h=0x811c9dc5;const s=norm(t);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')};
const T=new Set(),add=t=>{t=String(t||'').trim();if(t)T.add(t)};
for(const story of STORIES)for(const sc of story.scenes)for(const st of sc.steps){
 add(st.nl);(st.options||[]).forEach(o=>add(o.nl));
 if(st.type==='find')for(const it of st.items){add(it.nl);if(st.ask.includes(it.id))add(it.q||'Waar is '+it.nl+'?')}}
const rows=new Map([...T].map(t=>[hash(t),t]));
fs.writeFileSync('audio/nl/life-texts.tsv',[...rows].map(([h,t])=>h+'\t'+t).join('\n')+'\n');
console.log('LIFE texts: '+rows.size);
