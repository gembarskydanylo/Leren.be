// App Check for the app's Firestore REST calls: on lerenbe.com appCheckHeaders() adds X-Firebase-AppCheck with the token
// from initializeAppCheck(ReCaptchaEnterpriseProvider(site key)); if App Check cannot load, the request still goes (no header,
// no error), so nothing breaks before Enforce. Elsewhere (localhost) App Check is not loaded at all. The site is served
// from the repository under https://lerenbe.com and the Firebase modules are replaced with small fakes.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/appcheck-browser.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const KEY=fs.readFileSync(path.join(root,'app.js'),'utf8').match(/const APPCHECK_KEY="([^"]+)"/)[1];
const FAKE_APP='export function initializeApp(o,name){if(o.appId!=="1:533895640416:web:770d52f1926e13a186da05")throw Error("Firebase appId missing for "+name);return {o,name}}';
const FAKE_CHECK='export class ReCaptchaEnterpriseProvider{constructor(k){this.k=k}}\nexport function initializeAppCheck(app,o){globalThis.__ac={app:app.name,key:o.provider.k,auto:o.isTokenAutoRefreshEnabled};return {}}\nexport async function getToken(){return {token:"tok-123"}}';
(async()=>{
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');return}
 try{
  const run=async(host,{checkFails=false}={})=>{
   const ctx=await browser.newContext({serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());
    if(u.hostname===host){let f=path.join(root,decodeURIComponent(u.pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
     return fs.existsSync(f)?r.fulfill({status:200,contentType:types[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''})}
    if(u.href.endsWith('/firebasejs/10.12.2/firebase-app.js'))return r.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:FAKE_APP});
    if(u.href.endsWith('/firebasejs/10.12.2/firebase-app-check.js'))return checkFails?r.abort():r.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:FAKE_CHECK});
    return r.abort()});
   await page.addInitScript(()=>{try{localStorage.setItem('leren_onboarding_language_v1','1');localStorage.setItem('poly_ui','uk')}catch(e){}});
   await page.goto('https://'+host+'/index.html');await page.waitForFunction(()=>typeof appCheckHeaders==='function');
   const t0=Date.now();const h=await page.evaluate(()=>appCheckHeaders({Authorization:'Bearer x'}));const ms=Date.now()-t0;
   const ac=await page.evaluate(()=>globalThis.__ac||null);await ctx.close();return{h,ac,ms,errors}};
  const ok=await run('lerenbe.com');
  assert.deepEqual(ok.h,{Authorization:'Bearer x','X-Firebase-AppCheck':'tok-123'},'token header added');
  assert.deepEqual(ok.ac,{app:'appcheck',key:KEY,auto:true},'reCAPTCHA Enterprise provider with the site key');
  const www=await run('www.lerenbe.com');assert.equal(www.h['X-Firebase-AppCheck'],'tok-123','www too');
  const down=await run('lerenbe.com',{checkFails:true});
  assert.deepEqual(down.h,{Authorization:'Bearer x'},'App Check unavailable: request goes without the header');assert(down.ms<6000,'no long wait: '+down.ms);
  const local=await run('localhost.test');assert.deepEqual(local.h,{Authorization:'Bearer x'});assert.equal(local.ac,null,'not loaded off lerenbe.com');
  // reviews.js initializes App Check with the same key, only on lerenbe.com
  // Validate every Firebase app initialization, not just the App Check token header.
  const appSource=fs.readFileSync(path.join(root,'app.js'),'utf8');
  for(const name of ['push','appcheck','acct'])assert(appSource.includes('appId:"1:533895640416:web:770d52f1926e13a186da05"},"'+name+'")'),'missing Firebase appId for '+name);
  const rvSource=fs.readFileSync(path.join(root,'reviews.js'),'utf8');
  assert(rvSource.includes("appId:'1:533895640416:web:770d52f1926e13a186da05'},'reviews')"),'missing Firebase appId for reviews');
  const rv=fs.readFileSync(path.join(root,'reviews.js'),'utf8');assert(rv.includes(`new ReCaptchaEnterpriseProvider('${KEY}')`)&&/lerenbe\\\.com\$\/\.test\(location\.hostname\)/.test(rv),'reviews.js App Check');
  // Every Firestore REST call in app.js sends the App Check headers.
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),calls=app.split('fetch(').slice(1).filter(x=>/^(docUrl\(|"https:\/\/firestore\.googleapis\.com)/.test(x));
  assert(calls.length>=4);for(const c of calls)assert(c.slice(0,400).includes('appCheckHeaders('),'Firestore call without App Check: '+c.slice(0,80));
  console.log(`PASS: App Check — token header on lerenbe.com and www, no header and no wait (${down.ms} ms) when unavailable, off elsewhere; ${calls.length} Firestore calls covered`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
