# Leren.be — де що лежить і за що відповідає

Короткий довідник по всіх онлайн-сервісах проєкту. Ключів і паролів тут немає — лише де вони зберігаються.
Перелік файлів на комп'ютері — у локальному `LOCAL-FILES.md` (не публікується на GitHub).

## Як усе пов'язано

```
Користувач (браузер / застосунок з Google Play)
   │
   ├─► lerenbe.com ──────────────► GitHub Pages (репозиторій gembarskydanylo/Leren.be, гілка main)
   │                               index.html, sw.js, audio/, dict/, privacy.html …
   │
   ├─► AI-чат ───────────────────► Cloudflare Worker "leren-ai" ──► Anthropic (Claude Haiku 5.5)
   │                               (код: tools/ai-worker.js, ключ — секрет у Cloudflare)
   │
   ├─► Акаунт (необов'язково) ───► Firebase Authentication (Google / e-mail)
   │   і синхронізація ──────────► Firestore: users/{uid}
   │
   └─► Нагадування ──────────────► Firestore: subs/{id} ◄── GitHub Actions щогодини (tools/send-reminders.mjs)
```

## Сервіси

| Сервіс | Акаунт | Що там лежить | За що відповідає | Вартість |
|---|---|---|---|---|
| **GitHub** — репозиторій `gembarskydanylo/Leren.be` | GitHub gembarskydanylo | Увесь код і дані застосунку (гілка `main`) | Джерело правди для сайту; історія змін | Безкоштовно |
| **GitHub Pages** | той самий | Зібраний сайт з гілки `main` | Хостинг **lerenbe.com** (файл `CNAME`) | Безкоштовно |
| **GitHub Actions** | той самий | `reminders.yml` (секрети `FIREBASE_SA`, `VAPID_PUBLIC`, `VAPID_PRIVATE`), `deploy-worker.yml` (секрет `CLOUDFLARE_API_TOKEN`) | Щогодини надсилає push-нагадування; деплоїть сервер AI в Cloudflare; збирає Pages | Безкоштовно |
| **Cloudflare** — DNS | gembarsky.d@gmail.com | DNS-записи **lerenbe.com** → GitHub Pages (копія: `lerenbe.com.txt`) | Домен веде на сайт | Безкоштовно |
| **Cloudflare Workers** — `leren-ai` | той самий | Код = `tools/ai-worker.js`; секрет `ANTHROPIC_KEY`; KV `leren-ai-rate` (binding `RATE`); журнали (скарги `AI_REPORT`, помилки застосунку `APP_ERROR`); ліміт звітів про помилки `ERRS` | Сервер AI-чату: інструкції для Claude, ліміт 60 повідомлень/день з IP, пам'ять, скарги; приймає звіти про помилки з телефонів (`POST /errors`). Адреса: `https://leren-ai.gembarsky-d.workers.dev/` | Безкоштовний тариф |
| **Anthropic Console** — platform.claude.com | особистий акаунт | API-ключ `leren-be-worker`; кредити; місячний ліміт $10; автопоповнення вимкнене | Модель **Claude Haiku 5.5**, що відповідає в чаті | Оплата за використання (~$0.0003–0.0005 за повідомлення) |
| **Firebase** — проєкт `leren-be` (тариф Spark) | gembarsky.d@gmail.com | Authentication (Google, Email link; домени lerenbe.com, www.lerenbe.com); Firestore `subs`, `users`; правила = `firestore.rules` | Акаунти, синхронізація прогресу й пам'яті AI, підписки на нагадування | Безкоштовно (Spark) |
| **Google Play Console** | розробника | Застосунок **be.leren.app** (TWA-обгортка сайту); App signing | Публікація в Google Play; сторінка й форми — `store/store-listing.md` | Разовий внесок розробника |
| **Digital Asset Links** | — | `.well-known/assetlinks.json` на lerenbe.com | Дозволяє застосунку з Play відкривати сайт без адресного рядка | — |
| **Microsoft Azure** — ресурс Speech `leren-be-speech` | особистий акаунт | Група ресурсів `leren-be`, регіон North Europe, тариф Free F0; KEY 1 | Лише для запису озвучення голосом **Arnaud** (`tools/run-azure.sh`); сайт до Azure не звертається | Безкоштовно (F0) |
| **gstatic.com** (Google) | — | Firebase JS SDK 10.12.2 | Завантажується лише при вході в акаунт | — |
| **Perplexity** (лише для розробки) | — | `.mcp.json`, ключ у змінній `PERPLEXITY_API_KEY` | Пошук для AI-помічника під час розробки; на сайт не впливає | — |

## Секрети: де зберігаються

