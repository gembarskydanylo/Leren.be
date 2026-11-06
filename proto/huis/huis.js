/* Huis van Pieter — prototype. The learner walks the cat (arrows or a tap on the floor) and follows Dutch
   instructions: level 1 "Ga naar …", level 2 "Pak … en breng … naar …", level 3 "Leg … op/in/onder/naast …". */
(() => {
 'use strict';
 const COLS = 6, ROWS = 7, WALL = .9, MISSIONS = 5, SAVE = 'leren_huis_proto_v1';
 const $ = id => document.getElementById(id);
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
 const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

 // Furniture. r = -1: on the back wall (reached from the floor cell under it). uk: [to …, prepositions…]
 const FURN = [
  { id: 'bed', nl: 'het bed', c: 0, r: 0, w: 2, h: 3, to: 'до ліжка', uk: { op: 'на ліжко', onder: 'під ліжко', naast: 'біля ліжка' } },
  { id: 'kast', nl: 'de kast', c: 5, r: 0, w: 1, h: 2, to: 'до шафи', uk: { in: 'у шафу', op: 'на шафу', naast: 'біля шафи' } },
  { id: 'tafel', nl: 'de tafel', c: 1, r: 4, w: 2, h: 1, to: 'до столу', uk: { op: 'на стіл', onder: 'під стіл', naast: 'біля столу' } },
  { id: 'stoel', nl: 'de stoel', c: 1, r: 5, w: 1, h: 1, to: 'до стільця', uk: { op: 'на стілець', onder: 'під стілець', naast: 'біля стільця' } },
  { id: 'lamp', nl: 'de lamp', c: 4, r: 3, w: 1, h: 1, to: 'до лампи', uk: { naast: 'біля лампи' } },
  { id: 'plant', nl: 'de plant', c: 5, r: 5, w: 1, h: 1, to: 'до рослини', uk: { naast: 'біля рослини' } },
  { id: 'deur', nl: 'de deur', c: 2, r: -1, w: 1, h: 1, to: 'до дверей', uk: { naast: 'біля дверей' } },
  { id: 'raam', nl: 'het raam', c: 4, r: -1, w: 1, h: 1, to: 'до вікна', uk: {} }
 ];
 const F = Object.fromEntries(FURN.map(f => [f.id, f]));
 // Things to carry: Dutch with article, Ukrainian accusative, picture from the site's emoji set.
 const ITEMS = [
  { id: 'boek', nl: 'het boek', uk: 'книжку', img: 'fx-1f4d8' }, { id: 'sleutel', nl: 'de sleutel', uk: 'ключ', img: 'fx-1f511' },
  { id: 'bal', nl: 'de bal', uk: 'м’яч', img: 'learn-20' }, { id: 'kopje', nl: 'het kopje', uk: 'чашку', img: 'fx-2615' },
  { id: 'appel', nl: 'de appel', uk: 'яблуко', img: 'fx-1f34e' }, { id: 'sok', nl: 'de sok', uk: 'шкарпетку', img: 'fx-1f9e6' },
  { id: 'schoen', nl: 'de schoen', uk: 'черевик', img: 'fx-1f45f' }, { id: 'telefoon', nl: 'de telefoon', uk: 'телефон', img: 'fx-1f4f1' },
  { id: 'tas', nl: 'de tas', uk: 'сумку', img: 'fx-1f392' }, { id: 'pet', nl: 'de pet', uk: 'кепку', img: 'fx-1f9e2' }
 ];
 const pron = it => it.nl.startsWith('het ') ? 'het' : 'hem';
 const LEVELS = [
  { n: 1, title: 'Ga naar …', sub: 'Іди до меблів. Слухай і ходи.' },
  { n: 2, title: 'Pak en breng', sub: 'Візьми річ і віднеси її.' },
  { n: 3, title: 'Op, in, onder, naast', sub: 'Поклади річ у правильне місце.' }
 ];

 // ---- state ----
 let cell = 56, hero = { c: 3, r: 6 }, facingLeft = false, path = [], walkTimer = null;
 let level = 1, mission = 0, current = null, carrying = null, items = [], mistakes = 0, results = [], busy = false, trOn = true;
 const load = () => { try { const v = JSON.parse(localStorage.getItem(SAVE) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
 const save = v => { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {} };

 // ---- speech (device voice, Dutch) ----
 let voice = null;
 const pickVoice = () => { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; voice = vs.find(v => /nl[-_]BE/i.test(v.lang)) || vs.find(v => /^nl/i.test(v.lang)) || null; };
 if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
 function say(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = voice ? voice.lang : 'nl-BE'; if (voice) u.voice = voice; u.rate = .85; speechSynthesis.speak(u);
 }

 // ---- grid ----
 const blocked = new Set();
 FURN.forEach(f => { if (f.r < 0) return; for (let x = f.c; x < f.c + f.w; x++) for (let y = f.r; y < f.r + f.h; y++) blocked.add(x + ',' + y); });
 const inside = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
 const free = (c, r) => inside(c, r) && !blocked.has(c + ',' + r);
 const cellsOf = f => { const out = []; for (let x = f.c; x < f.c + f.w; x++) for (let y = f.r; y < f.r + f.h; y++) out.push([x, y]); return out; };
 const nextTo = (f, p = hero) => cellsOf(f).some(([x, y]) => Math.abs(x - p.c) + Math.abs(y - p.r) === 1);
 const nearFurn = () => FURN.filter(f => nextTo(f));
 const nearItems = () => items.filter(it => !it.placed && Math.abs(it.c - hero.c) + Math.abs(it.r - hero.r) <= 1);
 function route(goals) { // shortest walk from the cat to any goal cell
  const key = (c, r) => c + ',' + r, want = new Set(goals.map(([c, r]) => key(c, r))), prev = new Map([[key(hero.c, hero.r), null]]), q = [[hero.c, hero.r]];
  while (q.length) { const [c, r] = q.shift(); if (want.has(key(c, r))) { const out = []; let k = key(c, r); while (k && k !== key(hero.c, hero.r)) { const [x, y] = k.split(',').map(Number); out.unshift({ c: x, r: y }); k = prev.get(k); } return out; }
   for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr, k = key(nc, nr); if (free(nc, nr) && !prev.has(k)) { prev.set(k, key(c, r)); q.push([nc, nr]); } } }
  return null;
 }

 // ---- drawing ----
 const board = $('board');
 const pos = (n, c, r, w = 1, h = 1) => { n.style.left = c * cell + 'px'; n.style.top = (r < 0 ? 0 : (WALL + r) * cell) + 'px'; n.style.width = w * cell + 'px'; n.style.height = (r < 0 ? WALL : h) * cell + 'px'; };
 let heroEl, furnEls = {};
 function build() {
  board.replaceChildren(el('div', 'h-wall'), el('div', 'h-floor'));
  const rug = el('div', 'h-rug'); rug.dataset.rug = '1'; board.appendChild(rug);
  FURN.forEach(f => { const n = el('div', 'h-f h-' + f.id + (f.r < 0 ? ' is-wallitem' : '')); n.dataset.f = f.id; n.append(el('div', 'h-shape'), el('span', 'h-label', f.nl)); n.lang = 'nl'; board.appendChild(n); furnEls[f.id] = n; });
  heroEl = el('div', 'h-hero'); const inner = el('div', 'h-hero-in'), cat = el('img', 'h-cat'); cat.src = '../../img/mascot/fill-gap-cat.png'; cat.alt = 'Котик'; cat.draggable = false; inner.appendChild(cat); heroEl.appendChild(inner); board.appendChild(heroEl);
  layout();
 }
 function layout() {
  // Everything on one screen: the room gets the height left after the header, the instruction and the controls.
  const h = s => document.querySelector(s).getBoundingClientRect().height, left = window.innerHeight - h('.h-top') - h('#mission') - h('.h-controls') - 8 * 2 - 18 - 12;
  const wCell = Math.floor((Math.min(window.innerWidth, 560) - 24) / COLS), hCell = Math.floor(left / (ROWS + WALL));
  cell = Math.max(30, Math.min(72, wCell, hCell)); document.documentElement.style.setProperty('--cell', cell + 'px');
  const rug = board.querySelector('[data-rug]'); if (rug) { pos(rug, 2, 6, 3, 1); rug.style.left = 2.2 * cell + 'px'; rug.style.width = 2.6 * cell + 'px'; rug.style.top = (WALL + 6.15) * cell + 'px'; rug.style.height = .7 * cell + 'px'; }
  FURN.forEach(f => { const n = furnEls[f.id]; pos(n, f.c, f.r, f.w, f.h); n.style.zIndex = f.r < 0 ? 2 : 6 + f.r + f.h; }); // the cat walks behind furniture that is lower on the screen
  items.forEach(drawItem); place(false);
 }
 function place(animate = true) {
  heroEl.style.transition = animate ? '' : 'none'; heroEl.style.transform = `translate(${hero.c * cell}px,${(WALL + hero.r) * cell}px)`; heroEl.style.zIndex = 6 + hero.r + 1;
  heroEl.classList.toggle('is-left', facingLeft); if (!animate) requestAnimationFrame(() => { heroEl.style.transition = ''; });
 }
 function drawItem(it) {
  if (!it.node) { it.node = el('div', 'h-item'); const img = el('img'); img.src = '../../img/emoji/' + it.img + '.png'; img.alt = it.nl; img.lang = 'nl'; img.draggable = false; it.node.appendChild(img); it.node.dataset.item = it.id; it.node.dataset.label = it.nl; board.appendChild(it.node); }
  if (it.carried) { it.node.hidden = true; return; } it.node.hidden = false;
  const c = it.at ? it.at.c : it.c, r = it.at ? it.at.r : it.r; pos(it.node, c, r); it.node.style.zIndex = 6 + Math.ceil(r) + (it.under ? -2 : 1);
  it.node.classList.toggle('is-under', !!it.under); it.node.classList.toggle('is-in', !!it.inside);
  it.node.classList.toggle('is-edge-left', c === 0); it.node.classList.toggle('is-edge-right', c === COLS - 1);
 }
 function refreshNear() {
  const nf = new Set(nearFurn().map(f => f.id)); FURN.forEach(f => furnEls[f.id].classList.toggle('is-near', nf.has(f.id)));
  const ni = new Set(nearItems().map(i => i.id)); items.forEach(it => it.node && it.node.classList.toggle('is-near', ni.has(it.id) && !carrying));
  actions();
 }

 // ---- walking ----
 function stepTo(c, r) {
  if (!free(c, r)) { heroEl.classList.remove('is-no'); void heroEl.offsetWidth; heroEl.classList.add('is-no'); return false; }
  if (c !== hero.c) facingLeft = c < hero.c; hero = { c, r }; place(); refreshNear(); check(); return true;
 }
 function walk(steps) {
  clearInterval(walkTimer); path = steps || []; if (!path.length) return; heroEl.classList.add('is-walking');
  const go = () => { const s = path.shift(); if (!s || busy) { stop(); return; } stepTo(s.c, s.r); if (!path.length) stop(); };
  go(); walkTimer = setInterval(go, 170);
 }
 function stop() { clearInterval(walkTimer); walkTimer = null; path = []; heroEl.classList.remove('is-walking'); }
 function arrow(dc, dr) { if (busy) return; stop(); heroEl.classList.add('is-walking'); stepTo(hero.c + dc, hero.r + dr); setTimeout(() => { if (!walkTimer) heroEl.classList.remove('is-walking'); }, 200); }
 document.querySelectorAll('.h-arrow').forEach(b => {
  const [dc, dr] = b.dataset.dir.split(',').map(Number); let hold = null;
  const end = () => { clearTimeout(hold); clearInterval(hold); hold = null; };
  b.addEventListener('pointerdown', e => { e.preventDefault(); arrow(dc, dr); hold = setTimeout(() => { hold = setInterval(() => arrow(dc, dr), 190); }, 330); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, end));
 });
 document.addEventListener('keydown', e => { const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (d && !$('overlay').classList.contains('is-on')) { e.preventDefault(); arrow(...d); } });
 board.addEventListener('pointerdown', e => {
  if (busy) return; const r0 = board.getBoundingClientRect(), x = e.clientX - r0.left, y = e.clientY - r0.top, c = Math.floor(x / cell), r = Math.floor(y / cell - WALL);
  const wallHit = y < WALL * cell, f = FURN.find(f => wallHit ? f.r < 0 && f.c === c : f.r >= 0 && c >= f.c && c < f.c + f.w && r >= f.r && r < f.r + f.h);
  if (f) { if (nextTo(f)) { say(f.nl); return; } const goals = f.r < 0 ? [[f.c, 0]] : cellsOf(f).flatMap(([a, b]) => [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]).filter(([a, b]) => free(a, b)); walk(route(goals)); return; }
  if (!inside(c, r)) return; const dot = el('div', 'h-target-dot'); pos(dot, c, r); board.appendChild(dot); setTimeout(() => dot.remove(), 600);
  const it = items.find(i => !i.placed && !i.carried && i.c === c && i.r === r); if (it && Math.abs(it.c - hero.c) + Math.abs(it.r - hero.r) <= 1) { say(it.nl); }
  walk(route([[c, r]]));
 });

 // ---- missions ----
 const reach = () => FURN.filter(f => !!route(f.r < 0 ? [[f.c, 0]] : cellsOf(f).flatMap(([a, b]) => [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]).filter(([a, b]) => free(a, b))) || nextTo(f));
 function scatter(n) { // put n things on free floor cells, away from the cat
  items.forEach(it => it.node && it.node.remove()); items = [];
  const cells = shuffle([...Array(COLS * ROWS)].map((_, i) => [i % COLS, Math.floor(i / COLS)]).filter(([c, r]) => free(c, r) && Math.abs(c - hero.c) + Math.abs(r - hero.r) > 2));
  shuffle(ITEMS).slice(0, n).forEach((it, i) => { const [c, r] = cells[i]; items.push({ ...it, c, r }); });
  items.forEach(drawItem);
 }
 function makeMission() {
  carrying = null; heroEl.querySelector('.h-carry')?.remove(); mistakes = 0;
  if (level === 1) { const pool = reach().filter(f => !results.some(x => x.f === f.id)); const f = shuffle(pool.length ? pool : FURN)[0]; scatter(0);
   if (nextTo(f)) { return makeMission(); }
   return { f: f.id, nl: `Ga naar ${f.nl}.`, uk: `Іди ${f.to}.` }; }
  scatter(3); const it = items[Math.floor(Math.random() * items.length)];
  if (level === 2) { const f = shuffle(FURN.filter(x => x.id !== 'raam'))[0]; return { item: it.id, f: f.id, nl: `Pak ${it.nl} en breng ${pron(it)} naar ${f.nl}.`, uk: `Візьми ${it.uk} і віднеси ${f.to}.` }; }
  const f = shuffle(FURN.filter(x => Object.keys(x.uk).length >= 2))[0], prep = shuffle(Object.keys(f.uk))[0];
  return { item: it.id, f: f.id, prep, nl: `Leg ${it.nl} ${prep} ${f.nl}.`, uk: `Поклади ${it.uk} ${f.uk[prep]}.` };
 }
 function show() {
  $('step').textContent = `Рівень ${level} · Завдання ${mission + 1} / ${MISSIONS}`;
  $('stars').textContent = results.map(r => r.ok ? '★' : '☆').join('') + '·'.repeat(MISSIONS - results.length);
  $('nl').textContent = current.nl; $('uk').textContent = current.uk; $('uk').classList.toggle('is-hidden', !trOn);
  $('trBtn').setAttribute('aria-pressed', String(trOn)); FURN.forEach(f => furnEls[f.id].classList.remove('is-hint'));
  refreshNear(); layout(); say(current.nl);
 }
 function startLevel(n) {
  level = n; mission = 0; results = []; trOn = n === 1; hero = { c: 3, r: 6 }; facingLeft = false; place(false);
  closeOverlay(); current = makeMission(); show();
 }
 function nextMission() {
  results.push({ f: current.f, ok: mistakes <= 1 }); mission++;
  if (mission >= MISSIONS) { finishLevel(); return; }
  current = makeMission(); show();
 }
 function check() { // level 1: arriving next to the right furniture is enough
  if (!current || busy || level !== 1) return;
  if (nextTo(F[current.f])) success();
 }
 function success() {
  busy = true; stop(); heroEl.classList.add('is-happy'); toast('Goed zo!', 'Молодець!', true); say('Goed zo!');
  setTimeout(() => { heroEl.classList.remove('is-happy'); busy = false; nextMission(); }, 1500);
 }
 function wrong(nl, uk) { mistakes++; heroEl.classList.remove('is-no'); void heroEl.offsetWidth; heroEl.classList.add('is-no'); toast(nl, uk, false); say(nl); if (mistakes >= 2) hint(); }
 function hint() { const f = furnEls[current.f]; f.classList.add('is-hint'); const it = current.item && items.find(i => i.id === current.item); if (it && it.node && !carrying) it.node.classList.add('is-hint'); }

 // contextual big buttons under the room
 function actions() {
  const box = $('actions'); box.replaceChildren(); if (!current) return;
  const btn = (main, sub, fn, soft) => { const b = el('button', 'h-act' + (soft ? ' is-soft' : '')); b.type = 'button'; b.lang = 'nl'; b.append(main); if (sub) b.appendChild(el('span', '', sub)); b.addEventListener('click', fn); box.appendChild(b); };
  if (level === 1) { box.appendChild(el('div', 'h-hintline', 'Ходи стрілками або торкнись підлоги. Підійди до потрібного місця.')); return; }
  if (!carrying) {
   const near = nearItems();
   if (!near.length) { box.appendChild(el('div', 'h-hintline', 'Знайди річ і підійди до неї.')); return; }
   near.slice(0, 2).forEach(it => btn('✋ Pak ' + it.nl, 'Візьми ' + it.uk, () => pick(it)));
   return;
  }
  const nf = nearFurn().filter(f => f.id !== 'raam');
  if (!nf.length) { box.appendChild(el('div', 'h-hintline', 'Неси ' + carrying.uk + '. Підійди до потрібного місця.')); return; }
  const f = nf.find(x => x.id === current.f) || nf[0];
  if (level === 2) { btn('📥 Leg ' + pron(carrying) + ' bij ' + f.nl, 'Поклади тут', () => drop(f, null)); return; }
  Object.keys(f.uk).forEach(prep => btn(prep + ' ' + f.nl, f.uk[prep], () => drop(f, prep), true));
 }
 function pick(it) {
  if (busy) return;
  if (it.id !== current.item) { wrong('Nee, dat is ' + it.nl + '.', 'Ні, це ' + it.uk.replace(/у$/, 'а').replace(/ю$/, 'я') + '. Слухай ще раз.'); return; }
  carrying = it; it.carried = true; drawItem(it); const img = el('img', 'h-carry'); img.src = '../../img/emoji/' + it.img + '.png'; img.alt = ''; heroEl.querySelector('.h-hero-in').appendChild(img);
  say(it.nl); refreshNear();
 }
 function drop(f, prep) {
  if (busy || !carrying) return;
  if (f.id !== current.f || (level === 3 && prep !== current.prep)) {
   wrong(level === 3 ? 'Nee, niet ' + prep + ' ' + f.nl + '.' : 'Nee, dat is ' + f.nl + '.', level === 3 ? 'Ні, не ' + f.uk[prep] + '. Послухай ще раз.' : 'Ні, не сюди. Послухай ще раз.'); return; }
  const it = carrying; carrying = null; it.carried = false; it.placed = true; heroEl.querySelector('.h-carry')?.remove();
  const mid = { c: f.c + (f.w - 1) / 2, r: f.r + (f.h - 1) / 2 };
  if (prep === 'naast' || !prep) it.at = level === 2 ? mid : { c: hero.c, r: hero.r };
  else { it.at = mid; it.under = prep === 'onder'; it.inside = prep === 'in'; if (prep === 'in') { furnEls.kast.classList.add('is-open'); setTimeout(() => furnEls.kast.classList.remove('is-open'), 900); } }
  if (prep === 'onder') it.at = { c: mid.c, r: mid.r + (f.h - 1) / 2 + .25 };
  drawItem(it); say((level === 3 ? `${it.nl} ligt ${prep} ${f.nl}` : `${it.nl}`)); setTimeout(success, 700);
 }

 // ---- toast and screens ----
 let toastTimer;
 function toast(main, sub, ok) { let t = document.querySelector('.h-toast'); if (!t) { t = el('div', 'h-toast'); document.body.appendChild(t); } t.replaceChildren(main, el('small', '', sub)); t.className = 'h-toast is-on ' + (ok ? 'is-ok' : 'is-no'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), ok ? 1200 : 1800); }
 const overlay = $('overlay');
 function closeOverlay() { overlay.classList.remove('is-on'); overlay.replaceChildren(); }
 function menu() {
  stop(); current = null; actions(); const best = load().best || {};
  const p = el('div', 'h-panel'), cat = el('img', 'h-cat-big'); cat.src = '../../img/mascot/fill-gap-cat.png'; cat.alt = '';
  p.append(cat, el('h1', '', 'Huis van Pieter'), el('p', '', 'Котик слухає Пітера й виконує завдання нідерландською. Ходи стрілками ◀ ▶ ▲ ▼ або просто торкнись підлоги.'));
  const list = el('div', 'h-levels');
  LEVELS.forEach(L => { const b = el('button', 'h-level'); b.type = 'button'; const txt = el('span'); const s = el('strong', '', L.title); s.lang = 'nl'; txt.append(s, el('small', '', L.sub)); b.append(el('b', '', String(L.n)), txt, el('em', '', best[L.n] != null ? '★'.repeat(best[L.n]) + '☆'.repeat(MISSIONS - best[L.n]) : '')); b.addEventListener('click', () => startLevel(L.n)); list.appendChild(b); });
  p.appendChild(list); overlay.replaceChildren(p); overlay.classList.add('is-on');
 }
 function finishLevel() {
  const stars = results.filter(r => r.ok).length, data = load(); data.best = data.best || {}; data.best[level] = Math.max(stars, data.best[level] || 0); save(data);
  const p = el('div', 'h-panel'), cat = el('img', 'h-cat-big'); cat.src = '../../img/mascot/fill-gap-cat.png'; cat.alt = '';
  p.append(cat, el('h1', '', 'Рівень ' + level + ' пройдено!'), el('div', 'h-big-stars', '★'.repeat(stars) + '☆'.repeat(MISSIONS - stars)), el('p', '', stars === MISSIONS ? 'Усе без помилок. Чудово!' : 'Зірка — за завдання з не більше ніж однією помилкою.'));
  const row = el('div', 'h-row'), again = el('button', 'h-act is-soft', 'Ще раз'), next = el('button', 'h-act', level < 3 ? 'Наступний рівень' : 'До рівнів');
  again.type = next.type = 'button'; again.addEventListener('click', () => startLevel(level)); next.addEventListener('click', () => level < 3 ? startLevel(level + 1) : menu());
  row.append(again, next); const all = el('button', 'h-act is-soft', 'Усі рівні'); all.type = 'button'; all.addEventListener('click', menu); row.appendChild(all);
  p.appendChild(row); overlay.replaceChildren(p); overlay.classList.add('is-on'); say('Heel goed!');
 }

 $('speak').addEventListener('click', () => current && say(current.nl));
 $('trBtn').addEventListener('click', () => { trOn = !trOn; $('uk').classList.toggle('is-hidden', !trOn); $('trBtn').setAttribute('aria-pressed', String(trOn)); });
 $('hintBtn').addEventListener('click', () => { if (current) { hint(); mistakes = Math.max(mistakes, 2); } });
 window.addEventListener('resize', () => layout());
 build(); menu();
 requestAnimationFrame(layout);
})();
