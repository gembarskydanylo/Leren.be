// Data safety (audit audits/v174-data-safety-2026-11-02.md): merging a phone and a computer that worked at the same time,
// repeated syncs, old (v2), current (v3) and checked (v4) backups, damaged backups, all-or-nothing writes.
// Uses the real modules/sync/merge.js and the app's own syncMerge from index.html. Run: node tests/sync-safety.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({console,TextEncoder,crypto:globalThis.crypto});c.globalThis=c;
vm.runInContext(read('modules/sync/merge.js')+'\n'+script.slice(script.indexOf('const SYNC_SKIP='),script.indexOf('function syncApply('))+'\nglobalThis.S={syncable,syncMerge};',c);
const M=c.LerenMerge,{syncMerge,syncable}=c.S,J=JSON.stringify,P=s=>JSON.parse(s),same=(a,b,m)=>assert.equal(J(a),J(b),m);
const today='2026-11-02';
// One sync round as the app does it: both devices start from the same cloud copy (base), work offline, then the phone
// syncs (cloud := merge), then the computer syncs against the new cloud copy.
function round(base,phone,laptop){const cloud1=syncMerge(base,phone,base),cloud2=syncMerge(base,laptop,cloud1),phoneAgain=syncMerge(cloud1,cloud1,cloud2);return {cloud:cloud2,phone:phoneAgain}}

