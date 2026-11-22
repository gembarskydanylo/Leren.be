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
- Learner data does not need a rollback. 263 changes no learner key; the upgrade test checks this for 6 profiles.
- Backups (Ai_Project disk, `LerenBe-3.0-integration-2026-11-21/backups`):
  - a full bundle of the production checkout;
  - its untracked files;
  - a TEST-036 bundle.

## 6. Manual checklist before a merge (owner)

1. Deploy the proposed Worker, or decide to ship without it: Lexi with the Peter prompt, Lesson Help without context.
2. Decide whether en/fr stay preview-only (the current production rule, kept here).
3. On a real Android phone (Samsung), open `?multilang=1` and the normal home, then check:
   - a lesson with listening, Lexi and Lesson Help;
   - LIFE;
   - offline after one visit;
   - keyboard over the Lexi input;
   - Back button, rotation and resume.
4. On a real phone with an old install (226), check the update bar, one tap, and that the XP, streak and lessons are
   unchanged.
5. Check the 4 interface languages on a phone; ar must be right-to-left.
6. App Check: monitoring only, no enforcement.

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
- `perf-budget`: the render-blocking first screen is 759.9 KB of 760 KB. The budget was not raised.

**Not checked here (needs a real device or a production-like environment):**
- a physical Samsung or Android phone: the keyboard over the Lexi input, real audio and TTS, the Back button, real
  rotation, low memory;
- the real model through the Worker (all AI checks use a mock);
- the proposed Worker on Cloudflare, with real rate-limit bindings;
- Firebase sync, App Check and push on lerenbe.com;
- an update from an old install on a real phone.
