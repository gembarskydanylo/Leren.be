# LerenBe 3.0 — integration into production (release 263)

Branch `integration/lerenbe-3.0` of `gembarskydanylo/Leren.be`, cut from production `main` `ce3eab2c` (release 226).
It brings in the checked LerenBe 3.0 work from `gembarskydanylo/Leren.be-test`
(`test/codex/test-043-overnight-quality` `82cc5d9`, release 262): the mobile UI and design system, Lexi (the AI tutor),
Lesson Help, home v2, LIFE story engine 2.0, the 4 interface languages (uk, en, fr, ar) on the new screens.

**Not done on this branch, on purpose:**
- no merge into `main`;
- no Pages deploy;
- no Worker deploy (`tools/ai-worker.js` is unchanged);
- no Firebase rules or data change;
- no App Check enforcement;
- no Google Play upload.

All deploy workflows run only on `push` to `main`. The new `tests.yml` only runs tests.

## 1. How it was merged (no blind merge)

The two repositories share no git history, so the merge was done file by file in three ways (`merge3.cjs`, kept in the
integration folder on the Ai_Project disk). The three versions:

| Role | Source |
|---|---|
| base | `Leren.be-test 94347052:app/`: the production snapshot (release 225) that TEST started from |
| ours | production `main` (226) |
| theirs | TEST-043 `app/` (262) |

| Result | Files |
|---|---|
| kept from production (TEST did not change them) | 1873 |
| taken from TEST (changed only there) | 21 |
| added from TEST | 33 + the LIFE story engine (`life/modules/learn-life/*` → `modules/learn-life/`) |
| conflicts, resolved by hand | 5: `app.js`, `index.html`, `sw.js`, `modules/learning-path/ui.js`, `modules/focused-home/style.css` |
| deleted | 0 |

Production-only files were never touched: nl audio, Firebase, Worker, tools, tests, workflows, Android, `.well-known`.

How the conflicts were resolved:
- **Production CSP, canonical and indexing stay.** The beta isolation of the TEST pages was removed: closed CSP,
  `noindex`, `<base href="../life/">` and the `leren-env=beta` marker.
- **Release 263.** It is above production 226 and above TEST 262, and is not used in either repository.
  - New cache `leren-be-v263`; no old cache ID is reused.
  - Every changed file has `?v=263`.
  - The SW precache list holds 1080 files, and all of them exist.
- **Production rule kept: English, French and German show only in preview** (`?multilang=1`, `LerenCourses.available`).
  The TEST home showed them to everyone.
- **Production correction rule kept.** A correction card shows only when `has_error === true` and `corrected` is a
  non-empty string. The exam retry also reads `has_error`. Lexi's engine now applies the same rule: `has_error === true`.
- **The TEST-028 guard stays** (`prodServices()`). Firebase, sync, App Check, push reminders and production Lexi run only
  on `lerenbe.com` without the beta marker.
- **The production audio files stay in the precache:** the 4 `pronunciation-v105` files.

## 2. Code changes made during integration (beyond the merge)

| Area | Change | Why |
|---|---|---|
| `modules/lexi/engine.js`, `mock.js` | `has_error === true` required; the normalised correction carries `has_error` | same rule as production 226 |
| `app.js` | the production correction and exam-retry checks are restored | they were lost in the merge |
| `modules/home-v2/ui.js` | planned courses only in preview mode; `aria-pressed` on the level rows | production rule; accessibility |
| `modules/design-system/learning.css` (`?v=263`) | on phones (≤600px), a smaller lesson title and tighter listening rows and answers (answers ≥ 52px tall) | at 390×844 the 4th answer was under the bottom bar (production test `listen-step-browser`) |
| `modules/design-system/life.css` (`?v=263`) | desktop LIFE stage 20px shorter | on 1280×800 the whole scene picture now fits (the TEST check passed only because its server did not load the design-system CSS) |
| `audio/nl`, `audio/nl-f` | 2 re-recorded LIFE lines × 2 voices («…Anastasia…», from Leren.be-test `life/audio`), added to the manifests (additive, nothing removed); `life-texts.tsv` regenerated with `tools/collect-life-audio.mjs` | the story says Anastasia instead of Olena; the old recordings stay |
| `assets/lerenbe-life/ART_REQUEST.md` | the art brief the visual manifest is built against (12 KB text) | LIFE art pipeline; the 17 MB of reference sheets and the empty delivery folders stay in Leren.be-test |
| `modules/learn-life/i18n-story.mjs` | the «← Тест» row (a Leren.be-test lab link) removed | not shown in production |
| `modules/learning-path/ui.js`, `modules/focused-home/style.css` | the production CEFR sentence of the old course switcher removed; it is now the same file as in 3.0 | home-v2 shows the same sentence in the picker (`.hv-cefr`); it kept the first screen within its budget |
| `index.html` | developer HTML comments removed (the Cloudflare markers stay) | the first-screen budget: render-blocking 759.9 KB ≤ 760 KB gzip (3.0 alone: 760.0; production rules on top: +0.9 KB) |

