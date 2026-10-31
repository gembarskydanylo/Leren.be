// Static regression tests for the AI tutor prompt. No API key or network required.
// Run: node tests/ai-dialogue-regression.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../tools/ai-worker.js"), "utf8");
const sandbox = { console };
vm.createContext(sandbox);
const prefix = source.slice(0, source.indexOf("export default"));
assert.ok(prefix.length > 1000, "Worker module export must be present");
vm.runInContext(prefix + "\nthis.__test = {chatSystem, learnerNotes, WORKER_VERSION};", sandbox);
const { chatSystem, learnerNotes, WORKER_VERSION } = sandbox.__test;
const prompt = (style = "teacher", scene = null) => chatSystem("nl", "uk", "a11", scene, "peter", "", style);

const tests = [
  ["worker version", () => assert.match(WORKER_VERSION, /^2026-/)],
  ["latest learner intent has priority", () => assert.match(prompt(), /latest learner message overrides earlier assistant suggestions/i)],
  ["no unsolicited repetition", () => assert.match(prompt(), /NEVER initiate a repetition drill/i)],
  ["avoid fabricated additional test", () => assert.match(prompt(), /additional or repeated event/i)],
  ["today versus tomorrow", () => assert.match(prompt(), /TONIGHT \(vanavond\)/)],
  ["clarify ambiguous fragments", () => assert.match(prompt(), /ask one short clarifying question/i)],
  ["avoid guessing voice recognition source", () => assert.match(prompt(), /do not claim the source of the error is speech recognition/i)],
  ["avoid forced follow-up", () => assert.match(prompt(), /not every turn/i)],
  ["talk style", () => assert.match(prompt("talk"), /FREE TALK/)],
  ["teacher style", () => assert.match(prompt("teacher"), /TEACHER/)],
  ["slow style", () => assert.match(prompt("slow"), /SLOW PRACTICE/)],
  ["exam script remains authoritative", () => assert.match(prompt("exam", "exam11"), /EXAM RETRY RULE/)],
  ["profile review data", () => assert.match(learnerNotes({review:["huis","morgen"], goal:"A1.1 test"}, "chat", ""), /vocabulary due for review: huis; morgen/)],
  ["no invented mastery", () => assert.match(learnerNotes({goal:"A1.1 test"}, "chat", ""), /Do not invent progress metrics/i)]
];
let failed = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failed++; console.error("FAIL", name, error.message); }
}
if (failed) process.exitCode = 1;
else console.log("All", tests.length, "AI tutor prompt regression checks passed.");
