// Search engines, sharing and brand: static summary in the first HTML, meta tags, JSON-LD, robots.txt, sitemap.xml,
// manifest for A1.1 and A1.2, "lerenbe.com" everywhere users read it, no blocking scripts in <head>.
// Run: node tests/seo.cjs
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),html=require(__dirname+'/lib/app-source.cjs')(),head=html.slice(0,html.indexOf('</head>'));
const meta=(attr,name)=>{const m=head.match(new RegExp('<meta '+attr+'="'+name.replace(/[:.]/g,'\\$&')+'" content="([^"]+)"'));return m&&m[1]};
// Meta tags
assert.match(meta('name','description'),/A1\.1 і A1\.2/);
assert(head.includes('<link rel="canonical" href="https://lerenbe.com/">'));
for(const k of ['og:title','og:description','og:image','og:url','og:type'])assert(meta('property',k),k);
assert.equal(meta('property','og:url'),'https://lerenbe.com/');assert.equal(meta('property','og:image'),'https://lerenbe.com/og-image.jpg');assert(fs.existsSync('og-image.jpg'));
for(const k of ['twitter:card','twitter:title','twitter:description','twitter:image'])assert(meta('name',k),k);
const ld=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(ld['@type'],'WebApplication');assert.equal(ld.applicationCategory,'EducationalApplication');assert.equal(ld.url,'https://lerenbe.com/');
// No app script blocks the first paint: the only script in <head> is JSON-LD (data, not code).
const headScripts=head.match(/<script[^>]*>/g);assert.deepEqual([...headScripts],['<script type="application/ld+json">']);
// No inline code anywhere (v181), so the CSP can forbid inline scripts: every executable <script> has a src, and no
// HTML page or template uses on*="…" handlers or javascript: URLs.
const real=fs.readFileSync('index.html','utf8');
for(const t of real.match(/<script\b[^>]*>/g))assert(/\bsrc=/.test(t)||/type="application\/ld\+json"/.test(t),'inline script: '+t);
assert(/<script src="\.\/boot\.js\?v=\d+"><\/script>\n<script src="\.\/modules\/review\/srs\.js/.test(real),'boot.js (error reports) loads before every other script');
for(const f of ['index.html','app.js','privacy.html','modules/clock/widget.html','modules/diphthongs/widget.html'])assert(!/\son[a-z]+=["']|javascript:/i.test(read(f)),f+': inline handler');
// The modules still load before the main script, in the same order as before.
const order=[...html.matchAll(/<script src="\.\/(modules\/[^"?]+|course-curriculum\.js)\?v=\d+"( defer)?><\/script>/g)].map(m=>m[1]);
assert(order.indexOf('modules/review/srs.js')<order.indexOf('modules/learning-path/ui.js')&&order.indexOf('modules/learning-path/ui.js')<order.indexOf('course-curriculum.js'));
assert(html.indexOf('<script src="./course-curriculum.js')<html.indexOf('<script>\n'),'main script after the modules');
// Static summary inside the app root: headings, every topic of both courses, a privacy link; hidden when JS runs.
const shell=html.slice(html.indexOf('<article class="seo-shell">'),html.indexOf('</article>'));
assert.match(shell,/<h2>Нідерландська мова українською — курси A1\.1 і A1\.2<\/h2>/);assert.equal((shell.match(/<li><strong>/g)||[]).length,5+12+16,'5 sections + 12 + 16 topics');
assert(shell.includes('href="./privacy.html"'));assert(html.includes('.seo-shell{display:none}')&&html.includes('<noscript><style>.seo-shell{display:block}</style></noscript>'),'summary shown only without JavaScript');
// Hardening: every page carries in a <meta> the same CSP that Cloudflare sends as a header (tests/csp-browser.cjs walks the
// app under it), so the policy still holds if the Cloudflare rule is switched off. <meta> ignores frame-ancestors (boot.js
// has a frame guard instead) and adds form-action. A new external address in the code = add it here, in csp-browser.cjs and in Cloudflare.
const headerCsp=read('tests/csp-browser.cjs').match(/const CSP="([^"]+)"/)[1],metaCsp=headerCsp.replace("; frame-ancestors 'self'","")+"; form-action 'self'";
for(const f of ['index.html','privacy.html','modules/clock/widget.html']){const h=read(f);assert(h.includes(`<meta http-equiv="Content-Security-Policy" content="${metaCsp}">`),f+': meta CSP = Cloudflare CSP');if(f.includes('widget'))continue;assert(h.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'),f)}
const sec=read('.well-known/security.txt');assert.match(sec,/^Contact: mailto:\S+@\S+$/m);const exp=new Date(sec.match(/^Expires: (\S+)$/m)[1]);assert(exp>new Date()&&exp-new Date()<400*864e5,'security.txt Expires within a year');
// robots.txt and sitemap.xml
assert.match(read('robots.txt'),/^User-agent: \*\nAllow: \/\n\nSitemap: https:\/\/lerenbe\.com\/sitemap\.xml\n$/);
const sm=read('sitemap.xml');assert(sm.includes('<loc>https://lerenbe.com/</loc>')&&sm.includes('<loc>https://lerenbe.com/privacy.html</loc>'));
// Manifest
const mf=JSON.parse(read('manifest.webmanifest'));assert.equal(mf.name,'lerenbe.com — Nederlands A1.1 & A1.2');assert.match(mf.description,/A1\.1 і A1\.2/);
// Brand: "lerenbe.com" in everything users read
for(const f of ['index.html','privacy.html','manifest.webmanifest','modules/focused-home/ui.js','modules/rewards/ui.js'])assert(!read(f).includes('Leren.be'),f);
assert(read('privacy.html').includes('<title>lerenbe.com — Політика конфіденційності'));
// Ukrainian defaults in the static footer
assert(html.includes('<span id="footRights">Усі права захищено</span>')&&html.includes('id="footPrivacy">Конфіденційність</a>'));
console.log('PASS: meta description, canonical, Open Graph, Twitter card, JSON-LD WebApplication, static summary with all 28 topics, robots.txt and sitemap.xml, manifest A1.1 & A1.2, lerenbe.com branding, no blocking scripts in <head>, Ukrainian footer, CSP and referrer meta, security.txt');