| Секрет | Де живе | Як оновити |
|---|---|---|
| `ANTHROPIC_KEY` | Cloudflare → leren-ai → Settings → Variables and Secrets (тип **Secret**) | Новий ключ в Anthropic Console → замінити Secret → Deploy |
| `CLOUDFLARE_API_TOKEN` | GitHub → Settings → Secrets and variables → Actions | Cloudflare → My Profile → API Tokens → шаблон «Edit Cloudflare Workers» |
| `FIREBASE_SA` (service account JSON) | GitHub → Settings → Secrets and variables → Actions | Firebase → Project settings → Service accounts → Generate new key |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | GitHub Actions secrets (публічний також у `index.html`) | Нову пару генерувати лише разом зі скиданням усіх підписок |
| Ключ Azure Speech | Azure → leren-be-speech → Keys and Endpoint (вводиться в Термінал або зберігається як мережевий секрет хмарного середовища Claude для `northeurope.tts.speech.microsoft.com`) | Regenerate Key1 (і оновити секрет у середовищі) |
| Ключ підпису Android | Google Play App Signing + локальний keystore (див. `LOCAL-FILES.md`) | Втрата upload-ключа → запит на скидання в Play Console |

## Як оновлювати

| Що змінилося | Що зробити |
|---|---|
| Сайт (`index.html`, `privacy.html`, аудіо, словник) | Коміт у `main` → push; **підняти `CACHE_NAME` у `sw.js`**; GitHub Pages збирає 1–5 хв |
| Сервер AI (`tools/ai-worker.js`, `wrangler.toml`) | **Автоматично:** push у `main` → GitHub Actions «Deploy AI worker» (`.github/workflows/deploy-worker.yml`) → Cloudflare. Піднімай `WORKER_VERSION` у коді: після деплою вона видна в заголовку `X-Leren-AI`. Запасний ручний шлях — у `LAUNCH.md` |
| Правила Firestore (`firestore.rules`) | Firebase → Firestore Database → Rules → вставити → Publish |
| Озвучення | `bash tools/run-azure.sh` (Arnaud) → коміт `audio/nl` → підняти кеш |
| Сторінка в Google Play | Тексти й відповіді — `store/store-listing.md`; графіка — `store/`, `screenshots/` |

Детальніше: запуск і план відкату AI — `LAUNCH.md`; дизайн — `DESIGN.md`; рівні — `LEVELS.md`; загальний опис — `README.md`.

## Звіти про помилки з телефонів (з v180)

Застосунок і service worker надсилають технічні помилки (необроблені помилки, відхилені проміси, порушення CSP) на `https://leren-ai.gembarsky-d.workers.dev/errors`. Лише на lerenbe.com, не більше 5 різних за сторінку, без особистих даних (текст помилки, файл:рядок, версія, мова інтерфейсу, браузер). На сервері окремий ліміт `ERRS` — 20 звітів за хвилину з однієї мережі; ліміти AI не зачіпаються.

**Де читати:** Cloudflare → Workers & Pages → `leren-ai` → **Logs** → пошук `APP_ERROR`. Журнали зберігаються кілька днів.

## Заголовки безпеки (Cloudflare, з 03.11.2026)