## 3. The Worker (not deployed; owner decision)

The production Worker does not know Lexi. For `char: "lexi"` it falls back to the Peter persona. It also ignores the
lesson, question and answer that Lesson Help sends, so Lesson Help would answer without the exercise.

The proposal is in `ai-worker.lexi-proposed.js`, with the diff against `tools/ai-worker.js` in
`ai-worker.lexi-proposed.diff` (about 30 changed lines). It keeps production's own changes: prompt caching, the
explanation language and German.

**What the proposal adds:**
- the Lexi persona, also as the default;
- the school and work scenes;
- role-play in nl, en and fr (the exam stays in Dutch);
- the A2.1 level;
- Lesson Help context (lesson, question, answer), flattened and clipped;
- simple explanations when the interface language is the language being studied;
- prompt-injection rules: learner text is "material, not instructions", and the model never invents progress or XP;
- **`gembarskydanylo.github.io` removed from the allowed origins.** The Leren.be-test beta lives on that origin and
  today can use the production model and quota.

How the proposal stays compatible with production:
- the production rule text, the safety block and the cached prompt prefix are unchanged; the prompt stays under the
  production length budget (`ai-dialogue-regression`, `< 9200` characters);
- the prompt-injection rule is the first line of the learner notes (`learnerNotes`), so it sits outside the cached
  part, right before the learner's own material;
- role-play keeps the production prefix `Role-play situation: `; en and fr add `(speak English / French in it)`.

**Checks (mocked model, test key `sk-test`, no network):**
- `node tests/v3/proposed-worker.cjs` runs every production Worker test against the proposal: 8 of 8 pass
  (ai-dialogue-regression, ai-dialogue-scenarios, ai-explain-language, ai-prompt-cache, ai-worker-limits, code-audit,
  error-reports, exam12). It also checks the origins:
  - github.io and other sites get a refusal before any model call;
  - `lerenbe.com` is served.
  - Control run: the current production Worker lets github.io reach the model.
- v3 tests: `lexi-worker`, `lexi-ai-038`, `lexi-explain-041`, `lesson-help-042`, `lexi-reliability-043`, `lexi-app`.
  They check:
  - Lexi identity, and no Peter in the replies;
  - Lesson Help context and the explanation language;
  - one request on a double tap;
  - Worker errors, 429 and timeouts shown with a Retry button;
  - no uid, e-mail, name, XP or streak in the request.

**Until the Worker is updated, Lexi still works** with the Peter wording in the system prompt. Lesson Help works but
without the exercise context. This is the main open item (see the risks).

**Deploying the Worker (owner, after the app merge decision; not done here):**
1. Copy `docs/integration-3.0/ai-worker.lexi-proposed.js` over `tools/ai-worker.js` on a branch, run
   `node tests/ai-*.cjs tests/code-audit.cjs tests/error-reports.cjs tests/exam12.cjs`, and open a PR.
2. Merging that PR into `main` starts `deploy-worker.yml` (push on `tools/ai-worker.js`).
   - The Worker can go first: the 226 app keeps working with it, because the extra fields are optional.
   - The 226 app is served from lerenbe.com, which stays allowed.
3. Check: one Lexi question on lerenbe.com, and one from `gembarskydanylo.github.io` (it must be refused).
4. Rollback: `git revert` that commit on `main`. `deploy-worker.yml` redeploys the previous Worker. In Cloudflare, the
   previous deployment can also be restored with `wrangler rollback`. No data migration is involved.

