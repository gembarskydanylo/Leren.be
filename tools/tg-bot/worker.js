// Leren.be Telegram bot (Cloudflare Worker "leren-tg"). Deploy: .github/workflows/deploy-tg-bot.yml (tools/tg-bot/wrangler.toml).
// Channel: word of the day with audio, evening quiz, tips, weekly app promo (schedule below, Brussels time).
// Private chat: /start, /word, /quiz, /app, /id, and any question about Dutch → Claude answers in Ukrainian.
// Admin (ADMIN_ID): /post word|quiz|tip|promo|welcome (to the channel now; welcome is also pinned), /preview … (to you only), /report.
// Secrets: TG_TOKEN, ANTHROPIC_KEY, WEBHOOK_SECRET. Variables: CHANNEL (@name or -100…), ADMIN_ID, BOT_USERNAME,
// optional MODEL (default claude-haiku-5-5), AI_OFF = 1 stops all model calls.
// After the first deploy open https://leren-tg.<account>.workers.dev/setup?secret=WEBHOOK_SECRET once.
import content from "./content.js";

const SITE = "https://lerenbe.com/?utm_source=telegram";
const AUDIO = "https://lerenbe.com/audio/nl/";
const START = Date.UTC(2026, 10, 1); // day 0 of the rotation
// [weekday (0 = Sunday) or "*", Brussels hour, job]
const SCHEDULE = [
  ["*", 8, "word"],
  [2, 13, "tip"], [4, 13, "tip"], [6, 13, "tip"],
  [0, 13, "promo"],
  ["*", 19, "quiz"],
  [1, 9, "report"]
];

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/${method}`, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({ok: false, description: "bad json"}));
  if (!j.ok) console.log("TG_ERROR", method, j.description);
  return j;
}

function brussels(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "short", hourCycle: "h23"})
    .formatToParts(date).map(x => [x.type, x.value]));
  const day = Math.floor((Date.UTC(+p.year, +p.month - 1, +p.day) - START) / 864e5);
  return {hour: +p.hour, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), day};
}
const pick = (list, n) => list[((n % list.length) + list.length) % list.length];
const appButton = env => ({inline_keyboard: [[{text: "📲 Відкрити lerenbe.com", url: SITE},
  ...(env.BOT_USERNAME ? [{text: "🤖 Запитати бота", url: `https://t.me/${env.BOT_USERNAME}?start=channel`}] : [])]]});

// --- Posts -------------------------------------------------------------------------------------
async function postWord(env, chat, n) {
  const w = pick(content.words, n);
  const text = `🇧🇪 <b>Слово дня</b>\n\n<b>${esc(w.w)}</b> — ${esc(w.uk)}${w.pl ? `\n<i>мн.: ${esc(w.pl)}</i>` : ""}\n\n💬 <i>${esc(w.x)}</i>\n${esc(w.xu)}\n\n#слово_дня`;
  if (w.a) {
    const r = await tg(env, "sendVoice", {chat_id: chat, voice: AUDIO + w.a + ".m4a", caption: text, parse_mode: "HTML", reply_markup: appButton(env)});
    if (r.ok) return r;
  }
  return tg(env, "sendMessage", {chat_id: chat, text, parse_mode: "HTML", reply_markup: appButton(env), link_preview_options: {is_disabled: true}});
}
function postQuiz(env, chat, n) {
  const q = pick(content.quiz, n);
  return tg(env, "sendPoll", {chat_id: chat, question: "🧠 " + q.q, options: q.o.map(text => ({text})), type: "quiz", correct_option_id: q.c,
    is_anonymous: chat === env.CHANNEL, ...(q.x ? {explanation: q.x.slice(0, 200)} : {})});
}
function postText(env, chat, text) {
  return tg(env, "sendMessage", {chat_id: chat, text, parse_mode: "HTML", reply_markup: appButton(env), link_preview_options: {is_disabled: true}});
}
// Tips go out three times a week, so the tip number counts those slots, not days.
const tipNumber = day => Math.floor(day / 7) * 3 + [0, 0, 0, 1, 1, 2, 2][((day % 7) + 7) % 7];

