// Telegram bot worker with Telegram and Anthropic mocked: schedule, posts, commands, AI answers, webhook secret.
const assert=require('node:assert/strict');
(async()=>{
const {default:bot,brussels,tipNumber,safeHtml}=await import('../tools/tg-bot/worker.js');
const {default:content}=await import('../tools/tg-bot/content.js');
let calls=[],aiReply='Kort: <b>geen</b> перед іменником. <script>x</script>';
globalThis.fetch=async(url,opt)=>{const body=JSON.parse(opt.body);
 if(url.startsWith('https://api.anthropic.com')){calls.push({method:'AI',body});return {ok:true,json:async()=>({content:[{type:'text',text:aiReply}]})}}
 const method=url.split('/').pop();calls.push({method,body});
 return {json:async()=>method==='getChatMemberCount'?{ok:true,result:150}:{ok:true,result:{}}}};
const kv=new Map(),RATE={get:async k=>kv.get(k)??null,put:async(k,v)=>{kv.set(k,v)},list:async({prefix})=>({keys:[...kv.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name}))})};
const ok={limit:async()=>({success:true})};
const env={TG_TOKEN:'T',WEBHOOK_SECRET:'s3cret',CHANNEL:'@lerenbe',ADMIN_ID:'42',BOT_USERNAME:'lerenbe_bot',RATE,PER_USER:ok,ALL:ok,ANTHROPIC_KEY:'k'};
const pending=[];const ctx={waitUntil:p=>pending.push(p)};const flush=async()=>{while(pending.length)await pending.shift()};
const send=async(text,from=7)=>{calls=[];const r=await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:1,chat:{id:from,type:'private'},from:{id:from},text}})}),env,ctx);assert.equal(await r.text(),'ok');await flush();return calls};

// Content
assert(content.words.length>200&&content.quiz.length>500&&content.tips.length>=12);
content.quiz.forEach(q=>{assert.equal(q.o.length,4);assert.equal(new Set(q.o).size,4);assert(q.c>=0&&q.o.every(o=>o.length<=100))});
for(const t of[...content.tips,...content.promos]){assert(t.length<4096);assert.equal((t.match(/<b>/g)||[]).length,(t.match(/<\/b>/g)||[]).length);assert.equal((t.match(/<i>/g)||[]).length,(t.match(/<\/i>/g)||[]).length)}

// Brussels time: winter UTC+1, summer UTC+2; 1 Nov 2026 is day 0 and a Sunday
assert.deepEqual(brussels(new Date('2026-11-01T07:00:00Z')),{hour:8,weekday:0,day:0});
assert.equal(brussels(new Date('2027-07-01T06:00:00Z')).hour,8);
assert.deepEqual([2,4,6,9,11,13].map(tipNumber),[0,1,2,3,4,5]);

// Schedule: which posts go out on a Tuesday, hour by hour
const jobs={};for(let h=0;h<24;h++){calls=[];await bot.scheduled({scheduledTime:Date.parse('2026-11-03T00:00:00Z')+h*36e5},env,ctx);await flush();if(calls.length)jobs[h+1]=calls.map(c=>c.method).join()}
assert.deepEqual(Object.keys(jobs),['8','13','19']);assert.match(jobs[8],/^send(Voice|Message)$/);assert.equal(jobs[13],'sendMessage');assert.equal(jobs[19],'sendPoll');
calls=[];await bot.scheduled({scheduledTime:Date.parse('2026-11-02T08:00:00Z')},env,ctx);await flush();
assert.equal(calls.at(-1).body.chat_id,'42');assert.match(calls.at(-1).body.text,/150/);

// Commands
let c=await send('/start channel');assert.match(c[0].body.text,/lerenbe\.com/);assert.equal(kv.get('tg:u:7'),'channel');
c=await send('/quiz');assert.equal(c[0].method,'sendPoll');assert.equal(c[0].body.is_anonymous,false);
c=await send('/word');assert(['sendVoice','sendMessage'].includes(c[0].method));
c=await send('/post tip');assert.equal(c[0].method,'sendMessage');assert.notEqual(c[0].body.chat_id,'@lerenbe'); // not admin: treated as unknown command
c=await send('/post quiz',42);assert.equal(c[0].body.chat_id,'@lerenbe');assert.equal(c[0].body.is_anonymous,true);assert.match(c[1].body.text,/Опубліковано/);

c=await send('/post welcome',42);assert.match(c[0].body.text,/Вітаємо/);assert.equal(c[1].method,'pinChatMessage');assert.equal(c[1].body.chat_id,'@lerenbe');

// AI answer: only <b>/<i> survive
c=await send('niet of geen?');const ans=c.find(x=>x.method==='sendMessage');assert.equal(c.find(x=>x.method==='AI').body.model,'claude-haiku-5-5');
assert.equal(ans.body.text,'Kort: <b>geen</b> перед іменником. &lt;script&gt;x&lt;/script&gt;');
env.PER_USER={limit:async()=>({success:false})};c=await send('ще питання');assert(!c.some(x=>x.method==='AI'));assert.match(c[0].body.text,/Забагато/);
assert.equal(safeHtml('a<b'),'a&lt;b');

// Webhook secret
const bad=await bot.fetch(new Request('https://x.dev/tg',{method:'POST',body:'{}'}),env,ctx);assert.equal(bad.status,403);
console.log(`PASS: ${content.words.length} words, ${content.quiz.length} quizzes, ${content.tips.length} tips; Brussels schedule incl. summer time; admin-only posting; AI answers sanitised and rate-limited; webhook secret`);
})().catch(e=>{console.error(e);process.exit(1)});
