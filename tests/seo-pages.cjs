// Google indexing sanity for every public page listed in sitemap.xml: one static h1, title, description, canonical
// (same URL as in the sitemap), Open Graph, no noindex, reachable from the home page by a plain link.
// The sitemap holds no noindex page, robots.txt allows crawling and names the sitemap.
// Run: node tests/seo-pages.cjs
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const sm=read('sitemap.xml'),robots=read('robots.txt'),home=read('index.html');
assert(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(sm)&&sm.trim().endsWith('</urlset>'),'sitemap structure');
assert(/^User-agent: \*\nAllow: \/$/m.test(robots)&&!/^Disallow:\s*\//m.test(robots),'robots.txt must allow crawling');
assert(robots.includes('Sitemap: https://lerenbe.com/sitemap.xml'),'robots.txt names the sitemap');
const urls=[...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert(urls.length>=4&&new Set(urls).size===urls.length,'sitemap URLs unique');
for(const m of sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g))assert(/^\d{4}-\d{2}-\d{2}$/.test(m[1]),'lastmod format '+m[1]);
for(const u of urls){
  assert(u.startsWith('https://lerenbe.com/'),'host '+u);
  const rel=u.slice('https://lerenbe.com/'.length)||'index.html',s=read(rel),head=s.slice(0,s.indexOf('</head>'));
  assert.equal((s.match(/<h1[\s>]/g)||[]).length,1,rel+': exactly one static h1');
  assert(/<html lang="uk"/.test(s),rel+': html lang');
  assert(/<title>[^<]{10,}<\/title>/.test(head),rel+': title');
  assert(/<meta name="description" content="[^"]{40,}"/.test(head),rel+': description');
  assert(head.includes('<link rel="canonical" href="'+u+'">'),rel+': canonical equals the sitemap URL');
  assert(/<meta property="og:title" content="[^"]+"/.test(head)&&/<meta property="og:image" content="https:\/\/lerenbe\.com\//.test(head),rel+': Open Graph');
  assert(!/<meta name="robots"[^>]*noindex/i.test(head),rel+': a sitemap page must not be noindex');
  if(rel!=='index.html')assert(home.includes('href="./'+rel+'"'),rel+': linked from the home page');
}
// Pages that must stay out of the index are not in the sitemap.
for(const rel of ['reviews.html'])if(fs.existsSync(rel)&&/noindex/i.test(read(rel)))assert(!urls.includes('https://lerenbe.com/'+rel),rel+' is noindex but listed in the sitemap');
console.log('PASS: seo-pages — '+urls.length+' sitemap URLs: one h1, title, description, canonical = sitemap URL, Open Graph, no noindex, linked from home; robots.txt and sitemap valid; noindex pages are not in the sitemap');
