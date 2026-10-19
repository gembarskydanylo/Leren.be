// Leren.be — "Praat met Roel / Lotte" AI tutor proxy (Cloudflare Worker). Keeps API keys off the website.
// Deploy: Cloudflare → Workers & Pages → Create → Worker → paste this file → Deploy.
// Choose ONE provider with the variable PROVIDER:
//   "anthropic"  — Claude (best Dutch + Ukrainian explanations). Secret ANTHROPIC_KEY. Optional MODEL (default claude-haiku-5-5).
//   "gemini"     — Google Gemini PAID tier (the free tier may not be used for apps serving EU users). Secret GEMINI_KEY. Optional MODEL.
//   "workers-ai" — Cloudflare Workers AI (free daily allowance). Add a Workers AI binding named AI. Optional MODEL.
// Optional: KV binding RATE (daily limit per visitor, DAILY_LIMIT default 60 messages).
//
// Request:  {mode: "chat"|"ask", target: "nl"|"en"|"fr", lang: UI language, level, scene, char, messages: [{role, content}]}
// Response: chat → {reply, reply_nl, translation, correction|null}
//           ask  → {answer, examples: [{lang, text, translation}]}
const ALLOWED_ORIGINS = ["https://gembarskydanylo.github.io", "https://lerenbe.com", "https://www.lerenbe.com", "http://localhost:8765"];
const LANG = {uk: "Ukrainian", en: "English", fr: "French", ar: "Arabic"};
const SCENES = {
  cafe: "You are a barista in a Flemish café. The learner orders a drink, chooses milk/size and pays.",
  super: "You work in a Belgian supermarket. The learner asks where products are, asks prices, loyalty card.",
  huisarts: "You are the GP's assistant (huisarts). The learner explains symptoms (keelpijn, koorts, hoest); you ask since when and give simple advice.",
  apotheek: "You are a pharmacist. The learner asks for something against pain/cold; you ask about symptoms and explain dosage simply.",
  gemeente: "You work at the gemeente (town hall). The learner changes address; you ask for ID card and new address; mention the wijkagent visit.",
  station: "You sell train tickets at a Belgian station. The learner buys a ticket (enkel / heen en terug), you give price, time and platform (spoor).",
  buren: "You are the learner's new Flemish neighbour. Small talk: names, where from, how long here, invite for coffee."
};
// Condensed curricula (from the Leren.be knowledge base) used to ground corrections.
const GRAMMAR_NL = `- Main clause: verb in 2nd position (Ik woon in België). After a time/place word first: inversion (Om zeven uur sta ik op).
- Present tense: ik + stem (ik werk, ik woon, ik sta), jij/hij/zij + stem+t (jij werkt, hij woont); no -t when jij comes after the verb (Werk jij?). wij/jullie/zij + infinitive (wij werken).
- Long vowel written double in closed syllable: slapen → ik slaap; double consonant becomes single: zwemmen → ik zwem; z→s, v→f at the end of the stem: lezen → ik lees, geven → ik geef; stem on d + t = dt (hij vindt).
- zijn: ik ben, jij bent, u bent, hij/zij is, wij zijn. hebben: ik heb, jij hebt, u heeft, hij heeft, wij hebben.
- Separable verbs: the particle goes to the end (opstaan → Ik sta om zeven uur op; meenemen → Ik neem een paraplu mee).
- Negation: geen before an indefinite noun (Ik heb geen auto), niet otherwise (Ik werk niet).
- Questions: question word + verb + subject (Waar woon jij?); yes/no: verb first (Woon jij in Gent?).
- Articles: de/het must be learned with the noun (het station, het huis, de winkel, de apotheek); diminutives -je are het.
- Polite: u (formal), alstublieft / alsjeblieft, graag (Ik wil graag een koffie).
- A1.2: modal verbs (kunnen, moeten, willen, mogen + infinitive at the end), perfectum (hebben/zijn + voltooid deelwoord: ik heb gewerkt, ik ben gegaan), future gaan + infinitive.`;
const GRAMMAR_EN = `- Word order: subject + verb + object (I live in Belgium). Questions with do/does (Do you work? Where does she live?); with be/can: invert (Are you tired? Can you help?).
- Present simple: he/she/it + -s (she works, he goes, it has); negative don't/doesn't + base verb.
- be: I am, you are, he/she/it is, we/they are. have got / has got.
- Present continuous for now: I am working. Past simple: worked, went, was/were.
- Articles: a/an (a car, an apple), the; no article for general plurals (I like dogs).
- Plurals: -s/-es, irregular (children, people, men, women).
- Polite: please, thank you, Could I have…? I'd like…`;
const GRAMMAR_FR = `- Word order: sujet + verbe + complément (J'habite en Belgique). Questions: est-ce que…? or intonation (Tu travailles ?); formal inversion (Où habitez-vous ?).
- Present tense: -er verbs (je parle, tu parles, il parle, nous parlons, vous parlez, ils parlent); être (je suis, tu es, il est, nous sommes, vous êtes, ils sont), avoir (j'ai, tu as, il a, nous avons, vous avez, ils ont), aller, faire.
- Gender: le/la/l', un/une; adjectives agree (un petit café, une petite maison). Plural les/des.
- Negation: ne … pas (Je ne travaille pas); de after negation (Je n'ai pas de voiture).
- Polite: vous (formal), s'il vous plaît, je voudrais…
- Belgian usage: septante (70), nonante (90); déjeuner = lunch in BE is 'dîner', breakfast 'déjeuner'.
- A1+: passé composé (j'ai travaillé, je suis allé), futur proche (je vais manger).`;
const TARGET = {
  nl: {name: "Dutch as spoken in Belgium (nl-BE, Flemish)", grammar: GRAMMAR_NL, place: "everyday life in Belgium (family, work, CVO school, shopping, weather, hobbies, transport)"},
  en: {name: "English (British spelling)", grammar: GRAMMAR_EN, place: "everyday life (family, work, school, shopping, weather, hobbies, travel)"},
  fr: {name: "French as spoken in Belgium (fr-BE)", grammar: GRAMMAR_FR, place: "everyday life in Belgium (famille, travail, école, courses, météo, loisirs, transports)"}
};
const PERSONA = {
  roel: "Roel, a calm, friendly Flemish language teacher of about 50 with a gentle sense of humour; you explain rules simply, like on a whiteboard",
  lotte: "Lotte, a warm, cheerful young Flemish woman and language coach"
};
const SAFETY = `- Be encouraging. Do not give medical, legal or financial decisions; in such cases teach the words and suggest a professional.
- Never ask for or repeat passwords, national register numbers, bank or card numbers. Refuse unsafe or adult topics kindly and return to the lesson.`;