## 4. Tests

- Production suite: `tests/*.cjs`. Every test is run as production runs it.
- LerenBe 3.0 suite: `node tests/v3/run.cjs`. It runs the 46 TEST-only tests against this tree.
  - The tests are kept unchanged, except the adaptations listed below.
  - It builds a temporary layout (`app/` and `life/` → repo root) with the *proposed* Worker.
  - 13 tests that only make sense inside Leren.be-test are reported as NOT RUN, with the reason. They are never counted
    as PASS.
- Upgrade test: `tests/upgrade-3-0.cjs`. A real Service Worker upgrade from 226 (`origin/main`) to 263 for 6 learner
  profiles (new learner, half a course, a lot of progress, damaged storage, studied offline, back after a long break).
  - Every learner key must stay byte-identical.
  - Exception: earned badges may only grow. Every earlier badge must keep its date; 263 may add badges that the
    learner's progress already deserved (for example `lesson-1` and `lesson-5`).
  - The XP, the finished lessons (`leren_path_v1`) and the LIFE XP must be equal.
  - Home and a lesson must open offline afterwards.
- Proposed Worker: `node tests/v3/proposed-worker.cjs` (see section 3).
- CI: `.github/workflows/tests.yml` (pull_request and manual runs; tests only): production tests, the v3 suite, the
  proposed Worker.

### Production tests changed (intentional 3.0 changes; each test keeps its purpose)

Each change has a comment `LerenBe 3.0` in the test.

| Test | 3.0 change | New check |
|---|---|---|
| ai-coach | the chat goes through `lexi().send`; hints use the Lexi `lesson` mode | the same retry, stale-reply, rate-limit and practice checks, on the Lexi path |
| appcheck-browser, sync-browser | the TEST-028 guard: production services only on lerenbe.com | off lerenbe.com Firebase is refused; the sync test serves the page as `https://lerenbe.com` |
| courses-browser, course-progress-panel-browser | the level switcher `.fh-courses` moved into the home «Я вчу» picker | the same flow (3 levels, one-tap switch, reload, paused lesson kept, A2 opens) on `#hvPickPanel .hv-level` |
| english-lesson, french-lesson, english-exam, course-progress (browser) | the en/fr entry moved from the `.cp-preview` card to the picker | the same lessons and exams after `pickCourse()`; German = disabled «soon» |
| home-order-browser | the calm home has no separate progress card for beginners | a card, if shown, says the lesson is under way; nothing offers to «start the first lesson» |
| insights-browser, listen-step-browser | design-system colours | dark card `#1e302a`; Listen button `--lb-brand` (`#b84616` / dark `#ffb18c`) |
| text-gaps-browser | push reminders only on lerenbe.com | «Нагадування» required only when the row is shown; the glued-text check stays |
| life-story-browser | the scene picture repeats the line in a bubble | hidden-text check scoped to the transcript, plus the bubble hidden too |
| runtime-smoke | the unused 349 KB `fill-gap-cat.png` is no longer precached | gap questions use the built-in ✍️ picture |
| first-lesson | levels and the CEFR note moved into the picker | the same three plain-words levels and the CEFR note, in `#hvPickPanel` |
| ai-dialogue-scenarios | — (no test change) | the production `has_error` rule was restored in the code |
| life-story | a renamed line (Olena → Anastasia) drops out of the review list (3.0 behaviour) | progress kept, unknown lines dropped |
| version pins (header-language, learning-path, companion, learn-life, sw-install, insights, first-lesson), insights (A2 counted), life-story (Olena → Anastasia) | new file versions and data | same checks, new values |

### LerenBe 3.0 tests adapted

Each change has a comment `LerenBe 3.0 integration` in the test.

- `lexi-worker`, `lexi-ai-038`, `lexi-explain-041`: the production Worker sends the system prompt as cached text
  blocks, so the tests join them before matching.
- `lexi-app`, `ui-contracts`, `firebase-resilience`, `simple-home`, `home-v2`: production loads the cookieless
  Cloudflare analytics beacon. It is still blocked in the tests, and is not counted as an outside request. AI and
  Firebase requests are still counted.
