// Telegram bot worker with Telegram and Anthropic mocked: schedule, posts, commands, AI answers, webhook secret.
const assert=require('node:assert/strict');
(async()=>{
const {default:bot,brussels,tipNumber,factNumber,safeHtml}=await import('../tools/tg-bot/worker.js');
const {default:content}=await import('../tools/tg-bot/content.js');
let calls=[],aiReply='Kort: <b>geen</b> перед іменником. <script>x</script>';
globalThis.fetch=async(url,opt)=>{const body=JSON.parse(opt.body);
 if(url.startsWith('https://api.anthropic.com')){calls.push({method:'AI',body});return {ok:true,json:async()=>({content:[{type:'text',text:aiReply}]})}}
 const method=url.split('/').pop();calls.push({method,body});
 return {json:async()=>method==='getChatMemberCount'?{ok:true,result:150}:{ok:true,result:{}}}};
const kv=new Map(),RATE={delete:async k=>{kv.delete(k)},get:async k=>kv.get(k)??null,put:async(k,v)=>{kv.set(k,v)},list:async({prefix})=>({keys:[...kv.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name}))})};
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
assert.deepEqual([2,4,6,9,11,13].map(tipNumber),[0,1,2,3,4,5]);assert.deepEqual([1,3,5,8,10,12].map(factNumber),[0,1,2,3,4,5]);
content.facts.forEach(f=>{assert(f.e&&f.nl&&f.uk&&f.words.length>=2);assert(!/[<>]/.test(f.nl+f.uk))});

// Schedule: which posts go out on a Tuesday, hour by hour
const jobs={};for(let h=0;h<24;h++){calls=[];await bot.scheduled({scheduledTime:Date.parse('2026-11-03T00:00:00Z')+h*36e5},env,ctx);await flush();if(calls.length)jobs[h+1]=calls.map(c=>c.method).join()}
assert.deepEqual(Object.keys(jobs),['8','13','19']);assert.equal(jobs[8],'sendMessage');assert.equal(jobs[13],'sendMessage');assert.equal(jobs[19],'sendPoll');
calls=[];await bot.scheduled({scheduledTime:Date.parse('2026-11-02T08:00:00Z')},env,ctx);await flush();
assert.equal(calls.at(-1).body.chat_id,'42');assert.match(calls.at(-1).body.text,/150/);

// Commands
let c=await send('/start channel');assert.match(c[0].body.text,/lerenbe\.com/);assert.equal(kv.get('tg:u:7'),'channel');
c=await send('/help');assert.match(c[0].body.text,/Команди:[\s\S]*\/quiz/);
c=await send('/quiz');assert.equal(c[0].method,'sendPoll');assert.equal(c[0].body.is_anonymous,false);
c=await send('/word');assert.equal(c[0].method,'sendMessage');assert.equal(typeof c[0].body.text,'string');assert.equal(c[0].body.voice,undefined);
c=await send('/post tip');assert.equal(c[0].method,'sendMessage');assert.notEqual(c[0].body.chat_id,'@lerenbe'); // not admin: treated as unknown command
c=await send('/post quiz',42);assert.equal(c[0].body.chat_id,'@lerenbe');assert.equal(c[0].body.is_anonymous,true);assert.match(c[1].body.text,/Опубліковано/);

c=await send('/post welcome',42);assert.match(c[0].body.text,/Вітаємо/);assert.equal(c[1].method,'pinChatMessage');assert.equal(c[1].body.chat_id,'@lerenbe');

// Testers' topics: only the admin, only in a forum group; three topics, each with a pinned template
const group=async(text,from,is_forum)=>{calls=[];await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:1,chat:{id:-100,type:'supergroup',is_forum},from:{id:from},text}})}),env,ctx);await flush();return calls};
c=await group('/topics',7,true);assert.equal(c.length,0);
c=await group('/topics',42,false);assert.match(c[0].body.text,/Теми/);
c=await group('/topics@lerenbe_bot',42,true);assert.deepEqual(c.map(x=>x.method),['createForumTopic','sendMessage','pinChatMessage','createForumTopic','sendMessage','pinChatMessage','createForumTopic','sendMessage','pinChatMessage','sendMessage']);
assert.match(c[0].body.name,/Помилки/);assert.match(c[1].body.text,/Опишіть екран словами/);
calls=[];await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:2,chat:{id:-100,type:'supergroup'},from:{id:42},new_chat_members:[{id:7,first_name:'Оля & друзі'},{id:999,is_bot:true}]}})}),env,ctx);await flush();
assert.equal(calls.length,1);assert.equal(calls[0].method,'sendMessage');assert.match(calls[0].body.text,/раді вас бачити/i);assert.match(calls[0].body.text,/Оля &amp; друзі/);assert.match(calls[0].body.text,/lerenbe\.com/);assert.equal(calls[0].body.reply_markup.inline_keyboard[0][0].url,'https://lerenbe.com/?utm_source=telegram');