async function report(env) {
  const now = await tg(env, "getChatMemberCount", {chat_id: env.CHANNEL});
  const members = now.ok ? now.result : null;
  const last = env.RATE ? +(await env.RATE.get("tg:members:week") || 0) : 0;
  const users = env.RATE ? (await env.RATE.list({prefix: "tg:u:"})).keys.length : 0;
  if (env.RATE && members !== null) await env.RATE.put("tg:members:week", String(members));
  const delta = members !== null && last ? members - last : null;
  const text = `📊 <b>Звіт за тиждень</b>\n\nПідписників у каналі: <b>${members ?? "?"}</b>${delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta} за тиждень)` : ""}\nЛюдей, що написали боту: <b>${users}</b>\n\n` +
    (delta !== null && delta <= 0 ? "Ріст зупинився: час для взаємного піару або поста в українських групах Бельгії." : "Тримаємо темп 💪");
  return tg(env, "sendMessage", {chat_id: env.ADMIN_ID, text, parse_mode: "HTML"});
}

async function runJob(env, job, chat, day) {
  if (job === "word") return postWord(env, chat, day);
  if (job === "quiz") return postQuiz(env, chat, day);
  if (job === "tip") return postText(env, chat, pick(content.tips, tipNumber(day)));
  if (job === "promo") return postText(env, chat, pick(content.promos, Math.floor(day / 7)));
  if (job === "report") return report(env);
  if (job === "welcome") {
    const r = await postText(env, chat, content.welcome);
    if (r.ok && chat === env.CHANNEL) await tg(env, "pinChatMessage", {chat_id: chat, message_id: r.result.message_id, disable_notification: true});
    return r;
  }
}

// --- Private chat ------------------------------------------------------------------------------
const SYSTEM = `You are the Leren.be Telegram assistant. You help Ukrainians who live in Belgium learn Dutch as spoken in Flanders (nl-BE), levels A1-A2.
- Answer in Ukrainian. Give Dutch examples in italics. Keep it short: at most about 120 words, simple language, like a kind teacher.
- When the learner writes in Dutch, correct mistakes and explain the rule briefly.
- Prefer Flemish usage when it differs from the Netherlands, and say so.
- Only help with the Dutch language and the language of daily life in Belgium (gemeente, huisarts, school, work, shopping). For other requests, say kindly that you only help with Dutch.
- Do not give medical, legal or financial decisions; teach the words and suggest a professional. Never ask for passwords, national register, bank or card numbers.
- When you mention the app, write its address as lerenbe.com (never "Leren.be": Telegram would link that to a different site).
- Formatting: plain text with Telegram HTML, ONLY <b> and <i> tags. No markdown, no headings, no tables.`;

// Escape everything, then allow back only <b> and <i> so a stray "<" from the model can't break Telegram HTML.
const safeHtml = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, "<$1$2>");

async function askClaude(env, question, previous) {
  const messages = [...(previous ? [{role: "user", content: "(earlier)"}, {role: "assistant", content: previous}] : []), {role: "user", content: question}];
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST", signal: ctl.signal,
      headers: {"content-type": "application/json", "x-api-key": env.ANTHROPIC_KEY, "anthropic-version": "2023-06-01"},
      body: JSON.stringify({model: env.MODEL || "claude-haiku-5-5", max_tokens: 700, system: SYSTEM, messages})});
    const j = await r.json();
    if (!r.ok) { console.log("AI_ERROR", r.status, JSON.stringify(j).slice(0, 300)); return null; }
    return (j.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim() || null;
  } catch (e) { console.log("AI_ERROR", String(e)); return null; } finally { clearTimeout(timer); }
}

async function limited(env, id) {
  try {
    const [me, all] = await Promise.all([env.PER_USER.limit({key: String(id)}), env.ALL.limit({key: "all"})]);
    return !me.success || !all.success;
  } catch { return true; } // no limiter → refuse rather than spend
}

const WELCOME = `Привіт! 👋 Я бот <b>lerenbe.com</b> — допомагаю вчити нідерландську українцям у Бельгії.

Просто напишіть мені питання, наприклад:
• <i>Як сказати «я хочу записатися до лікаря»?</i>
• <i>Чим відрізняється niet і geen?</i>
• або речення нідерландською — я перевірю помилки.