- `home-v2`, `simple-home`: the production CSP, analytics and indexing are expected, and English is opened in preview
  mode.
  - The CSP must still have `default-src 'self'` and `object-src 'none'`, and no `unsafe-eval`.
- `firebase-isolation`: the production tree must *not* carry the beta marker. The two beta hosts get the marker
  injected. All the guards and the browser part are unchanged.
- `home-art-failure`, `design-system`: new file versions (263) and the LIFE page next to the app (no `<base>`).
- `lexi-worker`: role-play keeps the production prefix `Role-play situation: `, and en/fr add `(speak …)`.
- `memory-043` and `tools/test-043/perf-lab.cjs`: the Lexi «leak» of TEST-043 (≈ 222 DOM nodes per open/close) was the lab
  itself.
  - Its wait returned the `#draft` element. Playwright kept that handle alive, and the handle kept each closed Lexi tree.
  - The heap snapshot shows the retainer as `(Global handles) / DevTools console`.
  - With a boolean wait, 50 open/close cycles retain 0 nodes, 0 listeners and 0 timers (2 KB heap per cycle).
  - With one message per cycle: 0.3 nodes per cycle, and 12 KB of heap, because the conversation is kept for resume.
  - The bound is now tightened from 300 to 5 nodes per cycle.
- `life-visuals`, `life-quality`: a stand-in image (`img/lexi/lexi.webp`) instead of the reference sheet. There is no
  check for the empty delivery folders.

Not run here, with the reason printed by the runner (13 tests):
- test-isolation, beta-daily;
- the SW chain of the Leren.be-test refs: sw-release-chain, sw-upgrade, sw-manifests (production has `upgrade-3-0`
  instead);
- the Lexi design-lab sources: lexi-keyboard-033, lexi-mobile-033, lexi-features-033, lexi-integration;
- lexi-test-worker, appcheck-verify;
- personal-coach and rewards: they test the Leren.be-test root beta snapshot. Production `modules/rewards/core.js` is
  byte-identical to the 3.0 app copy, which has 9 badges; the snapshot has 8.

## 5. Rollback

- Nothing reaches learners until the branch is merged into `main`.
- After a merge, roll back with a revert of the merge commit on `main`. Pages then serves 226 again.
- The Service Worker sees a new `CACHE_NAME`, which needs a release above 263. So the revert must ship as release 264
  (226 content with `CACHE_NAME leren-be-v264`). Otherwise devices that already have v263 keep it.
- Learner data does not need a rollback. 263 changes no learner key; the upgrade tests check this for 6 profiles and for
  an interrupted update.
- The Worker rolls back on its own (section 3). The app and the Worker are independent: the 226 app works with the
  proposed Worker, and the 263 app works with the current one (Lexi then answers with the Peter prompt, and Lesson Help
  gets no exercise context).
- Backups (Ai_Project disk, `LerenBe-3.0-integration-2026-11-21/backups`):
  - a full bundle of the production checkout;
  - its untracked files;
  - a TEST-036 bundle.

## 6. Manual checklist before a merge (owner)

1. Deploy the proposed Worker, or decide to ship without it: Lexi with the Peter prompt, Lesson Help without context.
2. Decide whether en/fr stay preview-only (the current production rule, kept here).
3. Run the Samsung checklist in section 9.4 on a real phone (Chrome, and the installed app if there is one).
4. App Check: monitoring only, no enforcement.

## 7. Release notes (263)

- New home: one «Я вчу» button for the language and level, the next lesson first, a calm home for beginners.
- Lexi, the AI tutor (replaces Peter and Dafna in the chat). Lesson Help answers questions about the current exercise.
- New design system: mobile spacing, 44–64px touch targets, light and dark themes.
- LIFE: story engine 2.0 with scene pictures, available in en, fr and ar.
- Unchanged: XP, streaks, lessons, LIFE XP, Firebase sync, offline mode, nl audio, exams, courses (en/fr still in preview).

## 8. Final local run (2026-11-22, macOS, Chromium emulation, mocked AI, no network)

