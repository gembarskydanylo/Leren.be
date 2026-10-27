# Graph Report - Leren.be  (2026-10-27)

## Corpus Check
- 94 files · ~137,854 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 37 file(s) not represented in the graph (top: .tsv 20, .css 8, (none) 3)

## Summary
- 828 nodes · 1091 edges · 69 communities (52 shown, 17 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2e086bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main
- runtime-smoke.cjs
- exam11.js
- companion.cjs
- steps
- dict-ui.js
- test-library.cjs
- steps
- code-audit.cjs
- learning-path.cjs
- steps
- topic-picker.cjs
- worker.js
- init
- lesson-conversation.cjs
- ai-worker.js
- diphthongs.cjs
- production-companion.cjs
- create
- mount
- Production testing journal
- focused-home.cjs
- Відповіді для Play Console («Вміст застосунку» / App content)
- build-content.mjs
- build-dict.mjs
- create
- round
- План A2 (збір інформації)
- clock/widget.js
- curriculum.cjs
- pronunciation.cjs
- Leren.be — Nederlands A1.1 🇧🇪🇺🇦
- word-builder.cjs
- Leren.be — дизайн-система «Oranje × België» (v2)
- send-reminders.mjs
- widgets.cjs
- rewards/core.js
- Production transfer · TEST-007 · v102
- ref_node_fs
- Курси NT2 1.1 і 1.2 — 23.10.2026
- focused-home/ui.js
- rewards/ui.js
- ref_node_vm
- course-curriculum.js
- Final prompts (built-in generation, no reference image supplied)
- ai-coach/core.js
- Перевірка Leren.be — 24.10.2026
- Перевірка коду — 22 жовтня 2026
- Production diphthongs mini-lesson — 2026-10-24
- leren.be — перевірка 23.10.2026
- createView
- Focused learning home - production v108
- Кіт-учень Leren.be · TEST-007
- render
- ref_node_assert
- Dutch pronunciation repairs
- Illustrated game cards — release 111, 26 October 2026
- make-audio-azure.sh
- run-azure.sh
- CLAUDE.md
- .claude/CLAUDE.md
- .mcp.json
- clock.js
- dict-engine.js
- make-audio.sh

## God Nodes (most connected - your core abstractions)
1. `mount()` - 16 edges
2. `create()` - 15 edges
3. `main()` - 15 edges
4. `onMessage()` - 15 edges
5. `fetch()` - 13 edges
6. `dictRow()` - 13 edges
7. `init()` - 12 edges
8. `build()` - 11 edges
9. `save()` - 11 edges
10. `create()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `5. P2 — перемикання мови застосунку не перекладає нові уроки повністю` --references--> `init()`  [INFERRED]
  CODE-AUDIT-2026-10-23.md → modules/diphthongs/widget.js
- `Перевірка Leren.be — 23 жовтня 2026` --references--> `main()`  [INFERRED]
  CODE-AUDIT-2026-10-23.md → tools/repair-bom-boom.py
- `Сервіси` --references--> `main()`  [INFERRED]
  INFRA.md → tools/repair-bom-boom.py
- `Як оновлювати` --references--> `main()`  [INFERRED]
  INFRA.md → tools/repair-bom-boom.py
- `План відкату (від найшвидшого)` --references--> `main()`  [INFERRED]
  LAUNCH.md → tools/repair-bom-boom.py

## Import Cycles
- None detected.

## Communities (69 total, 17 thin omitted)

### Community 0 - "main"
Cohesion: 0.07
Nodes (25): Leren.be — де що лежить і за що відповідає, Секрети: де зберігаються, Сервіси, Як оновлювати, Як усе пов'язано, Запуск AI-чату Leren.be: чекліст і план відкату, Обмеження, про які варто пам'ятати, План відкату (від найшвидшого) (+17 more)

### Community 1 - "runtime-smoke.cjs"
Cohesion: 0.06
Nodes (19): create(), count(), next(), question(), assert, ctx, fs, html (+11 more)

### Community 2 - "exam11.js"
Cohesion: 0.15
Nodes (27): answer(), ask(), bar(), build(), end(), fullGap(), head(), home() (+19 more)

### Community 3 - "companion.cjs"
Cohesion: 0.07
Nodes (18): afterWrong, assert, c, click(), disk, Element, files, flat() (+10 more)

### Community 4 - "steps"
Cohesion: 0.07
Nodes (26): FIREBASE_SA, FORCE, VAPID_PRIVATE, VAPID_PUBLIC, default, description, type, force (+18 more)

### Community 5 - "dict-ui.js"
Cohesion: 0.18
Nodes (25): DICT, DICT_UI, dictArt(), dictChips(), dictCorpus(), dictDetail(), dictExamples(), dictFilters() (+17 more)

### Community 6 - "test-library.cjs"
Cohesion: 0.08
Nodes (17): assert, best, c, card, Element, end, flat(), fs (+9 more)

### Community 7 - "steps"
Cohesion: 0.08
Nodes (23): runs-on, steps, timeout-minutes, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, jobs, deploy, name (+15 more)

### Community 8 - "code-audit.cjs"
Cohesion: 0.09
Nodes (19): appFiles, assert, card, ctx, Element, fn(), fs, html (+11 more)

### Community 9 - "learning-path.cjs"
Cohesion: 0.08
Nodes (19): actual, assert, course, ctx, denied, expected, files, from (+11 more)

### Community 10 - "steps"
Cohesion: 0.09
Nodes (22): runs-on, steps, timeout-minutes, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, jobs, deploy, name (+14 more)

### Community 11 - "topic-picker.cjs"
Cohesion: 0.09
Nodes (15): assert, ctx, Element, end, files, forms, fs, html (+7 more)

### Community 12 - "worker.js"
Cohesion: 0.24
Nodes (22): appButton(), askClaude(), brussels(), esc(), fetch(), limited(), makeTopics(), onMessage() (+14 more)

### Community 13 - "init"
Cohesion: 0.14
Nodes (20): 1. P2 — старий модуль дифтонгів може залишатися після оновлення сайту, 2. P2 — годинник змінює хвилини й годину в різні моменти, 3. P2 — зміна мови дозволяє повторно отримувати бали за одне слово, 4. P2 — нові віджети не використовують вибраний записаний голос, 5. P2 — перемикання мови застосунку не перекладає нові уроки повністю, Виконані перевірки, Перевірка Leren.be — 23 жовтня 2026, Підтверджені помилки (+12 more)

### Community 14 - "lesson-conversation.cjs"
Cohesion: 0.10
Nodes (16): assert, bridge, cache, click(), course, ctx, denied, flat() (+8 more)

### Community 15 - "ai-worker.js"
Cohesion: 0.14
Nodes (20): ALLOWED_ORIGINS, askSystem(), chatSystem(), cut(), EXAM11_COACH(), examScript(), fetch(), LANG (+12 more)

### Community 16 - "diphthongs.cjs"
Cohesion: 0.11
Nodes (14): assert, blocked, ctx, end, files, fs, h, html (+6 more)

### Community 17 - "production-companion.cjs"
Cohesion: 0.11
Nodes (16): assert, blocked, cloud, cloudSession, disk, fs, html, local (+8 more)

### Community 18 - "create"
Cohesion: 0.22
Nodes (15): create(), acceptPlacement(), advance(), begin(), beginReview(), continueRoute(), current(), finish() (+7 more)

### Community 19 - "mount"
Cohesion: 0.35
Nodes (16): mount(), begin(), beginTalk(), courseMap(), exercises(), go(), hero(), intro() (+8 more)

### Community 20 - "Production testing journal"
Cohesion: 0.12
Nodes (16): Production testing journal, Publication verified, Short/long O pronunciation repair - 2026-10-26 - v105, TEST-007 layout correction - 2026-10-26 - production v103, TEST-007 production transfer · 26 October 2026 · Europe/Brussels, UI-107 - Focused learning home - 26 October 2026 - Europe/Brussels, UI-109 — Illustrated test collections — 26 October 2026, UI-109 publication receipt (+8 more)

### Community 21 - "focused-home.cjs"
Cohesion: 0.13
Nodes (14): active, assert, button, calls, ctx, denied, fs, old (+6 more)

### Community 22 - "Відповіді для Play Console («Вміст застосунку» / App content)"
Cohesion: 0.13
Nodes (14): 🇬🇧 English (en-US), Leren.be — Google Play: сторінка застосунку й форми Play Console, 🇧🇪 Nederlands (nl-NL), Безпека даних (Data safety), Видалення акаунта (Data deletion), Відповіді для Play Console («Вміст застосунку» / App content), Доступ до застосунку (App access), Основне (Store settings / Main store listing) (+6 more)

### Community 23 - "build-content.mjs"
Cohesion: 0.18
Nodes (13): audio, dict, hashOf(), label(), out, pool, posts, quiz (+5 more)

### Community 24 - "build-dict.mjs"
Cohesion: 0.14
Nodes (9): dir, errs, list, map, out, POS, warn, {chromium} (+1 more)

### Community 25 - "create"
Cohesion: 0.30
Nodes (11): create(), begin(), hint(), next(), repair(), repeat(), retry(), save() (+3 more)

### Community 26 - "round"
Cohesion: 0.30
Nodes (11): load(), pick(), save(), start(), end(), round(), check(), finish() (+3 more)

### Community 27 - "План A2 (збір інформації)"
Cohesion: 0.18
Nodes (10): Leren.be — рівні, бали й план A2, Бали ⭐, Граматика A2, Нові формати вправ для A2, План A2 (збір інформації), Рівні, Теми (повсякденне життя в Бельгії), Що потрібно від Данила (+2 more)

### Community 28 - "clock/widget.js"
Cohesion: 0.40
Nodes (10): cancelTimers(), check(), move(), next(), notifyHeight(), render(), schedule(), setMode() (+2 more)

### Community 29 - "curriculum.cjs"
Cohesion: 0.18
Nodes (10): assert, ctx, curriculum, end, fs, html, start, testEnd (+2 more)

### Community 30 - "pronunciation.cjs"
Cohesion: 0.18
Nodes (7): assert, Audio, ctx, files, fs, html, vm

### Community 31 - "Leren.be — Nederlands A1.1 🇧🇪🇺🇦"
Cohesion: 0.20
Nodes (9): Leren.be — Nederlands A1.1 🇧🇪🇺🇦, Perplexity (пошук в інтернеті для Claude Code), Записане озвучення (замість голосу телефона), Запуск локально, Застосунки для Android та iOS, Словник (Woordenboek), Файли, Що всередині (+1 more)

### Community 32 - "word-builder.cjs"
Cohesion: 0.20
Nodes (8): assert, ctx, files, fs, html, sw, vm, words

### Community 33 - "Leren.be — дизайн-система «Oranje × België» (v2)"
Cohesion: 0.22
Nodes (8): Leren.be — дизайн-система «Oranje × België» (v2), Доступність, Кольори, Компоненти, Правила, Форма та рух, Шрифти, Ідея

### Community 34 - "send-reminders.mjs"
Cohesion: 0.22
Nodes (3): auth, TEXT, VAPID_PRIVATE

### Community 35 - "widgets.cjs"
Cohesion: 0.36
Nodes (8): assert, cache(), clock(), dom(), element(), fs, read(), vm

### Community 36 - "rewards/core.js"
Cohesion: 0.39
Nodes (6): clean(), create(), observe(), save(), mergeSnapshots(), mergeValue()

### Community 37 - "Production transfer · TEST-007 · v102"
Cohesion: 0.25
Nodes (7): Production transfer · TEST-007 · v102, UI-107 - Focused learning home, UI-109 — Illustrated Tests library, UI-110 — Home polish, UI-111 — Game-card art, UI-114 — Word builder art and nouns, UI follow-up - v104

### Community 38 - "ref_node_fs"
Cohesion: 0.29
Nodes (6): assert, fn(), fs, html, scenario(), vm

### Community 39 - "Курси NT2 1.1 і 1.2 — 23.10.2026"
Cohesion: 0.29
Nodes (6): Курс 1.1, Курс 1.2, Курси NT2 1.1 і 1.2 — 23.10.2026, Основа розподілу, Перевірки, Узгодження частин застосунка

### Community 40 - "focused-home/ui.js"
Cohesion: 0.43
Nodes (5): hero(), meter(), tools(), topic(), voiceIcon()

### Community 41 - "rewards/ui.js"
Cohesion: 0.62
Nodes (6): art(), celebrate(), cup(), download(), panel(), unitLabel()

### Community 42 - "ref_node_vm"
Cohesion: 0.29
Nodes (5): assert, c, expected, fs, vm

### Community 44 - "Final prompts (built-in generation, no reference image supplied)"
Cohesion: 0.33
Nodes (5): everyday-v109.webp, Final prompts (built-in generation, no reference image supplied), first-steps-v109.webp, practice-v109.webp, Test collection illustrations — 26 October 2026, release 109

### Community 46 - "Перевірка Leren.be — 24.10.2026"
Cohesion: 0.33
Nodes (5): Виправлення, Межі перевірки, Перевірена версія, Перевірка Leren.be — 24.10.2026, Результати

### Community 47 - "Перевірка коду — 22 жовтня 2026"
Cohesion: 0.40
Nodes (4): Виправлено, Межі перевірки, Перевірено, Перевірка коду — 22 жовтня 2026

### Community 48 - "Production diphthongs mini-lesson — 2026-10-24"
Cohesion: 0.40
Nodes (4): Delivered, Phonetic references, Production diphthongs mini-lesson — 2026-10-24, Verification

### Community 49 - "leren.be — перевірка 23.10.2026"
Cohesion: 0.40
Nodes (4): leren.be — перевірка 23.10.2026, Потребує окремої перевірки, Публікація, Підтверджено

### Community 50 - "createView"
Cohesion: 0.60
Nodes (4): createView(), cancel(), render(), addForm()

### Community 51 - "Focused learning home - production v108"
Cohesion: 0.40
Nodes (4): Analysis of the supplied reviews, Focused learning home - production v108, Navigation and learning contract, Validation

### Community 52 - "Кіт-учень Leren.be · TEST-007"
Cohesion: 0.50
Nodes (3): Prompt 1 · generation with identity reference, Prompt 2 · final transparent-background pass, Кіт-учень Leren.be · TEST-007

### Community 53 - "render"
Cohesion: 1.00
Nodes (3): blocks(), ensureCombined(), render()

## Knowledge Gaps
- **1 isolated node(s):** `AZURE_SPEECH_REGION`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 475 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 15 inferred relationships involving `create()` (e.g. with `learning-path/core.js` and `acceptPlacement()`) actually correct?**
  _`create()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AZURE_SPEECH_REGION` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main` be split into smaller, more focused modules?**
  _Cohesion score 0.06794871794871794 - nodes in this community are weakly interconnected._
- **Should `runtime-smoke.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Should `exam11.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14838709677419354 - nodes in this community are weakly interconnected._
- **Should `companion.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07311827956989247 - nodes in this community are weakly interconnected._
- **Should `steps` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._