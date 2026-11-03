// Scenario regression for the AI tutor, through the real Worker code with a MOCKED model.
// The model's answer is scripted (no key, no network): these tests check what the Worker sends to the model (system prompt, history)
// and what it lets through to the app (correction cards, severity, has_error), i.e. the parts that are code and not model judgement.
// Run: node tests/ai-dialogue-scenarios.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ORIGIN = "https://lerenbe.com", IP = "203.0.113.5", DEV = "dddddddddddddddddddddddd";
const kv = () => { const m = new Map(); return {m, async get(k) { return m.get(k) ?? null; }, async put(k, v) { m.set(k, v); }}; };
const env = () => ({PROVIDER: "anthropic", ANTHROPIC_KEY: "sk-test", RATE: kv()});
const NONE = {has_error: false, severity: "minor", original: "", corrected: "", explanation: ""};
const fix = (corrected, severity = "minor", explanation = "Коротке правило.") => ({has_error: true, severity, original: "", corrected, explanation});
const modelAnswer = (reply, correction = NONE, extra = {}) => ({learner_in_target: extra.said || "", reply, translation: "Переклад.", correction});

let sent; // last request body the Worker sent to the model
const mockModel = answer => async (url, opts) => { sent = JSON.parse(opts.body); return {ok: true, status: 200, json: async () => ({stop_reason: "end_turn", content: [{type: "text", text: JSON.stringify(answer)}]})}; };