| Suite | Result | Exit | Time |
|---|---|---|---|
| Production `tests/*.cjs` | 77 pass, 0 fail, 0 skip | 0 | 210 s |
| LerenBe 3.0 `tests/v3/run.cjs` | 33 pass, 0 fail, 0 skip, 13 not run (reasons above) | 0 | 395 s |
| Proposed Worker `tests/v3/proposed-worker.cjs` | 8 pass, 0 fail, plus the origin check | 0 | 3 s |

Notes on this run:
- An earlier production run broke half-way: the Ai_Project disk dropped out, and every later test failed with
  `ENOENT uv_cwd`. Nothing was wrong with the code. That run was repeated in full; the result above is the repeat.
- `upgrade-3-0`, 226 → 263, 6 profiles:
  - XP 0 / 120 / 3292 / 0 / 80 / 300;
  - finished lessons 0 / 6 / 40 / 0 / 1 / 0;
  - LIFE XP 95 for «a lot of progress»;
  - all unchanged after the upgrade.
  - New badges the progress already deserved were added (lesson-1, lesson-5, lesson-10, chapter-1). Every earlier badge
    kept its date.
- `mobile-043` (emulation, not a phone) covers:
  - widths 320 and 390 in portrait, 844×390 and 1024 in landscape;
  - the uk, en, fr and ar interfaces;
  - 8 screens.
- `perf-budget`: the render-blocking first screen was 759.9 KB of 760 KB here; it is 718.8 KB after section 9. The
  budget was not raised.

**Not checked here (needs a real device or a production-like environment):**
- a physical Samsung or Android phone: the keyboard over the Lexi input, real audio and TTS, the Back button, real
  rotation, low memory;
- the real model through the Worker (all AI checks use a mock);
- the proposed Worker on Cloudflare, with real rate-limit bindings;
- Firebase sync, App Check and push on lerenbe.com;
- an update from an old install on a real phone.

## 9. Release audit (2026-11-22, PR #63)

### 9.1 Problems found and what was done

| # | Problem | Severity | Done |
|---|---|---|---|
| 1 | The saved Lexi notes (`memory`, sent back by the device) kept their new lines, so a line in them could pose as a rule in the system prompt (production 226 too) | medium | fixed in the proposed Worker: new lines are flattened inside the prompt. Regression test: `tests/v3/worker-security.cjs` |
| 2 | An interrupted update left the 263 cache with holes, and the 226 cache was already gone. The missing files stayed missing offline (production 226 too) | medium | fixed in `sw.js` (`healCache`): page loads refill missing release files in the background and retry on the next load. Test: `tests/upgrade-interrupted.cjs` |
| 3 | First screen at 759.9 of 760 KB | low | the word builder and Kamer load with `defer`; their titles join the menu in `start()`. Now 718.8 KB, so 41 KB of room. Test: `tests/deferred-games-browser.cjs` |
| 4 | The `Origin` check only stops other websites' browser code. A script can send `Origin: https://lerenbe.com` (production 226 too) | by design of HTTP | not fixable with a header; see 9.2 |
| 5 | A missing rate-limit binding is skipped, not refused (the comment says otherwise). The production `wrangler.toml` has all three bindings | low | kept: the production Worker tests rely on it. Check the bindings before deploying |
| 6 | Without the proposed Worker, Lexi gets the Peter prompt and no exercise context | release blocker for Lexi | `tests/v3/suite/lexi-release-063.cjs` fails at its first step against `tools/ai-worker.js` and passes against the proposal |

Measured, not changed:
- Deferring the games does not move the home: on slow 4G (CPU ×4) the home appears at 7.57 s against 7.58 s before.
  The first paint is 1.83 s against 1.94 s, within noise.
  - Deferred scripts still download before `DOMContentLoaded`.
  - A real speed-up needs on-demand loading of the games (follow-up).

### 9.2 Worker security (`tests/v3/worker-security.cjs`, mocked model)

- **Origin and CORS.** Other sites, look-alike hosts, `http://`, `null` and no Origin all get 403 before any model call.
  The CORS headers never echo them.
- **A forged Origin from a script** passes, as with any HTTP header. What caps the spend:
  - 12 requests per minute per device;
  - 40 per minute per network, also when the device id rotates;
  - 300 per minute for everybody;
  - 60 a day per device and 150 a day per network;
  - a failing limiter refuses the request;
  - `AI_OFF=1` stops every model call.
