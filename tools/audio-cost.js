// Estimate of the Azure text-to-speech cost for the texts that still have no recording.
// Compares audio/nl/texts.tsv with the .m4a files on this computer. Counts billable characters the way Azure does: the text inside SSML plus every tag except <speak> and <voice>
// (tools/make-audio-azure.sh wraps each text in <prosody rate='…'>, and escapes & < >).
// Usage: node tools/audio-cost.js [price per 1M characters in USD, default 16] [free characters per month, default 500000]
const fs=require('fs');
const price=Number(process.argv[2]||16),free=Number(process.argv[3]||500000),rate='-10%';
const texts=fs.readFileSync('audio/nl/texts.tsv','utf8').split('\n').filter(Boolean).map(l=>l.split('\t'));
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const billable=t=>(`<prosody rate='${rate}'>`+esc(t)+'</prosody>').length;
const rows=[];
for(const [dir,voice] of [['audio/nl','nl-BE-ArnaudNeural (Peter)'],['audio/nl-f','nl-BE-DenaNeural (Dafna)']]){
 // Recordings on this computer count (also ones not committed yet); the manifest is only a fallback.
 const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith('.m4a')&&!f.startsWith('.')).map(f=>f.slice(0,-4)):[];
 const have=new Set(files.length?files:JSON.parse(fs.readFileSync(dir+'/manifest.json','utf8')));
 const missing=texts.filter(([h])=>!have.has(h)),chars=missing.reduce((n,[,t])=>n+t.length,0),bill=missing.reduce((n,[,t])=>n+billable(t),0);
 rows.push({voice,missing:missing.length,textChars:chars,billable:bill});
}
const total=rows.reduce((n,r)=>n+r.billable,0),paid=Math.max(0,total-free);
for(const r of rows)console.log(`${r.voice}: ${r.missing} texts, ${r.textChars} text characters, ${r.billable} billable characters`);
console.log(`Total billable: ${total} characters (both voices)`);
if(free>0)console.log(`Free tier F0 (${free} per month): ${total<=free?'fits in one month, cost 0':'needs '+Math.ceil(total/free)+' months, or '+paid+' paid characters'}`);
console.log(`Standard tier S0 at $${price} per 1M: $${(total/1e6*price).toFixed(2)} for everything ($${(rows[0].billable/1e6*price).toFixed(2)} for Peter only)`);
console.log(`Requests: ${rows.reduce((n,r)=>n+r.missing,0)}; at about 20 per minute on F0 ≈ ${Math.ceil(rows.reduce((n,r)=>n+r.missing,0)/20)} minutes`);