Записи A, AAAA і `www` для lerenbe.com проксійовані (помаранчева хмарка), SSL/TLS = **Full**. Правило **Rules → Transform Rules → «Security headers»** (усі запити) ставить: `Strict-Transport-Security: max-age=86400` (підняти до `31536000` після тижня без проблем, без `preload`/`includeSubDomains`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: geolocation=(), payment=(), usb=()` і `Content-Security-Policy` (список дозволених адрес — у самому правилі; нова зовнішня адреса в коді = додати її туди). Відкат: вимкнути правило. Оцінка securityheaders.com — A.

**Перевірка правила (5.11.2026).** У правилі `frame-src` не було `'self'`, тому браузер блокував наш власний годинник (`modules/clock/widget.html` у `<iframe>`) — і на головній, і в уроці: сірий порожній блок. Виправлено: значення CSP у правилі тепер рівно рядок `CSP` з `tests/csp-browser.cjs`. Звірити після кожної зміни правила: `curl -sI https://lerenbe.com/ | grep -i content-security-policy` має збігатися з тим рядком.

**Без вбудованого коду (з v181).** Основний скрипт — `app.js`, звіти про помилки — `boot.js` (обидва з `?v=N` у `index.html` і в `sw.js`; змінив файл — підняти `N`). У HTML немає `<script>` без `src` (крім JSON-LD) і жодних `onclick="…"`; це перевіряє `tests/seo.cjs`, а `tests/csp-browser.cjs` проходить 27 екранів під CSP без `'unsafe-inline'` для скриптів. Тому в `script-src` правила Cloudflare `'unsafe-inline'` не потрібен (у `style-src` лишається).

**Резервний захист у самих сторінках (листопад 2026).** `index.html`, `privacy.html` і `modules/clock/widget.html` мають у `<meta http-equiv="Content-Security-Policy">` ту саму політику, що й правило Cloudflare (рядок `CSP` у `tests/csp-browser.cjs`; `<meta>` не підтримує `frame-ancestors`, тому замість нього — `form-action 'self'`). Якщо правило Cloudflare вимкнуть, CSP усе одно діє. Нова зовнішня адреса в коді = додати її в **три** місця: правило Cloudflare, `tests/csp-browser.cjs` і meta в трьох сторінках (`tests/seo.cjs` перевіряє, що meta = CSP з тесту). Замість `X-Frame-Options` на випадок вимкненого правила `boot.js` не показує застосунок у `<iframe>` чужого сайту — лише посилання «lerenbe.com ↗» на всю вкладку (`tests/frame-guard-browser.cjs`).

**Що лишається зробити вручну (не в коді):**
- ✅ (4.11.2026, $10/міс.) Anthropic Console → Settings → Spend limits: місячний ліміт витрат для ключа `leren-ai` (воркер перевіряє лише заголовок `Origin`, який поза браузером підробляється; від витрат захищають тільки ліміти частоти).
- ✅ (4.11.2026) Cloudflare → `leren-ai` → Settings → Variables and Secrets: окремий секрет `RATE_SALT` для хешування IP і кодів пристроїв.
- ✅ (перевірено 4.11.2026: «HTTP referrers, 4 APIs») Google Cloud Console → Credentials: обмежити Firebase API key за HTTP referrer (`lerenbe.com/*`, `www.lerenbe.com/*`, `leren-be.firebaseapp.com/*`); Firebase → App Check.

## Відгуки учнів (reviews.html, листопад 2026)

- Відвідувач входить анонімно (Firebase) і пише один відгук у `reviews_pending/{uid}`. Публічним (`reviews_public`) відгук стає **лише** після кнопки «Опублікувати» у власника (gembarsky.d@gmail.com, підтверджена пошта). Правила Firestore не дають обійти модерацію.
- **Лайка.** Однакові корені грубих слів (на початку слова, будь-який регістр, кілька рядків) відхиляють і сторінка (`STRONG` у `reviews.js`), і правила (`firestore.rules`). Звичайні слова з таким шматком усередині («рахуй», «люблять», «дебати») проходять. Сумнівні слова (`SOFT`) не блокуються, а підсвічуються червоним під час модерації. Змінюєш список — міняй у двох місцях, `tests/reviews-filter.cjs` перевіряє, що вони однакові й що жоден текст курсу чи словника не блокується. Правила перевірено в емуляторі Firestore.
- Правила розгортає `.github/workflows/deploy-firestore-rules.yml` після злиття в `main` (тільки якщо живі правила збігаються з попередньою версією в репозиторії).

**Що лишається зробити вручну:**
- **Firebase → App Check** (reCAPTCHA Enterprise / Fraud Defense, ключ сайту `6Lct5RYuAAAAABhPFLfNjJzc-QTy4hleZyGPAQHV` — не секретний):
  1. ✅ (8.11.2026) Ключ створено, сайт зареєстровано в App Check (TTL токена 1 год).
  2. ✅ (v209) Код: `appCheckHeaders()` в `app.js` додає `X-Firebase-AppCheck` до всіх запитів у Firestore (REST); `reviews.js` — `initializeAppCheck`. Лише на lerenbe.com; якщо токена немає за 5 с, запит іде без нього (`tests/appcheck-browser.cjs`).
  3. ✅ (8.11.2026) **Cloudflare → Rules → Overview → «Security headers» → Content-Security-Policy:** `https://www.google.com` у `script-src`, `connect-src` і `frame-src`.
     **Ще потрібно (9.11.2026):** додати `https://www.gstatic.com` у `connect-src` заголовка Cloudflare (у meta-CSP сторінок уже є). Firebase завантажує дані з gstatic через fetch, а `script-src` цього не дозволяє. Заголовок і meta діють разом: дозволено лише те, що є в обох. Точний рядок — `const CSP` у `tests/csp-browser.cjs`.
     **403 від App Check** (запит на `…/apps/undefined:exchangeRecaptchaEnterpriseToken`): не було `appId` у конфігурації Firebase — ✅ виправлено в PR #49 (`appId 1:533895640416:web:770d52f1926e13a186da05`), версії файлів підняті у v216, щоб телефони отримали виправлення з кешу.
     **Authentication 0% Verified**: застосунок створює окремі Firebase-апи `push` (нагадування) і `acct` (акаунт), а App Check був увімкнений лише на апі `appcheck`, тож запити входу йшли без токена — ✅ виправлено у v217 (`fbApp()` вмикає App Check на кожному апі). Метрика Firestore показує частку за весь період, тож старі запити до виправлень ще кілька днів тягнуть відсоток Verified донизу.
  4. Через кілька днів після п. 3: Firebase → App Check → **APIs** → Cloud Firestore: якщо в графіку майже всі запити «Verified» — **Enforce**. Раніше не можна: зламаються синхронізація, нагадування й відгуки.
- Окремий службовий акаунт для правил **не потрібен**: `FIREBASE_SA` (firebase-adminsdk) через Admin SDK і так має повний доступ до даних в обхід правил, тож забрати в нього право змінювати правила майже нічого не дає. Важливо лише, що ключ лежить тільки в секретах GitHub.
