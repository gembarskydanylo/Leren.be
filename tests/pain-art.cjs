// Pain pictures must mark the body part; Review mode must ask for the translation, not repeat the Dutch.
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
for(const k of ['buikpijn','oorpijn','keelpijn','hoofdpijn','rug','schouder','knie','been','voet','neus','tandpijn','hand'])
 assert(new RegExp('\\n '+k+':KS\\([^\\n]*(HLT\\(|KT_R)').test(html.split('Object.assign(KT_IMG,{')[1]||''),'pain picture without highlight: '+k);
for(const [id,key] of [['kl_3','buikpijn'],['kl_4','oorpijn'],['kl_5','rug'],['kl_7','keelpijn'],['kl_11','schouder']])
 assert(new RegExp('\\["'+id+'",[^\\n]*,KT_IMG\\.'+key+',').test(html),'klachten row '+id+' must use the body picture');
assert(html.includes('const rev=mode==="audio"||mode==="review"'),'review must offer translations');
for(const l of ['Обери переклад','Choose the translation','Choisis la traduction','اختر الترجمة'])assert(html.includes('reviewSub:"'+l+'"'),'reviewSub '+l);
console.log('pain-art ok');
