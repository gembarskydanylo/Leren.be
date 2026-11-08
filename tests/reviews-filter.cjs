// Reviews: swearing is refused by the page (reviews.js STRONG) and by Firestore rules (the same stems, same word-start rule),
// ordinary words that only CONTAIN a stem («рахуй», «люблять», «дебати») stay allowed, and nothing in the course texts or
// the dictionary would be refused. Run: node tests/reviews-filter.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('reviews.js'),rules=read('firestore.rules');
const page=new RegExp(js.match(/const STRONG=\/(.*?)\/i,/)[1],'i');
const ruleSrc=[...rules.matchAll(/!d\.(name|text)\.matches\('([^']+)'\)/g)];
assert.equal(ruleSrc.length,2,'rules check name and text');assert.equal(ruleSrc[0][2],ruleSrc[1][2]);
// Firestore rules use RE2 with full-string matching; (?s) lets . cross line breaks, (?i) ignores letter case.
assert(ruleSrc[0][2].startsWith('(?si)'),'rules match any case and several lines');
const rule=new RegExp('^'+ruleSrc[0][2].replace('(?si)','')+'$','si');
const stems=s=>s.match(/\((?:\^\|\[[^\]]+\]|\|\.\*\[[^\]]+\])\)\(([^)]+)\)/)[1];
assert.equal(stems(ruleSrc[0][2]),stems(js.match(/const STRONG=\/(.*?)\/i,/)[1]),'same stems on the page and in the rules');
const refused=x=>[page.test(x),rule.test(x)];
for(const w of ['Хуй','це пиздець','бляха... блять','нахуй','розпиздяй','You fuck','FUCK','klootzak!','Мудак','гандони','курва','Чудово!\nfuck this','заїбав','ебать'])assert.deepEqual(refused(w),[true,true],w);
for(const w of ['дебати','небанальний','рахуй','рахує','розрахуйтеся','люблять','потребами','Scunthorpe','хутір','хуліган','мудрий','гандбол','шлюз','Дякую, дуже корисний застосунок!\nРаджу всім.'])assert.deepEqual(refused(w),[false,false],w);
// Nothing the app itself teaches would be refused.
const files=['course-curriculum.js','app.js','index.html','privacy.html',...fs.readdirSync(path.join(root,'dict/src')).map(f=>'dict/src/'+f)];
for(const f of files){const m=read(f).toLowerCase().match(page);assert(!m,f+': '+(m&&m[0]))}
// The moderator sees flagged reviews.
assert(js.includes("card.classList.add('is-flagged')")&&read('reviews.css').includes('.review-card.is-flagged'),'moderation flag');
console.log('PASS: swear filter — page and rules agree, '+files.length+' course/dictionary files contain nothing refused');