Команди:
/word — випадкове слово
/quiz — міні-вікторина
/app — застосунок lerenbe.com`;

async function onMessage(env, msg) {
  const chat = msg.chat.id, text = (msg.text || "").trim();
  if (msg.chat.type !== "private" || !text) return;
  const isAdmin = String(msg.from?.id) === String(env.ADMIN_ID);
  const [cmd, arg] = text.split(/\s+/);
  const day = brussels().day;
  const random = Math.floor(Math.random() * 1e6);

  if (cmd === "/start") {
    if (env.RATE) await env.RATE.put("tg:u:" + msg.from.id, arg || "direct").catch(() => {});
    return tg(env, "sendMessage", {chat_id: chat, text: WELCOME, parse_mode: "HTML", reply_markup: appButton({})});
  }
  if (cmd === "/word") return postWord(env, chat, random);
  if (cmd === "/quiz") return postQuiz(env, chat, random);
  if (cmd === "/app") return postText(env, chat, pick(content.promos, random));
  if (cmd === "/id") return tg(env, "sendMessage", {chat_id: chat, text: `Ваш id: <code>${msg.from.id}</code>`, parse_mode: "HTML"});
  if (isAdmin && (cmd === "/post" || cmd === "/preview")) {
    if (!["word", "quiz", "tip", "promo", "welcome"].includes(arg)) return tg(env, "sendMessage", {chat_id: chat, text: `${cmd} word | quiz | tip | promo | welcome`});
    const r = await runJob(env, arg, cmd === "/post" ? env.CHANNEL : chat, day);
    return cmd === "/post" && tg(env, "sendMessage", {chat_id: chat, text: r?.ok ? "✅ Опубліковано" : "❌ " + (r?.description || "помилка")});
  }
  if (isAdmin && cmd === "/report") return report(env);
  if (text.startsWith("/")) return tg(env, "sendMessage", {chat_id: chat, text: "Не знаю такої команди 🙂 Спробуйте /word, /quiz або просто напишіть питання."});

  if (env.AI_OFF === "1" || await limited(env, msg.from.id))
    return tg(env, "sendMessage", {chat_id: chat, text: "Забагато питань за хвилину 🙂 Спробуйте трохи пізніше, а поки потренуйтеся в застосунку.", reply_markup: appButton({})});
  await tg(env, "sendChatAction", {chat_id: chat, action: "typing"});
  const previous = msg.reply_to_message?.from?.is_bot ? msg.reply_to_message.text : "";
  const answer = await askClaude(env, text.slice(0, 1500), previous?.slice(0, 1500));
  if (!answer) return tg(env, "sendMessage", {chat_id: chat, text: "Не вдалося відповісти 😔 Спробуйте ще раз за хвилину."});
  const r = await tg(env, "sendMessage", {chat_id: chat, text: safeHtml(answer), parse_mode: "HTML", reply_parameters: {message_id: msg.message_id}});
  if (!r.ok) return tg(env, "sendMessage", {chat_id: chat, text: answer.replace(/<\/?[bi]>/g, "")});
}

async function setup(env, origin) {
  const results = {
    webhook: await tg(env, "setWebhook", {url: origin + "/tg", secret_token: env.WEBHOOK_SECRET, allowed_updates: ["message"], drop_pending_updates: true}),
    commands: await tg(env, "setMyCommands", {commands: [
      {command: "word", description: "Випадкове слово з озвученням"},
      {command: "quiz", description: "Міні-вікторина"},
      {command: "app", description: "Застосунок lerenbe.com"}]}),
    description: await tg(env, "setMyDescription", {description: "Нідерландська для українців у Бельгії. Питайте про слова й граматику, перевіряйте речення, тренуйтеся щодня з lerenbe.com 🇧🇪"}),
    short: await tg(env, "setMyShortDescription", {short_description: "Помічник з нідерландської від lerenbe.com 🇧🇪"})
  };
  return Response.json(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.ok ? "ok" : v.description])));
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/tg" && req.method === "POST") {
      if (!env.WEBHOOK_SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== env.WEBHOOK_SECRET) return new Response("forbidden", {status: 403});
      const update = await req.json().catch(() => ({}));
      // Answer Telegram at once; slow AI replies would otherwise make it resend the update.
      if (update.message) ctx.waitUntil(onMessage(env, update.message).catch(e => console.log("BOT_ERROR", String(e))));
      return new Response("ok");
    }
    if (url.pathname === "/setup" && env.WEBHOOK_SECRET && url.searchParams.get("secret") === env.WEBHOOK_SECRET) return setup(env, url.origin);
    return new Response("Leren.be Telegram bot");
  },
  async scheduled(event, env, ctx) {
    const t = brussels(new Date(event.scheduledTime));
    for (const [wd, hour, job] of SCHEDULE)
      if ((wd === "*" || wd === t.weekday) && hour === t.hour) ctx.waitUntil(runJob(env, job, env.CHANNEL, t.day));
  }
};

export {brussels, tipNumber, safeHtml, SCHEDULE};
