// Leren.be Telegram bot (Cloudflare Worker "leren-tg"). Deploy: .github/workflows/deploy-tg-bot.yml (tools/tg-bot/wrangler.toml).
// Channel: text word of the day, evening quiz, tips, facts about Belgium (Dutch + Ukrainian), weekly app promo
// (schedule below, Brussels time).
// Private chat: /start, /word, /quiz, /app, /id, and any question about Dutch → Claude answers in Ukrainian.
// Bug reports: /bug (or just a screenshot) → text and captions go to REPORTS_CHAT; media stays out
// (optional REPORTS_THREAD for a topic; default: the admin's chat). A text reply to a report goes back to the tester.
// Admin (ADMIN_ID): /post word|quiz|tip|promo|welcome (to the channel now; welcome is also pinned), /preview … (to you only), /report.
// /stickers creates the cat sticker pack (images in /stickers on lerenbe.com); /post stickers shows it in the channel.
// In a group with Topics turned on, the admin's /topics creates the testers' topics, each with a pinned how-to.
// Secrets: TG_TOKEN, ANTHROPIC_KEY, WEBHOOK_SECRET. Variables: CHANNEL (@name or -100…), ADMIN_ID, BOT_USERNAME,
// optional MODEL (default claude-haiku-5-5), AI_OFF = 1 stops all model calls.
// After the first deploy open https://leren-tg.<account>.workers.dev/setup?secret=WEBHOOK_SECRET once.
import content from "./content.js";

const SITE = "https://lerenbe.com/?utm_source=telegram";
const START = Date.UTC(2026, 10, 1); // day 0 of the rotation
// [weekday (0 = Sunday) or "*", Brussels hour, job]
const SCHEDULE = [
  ["*", 8, "word"],
  [1, 13, "fact"], [3, 13, "fact"], [5, 13, "fact"],
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
// Tips go out three times a week (Tue, Thu, Sat), so the tip number counts those slots, not days.
const tipNumber = day => Math.floor(day / 7) * 3 + [0, 0, 0, 1, 1, 2, 2][((day % 7) + 7) % 7];
// Facts go out Monday, Wednesday, Friday: the same three slots a week, one day earlier, so the same count works.
const factNumber = tipNumber;
const factText = f => `${f.e} <b>Цікаво про Бельгію</b>\n\n🇳🇱 <i>${esc(f.nl)}</i>\n\n🇺🇦 ${esc(f.uk)}\n\n📝 ${f.words.map(([nl, uk]) => `<b>${esc(nl)}</b> — ${esc(uk)}`).join("\n📝 ")}\n\n#факти_про_бельгію`;

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
  if (job === "fact") return postText(env, chat, factText(pick(content.facts, factNumber(day))));
  if (job === "tip") return postText(env, chat, pick(content.tips, tipNumber(day)));
  if (job === "promo") return postText(env, chat, pick(content.promos, Math.floor(day / 7)));
  if (job === "report") return report(env);
  if (job === "stickers") return postStickers(env, chat, day);
  if (job === "welcome") {
    const r = await postText(env, chat, content.welcome);
    if (r.ok && chat === env.CHANNEL) await tg(env, "pinChatMessage", {chat_id: chat, message_id: r.result.message_id, disable_notification: true});
    return r;
  }
}

// --- Cat stickers ------------------------------------------------------------------------------
// Six poses of the app's student cat with a Dutch phrase each (made by tools/tg-bot/make-stickers.py).
const STICKERS = [["cat-1", "👋"], ["cat-2", "📚"], ["cat-3", "🤔"], ["cat-4", "🎉"], ["cat-5", "💪"], ["cat-6", "🎁"]];
const stickerSet = env => "lerenbe_cat_by_" + String(env.BOT_USERNAME || "").replace(/^@/, "");
const stickerButton = env => ({inline_keyboard: [[{text: "➕ Додати стікери з котиком", url: "https://t.me/addstickers/" + stickerSet(env)}]]});

