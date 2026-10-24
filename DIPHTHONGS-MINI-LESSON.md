# Production diphthongs mini-lesson — 2026-10-24

Target: Leren.be / https://lerenbe.com/, cache v87. Baseline c41acbc was checked before changes; the published widget files matched the repository. All seven existing test suites passed. The five old panes, language changes, quiz and dictation were exercised in the production browser. The old widget did not award host XP and its header/tab layout was crowded at 360px.

## Delivered

- Three stages: learn the three core sounds, listen (six word contrasts and eight sound-identification questions), check (ten balanced questions).
- Spoken word contrasts, translated feedback, audio comparison, mistake-only review, saved unfinished rounds and personal bests.
- Learning milestones: three sounds studied, at least 5/6 word contrasts and 7/8 sound-identification answers, at least 8/10 final answers.
- Personal-best improvements award five host points per additional correct answer; reviews do not award points. Results also appear in the main Progress view.
- Existing v1 best is retained. New state and the XP ledger use the existing cloud-sync prefix. Versioned lesson assets are cached together with v87.
- Ukrainian, English, French and Arabic, including RTL and keyboard tabs. Responsive 320px and 360px layouts.

## Verification

All eight suites in tests/ pass, including the new diphthongs suite. Coverage includes balanced banks, interrupted-round restoration, repeated/stale clicks, mastery, review queues, corrupt/blocked storage, retained legacy best, reward idempotency and exact offline dependencies.

Browser checks in the complete local app: all stages, explicit audio controls, language change after an answer, reload with an answered question, full battle and dictation, wrong-only retry, 10/10 quiz, global XP (80 after the tested rounds), no duplicate reward on reload, main Progress results and lesson shortcut. Browser error/warning log was empty. Arabic at 320px and Ukrainian at 360px were visually checked.

Audio uses the existing selected-voice player and Auto setting. Words without a bundled recording use its existing Dutch speech-synthesis fallback. Physical phone speaker output and installed device voices were not directly verified.

## Phonetic references

Core diphthongs versus vowel/glide combinations:
https://www.taalportaal.org/taalportaal/topic/pid/topic-13998813314542255

Rounded ui articulation:
https://www.taalportaal.org/taalportaal/topic/pid/topic_20150611211852218

The core quiz excludes extra ooi/eeuw combinations; they remain separately explained and playable. oe/ie/eu and diaeresis words are taught as contrasts.
