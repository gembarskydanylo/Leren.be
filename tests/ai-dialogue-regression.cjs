// Static regression tests for the AI tutor prompt. No API key or network required.
// Run: node tests/ai-dialogue-regression.cjs
// The prompt is written as ONE consolidated rule set with a self-contained block per style. These tests guard that structure:
// no conflicting leftovers, no one-off dialogue fixes piling up again, each mode keeps its own promises.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../tools/ai-worker.js"), "utf8");
const sandbox = { console };
vm.createContext(sandbox);
const prefix = source.slice(0, source.indexOf("export default"));
assert.ok(prefix.length > 1000, "Worker module export must be present");
vm.runInContext(prefix + "\nthis.__test = {chatSystem, learnerNotes, examScript, askedNote, askedQuestions, openerFor, STYLE_RULES, schemaFor, WORKER_VERSION};", sandbox);
const T = sandbox.__test;
const prompt = (style = "teacher", scene = null, extra = "") => T.chatSystem("nl", "uk", "a11", scene, "peter", extra, style);
const rulesOf = p => p.slice(p.indexOf("Rules:"));
const styleBlock = p => p.match(/follow ONLY this one[^:]*: ([\s\S]*?)\nCourse grammar/)[1];

const tests = [
  ["worker version", () => assert.match(T.WORKER_VERSION, /^2026-/)],

  // --- structure: one style block, no leakage between styles (mode switching) ---
  ["each style has its own block and no other style's text", () => {
    const talk = styleBlock(prompt("talk")), teacher = styleBlock(prompt("teacher")), slow = styleBlock(prompt("slow"));
    assert.match(talk, /^FREE TALK/); assert.match(teacher, /^TEACHER/); assert.match(slow, /^SLOW PRACTICE/);
    for (const [name, text] of [["talk", prompt("talk")], ["teacher", prompt("teacher")], ["slow", prompt("slow")]]) {
      const present = ["FREE TALK.", "TEACHER.", "SLOW PRACTICE,", "EXAM. Follow"].filter(x => text.includes(x));
      assert.equal(present.length, 1, name + " prompt must contain exactly one style block, got " + present.join(" + "));
    }
  }],
  ["unknown style falls back to teacher; exam scene forces exam", () => {
    assert.match(styleBlock(prompt("whatever")), /^TEACHER/);
    assert.match(styleBlock(prompt("teacher", "exam11")), /^EXAM/);
    assert.match(styleBlock(prompt("exam")), /^EXAM/);
  }],
  ["a style switch between turns is handled in the prompt", () => assert.match(prompt("talk"), /may switch style between turns; follow ONLY this one, whatever style your earlier turns used/)],

  // --- no conflicts left behind ---
  ["no leftover contradictory directives", () => {
    for (const style of ["talk", "teacher", "slow"]) {
      const p = prompt(style);
      assert.doesNotMatch(p, /Be encouraging/, "encouragement conflicted with 'no praise openers'");
      assert.doesNotMatch(p, /Start with a natural greeting/);
      assert.doesNotMatch(p, /balance conversation and gentle corrections/);
      assert.equal((p.match(/Priority when rules conflict/g) || []).length, 1, "one priority order only");
    }
  }],
  ["one-off dialogue fixes are not hard-coded into the prompt", () => {
    const p = prompt("teacher");
    for (const bad of [/For "Ja, dat is comics"/, /upcoming test and feeling nervous/, /Ik ben goed" is always grammatically wrong/, /a natural correction is "Ja, het is een stripboek"/])
      assert.doesNotMatch(p, bad);
    assert.ok(p.length < 9200, "prompt grew to " + p.length + " characters: consolidate instead of appending rules");
  }],
  ["exam script keeps priority over every style rule", () => {
    const p = prompt("exam", "exam11", T.examScript({first: true, next: "Wat doe je 's morgens?"}, "Ukrainian"));
    assert.match(p, /they override every other style rule below, including the ban on praise openers/);
    assert.match(p, /EXAM RETRY RULE/); assert.match(p, /EXAM SCRIPT: say hello in one very short sentence and ask exactly this question/);
    assert.match(prompt("teacher"), /\(1\) safety and, in exam11, the exact EXAM SCRIPT/);
  }],

  // --- free talk ---
  ["talk: natural partner, no exercises, no minor corrections, no praise opener", () => {
    const p = prompt("talk"), b = styleBlock(p);
    assert.match(b, /not a classroom/); assert.match(b, /No exercises, drills, quizzes or lesson talk/);
    assert.match(b, /about every second turn at most/); assert.match(b, /ordinary slips, unnatural wording and missing articles are left alone/);
    assert.match(rulesOf(p), /Do not open a reply with praise or a stock phrase/);
    assert.match(rulesOf(p), /never start a repetition drill, a "Zeg maar:" line, a quiz or a task on your own/);
  }],
  ["talk and all styles: emotions, no invented facts, memory of the conversation", () => {
    for (const style of ["talk", "teacher", "slow"]) {
      const r = rulesOf(prompt(style));
      assert.match(r, /Hard, tiring, stressful or painful news gets a short sympathetic acknowledgement/);
      assert.match(r, /Never assume feelings the learner did not express/);
      assert.match(r, /Never invent facts, plans, feelings, memories, progress, dates or events about the learner/);
      assert.match(r, /Never ask a question you already asked, not even reworded/);
      assert.match(r, /do not add "again \/ another \/ too"/);
    }
  }],

  // --- teacher ---
  ["teacher: A1.1 corrections that keep the meaning and continue the dialogue", () => {
    const b = styleBlock(prompt("teacher"));
    assert.match(b, /1–2 most important real mistakes/); assert.match(b, /one short sentence in Ukrainian/);
    assert.match(b, /keep the learner's own words, meaning, tense, number and negation/); assert.match(b, /only A1\.1 grammar/);
    assert.match(b, /A correct sentence gets NO correction/); assert.match(b, /after the explanation the reply simply continues the conversation/);
  }],
  ["corrections: never change meaning, natural A1 wording examples are generic", () => {
    const r = rulesOf(prompt("teacher"));
    assert.match(r, /never change what the learner meant/); assert.match(r, /«Goed, en met jou\?»/); assert.match(r, /keeping the learner's number/);
    assert.match(r, /severity = "major"/); assert.match(r, /never blame speech recognition/);
  }],

  ["course level: A1.2 learners get A1.2 grammar, A1.1 learners keep A1.1", () => {
    const a12 = (style) => styleBlock(T.chatSystem("nl", "uk", "a12", null, "peter", "", style));
    assert.match(a12("teacher"), /patient A1\.2 teacher/); assert.match(a12("teacher"), /use only A1\.1–A1\.2 \(also perfectum[^)]*want\/omdat[^)]*\) grammar/);
    assert.match(a12("slow"), /very short A1\.2 sentences/); assert.doesNotMatch(a12("slow"), /A1\.1 sentences/);
    assert.match(T.chatSystem("nl", "uk", "a12", null, "peter", "", "teacher"), /course A1\.2 \/ A1 learner/);
    assert.match(styleBlock(prompt("teacher")), /patient A1\.1 teacher/); assert.doesNotMatch(styleBlock(prompt("teacher")), /A1\.2/);
    assert.match(styleBlock(T.chatSystem("nl", "uk", "zz", null, "peter", "", "teacher")), /A1\.1 teacher/, "unknown level falls back to A1.1");
  }],

  // --- slow practice ---
  ["slow: short A1.1 sentences, one simple question, no vocabulary overload, help when stuck", () => {
    const b = styleBlock(prompt("slow"));
    assert.match(b, /very short A1\.1 sentences/); assert.match(b, /exactly ONE simple question/); assert.match(b, /At most one new word per reply/);
    assert.match(b, /does not understand/); assert.match(b, /even simpler words/); assert.match(b, /do not change topic/);
    assert.match(rulesOf(prompt("slow")), /never in SLOW PRACTICE/, "'add a harder pattern' must not apply to slow practice");
  }],

  // --- unclear / voice input ---
  ["unclear or voice input is clarified, not corrected", () => {
    assert.match(rulesOf(prompt("teacher")), /Unclear or broken input[^]*do not guess and do not correct\. Ask ONE short clarifying question/);
    const n = T.learnerNotes({}, "chat", "", "teacher");
    assert.match(n, /may contain recognition errors/); assert.match(n, /never correct pure recognition errors/);
  }],
  ["learner notes follow real progress only, and differ per style", () => {
    const profile = {review: ["huis", "morgen"], mastered: ["hallo"], weak: ["bij"], topic: "Dag", goal: "A1.1 test", learned: 42};
    const teacher = T.learnerNotes(profile, "chat", "", "teacher"), talk = T.learnerNotes(profile, "chat", "", "talk"), slow = T.learnerNotes(profile, "chat", "", "slow");
    assert.match(teacher, /vocabulary due for review: huis; morgen/); assert.match(teacher, /recently mastered words: hallo/); assert.match(teacher, /words practised so far: 42/);
    for (const n of [teacher, talk, slow]) assert.match(n, /Do not invent progress metrics/);
    assert.match(teacher, /naturally reuse the weak words/);
    assert.match(talk, /do not steer the conversation towards these words/);
    assert.match(slow, /do not introduce review or weak words as new vocabulary/);
    assert.doesNotMatch(T.learnerNotes({}, "chat", "", "talk"), /learner profile/i, "nothing is made up when the app sends no profile");
    assert.doesNotMatch(T.learnerNotes({learned: "many", level: "c2", pace: "turbo"}, "chat", "", "teacher"), /many|c2|turbo/);
  }],

  // --- repeated questions ---
  ["questions already asked are listed once so they are not repeated", () => {
    const msgs = [{role: "assistant", content: "Hallo! Wat doe je graag?"}, {role: "user", content: "Ik lees."}, {role: "assistant", content: "Leuk. Wat doe je graag?"}, {role: "user", content: "Ik lees."}, {role: "assistant", content: "Waar woon je?"}];
    assert.deepEqual(Array.from(T.askedQuestions(msgs)), ["Wat doe je graag?", "Waar woon je?"]);
    const note = T.askedNote(msgs);
    assert.match(note, /already asked in this conversation/); assert.equal((note.match(/Wat doe je graag\?/g) || []).length, 1);
    assert.equal(T.askedNote([{role: "user", content: "Wat doe je graag?"}]), "", "learner questions are not tutor questions");
    assert.equal(T.askedNote([]), "");
  }],
  ["the opening message matches the style", () => {
    assert.match(T.openerFor("slow"), /very short sentence and ask one very simple question/);
    assert.match(T.openerFor("talk"), /friendly neighbour/);
    assert.match(T.openerFor("teacher"), /greet me in the target language/);
  }],

  // --- answer schema carries what the app needs ---
  ["answer schema: has_error and severity are required", () => {
    const sc = T.schemaFor("chat", "Ukrainian").properties.correction;
    assert.deepEqual(Array.from(sc.required).sort(), ["corrected", "explanation", "has_error", "original", "severity"]);
    assert.deepEqual(Array.from(sc.properties.severity.enum), ["minor", "major"]);
  }],
  ["voice artefact rule is based on the recognizer's own alternatives, not on letter distance", () => {
    assert.doesNotMatch(source, /spellingOnly|editDistance/);
    assert.match(source, /alternatives\.includes\(sentenceKey\(c\.corrected\)\)/);
  }]
];
let failed = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failed++; console.error("FAIL", name, error.message.split("\n").slice(0, 3).join(" ")); }
}
if (failed) process.exitCode = 1;
else console.log("All", tests.length, "AI tutor prompt regression checks passed.");