function chatSystem(t, lang, level, scene, char) {
  const T = TARGET[t] || TARGET.nl, L = LANG[lang] || "Ukrainian";
  const sceneText = t === "nl" && scene && SCENES[scene] ? "Role-play situation: " + SCENES[scene] : "Free conversation about " + T.place + ".";
  return `You are ${PERSONA[char] || PERSONA.roel}. You help an adult ${level === "a12" ? "A1.2" : "A1.1"} learner practise ${T.name} by chatting. You are an AI tutor, not a human. The learner's own language is ${L}.
${sceneText}
Course grammar (follow it when correcting):
${T.grammar}
Rules:
- reply: very simple ${T.name}, max 2 short sentences, common words; continue the conversation and ask exactly ONE simple question. Always write reply in the target language, even if the learner writes in another language.
- translation: translation of reply into ${L}.
- correction: set has_error true only if the learner's LAST message has a real mistake (grammar, word order, wrong word) or is not in the target language; then original = their text, corrected = a natural sentence in the target language, explanation = one short sentence explaining the rule, written in ${L} (never in the target language). Correct at most the 1–2 most important errors. Never invent errors. If there is no mistake: has_error false and empty strings.
- Stay on language practice. If the learner asks about something unrelated to learning languages, say in reply (in the target language, very simply) that you only help with language practice and steer back.
${SAFETY}
LANGUAGE RULE: "reply" and "corrected" are in the target language; "translation" and "explanation" are ALWAYS in ${L}, never in Dutch, English or French unless ${L} is that language.`;
}

