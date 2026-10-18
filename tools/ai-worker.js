// Leren.be — "Praat met Lotte" AI tutor proxy (Cloudflare Worker). Keeps API keys off the website.
// Deploy: Cloudflare → Workers & Pages → Create → Worker → paste this file → Deploy.
// Choose ONE provider with the variable PROVIDER:
//   "anthropic"  — Claude (best Dutch + Ukrainian explanations). Secret ANTHROPIC_KEY. Optional MODEL (default claude-haiku-5-5).
//   "gemini"     — Google Gemini PAID tier (the free tier may not be used for apps serving EU users). Secret GEMINI_KEY. Optional MODEL.
//   "workers-ai" — Cloudflare Workers AI (free daily allowance). Add a Workers AI binding named AI. Optional MODEL.
// Optional: KV binding RATE (daily limit per visitor, DAILY_LIMIT default 60 messages).
const ALLOWED_ORIGINS = ["https://gembarskydanylo.github.io", "http://localhost:8765"];
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
// Condensed curriculum (from the Leren.be knowledge base) used to ground corrections.
const GRAMMAR = `- Main clause: verb in 2nd position (Ik woon in België). After a time/place word first: inversion (Om zeven uur sta ik op).
- Present tense: ik + stem (ik werk, ik woon, ik sta), jij/hij/zij + stem+t (jij werkt, hij woont); no -t when jij comes after the verb (Werk jij?). wij/jullie/zij + infinitive (wij werken).
- Long vowel written double in closed syllable: slapen → ik slaap; double consonant becomes single: zwemmen → ik zwem; z→s, v→f at the end of the stem: lezen → ik lees, geven → ik geef; stem on d + t = dt (hij vindt).
- zijn: ik ben, jij bent, u bent, hij/zij is, wij zijn. hebben: ik heb, jij hebt, u heeft, hij heeft, wij hebben.
- Separable verbs: the particle goes to the end (opstaan → Ik sta om zeven uur op; meenemen → Ik neem een paraplu mee).
- Negation: geen before an indefinite noun (Ik heb geen auto), niet otherwise (Ik werk niet).
- Questions: question word + verb + subject (Waar woon jij?); yes/no: verb first (Woon jij in Gent?).
- Articles: de/het must be learned with the noun (het station, het huis, de winkel, de apotheek); diminutives -je are het.
- Polite: u (formal), alstublieft / alsjeblieft, graag (Ik wil graag een koffie).`;
const system = (lang, level, scene) => `You are Lotte, a warm, patient Flemish woman who helps an adult ${level === "a12" ? "A1.2" : "A1.1"} learner practise Dutch as spoken in Belgium (nl-BE). You are an AI tutor, not a human.
${scene && SCENES[scene] ? "Role-play situation: " + SCENES[scene] : "Free conversation about everyday life in Belgium (family, work, CVO school, shopping, weather, hobbies, transport)."}
Course grammar (follow it when correcting):
${GRAMMAR}
Rules:
- reply_nl: very simple Dutch, max 2 short sentences, present tense, common words; continue the conversation and ask exactly ONE simple question.
- translation: translation of reply_nl into ${LANG[lang] || "Ukrainian"}.
- correction: only if the learner's LAST message has a real mistake (grammar, word order, wrong word) or is not in Dutch: {"original": their text, "corrected": natural Dutch sentence, "explanation": one short sentence in ${LANG[lang] || "Ukrainian"} explaining the rule}. Correct at most the 1–2 most important errors. Otherwise null. Never invent errors.
- Be encouraging. Do not give medical, legal or financial decisions; in such cases teach the words and suggest a professional.
- Never ask for or repeat passwords, national register numbers, bank or card numbers. Stay on everyday Dutch practice; refuse unsafe or adult topics kindly and return to the lesson.
Return ONLY valid JSON: {"reply_nl": "...", "translation": "...", "correction": null}`;

function parseJSON(t) {
  if (!t) return null;
  const m = String(t).match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : t); } catch { return null; }
}

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
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({role: m.role, content: m.content.slice(0, 400)}));
    if (!msgs.length || msgs[0].role !== "user") msgs.unshift({role: "user", content: "(Start: greet me in Dutch and ask one easy question that fits the situation.)"});
    const sys = system(body.lang, body.level, body.scene);
    const provider = env.PROVIDER || (env.ANTHROPIC_KEY ? "anthropic" : env.GEMINI_KEY ? "gemini" : "workers-ai");
    try {
      let text = "";
      if (provider === "anthropic") {
        const r = await fetch("https://api.anthropic.com/v1/messages", {method: "POST", headers: {"content-type": "application/json", "x-api-key": env.ANTHROPIC_KEY, "anthropic-version": "2023-06-01"},
          body: JSON.stringify({model: env.MODEL || "claude-haiku-5-5", max_tokens: 400, temperature: 0.6, system: sys, messages: msgs})});
        const j = await r.json(); text = (j.content || []).map(c => c.text || "").join("");
      } else if (provider === "gemini") {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.MODEL || "gemini-3.5-flash-lite"}:generateContent`, {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY},
          body: JSON.stringify({systemInstruction: {parts: [{text: sys}]}, contents: msgs.map(m => ({role: m.role === "assistant" ? "model" : "user", parts: [{text: m.content}]})), generationConfig: {maxOutputTokens: 400, temperature: 0.6, responseMimeType: "application/json"}})});
        const j = await r.json(); text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      } else {
        const r = await env.AI.run(env.MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {messages: [{role: "system", content: sys}, ...msgs], max_tokens: 400, temperature: 0.6});
        text = r?.response || "";
      }
      const o = parseJSON(text);
      if (!o || !o.reply_nl) return json({error: "format"}, 502);
      const c = o.correction && o.correction.corrected ? {original: String(o.correction.original || "").slice(0, 300), corrected: String(o.correction.corrected).slice(0, 300), explanation: String(o.correction.explanation || "").slice(0, 300)} : null;
      return json({reply_nl: String(o.reply_nl).slice(0, 400), translation: String(o.translation || "").slice(0, 400), correction: c});
    } catch (e) { return json({error: "ai"}, 502); }
  }
};