// Bug reports: /bug → text and screenshots go to the admin with one header; /done ends; the admin's reply goes back
let mid=500;const real=globalThis.fetch;globalThis.fetch=async(url,opt)=>{const res=await real(url,opt);const j=await res.json();if(!url.includes('anthropic')&&!j.result?.message_id&&typeof j.result==='object')j.result={message_id:++mid};return {ok:true,json:async()=>j}};
const raw=async m=>{calls=[];await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:9,chat:{id:m.from,type:'private'},...m,from:{id:m.from,first_name:'Olha',username:'olha_ua'}}})}),env,ctx);await flush();return calls};
c=await send('/bug',8);assert.match(c[0].body.text,/Файли бот не пересилає/);
c=await raw({from:8,text:'Тест не відкривається'});assert.deepEqual(c.map(x=>x.method),['sendMessage','sendMessage','sendMessage']);
assert.equal(c[0].body.chat_id,'42');assert.match(c[0].body.text,/Новий звіт.*@olha_ua.*8/s);assert.equal(c[1].body.text,'Тест не відкривається');assert.match(c[2].body.text,/Дякуємо/);
const header=c[0];const headerId=mid-2;
c=await raw({from:8,photo:[{file_id:'p'}],caption:'ось скрін'});assert.deepEqual(c.map(x=>x.method),['sendMessage','sendMessage']);assert.equal(c[0].body.text,'ось скрін');assert.match(c[1].body.text,/Додано/);
c=await raw({from:8,photo:[{file_id:'p2'}],media_group_id:'g'});assert.deepEqual(c.map(x=>x.method),['sendMessage']);assert.match(c[0].body.text,/Вкладення.*не переслано/);
c=await send('/done',8);assert.match(c[0].body.text,/Дякуємо/);assert.equal(kv.has('tg:bug:8'),false);
c=await raw({from:9,photo:[{file_id:'p'}]});assert.equal(c[0].body.chat_id,'42');assert.match(c[0].body.text,/Новий звіт/);assert.match(c[1].body.text,/Вкладення.*не переслано/); // a screenshot starts a report; only text is relayed
calls=[];await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:77,chat:{id:42,type:'private'},from:{id:42},text:'Дякую, виправимо!',reply_to_message:{message_id:headerId}}})}),env,ctx);await flush();
assert.deepEqual(calls.map(x=>x.method),['sendMessage','sendMessage','sendMessage']);assert.equal(calls[0].body.chat_id,'8');assert.equal(calls[1].body.text,'Дякую, виправимо!');assert.match(calls[2].body.text,/надіслано/);
globalThis.fetch=real;env.PER_USER=ok;

// Cat stickers: the admin creates the pack from lerenbe.com images; /post stickers sends one with an "add" button
c=await send('/stickers',42);assert.equal(c[0].method,'createNewStickerSet');assert.equal(c[0].body.name,'lerenbe_cat_by_lerenbe_bot');assert.equal(c[0].body.user_id,42);
assert.equal(c[0].body.stickers.length,6);assert.match(c[0].body.stickers[0].sticker,/^https:\/\/lerenbe\.com\/stickers\/cat-1\.png$/);assert.match(c[1].body.text,/готові/);
c=await send('/stickers',7);assert.ok(!c.some(x=>x.method==='createNewStickerSet'));

c=await send('/preview fact',42);assert.match(c[0].body.text,/Цікаво про Бельгію[\s\S]*🇳🇱[\s\S]*🇺🇦[\s\S]*📝/);

// AI answer: only <b>/<i> survive
c=await send('niet of geen?');const ans=c.find(x=>x.method==='sendMessage');assert.equal(c.find(x=>x.method==='AI').body.model,'claude-haiku-5-5');
assert.equal(ans.body.text,'Kort: <b>geen</b> перед іменником. &lt;script&gt;x&lt;/script&gt;');
// A reply to a bot answer includes the original user question and the answer as valid context.
calls=[];await bot.fetch(new Request('https://x.dev/tg',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'s3cret'},body:JSON.stringify({message:{message_id:2,chat:{id:7,type:'private'},from:{id:7},text:'А як заперечити це?',reply_to_message:{message_id:1,from:{id:999,is_bot:true},text:'<b>Ik heb een auto.</b>',reply_to_message:{message_id:0,from:{id:7},text:'Переклади: I have a car.'}}}})}),env,ctx);await flush();
const history=calls.find(x=>x.method==='AI').body.messages;assert.deepEqual(history.map(m=>m.role),['user','assistant','user']);assert.equal(history[0].content,'Переклади: I have a car.');assert.equal(history[1].content,'<b>Ik heb een auto.</b>');assert.equal(history[2].content,'А як заперечити це?');
env.PER_USER={limit:async()=>({success:false})};c=await send('ще питання');assert(!c.some(x=>x.method==='AI'));assert.match(c[0].body.text,/Забагато/);
assert.equal(safeHtml('a<b'),'a&lt;b');

// Webhook secret
const bad=await bot.fetch(new Request('https://x.dev/tg',{method:'POST',body:'{}'}),env,ctx);assert.equal(bad.status,403);
console.log(`PASS: ${content.words.length} words, ${content.quiz.length} quizzes, ${content.tips.length} tips; Brussels schedule incl. summer time; admin-only posting; AI answers sanitised and rate-limited; webhook secret`);
})().catch(e=>{console.error(e);process.exit(1)});
