// Collects every Dutch text the app can speak and writes audio/nl/texts.tsv ("hash<TAB>text").
// Usage (from the repo root, with a local server on :8765):  node tools/collect-audio-texts.js
const {chromium}=require("playwright");const fs=require("fs");
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto("http://localhost:8765/index.html");await p.waitForTimeout(500);
 const rows=await p.evaluate(()=>{
  targetLang="nl";const T=new Set(),add=t=>{t=String(t||"").trim();if(t&&/[a-z]/i.test(t))T.add(t)};
  Object.values(DATA).forEach(d=>(d.items||[]).forEach(it=>{add(it.nl);add(shown(it));add(labelFor(it));add(it.ex_nl);if(String(it.nl).includes("→"))add(it.nl.split("→")[0])}));
  (DATA.klanken?.items||[]).filter(x=>x.stem).forEach(x=>{
   const subs=x.nl==="hebben"?["ik","jij"]:["ik","jij","hij","Ana","mijn zoon"];
   subs.forEach(s=>add(s+" "+x.stem+((s!=="ik"&&!x.stem.endsWith("t"))?"t":"")));
   ["wij","jullie","mijn kinderen","Ana en Julia"].forEach(s=>add(s+" "+x.nl));
   add("ik "+x.stem+". wij "+x.nl)});
  VH_STORIES.forEach(st=>st.items.forEach(g=>{add(vhFill(g));add(g.v)}));
  Object.values(SEP).forEach(d=>add(sepFill(d)));
  SENT.forEach(s=>add(sentence(s)));
  TOETS.forEach(t=>t.questions.forEach(q=>add(toetsSpoken(q))));
  add(speechSampleText());
  return [...T].map(t=>[audioHash(t),t]);
 });
 const uniq=new Map(rows);
 fs.writeFileSync("audio/nl/texts.tsv",[...uniq].map(([h,t])=>h+"\t"+t.replace(/[\t\n]/g," ")).join("\n")+"\n");
 console.log("texts:",uniq.size);await b.close();
})();