async function load() {
  const src = fs.readFileSync(path.join(__dirname, "../tools/ai-worker.js"), "utf8");
  return (await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"))).default;
}
(async () => {
  const worker = await load(), realFetch = globalThis.fetch;
  const ask = async (answer, {style = "teacher", messages, text, spoken, scene, profile, exam} = {}) => {
    globalThis.fetch = mockModel(answer);
    try {
      const msgs = messages || [{role: "assistant", content: "Hallo! Hoe gaat het?"}, {role: "user", content: text + (spoken ? "\n[spoken; other possible transcriptions: " + spoken.join(" | ") + "]" : "")}];
      const body = {mode: "chat", style, target: "nl", lang: "uk", level: "a11", char: "peter", scene, exam, profile, messages: msgs};
      const req = new Request("https://x/", {method: "POST", headers: {Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": IP, "X-Leren-Device": DEV}, body: JSON.stringify(body)});
      const res = await worker.fetch(req, env(), {waitUntil() {}});
      return {status: res.status, json: await res.json()};
    } finally { globalThis.fetch = realFetch; }
  };
  const tests = [];
  const t = (name, fn) => tests.push([name, fn]);

  t("contract: a correction always carries has_error:true and severity (the app shows cards only then)", async () => {
    const r = await ask(modelAnswer("Oké, en jij?", fix("Goed, en met jou?")), {text: "Ik goed, en met jou?"});
    assert.equal(r.status, 200);
    assert.deepEqual({...r.json.correction}, {has_error: true, severity: "minor", original: "Ik goed, en met jou?", corrected: "Goed, en met jou?", explanation: "Коротке правило."});
    assert.equal((await ask(modelAnswer("Oké."), {text: "Ik ben Anna."})).json.correction, null);
  });

  t("1. «Ik goed, en met jou?» — teacher gets a card, free talk stays natural; the prompt knows the natural wording", async () => {
    const out = modelAnswer("Fijn! Ik ben ook goed, dank je.", fix("Goed, en met jou?"));
    const teacher = await ask(out, {style: "teacher", text: "Ik goed, en met jou?"});
    assert.equal(teacher.json.correction.corrected, "Goed, en met jou?");
    assert.match(sent.system, /«Goed, en met jou\?» or «Het gaat goed», not a bare «Ik goed»/);
    const talk = await ask(out, {style: "talk", text: "Ik goed, en met jou?"});
    assert.equal(talk.json.correction, null, "a missing verb in a greeting is not worth a card in free talk");
    assert.equal(talk.json.reply, "Fijn! Ik ben ook goed, dank je.");
  });

  t("2. «Ik lees Nederlands boek.» — the missing article is reported in teacher mode, also from voice input", async () => {
    const out = modelAnswer("Wat voor boek is het?", fix("Ik lees een Nederlands boek.", "minor", "Перед іменником у однині потрібен артикль «een»."));
    const typed = await ask(out, {text: "Ik lees Nederlands boek."});
    assert.equal(typed.json.correction.corrected, "Ik lees een Nederlands boek.");
    assert.match(sent.system, /keep an article where Dutch needs one/);
    const voice = await ask(out, {text: "Ik lees Nederlands boek.", spoken: ["ik lees nederlands boek", "ik lees nederlands boeken"]});
    assert.equal(voice.json.correction.corrected, "Ik lees een Nederlands boek.", "a missing word is a language mistake, not a recognition artefact");
    assert.match(sent.messages.at(-1).content, /\[spoken; other possible transcriptions: ik lees nederlands boek \| ik lees nederlands boeken\]/, "the alternatives reach the model");
  });

  t("3. «Ja, dat is comics.» — foreign word fixed while the learner's number is kept; no card in free talk", async () => {
    const out = modelAnswer("Welke strips lees je graag?", fix("Ja, dat zijn strips.", "minor", "«comics» — англійське слово; нідерландською «strips», і тоді «zijn»."));
    const teacher = await ask(out, {text: "Ja, dat is comics.", messages: [{role: "assistant", content: "Lees je graag?"}, {role: "user", content: "Ja, dat is comics."}]});
    assert.equal(teacher.json.correction.corrected, "Ja, dat zijn strips.");
    assert.match(sent.system, /keeping the learner's number \(English "comics" → «strips»\)/);
    assert.doesNotMatch(sent.system, /Ja, het is een stripboek/, "no hard-coded answer that changes the meaning");
    assert.equal((await ask(out, {style: "talk", text: "Ja, dat is comics."})).json.correction, null);
  });

  t("4. «Ik heb morgen een test.» — a correct sentence never gets a correction card, however the model words it", async () => {
    for (const bogus of [fix("Ik heb morgen een test."), fix("Ik heb morgen een test"), fix("ik heb morgen een  TEST!"), NONE]) {
      for (const style of ["teacher", "talk", "slow"]) assert.equal((await ask(modelAnswer("Oei, een test! Ben je zenuwachtig?", bogus), {style, text: "Ik heb morgen een test."})).json.correction, null, style);
    }
    await ask(modelAnswer("Oei, een test!", NONE), {style: "teacher", text: "Ik heb morgen een test."});
    assert.match(sent.system, /A correct sentence gets NO correction/);
    assert.match(sent.system, /Never invent errors and never change what the learner meant/);
    assert.match(sent.system, /sleeping early is tonight, "vanavond"/);
    assert.match(sent.system, /Hard, tiring, stressful or painful news gets a short sympathetic acknowledgement/);
    assert.match(sent.system, /Never invent facts, plans, feelings, memories, progress, dates or events about the learner/);
  });

  t("5. «Ik ga thous.» — typed: the spelling/word mistake is explained; voice: a pure recognition artefact is not blamed on the learner", async () => {
    const out = modelAnswer("Oké. Tot straks!", fix("Ik ga naar huis.", "minor", "«naar huis» — рух додому; «thuis» — місце."));
    assert.equal((await ask(out, {text: "Ik ga thous."})).json.correction.corrected, "Ik ga naar huis.");
    const spellingOut = modelAnswer("Oké.", fix("Ik ga thuis."));
    assert.equal((await ask(spellingOut, {text: "Ik ga thous."})).json.correction.corrected, "Ik ga thuis.", "typed spelling slip is shown");
    assert.equal((await ask(spellingOut, {text: "Ik ga thous.", spoken: ["ik ga thuis", "ik ga thous"]})).json.correction, null, "voice: the recognizer itself heard the correct sentence → artefact");
    assert.equal((await ask(spellingOut, {text: "Ik ga thous.", spoken: ["ik ga thous", "ik ga touw"]})).json.correction.corrected, "Ik ga thuis.", "voice: no alternative has the correct form → it is shown");
    assert.equal((await ask(modelAnswer("Oké.", fix("Ik ga thuis.", "major")), {text: "Ik ga thous.", spoken: ["ik ga thuis"]})).json.correction.severity, "major", "a serious mistake still passes");
  });

  t("6. unclear sentence from voice input — the model is told to ask, and no correction is invented around it", async () => {
    const out = modelAnswer("Sorry, ik versta je niet goed. Bedoel je «ik hou van koffie»?", NONE);
    const r = await ask(out, {text: "ik hout van koffie bedoel", spoken: ["ik hou van koffie bedoel", "ik houd van koffie"]});
    assert.equal(r.status, 200); assert.equal(r.json.correction, null); assert.match(r.json.reply, /Bedoel je/);
    assert.match(sent.system, /Unclear or broken input[^]*do not guess and do not correct\. Ask ONE short clarifying question/);
    assert.match(sent.system, /never correct pure recognition errors/);
    // even if a model "corrects" an unreadable spoken fragment into a different sentence of similar letters, a pure artefact is dropped
    const wrong = await ask(modelAnswer("Oké.", fix("Ik hou van koffie.")), {text: "Ik hout van koffie.", spoken: ["ik hou van koffie", "ik hout van koffie"]});
    assert.equal(wrong.json.correction, null);
  });

  t("7. the same question twice — already-asked questions are listed so the model does not repeat them; repeated learner questions are answered again", async () => {
    const msgs = [{role: "assistant", content: "Hallo! Wat doe je graag?"}, {role: "user", content: "Ik lees."}, {role: "assistant", content: "Leuk. Wat doe je graag?"}, {role: "user", content: "Wat doe jij graag?"}, {role: "assistant", content: "Ik help mensen met Nederlands."}, {role: "user", content: "Wat doe jij graag?"}];
    await ask(modelAnswer("Ik help mensen met Nederlands. Dat doe ik graag!"), {style: "talk", messages: msgs});
    assert.equal((sent.system.match(/«Wat doe je graag\?»/g) || []).length, 1, "listed once");
    assert.match(sent.system, /do not ask them again, not even reworded/);
    assert.match(sent.system, /If the learner asks the same thing again, answer again in simpler words/);
    assert.equal(sent.messages.length, 7, "the whole recent conversation (+ the opening request the app does not keep) is sent as memory");
    assert.deepEqual(sent.messages.slice(1).map(m => m.content), msgs.map(m => m.content));
    assert.doesNotMatch(sent.system, /Questions you already asked[^\n]*Ik help/, "only questions are listed, never statements");
  });

  t("8. switching the style in the middle of a conversation — only the current style rules reach the model", async () => {
    const history = [{role: "assistant", content: "Hallo! Wat doe je vandaag?"}, {role: "user", content: "Ik werk thuis."}, {role: "assistant", content: "Ah, thuis. Werk je veel?"}, {role: "user", content: "Ik werk veel, ik moe."}];
    const out = modelAnswer("Oei, dat klinkt vermoeiend.", fix("Ik ben moe.", "minor", "Потрібне дієслово «zijn»."));
    const seq = [];
    for (const style of ["teacher", "talk", "slow", "teacher"]) {
      const r = await ask(out, {style, messages: history});
      const blocks = ["TEACHER.", "FREE TALK.", "SLOW PRACTICE,"].filter(b => sent.system.includes(b));
      seq.push([style, blocks.length === 1 ? blocks[0] : blocks.join("+"), !!r.json.correction]);
    }
    assert.deepEqual(seq, [["teacher", "TEACHER.", true], ["talk", "FREE TALK.", false], ["slow", "SLOW PRACTICE,", true], ["teacher", "TEACHER.", true]]);
    assert.deepEqual(sent.messages.slice(1).map(m => m.content), history.map(m => m.content), "the conversation is kept across the switch");
    assert.match(sent.system, /never mention a switch/);
  });

  t("opening message depends on the style; exam11 scripts and retry rule are untouched", async () => {
    for (const [style, re] of [["slow", /very short sentence and ask one very simple question/], ["talk", /friendly neighbour/], ["teacher", /greet me in the target language/]]) {
      await ask(modelAnswer("Hallo!"), {style, messages: []});
      assert.match(sent.messages[0].content, re);
    }
    await ask(modelAnswer("Goed zo! Volgende vraag?"), {style: "exam", scene: "exam11", exam: {cur: "Wat doe je 's morgens?", next: "Wat eet je?"}, text: "Ik sta op."});
    assert.match(sent.system, /EXAM SCRIPT \(strict\)/); assert.match(sent.system, /EXAM RETRY RULE/);
    assert.match(sent.system, /Role-play situation: You are the learner's CVO teacher/);
  });

  t("a long conversation (12-message window) is not restarted with a greeting request", async () => {
    const long = Array.from({length: 13}, (_, i) => ({role: i % 2 ? "user" : "assistant", content: i % 2 ? "Antwoord " + i : "Vraag " + i + "?"}));
    long.push({role: "user", content: "Nog een antwoord"}); // 14 messages → the app sends the last 12, starting with a tutor turn
    const window12 = long.slice(-12);
    assert.equal(window12[0].role, "assistant");
    await ask(modelAnswer("Oké."), {style: "talk", messages: window12});
    assert.match(sent.messages[0].content, /earlier part of this conversation is not shown/);
    assert.doesNotMatch(sent.messages[0].content, /greet me/);
    await ask(modelAnswer("Hallo!"), {style: "talk", messages: [{role: "assistant", content: "Hallo!"}, {role: "user", content: "Hoi"}]});
    assert.match(sent.messages[0].content, /greet me/, "a real new conversation still opens normally");
  });

  t("exam retry still works: a mistake reaches the app as has_error:true, a correct answer as null (confirmed regression: field was missing)", async () => {
    const bad = await ask(modelAnswer("Bijna! Zeg het nog eens.", fix("Ik sta om zeven uur op.")), {style: "exam", scene: "exam11", exam: {cur: "Hoe laat sta je op?", next: "Wat eet je?"}, text: "Ik sta op zeven uur."});
    assert.equal(bad.json.correction.has_error, true);
    const good = await ask(modelAnswer("Goed zo! Wat eet je?", NONE), {style: "exam", scene: "exam11", exam: {cur: "Hoe laat sta je op?", next: "Wat eet je?"}, text: "Ik sta om zeven uur op."});
    assert.equal(good.json.correction, null);
  });

  t("exam11 by voice: a one-letter grammar mistake (werk/werkt) still counts, so the retry rule fires", async () => {
    const out = modelAnswer("Bijna! Zeg het nog eens.", fix("Hij werkt thuis.", "minor", "hij + -t"));
    const r = await ask(out, {style: "exam", scene: "exam11", exam: {cur: "Waar werkt hij?", next: "Wat eet je?"}, text: "Hij werk thuis.", spoken: ["hij werk thuis", "hij werk thuis"]});
    assert.equal(r.json.correction && r.json.correction.has_error, true);
    const teacher = await ask(out, {text: "Hij werk thuis.", spoken: ["hij werk thuis"]});
    assert.equal(teacher.json.correction.corrected, "Hij werkt thuis.");
  });

  t("writing in the learner's own language still gets the 'say it in Dutch' card, even in free talk", async () => {
    const r = await ask(modelAnswer("Aha, je hebt het druk.", NONE, {said: "Ik heb het druk."}), {style: "talk", text: "Я дуже зайнятий."});
    assert.equal(r.json.correction.has_error, true); assert.equal(r.json.correction.severity, "major"); assert.equal(r.json.correction.corrected, "Ik heb het druk.");
  });

  t("app side: free talk shows a card only for major mistakes; exam and teacher show any reported one", async () => {
    const html = require(__dirname+'/lib/app-source.cjs')();
    assert.match(html, /\(s\.exam\|\|s\.style!=="talk"\|\|j\.correction&&j\.correction\.severity==="major"\)&&j\.correction&&j\.correction\.has_error===true/);
    assert.match(html, /err=!!\(j\.correction&&j\.correction\.has_error\)/, "exam retry reads has_error");
  });

  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log("PASS", name); } catch (e) { failed++; console.error("FAIL", name, "\n ", (e && e.stack ? e.stack.split("\n").slice(0, 5).join("\n  ") : e)); }
  }
  if (failed) { process.exitCode = 1; return; }
  console.log("PASS: " + tests.length + " dialogue scenarios (8 requested examples, contract has_error/severity, style switching, exam retry, voice input)");
})();