async function makeStickers(env, chat) {
  if (!env.BOT_USERNAME) return tg(env, "sendMessage", {chat_id: chat, text: "Спершу додайте в Cloudflare змінну BOT_USERNAME."});
  const r = await tg(env, "createNewStickerSet", {user_id: +env.ADMIN_ID, name: stickerSet(env), title: "Котик lerenbe.com 🇧🇪",
    stickers: STICKERS.map(([file, emoji]) => ({sticker: `https://lerenbe.com/stickers/${file}.png`, format: "static", emoji_list: [emoji]}))});
  const exists = !r.ok && /occupied|already/i.test(r.description || "");
  return tg(env, "sendMessage", {chat_id: chat, text: r.ok || exists ? (exists ? "Стікери вже створені 🙂" : "✅ Стікери готові!") + " Тепер можна /post stickers" : "❌ " + r.description,
    ...(r.ok || exists ? {reply_markup: stickerButton(env)} : {})});
}
async function postStickers(env, chat, n) {
  const set = await tg(env, "getStickerSet", {name: stickerSet(env)});
  if (!set.ok) return set;
  await tg(env, "sendMessage", {chat_id: chat, text: "🐱 <b>Наш котик тепер у стікерах!</b>\n\nШість стікерів, і кожен вчить нідерландську фразу: <i>Dag! · Ik leer! · Even denken… · Super! · Je kunt het! · Voor jou!</i>\n\nДодавайте й надсилайте друзям 🧡", parse_mode: "HTML"});
  return tg(env, "sendSticker", {chat_id: chat, sticker: pick(set.result.stickers, n).file_id, reply_markup: stickerButton(env)});
}

// --- Private chat ------------------------------------------------------------------------------
const SYSTEM = `You are the Dutch-language coach for Leren.be. Your learners are mostly Ukrainians in Belgium studying A1–A2 Dutch as spoken in Flanders (nl-BE).

Teaching:
- Reply in Ukrainian by default. If the learner asks for another language, use it. Keep explanations warm, simple, and usually under 120 words.
- First identify what they need: translation, sentence correction, grammar explanation, a practical phrase, or speaking practice. Answer that request directly.
- When correcting Dutch, show the corrected sentence first, then explain the most useful one or two corrections. Preserve the learner's intended meaning; mention a more natural Flemish version when helpful.
- For translations, give a natural nl-BE phrase and a brief note about politeness or word choice when it matters.
- Use short Dutch examples in italics. If a question is ambiguous, ask one clear follow-up instead of guessing. In practice mode, ask one question at a time and let the learner try before showing the answer.
- Prefer Flemish usage over Netherlands Dutch. Label regional alternatives clearly; do not call a valid Flemish form incorrect.

Scope and accuracy:
- Help with Dutch and everyday communication in Belgium. For unrelated topics, briefly steer back to Dutch.
- Do not invent app features, course content, or current Belgian rules, prices, opening hours, deadlines, or service availability. For current or consequential details, explain the language and direct the learner to an official source or qualified professional.
- Do not make medical, legal, or financial decisions. Never ask for passwords, national-register numbers, bank details, or card numbers.
- When mentioning the app, write lerenbe.com (never "Leren.be", which Telegram can link to a different site).

Formatting: plain text with Telegram HTML only. Use only <b> and <i> tags; no Markdown, headings, or tables.`;

// Escape everything, then allow back only <b> and <i> so a stray "<" from the model can't break Telegram HTML.
const safeHtml = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, "<$1$2>");

