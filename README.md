# Leren.be — Nederlands A1.1 🇧🇪🇺🇦

Інтерактивний тренажер нідерландської мови рівня A1.1 для українців (пояснення також англійською, французькою та арабською).

**Сайт:** https://gembarskydanylo.github.io/Leren.be/

## Що всередині
- ≈ 500 карток у 6 розділах і 27 темах (спілкування, граматика, числа й час, люди та здоров'я, дім, місто та послуги)
- Режими: Вивчати · Тест · Аудіювання · Складання речень (2 рівні) · Повторити
- **Toets A1** — 4 міні-іспити по 12 питань у стилі CVO / inburgering (вибір відповіді, вставити слово, читання), поріг «склав» ≥ 70 %
- Озвучування через синтезатор мовлення пристрою, 3 теми оформлення
- Працює офлайн (PWA), прогрес зберігається лише на пристрої

## Файли
| Файл | Призначення |
|---|---|
| `index.html` | увесь застосунок (HTML + CSS + JS) |
| `sw.js` | service worker — офлайн-кеш (при кожному оновленні змінюй `CACHE_NAME`) |
| `manifest.webmanifest` | маніфест PWA для встановлення та магазинів |
| `icon.svg`, `icon-192.png`, `icon-512.png` | іконки застосунку |
| `icon-maskable-512.png` | адаптивна іконка Android |
| `apple-touch-icon.png` | іконка для iPhone / iPad (180×180) |
| `screenshots/` | скріншоти 1080×2160 для маніфесту та Google Play |
| `privacy.html` | політика конфіденційності (потрібна для Google Play та App Store) |

## Запуск локально
```bash
python3 -m http.server 8000
```
і відкрий http://localhost:8000

## Застосунки для Android та iOS
Сайт підготовлено для пакування через [PWABuilder](https://www.pwabuilder.com/): вкажи адресу сайту → **Package for stores**.
- **Android (Google Play):** пакет TWA. Після створення PWABuilder дасть файл `assetlinks.json`. Він має лежати в корені домену: `https://gembarskydanylo.github.io/.well-known/assetlinks.json`, тобто в окремому репозиторії `gembarskydanylo.github.io` (або на власному домені, якщо його підключити). Без цього файлу застосунок працюватиме, але з адресним рядком браузера вгорі.
- **iOS (App Store):** пакет Xcode-проєкту; збирається на Mac з обліковим записом Apple Developer.
- Політика конфіденційності для магазинів: `https://gembarskydanylo.github.io/Leren.be/privacy.html`
