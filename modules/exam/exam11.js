/* Leren.be — exam preparation "1.1 test deel 8 → 11" (CVO course chapters 8–11).
 * Parts follow the teacher's exam sheet: Lezen, Luisteren, Schrijven, Spreken, Woordenschat, Grammatica + a mock exam.
 * Uses the app's globals (el, $, tgt, say, listenOnce, toast, addXP, lsGet, lsSet, shuffle, uiLang). */
(function(){
"use strict";
const KEY="leren_exam11";
const L=()=>uiLang==="uk"?"uk":"en";
const T={
 uk:{title:"🎓 Іспит 1.1 · deel 8 → 11",sub:"Підготовка точно за листком вчителя: читання, слухання, письмо, говоріння, слова й граматика.",
  when:"Чт 29.10 — Lezen · Schrijven · Luisteren\nПт 30.10 — Spreken",back:"← Іспит",toets:"← Toets",
  parts:{lezen:["📖","Lezen","Запрошення, чат, інформація на ліках"],luisteren:["🎧","Luisteren","Запрошення й діалог у лікаря"],schrijven:["✍️","Schrijven","3 листи: мій день, відповідь на запрошення, мої страви"],spreken:["🗣️","Spreken","6 тем: питання вчителя + твоя відповідь"],woorden:["📚","Woordenschat","Слова розділів 8–11"],grammatica:["🧩","Grammatica","Inversie, niet/geen, omdat, moeten, meer/minder"],proef:["🏁","Proefexamen","Великий пробний тест: половина всього"]},
  q:"Питання",of:"з",next:"Далі",check:"Перевірити",right:"Правильно!",wrong:"Неправильно. Правильна відповідь:",
  listen:"▶ Слухати",again:"🔁 Ще раз",showText:"Показати текст",hideText:"Сховати текст",readFirst:"Спершу прочитай питання, потім слухай.",
  done:"Готово!",score:(a,b)=>a+" з "+b+" правильно",repeat:"Повтори:",restart:"Пройти ще раз",best:"Найкраще",
  order:"Натискай слова по порядку",clear:"Очистити",
  wTask:"Завдання",wWrite:"Напиши лист тут…",wCheck:"Перевірити лист",wModel:"Показати зразок",wHideModel:"Сховати зразок",wTips:"Перевірка:",wSaved:"Чернетка зберігається на цьому пристрої.",
  sAsk:"🔊 Питання",sSpeak:"🎤 Відповісти",sShow:"Показати відповідь",sHeard:"Ти сказав:",sModel:"Зразок:",sOk:"✓ Вмію",sRe:"↺ Ще потренуватись",sTopic:"Тема",sDone:(a,b)=>a+" з "+b+" питань вже вмієш",
  timer:"Час",proefInfo:"22 питання: читання, слухання, слова й граматика. Як на іспиті — без підказок до кінця."},
 en:{title:"🎓 Exam 1.1 · part 8 → 11",sub:"Preparation that follows the teacher's exam sheet: reading, listening, writing, speaking, words and grammar.",
  when:"Thu 29.10 — Reading · Writing · Listening\nFri 30.10 — Speaking",back:"← Exam",toets:"← Tests",
  parts:{lezen:["📖","Lezen","Invitation, chat, medicine label"],luisteren:["🎧","Luisteren","Invitation and doctor dialogue"],schrijven:["✍️","Schrijven","3 e-mails: my day, reply to an invitation, my meals"],spreken:["🗣️","Spreken","6 topics: teacher's questions + your answer"],woorden:["📚","Woordenschat","Words of chapters 8–11"],grammatica:["🧩","Grammatica","Inversion, niet/geen, omdat, moeten, meer/minder"],proef:["🏁","Proefexamen","Big mock test: half of everything"]},
  q:"Question",of:"of",next:"Next",check:"Check",right:"Correct!",wrong:"Not quite. The right answer:",
  listen:"▶ Listen",again:"🔁 Again",showText:"Show text",hideText:"Hide text",readFirst:"Read the question first, then listen.",
  done:"Done!",score:(a,b)=>a+" of "+b+" correct",repeat:"Review:",restart:"Try again",best:"Best",
  order:"Tap the words in order",clear:"Clear",
  wTask:"Task",wWrite:"Write your e-mail here…",wCheck:"Check my e-mail",wModel:"Show model",wHideModel:"Hide model",wTips:"Checklist:",wSaved:"Your draft is saved on this device.",
  sAsk:"🔊 Question",sSpeak:"🎤 Answer",sShow:"Show answer",sHeard:"You said:",sModel:"Model:",sOk:"✓ I can do it",sRe:"↺ Practise more",sTopic:"Topic",sDone:(a,b)=>a+" of "+b+" questions mastered",
  timer:"Time",proefInfo:"22 questions: reading, listening, words and grammar. Like the real exam — no hints until the end."}
};
const U=()=>T[L()];
const tr=x=>typeof x==="string"?x:(x[L()]||x.uk||x.en||"");

// ---------------- DATA ----------------
const TEXTS={
 karim:{title:"Een uitnodiging",body:"Hoera, ik word 40!\nKom je naar mijn feest? Het feest is op zaterdag 14 juni van 19 tot 23 uur in Café De Zwaan, Kerkstraat 12 in Mechelen. Er is eten en muziek. Neem gerust je partner mee!\nLaat het weten vóór 1 juni via sms: 0470 12 34 56.\nGroetjes, Karim"},
 sofie:{title:"Een uitnodiging",body:"Sofie en Jonas gaan trouwen!\nJullie zijn uitgenodigd op vrijdag 20 juni om 11 uur aan het stadhuis van Aalst.\nNa de ceremonie is er een receptie in zaal Het Anker, Molenstraat 5.\n’s Avonds om 19 uur is er een etentje voor familie en vrienden.\nGraag een antwoord vóór 1 mei via e-mail: sofie.jonas@gmail.com"},
 chat:{title:"Een chat",body:"Anna: Hoi Omar! Zaterdag ga ik naar de markt in Leuven. Ga je mee?\nOmar: Ja, dat is goed! Hoe laat spreken we af?\nAnna: Om 10 uur?\nOmar: Oei, om 10 uur kan ik niet. Ik breng mijn dochter naar de zwemles. Om half twaalf?\nAnna: Oké! Waar spreken we af?\nOmar: Aan de bushalte bij het station.\nAnna: Prima. Na de markt gaan we iets drinken. Tot zaterdag!"},
 mail:{title:"Een e-mail",body:"Dag Lies,\nHoe gaat het met jou? Met mij gaat het goed. Ik heb nu werk in een bakkerij. Ik sta elke dag om vier uur op! Ik werk van vijf tot één uur. ’s Middags slaap ik een uur. Daarna haal ik mijn zoon van school. ’s Avonds kook ik en om tien uur ga ik slapen.\nIn het weekend werk ik niet. Dan ga ik graag fietsen of wandelen in het park. Ik ga niet graag winkelen.\nGroetjes, Mira"},
 siroop:{title:"Informatie op een medicijn",body:"HOESTSIROOP (oefentekst)\nVolwassenen: 3 keer per dag 1 eetlepel (15 ml), na de maaltijd.\nKinderen van 6 tot 12 jaar: 3 keer per dag 1 koffielepel (5 ml).\nNiet geven aan kinderen jonger dan 6 jaar.\nVerkrijgbaar zonder voorschrift."},
 tabletten:{title:"Informatie op een medicijn",body:"PIJNSTILLER 500 mg (oefentekst)\nVolwassenen: 1 tot 2 tabletten per keer.\nMaximaal 6 tabletten per dag.\nMinimaal 4 uur tussen 2 innames.\nNeem de tablet in met een glas water, tijdens of na de maaltijd.\nAlleen met voorschrift van de dokter."}
};
const Q=(uk,en)=>({uk,en});
const LEZEN=[
 {t:"karim",q:Q("Чому Карім робить свято?","Why is Karim having a party?"),o:["Hij is jarig.","Hij gaat trouwen.","Hij heeft een nieuw huis."]},
 {t:"karim",q:Q("Де свято?","Where is the party?"),o:["In een café.","Bij Karim thuis.","In een restaurant."]},
 {t:"karim",q:Q("О котрій починається свято?","What time does the party start?"),o:["Om 19 uur.","Om 23 uur.","Om 14 uur."]},
 {t:"karim",q:Q("Як треба відповісти?","How should you reply?"),o:["Met een sms.","Met een e-mail.","Met een brief."]},
 {t:"karim",q:Q("До якої дати треба відповісти?","Reply before which date?"),o:["Vóór 1 juni.","Vóór 14 juni.","Vóór 12 juni."]},
 {t:"sofie",q:Q("Чому Софі та Йонас надсилають запрошення?","Why do Sofie and Jonas send this card?"),o:["Ze gaan trouwen.","Ze verjaren.","Ze gaan verhuizen."]},
 {t:"sofie",q:Q("Де церемонія?","Where is the ceremony?"),o:["Aan het stadhuis van Aalst.","In zaal Het Anker.","In de Molenstraat."]},
 {t:"sofie",q:Q("Що буде о 19:00?","What happens at 19:00?"),o:["Een etentje.","De ceremonie.","Een receptie."]},
 {t:"sofie",q:Q("Як відповісти?","How do you reply?"),o:["Via e-mail.","Via sms.","Met de telefoon."]},
 {t:"chat",q:Q("Куди йдуть Анна й Омар?","Where are Anna and Omar going?"),o:["Naar de markt.","Naar de cinema.","Naar het zwembad."]},
 {t:"chat",q:Q("О котрій вони зустрічаються?","What time do they meet?"),o:["Om half twaalf.","Om 10 uur.","Om half elf."]},
 {t:"chat",q:Q("Чому Омар не може о 10:00?","Why can't Omar come at 10?"),o:["Hij brengt zijn dochter naar de zwemles.","Hij moet werken.","Hij is ziek."]},
 {t:"chat",q:Q("Де вони зустрічаються?","Where do they meet?"),o:["Aan de bushalte.","Aan de ingang van de markt.","Bij Anna thuis."]},
 {t:"mail",q:Q("Де працює Міра?","Where does Mira work?"),o:["In een bakkerij.","In een supermarkt.","In een school."]},
 {t:"mail",q:Q("О котрій Міра встає?","What time does Mira get up?"),o:["Om 4 uur.","Om 5 uur.","Om 1 uur."]},
 {t:"mail",q:Q("Що Міра НЕ любить робити?","What does Mira NOT like doing?"),o:["Winkelen.","Fietsen.","Wandelen."]},
 {t:"mail",q:Q("Що Міра робить після обіду?","What does Mira do after her nap?"),o:["Ze haalt haar zoon van school.","Ze gaat werken.","Ze gaat winkelen."]},
 {t:"siroop",q:Q("Скільки разів на день дорослий п’є сироп?","How many times a day does an adult take it?"),o:["3 keer.","1 keer.","6 keer."]},
 {t:"siroop",q:Q("Коли приймати сироп?","When do you take the syrup?"),o:["Na de maaltijd.","Voor de maaltijd.","Voor je gaat slapen."]},
 {t:"siroop",q:Q("Чи можна дитині 4 років?","May a 4-year-old take it?"),o:["Nee.","Ja.","Ja, 1 koffielepel."]},
 {t:"siroop",q:Q("Чи потрібен рецепт?","Do you need a prescription?"),o:["Nee.","Ja."]},
 {t:"tabletten",q:Q("Скільки таблеток максимум на день?","Maximum tablets per day?"),o:["6 tabletten.","2 tabletten.","4 tabletten."]},
 {t:"tabletten",q:Q("Скільки годин мінімум між двома прийомами?","Minimum hours between 2 doses?"),o:["4 uur.","2 uur.","6 uur."]},
 {t:"tabletten",q:Q("Чи потрібен рецепт?","Do you need a prescription?"),o:["Ja.","Nee."]}
];
const DLG={
 cinema:[["A","Hoi Hua! Ik ga morgenavond naar de cinema. Ga je mee?"],["B","Morgenavond? Hmm, ik weet het niet. Ik moet tot zes uur werken."],["A","De film begint om half negen."],["B","O, dat is goed! Waar spreken we af?"],["A","Aan de ingang van de cinema, om kwart over acht."],["B","Oké, tot morgen!"]],
 voetbal:[["A","Hallo Andrei! Het is mooi weer. Ik ga voetballen in het park. Ga je mee?"],["B","Het spijt me, Nasir. Ik kan niet. Ik ben moe, ik heb vandaag veel gewerkt."],["A","Spijtig!"],["B","Een andere keer misschien. Zaterdag heb ik tijd."]],
 route:[["A","Gloria, we spreken af aan de bushalte om kwart voor drie, goed?"],["B","Ja, maar hoe kom ik daar?"],["A","Ga rechtdoor tot aan de school. Dan ga je rechtsaf. Daarna de eerste straat links. Daar is de bushalte."],["B","Rechtdoor, rechtsaf, en dan links. Dank je!"]],
 dokter:[["A","Goedemorgen, mevrouw Peeters. Wat scheelt er?"],["B","Ik ben verkouden en ik moet veel hoesten."],["A","Sinds wanneer?"],["B","Sinds drie dagen. En ik heb ook keelpijn."],["A","Heeft u koorts?"],["B","Ja, 38 graden."],["A","Doe uw trui maar even uit. Adem eens diep in en uit. Zeg eens aaa."],["A","U heeft een bronchitis. Ik schrijf een hoestsiroop voor. Neem drie keer per dag een eetlepel, na de maaltijd. En gebruik de neusspray twee keer per dag."],["B","Moet ik thuisblijven?"],["A","Ja, blijf drie dagen thuis en drink veel water."]],
 apotheek:[["A","Goedemiddag, zeg het maar."],["B","Ik heb hoofdpijn en een beetje koorts. Heeft u iets tegen de pijn?"],["A","Neem deze tabletten. Eén tablet per keer, maximaal vier per dag."],["B","Moet ik ze voor of na het eten innemen?"],["A","Na het eten, met een glas water."],["B","Heb ik een voorschrift nodig?"],["A","Nee, dat is niet nodig. Dat is zes euro. Beterschap!"]]
};
const LUISTEREN=[
 {d:"cinema",q:Q("Що Ана робитиме завтра ввечері?","What will Ana do tomorrow evening?"),o:["Een film kijken.","Iets eten.","Iets drinken."]},
 {d:"cinema",q:Q("Чи йде Хуа?","Is Hua going?"),o:["Ja.","Nee.","Ze weet het nog niet."]},
 {d:"cinema",q:Q("О котрій вони зустрічаються?","What time do they meet?"),o:["8:15","8:30","6:00"]},
 {d:"cinema",q:Q("Де вони зустрічаються?","Where do they meet?"),o:["Aan de ingang van de cinema.","Aan de bushalte.","Bij Ana thuis."]},
 {d:"voetbal",q:Q("Що Насір збирається робити?","What is Nasir going to do?"),o:["Voetballen.","Fietsen.","Lopen."]},
 {d:"voetbal",q:Q("Чому Андрій не йде?","Why isn't Andrei coming?"),o:["Hij is moe.","Hij moet werken.","Hij heeft geen zin."]},
 {d:"voetbal",q:Q("Яка погода?","What is the weather like?"),o:["Het is mooi weer.","Het regent.","Het is bewolkt."]},
 {d:"route",q:Q("О котрій вони зустрічаються?","What time do they meet?"),o:["2:45","3:15","3:45"]},
 {d:"route",q:Q("Яким маршрутом іти Глорії?","Which route must Gloria take?"),o:["↑ → ←","↑ ← →","↑ → ↑"]},
 {d:"dokter",q:Q("Що з пані Петерс?","What is wrong with Mrs Peeters?"),o:["Een bronchitis.","Griep.","Een keelontsteking."]},
 {d:"dokter",q:Q("Коли приймати сироп?","When should she take the syrup?"),o:["Na de maaltijd.","Voor de maaltijd.","Tijdens de maaltijd."]},
 {d:"dokter",q:Q("Скільки разів на день спрей для носа?","How often the nasal spray?"),o:["2 keer per dag.","3 keer per dag.","1 keer per dag."]},
 {d:"dokter",q:Q("Скільки днів сидіти вдома?","How many days at home?"),o:["3 dagen.","2 dagen.","Een week."]},
 {d:"apotheek",q:Q("Що болить у пацієнта?","What does the customer have?"),o:["Hoofdpijn en een beetje koorts.","Buikpijn.","Keelpijn en hoesten."]},
 {d:"apotheek",q:Q("Скільки таблеток максимум на день?","Maximum tablets per day?"),o:["4","1","6"]},
 {d:"apotheek",q:Q("Чи потрібен рецепт?","Is a prescription needed?"),o:["Nee.","Ja."]}
];
// vocabulary: [nl, uk, en]
const WOORDEN=[
 ["strijken","прасувати","to iron"],["stofzuigen","пилососити","to vacuum"],["afwassen","мити посуд","to do the dishes"],["de was doen","прати","to do the laundry"],["boodschappen doen","робити покупки","to do the shopping"],["poetsen","прибирати","to clean"],
 ["wandelen","гуляти пішки","to walk"],["lopen","бігати","to run"],["naar de fitness gaan","ходити в спортзал","to go to the gym"],["op café gaan","йти в кафе","to go to a café"],["in de tuin werken","працювати в саду","to work in the garden"],["foto’s nemen","фотографувати","to take photos"],
 ["opstaan","вставати","to get up"],["thuiskomen","приходити додому","to come home"],["van school halen","забирати зі школи","to pick up from school"],["werkloos","безробітний","unemployed"],
 ["de uitnodiging","запрошення","the invitation"],["afspreken","домовлятися про зустріч","to arrange to meet"],["meegaan","йти разом","to come along"],["de ingang","вхід","the entrance"],["de bushalte","автобусна зупинка","the bus stop"],["Spijtig!","Шкода!","What a pity!"],["Ik heb geen zin.","Мені не хочеться.","I don't feel like it."],["morgenavond","завтра ввечері","tomorrow evening"],["Ga rechtsaf.","Поверни праворуч.","Turn right."],["een bos bloemen","букет квітів","a bunch of flowers"],
 ["Wat scheelt er?","Що з тобою? Що болить?","What's wrong?"],["verkouden","застуджений","having a cold"],["hoesten","кашляти","to cough"],["niezen","чхати","to sneeze"],["de keel","горло","the throat"],["de koorts","температура","the fever"],["het voorschrift","рецепт","the prescription"],["de hoestsiroop","сироп від кашлю","the cough syrup"],["innemen","приймати (ліки)","to take (medicine)"],["uitademen","видихати","to breathe out"],["tijdens de maaltijd","під час їжі","during the meal"],
 ["het bestek","столові прибори","the cutlery"],["de vork","виделка","the fork"],["de kom","миска","the bowl"],["het beleg","начинка для бутерброда","the sandwich filling"],["de hesp","шинка","the ham"],["de boterham","скибка хліба, бутерброд","the slice of bread"],["de havermout","вівсянка","the oatmeal"],["de frisdrank","газована вода","the soft drink"],["ongezond","шкідливий","unhealthy"],["hartig","солоний, пікантний","savoury"],["dikwijls","часто","often"],["nooit","ніколи","never"],["meestal","зазвичай","usually"],["minder","менше","less"]
];
// grammar: gap {s,o} (first = correct) or order {w:[words], a:"answer"} + explanation
const GRAM=[
 {s:"Ik heb ___ tijd.",o:["geen","niet"],e:Q("geen + іменник без артикля","geen + noun without article")},
 {s:"Ik kook ___ graag.",o:["niet","geen"],e:Q("niet перед graag","niet before graag")},
 {s:"Hij heeft ___ koorts.",o:["geen","niet"],e:Q("geen + іменник","geen + noun")},
 {s:"Ik luister ___ naar muziek.",o:["niet","geen"],e:Q("niet перед прийменником","niet before a preposition")},
 {s:"Wij hebben ___ auto.",o:["geen","niet"],e:Q("een auto → geen auto","een auto → geen auto")},
 {s:"Ik ontbijt ___ elke dag.",o:["niet","geen"],e:Q("niet перед elke dag","niet before elke dag")},
 {s:"Op maandag ___ ik werken.",o:["moet","moeten","moetten"],e:Q("ik moet","ik moet")},
 {s:"___ jij zaterdag komen?",o:["Kun","Kunnen","Kunt"],e:Q("У питанні: Kun jij …? / Kan jij …? (без -t перед jij)","In a question: Kun jij …? / Kan jij …?")},
 {s:"Wij ___ morgen naar de markt.",o:["gaan","gaat","ga"],e:Q("wij gaan","wij gaan")},
 {s:"Je moet meer water ___.",o:["drinken","drinkt","drink"],e:Q("moeten + інфінітив у кінці","moeten + infinitive at the end")},
 {s:"Ik drink veel cola. → Je moet ___ cola drinken.",o:["minder","meer","weinig"],e:Q("багато cola → треба менше","a lot of cola → less")},
 {s:"Ik eet weinig groenten. → Je moet ___ groenten eten.",o:["meer","minder","veel"],e:Q("мало овочів → треба більше","few vegetables → more")},
 {s:"Neem de tablet in ___ de maaltijd. (після)",o:["na","voor","tijdens"],e:Q("na = після","na = after")},
 {s:"Ik blijf thuis, omdat ik ziek ___.",o:["ben","is","zijn"],e:Q("omdat → дієслово в кінці","omdat → verb at the end")},
 {s:"Ik blijf thuis, want ik ___ ziek.",o:["ben","zijn","is"],e:Q("want → звичайний порядок","want → normal word order")},
 {s:"Bedankt ___ de uitnodiging.",o:["voor","met","van"],e:Q("bedankt voor","bedankt voor")},
 {s:"Gefeliciteerd ___ je verjaardag!",o:["met","voor","op"],e:Q("gefeliciteerd met","gefeliciteerd met")},
 {s:"Ik drink koffie ___ suiker. (без)",o:["zonder","met","voor"],e:Q("zonder = без","zonder = without")},
 {w:["Om","7 uur","sta","ik","op."],a:"Om 7 uur sta ik op.",e:Q("Inversie: дієслово на 2-му місці, op у кінці","Inversion: verb second, op at the end")},
 {w:["’s Avonds","kook","ik","voor","mijn gezin."],a:"’s Avonds kook ik voor mijn gezin.",e:Q("Inversie після часу","Inversion after time")},
 {w:["Hij","wast","elke dag","af."],a:"Hij wast elke dag af.",e:Q("afwassen: af у кінці","afwassen: af at the end")},
 {w:["Ga","je","mee","naar de cinema?"],a:"Ga je mee naar de cinema?",e:Q("meegaan у питанні","meegaan in a question")},
 {w:["Ik","kan","niet","komen,","omdat","ik","moet","werken."],a:"Ik kan niet komen, omdat ik moet werken.",e:Q("omdat: обидва дієслова в кінці","omdat: both verbs at the end")},
 {w:["Na het werk","doe","ik","boodschappen."],a:"Na het werk doe ik boodschappen.",e:Q("Inversie: Na het werk + дієслово + ik","Inversion")},
 {w:["Je","moet","minder","frieten","eten."],a:"Je moet minder frieten eten.",e:Q("moeten + інфінітив у кінці","moeten + infinitive at the end")},
 {w:["Neem","de siroop","in","na","de maaltijd."],a:"Neem de siroop in na de maaltijd.",e:Q("innemen: in після додатка","innemen: in after the object")}
];
const WRITE=[
 {id:"dag",title:Q("E-mail: мій день + що я люблю / не люблю робити","E-mail: my day + what I like / don't like doing"),
  task:"Schrijf een e-mail aan Sara. Wat doe je op een normale dag? Wat doe je graag en wat doe je niet graag?",
  checks:[["Begroeting (Hallo / Beste …)",/^\s*(hallo|beste|dag|lieve|hoi)\b/i],["Uren: om … uur",/\bom\s+(\d|half|kwart)/i],["’s morgens / ’s middags / ’s avonds",/['’]s\s+(morgens|middags|avonds)/i],["Inversie (Om 8 uur ga ik / ’s Avonds kook ik)",/(\bom\s+[\w ]+?\s+uur|['’]s\s+\w+|daarna|dan|na het \w+)\s+[a-z]+\s+ik\b/i],["graag",/\bgraag\b/i],["niet graag",/\bniet\s+graag\b/i],["Afscheid (Groetjes)",/\b(groetjes|groeten|tot ziens|tot snel)\b/i]],
  model:"Hallo Sara,\n\nHoe gaat het met jou? Ik vertel je over mijn dag.\nIk sta elke dag om 7 uur op. Ik neem een douche en ik ontbijt. Om half negen breng ik mijn zoon naar school. Dan ga ik naar de les Nederlands. ’s Middags eet ik een boterham met kaas. Na de les doe ik boodschappen. Om 17 uur kook ik. ’s Avonds kijk ik een serie of ik lees een boek. Om 23 uur ga ik slapen.\nIk fiets graag en ik ga graag naar de fitness. Ik kook ook graag. Ik strijk niet graag en ik doe niet graag de was.\nEn jij? Wat doe jij graag?\n\nGroetjes,\nDanylo"},
 {id:"rita",title:Q("Відповідь на запрошення: я НЕ можу прийти","Reply to an invitation: I can't come"),
  card:"Op 3 juni word ik 50!\nDaarop zou ik graag samen met jullie een glaasje drinken. Welkom op zaterdag 5 juni tussen 15 en 18 uur bij mij thuis.\nKom jij ook? Graag een antwoord vóór 15 mei.\nRita Janssens · rita.janssens@gmail.com",
  task:"Lees de uitnodiging. Je kan niet komen. Schrijf een antwoord.",
  checks:[["Begroet Rita (Beste Rita,)",/^\s*(beste|dag|lieve|hallo)\s+rita/i],["Feliciteer (Gefeliciteerd / Proficiat)",/\b(gefeliciteerd|proficiat)\b/i],["Bedank (Bedankt voor de uitnodiging)",/\bbedankt\b|\bdank (je|u)\b/i],["Verontschuldig je (Het spijt me)",/\bhet spijt me\b|\bsorry\b/i],["Je kan niet komen",/\b(kan|kun)\b[^.!?]*\bniet\b[^.!?]*\bkomen\b|\bniet komen\b/i],["Waarom (Ik moet werken / Ik ben ziek …)",/\b(ik moet|ik ben ziek|ik heb geen|ik ga|omdat|want)\b/i],["Afscheid (Groetjes)",/\b(groetjes|groeten|tot ziens)\b/i]],
  model:"Beste Rita,\n\nGefeliciteerd met je verjaardag! Bedankt voor de uitnodiging.\nHet spijt me, maar ik kan niet komen. Op zaterdag 5 juni moet ik werken.\nIk wens je een fijn feest!\n\nGroetjes,\nDanylo"},
 {id:"victor",title:Q("Відповідь на запрошення: так, я прийду","Reply to an invitation: yes, I'm coming"),
  card:"Victor en Marie\nJullie zijn uitgenodigd op 16 mei om 13.00 uur aan het stadhuis van Dendermonde. Na de trouwceremonie gaan we iets drinken in Café Tijl. Om 20.00 uur is ons dansfeest in Hof ter Velden.\nGraag antwoorden vóór 22 april. marie.dehond@gmail.com",
  task:"Lees de uitnodiging. Je komt graag. Schrijf een antwoord.",
  checks:[["Begroeting (Beste Victor en Marie,)",/^\s*(beste|dag|lieve|hallo)\b/i],["Feliciteer (Proficiat met jullie huwelijk!)",/\b(gefeliciteerd|proficiat)\b/i],["Bedankt voor de uitnodiging",/\bbedankt\b|\bdank (je|jullie|u)\b/i],["Ik kom graag",/\bik kom\b|\bik ben er\b/i],["Afscheid (Groetjes / Tot 16 mei)",/\b(groetjes|groeten|tot ziens|tot \d+)\b/i]],
  model:"Beste Victor en Marie,\n\nProficiat met jullie huwelijk! Bedankt voor de uitnodiging.\nIk kom graag naar het stadhuis en naar het dansfeest. Ik neem bloemen mee.\nTot 16 mei!\n\nGroetjes,\nDanylo"},
 {id:"eten",title:Q("E-mail про мої страви","E-mail about my meals"),
  task:"Schrijf een e-mail aan Tom met informatie over jouw maaltijden. Wat eet en drink je ’s morgens, ’s middags en ’s avonds? Wat vind je (niet) lekker?",
  checks:[["Begroeting",/^\s*(hallo|beste|dag|lieve|hoi)\b/i],["’s morgens",/['’]s\s+morgens|ontbijt/i],["’s middags",/['’]s\s+middags|lunch/i],["’s avonds",/['’]s\s+avonds|avondeten/i],["lekker vinden (Ik vind … lekker)",/\bvind\b[^.!?]*\blekker\b/i],["met / zonder",/\b(met|zonder)\b/i],["Frequentie (nooit / soms / vaak / meestal / altijd)",/\b(nooit|soms|vaak|dikwijls|meestal|altijd)\b/i],["Afscheid",/\b(groetjes|groeten|tot ziens)\b/i]],
  model:"Hallo Tom,\n\nJe vraagt wat ik eet. ’s Morgens ontbijt ik om 7 uur. Ik eet een boterham met choco of havermout met melk. Ik drink koffie zonder suiker.\n’s Middags eet ik een broodje met kaas en hesp en een appel.\n’s Avonds eet ik een warme maaltijd: aardappelen of rijst met vlees of vis en groenten.\nIk vind pasta en soep heel lekker. Ik vind frieten ook lekker, maar ik eet ze niet vaak, want ze zijn ongezond. Ik drink veel water. Ik drink nooit cola.\nWat eet jij graag?\n\nGroetjes,\nDanylo"}
];
const COMMON=[ // frequent mistakes in writing
 [/\bbedenkt\b/i,Q("«Bedenkt» → правильно «Bedankt» (дякую).","«Bedenkt» → write «Bedankt» (thanks).")],
 [/\bik heb\b[^.!?]{0,25}\bwerken\b/i,Q("«Ik heb … werken» → «Ik moet … werken».","«Ik heb … werken» → «Ik moet … werken».")],
 [/['’]s\s+(morgens|middags|avonds)\s+ik\b/i,Q("Після «’s avonds» дієслово перед ik: «’s Avonds kook ik».","After «’s avonds» the verb comes before ik: «’s Avonds kook ik».")],
 [/\bom\s+\d+\s+uur\s+ik\b/i,Q("Інверсія: «Om 8 uur ga ik», а не «Om 8 uur ik ga».","Inversion: «Om 8 uur ga ik».")],
 [/\bik\s+graag\b/i,Q("graag після дієслова: «Ik fiets graag».","graag after the verb: «Ik fiets graag».")],
 [/\bik\s+niet\s+heb\b/i,Q("«Ik heb geen …» замість «ik niet heb».","«Ik heb geen …».")],
 [/\bik\s+opsta\b/i,Q("«Ik sta om 7 uur op» — op у кінці.","«Ik sta om 7 uur op».")]
];
const SPREKEN=[
 {id:"dag",t:Q("Мій звичайний день","My normal day"),qa:[["Hoe laat sta jij op?","Ik sta om 7 uur op."],["Wat doe je ’s morgens?","Ik neem een douche en ik ontbijt. Dan breng ik mijn zoon naar school."],["Wat doe je ’s middags?","’s Middags ga ik naar de les Nederlands."],["Wat doe je na de les?","Na de les doe ik boodschappen."],["Wat doe je ’s avonds?","’s Avonds kook ik. Daarna kijk ik een serie."],["Hoe laat ga je slapen?","Ik ga om 23 uur slapen."],["Wat doe jij in het weekend?","In het weekend fiets ik en ik ga wandelen."],["Kook jij elke dag?","Ja, ik kook elke dag."]]},
 {id:"graag",t:Q("Що я люблю / не люблю робити","What I like / don't like doing"),qa:[["Wat doe jij graag?","Ik fiets graag. Ik lees ook graag."],["Wat doe jij niet graag?","Ik strijk niet graag."],["Zwem jij graag?","Ja, ik zwem graag."],["Ga jij graag op restaurant?","Ja, ik ga graag op restaurant."],["Doe jij graag boodschappen?","Nee, ik doe niet graag boodschappen."],["Kook jij graag?","Ja, ik kook graag."]]},
 {id:"afspraak",t:Q("Домовитися / відмовитися","Make plans / say no"),qa:[["Ik ga zaterdagavond naar de cinema. Ga je mee?","Ja, dat is goed! Hoe laat spreken we af?"],["Om half acht.","Waar spreken we af?"],["Aan de ingang.","Oké, tot zaterdag!"],["Het is mooi weer. Ik ga wandelen in het park. Ga je mee?","Het spijt me, ik kan niet. Ik moet werken."],["Spijtig!","Een andere keer misschien!"],["Ga je morgen mee naar de markt?","Het spijt me, maar ik heb geen tijd."]]},
 {id:"dokter",t:Q("У лікаря: Wat scheelt er?","At the doctor's"),qa:[["Goedemorgen. Wat scheelt er?","Ik voel me niet goed. Ik heb keelpijn en ik moet veel hoesten."],["Sinds wanneer?","Sinds twee dagen."],["Heeft u koorts?","Ja, ik heb 38,5 graden koorts."],["Waar heeft u pijn?","Ik heb pijn aan mijn rug."],["Moet u niezen?","Ja, ik moet veel niezen. Ik ben verkouden."],["Neemt u medicijnen?","Nee, ik neem geen medicijnen."]]},
 {id:"eten",t:Q("Мої страви: Wat vind jij lekker?","My meals"),qa:[["Wat eet je ’s morgens?","’s Morgens eet ik een boterham met kaas."],["Wat eet je ’s avonds?","’s Avonds eet ik vlees met aardappelen en groenten."],["Vind jij koffie lekker?","Ja, ik vind koffie heel lekker."],["Drink jij graag bier?","Nee, ik drink niet graag bier."],["Eet jij graag frieten?","Ja, ik eet graag frieten, maar niet vaak."],["Eet jij gezond?","Ja, meestal. Ik eet veel groenten en fruit."]]},
 {id:"advies",t:Q("Інструкції: meer / minder","Advice: meer / minder"),qa:[["Ik drink veel cola.","Je moet minder cola drinken."],["Ik drink elke dag maar een glas water.","Je moet meer water drinken."],["Ik eet elke dag frieten.","Je moet minder frieten eten."],["Ik eet weinig groenten.","Je moet meer groenten eten."],["Ik eet veel chocolade.","Je moet minder chocolade eten."],["Ik sport nooit.","Je moet meer sporten."]]}
];

// ---------------- HELPERS ----------------
const st=()=>{try{const s=lsGet(KEY,{});return s&&typeof s==="object"?s:{}}catch(e){return{}}};
const save=s=>{try{lsSet(KEY,s)}catch(e){}};
function setBest(part,pct){const s=st();s.best=s.best||{};if(!(s.best[part]>=pct)){s.best[part]=pct;save(s)}}
function head(title,sub,backTo){
 cardToTop&&cardToTop();
 const c=$("card");c.replaceChildren();$("prog").textContent=title;$("rnd").textContent=sub||"";bar(0);
 const b=el("button","ex-back",backTo==="toets"?U().toets:U().back);b.type="button";b.onclick=backTo==="toets"?()=>startToets():home;c.appendChild(b);
 return c;
}
function bar(p){const f=$("barfill");if(f){f.style.width=Math.round(p*100)+"%";f.parentElement&&f.parentElement.setAttribute("aria-valuenow",String(Math.round(p*100)))}}
function playLines(lines,btn,i=0){
 if(i>=lines.length){if(btn)btn.disabled=false;return}
 if(btn)btn.disabled=true;
 say(lines[i][1],null,()=>setTimeout(()=>playLines(lines,btn,i+1),350));
}
const nl=t=>{const s=el("span","",t);return tgt(s)};

// ---------------- HOME ----------------
function home(){
 const u=U(),c=head(u.title,"","toets"),s=st();
 c.appendChild(el("h2","ex-h",u.title));c.appendChild(el("p","ex-sub",u.sub));c.appendChild(el("p","ex-when",u.when));
 const grid=el("div","ex-grid");
 Object.entries(u.parts).forEach(([id,[ic,t,d]])=>{
  const b=el("button","ex-tile"+(id==="proef"?" wide":""));b.type="button";b.dataset.part=id;
  b.append(el("span","ex-ic",ic),el("strong","",t),el("span","ex-d",d));
  const best=s.best&&s.best[id];if(best!=null){b.appendChild(el("span","ex-best","★ "+best+"%"));if(best>=70)b.classList.add("ok")}
  b.onclick=()=>({lezen:()=>quiz("lezen"),luisteren:()=>quiz("luisteren"),woorden:()=>quiz("woorden"),grammatica:()=>quiz("grammatica"),proef:()=>quiz("proef"),schrijven:writePick,spreken:speakPick})[id]();
  grid.appendChild(b);
 });
 c.appendChild(grid);
}

// ---------------- QUIZ ENGINE ----------------
function mkLezen(x){return{kind:"mc",text:TEXTS[x.t],q:tr(x.q),o:x.o,ok:x.o[0]}}
function mkLuisteren(x){return{kind:"mc",dlg:DLG[x.d],q:tr(x.q),o:x.o,ok:x.o[0]}}
function mkWoord(w,i,all){
 const others=shuffle(all.filter(x=>x!==w)).slice(0,3),dir=i%2;
 return dir?{kind:"mc",q:(L()==="uk"?"Як нідерландською: «":"In Dutch: “")+(L()==="uk"?w[1]:w[2])+(L()==="uk"?"»?":"”?"),o:[w[0],...others.map(x=>x[0])],ok:w[0],nlOpts:true}
  :{kind:"mc",q:(L()==="uk"?"Що означає «":"What does “")+w[0]+(L()==="uk"?"»?":"” mean?"),o:[L()==="uk"?w[1]:w[2],...others.map(x=>L()==="uk"?x[1]:x[2])],ok:L()==="uk"?w[1]:w[2],nlQ:w[0]};
}
function mkGram(g){return g.w?{kind:"order",w:g.w,a:g.a,e:tr(g.e)}:{kind:"mc",gap:g.s,o:g.o,ok:g.o[0],e:tr(g.e),nlOpts:true}}
function build(part){
 if(part==="lezen")return LEZEN.map(mkLezen);
 if(part==="luisteren")return LUISTEREN.map(mkLuisteren);
 if(part==="woorden"){const w=shuffle(WOORDEN).slice(0,20);return w.map((x,i)=>mkWoord(x,i,WOORDEN))}
 if(part==="grammatica")return shuffle(GRAM).map(mkGram);
 // mock exam: half of everything, grouped like the exam
 const pick=(a,n)=>shuffle(a).slice(0,n);
 const lez=pick(["karim","sofie","chat","mail","siroop","tabletten"],3).flatMap(t=>pick(LEZEN.filter(x=>x.t===t),2)).map(mkLezen);
 const lui=pick(Object.keys(DLG),2).flatMap(d=>pick(LUISTEREN.filter(x=>x.d===d),2)).map(mkLuisteren);
 const w=pick(WOORDEN,6).map((x,i)=>mkWoord(x,i,WOORDEN));
 return [...lez,...lui,...w,...pick(GRAM,6).map(mkGram)];
}
let QZ=null;
function quiz(part){QZ={part,items:build(part),i:0,right:0,miss:[],t0:Date.now()};if(part==="proef")toast(U().proefInfo);ask()}
function ask(){
 const u=U(),s=QZ,it=s.items[s.i],title=u.parts[s.part][0]+" "+u.parts[s.part][1];
 const c=head(title,u.q+" "+(s.i+1)+" "+u.of+" "+s.items.length);bar(s.i/s.items.length);
 if(it.text){const box=el("div","ex-text");box.appendChild(el("small","",it.text.title));const p=el("p","");p.appendChild(nl(it.text.body));box.appendChild(p);c.appendChild(box)}
 if(it.dlg){
  c.appendChild(el("p","ex-hint",u.readFirst));
  const row=el("div","row ex-play"),pl=el("button","btn primary",u.listen);pl.type="button";pl.onclick=()=>playLines(it.dlg,pl);
  const sh=el("button","btn",u.showText);sh.type="button";const box=el("div","ex-text ex-dlg");box.hidden=true;
  it.dlg.forEach(([w,t])=>{const p=el("p","");p.appendChild(el("b","",w+": "));p.appendChild(nl(t));box.appendChild(p)});
  sh.onclick=()=>{box.hidden=!box.hidden;sh.textContent=box.hidden?u.showText:u.hideText};
  row.append(pl,sh);c.append(row,box);it._box=box;
 }
 const qh=el("h3","ex-q");
 if(it.gap){qh.appendChild(nl(it.gap))}else if(it.nlQ){qh.textContent=it.q.split(it.nlQ)[0];qh.appendChild(nl(it.nlQ));qh.append(it.q.split(it.nlQ)[1]||"")}else qh.textContent=it.q;
 if(it.kind==="order")qh.textContent=u.order;
 c.appendChild(qh);
 if(it.kind==="mc"){
  const box=el("div","opts ex-opts");
  shuffle(it.o).forEach(o=>{const b=el("button","opt");b.type="button";b.appendChild(it.nlOpts||it.text||it.dlg||it.gap?nl(o):el("span","",o));b.onclick=()=>answer(o===it.ok,b,box);box.appendChild(b)});
  c.appendChild(box);
 }else{
  const line=el("div","ex-line"),pool=el("div","ex-pool"),picked=[];
  const draw=()=>{line.replaceChildren(...picked.map(w=>nl(w)));};
  shuffle(it.w).forEach(w=>{const b=el("button","opt ex-chip");b.type="button";b.appendChild(nl(w));b.onclick=()=>{if(b.disabled)return;picked.push(w);b.disabled=true;draw();if(picked.length===it.w.length){const ok=picked.join(" ")===it.a;answer(ok,null,pool,it.a)}};pool.appendChild(b)});
  const clr=el("button","btn",u.clear);clr.type="button";clr.onclick=()=>{picked.length=0;pool.querySelectorAll("button").forEach(b=>b.disabled=false);draw()};
  c.append(line,pool,clr);
 }
}
function answer(ok,btn,box,orderAnswer){
 const u=U(),s=QZ,it=s.items[s.i],c=$("card");
 box.querySelectorAll("button").forEach(b=>{b.disabled=true;if(it.kind==="mc"&&b.textContent===it.ok)b.classList.add("correct")});
 if(btn&&!ok)btn.classList.add("incorrect");
 if(ok)s.right++;else s.miss.push(it);
 const fb=el("div","ex-fb "+(ok?"ok":"bad"));fb.appendChild(el("strong","",ok?u.right:u.wrong+" "));
 if(!ok){fb.appendChild(nl(it.kind==="order"?it.a:it.ok))}
 if(it.e)fb.appendChild(el("p","",it.e));
 c.appendChild(fb);
 if(it._box&&it._box.hidden){it._box.hidden=false}
 if(ok&&(it.gap||it.kind==="order"))say(it.kind==="order"?it.a:it.gap.replace("___",it.ok).replace(/\s*\(.*\)\s*$/,"").replace(/\s*→.*$/,""));
 const nx=el("button","btn primary ex-next",u.next);nx.type="button";nx.id="nx";nx.onclick=()=>{s.i++;s.i<s.items.length?ask():end()};c.appendChild(nx);
 setTimeout(()=>{try{nx.scrollIntoView({block:"nearest",behavior:"smooth"})}catch(e){}},30);
}
function end(){
 const u=U(),s=QZ,n=s.items.length,pct=Math.round(s.right/n*100),title=u.parts[s.part][0]+" "+u.parts[s.part][1];
 const c=head(title,u.done);bar(1);
 const prev=(st().best||{})[s.part];setBest(s.part,pct);
 const xp=Math.max(0,s.right-Math.round((prev||0)/100*n))*5;if(xp)addXP(xp);
 const box=el("div","ex-end");box.append(el("div","ex-big",pct>=70?"🏆":"💪"),el("h2","",pct+"%"),el("p","ex-score",u.score(s.right,n)+(xp?" · +"+xp+" ⭐":"")));
 if(s.part==="proef"){const m=Math.round((Date.now()-s.t0)/60000);box.appendChild(el("p","ex-hint",u.timer+": "+m+" min"))}
 if(s.miss.length){box.appendChild(el("h3","",u.repeat));const ul=el("ul","ex-miss");s.miss.forEach(it=>{const li=el("li","");li.append(el("span","",(it.gap||it.q||u.order)+" → "));li.appendChild(nl(it.kind==="order"?it.a:it.ok));ul.appendChild(li)});box.appendChild(ul)}
 c.appendChild(box);
 const row=el("div","row");const a=el("button","btn primary",u.restart);a.type="button";a.id="nx";a.onclick=()=>quiz(s.part);const h=el("button","btn",u.back);h.type="button";h.onclick=home;row.append(a,h);c.appendChild(row);
}

// ---------------- WRITING ----------------
function writePick(){
 const u=U(),c=head(u.parts.schrijven[0]+" "+u.parts.schrijven[1],"");
 c.appendChild(el("p","ex-sub",u.parts.schrijven[2]));
 WRITE.forEach((w,i)=>{const b=el("button","btn toets-pick ex-wpick");b.type="button";b.dataset.write=w.id;b.append(el("span","tp-no",String(i+1)));const tx=el("span","tp-text");tx.appendChild(el("strong","",tr(w.title)));const d=(st().draft||{})[w.id];if(d)tx.appendChild(el("small","tp-meta","✎ "+d.trim().split(/\s+/).length+" woorden"));b.appendChild(tx);b.onclick=()=>write(w);c.appendChild(b)});
}
function write(w){
 const u=U(),c=head(u.parts.schrijven[0]+" "+u.parts.schrijven[1],tr(w.title));
 c.appendChild(el("h3","ex-q",tr(w.title)));
 if(w.card){const box=el("div","ex-text ex-card");box.appendChild(nl(w.card));c.appendChild(box)}
 const tk=el("p","ex-task");tk.append(el("b","",u.wTask+": "));tk.appendChild(nl(w.task));c.appendChild(tk);
 const ta=el("textarea","ex-ta");ta.rows=10;ta.lang="nl";ta.placeholder=u.wWrite;ta.setAttribute("spellcheck","false");ta.value=((st().draft||{})[w.id])||"";
 ta.oninput=()=>{const s=st();s.draft=s.draft||{};s.draft[w.id]=ta.value;save(s)};
 c.append(ta,el("small","ex-hint",u.wSaved));
 const res=el("div","ex-check");const model=el("div","ex-text ex-model");model.hidden=true;model.appendChild(nl(w.model));
 const row=el("div","row"),ck=el("button","btn primary",u.wCheck),md=el("button","btn",u.wModel);ck.type=md.type="button";
 ck.onclick=()=>{
  const t=ta.value.trim();res.replaceChildren(el("strong","",u.wTips));const ul=el("ul","ex-list");let okN=0;
  w.checks.forEach(([lbl,re])=>{const ok=re.test(t);if(ok)okN++;const li=el("li",ok?"ok":"bad",(ok?"✅ ":"⬜ ")+lbl);ul.appendChild(li)});
  const sents=t.split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>2&&!/^(hallo|beste|dag|hoi|lieve|groetjes|groeten)\b/i.test(x)&&!/,$/.test(x)&&x.split(/\s+/).length>1);
  const cap=sents.filter(x=>!/^[A-Z’'0-9]/.test(x)),dot=sents.filter(x=>!/[.!?]$/.test(x));
  [[cap.length===0,L()==="uk"?"Кожне речення з великої літери":"Every sentence starts with a capital"],[dot.length===0,L()==="uk"?"Кожне речення закінчується . ! або ?":"Every sentence ends with . ! or ?"],[sents.length>=5,(L()==="uk"?"Щонайменше 5 речень (зараз: ":"At least 5 sentences (now: ")+sents.length+")"],[/\n\s*[A-Z][a-z]+\s*$/.test(t)||/groetjes,?\s*\n?\s*\S+\s*$/i.test(t),L()==="uk"?"Ім’я в кінці":"Your name at the end"]].forEach(([ok,lbl])=>{if(ok)okN++;ul.appendChild(el("li",ok?"ok":"bad",(ok?"✅ ":"⬜ ")+lbl))});
  res.appendChild(ul);
  const tips=COMMON.filter(([re])=>re.test(t));if(tips.length){const tl=el("ul","ex-list warn");tips.forEach(([,m])=>tl.appendChild(el("li","bad","⚠️ "+tr(m))));res.appendChild(tl)}
  const total=w.checks.length+4,pct=Math.round(okN/total*100);setBest("schrijven",pct);bar(okN/total);
  if(pct===100&&!tips.length)toast("🏆 "+pct+"%");
 };
 md.onclick=()=>{model.hidden=!model.hidden;md.textContent=model.hidden?u.wModel:u.wHideModel};
 row.append(ck,md);c.append(row,res,model);
}

// ---------------- SPEAKING ----------------
function speakPick(){
 const u=U(),c=head(u.parts.spreken[0]+" "+u.parts.spreken[1],""),s=st();
 c.appendChild(el("p","ex-sub",u.parts.spreken[2]));
 SPREKEN.forEach((t,i)=>{const okN=((s.sp||{})[t.id]||[]).length;const b=el("button","btn toets-pick");b.type="button";b.dataset.speak=t.id;b.append(el("span","tp-no",String(i+1)));const tx=el("span","tp-text");tx.append(el("strong","",tr(t.t)),el("small","tp-meta",u.sDone(okN,t.qa.length)));b.appendChild(tx);if(okN>=t.qa.length)b.classList.add("passed");b.onclick=()=>speak(t,0);c.appendChild(b)});
}
const norm=x=>String(x).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9à-ÿ' ]+/g," ").replace(/\s+/g," ").trim();
function speak(topic,i){
 const u=U(),qa=topic.qa[i],c=head(u.parts.spreken[0]+" "+tr(topic.t),u.q+" "+(i+1)+" "+u.of+" "+topic.qa.length);bar(i/topic.qa.length);
 const q=el("div","ex-text ex-speakq");const qb=el("button","btn ex-say",u.sAsk);qb.type="button";qb.onclick=()=>say(qa[0],qb);q.append(qb);const qt=el("p","ex-q");qt.appendChild(nl(qa[0]));q.appendChild(qt);c.appendChild(q);
 setTimeout(()=>say(qa[0]),250);
 const out=el("div","ex-check"),model=el("div","ex-text ex-model");model.hidden=true;model.append(el("small","",u.sModel+" "));model.appendChild(nl(qa[1]));const mb=el("button","btn ex-say","🔊");mb.type="button";mb.onclick=()=>say(qa[1],mb);model.appendChild(mb);
 const row=el("div","row");
 const mic=el("button","btn primary",u.sSpeak);mic.type="button";
 const hasSR=!!(window.SpeechRecognition||window.webkitSpeechRecognition);if(!hasSR)mic.hidden=true;
 mic.onclick=()=>{mic.disabled=true;mic.classList.add("rec");listenOnce(alts=>{mic.disabled=false;mic.classList.remove("rec");const said=alts[0]||"";const words=norm(qa[1]).split(" ").filter(w=>w.length>2),got=norm(alts.join(" "));const hit=words.filter(w=>got.includes(w)).length;out.replaceChildren(el("small","",u.sHeard),nl(" «"+said+"» "),el("span",hit/Math.max(1,words.length)>=.6?"ex-good":"ex-meh",hit/Math.max(1,words.length)>=.6?" 👍":" 🙂"));model.hidden=false},()=>{mic.disabled=false;mic.classList.remove("rec");model.hidden=false})};
 const sh=el("button","btn",u.sShow);sh.type="button";sh.onclick=()=>{model.hidden=false;say(qa[1])};
 row.append(mic,sh);c.append(row,out,model);
 const mark=el("div","row ex-mark");const ok=el("button","btn ex-ok",u.sOk),re=el("button","btn",u.sRe);ok.type=re.type="button";
 const go=good=>{const s=st();s.sp=s.sp||{};const a=new Set(s.sp[topic.id]||[]);good?a.add(i):a.delete(i);s.sp[topic.id]=[...a];save(s);
  const all=SPREKEN.reduce((n,t)=>n+t.qa.length,0),done=SPREKEN.reduce((n,t)=>n+((s.sp[t.id]||[]).length),0);setBestRaw("spreken",Math.round(done/all*100));
  i+1<topic.qa.length?speak(topic,i+1):speakPick()};
 ok.onclick=()=>go(true);re.onclick=()=>go(false);mark.append(ok,re);c.appendChild(mark);
}
function setBestRaw(part,pct){const s=st();s.best=s.best||{};s.best[part]=pct;save(s)}

// ---------------- PUBLIC ----------------
function texts(){ // every Dutch text this module can speak (for tools/collect-audio-texts.js)
 const out=[];Object.values(DLG).forEach(d=>d.forEach(l=>out.push(l[1])));
 GRAM.forEach(g=>out.push(g.w?g.a:g.s.replace("___",g.o[0]).replace(/\s*\(.*\)\s*$/,"").replace(/\s*→.*$/,"")));
 SPREKEN.forEach(t=>t.qa.forEach(([q,a])=>{out.push(q);out.push(a)}));
 return out;
}
window.EXAM11={open:home,texts,data:{LEZEN,LUISTEREN,WOORDEN,GRAM,WRITE,SPREKEN,DLG,TEXTS},_quiz:quiz,_write:write,_speak:speak};
})();