async function askClaude(env, question, previousQuestion, previousAnswer) {
  const messages = [
    ...(previousQuestion && previousAnswer ? [{role: "user", content: previousQuestion}, {role: "assistant", content: previousAnswer}] : []),
    {role: "user", content: question}
  ];
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
/help — підказка, як поставити питання
/word — випадкове слово
/quiz — міні-вікторина
/app — застосунок lerenbe.com
/bug — повідомити про помилку (опишіть екран словами)`;

// Testers' group: one topic per kind of feedback, each opened with a pinned template.
const TOPICS = [
  {name: "🐞 Помилки", icon_color: 16478047, text: `🐞 <b>Сюди — помилки в застосунку</b>

Одна помилка = одне повідомлення. Напишіть:
1. <b>Пристрій:</b> Android / iPhone / комп'ютер, браузер або встановлений застосунок
2. <b>Де:</b> розділ і тема (наприклад, Урок → «Wie ben jij?» → Тест)
3. <b>Що робили:</b> крок за кроком
4. <b>Що сталося</b> і <b>що мало статися</b>
5. Опишіть екран словами; файли бот не передає

Дякуємо, кожен звіт робить Leren кращим 💛`},
  {name: "❓ Питання", icon_color: 7322096, text: `❓ <b>Сюди — питання</b>

Щось незрозуміло в застосунку, у завданні чи в поясненні граматики? Питайте тут. Якщо питання про екран, опишіть його словами — бот не передає файли.`},
  {name: "💡 Ідеї", icon_color: 16766590, text: `💡 <b>Сюди — ідеї та побажання</b>

Чого не вистачає? Яку тему, гру чи вправу додати? Що зробити зручніше?
Ставте 👍 ідеям інших, і найпопулярніші підуть у роботу першими.`}
];
async function makeTopics(env, msg) {
  const chat = msg.chat.id;
  if (!msg.chat.is_forum) return tg(env, "sendMessage", {chat_id: chat, text: "Спершу ввімкніть Теми: група → ✏️ Змінити → Теми (Topics). Потім надішліть /topics ще раз."});
  const made = [];
  for (const t of TOPICS) {
    const topic = await tg(env, "createForumTopic", {chat_id: chat, name: t.name, icon_color: t.icon_color});
    if (!topic.ok) return tg(env, "sendMessage", {chat_id: chat, text: "Не вдалося створити тему: " + topic.description + "\nДайте боту права адміністратора «Керування темами» та «Закріплення повідомлень»."});
    const m = await tg(env, "sendMessage", {chat_id: chat, message_thread_id: topic.result.message_thread_id, text: t.text, parse_mode: "HTML"});
    if (m.ok) await tg(env, "pinChatMessage", {chat_id: chat, message_id: m.result.message_id, disable_notification: true});
    made.push(t.name);
  }
  return tg(env, "sendMessage", {chat_id: chat, text: "✅ Готово: " + made.join(", ")});
}

// --- Bug reports ---------------------------------------------------------------------------------
const BUG_HELP = `🐞 <b>Повідомлення про помилку</b>

Надішліть сюди одним або кількома повідомленнями:
📝 що ви робили, що сталося і що мало статися
📱 пристрій: Android / iPhone / комп'ютер, браузер чи застосунок

Файли бот не пересилає, тож опишіть екран словами. Коли все надішлете, натисніть /done.`;
const BUG_TTL = 3600; // report mode ends by itself after an hour of silence; "new" until the first message, then "1"
const reportsTo = env => ({chat_id: env.REPORTS_CHAT || env.ADMIN_ID, ...(env.REPORTS_THREAD ? {message_thread_id: +env.REPORTS_THREAD} : {})});
// Remember which tester each forwarded message came from, so a reply to it can be sent back (30 days).
const remember = (env, r, user) => r?.ok && env.RATE?.put("tg:rep:" + r.result.message_id, String(user), {expirationTtl: 2592000}).catch(() => {});

async function relayReport(env, msg, first) {
  const to = reportsTo(env), u = msg.from;
  if (first) {
    const who = esc([u.first_name, u.last_name].filter(Boolean).join(" ")) + (u.username ? " @" + esc(u.username) : "");
    await remember(env, await tg(env, "sendMessage", {...to, text: `🐞 <b>Новий звіт</b> від ${who} (<code>${u.id}</code>)\n<i>Відповідайте реплаєм, і бот передасть відповідь.</i>`, parse_mode: "HTML"}), u.id);
  }
  const reportText = msg.text || msg.caption || (msg.photo || msg.video || msg.document || msg.animation ? "📎 Вкладення отримано від тестувальника (не переслано)." : "");
  if (reportText) await remember(env, await tg(env, "sendMessage", {...to, text: reportText}), u.id);
  await env.RATE?.put("tg:bug:" + u.id, "1", {expirationTtl: BUG_TTL}).catch(() => {});
  // One confirmation per message; for an album only the photo with the caption answers, not every photo.
  if (first) return tg(env, "sendMessage", {chat_id: msg.chat.id, text: "✅ Дякуємо! Текст звіту передано команді. Можете додати ще опис, а коли все — /done."});
  if (!msg.media_group_id || msg.caption) return tg(env, "sendMessage", {chat_id: msg.chat.id, text: "✅ Додано до звіту. Ще щось? Коли все — /done."});
}

// The admin replies to a forwarded report: copy the reply to the tester.
async function relayAnswer(env, msg) {
  const user = await env.RATE?.get("tg:rep:" + msg.reply_to_message.message_id);
  if (!user) return false;
  await tg(env, "sendMessage", {chat_id: user, text: "💬 <b>Відповідь від команди lerenbe.com:</b>", parse_mode: "HTML"});
  const replyText = msg.text || msg.caption || "Відповідайте текстом, будь ласка — вкладення бот не пересилає.";
  const r = await tg(env, "sendMessage", {chat_id: user, text: replyText});
  await tg(env, "sendMessage", {chat_id: msg.chat.id, ...(msg.message_thread_id ? {message_thread_id: msg.message_thread_id} : {}), text: r.ok ? "✅ Відповідь надіслано" : "❌ Не вдалося надіслати: " + r.description, reply_parameters: {message_id: msg.message_id}});
  return true;
}

async function onMessage(env, msg) {
  const chat = msg.chat.id, text = (msg.text || "").trim();
  const isAdmin = String(msg.from?.id) === String(env.ADMIN_ID);
  if (msg.chat.type === "supergroup" && isAdmin && /^\/topics(@\w+)?$/.test(text)) return makeTopics(env, msg);
  if (isAdmin && msg.reply_to_message && await relayAnswer(env, msg)) return;
  if (msg.chat.type !== "private") return;
  const media = msg.photo || msg.video || msg.document || msg.animation;
  const reporting = env.RATE && await env.RATE.get("tg:bug:" + msg.from.id).catch(() => null);
  if (!text.startsWith("/") && (reporting || media)) return relayReport(env, msg, reporting !== "1");
  if (!text) return;
  const [cmd, arg] = text.split(/\s+/);
  const day = brussels().day;
  const random = Math.floor(Math.random() * 1e6);

  if (cmd === "/start") {
    if (env.RATE) await env.RATE.put("tg:u:" + msg.from.id, arg || "direct").catch(() => {});
    return tg(env, "sendMessage", {chat_id: chat, text: WELCOME, parse_mode: "HTML", reply_markup: appButton({})});
  }
  if (cmd === "/help") return tg(env, "sendMessage", {chat_id: chat, text: WELCOME, parse_mode: "HTML", reply_markup: appButton({})});
  if (cmd === "/word") return postWord(env, chat, random);
  if (cmd === "/quiz") return postQuiz(env, chat, random);
  if (cmd === "/app") return postText(env, chat, pick(content.promos, random));
  if (cmd === "/bug") {
    await env.RATE?.put("tg:bug:" + msg.from.id, "new", {expirationTtl: BUG_TTL}).catch(() => {});
    return tg(env, "sendMessage", {chat_id: chat, text: BUG_HELP, parse_mode: "HTML"});
  }
  if (cmd === "/done") {
    await env.RATE?.delete("tg:bug:" + msg.from.id).catch(() => {});
    return tg(env, "sendMessage", {chat_id: chat, text: "🙏 Дякуємо за допомогу! Ми розберемося й, можливо, напишемо вам тут."});
  }
  if (cmd === "/id") return tg(env, "sendMessage", {chat_id: chat, text: `Ваш id: <code>${msg.from.id}</code>`, parse_mode: "HTML"});
  if (isAdmin && (cmd === "/post" || cmd === "/preview")) {
    if (!["word", "quiz", "tip", "fact", "promo", "welcome", "stickers"].includes(arg)) return tg(env, "sendMessage", {chat_id: chat, text: `${cmd} word | quiz | tip | fact | promo | welcome | stickers`});
    const r = await runJob(env, arg, cmd === "/post" ? env.CHANNEL : chat, day);
    return cmd === "/post" && tg(env, "sendMessage", {chat_id: chat, text: r?.ok ? "✅ Опубліковано" : "❌ " + (r?.description || "помилка")});
  }
  if (isAdmin && cmd === "/report") return report(env);
  if (isAdmin && cmd === "/stickers") return makeStickers(env, chat);
  if (text.startsWith("/")) return tg(env, "sendMessage", {chat_id: chat, text: "Не знаю такої команди 🙂 Спробуйте /word, /quiz або просто напишіть питання."});

  if (env.AI_OFF === "1" || await limited(env, msg.from.id))
    return tg(env, "sendMessage", {chat_id: chat, text: "Забагато питань за хвилину 🙂 Спробуйте трохи пізніше, а поки потренуйтеся в застосунку.", reply_markup: appButton({})});
  await tg(env, "sendChatAction", {chat_id: chat, action: "typing"});
  const botReply = msg.reply_to_message?.from?.is_bot ? msg.reply_to_message : null;
  const previousQuestion = botReply?.reply_to_message?.from?.is_bot ? "" : (botReply?.reply_to_message?.text || "");
  const previousAnswer = botReply?.text || "";
  const answer = await askClaude(env, text.slice(0, 1500), previousQuestion.slice(0, 1500), previousAnswer.slice(0, 1500));
  if (!answer) return tg(env, "sendMessage", {chat_id: chat, text: "Не вдалося відповісти 😔 Спробуйте ще раз за хвилину."});
  const r = await tg(env, "sendMessage", {chat_id: chat, text: safeHtml(answer), parse_mode: "HTML", reply_parameters: {message_id: msg.message_id}});
  if (!r.ok) return tg(env, "sendMessage", {chat_id: chat, text: answer.replace(/<\/?[bi]>/g, "")});
}

async function setup(env, origin) {
  const results = {
    webhook: await tg(env, "setWebhook", {url: origin + "/tg", secret_token: env.WEBHOOK_SECRET, allowed_updates: ["message"], drop_pending_updates: true}),
    commands: await tg(env, "setMyCommands", {commands: [
      {command: "help", description: "Як спілкуватися з викладачем"},
      {command: "word", description: "Випадкове слово дня"},
      {command: "quiz", description: "Міні-вікторина"},
      {command: "app", description: "Застосунок lerenbe.com"},
      {command: "bug", description: "Повідомити про помилку"}]}),
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

export {brussels, tipNumber, factNumber, safeHtml, SCHEDULE};
