# Заявка на робочу версію (Apply for production) — відповіді

Де: Play Console → «Інформаційна панель» → «Подання заявки на доступ до робочої версії» → «Подати заявку».
Коли: після 14 днів закритого тестування з ≥12 тестувальниками (орієнтовно з 11.11.2026).
Відповіді англійською — так їх читає команда перевірки. Місця в [квадратних дужках] заповни сам: я не знаю точних цифр і не вигадую їх.
Пиши лише те, що справді було: Google може звірити відповіді зі статистикою тестування.

---

## Частина 1. Закрите тестування

### How easy was it to recruit testers for your app?
Вибір зі шкали. Чесно: **Neither easy nor difficult** (якщо збирав людей через знайомих, Google Group і Telegram кілька днів) або **Easy**, якщо все пішло швидко.

### Describe the engagement you received from testers during your closed test
> Testers were Ukrainian adults living in Belgium who are learning Dutch, most of them in CVO / inburgering courses at A1–A2 level — the exact audience of the app. I recruited them through a Google Group, my Telegram channel and classmates from my own Dutch course. [N] of the 12+ testers used the app regularly during the test, mainly for short daily lessons, the practice tests before class exams, the games and the AI conversation tutor. Several testers used it on different Android devices and screen sizes (Samsung and other brands), which helped me find layout and audio problems I could not see on my own phone.

### Provide a summary of the feedback you received from testers. Include how you collected the feedback.
> Feedback came through four channels: the Google Play testing feedback form, messages in my Telegram channel and bot, the in-app "⚑" report button on AI answers, and direct conversations in class. The main points were:
> • Audio: the Dutch voice was too fast, and the device voice did not play for English and French on some phones. Testers asked for a female voice.
> • Speaking practice: the microphone stopped listening too early.
> • Reminders: the notification permission was asked twice and the reminder switch did not visibly turn on.
> • Content: testers wanted more practice in the format of real class tests, and a next level after A1.
> • Interface: some pictures were cropped on small screens, one picture matched two answers (knee / leg), the settings header did not scroll back correctly, and some texts were not translated after changing the interface language.

## Частина 2. Про застосунок

### Who is the intended audience of your app?
> Adults (18+) who are learning Dutch as a second language, especially Ukrainians and other newcomers in Belgium following CVO or inburgering courses at levels A1–A2. Explanations are available in Ukrainian, English, French and Arabic.

### Describe how your app provides value to users.
> lerenbe.com is a free, ad-free trainer that follows what learners actually study in Flemish Dutch courses. It offers short 5–10 minute lessons with spaced review of mistakes, recorded Belgian Dutch audio, practice tests and mock exams in the NT2 format (reading, listening, writing, speaking, vocabulary and grammar), games for word order and pronunciation, a 2,800-word dictionary, and an AI tutor that answers in simple Dutch, corrects mistakes and explains the rule in the learner's own language. Lessons work offline, and no account is needed.

### How many installs do you expect your app to have in your first year?
Вибір зі списку. Реалістично для ніші «українці в Бельгії + інші новоприбулі»: **1 000 – 10 000** (або «100 – 1 000», якщо не плануєш активного просування).

## Частина 3. Готовність до випуску

### What changes did you make to your app based on what you learned during your closed test?
> During the test I released more than 100 updates (the app is a web app wrapped as a Trusted Web Activity, so fixes reach testers immediately). Based on feedback I:
> • slowed down the Dutch voice, added a second recorded Belgian voice (female tutor Dafna) and fixed device voices for English and French;
> • made the microphone listen longer and let users stop it with a tap;
> • changed reminders so the permission is requested only once and the switch shows its state clearly;
> • added a full A2 course (9 chapters, including grammar) and mock exams modelled on the NT2 exams, and turned real class practice tests into revision content;
> • fixed cropped and ambiguous pictures, translated the account section for all interface languages, fixed the settings header and other layout issues found on small screens;
> • added an in-app "new version" notice and limits that keep the AI tutor fast and affordable.

### How did you decide that your app is ready for production?
> The app has been used daily by testers for over two weeks without crashes or ANRs in Android Vitals, all issues reported by testers are fixed, and automated tests for lessons, exams, sync and notifications pass on every release. I also ran a full design and text audit in four interface languages on phone, tablet and desktop widths. The privacy policy, data safety form, account deletion and content rating are complete, and the AI chat has an 18+ consent screen and a report button. Testers confirmed that the app helps them prepare for their class tests, so I am confident it is ready for a wider audience.

---

## Перед надсиланням перевір
- [ ] Цифра [N] у першій відповіді: скільки тестувальників справді користувалися (Play Console → «Закрите тестування» → «Тестувальники» / статистика).
- [ ] Android Vitals → «Збої та помилки ANR»: якщо там є збої, прибери фразу «without crashes or ANRs».
- [ ] Каналами зворотного зв’язку вкажи лише ті, що справді були (форма відгуків Play, Telegram, «⚑», розмови в класі).
- [ ] Якщо якийсь пункт зі списку відгуків прийшов не від тестувальників, а від тебе самого, переформулюй: «During my own testing and from testers …».
