# Реліз 264 — чекліст

PR: #65 (`audit/lerenbe-3-0-quality` → `main`, Draft). Production зараз — **263** (`leren-be-v263`).
Злиття, розгортання сайту й Worker, Google Play — **лише з окремого дозволу власника**.

## 1. Перед злиттям (автоматично)

- [x] Production-тести `tests/*.cjs` — локально PASS
- [x] `tests/v3/run.cjs` — локально PASS (13 not run: лише Leren.be-test)
- [x] `tests/v3/proposed-worker.cjs`, `tests/v3/worker-security.cjs` — PASS
- [x] Мобільна матриця `FULL_MATRIX=1 node tests/v3/run.cjs mobile-matrix` — 312 станів, PASS
- [ ] CI `tests.yml` на останньому коміті PR #65 — зелений
- [x] `RELEASE_VERSION` = 264, `CACHE_NAME` = `leren-be-v264`, `app.js?v=264`; усі змінені скрипти з новим `?v=` (тест `code-audit.cjs`)
- [x] `tools/ai-worker.js` = `docs/integration-3.0/ai-worker.lexi-proposed.js`
- [x] PR не змінює `firestore.rules`, `firebase.json`, `wrangler.toml` і workflows: розгортається лише сайт і Worker

## 2. Перед злиттям (вручну)

- [ ] Справжній AI — [LEXI-REAL-AI-TESTS.md](../testing/LEXI-REAL-AI-TESTS.md): 0 розв'язків у Lesson Help до відповіді, 0 Peter/Dafna, ≥ 26 / 31 правильних кнопок
- [ ] Samsung — [SAMSUNG-264.md](../testing/SAMSUNG-264.md): пункти 1–5 PASS; 7–10, 13–15 PASS або записані
- [ ] Власник: ліміт витрат на ключі Anthropic перевірено ([W8](../security/AI-WORKER-RISK-ASSESSMENT.md))
- [ ] Власник: рішення про лабораторію TEST-030 (патч `docs/integration-3.0/lexi-lab-sync-264.patch` або `modules/lexi/` як джерело)
- [ ] Опис PR #65 оновлено, Draft знято власником

## 3. Злиття і розгортання (власник)

1. Merge PR #65 у `main` (не squash, щоб лишилась історія тестів — на розсуд власника).
2. GitHub Pages публікує сайт; `deploy-worker.yml` розгортає Worker (зміна `tools/ai-worker.js`). Перевір обидва workflow у вкладці Actions.
3. Через 5–10 хв:

```bash
curl -s https://lerenbe.com/sw.js | grep CACHE_NAME
```

Очікується `leren-be-v264`.

## 4. Після розгортання (≈ 30 хв)

- [ ] lerenbe.com на телефоні: оновлення приходить, прогрес на місці, Налаштування без «Вчитель»
- [ ] Lexi: одна вільна розмова й одне питання про мову — відповідають (нові поля `reply_type`, `explain`)
- [ ] Старий застосунок у кеші 263 з новим Worker — відповідає Lexi (тест 226/263 це покриває; перевірити один раз вручну)
- [ ] Логи Cloudflare Worker: немає сплеску 502/504; `AI_USAGE` — токени в межах очікуваного (+20–60 на відповідь)
- [ ] Звіти `/errors`: немає нових помилок JS
- [ ] TWA (Google Play): відкривається, оновлення підхоплюється (Play-публікація не потрібна — TWA показує сайт)

## 5. Відкат

- Сайт: revert merge-коміту PR #65 у `main` → новий реліз з `CACHE_NAME` **265** (не повертати 263: пристрої з 264 не оновляться назад на ту саму назву кешу).
- Worker: `wrangler rollback` до попередньої версії в Cloudflare (або revert `tools/ai-worker.js`). Застосунок 264 зі старим Worker працює (запасна логіка без `reply_type`).
- Аварійно лише AI: змінна `AI_OFF=1` у Cloudflare.

## 6. Наступні PR (після 264)

1. #67 — сторінка відгуків (`noindex`, чесний текст). Незалежна, лише сайт.
2. #66 — атомарна оболонка Service Worker. Після злиття #65 змінити базу на `main`; разом із ним підняти реліз до **265**.
3. #62 — SEO-метадані: rebase на `main`, потім злиття.
4. #45, #46 — CSP для App Check: перевірити актуальність, один закрити.
