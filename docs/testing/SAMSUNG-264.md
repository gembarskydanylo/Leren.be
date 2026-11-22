# Реліз 264 — перевірка на Samsung (оновлення 263 → 264)

Ручна перевірка на справжньому телефоні. Автоматичні тести на Mac проходять лише в емуляції Chromium, тож вони **не замінюють** цю перевірку.
Production (lerenbe.com, Worker, Firebase, Google Play) не зачіпається: телефон відкриває локальну копію сайту з Mac.

Тривалість: ≈ 45 хв. Статус на 2026-11-22: **NOT RUN** (телефон не підключено, `adb devices` порожній).

## 0. Підготовка

Телефон, режим розробника, USB-налагодження і Port forwarding — як у розділі 0 [SAMSUNG-TEST-CHECKLIST.md](../integration-3.0/SAMSUNG-TEST-CHECKLIST.md).

Перевір, що телефон видно:

```bash
~/Library/Android/sdk/platform-tools/adb devices
```

Прокинь порт 8080 телефона на Mac (замість Port forwarding у Chrome):

```bash
~/Library/Android/sdk/platform-tools/adb reverse tcp:8080 tcp:8080
```

Скопіюй обидва релізи в тимчасові папки:

```bash
git clone --quiet https://github.com/gembarskydanylo/Leren.be.git /tmp/lerenbe-263-check
```

```bash
git clone --quiet --branch audit/lerenbe-3-0-quality https://github.com/gembarskydanylo/Leren.be.git /tmp/lerenbe-264-check
```

## 1. Старий стан у 263

Запусти 263 і відкрий на телефоні `http://localhost:8080/` у Chrome:

```bash
cd /tmp/lerenbe-263-check && python3 -m http.server 8080 --bind 127.0.0.1
```

1. **Налаштування → Вчитель → Dafna**.
2. Пройди один урок і запиши кількість XP.
3. Відкрий історію «Een dag in België».
4. Встанови застосунок: меню Chrome → **Додати на головний екран** (PWA).

Зупини сервер (Ctrl+C) і запусти 264 на тому самому порту:

```bash
cd /tmp/lerenbe-264-check && python3 -m http.server 8080 --bind 127.0.0.1
```

Онови сторінку, потім закрий і знову відкрий вкладку. Версію видно на Mac: `chrome://inspect` → **Inspect** → Application → Cache storage. Має бути `leren-be-v264`, а `leren-be-v263` має зникнути.

## 2. Перевірки

| # | Що перевірити | Очікується | Результат |
|---|---|---|---|
| 1 | XP, пройдений урок | Ті самі, що в 263 | |
| 2 | Налаштування | Рядка «Вчитель» немає, порожніх місць немає. Рядок голосу показує **голос Dafna** | |
| 3 | Будь-яке слово → 🔊 | Жіночий голос (Dafna), як у 263 | |
| 4 | Голос → Peter → закрити й відкрити застосунок | Залишився голос Peter | |
| 5 | Історія «Een dag in België» | Без вікна «Обери вчителя». Провідник — Dafna | |
| 6 | Привітання компаньйона (перший екран / «Про нас») | Peter і Dafna — **персонажі**, Lexi — AI-викладачка | |
| 7 | LIFE: швидкий подвійний тап на «Далі» і на правильній відповіді | Одна репліка за раз, за учня ніщо не відповідає | |
| 8 | Словник вертикально, потім арабською | Немає прокрутки вбік, заголовок не обрізаний | |
| 9 | Арабська → Іспит A1.1 → блок AI | Lexi, а не «بيتر». Дати іспиту немає, текст «дату повідомляє школа» | |
| 10 | Клавіатура Samsung у чаті Lexi | Поле вводу над клавіатурою, кнопка надсилання доступна | |
| 11 | Мікрофон у розмовній практиці | Дозвіл питається один раз, розпізнаний текст у полі | |
| 12 | PWA з головного екрана | Відкривається без рядка адреси, той самий прогрес | |
| 13 | Офлайн: увімкни режим польоту, закрий і відкрий PWA | Головна, уроки й ігри працюють. Lexi чесно каже, що потрібен інтернет | |
| 14 | Офлайн → Словник → «fiets» | Слова з уроків і повідомлення «без інтернету» з кнопкою **«Спробувати ще раз»** | |
| 15 | Вимкни режим польоту → «Спробувати ще раз» | Завантажується повний словник (без перезапуску застосунку) | |
| 16 | Перемикання курсу NL → EN → FR → NL | Прогрес кожного курсу зберігається, інтерфейс не змішує мови | |
| 17 | Темна тема Android | Текст читається, немає білих плям і невидимих кнопок | |
| 18 | Розмір шрифту Android 150 % (Налаштування → Дисплей → Розмір і стиль шрифту) | Немає прокрутки вбік, кнопки не перекриваються, текст не обрізаний | |
| 19 | Lexi (з частиною AI): «Ik werken in Gent.» | Картка виправлення й «Спробувати ще раз» | |
| 20 | Lexi: «de чи het?» | Спершу пояснення українською, потім коротке речення нідерландською. «Поясни простіше» | |
| 21 | Lexi: «Ik woon in Gent.» | Відповідь із запитанням, «Допоможи відповісти» | |
| 22 | Урок → вікторина → «Допомога» до відповіді | Підказка, але не правильна відповідь і не переклад слова | |

Через `http.server` AI не підключений: Lexi повідомить, що AI недоступний. Пункти 19–22 перевіряються з локальним сервером `tools/lexi-local.cjs` (див. [LEXI-REAL-AI-TESTS.md](LEXI-REAL-AI-TESTS.md)); він теж слухає порт 8080.

## 3. Корисні команди ADB (тестовий телефон)

Відкрити сторінку:

```bash
~/Library/Android/sdk/platform-tools/adb shell am start -a android.intent.action.VIEW -d http://localhost:8080/
```

Темна тема — увімкнути / вимкнути:

```bash
~/Library/Android/sdk/platform-tools/adb shell cmd uimode night yes
```

```bash
~/Library/Android/sdk/platform-tools/adb shell cmd uimode night no
```

Розмір шрифту 150 % і повернення до 100 %:

```bash
~/Library/Android/sdk/platform-tools/adb shell settings put system font_scale 1.5
```

```bash
~/Library/Android/sdk/platform-tools/adb shell settings put system font_scale 1.0
```

Помилки JavaScript з Chrome на телефоні:

```bash
~/Library/Android/sdk/platform-tools/adb logcat -s chromium:E
```

Знімок екрана на Mac:

```bash
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > ~/Desktop/samsung-264.png
```

Після перевірки поверни тему й шрифт, зупини сервер і зніми прокидання порту:

```bash
~/Library/Android/sdk/platform-tools/adb reverse --remove-all
```

## 4. Критерій

- Пункти 1–5 (прогрес і міграція голосу) — обов'язково PASS.
- Пункти 7–10, 13–15 — PASS або записана проблема з пріоритетом.
- Знімок екрана для кожного FAIL.

Результат записати в таблицю вище і в `docs/release/RELEASE-264-CHECKLIST.md`.