(async()=>{
 // ---- 1. XP: independent events add up, record grants count once, nothing doubles on repeated merges.
 {let x=M.xpAbsorb({},500);assert.equal(M.xpTotal(x),500,'old points become the base');assert.equal(M.xpTotal(M.xpAbsorb(x,500)),500,'absorbing again adds nothing');
  const base={leren_xp_v2:J(x),poly_score:'500'};
  let a=M.xpAdd(x,'dA',today,30);a=M.xpAdd(a,'dA',today,10,'p:comm:basis:0');a=M.xpAdd(a,'dA',today,100,'w:2026-W45');
  let b=M.xpAdd(x,'dB',today,20);b=M.xpAdd(b,'dB',today,10,'p:comm:basis:0');b=M.xpAdd(b,'dB',today,100,'w:2026-W45');b=M.xpAdd(b,'dB',today,15,'t:course_comm_v2');
  const phone={...base,leren_xp_v2:J(a),poly_score:String(M.xpTotal(a))},laptop={...base,leren_xp_v2:J(b),poly_score:String(M.xpTotal(b))};
  const r=round(base,phone,laptop),tot=M.xpTotal(P(r.cloud.leren_xp_v2));
  assert.equal(tot,500+30+20+10+100+15,'answers from both devices add; the same lesson record and weekly bonus count once');
  assert.equal(M.xpTotal(P(r.phone.leren_xp_v2)),tot,'both devices end with the same total');
  const again=syncMerge(r.cloud,r.cloud,r.cloud);assert.equal(M.xpTotal(P(again.leren_xp_v2)),tot,'a repeated sync adds nothing');
  const twice=syncMerge({},syncMerge({},r.cloud,phone),phone);assert.equal(M.xpTotal(P(twice.leren_xp_v2)),tot,'merging the same old copy twice adds nothing');
  // An app still on v174 raised poly_score by 40 without the ledger: counted once, on every device.
  const old={...r.cloud,poly_score:String(tot+40)},m=syncMerge(r.cloud,r.cloud,old);
  assert.equal(M.xpTotal(M.xpAbsorb(P(m.leren_xp_v2),Number(m.poly_score))),tot+40);
  assert.equal(M.xpTotal(M.xpAbsorb(M.xpAbsorb(P(m.leren_xp_v2),Number(m.poly_score)),Number(m.poly_score))),tot+40,'absorbed once');}

 // ---- 2. Minutes, skills, slips: per device, both courses, summed without doubling.
 {const base={leren_minutes_v2:J({v:2,dev:{}}),leren_skills_v2:J({v:2,dev:{}})};
  let ma=M.minutesAdd({},'dA',today,300e3),mb=M.minutesAdd({},'dB',today,240e3);mb=M.minutesAdd(mb,'dB','2026-11-01',600e3);
  let sa={},sb={};for(let i=0;i<5;i++)sa=M.skillAdd(sa,'dA','a11','lezen',true,1000+i);for(let i=0;i<3;i++)sb=M.skillAdd(sb,'dB','a12','lezen',i>0,2000+i);sb=M.skillAdd(sb,'dB','a11','lezen',false,3000);sb=M.skillAdd(sb,'dB','a11','spreken',null,3001);
  let la=M.slipAdd({},'dA','a11','omdat',false,10),lb=M.slipAdd({},'dB','a11','omdat',false,20);
  const r=round(base,{...base,leren_minutes_v2:J(ma),leren_skills_v2:J(sa),leren_slips_v2:J(la)},{...base,leren_minutes_v2:J(mb),leren_skills_v2:J(sb),leren_slips_v2:J(lb)});
  const mv=M.minutesView(P(r.cloud.leren_minutes_v2));same(mv.days,{'2026-11-01':600,'2026-11-02':540},'5 + 4 minutes on the same day');
  const sv=M.skillsView(P(r.cloud.leren_skills_v2));same([sv.a11.lezen.n,sv.a11.lezen.ok,sv.a11.lezen.r,sv.a12.lezen.n,sv.a12.lezen.ok,sv.a11.spreken.n],[6,5,'111110',3,2,1],'A1.1 and A1.2 answers of both devices, in time order');
  same(M.slipsView(P(r.cloud.leren_slips_v2)).a11.omdat,'00','both slips');
  const again=syncMerge(r.cloud,r.cloud,r.phone);same(M.skillsView(P(again.leren_skills_v2)),sv,'repeat: no doubling');same(M.minutesView(P(again.leren_minutes_v2)),mv);
  // v174 data (v1 keys) is one legacy part on every device, so two devices reading it count it once.
  const legacy=M.skillsFromV1({a11:{lezen:{ok:8,n:10,r:'1111111100'}}});
  same(M.skillsView(M.skillsMerge(M.skillsMerge(sa,legacy),M.skillsMerge(sb,legacy))).a11.lezen.n,16,'legacy 10 + 5 + 1');
  same(M.minutesView(M.minutesMerge(M.minutesFromV1({days:{[today]:120}}),M.minutesFromV1({days:{[today]:120}}))).days[today],120);}

 // ---- 3. Words: the newer answer decides the schedule; answers of both devices are counted.
 {const base={poly_progress:J({w1:{seen:1,correct:1,wrong:0,streak:1,due:5,known:false,t:100}})};
  const phone={poly_progress:J({w1:{seen:2,correct:1,wrong:1,streak:0,due:300,known:false,t:300}})},laptop={poly_progress:J({w1:{seen:2,correct:2,wrong:0,streak:2,due:900,known:true,t:200},w2:{seen:1,correct:1,wrong:0,streak:1,due:50,known:false,t:250}})};
  const w=P(round(base,phone,laptop).cloud.poly_progress);
  same([w.w1.streak,w.w1.due,w.w1.known,w.w1.t],[0,300,false,300],'the later mistake on the phone decides: review again now');
  same([w.w1.seen,w.w1.correct,w.w1.wrong],[3,2,1],'one answer on each device: both counted');assert(w.w2,'new word from the computer');
  const no=M.wordMerge(undefined,{seen:2,correct:2,wrong:0,streak:2,due:9,known:true},{seen:3,correct:2,wrong:1,streak:0,due:4,known:false});same([no.seen,no.streak,no.due,no.known],[3,2,9,true],'old saves without time: field by field, never lower');}

 // ---- 4. Route: different lessons, both courses, sessions stay on their device.
 {const route=(o)=>J({version:1,started:true,entry:'a',completed:{},mistakes:[],session:null,placement:null,course:'A1.1',entries:{},parked:{},...o});
  const base={leren_path_v1:route({completed:{'comm:basis:0':5},entries:{'A1.1':'comm:basis:0'},mistakes:['m1','m2']})};
  const phone={leren_path_v1:route({completed:{'comm:basis:0':5,'comm:basis:5':4},entries:{'A1.1':'comm:basis:0'},mistakes:['m2','m3'],session:{kind:'lesson',lesson:'comm:basis:10'},course:'A1.1'})};
  const laptop={leren_path_v1:route({completed:{'comm:basis:0':5,'wonen:huis:0':5},entries:{'A1.1':'comm:basis:0','A1.2':'wonen:huis:0'},mistakes:['m1','m2','m4'],course:'A1.2',session:{kind:'lesson',lesson:'wonen:huis:5'},parked:{'A1.1':{kind:'lesson'}}})};
  const r=round(base,phone,laptop),c1=P(r.cloud.leren_path_v1),p1=P(r.phone.leren_path_v1);
  same(Object.keys(c1.completed).sort(),['comm:basis:0','comm:basis:5','wonen:huis:0'],'lessons of both devices and both courses');
  same(c1.entries,{'A1.1':'comm:basis:0','A1.2':'wonen:huis:0'},'per-course route positions');
  same(c1.mistakes.sort(),['m2','m3','m4'],'m1 fixed on the phone stays fixed; m2 still open on both; m3 and m4 new');
  same([p1.session.lesson,p1.course],['comm:basis:10','A1.1'],'the phone keeps its own open lesson and course');same([c1.session.lesson,c1.course],['wonen:huis:5','A1.2'],'the computer keeps its own');}

 // ---- 5. Exams, tests, streak, rewards, weekly games.
 {const base={leren_exam12:J({best:{lezen:60},sp:{zorg:[0]}}),poly_toetsbest:J({t1:5}),poly_streak:J({n:3,last:'2026-10-31',best:3}),leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z'}}),leren_week:J({w:'2026-W45',played:['bl'],done:false})};
  const phone={leren_exam12:J({best:{lezen:80},sp:{zorg:[0,1]},run:{lezen:{i:3}}}),poly_toetsbest:J({t1:7}),poly_streak:J({n:4,last:'2026-11-01',best:4}),leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z','streak-3':'2026-11-01T08:00:00.000Z'}}),leren_week:J({w:'2026-W45',played:['bl','mm','dc'],done:false})};
  const laptop={leren_exam12:J({best:{lezen:70,proef:65},sp:{zorg:[0],werk:[2]},run:{proef:{i:9}}}),poly_toetsbest:J({t1:6,t2:9}),poly_streak:J({n:9,last:'2026-10-20',best:9}),leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z','streak-3':'2026-10-30T08:00:00.000Z','words-50':'2026-11-02T08:00:00.000Z'}}),leren_week:J({w:'2026-W45',played:['bl','om','ks'],done:true})};
  const r=round(base,phone,laptop),c1=r.cloud;
  same(P(c1.leren_exam12).best,{lezen:80,proef:65});same(P(c1.leren_exam12).sp,{zorg:[0,1],werk:[2]});same(P(c1.leren_exam12).run,{proef:{i:9}},'a running exam part stays on its device');
  same(P(c1.poly_toetsbest),{t1:7,t2:9});
  same(P(c1.poly_streak),{n:4,last:'2026-11-01',best:9},'the live streak (latest day) wins; an old longer streak only raises the best');
  same(P(c1.leren_achievements_v1).earned,{'xp-100':'2026-10-01T10:00:00.000Z','streak-3':'2026-10-30T08:00:00.000Z','words-50':'2026-11-02T08:00:00.000Z'},'all badges, the first date');
  same(P(c1.leren_week),{w:'2026-W45',played:['bl','om','ks','mm','dc'],done:true});}

 // ---- 6. Backups: v2 never lowers newer progress; damaged files change nothing; v3/v4 accepted; restoring twice adds nothing.
 {const now={poly_score:'900',poly_progress:J({w1:{seen:9,correct:8,wrong:1,streak:4,due:9e12,known:true,t:500}}),leren_path_v1:J({version:1,started:true,completed:{a:5,b:5},mistakes:[]}),leren_path_rewards_v1:J({a:5,b:5}),
   leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-01-01T00:00:00.000Z','lesson-5':'2026-10-01T00:00:00.000Z'}}),leren_xp_v2:J(M.xpAbsorb({},900)),poly_toetsbest:J({t1:9})};
  const v2=J({v:2,score:300,store:{w1:{seen:2,correct:1,wrong:1,streak:0,due:0,known:false},w9:{seen:1,correct:1,wrong:0,streak:1,due:1,known:false}},companion:{leren_path_v1:{version:1,started:true,completed:{a:3,c:5},mistakes:[]},leren_path_rewards_v1:{a:3,c:5},leren_achievements_v1:{version:1,earned:{'xp-100':'2025-12-01T00:00:00.000Z'}}}});
  const r=await M.readBackup(v2,syncable);assert(r.ok,r.error);
  const m=syncMerge({},now,{...now,...r.keys});
  assert.equal(m.poly_score,'900','points not lowered');const w=P(m.poly_progress);same([w.w1.seen,w.w1.streak,w.w1.known],[9,4,true],'newer word state kept');assert(w.w9,'words only in the backup added');
  same(P(m.leren_path_v1).completed,{a:5,b:5,c:5},'better lesson result kept, extra lesson added');same(P(m.leren_path_rewards_v1),{a:5,b:5,c:5});
  assert.equal(P(m.leren_achievements_v1).earned['lesson-5'],'2026-10-01T00:00:00.000Z');assert.equal(m.poly_toetsbest,now.poly_toetsbest,'tests untouched');
  const m2=syncMerge({},m,{...m,...r.keys});same(m2,m,'restoring the same backup again changes nothing');
  // v4: built by the app, checked by digest.
  const b4=await M.buildBackup(m),t4=J(b4);assert((await M.readBackup(t4,syncable)).ok);
  const bad=[['truncated',t4.slice(0,t4.length-20)],['edited value',J({...b4,keys:{...b4.keys,poly_score:'99999'}})],['wrong count',J({...b4,n:1})],['not a backup',J({hello:1})],['empty',''],
   ['bad route',J({app:'leren.be',v:3,keys:{leren_path_v1:J({completed:{a:'five'}})}})],['bad words',J({app:'leren.be',v:3,keys:{poly_progress:J({w1:{seen:'many'}})}})],['bad score v2',J({v:2,score:-5,store:{}})],
   ['bad json value',J({app:'leren.be',v:3,keys:{poly_streak:'{oops'}})],['too large',J({app:'leren.be',v:3,keys:{poly_ui:'x'.repeat(M.MAX_BACKUP)}})]];
  for(const [name,t] of bad)assert.equal((await M.readBackup(t,syncable)).ok,false,'rejected: '+name);
  const v3=await M.readBackup(J({app:'leren.be',v:3,ts:1,keys:{poly_score:'10',leren_device_id:'dX',poly_toetsbest:J({t1:1})}}),syncable);
  assert(v3.ok);assert.equal(v3.keys.leren_device_id,undefined,'device-only keys are never restored');}

 // ---- 7. All or nothing: a storage error puts every value back.
 {const store={a:'1',b:'2'};let n=0;const storage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{if(++n===3)throw Error('QuotaExceeded');store[k]=v},removeItem:k=>{delete store[k]}};
  assert.equal(M.applyAll(storage,{a:'10',c:'30',b:'20'}),false);same(store,{a:'1',b:'2'},'nothing changed');
  n=-99;assert.equal(M.applyAll(storage,{a:'10',c:'30'}),true);same(store,{a:'10',b:'2',c:'30'});}

 // ---- 8. App wiring.
 {for(const k of ['leren_device_id','leren_sync_uid','leren_sync_base','leren_backup_at'])assert.equal(syncable(k),false,k);
  for(const k of ['leren_xp_v2','leren_minutes_v2','leren_skills_v2','leren_slips_v2'])assert.equal(syncable(k),true,k);
  for(const s of ['addXP(gain,"p:"+id)','addXP(gain,test?"t:"+test.id:undefined)','addXP(100,"w:"+w.w)','addXP(gain,"dp:"+kind)'])assert(html.includes(s),s);
  assert(read('modules/exam/exam-core.js').includes('addXP(xp,"x:"+KEY+":"+s.part)'));
  assert(html.includes('if(blob.length>=SYNC_MAX)return syncFail("size")')&&/blob\.size\(\) < 900000/.test(read('firestore.rules')),'cloud size limit checked before sending');
  assert(/lsSet\("leren_sync_base",cloud\)/.test(html),'the cloud copy becomes the base right after the merge');}
 console.log('PASS: two devices at once (XP events add, record grants and weekly bonus once, minutes/skills/slips per device in both courses, newer answer per word with both answers counted, route lessons and per-course positions, local sessions, exams/tests/streak/badges/weekly games), repeated syncs and restores add nothing, v2 backups never lower newer progress, 10 kinds of damaged backups rejected, all-or-nothing writes');
})().catch(e=>{console.error(e);process.exit(1)});
