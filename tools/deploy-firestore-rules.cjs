// Deploy through the Rules API directly. The reminder service account does not
// have Service Usage permissions, which the Firebase CLI checks before deploy.
const fs=require('node:fs');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const admin=require('firebase-admin');

const source=fs.readFileSync('firestore.rules','utf8').trim();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12);
const at=revision=>cp.execFileSync('git',['show',revision+':firestore.rules'],{encoding:'utf8'}).trim();
const secret=process.env.FIREBASE_SA;
if(!secret)throw Error('FIREBASE_SA is not configured');
const serviceAccount=JSON.parse(secret);
if(serviceAccount.project_id!=='leren-be')throw Error('FIREBASE_SA belongs to a different project');
admin.initializeApp({credential:admin.credential.cert(serviceAccount),projectId:'leren-be'});

(async()=>{
 const service=admin.securityRules();
 const current=await service.getFirestoreRuleset();
 const live=(current.source||[]).map(file=>file.content).join('\n').trim();
 if(live===source){console.log('Firestore rules already match '+hash(source));return}
 // The bootstrap revision is the last committed rules before the review feature.
 // Afterwards HEAD^ supplies the prior source for ordinary rules updates.
 if(live!==at('HEAD^')&&live!==at('f43eb94c')){
  throw Error('Live rules differ from both repository baselines ('+hash(live)+'). Refusing to overwrite.');
 }
 const deployed=await service.releaseFirestoreRulesetFromSource(source);
 console.log('Deployed Firestore ruleset '+deployed.name+' ('+hash(source)+')');
})().catch(error=>{console.error(error);process.exitCode=1});
