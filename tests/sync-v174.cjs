// Account sync of the v174 data between two devices, with the app's real merge (index.html syncMerge/syncable).
// Nothing is summed: each side's better value is kept, both courses and all days survive, device-only keys stay local.
// Run: node tests/sync-v174.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({});vm.runInContext(fs.readFileSync('modules/sync/merge.js','utf8')+'\n'+script.slice(script.indexOf('const SYNC_SKIP='),script.indexOf('function syncApply('))+'\nglobalThis.S={syncable,syncMerge};',c);const x=c.S;
const J=JSON.stringify,P=s=>JSON.parse(s);
// Last agreed copy (base), then each device studied on its own.
const base={leren_goal_min:'10',poly_streak:J({n:3,last:'2026-10-31',best:3}),leren_minutes_v1:J({days:{'2026-10-31':700}}),
 leren_skills_v1:J({a11:{lezen:{ok:8,n:10,r:'1111111100'},luisteren:{ok:0,n:0,r:''},schrijven:{ok:0,n:0,r:''},spreken:{n:1}}}),
 leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z'}}),poly_toetsbest:J({course_comm_v2:7}),leren_exam12:J({best:{lezen:60}})};
const phone={...base,leren_goal_min:'15',poly_streak:J({n:5,last:'2026-11-02',best:5}),leren_minutes_v1:J({days:{'2026-10-31':700,'2026-11-01':650,'2026-11-02':300}}),
 leren_skills_v1:J({a11:{lezen:{ok:12,n:15,r:'111111110011111'},luisteren:{ok:0,n:0,r:''},schrijven:{ok:0,n:0,r:''},spreken:{n:4}}}),
 leren_slips_v1:J({a11:{omdat:'0101'}}),leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z','streak-3':'2026-11-02T08:00:00.000Z'}}),
 leren_backup_at:'1793700000000',leren_persist_asked:'true'};
const laptop={...base,poly_streak:J({n:4,last:'2026-11-01',best:6}),leren_minutes_v1:J({days:{'2026-10-31':700,'2026-11-02':420}}),
 leren_skills_v1:J({a11:{lezen:{ok:8,n:10,r:'1111111100'},luisteren:{ok:0,n:0,r:''},schrijven:{ok:0,n:0,r:''},spreken:{n:1}},a12:{lezen:{ok:9,n:10,r:'1111111110'},luisteren:{ok:3,n:4,r:'1110'},schrijven:{ok:0,n:0,r:''},spreken:{n:2}}}),
 leren_achievements_v1:J({version:1,earned:{'xp-100':'2026-10-01T10:00:00.000Z','words-50':'2026-11-01T19:00:00.000Z'}}),poly_toetsbest:J({course_comm_v2:9}),leren_exam12:J({best:{lezen:80,proef:65}})};
// Device-only keys are never sent.
for(const k of ['leren_backup_at','leren_persist_asked'])assert.equal(x.syncable(k),false,k);
for(const k of ['leren_goal_min','leren_minutes_v1','leren_skills_v1','leren_slips_v1','poly_streak','leren_achievements_v1'])assert.equal(x.syncable(k),true,k);
const cloudFromLaptop=Object.fromEntries(Object.entries(laptop).filter(([k])=>x.syncable(k)));
const m=x.syncMerge(base,phone,cloudFromLaptop);
assert.equal(m.leren_backup_at,undefined);assert.equal(m.leren_persist_asked,undefined);
assert.equal(m.leren_goal_min,'15','goal changed on one device');
assert.deepEqual(P(m.poly_streak),{n:5,last:'2026-11-02',best:6},'streak: current from the phone, best from the laptop');
assert.deepEqual(P(m.leren_minutes_v1).days,{'2026-10-31':700,'2026-11-01':650,'2026-11-02':420},'every day kept, the larger value per day');
const sk=P(m.leren_skills_v1);assert.equal(sk.a11.lezen.n,15);assert.equal(sk.a11.spreken.n,4);assert.equal(sk.a12.lezen.n,10,'A1.2 from the laptop kept');assert.equal(sk.a12.luisteren.n,4);
assert.equal(P(m.leren_slips_v1).a11.omdat,'0101');
assert.deepEqual(Object.keys(P(m.leren_achievements_v1).earned).sort(),['streak-3','words-50','xp-100'],'badges from both devices');
assert.equal(P(m.leren_achievements_v1).earned['xp-100'],'2026-10-01T10:00:00.000Z','old date kept');
assert.deepEqual(P(m.poly_toetsbest),{course_comm_v2:9});assert.deepEqual(P(m.leren_exam12).best,{lezen:80,proef:65});
// The merge is the same seen from the other device (no device wins by order).
const m2=x.syncMerge(base,cloudFromLaptop,Object.fromEntries(Object.entries(phone).filter(([k])=>x.syncable(k))));
for(const k of ['poly_streak','leren_minutes_v1','leren_goal_min','leren_achievements_v1','poly_toetsbest','leren_exam12'])assert.deepEqual(P(m2[k]),P(m[k]),'symmetric: '+k);
// A device still on v173 (it does not know the new keys) keeps them in the cloud copy instead of dropping them.
// v173 never writes these keys: it either has none of them, or holds the copy of its last sync unchanged.
const NEW=['leren_goal_min','leren_minutes_v1','leren_skills_v1','leren_slips_v1'];
const fresh={...base};for(const k of NEW)delete fresh[k];const m3=x.syncMerge({},fresh,m);
for(const k of NEW)assert.equal(m3[k],m[k],'an old device without the keys keeps them: '+k);
const lastSync=Object.fromEntries(Object.entries(phone).filter(([k])=>x.syncable(k))),m4=x.syncMerge(lastSync,lastSync,m);
for(const k of NEW)assert.equal(m4[k],m[k],'an old device with an unchanged copy takes the newer one: '+k);
// The merged values are valid for the app's own readers.
const ictx=vm.createContext({});ictx.globalThis=ictx;vm.runInContext(fs.readFileSync('modules/insights/core.js','utf8'),ictx);const I=ictx.LerenInsights;
assert.equal(I.goal(P(m.leren_goal_min)),15);assert.equal(I.streakView(P(m.poly_streak),'2026-11-02').n,5);assert.equal(I.minutesOn(P(m.leren_minutes_v1),'2026-11-02'),7);
assert.equal(I.summary(P(m.leren_skills_v1),'a12',P(m.leren_exam12)).lezen.exam,80);
console.log('PASS: v174 data syncs between two devices: goal, streak (best kept), minutes per day, skills of both courses, slips, badges from both sides, tests and exams; device-only keys stay local; same result from either device; an old v173 device keeps the new keys');
