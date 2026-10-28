// Full Q&A / picture audit guards: unique ids, no clashing distractors, exact clocks, tiles instead of wrong emoji.
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('const cp=new Set(parts(correct))'),'distractors must skip options sharing a meaning part with the answer');
for(const id of ['clk_4','clk_5','clk_14'])assert(html.includes(id+':['),'exact clock for '+id);
assert(/it\.icon=num\(/.test(html)&&/it\.icon=cal\(/.test(html),'number and calendar tiles');
for(const k of ['doc_15','doc_18','course_ex10_16'])assert(new RegExp('\\["'+k+'",[^\\n]*KT_IMG\\.(buikpijn|keelpijn)').test(html),k+' needs body picture');
const ids=[...html.matchAll(/^\s*\["([a-z0-9_]+)",/gm)].map(m=>m[1]);
const seen=new Map();for(const i of ids)seen.set(i,(seen.get(i)||0)+1);
const dup=[...seen].filter(([k,v])=>v>1&&/^(num|tim|clk|mon|col|adj|hom|bod|doc|kl|cit|job|wk|clo|ani|phr)_/.test(k));
assert(!dup.length,'duplicate ids: '+dup.map(d=>d[0]).join(','));
console.log('q-audit ok');
