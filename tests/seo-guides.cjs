// /guides/ ready for search engines (owner decision 26.11.2026): the hub and four guides are indexable (no noindex /
// nofollow, no "test version" label in any language), carry canonical + Open Graph + Twitter card, are in the sitemap,
// and hold their whole teaching text in static HTML (readable without JavaScript); the hub links every guide.
// Run: node tests/seo-guides.cjs
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8'),words=s=>s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g,' ').replace(/<[^>]+>/g,' ').split(/\s+/).filter(w=>/\p{L}/u.test(w)).length;
const sm=read('sitemap.xml'),guides=['niderlandska-dlia-ukraintsiv-belhiia.html','nt2-dlia-pochatkivtsiv.html','niderlandska-povsiakdenne-zhyttia.html','movna-pidhotovka-intehratsiia-belhiia.html'];
const lang=read('guides/lang.js');assert(!/test version|version de test|تجريبية/i.test(lang),'no "test version" in the hub translations');
for(const f of ['index.html',...guides]){
 const s=read('guides/'+f),head=s.slice(0,s.indexOf('</head>')),body=s.slice(s.indexOf('<body'));
 const url='https://lerenbe.com/guides/'+(f==='index.html'?'':f);
 assert(!/<meta name="robots"/i.test(head),f+': no robots meta (indexable)');
 assert(!/Тестова версія/.test(s),f+': no "test version" label');
 assert(head.includes('<link rel="canonical" href="'+url+'">'),f+': canonical');
 for(const k of ['og:title','og:description','og:url','og:image','og:type'])assert(new RegExp('<meta property="'+k+'" content="[^"]+"').test(head),f+': '+k);
 assert(head.includes('<meta property="og:url" content="'+url+'">')&&head.includes('content="https://lerenbe.com/og-image.jpg"'),f+': og:url and image');
 assert(/<meta name="twitter:card" content="summary_large_image">/.test(head),f+': twitter card');
 assert(sm.includes('<loc>'+url+'</loc>'),f+': in the sitemap');
 assert(/<meta http-equiv="Content-Security-Policy"/.test(head),f+': CSP kept');
 assert.equal((s.match(/<h1[\s>]/g)||[]).length,1,f+': one h1');
 if(f==='index.html'){assert(words(body)>=60,'hub: static text');for(const g of guides)assert(body.includes('href="'+g+'"'),'hub links '+g)}
 else{assert(words(body)>=300,f+': at least 300 words of static text ('+words(body)+')');assert((body.match(/lang="nl"/g)||[]).length>=4,f+': Dutch phrases marked lang="nl"');
  for(const m of body.matchAll(/href="(https?:[^"]+)"/g))assert(m[1].startsWith('https://'),f+': external links use https')}
}
console.log('PASS: seo-guides — hub + '+guides.length+' guides indexable (no robots meta, no test label in 4 languages), canonical, Open Graph, Twitter card, in the sitemap, CSP kept, one h1, static text (guides ≥ 300 words), hub links every guide');
