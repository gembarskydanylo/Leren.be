# Google Search Console — розбір виключених URL (26.11.2026)

> Дані Search Console від власника (26.11.2026): **4 сторінки проіндексовано, 4 органічні кліки** за показаний період.
> Сайт **є** в Google. Покази, запити й середні позиції тут не розбираються: доступу до Search Console з середовища
> розробки немає, тож цифр не вигадуємо.
>
> Що перевірено (26.11.2026, живий сайт через `curl`, код у гілці на основі PR #69): заголовки й коди відповідей,
> переадресації, `sitemap.xml`, `robots.txt`, canonical, `noindex`, правила Firestore й анонімні запити до Firestore REST.
> Порівняно з `docs/seo/GOOGLE_INDEXING_AUDIT.md` (PR #69) і `docs/seo/SEO-AUDIT-2026-11.md`: їхні виправлення не дублюються.

## Підсумок

| URL зі звіту | Статус у GSC | Що на сайті | Висновок |
|---|---|---|---|
| `http://lerenbe.com/` | Переадресація | `301` → `https://lerenbe.com/` (Cloudflare), одним кроком | **Нешкідливе виключення**, так і має бути |
| `https://www.lerenbe.com/` | Переадресація | `301` → `https://lerenbe.com/` (GitHub Pages), одним кроком | **Нешкідливе виключення** |
| `http://www.lerenbe.com/` | Переадресація | `301` → `https://lerenbe.com/` (GitHub Pages), одним кроком | **Нешкідливе виключення** |
| `https://lerenbe.com/databases/(default)/documents/subs/` | 404 | `404` | **Нешкідливе виключення**: хибне «виявлення» з JS, не сторінка |
| `https://lerenbe.com/databases/(default)/documents/users/` | 404 | `404` | **Нешкідливе виключення**, як вище |
| `https://lerenbe.com/reviews.html` | Виявлено, не проіндексовано | `200`, `noindex`, canonical на себе, не в sitemap | **Нешкідливе, навмисне**: після обходу стане «Виключено тегом noindex» |

**Підтверджених проблем, що заважають індексації навчальних сторінок, у цих шести URL немає.**

## 1. Переадресації (CONFIRMED)

```
http://lerenbe.com/      → 301 → https://lerenbe.com/   (server: cloudflare)
https://www.lerenbe.com/ → 301 → https://lerenbe.com/   (server: GitHub.com)
http://www.lerenbe.com/  → 301 → https://lerenbe.com/   (server: GitHub.com)
https://lerenbe.com/     → 200
```

- Усі три постійні (`301`), без ланцюжків: `curl -L http://www.lerenbe.com/` — одна переадресація, фінал `200`.
- Canonical головної — `https://lerenbe.com/`; `CNAME` — `lerenbe.com`; у `sitemap.xml` лише `https://lerenbe.com/…`.
  Варіантів `www`/`http` немає ні в canonical, ні в sitemap (це перевіряє `tests/seo-gsc-exclusions.cjs`).
- Google сам показує ці адреси як «Сторінка з переадресацією» — це нормально; окремо їх не індексуємо.

**Спостереження (не SEO-проблема):** `www.lerenbe.com` відповідає `server: GitHub.com`, тобто запис `www` у Cloudflare,
схоже, ще «DNS only» (сіра хмарка). Переадресація працює, але на `www` немає заголовків безпеки Cloudflare. Якщо
хочеш однаковості — у Cloudflare → DNS увімкнути **Proxied** для `www` (як для записів A). Для Google це нічого не змінює.

## 2. Адреси `/databases/(default)/documents/…` (CONFIRMED причина, безпечно)

**Звідки взялися.** У `app.js` URL Firestore REST будуються склеюванням рядків:

```js
"https://firestore.googleapis.com/v1/projects/"+PUSH_CONFIG.projectId+"/databases/(default)/documents/subs/"+id   // app.js, docUrl()
"https://firestore.googleapis.com/v1/projects/"+PUSH_CONFIG.projectId+"/databases/(default)/documents/users/"+uid // app.js, синхронізація
```

Окремий рядок `"/databases/(default)/documents/subs/"` починається з `/`. Google, розбираючи JavaScript, вважає такі рядки
відносними посиланнями і склеює з доменом сайту → `https://lerenbe.com/databases/(default)/documents/subs/`. Реальні запити
застосунку йдуть на `firestore.googleapis.com`, а не на lerenbe.com. Посилань на ці шляхи в HTML, sitemap чи документації
сайту немає.

**Чи відкриті приватні дані — ні (перевірено 26.11.2026):**

| Анонімний запит до Firestore REST (проєкт `leren-be`) | Відповідь | Правило в `firestore.rules` |
|---|---|---|
| `users` (акаунти, прогрес) | **403** | читати може лише власник (`request.auth.uid == uid`) |
| `subs` (підписки на нагадування) | **403** | `allow read: if false` |
| `reviews_pending` (відгуки на модерації) | **403** | лише автор або модератор |
| `reviews_public` | 200, **0 документів** | публічне за задумом (лише схвалені відгуки) |

`lerenbe.com/databases/…` — це GitHub Pages, а не Firestore: там `404`, і так має бути.

**Що НЕ робимо:** не створюємо сторінок чи переадресацій для цих шляхів і **не** додаємо `Disallow` у `robots.txt`
(заблокований URL Google не обходить і може довше тримати як «виявлений»; `404` — правильна й остаточна відповідь).
Ці два рядки в звіті зникнуть самі або лишаться в «Не знайдено (404)» — на індексацію інших сторінок це не впливає.

**Необов'язково (не зроблено, гіпотеза про користь):** записати базову адресу одним рядком, що починається з `https://`
(наприклад шаблоном `` `https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents/` ``), щоб Google
не бачив відносного шляху. Це змінює код синхронізації й підписок у `app.js` і потребує релізу з оновленням кешу; користь
лише косметична для звіту GSC, тому без окремого рішення власника не робимо.

## 3. `reviews.html` (CONFIRMED, навмисно поза індексом)

- `200`, `<meta name="robots" content="noindex">`, canonical `https://lerenbe.com/reviews.html`, у `sitemap.xml` немає.
- Google знайшов адресу за посиланням із головної (`modules/home-showcase/ui.js`: «Відгуки» → `reviews.html?lang=…`).
- Справжніх опублікованих відгуків поки немає (`reviews_public` порожній), сторінка показує тимчасове пояснення
  (реліз 264, PR #65/#67). Індексувати порожню сторінку відгуків немає сенсу — `noindex` правильний.
- «Виявлено, наразі не проіндексовано» означає, що Google ще не обходив сторінку. Після обходу статус стане
  **«Виключено тегом noindex»** — це очікувано. Нічого виправляти не треба.
- Коли з'являться реальні схвалені відгуки, власник може прибрати `noindex` і додати сторінку в sitemap
  (тоді `tests/seo-pages.cjs` вимагатиме h1, description, OG і посилання з головної).

## 4. Чотири проіндексовані сторінки

Search Console не каже, які саме 4 URL; найімовірніше це 4 адреси з `sitemap.xml`. Живий стан (26.11.2026):

| URL | Код | canonical | noindex | Примітка |
|---|---|---|---|---|
| `https://lerenbe.com/` | 200 | на себе | ні | |
| `https://lerenbe.com/learn-life.html` | 200 | на себе | ні | OG і посилання з головної — у PR #69 |
| `https://lerenbe.com/learn-life-story.html` | 200 | на себе | ні | на живому сайті h1 з'являється лише після JS; статичний h1 — у PR #69 |
| `https://lerenbe.com/privacy.html` | 200 | на себе | ні | description і OG — у PR #69 |

Решту виправлень для цих сторінок уже зроблено в PR #69; тут вони не повторюються.

## 5. Що реально покращить видимість навчальних сторінок

1. **Влити PR #69** (внутрішні посилання на LIFE, OG, статичний h1, свіжий `lastmod`) і в Search Console натиснути
   «Перевірити URL» → «Надіслати запит на індексування» для 4 адрес із sitemap.
2. **Посібники `/guides/`** — це найбільш «навчальний» текстовий контент сайту (5 сторінок ≈ 400 слів), але зараз
   `noindex,nofollow` за рішенням власника (підвал «Тестова версія»). Якщо вони готові — прибрати `noindex`, додати
   canonical і в sitemap (окремим PR). Це, ймовірно, найбільший важіль для нових запитів. **Рішення власника.**
3. Не «проштовхувати» в індекс переадресації, `404` Firestore та `reviews.html` — їхній поточний статус правильний.
4. Через 2–4 тижні після #69 надіслати з Search Console: покази, запити, середні позиції, статуси 4 URL — без цих цифр
   висновків про позиції не робимо.

## Розподіл висновків

- **Підтверджені проблеми:** немає (серед шести URL). Окреме спостереження — `www` не проксійований Cloudflare (не SEO).
- **Нешкідливі виключення:** 3 переадресації, 2 «Firestore» 404, `reviews.html` (noindex).
- **Гіпотези:** косметичне прибирання відносних рядків Firestore в `app.js` зменшить шум у звіті GSC; відкриття
  `/guides/` для індексу дасть нові запити — потребує рішення власника й вимірювання в GSC.