function askSystem(t, lang, level, char) {
  const T = TARGET[t] || TARGET.nl, L = LANG[lang] || "Ukrainian";
  return `You are ${PERSONA[char] || PERSONA.roel}, the language tutor inside the Leren.be app. You are an AI tutor, not a human. You always talk to the learner in ${L}. The learner is an adult beginner (${level === "a12" ? "A1.2" : "A1"}) who is studying ${T.name}; the app also teaches Dutch (nl-BE), English and French.
Your ONLY job is helping the learner learn Dutch, English or French: grammar, vocabulary and word meanings, translation of words and short phrases, pronunciation tips, spelling, de/het and le/la, verb forms, example sentences, short practice exercises or quizzes on request, study tips, and the culture behind everyday language (greetings, politeness, Belgian expressions).
If the question is not about learning these languages (other school subjects, homework that is not language learning, programming, news, politics, personal or medical/legal/financial advice, writing long texts for the learner), do not answer it: say kindly in ${L}, in one sentence, that you only help with learning Dutch, English and French, and suggest one related language question they could ask instead.
Grammar notes for ${T.name} (keep explanations consistent with them):
${T.grammar}
Answer format:
- answer: ALWAYS written in ${L}, also when you decline a question; short and simple (max about 120 words), beginner-friendly, no tables, no markdown headings; you may use line breaks and "•" bullets. Put words in the studied language in «guillemets».
- examples: 0–3 short example sentences that illustrate the answer; lang is the language of the example (nl, en or fr), text is the sentence, translation is its ${L} translation. Use [] when examples do not help (for example when declining an off-topic question).
- If the learner asks for an exercise, give one or two short tasks in answer and put the solutions at the end after "→".
${SAFETY}
LANGUAGE RULE: the whole "answer" is written in ${L}, including when you decline; only the words you quote in «guillemets» and the example sentences are in Dutch, English or French.`;
}

const STR = {type: "string"};
const schemaFor = (mode, L) => mode === "ask"
  ? {type: "object", additionalProperties: false, required: ["answer", "examples"], properties: {
      answer: {type: "string", description: `Written in ${L}.`},
      examples: {type: "array", items: {type: "object", additionalProperties: false, required: ["lang", "text", "translation"],
        properties: {lang: {type: "string", enum: ["nl", "en", "fr"]}, text: STR, translation: {type: "string", description: `Translation into ${L}.`}}}}}}
  : {type: "object", additionalProperties: false, required: ["reply", "translation", "correction"], properties: {
      reply: {type: "string", description: "In the target language."}, translation: {type: "string", description: `Translation of reply into ${L}.`},
      correction: {type: "object", additionalProperties: false, required: ["has_error", "original", "corrected", "explanation"],
        properties: {has_error: {type: "boolean"}, original: STR, corrected: STR, explanation: {type: "string", description: `Short rule explanation written in ${L}.`}}}}};

