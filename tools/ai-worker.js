// Leren.be — "Praat met Lotte" AI chat proxy (Cloudflare Worker). Keeps the AI key off the website.
// Deploy: Cloudflare dashboard → Workers & Pages → Create Worker → paste this file → Deploy.
// Default provider: Cloudflare Workers AI (free daily allowance) → add a "Workers AI" binding named AI.
// Optional: Gemini paid tier (required for apps used in the EU) → set secret GEMINI_KEY and var PROVIDER=gemini.
const ALLOWED_ORIGINS = ["https://gembarskydanylo.github.io", "http://localhost:8765"];
const LANG = {uk: "Ukrainian", en: "English", fr: "French", ar: "Arabic"};
const system = (lang, level) => `You are Lotte, a friendly Flemish woman in Belgium who helps a ${level === "a12" ? "A1.2" : "A1.1"} learner practise Dutch.
Rules:
- Always answer in very simple Belgian Dutch (A1): max 2 short sentences, common words, present tense. Ask one simple follow-up question to keep the conversation going.
- Topics: daily life in Belgium (shop, café, doctor, school/CVO, family, hobbies, weather, transport, gemeente).
- If the learner's last message has a mistake, add ONE new line that starts with "✏️" containing the corrected Dutch sentence and a very short explanation in ${LANG[lang] || "Ukrainian"}.
- If the learner writes in another language, answer in Dutch and add a "✏️" line with how to say it in Dutch.
- Never discuss unsafe, adult or political topics; gently return to everyday Dutch practice. Never ask for personal data like address, phone or ID numbers.`;

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {"Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin"};
    if (req.method === "OPTIONS") return new Response(null, {headers: cors});
    const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {...cors, "Content-Type": "application/json"}});
    if (req.method !== "POST" || !ALLOWED_ORIGINS.includes(origin)) return json({error: "forbidden"}, 403);
    let body; try { body = await req.json(); } catch { return json({error: "bad json"}, 400); }
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12)
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({role: m.role, content: m.content.slice(0, 400)}));
    if (!msgs.length) msgs.push({role: "user", content: "Hallo! (Start the conversation: greet me and ask my name.)"});
    const sys = system(body.lang, body.level);
    try {
      let reply = "";
      if (env.PROVIDER === "gemini" && env.GEMINI_KEY) {
        const model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY},
          body: JSON.stringify({systemInstruction: {parts: [{text: sys}]}, contents: msgs.map(m => ({role: m.role === "assistant" ? "model" : "user", parts: [{text: m.content}]})), generationConfig: {maxOutputTokens: 200, temperature: 0.7}})
        });
        const j = await r.json();
        reply = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      } else {
        const r = await env.AI.run(env.CF_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {messages: [{role: "system", content: sys}, ...msgs], max_tokens: 200, temperature: 0.7});
        reply = r?.response || "";
      }
      reply = reply.trim().slice(0, 600);
      if (!reply) return json({error: "empty"}, 502);
      return json({reply});
    } catch (e) { return json({error: "ai"}, 502); }
  }
};
