// The AI teacher's voice follows the chosen teacher: Peter -> male voice, Dafna -> female voice (device voices, as AI replies are not pre-recorded).
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!f.startsWith(root)||!fs.existsSync(f)){res.statusCode=404;return res.end()}if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 try{
  const ctx=await browser.newContext({serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(()=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_voice_force_tts','true');localStorage.setItem('leren_voice_nl','x');
   const V=[['Xander','nl-NL'],['Ellen','nl-BE'],['Samantha','en-US']].map(([name,lang])=>({name,lang,voiceURI:name,default:false,localService:true}));
   window.__spoken=[];const s={speaking:false,pending:false,getVoices:()=>V,speak:u=>{window.__spoken.push({voice:u.voice&&u.voice.name,pitch:u.pitch});setTimeout(()=>u.onstart&&u.onstart(),0);setTimeout(()=>u.onend&&u.onend(),5)},cancel(){},resume(){},addEventListener(){}};
   Object.defineProperty(window,'speechSynthesis',{value:s,configurable:true});
   window.SpeechSynthesisUtterance=function(t){this.text=t;this.pitch=1;this.rate=1;this.addEventListener=(e,f)=>{if(e==='start')this.onstart=f}};
  });
  await page.goto(base);await page.waitForFunction(()=>window.learningPath);await page.mouse.click(5,5);
  const speak=async ch=>{await page.evaluate(c=>{lsSet('leren_char',c);lsSet('leren_rec_voice','');lsSet('leren_voice_force_tts',true);lsSet('leren_voice_nl','');window.__spoken.length=0;sayTTS('Hallo, ik ben je leraar.')},ch);await page.waitForTimeout(100);return page.evaluate(()=>window.__spoken[0])};
  const p=await speak('peter'),d=await speak('dafna');
  assert.equal(p.voice,'Xander','Peter speaks with the male voice');assert.equal(d.voice,'Ellen','Dafna speaks with the female voice');
  // only one Dutch voice available: the pitch still differs
  await page.evaluate(()=>{speechSynthesis.getVoices=()=>[{name:'Dutch',lang:'nl-NL',voiceURI:'Dutch'}];refreshSpeechVoices()});
  const p2=await speak('peter'),d2=await speak('dafna');assert(p2.pitch<1&&d2.pitch>1,'pitch differs with a single Dutch voice');
  assert.deepEqual(errors,[]);console.log('PASS: teacher voice follows Peter (male) / Dafna (female)');
 }finally{await browser.close();server.close()}
})();