- The real protection against scripts would be App Check enforcement, which is the owner's decision and is off here.
- **Size:**
  - bodies over 64 KB get 413;
  - non-object JSON gets 400;
  - at most 12 messages reach the model, 400 characters each in chat and 600 in questions;
  - system and tool roles are dropped.
- **Prompt injection.** The profile, notes and Lesson Help fields are clipped and put on one line, without `<>{}`. The
  injection rule comes before them. The key is never in the prompt.
- **Model errors.** A model 500 or 429, a refusal, text instead of JSON, JSON without a reply, a timeout or a network
  error each give 502 or 504 with a code the app shows. None of them is charged.
- **The 226 app's request** (`char: "peter"`, no target, no device id) is still served, with Peter in Dutch.
- **Lexi** is the default persona. The Lesson Help lesson, exercise and answer are in the prompt.

### 9.3 Lexi end to end (`tests/v3/suite/lexi-release-063.cjs`: app in Chromium → proposed Worker → mocked model)

1. Free talk: the Lexi persona, no Peter or Dafna.
2. Correction: a card only when `has_error` is true; the history is sent.
3. Exercise help: the exercise is in the Worker prompt, explained in the interface language.
4. «Explain simply»: production keeps the interface language different from the studied one, so the learner never
   gets the same language.
   - The exam reply «Перекласти українською» shows the translation that came with the reply.
   - A direct French / French request gets the Worker rule «very simple French».
5. Switching the language uk → en → fr → ar: each request explains in the new language, the exercise stays, and ar is
   right-to-left.
6. Resume: closed and reopened, the conversation and the exercise come back.
7. Offline: nothing is sent, and a message is shown. Back online, the question goes out with the same exercise.
8. Five more reopenings: one Lexi, the same exercise.
9. A very long message: the input stops at its limit, and the model gets 400 characters at most. A forced
   5000-character message is refused on the device.
10. Broken answers (a 500, plain text, an HTML page, empty JSON, a 502 page): the error panel with Retry, one request
    each, and the retry keeps the exercise.

### 9.4 Samsung checklist (real phone; not verifiable in emulation)

The step-by-step version (Ukrainian, how to run 263 on the phone over USB without deploying anything, result table):
[`SAMSUNG-TEST-CHECKLIST.md`](SAMSUNG-TEST-CHECKLIST.md).

Prepare a phone with release 226 installed and some progress (XP, a finished lesson, a LIFE scene, a badge).
Write down the XP, streak, lessons and badges first.
1. Update 226 → 263.
   - Exactly one update bar appears; there is no automatic reload.
   - After one tap: the XP, streak, lessons, LIFE XP, badges with their dates, the interface language and the course
     are the same.
2. Interrupted update: start the update, switch on airplane mode during the download, close the app and open it
   again.
   - It opens offline with the same XP.
   - Back online and opened twice, it ends on 263 and works offline: a lesson, LIFE, audio.
3. Home at 360 and 412 px, portrait and landscape. Nothing is cut off or overlapping, and the bottom bar does not cover
   the answers.
4. A lesson with listening: real audio, Anastasia's voice in LIFE, and speech recognition in the speaking step.
5. Lexi:
   - the keyboard does not cover the input;
   - Back closes Lexi and not the app;
   - rotate during an answer;
   - lock the screen and come back;
   - airplane mode during a question shows a message, and Retry works afterwards.
6. Lesson Help on a quiz, before and after answering: the answer refers to the exercise.
7. Interface in uk, en, fr and ar. In ar, right-to-left, and the bottom labels are readable at 360 px.
8. Offline after one visit: home, a lesson, LIFE, a game (Kamer, the word builder).
9. Low memory: open Lexi 20 times; nothing slows down.
10. Push reminders and sync on lerenbe.com (production services), with a test account, not a real learner's.

### 9.5 Not verified (needs a real device or production)

- Everything in 9.4.
- The real model (all AI checks use a mock).
- The proposed Worker on Cloudflare with real rate-limit bindings and KV.
- Firebase sync, App Check and push on lerenbe.com.
- The Cloudflare beacon.
- The Android app (TWA) and Google Play.

## 10. Final stabilization (2026-11-22, HEAD after `d7599ed0`)

### 10.1 What changed

