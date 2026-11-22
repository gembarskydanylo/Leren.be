# SEO-аудит lerenbe.com (2026-11-22)

Production-домен — **lerenbe.com** (`CNAME`). `leren.be` — чужий домен із переадресацією на продаж домену; у коді на нього посилань немає (CONFIRMED).

Перевірено запитами до живого сайту і читанням репозиторію. Дій у Search Console не виконувалось (немає доступу й дозволу). Висновок «сторінка не індексується» не робився на основі `site:`.

## 1. Технічна основа

| Що | Результат | Статус |
|---|---|---|
| `http://` → `https://` | 301 | CONFIRMED |
| `www` → без `www` | 301 | CONFIRMED |
| Неіснуюча сторінка | 404 | CONFIRMED |
| `/guides` → `/guides/` | переадресація | CONFIRMED |
| `robots.txt` | Дозволяє все, вказує sitemap | CONFIRMED |
| `sitemap.xml` | 5 URL | CONFIRMED |
| HTTPS, HSTS | Так; HSTS лише 1 день (рекомендовано 1 рік) | CONFIRMED |
| Android App Links (`/.well-known/assetlinks.json`) | Живий файл = репозиторій (`be.leren.app`, 2 відбитки) | CONFIRMED |

## 2. Сторінки

| URL | title / description | canonical | h1 | Open Graph | Примітка |
|---|---|---|---|---|---|
| `/` | Так / 151 символ | Так | 1 | 10 тегів | JSON-LD (`WebApplication`) є. hreflang немає — правильно для однієї URL застосунку (мова обирається всередині) |
| `/learn-life.html` | Так | — | — | **Немає** | Виправляє PR #62 |
| `/learn-life-story.html` | Так | — | **0** | **Немає** | Виправляє PR #62 |
| `/privacy.html` | **Немає description** | — | — | — | Виправляє PR #62 |
| `/reviews.html` | — | — | — | — | Справжніх відгуків немає, форма прихована. PR #67: чесний текст і `noindex`, прибрано з sitemap |
| `/guides/` + 4 посібники | ≈ 400 слів кожен | **Немає** | — | — | `noindex,nofollow`, у sitemap немає, підвал «Тестова версія LerenBe». Рішення власника |

PR #62 (SEO-метадані) зараз у конфлікті з `main` — потрібен rebase після релізу 264.

## 3. Рекомендації

1. Після 264: rebase PR #62 → OG для LIFE-сторінок, h1 на `learn-life-story.html`, description для `privacy.html`.
2. Злити PR #67 (reviews: `noindex`, без обіцянок відгуків, яких немає).
3. Посібники `/guides/`: власник вирішує, чи вони готові. Якщо так — прибрати `noindex,nofollow`, додати canonical, прибрати підвал «Тестова версія», додати в sitemap. Доти не індексувати.
4. Структуровані дані (`WebApplication`, `Offer`, `Person`) на головній — є; після появи справжніх відгуків не додавати рейтинг без джерела.
5. Не додавати hreflang, поки всі мови живуть на одній URL.

## 4. Search Console — URL Inspection (виконує власник)

Перевірити через **URL Inspection → Test live URL** (не через `site:`):

| URL | Очікується | Коли |
|---|---|---|
| `https://lerenbe.com/` | Indexed, canonical = сама сторінка | Після 264 |
| `https://lerenbe.com/learn-life.html` | Indexed; після #62 — OG у живому тесті | Після #62 |
| `https://lerenbe.com/learn-life-story.html` | Indexed; після #62 — h1 | Після #62 |
| `https://lerenbe.com/privacy.html` | Indexed | Після #62 |
| `https://lerenbe.com/reviews.html` | Після #67: «Excluded by noindex» — це правильно | Після #67 |
| `https://lerenbe.com/guides/` і 4 посібники | Зараз «Excluded by noindex» — правильно, доки власник не вирішить | Після рішення |
| `https://lerenbe.com/sitemap.xml` | Sitemaps → Submitted, 5 (після #67 — 4) URL, без помилок | Після #67 |

Також у Search Console: **Pages** (причини виключення), **Core Web Vitals** (мобільні), **Enhancements** (структуровані дані).
