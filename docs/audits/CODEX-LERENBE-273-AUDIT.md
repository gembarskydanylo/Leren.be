# CODEX — незалежний технічний аудит LerenBe 273

Дата: **2026-11-26, Europe/Brussels**. Репозиторій: `gembarskydanylo/Leren.be`.
Об’єкт: [PR #68](https://github.com/gembarskydanylo/Leren.be/pull/68), точний HEAD `d9be50938197f12e78a3abc28fad310314b0dc4d`.
База / release 264: `1312d866fdc28c22302ca977c2845f79ef128d1f` (такий самий GitHub main на момент завершення перевірки).
Ізольована гілка: `codex/lerenbe-273-independent-audit`. Застосунок, існуючі тести, бюджети, Worker, Firebase та чотири PR не змінювались.

## 1. Executive Summary

**Вердикт: NO-GO для production-релізу цього коміту.** Зелені штатні тести відтворено, але незалежна перевірка підтвердила два P1:

1. Друга відкрита вкладка перезаписує список завершених уроків застарілим станом; earned XP можуть залишитись, а уроки — зникнути.
2. Service Worker активує новий кеш без обов’язкового JS-модуля, видаляє попередній кеш, і після offline reload навчальний маршрут не працює.

Обидва механізми успадковані з 264; це не доказ, що їх запровадив TEST-050. Вони, однак, залишаються реальними release-blockers для кандидата 273. P0 не підтверджено.

Додатково: новий щоденний план відкидається після розширення понад 12 кроків; 70% «знайомої» лексики насправді рахується з усіх завершених уроків, навіть із результатом 0/5; нові UI збереження не повідомляють про відмову localStorage. Недолік обліку SKIP у v3 runner описано окремо.

Незалежно виконано: **89/89 основних**, **41 PASS v3** (default: 1 opt-in SKIP і 13 NOT RUN), потім opt-in матриця **312 станів — PASS**; разом **42 унікальні виконувані v3-файли PASS**, 13 NOT RUN. Міграція **264→273: 8/8 профілів PASS** (входить в основні 89, не додається до них повторно). Нові незалежні перевірки інваріантів: **0 PASS / 3 FAIL**, що підтверджують два P1 та ліміт плану; тести не послаблювались.

Докази з синтетичними даними — [lerenbe-273-evidence](lerenbe-273-evidence/). Всі браузерні перевірки — Chromium на localhost, без реальних акаунтів і платних AI-запитів.

## 2. Архітектура

### Структура і залежності

- `index.html` підключає класичні глобальні скрипти у визначеному порядку: SRS → merge/insights/course registry → route core → дані EN/FR і player → віджети/UI → application host. `index.html:1399` і далі. Це не ізольовані ES-модулі: відсутність одного глобального dependency ламає наступний скрипт.
- `app.js`: **6489 рядків / 795153 байти**. Тут одночасно legacy уроки/ігри, XP, settings, account/sync, UI bridge, навігація, онбординг і реєстрація SW. Залежності route UI передає `initLearningPath()` (`app.js:6126`).
- `modules/learning-path/core.js` — catalog, stable lesson IDs, три фази, mistakes, sessions, parked course sessions, completed results. `ui.js` — route/map, Focus, Today orchestration, warm-up і offline conversations.
- `modules/guided/core.js` — profile і daily plan, не володіє XP; `modules/today/ui.js` — DOM Today/onboarding/profile/result; `modules/focus-lesson/ui.js` — Focus/history/keyboard.
- EN/FR використовують окремий `modules/course-player/ui.js`, але спільний route core і rewards bridge. Suffixed storage keys (`@en`, `@fr`) зберігають ізоляцію прогресу; XP/minutes/streak є спільними.
- `modules/lexi/engine.js` обмежує контекст, deadline/errors і request shape; `chat.js` рендерить відповіді; `lesson-help.js` читає поточне завдання через DOM adapter і відкриває Lexi. Offline conversation — окремий локальний сценарний engine, не платний AI.

### Дублювання, застарілі шляхи, регресії

- У `learning-path/ui.js` співіснують Today (`96–151`) і стара велика головна (`168–222`); паралельно лишаються legacy tour/first-run у `app.js` та новий 5-кроковий Today onboarding. Це підтримувані fallback/compatibility paths, не доведено, що їх можна безпечно видалити.
- NL route і EN/FR player окремо реалізують lesson render/feedback/results. Focus/history і keyboard behavior розходяться між ними; потрібні contract tests, а не механічне об’єднання.
- `lesson-help.js:29` залежить від CSS selectors у rendered exercise. Зміна структури Focus без оновлення adapter може змінити зміст допомоги.
- Core storage validation і daily-plan validation не мають спільного контракту з writers: writer `extend()` уже породжує стан, який reader не приймає (P2-01).
- У `modules/courses/registry.js:11` коментар каже, що production лишає EN/FR planned, але код у рядках 17–18 робить їх live. Фактична поведінка — курси пропонуються з beta-позначками, перевірено тестами; коментар застарілий.

### Navigation / recovery

Focus додає history entry `{fl:1}` і обробляє browser Back як вихід до Today зі збереженням session. Окремий Lexi history layer піднімається над ним. Пройдено Back/✕/reload та lesson-help тести. Нативні Android predictive Back, IME і TalkBack у цьому аудиті не перевірялись.

## 3. Знайдені проблеми P0 / P1 / P2 / P3

### P1-01 — застаріла вкладка стирає завершені уроки

- **Файл / рядки:** `modules/learning-path/core.js:33` (одноразове читання), `:57` (запис всього state), `:70` (begin → save); `app.js:1314` аналогічно зберігає in-memory word store, але його втрату окремо не доводили.
- **Походження:** core byte-identical до 264.
- **Як відтворити:** відкрити дві вкладки одного origin до завершення уроку; в A пройти перший урок; у B натиснути початок заняття; перезавантажити A. У Chromium A записала `completed={"comm:phrases:0":5}` та 25 XP; після `learningPath.start()` у B збережено `completed={}`, а `poly_score` лишився `25`.
- **Наслідки:** реальна втрата локальної історії уроків і неконсистентність XP/route; за відсутності окремої cloud-копії відновлення не гарантоване. Cloud union може повернути урок, якщо він уже потрапив у хмару, але не запобігає локальній втраті до sync.
- **Рекомендація:** узгоджувати останній persisted state перед записом; об’єднувати completed records монотонно; визначити ownership session і координацію вкладок через storage events/BroadcastChannel/lock або transaction. Просто слухати event без atomic read/merge/write недостатньо. Додати 2-tab completion/resume regression.
- **Доказ:** `browser-probes.json → staleTabs`, незалежний FAIL №1; browser-відтворення присутнє в `tests/diagnostics/lerenbe273-browser.cjs`.

### P1-02 — частково встановлений Service Worker позбавляє offline навчання

- **Файл / рядки:** `sw.js:44` (7 critical URLs), `:46` (решта optional), `:49` (`Promise.allSettled` ігнорує відмови), `:51` (`skipWaiting`), `:58` (старі cache names видаляються). Обов’язковий dependency: `index.html:1404`, використання — `app.js:6128`.
- **Походження:** модель 7 critical files успадкована; 273 додає ще dependencies, залишаючи модель.
- **Як відтворити:** завантажити сторінку повністю, відкласти SW registration у harness; лише під час SW install повертати HTTP 503 для `/modules/learning-path/core.js?v=210`; дочекатись activation; вимкнути мережу і перезавантажити.
- **Фактичний результат:** кеш `leren-be-v273` існує без core; попередній `leren-be-v264` видалений; `LerenLearningPath` відсутній, route model не створений, Today start buttons = 0; помилки `Cannot set properties of undefined (setting 'mount')`, `LerenLearningPath is not defined`.
- **Уточнення експерименту:** у цьому targeted harness попередній кеш 264 був синтетичним marker-кешем, а не повним старим app install. Відмову bootstrap 273 та policy видалення кешу перевірено реально; штатний повний upgrade 264→273 окремо пройшов 8 профілів.
- **Наслідки:** користувач може мати свої дані, але не мати працездатного offline application shell після формально успішного update. `healCache()` (`sw.js:87`) допомагає тільки коли потрібний ресурс знову доступний онлайн.
- **Рекомендація:** атомарно кешувати повний runtime shell, включно з усіма required script/style dependencies; медіа лишити optional; не видаляти останній придатний cache до підтвердження нового shell. Перевіряти адресну 503 для кожного dependency, а не лише розрив мережі після N довільних запитів. Ідея #66 доречна, але його старий список URL зливати не можна.
- **Доказ:** `sw-probe.json`, `partial-shell-offline.png`, незалежний FAIL №2. `tests/sw-install.cjs:5` перевіряє той самий вузький 7-file список, тому зелений тест дефект не спростовує.

### P2-01 — «Продовжити навчання» створює daily plan, який губиться після reload

- **Файл / рядки:** `modules/guided/core.js:65` відкидає >12 steps; `:75` extend не має ліміту; `modules/learning-path/ui.js:113` повторно розширює план.
- **Походження:** новий код TEST-050.
- **Як відтворити:** goal 30 / intensive / practice enabled дає 5 steps; завершити заняття, двічі обрати ще одне. Writer зберігає 15 steps. `G.today(storage, now)` повертає null після повторного читання. Навіть без practice повторні розширення зрештою перевищують 12.
- **Наслідки:** губляться план/paid step markers і підсумок дня, після reload пропонується новий план. Це не доведена втрата XP: rewards ledger і best-results живуть окремо.
- **Рекомендація:** один контракт максимальної довжини для writer/reader або новий round замість нескінченного накопичення steps; тест кількох продовжень + reload.
- **Доказ:** незалежний FAIL №3 у `independent-invariants.log`.

### P2-02 — 70% «знайомої лексики» не перевіряє знання

- **Файл / рядки:** `modules/learning-path/ui.js:21–25`, особливо `:24`; `modules/learning-path/core.js:92` записує completed і для 0 правильних.
- **Походження:** новий gate TEST-050.
- **Як відтворити:** у локальному профілі завершити перші три comm-уроки з 0 правильних на фінальній перевірці. `talkCoverage('comm:phrases:15')` → **0.8**, `talkReady()` → **true**, хоча всі три `completed` values — 0.
- **Причина:** `Object.keys(completed)` без урахування score/per-word mastery; додатково весь перевірюваний lesson ID додається до known навіть до його проходження.
- **Наслідки:** чисельний threshold 0.7 дотриманий, але він вимірює охоплення матеріалу, а не знайомість/засвоєння; розмова може бути зарано складною. Не слід називати це перевіреною мовною готовністю.
- **Рекомендація:** домовитись про визначення known, врахувати per-card progress/підтверджені правильні відповіді; не додавати майбутній урок автоматично. Додати негативні cases 0/5, forgotten words, failed check. Якщо intended semantics — «бачив матеріал», прямо перейменувати метрику й пояснення.
- **Доказ:** `coverage.json` і coverage record у portable browser reproducer. Існуючий `tests/test050-rc-browser.cjs:128` засіває тільки perfect scores, тому цей негативний випадок не перевіряє.

### P2-03 — нове збереження тихо ігнорує відмову localStorage

- **Файл / рядки:** `modules/guided/core.js:17`, `:73`, `:79`, `:83`; `modules/today/ui.js:270`; `app.js:3953`.
- **Походження:** нові Today/Profile flows.
- **Як відтворити:** передати в guided core storage adapter, де `setItem` кидає `QuotaExceededError`; `start()` повертає нормальний state, але `today()` не знаходить його. У Profile `onSave` не перевіряє `setName/saveProfile` return values, а UI все одно встановлює «Збережено».
- **Наслідки:** втрачений після reload план/профіль і хибне підтвердження збереження. Core уроків має persistent flag, але Focus приховує звичайний `.lp-caption` (`modules/focus-lesson/style.css:4`), тому старого попередження недостатньо.
- **Рекомендація:** повертати й перевіряти persistence outcome; показувати видиму помилку і режим «лише ця сесія», не «Збережено»; зберігати in-memory state для подальших кроків при відмові storage. Додати quota/blocked storage UI case.
- **Доказ:** окремий VM probe з adapter, що кидає помилку; висновок про Profile — прямий контроль потоку коду, без симуляції реального quota пристрою.

### P3-01 — runner може назвати частково пропущений browser test PASS

- **Файл / рядок:** `tests/v3/run.cjs:43`.
- **Як відтворити:** тест завершується кодом 0 і друкує `PASS: static ...` та `SKIP: browser ...`; поточна умова маркує його PASS, бо у stdout є хоча б один PASS.
- **Наслідки:** сам підсумковий лічильник не доводить, що всі browser checks відбулись. У цьому аудиті логи читалися повністю; такого прихованого browser SKIP не знайдено, окрім явно opt-in матриці, яку потім виконано.
- **Рекомендація:** окремо рахувати partial skips / structured outcomes і вимагати browser prerequisites у CI. Не перетворювати пропуск на зелену перевірку.

## 4. Ризики втрати даних

| Дані | Що перевірено | Результат / ризик |
|---|---|---|
| XP | keyed grants, best results, reload/repeat, multi-device merge, upgrade | штатні tests PASS; повторна та сама оцінка не додає XP; загальна гарантія «exactly once» за всіх races не доведена |
| Завершені уроки | 8 upgrade profiles; дві вкладки | normal upgrade PASS, але P1-01 реально стирає completed |
| Незавершені уроки | phase/index/ids/answers validation, paused/parked sessions, Back/reload | compatible 264 session збережена; incompatible session відкидається, completed лишаються |
| Mistakes / review | warm-up, no XP on review, corrected mistakes merge | штатні tests PASS; route save має той самий stale-tab risk |
| Voice | per-device keys, старий teacher→voice fallback, reload | PASS; зокрема Dafna→female migration, обрана voice не підміняється |
| UI/target language | укр/en/fr/ar, EN/FR player + suffixed state | PASS, NL completed не змішується з EN/FR |
| Daily plan / profile | extend reload, write failure | P2-01 і P2-03; план окремий від earned XP |
| Cloud sync | per-key merge, Firestore update-time precondition, retry/error, applyAll rollback | код і mocked tests PASS; live backend/rules/enforcement не перевірялись |

`SYNC_SKIP` (`app.js:5934`) виключає learner name, today plan, AI memory і device identifiers; `leren_voice_*` теж не синхронізуються. Sync зберігає локальну paused session і об’єднує completed max-per-lesson (`modules/sync/merge.js:91–100`). `app.js:6046` створює local backup до застосування merged copy, `:6049` використовує all-or-rollback apply; це не захищає від повного local save застарілою другою вкладкою.

Не доведено, що «усі дані захищені»: private browsing, user-cleared storage, browser eviction, реальні конфлікти декількох пристроїв і backend outage не відтворювались на production.

## 5. Безпека

- **XSS/DOM injection:** нові Today/Focus тексти через `textContent`; name очищається від control/bidi/markup, обмежується і відображається з ізоляцією напрямку. Lexi chat використовує `innerHTML`, але user/model strings проходять escape (`modules/lexi/chat.js:3`, `:30`, `:66`); глобально забороняти innerHTML без аналізу тут некоректно. Підтвердженого executable XSS у перевірених flows не знайдено; це не формальний доказ відсутності XSS у всьому репозиторії.
- **CSP:** `index.html:5` обмежує scripts до self і визначених Google/Cloudflare origins, без script unsafe-inline/eval; object-src none, base-uri/form-action self. Style unsafe-inline дозволений. Захист від framing — JS у `boot.js:2`, не серверний frame-ancestors. HTTP headers live-site не перевірялись.
- **AI:** client whitelists/clips context (`engine.js:79–100`), відповіді не виконуються як код; stale results/request failures/retry/deadlines покриті тестами. Prompt injection не можна виключити тільки текстом prompt; output не має authority змінювати route/XP.
- **App Check:** `app.js:5903` — best effort: після timeout/помилки запит іде без токена. Код не доводить, що Firebase Enforce увімкнено. `tools/ai-worker.js` не перевіряє App Check; Origin allowlist — CORS/браузерне обмеження, не автентифікація небраузерного клієнта. Не позначаю live-enforcement «працює», бо його не перевіряли.
- **Worker rate limiting:** у checked-in config є PER_IP/IP_CEIL/ALL; limiter exceptions fail closed, але **відсутній binding пропускається** (`tools/ai-worker.js:344`), попри сильніший коментар вище. Daily KV неатомарний і best effort (`:293–299`); per-location limits не дорівнюють глобальній щоденній фінансовій квоті. Перед релізом власник має підтвердити deployed bindings і cost ceiling; не змінювали конфігурацію/сервіси.
- **Firestore:** checked-in `firestore.rules` обмежує user documents власним uid і blob size; це не перевірка deployed rules. Auth REST writes мають updateTime precondition (`app.js:5995`).
- **Секрети:** скан code/config файлів на private-key blocks, AWS access IDs, GitHub tokens, Anthropic/OpenAI secret patterns — збігів не знайдено. Public Firebase API key і reCAPTCHA site key не є серверними секретами. Скан не охоплює віддалені secrets, logs і всю історію Git.
- `tools/ai-worker.js`, `wrangler.toml`, `firestore.rules` byte-identical базі 264. Запущено mocked proposed-Worker compatibility **10/10**, security checks і основні worker tests. Жодного платного AI-запиту / читання реальних learner records.

## 6. Мобільний UX

Штатний `test050-focus-browser` виконав по **27 lesson screens** на 320×640, 360×780, 390×844, 412×915: study/listen/check/correct/wrong/phase transition, main action видима; hidden header/dock, no mid-lesson LIFE interruption. Keyboard case — зменшення viewport, а не справжня Android IME. Landscape 844×390 PASS; dark text contrast 12.7:1 / outline 4.2:1; font 125% PASS.

Додаткова незалежна матриця: задані чотири розміри + 780×360 landscape, 320×640 Arabic/dark/font150%, 360×780 font200%. Немає sideways scroll / JS errors; exit = 44×44; main action у viewport; browser Back → Today і session збережена. Шрифт збільшувався CSS-ін’єкцією лише в browser harness, не в репозиторії — це наближення системного масштабування.

Окремо `FULL_MATRIX=1`: **312 view states PASS** (6 sizes × 4 UI languages × 2 themes × 6 views + 150% text cases). Мінімальна перевірка цієї broad матриці — targets ≥24 px, тому вона не доводить універсальні 44×44; Focus перевірявся сильніше.

Візуально переглянуто незалежний знімок 320×640: Focus task, звук, Lexi help та fixed primary action доступні. Артефакти `mobile-320x640-uk-1.png`, `mobile-412x915-ar-1.png`.

**Не перевірено фізично:** Samsung/PWA, soft keyboard, Android system font, TalkBack, pinch zoom, predictive Back, platform voice availability та реальний App Check/reCAPTCHA challenge. Потрібний human device sign-off.

## 7. Продуктивність

Детерміновані вимірювання Node 24 / gzip level 9 (той самий метод, що budget test):

| Метрика | 273 | Незмінений бюджет |
|---|---:|---:|
| Blocking JS | 676.19 KiB gzip / 47 scripts | разом з CSS/HTML ≤760 KiB; scripts ≤50 |
| Stylesheets | 44.91 KiB gzip / 18 files | ≤45 KiB |
| HTML | 29.26 KiB gzip | ≤30 KiB |
| Разом blocking | **750.36 KiB gzip** | **760 KiB** |
| SW precache manifest | **1085 унікальних URL, ≈17.08 MiB** файлів на диску | окремий встановлений бюджет не знайдено |

Budget test PASS, бюджети не збільшувались. CSS headroom ≈0.09 KiB gzip: навіть дрібні стилі слід перевіряти без підвищення порога.

`app.js` ≈795 KB raw і `course-curriculum.js` ≈119 KiB gzip — головні блокуючі витрати. Багато legacy assets і старої UI логіки лишається на стартовому шляху. Focus CSS завантажується динамічно, і в render-blocking metric не входить; це не нульова мережна вартість.

SW: cache-first static URLs, network-first navigation, sw.js/no-store обходять cache, manifests SWR, при поверненні до вкладки й кожні 30 хв є reg.update. Нормальне оновлення/очищення старих release caches пройшло; підтверджений ризик — P1-02, а не доведене «нескінченне кешування 264». healCache не виправляє missing dependency офлайн.

Холодний старт до видимої Today CTA (390×844, новий browser context, no SW, локальний server без HTTP compression і cache): **381 мс** unthrottled; **15731 мс** з CDP-емуляцією 1.6 Mbit/s, 150 ms latency, CPU×4. Завершені network transfers до цього моменту ≈3.15 / 2.86 MB. Це по одному синтетичному вимірюванню на режим; відсутність compression збільшує час порівняно з gzip production, а прогрів/обладнання теж впливають. Дані — `startup.json`. Production Lighthouse/CrUX/LCP не вимірювали; ці числа не є production benchmark. Зелений static budget не є гарантією швидкого старту на слабкому телефоні. Existing v3 lifecycle test: 40 cycles, без росту detached nodes, intervals 4→4, documents 15→15 (локальний mocked scenario, не довготривалий real-device soak).

## 8. Результати тестів

Середовище: macOS, Node **v24.22.1**, Playwright з наявного локального cache; Chromium запущений поза sandbox, бо sandbox спочатку блокував MachPort registration. Нічого не інсталювали й application source не патчили. `PREV` явно закріплено на release 264, а не на рухомому main.

| Набір | Незалежний результат | Порівняння з попереднім звітом |
|---|---|---|
| `tests/*.cjs`, послідовно | **89 PASS / 0 FAIL / 0 SKIP** | збігається з 89/89 |
| `tests/v3/run.cjs`, default | **41 PASS / 0 FAIL / 1 SKIP / 13 NOT RUN** | 41/41 підтверджено, але пропуски потрібно показувати |
| `FULL_MATRIX=1 ... run.cjs mobile-matrix-264` | **1 PASS**, 312 станів | opt-in SKIP усунуто окремим запуском; сукупно 42 runnable v3 tests |
| `tests/upgrade-3-0.cjs` | **8 профілів PASS**, real SW 264→273 | збігається з 8/8; включено в 89 |
| `tests/upgrade-interrupted.cjs` | PASS | довільні network-cut cases; не покриває targeted P1-02 |
| `tests/v3/proposed-worker.cjs` | **10 PASS / 0 FAIL**, mock requests | повторно підтверджено |
| `tests/v3/worker-security.cjs` | PASS | mocked, backend не змінений |
| **Нові** `tests/diagnostics/lerenbe273-audit.cjs` | **0 PASS / 3 FAIL**, exit 1 | два P1 і P2-01; навмисно показані окремо від штатних зелених наборів |
| **Новий** browser reproducer | два P1 + 80% coverage на 0/5 відтворені; 7 mobile scenarios | exit 0 означає «відтворення виконано», не release PASS |

13 NOT RUN — конкретні tests для Leren.be-test-only setup/prototypes, перелічені у `tests/v3/run.cjs:14–26`; це не PASS і не newly skipped regression. Зокрема App Check prototype test не є доказом production enforcement.

Commands:

```sh
# В ізольованій копії PR #68; NODE_PATH має вказувати на наявний Playwright.
for t in tests/*.cjs; do PREV=1312d866fdc28c22302ca977c2845f79ef128d1f node "$t"; done
V3_VERBOSE=all node tests/v3/run.cjs
FULL_MATRIX=1 V3_VERBOSE=all node tests/v3/run.cjs mobile-matrix-264
node tests/v3/proposed-worker.cjs
node tests/v3/worker-security.cjs
node tests/diagnostics/lerenbe273-audit.cjs # на audited HEAD: exit 1, три підтверджені дефекти
AUDIT_OUT=/tmp/lerenbe273-browser-audit node tests/diagnostics/lerenbe273-browser.cjs
```

Додатково виміряно cold startup у двох локальних мережних режимах (див. розділ 7). Повторний запуск усіх штатних тестів після документування не потрібен: runtime/існуючі tests не змінені. Діагностичний browser reproducer після перенесення в `tests/diagnostics` перевірено окремо. Початковий targeted SW harness чекав registration на 127.0.0.1, хоча app реєструє SW лише на https/localhost; отримано timeout, harness виправлено на localhost. Початковий coverage harness помилково чекав `.model` на `window.learningPath` (це DOM id, тоді як model у lexical variable); виправлено очікування. Це помилки harness, не application findings і не «пройдені» тести.

## 9. Конфлікти PR

Перевірено GitHub state, changed files, Actions logs і `git merge-tree --write-tree` у приватній копії. Реальних merge, checkout змін у цих PR чи push до них не робили.

| PR / audited HEAD | Поточний стан | Фактична сумісність із #68 |
|---|---|---|
| #69 `679506e` | OPEN, CI FAILURE | **Чистий текстовий merge-tree**, конфліктів немає. Failure в upgrade test: обидві сторони SEO-only 264 мають `leren-be-v264`, але тест вимагає різні кеші. Це причина CI, не доказ поломки SEO. Після інтеграції з 273 необхідно rerun, а не ігнорувати червону перевірку. SEO runtime/HTML assets у тому самому кеші 273 можуть лишитись старими офлайн — потрібна явна release/version policy. |
| #66 `785b589` | OPEN | **Конфлікти `sw.js` і `tests/sw-install.cjs` підтверджені merge-tree**. Його APP_SHELL має app.js?v=264, старі registry/review URLs. Не cherry-pick/не зливати як є; перенести atomic-shell ідею на фактичний dependency list 273 в окремій дозволеній правці. |
| #62 `cf81c4f` | **CLOSED**, застарілий | Якби відновити: **конфлікт `index.html`**. SEO-план перекривається #69; не відновлювати й не застосовувати паралельно, інакше дублювання links/meta та можливе повернення старого H1. |

Текстово чистий merge #69 не перевіряє semantics чи сумісність тестів. Після будь-якої future integration потрібні SEO + route/mobile + SW tests на новому HEAD. Поточні PR не змінювались.

Actions #68: [run 45573824779](https://github.com/gembarskydanylo/Leren.be/actions/runs/45573824779), SUCCESS, head `d9be509`; фактично виконує production, v3 і mocked proposed-Worker checks. #69: [run 45573718365](https://github.com/gembarskydanylo/Leren.be/actions/runs/45573718365), FAILURE, upgrade assertion `actual === expected === leren-be-v264`.

## 10. Рекомендації перед релізом

1. **Виправити P1-01 і P1-02 окремими дозволеними змінами.** Прийняття: два незалежні P1 invariants стають зеленими, 2-tab browser completed/resume test не губить дані; кожен required shell dependency при 503 не активує неповний update і лишає старий offline runtime доступним.
2. Узгодити daily-plan writer/reader, persistence failure UI та визначення «знайомої» лексики; negative tests для >12 кроків, 0/5, quota. Не покладатися на perfect-score fixtures.
3. Після fixes повторити 89 main + v3 з FULL_MATRIX + 8-profile upgrade + targeted fault cases на новому pinned SHA. Зберегти budgets 760/45/50/30.
4. Фізичний Samsung sign-off: upgrade без очищення storage, незавершений урок, клавіатура/Back/large font/TalkBack, dark/RTL; local emulation цього не замінює.
5. Власнику підтвердити deployed Firebase rules/App Check enforcement і Worker limiter bindings/cost caps; цей read-only аудит не перевіряв production-консоль і не виконував paid calls.
6. #69 інтегрувати з release-aware CI/кешуванням після функціональних fixes; #66 — лише актуалізована atomic-shell ідея; #62 залишити закритим. Не об’єднувати чотири PR одним нерозбірливим конфліктним merge.

## 11. Вердикт GO / CONDITIONAL GO / NO-GO

**NO-GO для production на `d9be509`.** Причина — два відтворені P1, а не колір Actions чи стилістичні зауваження. Можливий повторний release review після окремого дозволу на виправлення і зелених негативних regression tests. Наявні 89/41/8 підтверджують значну позитивну поведінку, але не покривають виявлені відмови.

### Що зроблено сьогодні, 26 листопада 2026

- Закріплено #68 і main на точних SHA; створено незалежну гілку в приватній копії. Початкову робочу папку з уже наявними численними видаленнями не змінювали.
- Прочитано фактичні runtime modules, storage/sync, SW, CSP, Worker/config/rules; перевірено зміни тестів і Actions.
- Послідовно виконано 89 main tests, v3/default, opt-in 312-state mobile matrix, 8-profile migration і mocked Worker checks.
- Розроблено й запущено незалежні діагностики: два P1, plan-length FAIL, threshold false-positive, local-storage failure probe, додаткова mobile/RTL/Back/font матриця; виміряно cold startup у звичайному режимі й з емуляцією повільної мережі/CPU.
- Створено цей звіт, синтетичні JSON/log/screenshot докази і два окремі diagnostic scripts. Runtime-код і штатні tests не виправлялись.
- Перевірено конфлікти #69/#66/#62 без реального merge. Жодних production deploy, змін Worker/Firebase, paid AI calls або реальних learner data.