function parseJSON(t) {
  if (!t) return null;
  const m = String(t).match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : t); } catch { return null; }
}
const cut = (s, n) => String(s || "").slice(0, n);

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {"Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin"};
    if (req.method === "OPTIONS") return new Response(null, {headers: cors});
    const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {...cors, "Content-Type": "application/json"}});
    if (req.method !== "POST" || !ALLOWED_ORIGINS.includes(origin)) return json({error: "forbidden"}, 403);

    // daily limit per visitor (optional KV binding RATE)
    if (env.RATE) {
      const ip = req.headers.get("CF-Connecting-IP") || "x";
      const key = new Date().toISOString().slice(0, 10) + ":" + ip;
      const n = Number(await env.RATE.get(key)) || 0;
      if (n >= Number(env.DAILY_LIMIT || 60)) return json({error: "limit"}, 429);
      await env.RATE.put(key, String(n + 1), {expirationTtl: 90000});
    }

    let body; try { body = await req.json(); } catch { return json({error: "bad json"}, 400); }
    const mode = body.mode === "ask" ? "ask" : "chat";
    const target = TARGET[body.target] ? body.target : "nl"; // older app versions send no target → Dutch
    const maxLen = mode === "ask" ? 600 : 400;
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map(m => ({role: m.role, content: m.content.slice(0, maxLen)}));
    if (mode === "ask") { while (msgs.length && msgs[0].role !== "user") msgs.shift(); if (!msgs.length) return json({error: "empty"}, 400); }
    else if (!msgs.length || msgs[0].role !== "user") msgs.unshift({role: "user", content: "(Start: greet me in the target language and ask one easy question that fits the situation.)"});
    const sys = mode === "ask" ? askSystem(target, body.lang, body.level, body.char) : chatSystem(target, body.lang, body.level, body.scene, body.char);
    const schema = schemaFor(mode, LANG[body.lang] || "Ukrainian");
    const provider = env.PROVIDER || (env.ANTHROPIC_KEY ? "anthropic" : env.GEMINI_KEY ? "gemini" : "workers-ai");
    try {
      let text = "";
      if (provider === "anthropic") {
        // Structured outputs guarantee valid JSON; low effort keeps replies fast and cheap.
        const r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST", headers: {"content-type": "application/json", "x-api-key": env.ANTHROPIC_KEY, "anthropic-version": "2023-06-01"},
          body: JSON.stringify({model: env.MODEL || "claude-haiku-5-5", max_tokens: 4000, system: sys, messages: msgs,
            output_config: {effort: env.EFFORT || (mode === "ask" ? "medium" : "low"), format: {type: "json_schema", schema}}})});
        const j = await r.json();
        if (!r.ok) { console.log("anthropic", r.status, JSON.stringify(j).slice(0, 300)); return json({error: "ai"}, 502); }
        if (j.stop_reason === "refusal") return json({error: "refusal"}, 502);
        text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
      } else if (provider === "gemini") {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.MODEL || "gemini-3.5-flash-lite"}:generateContent`, {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY},
          body: JSON.stringify({systemInstruction: {parts: [{text: sys + "\nReturn ONLY valid JSON matching this schema: " + JSON.stringify(schema)}]}, contents: msgs.map(m => ({role: m.role === "assistant" ? "model" : "user", parts: [{text: m.content}]})), generationConfig: {maxOutputTokens: 1200, temperature: 0.6, responseMimeType: "application/json"}})});
        const j = await r.json(); text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      } else {
        const r = await env.AI.run(env.MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {messages: [{role: "system", content: sys + "\nReturn ONLY valid JSON matching this schema: " + JSON.stringify(schema)}, ...msgs], max_tokens: 1200, temperature: 0.6});
        text = typeof r?.response === "string" ? r.response : JSON.stringify(r?.response || "");
      }
      const o = parseJSON(text);
      if (mode === "ask") {
        if (!o || !o.answer) return json({error: "format"}, 502);
        const ex = (Array.isArray(o.examples) ? o.examples : []).filter(e => e && e.text && ["nl", "en", "fr"].includes(e.lang)).slice(0, 3)
          .map(e => ({lang: e.lang, text: cut(e.text, 200), translation: cut(e.translation, 200)}));
        return json({answer: cut(o.answer, 1500), examples: ex});
      }
      const reply = o && (o.reply || o.reply_nl);
      if (!reply) return json({error: "format"}, 502);
      const k = o.correction;
      const c = k && k.corrected && k.has_error !== false ? {original: cut(k.original, 300), corrected: cut(k.corrected, 300), explanation: cut(k.explanation, 300)} : null;
      return json({reply: cut(reply, 400), reply_nl: cut(reply, 400), translation: cut(o.translation, 400), correction: c});
    } catch (e) { return json({error: "ai"}, 502); }
  }
};