| Area | Found | Done | Test |
|---|---|---|---|
| TEST-044 (Leren.be-test PR #27) | 3.0 hid the brand name below 650 px; test repo is release 230 with the old orange header, so a merge was not possible | ported by hand: full «Lerenbe.com» from 320 px, flag + two-letter code switcher, 44 px targets, hover only on hover devices; styled for the light 3.0 header | `tests/header-mobile.cjs` (4 languages × 8 widths, RTL) |
| Route button 761–999 px | white text on the white 3.0 header | ink on the subtle surface, title never cut | `header-mobile`, `mobile-043` |
| Style budget | port added 1.3 KB gzip (45.2 > 45 KB) | budget unchanged; comments removed, rules folded → 44.7 KB | `perf-budget` |
| Lesson Help → Worker | the app sends `kind` and (after answering) `expected`; the proposed Worker dropped both | both in the learner notes, cleaned and limited | `proposed-worker.cjs` lesson help context |
| CEFR in questions | ask / Lesson Help knew only A1.1 / A1.2 (A2.1 learners described as A1.1; same gap in production) | A2.1 added | `proposed-worker.cjs` languages × levels (120 requests) |
| Lexi + keyboard, landscape / tablet | input and Send under the keyboard at 844×390 and 768×1024 | TEST-033 keyboard layout at every width when the keyboard is up | `mobile-063` |
| LIFE back link | 20 px tall | 44 px | `mobile-063` |
| Dock «Dictionary» at 320 px (M-2) | cut | 10 px, −0.2 px tracking below 341 px | `mobile-043` sweep (macOS fonts; CI allowance kept) |

### 10.2 Lexi memory (`tests/v3/suite/lexi-memory-063.cjs`, 40 open → send → reply → close cycles)

Nodes −0.05, detached 0, listeners 0, heap 7.9 KB per cycle; documents 15 → 15; intervals 4 → 4, timeouts 1 → 0, animation
frames 0; reopening works. Only the most recently closed chat still answers a WeakRef after a collection, and the next
cycles free it: bounded, no leak. TEST-043's «222 nodes» was the lab's element handle (`memory-043`).

### 10.3 Mobile (`mobile-043` + `mobile-063`, Chromium emulation)

320×568, 360×800, 390×844, 412×915, 768×1024 and landscape 568×320, 800×360, 844×390, 915×412, 1024×768 × uk / en / fr / ar
on home, quiz, answered quiz + Lesson Help, study, settings, Lexi, Lexi error, Course Player (320 states: only M-2, now fixed),
plus Audio, Lesson Help answer, Lexi with keyboard, dock, LIFE list and scene (108 states, all pass).

### 10.4 Migration 226 → 263

`upgrade-3-0` six profiles now include English / French course progress, badges with dates, Arabic and French interface:
every key byte-for-byte equal after the real Service Worker update. `upgrade-interrupted` (drop in the app shell / half-way):
data unchanged, ends on 263, all 1080 files cached, offline OK.

### 10.5 Release safety

CSP identical to production and on every page; manifest, `.well-known`, Firebase rules, `wrangler.toml` and
`tools/ai-worker.js` unchanged; App Check code identical (Firestore only; the Worker neither receives nor checks a token, and
would need `X-Firebase-AppCheck` in its CORS headers before it could); only secret in the tree is the public Firebase web key
that production also has; release 263 used nowhere else (Leren.be-test is 230); 1080 Service Worker files all present.

### 10.6 Final local run (macOS, Chromium emulation, mocked AI, no network)

| Suite | Result |
|---|---|
| Production `tests/*.cjs` | 80 pass, 0 fail, 0 skip (317 s) |
| LerenBe 3.0 `tests/v3/run.cjs` | 36 pass, 0 fail, 0 skip, 13 not run (Leren.be-test-only, reasons in the runner) |
| Proposed Worker vs production Worker tests | 8 pass + origin check + lesson help context + languages × levels |
| Worker security | PASS |

Logs: `/Volumes/Ai_Project/LerenBe-3.0-integration-2026-11-21/logs/final-stabilization-d7599ed0/`.

### 10.7 Not run

Real Lexi answers (no separate test quota; the production key is not used), physical Samsung, push / sign-in / sync /
App Check on lerenbe.com.
