// Search Console exclusions of 26.11.2026 stay harmless (docs/seo/GSC-FINDINGS-2026-11-26.md):
// - one host: CNAME is lerenbe.com, every canonical and sitemap URL is https://lerenbe.com/… (no www, no http);
// - Firestore paths are never site URLs: no page links to /databases/, sitemap and robots.txt don't mention them
//   (a robots Disallow would keep them "discovered"; 404 is the right answer), and every Firestore REST path in app.js
//   is part of an absolute https://firestore.googleapis.com/ URL;
// - reviews.html stays noindex, canonical to itself and out of the sitemap while it has no published reviews.
// Run: node tests/seo-gsc-exclusions.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(read('CNAME').trim(),'lerenbe.com','apex host');
const sm=read('sitemap.xml'),robots=read('robots.txt');
for(const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g))assert(/^https:\/\/lerenbe\.com\//.test(m[1]),'sitemap URL on the canonical host: '+m[1]);
const pages=['index.html','privacy.html','reviews.html','learn-life.html','learn-life-story.html',...fs.readdirSync('guides').filter(f=>f.endsWith('.html')).map(f=>path.join('guides',f))].filter(f=>fs.existsSync(f));
for(const f of pages){const s=read(f);
 for(const m of s.matchAll(/<link rel="canonical" href="([^"]+)"/g))assert(/^https:\/\/lerenbe\.com\//.test(m[1]),f+': canonical on https://lerenbe.com: '+m[1]);
 assert(!/(href|src)="[^"]*\/databases\//.test(s),f+': no link to a Firestore path');}
assert(!/databases/.test(sm)&&!/databases/.test(robots),'sitemap and robots.txt do not mention Firestore paths');
const app=read('app.js'),lines=app.split('\n').filter(l=>l.includes('/databases/(default)/documents/'));
assert(lines.length>=1,'app.js still talks to Firestore REST');
for(const l of lines)assert(l.includes('"https://firestore.googleapis.com/v1/projects/"'),'Firestore path is part of an absolute googleapis URL: '+l.trim().slice(0,120));
const rv=read('reviews.html'),head=rv.slice(0,rv.indexOf('</head>'));
assert(/<meta name="robots" content="noindex[^"]*">/.test(head),'reviews.html stays noindex');
assert(head.includes('<link rel="canonical" href="https://lerenbe.com/reviews.html">'),'reviews.html canonical to itself');
assert(!sm.includes('reviews.html'),'reviews.html is not in the sitemap');
console.log('PASS: seo-gsc-exclusions — one host in CNAME/canonical/sitemap ('+pages.length+' pages), Firestore paths never site links (only absolute googleapis URLs in app.js, '+lines.length+' places), reviews.html noindex + self-canonical + out of the sitemap');
