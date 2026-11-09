// Story engine of LerenBe LIFE (pure logic, no DOM). A story has scenes; a scene has steps:
//  line   — a character speaks (no answer needed)
//  reply  — choose what to say; `repeat` options ask the character to say it again slowly (never a mistake)
//  listen — hear an instruction and choose what it means
//  find   — the character names things one by one; tap the right object
//  say    — say the phrase aloud (speech recognition) or build it from word tiles
// Scoring: a graded step counts when it is right at the first try. Scene XP = 5 per first-try step, kept as the best
// result per scene in leren_life_xp_v1 ("<story>:<scene>" → XP); app.js adds the difference to the shared XP once.
export const XP_PER_STEP = 5;
export const XP_KEY = 'leren_life_xp_v1';
const GRADED = new Set(['reply', 'listen', 'find', 'say']);

export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
 .replace(/[’‘`´]/g, "'").replace(/[.,!?;:"«»“”()]/g, ' ').replace(/\s+/g, ' ').trim();

// Share of the target's words that were recognised (order-free, each word once). 1 = everything heard. Names (the
// story's characters) are left out: speech recognition often spells them differently.
export function sayScore(target, heard, names = []) {
 const skip = new Set(names.map(norm)), want = norm(target).split(' ').filter(w => w && !skip.has(w)), got = norm(heard).split(' ').filter(Boolean);
 if (!want.length) return 0;
 let hit = 0;
 for (const w of want) { const i = got.indexOf(w); if (i >= 0) { hit++; got.splice(i, 1) } }
 return hit / want.length;
}
export const SAY_PASS = 0.75;

export function gradedSteps(scene) { return scene.steps.filter(s => GRADED.has(s.type)) }

export function createStorySession(story, storage, {mode} = {}) {
 const key = 'leren_life_story_v1_' + story.id;
 const sceneIds = new Set(story.scenes.map(s => s.id)), names = Object.values(story.cast || {}).map(c => c.name);
 let saved = {};
 try { saved = JSON.parse(storage.getItem(key) || '{}') || {} } catch {}
 const best = {};
 if (saved.best && typeof saved.best === 'object') for (const [id, v] of Object.entries(saved.best))
  if (sceneIds.has(id) && Number.isInteger(v) && v >= 0) best[id] = Math.min(v, gradedSteps(story.scenes.find(s => s.id === id)).length);
 const state = {
  mode: (mode || saved.mode) === 'real' ? 'real' : 'learn',
  best,
  missed: Array.isArray(saved.missed) ? saved.missed.filter(x => typeof x === 'string').slice(0, 60) : []
 };
 function save() { try { storage.setItem(key, JSON.stringify(state)) } catch {} }
 function setMode(m) { state.mode = m === 'real' ? 'real' : 'learn'; save(); return state.mode }

 // One play of a scene. answer() returns {ok, done, repeat?, why?}; finish() stores the result and the XP.
 function play(sceneId) {
  const scene = story.scenes.find(s => s.id === sceneId); if (!scene) return null;
  let index = 0, findIndex = 0, firstTry = true, correct = 0;
  const run = {
   scene,
   get index() { return index },
   get step() { return scene.steps[index] || null },
   get findTarget() { const s = scene.steps[index]; return s?.type === 'find' ? s.items.find(i => i.id === s.ask[findIndex]) || null : null },
   get correct() { return correct },
   get total() { return gradedSteps(scene).length },
   next() { if (scene.steps[index]?.type === 'line') { index++; } return run.step },
   answer(value) {
    const s = scene.steps[index]; if (!s || !GRADED.has(s.type)) return null;
    let ok = false, repeat = false, why = s.why || '';
    if (s.type === 'reply') {
     const o = s.options[value]; if (!o) return null;
     if (o.repeat) return {ok: false, repeat: true, done: false};
     ok = !!o.ok; why = o.why || '';
     if (!ok) missed(s.options.find(x => x.ok)?.nl);
    } else if (s.type === 'listen') {
     if (!Number.isInteger(value) || !s.options[value]) return null;
     ok = value === s.answer; if (!ok) missed(s.nl);
    } else if (s.type === 'find') {
     const want = s.ask[findIndex]; ok = value === want;
     if (!ok) { missed(s.items.find(i => i.id === want)?.nl); firstTry = false; return {ok: false, done: false, why: ''} }
     findIndex++;
     if (findIndex < s.ask.length) return {ok: true, done: false};
    } else if (s.type === 'say') {
     const score = typeof value === 'number' ? value : sayScore(s.nl, value, names);
     ok = score >= SAY_PASS; if (!ok) missed(s.nl);
     why = s.tip || '';
    }
    if (ok) { if (firstTry) correct++; index++; findIndex = 0; firstTry = true }
    else firstTry = false;
    return {ok, done: ok, why};
   },
   // Skip a step after a failed try (say: no microphone, or the learner gives up): counts as not first-try.
   skip() { const s = scene.steps[index]; if (!s) return; if (GRADED.has(s.type)) missed(s.nl || s.options?.find(o => o.ok)?.nl); index++; findIndex = 0; firstTry = true },
   get finished() { return index >= scene.steps.length },
   finish() {
    const prev = state.best[scene.id] || 0; if (correct > prev) state.best[scene.id] = correct; save();
    return {correct, total: run.total, xp: correct * XP_PER_STEP, gained: Math.max(0, correct - prev) * XP_PER_STEP};
   }
  };
  return run;
 }
 function missed(nl) { if (nl && !state.missed.includes(nl)) { state.missed.push(nl); if (state.missed.length > 60) state.missed.shift(); save() } }
 function sceneDone(id) { return Object.hasOwn(state.best, id) }
 function nextScene() { return story.scenes.find(s => !sceneDone(s.id)) || null }
 function xp() { return story.scenes.reduce((n, s) => n + (state.best[s.id] || 0) * XP_PER_STEP, 0) }
 function maxXp() { return story.scenes.reduce((n, s) => n + gradedSteps(s).length * XP_PER_STEP, 0) }
 return {state, setMode, play, sceneDone, nextScene, xp, maxXp, save};
}

// Shared XP record read by app.js (see absorbLifeXP there): best XP per "<story>:<scene>".
export function recordXp(storage, storyId, sceneId, xp) {
 let o = {};
 try { o = JSON.parse(storage.getItem(XP_KEY) || '{}') || {} } catch {}
 if (typeof o !== 'object' || Array.isArray(o)) o = {};
 const k = storyId + ':' + sceneId;
 if (Number.isInteger(xp) && xp > (o[k] || 0)) { o[k] = xp; try { storage.setItem(XP_KEY, JSON.stringify(o)) } catch {} }
 return o[k] || 0;
}
