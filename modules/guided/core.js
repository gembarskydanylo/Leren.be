/* TEST-050 Guided Learning: learner profile, preferred name and today's study session. No DOM, no network.

   Storage (localStorage):
   - leren_profile_v1   {v, goals[], pace, namePrompt, onboarded, source}. Synced with the account like other settings.
   - leren_learner_name {name, forAI}. DEVICE ONLY: app.js lists it in SYNC_SKIP, so it never reaches Firestore or a backup
     file. forAI is a separate consent: without it the name is used only in texts built on the device.
   - leren_today_v1     today's session plan {v, date, course, steps[], idx, paid[], ...}. Device only (SYNC_SKIP).
   Existing keys (XP, route, achievements, languages, voices) are never written here. */
(() => {
 'use strict';
 const PROFILE_KEY='leren_profile_v1',NAME_KEY='leren_learner_name',TODAY_KEY='leren_today_v1';
 const GOALS=['belgium','work','study','social','travel','self'],PACES=['calm','balanced','intensive'],GOAL_MIN=[5,10,15,20,30];
 const MINUTES={review:2,lesson:6,practice:2};
 const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const parse=s=>{try{return JSON.parse(s)}catch{return null}};
 const get=(storage,k)=>{try{return storage.getItem(k)}catch{return null}};
 const set=(storage,k,v)=>{try{storage.setItem(k,v);return true}catch{return false}};
 const del=(storage,k)=>{try{storage.removeItem(k)}catch{}};
 const day=(now=new Date())=>now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');

 // ---- Name: any script (Unicode), trimmed, NFC, no control/bidi-override characters, no markup brackets, ≤ 40 characters.
 // ZWJ/ZWNJ (U+200C/U+200D) stay: some scripts and emoji need them.
 const ESC=c=>String.fromCharCode(92)+'u'+c.toString(16).padStart(4,'0');
 const BAD=new RegExp('['+[[0x0,0x1f],[0x7f,0x9f],[0x200b,0x200b],[0x200e,0x200f],[0x2028,0x2029],[0x202a,0x202e],[0x2066,0x2069],[0xfeff,0xfeff]].map(([x,y])=>ESC(x)+(x===y?'':'-'+ESC(y))).join('')+'<>{}'+String.fromCharCode(92)+'['+String.fromCharCode(92)+']'+String.fromCharCode(92,92)+'`]','g');
 function cleanName(raw){
  let s=String(raw??'');try{s=s.normalize('NFC')}catch{}
  s=s.replace(BAD,'').replace(/\s+/g,' ').trim();
  const cp=[...s];if(cp.length>40)s=cp.slice(0,40).join('').trim();
  return s;
 }
 function name(storage){const o=parse(get(storage,NAME_KEY));if(!obj(o))return {name:'',forAI:false};const n=cleanName(o.name);return {name:n,forAI:!!n&&o.forAI===true}}
 function setName(storage,raw,forAI=false){const n=cleanName(raw);if(!n){del(storage,NAME_KEY);return ''}return set(storage,NAME_KEY,JSON.stringify({name:n,forAI:forAI===true}))?n:''}
 function setForAI(storage,on){const cur=name(storage);if(!cur.name)return false;return set(storage,NAME_KEY,JSON.stringify({name:cur.name,forAI:on===true}))}
 function clearName(storage){del(storage,NAME_KEY)}

 // ---- Profile
 function cleanProfile(o){
  o=obj(o)?o:{};
  return {v:1,goals:Array.isArray(o.goals)?[...new Set(o.goals.filter(g=>GOALS.includes(g)))]:[],pace:PACES.includes(o.pace)?o.pace:'balanced',
   namePrompt:['later','done'].includes(o.namePrompt)?o.namePrompt:null,onboarded:typeof o.onboarded==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(o.onboarded)?o.onboarded:null,
   source:['new','existing'].includes(o.source)?o.source:null};
 }
 function profile(storage){const raw=parse(get(storage,PROFILE_KEY));return {...cleanProfile(raw),exists:obj(raw)}}
 function saveProfile(storage,patch){const cur=cleanProfile(parse(get(storage,PROFILE_KEY)));const next=cleanProfile({...cur,...(obj(patch)?patch:{})});return set(storage,PROFILE_KEY,JSON.stringify(next))?next:null}
 // The one-time «we already know each other» question: an existing learner, no name yet, never answered.
 function askName(storage,existing){return !!existing&&!name(storage).name&&!profile(storage).namePrompt}

 // ---- Today's session: review → new material → practice, sized to the daily goal and the chosen pace.
 // Lesson steps carry no lesson id until they start: the route decides the next lesson at that moment, so a plan never
 // points at a lesson the learner already finished elsewhere.
 function lessonCount(goal,pace){const g=GOAL_MIN.includes(Number(goal))?Number(goal):10;let n=g<=10?1:g<=20?2:3;if(pace==='calm')n=Math.max(1,n-1);if(pace==='intensive')n+=1;return n}
 /* input: {date, course, review:number of words for the warm-up (0 = none), paused:lesson id or null, goal, pace, practice:bool}
    → steps [{id, kind:'review'|'lesson'|'practice', lesson?:id, words?:n, min, done:false}] */
 function plan(input={}){
  const date=input.date||day(),pace=PACES.includes(input.pace)?input.pace:'balanced',steps=[];
  const add=(kind,extra={})=>{const n=steps.length;steps.push({id:date+':'+n+':'+kind,kind,min:MINUTES[kind],done:false,...extra})};
  if(input.review>0)add('review',{words:Math.min(5,input.review)});
  const lessons=lessonCount(input.goal,pace);
  for(let i=0;i<lessons;i++)add('lesson',i===0&&input.paused?{lesson:input.paused}:{});
  // Practice (the offline three-turn conversation of the lesson): skipped at the calm pace with the shortest goal.
  if(input.practice&&!(pace==='calm'&&Number(input.goal)<=5))add('practice');
  return steps;
 }
 function cleanToday(o,date){
  if(!obj(o)||o.v!==1||o.date!==date||!Array.isArray(o.steps)||!o.steps.length||o.steps.length>12)return null;
  const steps=o.steps.filter(s=>obj(s)&&typeof s.id==='string'&&['review','lesson','practice'].includes(s.kind)).map(s=>({id:s.id,kind:s.kind,min:Number(s.min)||MINUTES[s.kind],done:s.done===true,
   ...(typeof s.lesson==='string'?{lesson:s.lesson}:{}),...(Number.isFinite(s.words)?{words:s.words}:{}),...(obj(s.result)?{result:{correct:Math.max(0,s.result.correct|0),total:Math.max(0,s.result.total|0),gain:Math.max(0,s.result.gain|0)}}:{})}));
  if(steps.length!==o.steps.length)return null;
  return {v:1,date,course:typeof o.course==='string'?o.course:'',steps,paid:Array.isArray(o.paid)?o.paid.filter(x=>typeof x==='string'):[],badges:Array.isArray(o.badges)?o.badges.filter(x=>typeof x==='string'):[],round:Math.max(1,o.round|0)};
 }
 function today(storage,now){return cleanToday(parse(get(storage,TODAY_KEY)),day(now))}
 function save(storage,state){return set(storage,TODAY_KEY,JSON.stringify(state))}
 function start(storage,{steps,course='',badges=[],now,round=1}){const state={v:1,date:day(now),course,steps:steps.map(s=>({...s,done:false})),paid:[],badges:[...badges],round};save(storage,state);return state}
 // More of the same session («Continue learning» on the result screen): new steps after the finished ones, same day.
 function extend(storage,state,steps){if(!state)return null;const base=state.steps.length;state.steps.push(...steps.map((s,i)=>({...s,id:state.date+':'+(base+i)+':'+s.kind,done:false})));state.round=(state.round||1)+1;save(storage,state);return state}
 const current=state=>state?state.steps.find(s=>!s.done)||null:null;
 const position=state=>{if(!state)return null;const i=state.steps.findIndex(s=>!s.done);return {index:i<0?state.steps.length:i,total:state.steps.length}};
 const finished=state=>!!state&&state.steps.every(s=>s.done);
 function bind(storage,state,stepId,lessonId){const s=state?.steps.find(x=>x.id===stepId);if(!s||s.done)return false;s.lesson=lessonId;save(storage,state);return true}
 /* Marks a step done exactly once: a repeated call (double tap, reload, back button) changes nothing and returns false. */
 function complete(storage,state,stepId,result={}){
  const s=state?.steps.find(x=>x.id===stepId);if(!s||state.paid.includes(stepId))return false;
  s.done=true;s.result={correct:Math.max(0,result.correct|0),total:Math.max(0,result.total|0),gain:Math.max(0,result.gain|0)};state.paid.push(stepId);save(storage,state);return true;
 }
 function summary(state){const out={correct:0,total:0,gain:0,steps:0,minutes:0};if(!state)return out;for(const s of state.steps)if(s.done){out.steps++;out.minutes+=s.min;if(s.result){out.correct+=s.result.correct;out.total+=s.result.total;out.gain+=s.result.gain}}return out}
 function clear(storage){del(storage,TODAY_KEY)}

 globalThis.LerenGuided={PROFILE_KEY,NAME_KEY,TODAY_KEY,GOALS,PACES,GOAL_MIN,MINUTES,day,cleanName,name,setName,setForAI,clearName,profile,saveProfile,askName,lessonCount,plan,today,start,extend,current,position,finished,bind,complete,summary,clear};
})();
