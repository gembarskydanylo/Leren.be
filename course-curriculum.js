/* Course 1.1 follows the twelve chapter outlines supplied by the learner.
 * Course 1.2: original practice based on PCVO Moderne Talen's NT2 1.2 outcomes.
 * See COURSE-CURRICULUM.md. Stable legacy card IDs deliberately remain intact. */
globalThis.LerenCurriculum = (() => {
 const chapters = [
  ['comm','Wie ben jij?',['phrases','questions','alphabet']],
  ['people','Wie is dat?',['pronouns','bezit','family','jobs','animals','home','identity','mail']],
  ['nums','Hoeveel?',['numbers','weather','prices']],
  ['travelTime','Hoe laat is het?',['time','clock','transport','city']],
  ['birthday','Wanneer verjaar jij?',['months','birthday']],
  ['opening','Wanneer is de winkel open?',['opening']],
  ['forms','Kunt u dit formulier invullen?',['forms','telefoon','gemeente','cvo','werk']],
  ['dag','Wat doe jij op een dag?',['routine','separable','niet','graag','ex8']],
  ['plans','Ga je mee?',['modal','toekomst','invitation','uitnodigen','ongoing','ex9']],
  ['health','Wat scheelt er?',['body','lichaammv','klachten','doctor','kaartjes','afspraak','instructions','ex10']],
  ['food','Eet jij gezond?',['adjectives','healthy','restaurant','ex11']],
  ['shopping','Wat eten we vandaag?',['shop','groceries','plurals']]
 ];
 const advanced = [
  ['past','⏪ Verleden',['perfectum','verleden']],
  ['holiday','🧳 Familie en vakantie',['holiday']],
  ['travel','🚆 Op reis',['journey']],
  ['service','🛍️ Winkelen en tweedehands',['clothes','colors','market','returns','secondhand']],
  ['wonen','🏡 Wonen',['huren']],
  ['contact','✉️ Berichten en afspraken',['messages','appointments']],
  ['reading','📰 Lezen en reageren',['notices','directions']],
  ['grammar2','📘 Verder met grammatica',['objpron','comparison']]
 ];

 // Practice test of 27 Oct 2026: new cards go into the topic they belong to (nl|uk|en|fr|ar|icon).
 const practice = {
  healthy: `
Je moet minder snoepjes eten.|Тобі треба їсти менше солодощів.|You should eat fewer sweets.|Tu dois manger moins de bonbons.|يجب أن تأكل حلويات أقل.|🍬
Je moet meer vis eten.|Тобі треба їсти більше риби.|You should eat more fish.|Tu dois manger plus de poisson.|يجب أن تأكل المزيد من السمك.|🐟
Je moet minder hamburgers eten.|Тобі треба їсти менше гамбургерів.|You should eat fewer hamburgers.|Tu dois manger moins de hamburgers.|يجب أن تأكل برغر أقل.|🍔
Je moet minder cola drinken.|Тобі треба пити менше коли.|You should drink less cola.|Tu dois boire moins de cola.|يجب أن تشرب كولا أقل.|🥤
Je moet minder koffie drinken.|Тобі треба пити менше кави.|You should drink less coffee.|Tu dois boire moins de café.|يجب أن تشرب قهوة أقل.|☕
Je moet meer groenten eten.|Тобі треба їсти більше овочів.|You should eat more vegetables.|Tu dois manger plus de légumes.|يجب أن تأكل المزيد من الخضار.|🥦
Je moet meer fruit eten.|Тобі треба їсти більше фруктів.|You should eat more fruit.|Tu dois manger plus de fruits.|يجب أن تأكل المزيد من الفاكهة.|🍎
Je moet minder chips eten.|Тобі треба їсти менше чіпсів.|You should eat fewer crisps.|Tu dois manger moins de chips.|يجب أن تأكل شيبس أقل.|🥡
Ik eet 's middags altijd een zak snoepjes.|Удень я завжди з’їдаю пакет цукерок.|In the afternoon I always eat a bag of sweets.|L’après-midi, je mange toujours un sachet de bonbons.|بعد الظهر آكل دائماً كيس حلويات.|🍬
Ik drink meestal cola bij het eten.|Я зазвичай п’ю колу під час їжі.|I usually drink cola with my meal.|Je bois généralement du cola pendant le repas.|أشرب الكولا عادة مع الطعام.|🥤
Ik drink 20 kopjes koffie per dag.|Я п’ю 20 чашок кави на день.|I drink 20 cups of coffee a day.|Je bois 20 tasses de café par jour.|أشرب 20 فنجان قهوة في اليوم.|☕
Ik eet nooit vis.|Я ніколи не їм рибу.|I never eat fish.|Je ne mange jamais de poisson.|لا آكل السمك أبداً.|🐟
Ik eet geen fruit.|Я не їм фруктів.|I don’t eat fruit.|Je ne mange pas de fruits.|لا آكل الفاكهة.|🍎
Ik eet dikwijls chips.|Я часто їм чіпси.|I often eat crisps.|Je mange souvent des chips.|آكل الشيبس كثيراً.|🥡
Ik eet niet gezond.|Я харчуюся нездорово.|I don’t eat healthily.|Je ne mange pas sainement.|لا آكل بشكل صحي.|🍟
het advies|порада|advice|le conseil|النصيحة|💡
het snoepje – de snoepjes|цукерка – цукерки (солодощі)|sweet – sweets|le bonbon – les bonbons|الحلوى – الحلويات|🍬
de hamburger – de hamburgers|гамбургер – гамбургери|hamburger|le hamburger|البرغر|🍔
de chips|чіпси|crisps|les chips|الشيبس|🥡
het kopje koffie|чашка кави|cup of coffee|une tasse de café|فنجان قهوة|☕
de zak snoepjes|пакет цукерок|a bag of sweets|un sachet de bonbons|كيس حلويات|🛍️
`,
  ex8: `
’s morgens – ’s middags – ’s avonds|вранці – вдень – ввечері|in the morning – in the afternoon – in the evening|le matin – l’après-midi – le soir|صباحاً – ظهراً – مساءً|🕒
Om 07:00 u neem ik een douche.|О 07:00 я приймаю душ.|At 7:00 I take a shower.|À 7 h, je prends une douche.|في الساعة 07:00 آخذ دشاً.|🚿
Om 08:15 ontbijt ik.|О 08:15 я снідаю.|At 8:15 I have breakfast.|À 8 h 15, je prends mon petit-déjeuner.|في الساعة 08:15 أتناول الفطور.|🍳
’s Morgens breng ik de kinderen naar school.|Вранці я відвожу дітей до школи.|In the morning I take the children to school.|Le matin, j’emmène les enfants à l’école.|في الصباح أوصل الأطفال إلى المدرسة.|🎒
’s Avonds kook ik.|Ввечері я готую.|In the evening I cook.|Le soir, je cuisine.|في المساء أطبخ.|🍲
Om 18:00 u eet ik een warme maaltijd.|О 18:00 я їм теплу страву (гарячу вечерю).|At 18:00 I eat a hot meal.|À 18 h, je mange un repas chaud.|في الساعة 18:00 آكل وجبة ساخنة.|🍽️
Na de maaltijd kijk ik naar de tv.|Після їжі я дивлюся телевізор.|After the meal I watch TV.|Après le repas, je regarde la télé.|بعد الوجبة أشاهد التلفاز.|📺
Ik ga naar de supermarkt en ik doe boodschappen.|Я йду в супермаркет і роблю покупки.|I go to the supermarket and I do the shopping.|Je vais au supermarché et je fais les courses.|أذهب إلى السوبرماركت وأتسوق.|🛒
Ik lees de krant.|Я читаю газету.|I read the newspaper.|Je lis le journal.|أقرأ الصحيفة.|📰
Ik kijk naar de televisie.|Я дивлюся телевізор.|I watch television.|Je regarde la télévision.|أشاهد التلفاز.|📺
de krant|газета|newspaper|le journal|الصحيفة|📰
de televisie|телевізор|television|la télévision|التلفاز|📺
de warme maaltijd|тепла страва (гарячий обід, вечеря)|hot meal|le repas chaud|الوجبة الساخنة|🍲
het middagmaal|обід (основна їжа вдень)|midday meal|le repas de midi|وجبة الظهيرة|🥪
het avondmaal|вечеря|evening meal|le repas du soir|وجبة المساء|🍽️
`,
  klachten: `
Ik heb pijn aan mijn neus.|У мене болить ніс.|My nose hurts.|J’ai mal au nez.|أشعر بألم في أنفي.|👃
Hij heeft pijn aan zijn neus.|У нього болить ніс.|His nose hurts.|Il a mal au nez.|أنفه يؤلمه.|👃
Hij heeft pijn aan zijn vinger.|У нього болить палець.|His finger hurts.|Il a mal au doigt.|إصبعه يؤلمه.|☝️
Hij heeft pijn aan zijn been.|У нього болить нога.|His leg hurts.|Il a mal à la jambe.|ساقه تؤلمه.|🦵
Hij heeft pijn aan zijn schouder.|У нього болить плече.|His shoulder hurts.|Il a mal à l’épaule.|كتفه يؤلمه.|💪
Hij heeft pijn aan zijn voet.|У нього болить стопа.|His foot hurts.|Il a mal au pied.|قدمه تؤلمه.|🦶
rugpijn, buikpijn, hoofdpijn, tandpijn|в одне слово: біль у спині, животі, голові, зубі|one word: back, stomach, head, tooth pain|en un mot : mal au dos, au ventre, à la tête, aux dents|كلمة واحدة: ألم الظهر والبطن والرأس والأسنان|🤕
pijn aan mijn neus, vinger, voet, schouder|окремими словами: біль у носі, пальці, стопі, плечі|separate words: nose, finger, foot, shoulder pain|en plusieurs mots : mal au nez, au doigt, au pied, à l’épaule|بكلمات منفصلة: ألم في الأنف والإصبع والقدم والكتف|🤕
Ik nies de hele dag.|Я чхаю цілий день.|I sneeze all day.|J’éternue toute la journée.|أعطس طوال اليوم.|🤧
Ik hoest en ik nies dikwijls.|Я кашляю і часто чхаю.|I cough and sneeze often.|Je tousse et j’éternue souvent.|أسعل وأعطس كثيراً.|🤧
Aaatsjie! Ben je allergisch?|Апчхи! У тебе алергія?|Atchoo! Are you allergic?|Atchoum ! Tu es allergique ?|أتشو! هل لديك حساسية؟|🤧
Je hebt koorts: 38° C.|У тебе температура: 38° C.|You have a fever: 38° C.|Tu as de la fièvre : 38 °C.|لديك حمى: 38 درجة.|🌡️
Je moet de siroop 3 keer per dag nemen.|Тобі треба пити сироп 3 рази на день.|You must take the syrup 3 times a day.|Tu dois prendre le sirop 3 fois par jour.|يجب أن تتناول الشراب 3 مرات في اليوم.|🧴
3 keer per dag: ’s morgens, ’s middags en ’s avonds|3 рази на день: вранці, вдень і ввечері|3 times a day: morning, afternoon and evening|3 fois par jour : le matin, l’après-midi et le soir|3 مرات في اليوم: صباحاً وظهراً ومساءً|🔁
Ik kan niet naar de les komen. Ik heb griep.|Я не можу прийти на урок. У мене грип.|I can’t come to the lesson. I have the flu.|Je ne peux pas venir au cours. J’ai la grippe.|لا أستطيع الحضور إلى الدرس. عندي إنفلونزا.|🤒
Dat is spijtig! Wat scheelt er?|Шкода! Що трапилося?|That’s a pity! What’s wrong?|C’est dommage ! Qu’est-ce qui ne va pas ?|هذا مؤسف! ما المشكلة؟|❓
`,
  body: `
de long – de longen|легеня – легені|lung|le poumon|الرئة|🫁
ademen|дихати|to breathe|respirer|يتنفس|🌬️
Ik adem met mijn neus en mijn longen.|Я дихаю носом і легенями.|I breathe with my nose and my lungs.|Je respire avec mon nez et mes poumons.|أتنفس بأنفي ورئتيّ.|🫁
Ik eet, ik spreek en ik drink met mijn mond.|Я їм, говорю і п’ю ротом.|I eat, speak and drink with my mouth.|Je mange, je parle et je bois avec ma bouche.|آكل وأتكلم وأشرب بفمي.|👄
Ik heb 5 vingers aan elke hand en 5 tenen aan elke voet.|У мене по 5 пальців на кожній руці (vingers) і на кожній нозі (tenen).|I have 5 fingers on each hand and 5 toes on each foot.|J’ai 5 doigts à chaque main et 5 orteils à chaque pied.|لدي 5 أصابع في كل يد و5 أصابع في كل قدم.|🖐️
Een kind neemt 1 tablet. Een volwassene neemt 2 tabletten.|Дитина приймає 1 таблетку. Дорослий приймає 2 таблетки.|A child takes 1 tablet. An adult takes 2 tablets.|Un enfant prend 1 comprimé. Un adulte en prend 2.|يتناول الطفل قرصاً واحداً. يتناول البالغ قرصين.|💊
de volwassene – de volwassenen|дорослий – дорослі|adult|l’adulte|البالغ|🧑
`,
  invitation: `
Het spijt me, ik kan niet komen.|Мені шкода, я не можу прийти.|I’m sorry, I can’t come.|Je suis désolé, je ne peux pas venir.|آسف، لا أستطيع الحضور.|😔
Nee, het spijt me, ik ben te moe.|Ні, мені шкода, я надто втомлений.|No, I’m sorry, I’m too tired.|Non, désolé, je suis trop fatigué.|لا، آسف، أنا متعب جداً.|😴
Nee, het spijt me, ik moet koken.|Ні, мені шкода, я маю готувати.|No, I’m sorry, I have to cook.|Non, désolé, je dois cuisiner.|لا، آسف، يجب أن أطبخ.|🍲
Nee, het spijt me, ik heb geen zin.|Ні, мені шкода, я не маю бажання.|No, I’m sorry, I don’t feel like it.|Non, désolé, je n’en ai pas envie.|لا، آسف، ليست لدي رغبة.|🙅
Nee, het spijt me, ik moet poetsen.|Ні, мені шкода, я маю прибирати.|No, I’m sorry, I have to clean.|Non, désolé, je dois faire le ménage.|لا، آسف، يجب أن أنظف.|🧹
Nee, het spijt me, ik heb geen tijd.|Ні, мені шкода, я не маю часу.|No, I’m sorry, I have no time.|Non, désolé, je n’ai pas le temps.|لا، آسف، ليس لدي وقت.|⏳
Nee, het spijt me, ik kan niet: ik moet boodschappen doen.|Ні, мені шкода, я не можу: я маю робити покупки.|No, I’m sorry, I can’t: I have to do the shopping.|Non, désolé, je ne peux pas : je dois faire les courses.|لا، آسف، لا أستطيع: يجب أن أتسوق.|🛒
Bedankt voor de uitnodiging, maar ik kan niet naar het feest komen.|Дякую за запрошення, але я не можу прийти на свято.|Thanks for the invitation, but I can’t come to the party.|Merci pour l’invitation, mais je ne peux pas venir à la fête.|شكراً على الدعوة، لكنني لا أستطيع الحضور إلى الحفلة.|✉️
Waar spreken we af? Aan de ingang van de cinema.|Де зустрічаємося? Біля входу в кінотеатр.|Where shall we meet? At the entrance of the cinema.|On se retrouve où ? À l’entrée du cinéma.|أين نلتقي؟ عند مدخل السينما.|🎬
de tijd|час (вільний час, годинник)|time (free time, clock)|le temps|الوقت|⏳
de keer – drie keer|раз – три рази|time (occasion) – three times|la fois – trois fois|المرة – ثلاث مرات|🔁
de zin (geen zin hebben)|бажання (не мати бажання)|desire (not to feel like it)|l’envie (ne pas en avoir envie)|الرغبة (ليست لدي رغبة)|🙅
Ik ga morgenvroeg wandelen. Ga je mee?|Завтра рано-вранці я йду гуляти. Підеш зі мною?|I’m going for a walk early tomorrow. Are you coming?|Je vais me promener tôt demain matin. Tu viens ?|سأتمشى غداً باكراً. هل تأتي معي؟|🚶
Ik ga in het weekend zwemmen. Ga je mee?|У вихідні я йду плавати. Підеш зі мною?|I’m going swimming at the weekend. Are you coming?|Je vais nager ce week-end. Tu viens ?|سأسبح في عطلة نهاية الأسبوع. هل تأتي معي؟|🏊
Ga je mee naar de markt?|Підеш зі мною на ринок?|Are you coming to the market?|Tu viens au marché ?|هل تأتي معي إلى السوق؟|🧺
Ga je mee naar de zee?|Підеш зі мною на море?|Are you coming to the sea?|Tu viens à la mer ?|هل تأتي معي إلى البحر؟|⛵
Ik ga morgenavond naar een concert. Ga je mee?|Завтра ввечері я йду на концерт. Підеш зі мною?|Tomorrow evening I’m going to a concert. Are you coming?|Demain soir, je vais à un concert. Tu viens ?|غداً مساءً سأذهب إلى حفلة موسيقية. هل تأتي معي؟|🎵
Bij mij thuis.|У мене вдома.|At my place.|Chez moi.|في بيتي.|🏠
Aan de ingang van de cinema.|Біля входу в кінотеатр.|At the entrance of the cinema.|À l’entrée du cinéma.|عند مدخل السينما.|🎬
Nee, ik kan niet. Een andere keer misschien.|Ні, я не можу. Може, іншим разом.|No, I can’t. Another time, maybe.|Non, je ne peux pas. Une autre fois, peut-être.|لا، لا أستطيع. ربما في وقت آخر.|🙅
Het spijt me, ik heb geen tijd: ik moet werken.|Мені шкода, у мене немає часу: я мушу працювати.|I’m sorry, I have no time: I have to work.|Désolé, je n’ai pas le temps : je dois travailler.|آسف، ليس لدي وقت: يجب أن أعمل.|💼
Het spijt me, ik ben te moe.|Мені шкода, я надто втомлений.|I’m sorry, I’m too tired.|Désolé, je suis trop fatigué.|آسف، أنا متعب جداً.|😴
Ik heb geen zin. Een andere keer misschien?|У мене немає бажання. Може, іншим разом?|I don’t feel like it. Another time, maybe?|Je n’ai pas envie. Une autre fois, peut-être ?|ليست لدي رغبة. ربما في وقت آخر؟|🙅
Ik ben te moe.|Я надто втомлений.|I’m too tired.|Je suis trop fatigué.|أنا متعب جداً.|😴
`,
  plurals: `
de neusspray – de neussprays|спрей для носа – спреї для носа|nasal spray|le spray nasal|بخاخ الأنف|👃
het kind – de kinderen|дитина – діти|child – children|l’enfant – les enfants|الطفل – الأطفال|🧒
de dochter – de dochters|дочка – дочки|daughter|la fille|الابنة|👧
de zoon – de zonen|син – сини|son|le fils|الابن|👦
de croissant – de croissants|круасан – круасани|croissant|le croissant|الكرواسان|🥐
de deur – de deuren|двері – двері|door|la porte|الباب|🚪
de sleutel – de sleutels|ключ – ключі|key|la clé|المفتاح|🔑
de agenda – de agenda’s|щоденник – щоденники|diary, planner|l’agenda|المفكرة|📒
de afspraak – de afspraken|домовленість, зустріч – домовленості|appointment|le rendez-vous|الموعد|📅
de zak – de zakken|пакет, мішок – пакети|bag|le sac|الكيس|🛍️
de doos – de dozen|коробка – коробки|box|la boîte|العلبة|📦
de bloemkool – de bloemkolen|цвітна капуста|cauliflower|le chou-fleur|القرنبيط|🥦
het glas|склянка, скло|glass|le verre|الكوب|🥛
`
 };
 // Short, translated names explain the situation before introducing its Dutch title.
 // Each row: Ukrainian, English, French, Arabic; each entry: title, learning goal.
 const topicLabels = {
  comm: [['Знайомство','Вітайся, називай своє ім’я та знайомся з іншими.'],['First introductions','Say hello, give your name and meet someone new.'],['Faire connaissance','Salue, donne ton nom et fais connaissance.'],['التعارف','ألقِ التحية وعرّف بنفسك وتعرّف على الآخرين.']],
  people: [['Люди навколо','Розповідай про себе, сім’ю та людей поруч.'],['People around you','Talk about yourself, your family and people around you.'],['Les gens autour de toi','Parle de toi, de ta famille et de ton entourage.'],['الناس من حولك','تحدث عن نفسك وعائلتك والناس من حولك.']],
  nums: [['Числа, ціни й погода','Рахуй, запитуй ціну та говори про погоду.'],['Numbers, prices & weather','Count, ask about prices and talk about the weather.'],['Nombres, prix et météo','Compte, demande le prix et parle de la météo.'],['الأعداد والأسعار والطقس','عدّ واسأل عن الأسعار وتحدث عن الطقس.']],
  travelTime: [['Котра година?','Називай час і розбирайся в розкладі транспорту.'],['Telling the time','Tell the time and understand transport timetables.'],['Quelle heure est-il ?','Dis l’heure et comprends les horaires de transport.'],['كم الساعة؟','قل الوقت وافهم مواعيد المواصلات.']],
  birthday: [['День народження','Називай дати, свій вік і вітай зі святом.'],['Birthdays','Give dates, say your age and wish someone a happy birthday.'],['Les anniversaires','Donne une date, dis ton âge et souhaite un bon anniversaire.'],['عيد الميلاد','اذكر التواريخ وعمرك وهنّئ الآخرين بعيد ميلادهم.']],
  opening: [['Дні та години роботи','Дізнавайся, коли відкритий магазин і починається заняття.'],['Days & opening hours','Find out when shops open and classes begin.'],['Jours et horaires','Demande quand un magasin ouvre ou un cours commence.'],['الأيام وساعات العمل','اعرف متى تفتح المتاجر وتبدأ الدروس.']],
  forms: [['Анкети й документи','Заповнюй особисті дані та звертайся ввічливо.'],['Forms & documents','Fill in your personal details and speak politely.'],['Formulaires et documents','Remplis tes coordonnées et adresse-toi poliment aux autres.'],['الاستمارات والوثائق','املأ بياناتك الشخصية وتحدث بأدب.']],
  dag: [['Мій звичайний день','Розповідай про щоденні справи й улюблені заняття.'],['My daily routine','Talk about your day and activities you enjoy.'],['Ma journée','Parle de ta routine et de tes activités préférées.'],['يومي المعتاد','تحدث عن يومك والأنشطة التي تحبها.']],
  plans: [['Плани й запрошення','Запрошуй, домовляйся про плани та відповідай на запрошення.'],['Plans & invitations','Make plans, invite someone and reply to invitations.'],['Projets et invitations','Fais des projets, invite quelqu’un et réponds aux invitations.'],['الخطط والدعوات','ضع خططاً وادعُ الآخرين وأجب عن الدعوات.']],
  health: [['Здоров’я та лікар','Пояснюй, що болить, і записуйся до лікаря.'],['Health & the doctor','Explain what hurts and make a doctor’s appointment.'],['Santé et médecin','Explique où tu as mal et prends rendez-vous chez le médecin.'],['الصحة والطبيب','اشرح ما يؤلمك واحجز موعداً عند الطبيب.']],
  food: [['Їжа та корисні звички','Розповідай про харчування й замовляй страви в кафе.'],['Food & healthy habits','Talk about eating habits and order food at a café.'],['Alimentation et bonnes habitudes','Parle de ton alimentation et commande au café.'],['الطعام والعادات الصحية','تحدث عن عاداتك الغذائية واطلب الطعام في المقهى.']],
  shopping: [['Покупки та продукти','Складай список продуктів і купуй потрібну кількість.'],['Groceries & shopping','Make a shopping list and buy the quantities you need.'],['Courses et provisions','Fais une liste de courses et achète les bonnes quantités.'],['التسوق والمواد الغذائية','اكتب قائمة مشتريات واشترِ الكميات التي تحتاجها.']],
  grammar: [['Граматика й вимова','Додаткові тренажери: правила, дієслова та звуки.'],['Grammar & pronunciation','Extra practice with rules, verbs and sounds.'],['Grammaire et prononciation','Entraîne-toi avec les règles, les verbes et les sons.'],['القواعد والنطق','تدريبات إضافية على القواعد والأفعال والأصوات.']],
  past: [['Розповіді про минуле','Розповідай, що робив учора та що вже сталося.'],['Talking about the past','Talk about yesterday and things that have happened.'],['Raconter le passé','Raconte ta journée d’hier et ce qui s’est passé.'],['الحديث عن الماضي','تحدث عما فعلته أمس وما حدث من قبل.']],
  holiday: [['Сім’я та відпустка','Ділися спогадами про родину, подорожі та відпочинок.'],['Family & holidays','Share memories of family, trips and holidays.'],['Famille et vacances','Raconte tes souvenirs de famille, de voyages et de vacances.'],['العائلة والعطلة','شارك ذكريات العائلة والسفر والعطلات.']],
  travel: [['У дорозі','Купуй квитки та розбирайся з пересадками й затримками.'],['On the move','Buy tickets and deal with connections and delays.'],['En voyage','Achète des billets et gère les correspondances et les retards.'],['في الطريق','اشترِ التذاكر وتعامل مع تبديل القطارات والتأخير.']],
  service: [['Магазини та вживані речі','Приміряй одяг, порівнюй ціни й домовляйся про обмін.'],['Shops & second-hand finds','Try on clothes, compare prices and arrange an exchange.'],['Magasins et seconde main','Essaie des vêtements, compare les prix et demande un échange.'],['المتاجر والأشياء المستعملة','جرّب الملابس وقارن الأسعار واطلب الاستبدال.']],
  wonen: [['Оренда житла','Читай оголошення й запитуй про умови оренди.'],['Renting a home','Read adverts and ask about rental conditions.'],['Louer un logement','Lis les annonces et renseigne-toi sur les conditions de location.'],['استئجار سكن','اقرأ الإعلانات واسأل عن شروط الإيجار.']],
  contact: [['Листи та домовленості','Пиши повідомлення, записуйся онлайн і перенось зустрічі.'],['Messages & appointments','Write messages, book online and reschedule appointments.'],['Messages et rendez-vous','Écris des messages, réserve en ligne et déplace un rendez-vous.'],['الرسائل والمواعيد','اكتب رسائل واحجز عبر الإنترنت وغيّر مواعيدك.']],
  reading: [['Читаємо й реагуємо','Розумій оголошення та інструкції, знаходь потрібну інформацію.'],['Reading & responding','Understand notices and instructions and find key information.'],['Lire et réagir','Comprends les annonces et les consignes et trouve les informations utiles.'],['القراءة والتفاعل','افهم الإعلانات والتعليمات واعثر على المعلومات المهمة.']],
  grammar2: [['Граматика в розмові','Порівнюй речі та замінюй іменники займенниками.'],['Grammar in conversation','Compare things and replace nouns with pronouns.'],['La grammaire en conversation','Compare des choses et remplace les noms par des pronoms.'],['القواعد في المحادثة','قارن الأشياء واستبدل الأسماء بالضمائر.']]
 };
 function topicInfo(id,lang='uk') {
  const row=topicLabels[id];if(!row)return null;
  const [title,description]=row[{uk:0,en:1,fr:2,ar:3}[lang]??0];
  const chapter=chapters.findIndex(c=>c[0]===id),advancedIndex=advanced.findIndex(c=>c[0]===id);
  const dutch=chapter>=0?chapters[chapter][1]:advancedIndex>=0?advanced[advancedIndex][1].replace(/^\S+\s/,''):'Grammatica & uitspraak';
  return {title,description,dutch,number:chapter>=0?chapter+1:advancedIndex>=0?advancedIndex+1:null,image:`./img/topics/${id}.svg`};
 }
 // Rows: Dutch | Ukrainian | English | French | Arabic.
 const lessons = {
  alphabet: ['Алфавіт і написання імені','Alphabet and spelling','Alphabet et épellation','الأبجدية والتهجئة', `
Hoe spel je je naam?|Як пишеться твоє ім’я по літерах?|How do you spell your name?|Comment épelles-tu ton nom ?|كيف تتهجى اسمك؟
Mijn naam begint met een A.|Моє ім’я починається з A.|My name starts with an A.|Mon nom commence par un A.|يبدأ اسمي بحرف A.
Kun je dat spellen?|Можеш сказати це по літерах?|Can you spell that?|Peux-tu épeler cela ?|هل يمكنك تهجئة ذلك؟
Dat is een hoofdletter.|Це велика літера.|That is a capital letter.|C’est une majuscule.|هذا حرف كبير.
Schrijf je naam op.|Запиши своє ім’я.|Write down your name.|Écris ton nom.|اكتب اسمك.
`],
  identity: ['Особисті дані','Personal details','Informations personnelles','المعلومات الشخصية', `
Dit is mijn buurvrouw.|Це моя сусідка.|This is my neighbour.|Voici ma voisine.|هذه جارتي.
Zij komt uit Polen.|Вона з Польщі.|She comes from Poland.|Elle vient de Pologne.|هي من بولندا.
Hij woont in Gent.|Він живе в Генті.|He lives in Ghent.|Il habite à Gand.|يسكن في غنت.
Wij hebben twee kinderen.|У нас двоє дітей.|We have two children.|Nous avons deux enfants.|لدينا طفلان.
Wat is je e-mailadres?|Яка твоя електронна адреса?|What is your email address?|Quelle est ton adresse e-mail ?|ما عنوان بريدك الإلكتروني؟
`],
  prices: ['Ціни й температура','Prices and temperature','Prix et température','الأسعار ودرجة الحرارة', `
Het kost twintig euro.|Це коштує двадцять євро.|It costs twenty euros.|Cela coûte vingt euros.|ثمنه عشرون يورو.
Hoeveel kost een kaartje?|Скільки коштує квиток?|How much is a ticket?|Combien coûte un billet ?|كم ثمن التذكرة؟
Het is vandaag tien graden.|Сьогодні десять градусів.|It is ten degrees today.|Il fait dix degrés aujourd’hui.|درجة الحرارة اليوم عشر درجات.
Het regent vandaag.|Сьогодні йде дощ.|It is raining today.|Il pleut aujourd’hui.|تمطر اليوم.
Dat is samen vijftien euro.|Разом це п’ятнадцять євро.|That is fifteen euros altogether.|Cela fait quinze euros au total.|المجموع خمسة عشر يورو.
`],
  birthday: ['День народження й порядкові числа','Birthdays and ordinal numbers','Anniversaires et nombres ordinaux','أعياد الميلاد والأعداد الترتيبية', `
Wanneer verjaar jij?|Коли в тебе день народження?|When is your birthday?|Quand est ton anniversaire ?|متى عيد ميلادك؟
Ik ben dertig jaar.|Мені тридцять років.|I am thirty years old.|J’ai trente ans.|عمري ثلاثون سنة.
Ik verjaar op de derde mei.|Мій день народження третього травня.|My birthday is on the third of May.|Mon anniversaire est le trois mai.|عيد ميلادي في الثالث من مايو.
Gelukkige verjaardag!|З днем народження!|Happy birthday!|Joyeux anniversaire !|عيد ميلاد سعيد!
Op jouw gezondheid!|За твоє здоров’я!|To your health!|À ta santé !|بصحتك!
`],
  opening: ['Дні й години роботи','Days and opening hours','Jours et heures d’ouverture','الأيام وساعات العمل', `
Wanneer is de winkel open?|Коли магазин відкритий?|When is the shop open?|Quand le magasin est-il ouvert ?|متى يفتح المتجر؟
De winkel is van negen tot zes open.|Магазин відкритий з дев’ятої до шостої.|The shop is open from nine to six.|Le magasin est ouvert de neuf à six heures.|المتجر مفتوح من التاسعة إلى السادسة.
Op zondag zijn we gesloten.|У неділю ми зачинені.|We are closed on Sundays.|Nous sommes fermés le dimanche.|نحن مغلقون يوم الأحد.
De les begint om half negen.|Заняття починається о пів на дев’яту.|The lesson starts at half past eight.|Le cours commence à huit heures et demie.|يبدأ الدرس في الثامنة والنصف.
De film eindigt om tien uur.|Фільм закінчується о десятій.|The film ends at ten.|Le film se termine à dix heures.|ينتهي الفيلم في العاشرة.
Op welke dag heb je les?|У який день у тебе заняття?|On which day do you have class?|Quel jour as-tu cours ?|في أي يوم لديك درس؟
`],
  forms: ['Анкети й офіційне звертання','Forms and polite address','Formulaires et vouvoiement','الاستمارات والخطاب الرسمي', `
Wat is uw geboortedatum?|Яка ваша дата народження?|What is your date of birth?|Quelle est votre date de naissance ?|ما تاريخ ميلادك؟
Waar bent u geboren?|Де ви народилися?|Where were you born?|Où êtes-vous né ?|أين ولدت؟
Vul uw voornaam en familienaam in.|Впишіть своє ім’я та прізвище.|Fill in your first name and surname.|Indiquez votre prénom et votre nom.|اكتب اسمك الأول واسم العائلة.
Mijn postcode is drieduizend.|Мій поштовий індекс — три тисячі.|My postcode is three thousand.|Mon code postal est trois mille.|رمزي البريدي ثلاثة آلاف.
Zet hier uw handtekening.|Поставте тут свій підпис.|Sign here.|Signez ici.|وقّع هنا.
Tienduizend is 10.000.|Десять тисяч — це 10 000.|Ten thousand is 10,000.|Dix mille s’écrit 10 000.|عشرة آلاف هي ١٠٠٠٠.
`],
  invitation: ['Запрошення й вибачення','Invitations and apologies','Invitations et excuses','الدعوات والاعتذار', `
Ga je mee naar het park?|Підеш зі мною до парку?|Will you come to the park with me?|Tu viens au parc avec moi ?|هل تأتي معي إلى الحديقة؟
Ja, graag. Dat is een goed idee.|Так, із задоволенням. Це гарна ідея.|Yes, gladly. That is a good idea.|Oui, volontiers. C’est une bonne idée.|نعم بكل سرور. هذه فكرة جيدة.
Sorry, ik kan niet komen.|Вибач, я не можу прийти.|Sorry, I cannot come.|Désolé, je ne peux pas venir.|آسف، لا أستطيع المجيء.
Ik blijf thuis, want ik ben moe.|Я залишаюся вдома, бо втомився.|I am staying home because I am tired.|Je reste chez moi car je suis fatigué.|سأبقى في المنزل لأنني متعب.
Geen probleem. Tot een andere keer!|Нічого страшного. До іншого разу!|No problem. See you another time!|Pas de problème. À une prochaine fois !|لا مشكلة. إلى مرة أخرى!
`],
  ongoing: ['Що відбувається зараз','What is happening now','Ce qui se passe maintenant','ما يحدث الآن', `
Ik ben aan het koken.|Я зараз готую.|I am cooking.|Je suis en train de cuisiner.|أنا أطبخ الآن.
Wat ben je aan het doen?|Що ти зараз робиш?|What are you doing?|Qu’est-ce que tu es en train de faire ?|ماذا تفعل الآن؟
Zij is aan het lezen.|Вона зараз читає.|She is reading.|Elle est en train de lire.|هي تقرأ الآن.
We zijn aan het eten.|Ми зараз їмо.|We are eating.|Nous sommes en train de manger.|نحن نأكل الآن.
Ga maar zitten.|Сідай, будь ласка.|Please sit down.|Assieds-toi donc.|تفضل بالجلوس.
`],
  instructions: ['Інструкції й пояснення причини','Instructions and reasons','Consignes et raisons','التعليمات والأسباب', `
Ik blijf thuis omdat ik ziek ben.|Я залишаюся вдома, тому що хворий.|I am staying home because I am ill.|Je reste chez moi parce que je suis malade.|سأبقى في المنزل لأنني مريض.
Lees de bijsluiter.|Прочитай інструкцію до ліків.|Read the package leaflet.|Lis la notice.|اقرأ النشرة المرفقة.
Wat betekent deze instructie?|Що означає ця інструкція?|What does this instruction mean?|Que signifie cette consigne ?|ماذا تعني هذه التعليمات؟
Kun je een bericht doorgeven?|Можеш передати повідомлення?|Can you pass on a message?|Peux-tu transmettre un message ?|هل يمكنك نقل رسالة؟
Ik hoest en ik heb keelpijn.|Я кашляю, і в мене болить горло.|I cough and have a sore throat.|Je tousse et j’ai mal à la gorge.|أسعل وأعاني من ألم في الحلق.
`],
  healthy: ['Харчові звички й частота','Eating habits and frequency','Habitudes alimentaires et fréquence','عادات الأكل والتكرار', `
Ik eet elke dag fruit.|Я їм фрукти щодня.|I eat fruit every day.|Je mange des fruits chaque jour.|آكل الفاكهة كل يوم.
Ik drink meestal water.|Я зазвичай п’ю воду.|I usually drink water.|Je bois généralement de l’eau.|أشرب الماء عادة.
Ik eet soms vis.|Я іноді їм рибу.|I sometimes eat fish.|Je mange parfois du poisson.|آكل السمك أحياناً.
Ik eet weinig suiker.|Я їм мало цукру.|I eat little sugar.|Je mange peu de sucre.|آكل القليل من السكر.
Ik wil meer groenten en minder snoep eten.|Я хочу їсти більше овочів і менше цукерок.|I want to eat more vegetables and fewer sweets.|Je veux manger plus de légumes et moins de bonbons.|أريد أن آكل المزيد من الخضار وحلويات أقل.
Ik moet nog ontbijten.|Мені ще треба поснідати.|I still need to have breakfast.|Je dois encore prendre mon petit-déjeuner.|ما زال عليّ تناول الفطور.
`],
  restaurant: ['Замовлення в кафе','Ordering at a café','Commander au café','الطلب في المقهى', `
Mag ik de menukaart?|Можна меню?|May I have the menu?|Puis-je avoir la carte ?|هل يمكنني الحصول على قائمة الطعام؟
Ik wil graag soep.|Я хотів би суп.|I would like soup.|Je voudrais de la soupe.|أود حساءً.
Zonder melk, alstublieft.|Без молока, будь ласка.|Without milk, please.|Sans lait, s’il vous plaît.|بدون حليب من فضلك.
Ik eet geen vlees.|Я не їм м’яса.|I do not eat meat.|Je ne mange pas de viande.|لا آكل اللحم.
Mag ik de rekening?|Можна рахунок?|May I have the bill?|Puis-je avoir l’addition ?|هل يمكنني الحصول على الحساب؟
`],
  groceries: ['Продукти, упаковки й список покупок','Food, packages and shopping lists','Aliments, emballages et liste de courses','الأغذية والعبوات وقائمة التسوق', `
een fles water|пляшка води|a bottle of water|une bouteille d’eau|زجاجة ماء
een pak melk|пакет молока|a carton of milk|une brique de lait|علبة حليب
een kilo appels|кілограм яблук|a kilo of apples|un kilo de pommes|كيلوغرام من التفاح
Wat hebben we nodig?|Що нам потрібно?|What do we need?|De quoi avons-nous besoin ?|ماذا نحتاج؟
Schrijf brood op het boodschappenlijstje.|Запиши хліб у список покупок.|Write bread on the shopping list.|Écris du pain sur la liste de courses.|اكتب الخبز في قائمة التسوق.
De melk staat naast de kaas.|Молоко стоїть поруч із сиром.|The milk is next to the cheese.|Le lait est à côté du fromage.|الحليب بجانب الجبن.
Ik wil pasta maken.|Я хочу приготувати пасту.|I want to make pasta.|Je veux préparer des pâtes.|أريد تحضير المعكرونة.
`],
  plurals: ['Множина іменників','Plural nouns','Pluriel des noms','جمع الأسماء', `
één appel, twee appels|одне яблуко, два яблука|one apple, two apples|une pomme, deux pommes|تفاحة واحدة، تفاحتان
één brood, twee broden|один хліб, два хліби|one loaf, two loaves|un pain, deux pains|رغيف واحد، رغيفان
één ei, zes eieren|одне яйце, шість яєць|one egg, six eggs|un œuf, six œufs|بيضة واحدة، ست بيضات
één fles, drie flessen|одна пляшка, три пляшки|one bottle, three bottles|une bouteille, trois bouteilles|زجاجة واحدة، ثلاث زجاجات
één tomaat, vier tomaten|один помідор, чотири помідори|one tomato, four tomatoes|une tomate, quatre tomates|حبة طماطم واحدة، أربع حبات طماطم
`],
  holiday: ['Сім’я та відпустка','Family and holidays','Famille et vacances','العائلة والعطلة', `
Vorige zomer zijn we naar zee geweest.|Минулого літа ми були на морі.|Last summer we went to the seaside.|L’été dernier, nous sommes allés à la mer.|ذهبنا إلى البحر الصيف الماضي.
We hebben bij mijn zus gelogeerd.|Ми гостювали в моєї сестри.|We stayed with my sister.|Nous avons logé chez ma sœur.|أقمنا عند أختي.
Mijn ouders zijn twintig jaar getrouwd.|Мої батьки одружені двадцять років.|My parents have been married for twenty years.|Mes parents sont mariés depuis vingt ans.|والداي متزوجان منذ عشرين سنة.
Ik heb een kamer voor twee nachten geboekt.|Я забронював кімнату на дві ночі.|I booked a room for two nights.|J’ai réservé une chambre pour deux nuits.|حجزت غرفة لليلتين.
Het ontbijt was inbegrepen.|Сніданок був включений.|Breakfast was included.|Le petit-déjeuner était compris.|كان الفطور مشمولاً.
We hebben veel foto’s gemaakt.|Ми зробили багато фотографій.|We took many photos.|Nous avons pris beaucoup de photos.|التقطنا صوراً كثيرة.
Het regende, maar we hebben toch gewandeld.|Ішов дощ, але ми все одно гуляли.|It rained, but we still went for a walk.|Il pleuvait, mais nous nous sommes quand même promenés.|كانت تمطر، لكننا تمشينا رغم ذلك.
Hoe was jouw vakantie?|Як минула твоя відпустка?|How was your holiday?|Comment se sont passées tes vacances ?|كيف كانت عطلتك؟
`],
  journey: ['Квитки, пересадки й затримки','Tickets, changes and delays','Billets, correspondances et retards','التذاكر والتبديل والتأخير', `
Ik wil een heen-en-terugticket naar Brugge.|Я хочу квиток до Брюгге й назад.|I would like a return ticket to Bruges.|Je voudrais un aller-retour pour Bruges.|أريد تذكرة ذهاب وعودة إلى بروج.
Moet ik in Brussel overstappen?|Мені треба пересідати в Брюсселі?|Do I need to change in Brussels?|Dois-je changer à Bruxelles ?|هل يجب أن أبدل القطار في بروكسل؟
De trein heeft twintig minuten vertraging.|Поїзд запізнюється на двадцять хвилин.|The train is twenty minutes late.|Le train a vingt minutes de retard.|القطار متأخر عشرين دقيقة.
Ik heb mijn aansluiting gemist.|Я пропустив пересадку.|I missed my connection.|J’ai raté ma correspondance.|فاتتني رحلة الربط.
Van welk spoor vertrekt de volgende trein?|З якої колії вирушає наступний поїзд?|Which platform does the next train leave from?|De quel quai part le prochain train ?|من أي رصيف يغادر القطار القادم؟
Is dit ticket ook morgen geldig?|Цей квиток дійсний і завтра?|Is this ticket also valid tomorrow?|Ce billet est-il aussi valable demain ?|هل هذه التذكرة صالحة غداً أيضاً؟
De halte is tijdelijk verplaatst.|Зупинку тимчасово перенесено.|The stop has temporarily moved.|L’arrêt est temporairement déplacé.|تم نقل المحطة مؤقتاً.
Ik ben bij de verkeerde halte uitgestapt.|Я вийшов не на тій зупинці.|I got off at the wrong stop.|Je suis descendu au mauvais arrêt.|نزلت في المحطة الخطأ.
`],
  market: ['На ринку й у супермаркеті','At the market and supermarket','Au marché et au supermarché','في السوق والسوبرماركت', `
Hoeveel kosten deze appels per kilo?|Скільки ці яблука коштують за кілограм?|How much do these apples cost per kilo?|Combien coûtent ces pommes au kilo ?|كم ثمن هذه التفاحات للكيلوغرام؟
Mag het een halve kilo meer zijn?|Можна на пів кілограма більше?|May it be half a kilo more?|Un demi-kilo de plus, ça vous va ?|هل يمكن أن تكون الكمية أكثر بنصف كيلو؟
Deze tomaten zijn goedkoper dan die andere.|Ці помідори дешевші за ті інші.|These tomatoes are cheaper than the other ones.|Ces tomates sont moins chères que les autres.|هذه الطماطم أرخص من الأخرى.
Volgens het prijskaartje kost dit twee euro.|На ціннику написано, що це коштує два євро.|According to the price tag, this costs two euros.|Selon l’étiquette, cela coûte deux euros.|حسب بطاقة السعر، ثمن هذا يوروان.
Er staat een verkeerd bedrag op de kassabon.|У чеку вказана неправильна сума.|There is an incorrect amount on the receipt.|Il y a un montant incorrect sur le ticket de caisse.|يوجد مبلغ خاطئ في الإيصال.
Ik heb drie flessen betaald, maar ik heb er maar twee.|Я заплатив за три пляшки, але в мене лише дві.|I paid for three bottles, but I only have two.|J’ai payé trois bouteilles, mais je n’en ai que deux.|دفعت ثمن ثلاث زجاجات لكن لدي اثنتان فقط.
Is deze aanbieding nog geldig?|Ця акція ще діє?|Is this offer still valid?|Cette offre est-elle encore valable ?|هل هذا العرض ما زال سارياً؟
Kunt u dat voor mij nakijken?|Можете це для мене перевірити?|Could you check that for me?|Pouvez-vous vérifier cela pour moi ?|هل يمكنك التحقق من ذلك من أجلي؟
`],
  returns: ['Одяг, примірка й обмін','Clothes, fitting and exchanges','Vêtements, essayage et échange','الملابس والقياس والاستبدال', `
Kan ik deze jas passen?|Можна приміряти цю куртку?|Can I try on this coat?|Puis-je essayer cette veste ?|هل يمكنني قياس هذه السترة؟
Hebt u een grotere maat?|У вас є більший розмір?|Do you have a larger size?|Avez-vous une taille plus grande ?|هل لديكم مقاس أكبر؟
De mouwen zijn te kort.|Рукави закороткі.|The sleeves are too short.|Les manches sont trop courtes.|الأكمام قصيرة جداً.
Deze broek past beter.|Ці штани сидять краще.|These trousers fit better.|Ce pantalon me va mieux.|هذا البنطال أنسب لي.
Ik heb deze trui gisteren gekocht.|Я купив цей светр учора.|I bought this jumper yesterday.|J’ai acheté ce pull hier.|اشتريت هذه الكنزة أمس.
Kan ik hem omruilen?|Можна його обміняти?|Can I exchange it?|Puis-je l’échanger ?|هل يمكنني استبداله؟
Ik heb de kassabon bij me.|У мене із собою чек.|I have the receipt with me.|J’ai le ticket de caisse avec moi.|لدي الإيصال معي.
Er zit een gat in de stof.|У тканині є дірка.|There is a hole in the fabric.|Il y a un trou dans le tissu.|يوجد ثقب في القماش.
`],
  secondhand: ['Купівля вживаних речей','Buying second-hand items','Achats d’occasion','شراء الأشياء المستعملة', `
Is de fiets nog beschikbaar?|Велосипед ще є в наявності?|Is the bicycle still available?|Le vélo est-il encore disponible ?|هل الدراجة ما زالت متاحة؟
Hoe oud is hij?|Скільки йому років?|How old is it?|Quel âge a-t-il ?|كم عمرها؟
Werken de remmen goed?|Гальма добре працюють?|Do the brakes work well?|Les freins fonctionnent-ils bien ?|هل تعمل المكابح جيداً؟
Mag ik hem eerst proberen?|Можна спочатку його випробувати?|May I try it first?|Puis-je l’essayer d’abord ?|هل يمكنني تجربتها أولاً؟
Kunt u iets van de prijs afdoen?|Можете трохи знизити ціну?|Could you lower the price a little?|Pouvez-vous baisser un peu le prix ?|هل يمكنك تخفيض السعر قليلاً؟
Ik kan hem zaterdag ophalen.|Я можу забрати його в суботу.|I can collect it on Saturday.|Je peux venir le chercher samedi.|يمكنني استلامها يوم السبت.
Is de levering inbegrepen?|Доставку включено?|Is delivery included?|La livraison est-elle comprise ?|هل التوصيل مشمول؟
Ik heb de advertentie op internet gezien.|Я бачив оголошення в інтернеті.|I saw the advertisement online.|J’ai vu l’annonce sur internet.|رأيت الإعلان على الإنترنت.
`],
  messages: ['Листи й повідомлення','Letters and messages','Lettres et messages','الرسائل والمراسلات', `
Bedankt voor uw snelle antwoord.|Дякую за вашу швидку відповідь.|Thank you for your quick reply.|Merci pour votre réponse rapide.|شكراً لردكم السريع.
Ik heb het document als bijlage toegevoegd.|Я додав документ як вкладення.|I attached the document.|J’ai ajouté le document en pièce jointe.|أرفقت المستند.
Kunt u bevestigen dat u mijn bericht hebt ontvangen?|Можете підтвердити, що отримали моє повідомлення?|Could you confirm that you received my message?|Pouvez-vous confirmer que vous avez reçu mon message ?|هل يمكنك تأكيد استلام رسالتي؟
Ik reageer op uw advertentie.|Я відповідаю на ваше оголошення.|I am responding to your advertisement.|Je réponds à votre annonce.|أرد على إعلانكم.
Ik wil graag meer informatie over de cursus.|Я хотів би більше інформації про курс.|I would like more information about the course.|Je voudrais plus d’informations sur le cours.|أود مزيداً من المعلومات عن الدورة.
Helaas kan ik niet deelnemen.|На жаль, я не можу взяти участь.|Unfortunately, I cannot take part.|Malheureusement, je ne peux pas participer.|للأسف لا أستطيع المشاركة.
Ik kijk uit naar uw antwoord.|Чекаю на вашу відповідь.|I look forward to your reply.|J’attends votre réponse avec intérêt.|أتطلع إلى ردكم.
Het adres in uw bericht klopt niet.|Адреса у вашому повідомленні неправильна.|The address in your message is incorrect.|L’adresse dans votre message est incorrecte.|العنوان في رسالتكم غير صحيح.
`],
  appointments: ['Онлайн-запис і зміна зустрічі','Online bookings and changing appointments','Réservations en ligne et changement de rendez-vous','الحجز عبر الإنترنت وتغيير المواعيد', `
Ik heb online een afspraak gemaakt.|Я записався на прийом онлайн.|I made an appointment online.|J’ai pris rendez-vous en ligne.|حجزت موعداً عبر الإنترنت.
Ik heb nog geen bevestiging ontvangen.|Я ще не отримав підтвердження.|I have not received confirmation yet.|Je n’ai pas encore reçu de confirmation.|لم أتلق تأكيداً بعد.
Kan ik mijn afspraak naar vrijdag verplaatsen?|Можна перенести мій запис на п’ятницю?|Can I move my appointment to Friday?|Puis-je déplacer mon rendez-vous à vendredi ?|هل يمكنني نقل موعدي إلى الجمعة؟
Vrijdag past beter dan donderdag.|П’ятниця підходить краще, ніж четвер.|Friday suits me better than Thursday.|Vendredi me convient mieux que jeudi.|الجمعة أنسب لي من الخميس.
Ik moet annuleren omdat mijn trein niet rijdt.|Я мушу скасувати запис, бо мій поїзд не їде.|I have to cancel because my train is not running.|Je dois annuler parce que mon train ne circule pas.|يجب أن ألغي الموعد لأن قطاري لا يعمل.
Welke documenten moet ik meebrengen?|Які документи мені треба принести?|Which documents should I bring?|Quels documents dois-je apporter ?|ما المستندات التي يجب أن أحضرها؟
Ik heb het formulier al ingevuld.|Я вже заповнив анкету.|I have already filled in the form.|J’ai déjà rempli le formulaire.|لقد ملأت الاستمارة بالفعل.
De afspraak is gewijzigd.|Час зустрічі змінено.|The appointment has been changed.|Le rendez-vous a été modifié.|تم تغيير الموعد.
`],
  notices: ['Оголошення й короткі тексти','Notices and short texts','Annonces et textes courts','الإعلانات والنصوص القصيرة', `
Wegens werken is de ingang gesloten.|Через ремонт вхід зачинено.|The entrance is closed due to works.|L’entrée est fermée pour travaux.|المدخل مغلق بسبب الأشغال.
Gebruik de ingang aan de achterkant.|Користуйтеся входом із заднього боку.|Use the entrance at the back.|Utilisez l’entrée à l’arrière.|استخدم المدخل الخلفي.
Inschrijven kan tot en met vrijdag.|Зареєструватися можна до п’ятниці включно.|You can register up to and including Friday.|L’inscription est possible jusqu’à vendredi inclus.|يمكن التسجيل حتى يوم الجمعة ضمناً.
De activiteit gaat door bij slecht weer.|Захід відбудеться і за поганої погоди.|The activity will go ahead in bad weather.|L’activité aura lieu même en cas de mauvais temps.|سيقام النشاط حتى في الطقس السيئ.
Kinderen onder twaalf jaar betalen niet.|Діти до дванадцяти років не платять.|Children under twelve do not pay.|Les enfants de moins de douze ans ne paient pas.|الأطفال دون الثانية عشرة لا يدفعون.
Neem zelf een lunchpakket mee.|Візьміть із собою обід.|Bring your own packed lunch.|Apportez votre pique-nique.|أحضر وجبة غدائك معك.
Ik wil graag op dit bericht reageren.|Я хотів би відповісти на це повідомлення.|I would like to reply to this message.|Je voudrais répondre à ce message.|أود الرد على هذه الرسالة.
Waar kan ik de volledige informatie vinden?|Де знайти повну інформацію?|Where can I find the full information?|Où puis-je trouver toutes les informations ?|أين أجد المعلومات الكاملة؟
`],
  directions: ['Послідовність дій та інструкції','Sequences and instructions','Étapes et consignes','تسلسل الخطوات والتعليمات', `
Eerst kies je een datum, daarna een uur.|Спочатку обираєш дату, потім час.|First choose a date, then a time.|Choisis d’abord une date, puis une heure.|اختر أولاً تاريخاً ثم وقتاً.
Klik op de link om te bevestigen.|Натисніть посилання, щоб підтвердити.|Click the link to confirm.|Cliquez sur le lien pour confirmer.|اضغط على الرابط للتأكيد.
Bewaar de bevestiging op je telefoon.|Збережи підтвердження на телефоні.|Save the confirmation on your phone.|Enregistre la confirmation sur ton téléphone.|احفظ التأكيد على هاتفك.
Je moet het formulier vóór maandag opsturen.|Треба надіслати анкету до понеділка.|You must send the form before Monday.|Tu dois envoyer le formulaire avant lundi.|يجب إرسال الاستمارة قبل الاثنين.
Als je klaar bent, druk je op verzenden.|Коли закінчиш, натисни «надіслати».|When you are ready, press send.|Quand tu as terminé, appuie sur envoyer.|عندما تنتهي اضغط على إرسال.
Ik begrijp de laatste stap niet.|Я не розумію останнього кроку.|I do not understand the last step.|Je ne comprends pas la dernière étape.|لا أفهم الخطوة الأخيرة.
Kunt u het nog eens uitleggen?|Можете пояснити ще раз?|Could you explain it again?|Pouvez-vous l’expliquer encore une fois ?|هل يمكنك شرح ذلك مرة أخرى؟
Daarna krijg je een bevestigingsmail.|Після цього отримаєш лист-підтвердження.|After that you receive a confirmation email.|Ensuite, tu reçois un e-mail de confirmation.|بعد ذلك تصلك رسالة تأكيد.
`],
  comparison: ['Порівняння й вибір','Comparing and choosing','Comparer et choisir','المقارنة والاختيار', `
Deze jas is goedkoper dan die jas.|Ця куртка дешевша за ту.|This coat is cheaper than that coat.|Cette veste est moins chère que celle-là.|هذه السترة أرخص من تلك.
De trein is sneller dan de bus.|Поїзд швидший за автобус.|The train is faster than the bus.|Le train est plus rapide que le bus.|القطار أسرع من الحافلة.
Dit is de goedkoopste kamer.|Це найдешевша кімната.|This is the cheapest room.|C’est la chambre la moins chère.|هذه أرخص غرفة.
Ik reis liever met de trein.|Я волію подорожувати поїздом.|I prefer travelling by train.|Je préfère voyager en train.|أفضل السفر بالقطار.
Deze tas is even groot als die tas.|Ця сумка така сама велика, як та.|This bag is as big as that bag.|Ce sac est aussi grand que celui-là.|هذه الحقيبة بحجم تلك الحقيبة.
Ik vind de blauwe mooier.|Мені більше подобається синя.|I think the blue one is prettier.|Je trouve la bleue plus jolie.|أجد الزرقاء أجمل.
`]
 };

 // One picture per lesson card, in line order (replaces the generic 📖).
 const lessonIcons = {
  alphabet:'🔤 🅰️ 🗣️ 🔠 ✍️', identity:'👩 🌍 🏙️ 🧒 📧', prices:'💶 🎫 🌡️ 🌧️ 🧾',
  birthday:'🎂 🎈 📅 🎉 🥂', opening:'🏪 🕘 🚫 📚 🎬 📅', forms:'📅 📍 📝 📮 ✍️ 🔢',
  invitation:'🌳 👍 🙅 🏠 👋', ongoing:'🍳 ❓ 📖 🍽️ 🪑', instructions:'🤒 💊 ❓ 📨 😷',
  healthy:'🍎 💧 🐟 🥄 🥗 🍳', restaurant:'📋 🍲 🥛 🥩 🧾', groceries:'💧 🥛 🍏 🛒 📝 🧀 🍝',
  plurals:'🍎 🍞 🥚 🧴 🍅', holiday:'🏖️ 👭 💍 🏨 🥐 📸 🌧️ 🧳', journey:'🎫 🔄 ⏱️ 🏃 🚉 ✅ 🚏 🚌',
  market:'🍏 ⚖️ 🍅 🏷️ 🧾 🧴 🛍️ 🔍', returns:'🧥 📏 👕 👖 🧶 🔁 🧾 🕳️', secondhand:'🚲 ⏳ 🛑 🚴 💸 🗓️ 🚚 💻',
  messages:'🙏 📎 ✅ 📰 🎓 😞 📬 📍', appointments:'💻 📩 📅 🗓️ 🚆 📂 📝 🔄', notices:'🚧 🚪 📝 🌧️ 🧒 🥪 💬 ℹ️',
  directions:'📅 🖱️ 📱 📮 📤 🤔 🔁 📧', comparison:'🧥 🚆 🛏️ 🚂 👜 🔵'
 };
 // ---- Course A1.2, part 2 (Nov 2026): everyday life in Flanders. ----
 // Original Leren.be material written against the CEFR A1→A2 "Waystage" goals used for NT2 richtgraad 1.2
 // (short sentences about immediate needs: home, work, health, local services, school, free time, people, plans).
 // Lesson line: nl|uk|en|fr|ar|icon|example nl|example uk. Icons come from the verified 3D set (modules/emoji/cards.js).
 const a12 = {
  // New chapters 9–16 follow the eight existing A1.2 chapters; existing chapters only gain tabs (wonen, travel, grammar2).
  chapters: [
   ['daily','🧺 Thuis en dagelijks leven',['chores','weekplan']],
   ['work','💼 Werk en beroep',['werkplek','solliciteren']],
   ['zorg','🩺 Zorg en apotheek',['apotheek','huisarts']],
   ['stad','🗺️ De weg in de stad',['orientatie','diensten']],
   ['school','🎒 School en opleiding',['schoolwoorden','oudercontact']],
   ['vrijetijd','⚽ Vrije tijd',['clubs','weekend']],
   ['sociaal','🤝 Contact met mensen',['gevoelens','buren']],
   ['future','🔜 Plannen voor later',['tijdwoorden','plannen']]
  ],
  extraTabs: {wonen:['woning','huisbaas'],travel:['openbaar'],grammar2:['omdat','scheidbaar']},
  labels: {
   daily: [['Побут і повсякденне життя','Розповідай про хатні справи, розподіляй обов’язки й плануй тиждень.'],['Home life & daily tasks','Talk about chores, share tasks and plan your week.'],['Vie quotidienne et tâches ménagères','Parle des tâches ménagères, partage-les et organise ta semaine.'],['الحياة اليومية والأعمال المنزلية','تحدث عن الأعمال المنزلية ووزّع المهام وخطط لأسبوعك.']],
   work: [['Робота й професії','Шукай роботу, розповідай про досвід і домовляйся про графік.'],['Work & jobs','Look for work, talk about your experience and agree on a schedule.'],['Travail et métiers','Cherche du travail, parle de ton expérience et organise ton horaire.'],['العمل والمهن','ابحث عن عمل وتحدث عن خبرتك واتفق على جدول العمل.']],
   zorg: [['Здоров’я: аптека й лікар','Купуй ліки, розумій рецепт і знай, куди звертатися в Бельгії.'],['Health: pharmacy & GP','Buy medicine, understand a prescription and know where to go in Belgium.'],['Santé : pharmacie et généraliste','Achète des médicaments, comprends une ordonnance et sache où aller en Belgique.'],['الصحة: الصيدلية والطبيب','اشترِ الأدوية وافهم الوصفة واعرف أين تذهب في بلجيكا.']],
   stad: [['Місто й орієнтування','Питай дорогу, пояснюй маршрут і знаходь міські служби.'],['Finding your way in town','Ask the way, explain a route and find local services.'],['S’orienter en ville','Demande ton chemin, explique un itinéraire et trouve les services de la ville.'],['التنقل في المدينة','اسأل عن الطريق واشرح المسار واعثر على خدمات المدينة.']],
   school: [['Школа й навчання','Розумій шкільні листи, говори з учителем і записуйся на курси.'],['School & learning','Understand school letters, talk to the teacher and sign up for courses.'],['École et formation','Comprends les lettres de l’école, parle avec l’enseignant et inscris-toi à un cours.'],['المدرسة والتعلم','افهم رسائل المدرسة وتحدث مع المعلم وسجّل في الدورات.']],
   vrijetijd: [['Дозвілля','Розповідай про хобі, записуйся в клуб і плануй вихідні.'],['Free time','Talk about hobbies, join a club and plan your weekend.'],['Loisirs','Parle de tes loisirs, inscris-toi dans un club et organise ton week-end.'],['أوقات الفراغ','تحدث عن هواياتك وانضم إلى نادٍ وخطط لعطلة نهاية الأسبوع.']],
   sociaal: [['Спілкування з людьми','Знайомся із сусідами, говори про почуття, проси й пропонуй допомогу.'],['Getting along with people','Meet neighbours, talk about feelings, ask for and offer help.'],['Les contacts avec les gens','Rencontre tes voisins, parle de tes sentiments, demande et propose de l’aide.'],['التواصل مع الناس','تعرّف على جيرانك وتحدث عن مشاعرك واطلب المساعدة وقدّمها.']],
   future: [['Плани на майбутнє','Розповідай про плани, мрії й наступні кроки в Бельгії.'],['Plans for the future','Talk about plans, wishes and next steps in Belgium.'],['Projets d’avenir','Parle de tes projets, de tes souhaits et de tes prochaines étapes en Belgique.'],['خطط للمستقبل','تحدث عن خططك وأمنياتك وخطواتك القادمة في بلجيكا.']]
  },
  lessons: {
   chores: ['Хатні справи','Household chores','Tâches ménagères','الأعمال المنزلية', `
de was ophangen|розвішувати білизну|to hang out the washing|étendre le linge|نشر الغسيل|🧺|Bij mooi weer hang ik de was buiten op.|У гарну погоду я розвішую білизну надворі.
de afwas doen|мити посуд|to do the dishes|faire la vaisselle|غسل الأطباق|🍽️|Wie doet vandaag de afwas?|Хто сьогодні миє посуд?
de vaatwasmachine leegmaken|розвантажувати посудомийку|to empty the dishwasher|vider le lave-vaisselle|تفريغ غسالة الصحون|🧹|Wie maakt de vaatwasmachine leeg?|Хто розвантажить посудомийку?
kuisen|прибирати, чистити (у Фландрії)|to clean (Flemish)|nettoyer (en Flandre)|ينظّف (في فلاندرز)|🧽|Ik kuis de badkamer elke week.|Я прибираю ванну щотижня.
het bed opmaken|застеляти ліжко|to make the bed|faire le lit|ترتيب السرير|🛏️|De kinderen maken zelf hun bed op.|Діти самі застеляють ліжка.
de vuilniszak buitenzetten|виставляти пакет зі сміттям|to put the rubbish bag out|sortir le sac poubelle|إخراج كيس القمامة|🚪|Op dinsdagavond zet ik de vuilniszak buiten.|У вівторок увечері я виставляю пакет зі сміттям.
de planten water geven|поливати рослини|to water the plants|arroser les plantes|سقي النباتات|🌱|Kun jij de planten water geven?|Можеш полити рослини?
de was opplooien|складати білизну|to fold the laundry|plier le linge|طيّ الملابس|👕|Na het drogen plooi ik de was op.|Після сушіння я складаю білизну.
`],
   weekplan: ['Мій тиждень і обов’язки','My week and tasks','Ma semaine et mes tâches','أسبوعي ومهامي', `
Wie doet deze week de boodschappen?|Хто цього тижня робить покупки?|Who is doing the shopping this week?|Qui fait les courses cette semaine ?|من سيتسوق هذا الأسبوع؟|🛒
Ik kook vandaag en jij doet de afwas.|Сьогодні я готую, а ти миєш посуд.|I’m cooking today and you’re doing the dishes.|Aujourd’hui je cuisine et toi, tu fais la vaisselle.|أنا أطبخ اليوم وأنت تغسل الأطباق.|🍳
Ik heb de hele ochtend gepoetst.|Я прибирав увесь ранок.|I cleaned all morning.|J’ai fait le ménage toute la matinée.|نظّفت طوال الصباح.|🧽
Op woensdagmiddag hebben de kinderen geen school.|У середу після обіду в дітей немає уроків.|On Wednesday afternoons the children have no school.|Le mercredi après-midi, les enfants n’ont pas école.|بعد ظهر الأربعاء لا يذهب الأطفال إلى المدرسة.|🏫
Ik heb weinig tijd, want ik werk tot zes uur.|У мене мало часу, бо я працюю до шостої.|I have little time because I work until six.|J’ai peu de temps, car je travaille jusqu’à six heures.|لدي وقت قليل لأنني أعمل حتى السادسة.|⏳
Morgen moet ik de vuilniszak buitenzetten.|Завтра мені треба виставити пакет зі сміттям.|Tomorrow I have to put the rubbish bag out.|Demain, je dois sortir le sac poubelle.|غداً يجب أن أُخرج كيس القمامة.|🚪
Na het werk haal ik de kinderen op.|Після роботи я забираю дітей.|After work I pick up the children.|Après le travail, je vais chercher les enfants.|بعد العمل أُحضر الأطفال.|🧒
In het weekend rust ik uit.|На вихідних я відпочиваю.|At the weekend I rest.|Le week-end, je me repose.|في عطلة نهاية الأسبوع أرتاح.|😌
`],
   werkplek: ['На роботі','At work','Au travail','في العمل', `
de werkgever|роботодавець|employer|l’employeur|صاحب العمل|🧑‍💼|Mijn werkgever is tevreden over mij.|Мій роботодавець задоволений мною.
de werkkledij|робочий одяг|work clothes|les vêtements de travail|ملابس العمل|👔|Op het werk draag ik werkkledij.|На роботі я ношу робочий одяг.
het loon|зарплата|wage|le salaire|الأجر|💶|Het loon komt aan het einde van de maand.|Зарплата приходить у кінці місяця.
het uurrooster|графік роботи|work schedule|l’horaire|جدول الدوام|🗓️|Ik krijg mijn uurrooster op vrijdag.|Я отримую графік роботи в п’ятницю.
de vroege ploeg|рання зміна|early shift|l’équipe du matin|الوردية الصباحية|⏰|Deze week werk ik in de vroege ploeg.|Цього тижня я працюю в ранню зміну.
het interimkantoor|кадрове агентство|temp agency|l’agence d’intérim|وكالة التوظيف المؤقت|🏢|Ik heb werk gevonden via een interimkantoor.|Я знайшов роботу через кадрове агентство.
de VDAB|VDAB, служба зайнятості Фландрії|VDAB, the Flemish employment service|le VDAB, le service flamand de l’emploi|VDAB، مكتب التشغيل الفلمنكي|💼|Ik heb een afspraak bij de VDAB.|У мене зустріч у VDAB.
het sollicitatiegesprek|співбесіда|job interview|l’entretien d’embauche|مقابلة العمل|🤝|Mijn sollicitatiegesprek is morgen om tien uur.|Моя співбесіда завтра о десятій.
`],
   solliciteren: ['Пошук роботи й співбесіда','Job search and interviews','Recherche d’emploi et entretien','البحث عن عمل والمقابلة', `
Ik zoek werk in een winkel.|Я шукаю роботу в магазині.|I’m looking for work in a shop.|Je cherche du travail dans un magasin.|أبحث عن عمل في متجر.|🔍
Ik heb drie jaar in een winkel gewerkt.|Я три роки працював у магазині.|I worked in a shop for three years.|J’ai travaillé trois ans dans un magasin.|عملت ثلاث سنوات في متجر.|🏪
In Oekraïne was ik verpleegster.|В Україні я була медсестрою.|In Ukraine I was a nurse.|En Ukraine, j’étais infirmière.|في أوكرانيا كنت ممرضة.|🧑‍⚕️
Ik kan ook in het weekend werken.|Я можу працювати й на вихідних.|I can also work at the weekend.|Je peux aussi travailler le week-end.|أستطيع العمل في عطلة نهاية الأسبوع أيضاً.|🗓️
Hoeveel uur per week is het?|Скільки це годин на тиждень?|How many hours a week is it?|C’est combien d’heures par semaine ?|كم ساعة في الأسبوع؟|⏱️
Ik spreek Oekraïens, Engels en een beetje Nederlands.|Я говорю українською, англійською й трохи нідерландською.|I speak Ukrainian, English and a little Dutch.|Je parle ukrainien, anglais et un peu néerlandais.|أتكلم الأوكرانية والإنجليزية وقليلاً من الهولندية.|🗣️
Ik ben ziek. Ik bel mijn werkgever voor negen uur.|Я захворів. Я дзвоню роботодавцю до дев’ятої.|I’m ill. I call my employer before nine.|Je suis malade. J’appelle mon employeur avant neuf heures.|أنا مريض. أتصل بصاحب العمل قبل التاسعة.|📞
Wanneer kan ik beginnen?|Коли я можу почати?|When can I start?|Quand est-ce que je peux commencer ?|متى يمكنني أن أبدأ؟|🏁
`],
   apotheek: ['В аптеці','At the pharmacy','À la pharmacie','في الصيدلية', `
de apotheker|фармацевт|pharmacist|le pharmacien|الصيدلي|💊|De apotheker legt alles goed uit.|Фармацевт усе добре пояснює.
de hoestsiroop|сироп від кашлю|cough syrup|le sirop contre la toux|شراب السعال|🥄|Neem twee keer per dag een lepel hoestsiroop.|Приймай ложку сиропу від кашлю двічі на день.
de wachtapotheek|чергова аптека|on-duty pharmacy|la pharmacie de garde|الصيدلية المناوبة|🌃|Op zondag ga ik naar de wachtapotheek.|У неділю я йду в чергову аптеку.
het ziekenfonds|лікарняна каса|health insurance fund|la mutuelle|صندوق التأمين الصحي|🪪|Het ziekenfonds betaalt een deel terug.|Лікарняна каса повертає частину грошей.
de spoed|відділення невідкладної допомоги|emergency department|les urgences|قسم الطوارئ|🏥|Na een ongeval ga je naar de spoed.|Після нещасного випадку їдуть у відділення невідкладної допомоги.
de bijsluiter|інструкція до ліків|package leaflet|la notice|نشرة الدواء|📑|Lees eerst de bijsluiter.|Спочатку прочитай інструкцію.
de zalf|мазь|ointment|la pommade|المرهم|🧴|Smeer de zalf twee keer per dag.|Намащуй мазь двічі на день.
het ziektebriefje|лікарняна довідка|sick note|le certificat médical|الشهادة المرضية|📄|De dokter schrijft een ziektebriefje voor drie dagen.|Лікар виписує лікарняну довідку на три дні.
`],
   huisarts: ['У лікаря й у терміновій ситуації','At the GP and in an emergency','Chez le médecin et en urgence','عند الطبيب وفي الطوارئ', `
Ik heb sinds gisteren keelpijn.|У мене з учора болить горло.|I’ve had a sore throat since yesterday.|J’ai mal à la gorge depuis hier.|أعاني من ألم في الحلق منذ أمس.|😷
Ik ben drie dagen ziek geweest.|Я хворів три дні.|I was ill for three days.|J’ai été malade pendant trois jours.|كنت مريضاً ثلاثة أيام.|🤒
Hebt u iets tegen hoest?|У вас є щось від кашлю?|Do you have something for a cough?|Avez-vous quelque chose contre la toux ?|هل لديك شيء للسعال؟|💊
Moet ik dit voor of na het eten nemen?|Мені це приймати до чи після їжі?|Should I take this before or after eating?|Dois-je le prendre avant ou après le repas ?|هل أتناوله قبل الأكل أم بعده؟|🍽️
Ik heb een ziektebriefje nodig voor mijn werk.|Мені потрібна лікарняна довідка для роботи.|I need a sick note for my work.|J’ai besoin d’un certificat médical pour mon travail.|أحتاج شهادة مرضية لعملي.|📝
Bel 112 bij een ongeval of brand.|Телефонуй 112 у разі нещасного випадку чи пожежі.|Call 112 in case of an accident or fire.|Appelle le 112 en cas d’accident ou d’incendie.|اتصل بالرقم 112 عند وقوع حادث أو حريق.|📞
De dokter heeft mij een voorschrift gegeven.|Лікар дав мені рецепт.|The doctor gave me a prescription.|Le médecin m’a donné une ordonnance.|أعطاني الطبيب وصفة طبية.|🩺
Wanneer heeft de dokter raadpleging?|Коли в лікаря прийом?|When does the doctor see patients?|Quand le médecin a-t-il ses consultations ?|متى يستقبل الطبيب المرضى؟|🕘
`],
   orientatie: ['Дорога й напрямки','Directions','Les directions','الاتجاهات', `
de verkeerslichten|світлофор|traffic lights|les feux|إشارات المرور|🚦|Aan de verkeerslichten ga je rechtdoor.|Біля світлофора йдеш прямо.
linksaf|ліворуч (повернути)|(turn) left|(tourner) à gauche|(انعطف) يساراً|⬅️|Sla daar linksaf.|Поверніть там ліворуч.
rechtsaf|праворуч (повернути)|(turn) right|(tourner) à droite|(انعطف) يميناً|➡️|Aan de bakker sla je rechtsaf.|Біля пекарні повертаєш праворуч.
het kruispunt|перехрестя|crossroads|le carrefour|التقاطع|🛣️|Aan het kruispunt ga je links.|На перехресті йдеш ліворуч.
de hoek|ріг вулиці|corner|le coin|الزاوية|📍|De apotheek is op de hoek.|Аптека на розі.
tegenover|навпроти|opposite|en face de|مقابل|🏛️|Het gemeentehuis is tegenover de kerk.|Будинок громади навпроти церкви.
de rotonde|кругова розв’язка|roundabout|le rond-point|الدوّار|🔄|Neem de tweede afslag op de rotonde.|На круговій розв’язці з’їжджай на другому з’їзді.
voorbij|за (проминувши)|past|après, plus loin que|بعد (تجاوز)|🚶|Het station is net voorbij de brug.|Вокзал одразу за мостом.
`],
   diensten: ['Міські служби','Local services','Les services de la ville','خدمات المدينة', `
Waar is het gemeentehuis?|Де будинок громади?|Where is the town hall?|Où est la maison communale ?|أين مبنى البلدية؟|🏛️
Is het ver te voet?|Це далеко пішки?|Is it far on foot?|C’est loin à pied ?|هل هو بعيد سيراً على الأقدام؟|🚶
Het is ongeveer tien minuten wandelen.|Це приблизно десять хвилин пішки.|It’s about a ten-minute walk.|C’est à environ dix minutes à pied.|إنه حوالي عشر دقائق سيراً.|⏱️
Ik moet een nieuwe identiteitskaart aanvragen.|Мені треба подати заяву на нову ID-картку.|I need to apply for a new identity card.|Je dois demander une nouvelle carte d’identité.|يجب أن أطلب بطاقة هوية جديدة.|🪪
Het containerpark is op zondag gesloten.|Контейнерний парк у неділю зачинений.|The recycling centre is closed on Sundays.|Le parc à conteneurs est fermé le dimanche.|مركز إعادة التدوير مغلق يوم الأحد.|🚫
In de bibliotheek kun je boeken lenen.|У бібліотеці можна позичати книжки.|At the library you can borrow books.|À la bibliothèque, on peut emprunter des livres.|في المكتبة يمكنك استعارة الكتب.|📚
Neem een nummertje en wacht even.|Візьміть номерок і трохи зачекайте.|Take a number and wait a moment.|Prenez un ticket et attendez un peu.|خذ رقماً وانتظر قليلاً.|🎫
Ik ben verkeerd gelopen. Kunt u mij helpen?|Я заблукав. Можете мені допомогти?|I’ve gone the wrong way. Can you help me?|Je me suis trompé de chemin. Pouvez-vous m’aider ?|أخطأت الطريق. هل يمكنك مساعدتي؟|🗺️
`],
   schoolwoorden: ['Школа дітей','Children’s school','L’école des enfants','مدرسة الأطفال', `
de juf|учителька (у початковій школі)|teacher (woman, primary school)|la maîtresse|المعلّمة|👩|De juf van mijn dochter heet Els.|Учительку моєї доньки звати Елс.
de meester|учитель (у початковій школі)|teacher (man, primary school)|le maître|المعلّم|👨‍🏫|De meester geeft veel huiswerk.|Учитель задає багато домашніх завдань.
het rapport|табель з оцінками|school report|le bulletin|بطاقة العلامات|📊|Voor Kerstmis krijgen de kinderen hun rapport.|Перед Різдвом діти отримують табель.
het oudercontact|зустріч батьків з учителем|parent-teacher meeting|la réunion parents-professeurs|اجتماع أولياء الأمور|👪|Het oudercontact is op dinsdagavond.|Зустріч батьків з учителем у вівторок увечері.
de refter|шкільна їдальня|school dining hall|le réfectoire|مقصف المدرسة|🍴|Mijn zoon eet 's middags in de refter.|Мій син обідає в шкільній їдальні.
de opvang|група продовженого дня|after-school care|la garderie|الرعاية بعد المدرسة|🧒|Na school gaat mijn dochter naar de opvang.|Після школи донька йде в групу продовженого дня.
de boekentas|шкільний рюкзак|school bag|le cartable|الحقيبة المدرسية|🎒|Vergeet je boekentas niet!|Не забудь свій рюкзак!
de schoolreis|шкільна екскурсія|school trip|l’excursion scolaire|الرحلة المدرسية|🚌|De schoolreis kost twaalf euro.|Шкільна екскурсія коштує дванадцять євро.
`],
   oudercontact: ['Розмова з учителем і курси','Talking to the teacher and courses','Parler à l’enseignant et cours','التحدث مع المعلم والدورات', `
Mijn zoon is vandaag ziek. Hij komt niet naar school.|Мій син сьогодні хворий. Він не прийде до школи.|My son is ill today. He isn’t coming to school.|Mon fils est malade aujourd’hui. Il ne vient pas à l’école.|ابني مريض اليوم. لن يأتي إلى المدرسة.|🤒
Hoe gaat het met mijn dochter in de klas?|Як справи в моєї доньки в класі?|How is my daughter doing in class?|Comment va ma fille en classe ?|كيف حال ابنتي في الصف؟|🏫
Hij werkt goed mee, maar hij praat te veel.|Він добре працює на уроці, але забагато розмовляє.|He works well, but he talks too much.|Il participe bien, mais il parle trop.|يشارك جيداً، لكنه يتكلم كثيراً.|💬
Moet ik dit briefje ondertekenen?|Мені треба підписати цей лист?|Do I have to sign this note?|Dois-je signer ce mot ?|هل يجب أن أوقّع هذه الورقة؟|✍️
De kinderen moeten om half negen op school zijn.|Діти мають бути в школі о пів на дев’яту.|The children have to be at school at half past eight.|Les enfants doivent être à l’école à huit heures et demie.|يجب أن يكون الأطفال في المدرسة في الثامنة والنصف.|🕣
Ik wil me inschrijven voor een cursus Nederlands.|Я хочу записатися на курс нідерландської.|I want to sign up for a Dutch course.|Je veux m’inscrire à un cours de néerlandais.|أريد التسجيل في دورة لغة هولندية.|📝
De les begint om zeven uur 's avonds.|Заняття починається о сьомій вечора.|The lesson starts at seven in the evening.|Le cours commence à sept heures du soir.|يبدأ الدرس في السابعة مساءً.|🕖
Ik heb mijn huiswerk niet gemaakt, want ik was ziek.|Я не зробив домашнє завдання, бо хворів.|I didn’t do my homework because I was ill.|Je n’ai pas fait mes devoirs, car j’étais malade.|لم أنجز واجبي لأنني كنت مريضاً.|📓
`],
   clubs: ['Хобі та клуби','Hobbies and clubs','Loisirs et clubs','الهوايات والأندية', `
de sportclub|спортивний клуб|sports club|le club de sport|النادي الرياضي|⚽|Mijn zoon voetbalt bij een sportclub.|Мій син грає у футбол у спортивному клубі.
het lidgeld|членський внесок|membership fee|la cotisation|رسوم العضوية|💶|Het lidgeld is honderd euro per jaar.|Членський внесок — сто євро на рік.
het zwembad|басейн|swimming pool|la piscine|المسبح|🏊|Op zaterdag gaan we naar het zwembad.|У суботу ми йдемо в басейн.
de vereniging|товариство, об’єднання|association|l’association|الجمعية|🧑‍🤝‍🧑|Ik ben lid van een Oekraïense vereniging.|Я член українського товариства.
het concert|концерт|concert|le concert|الحفل الموسيقي|🎵|Het concert begint om acht uur.|Концерт починається о восьмій.
de fietstocht|велопрогулянка|bike ride|la balade à vélo|جولة بالدراجة|🚴|Zondag maken we een fietstocht.|У неділю ми їдемо на велопрогулянку.
de tentoonstelling|виставка|exhibition|l’exposition|المعرض|🏛️|De tentoonstelling is tot eind mei open.|Виставка відкрита до кінця травня.
de dansles|урок танців|dance class|le cours de danse|درس الرقص|💃|Mijn dochter volgt dansles op woensdag.|Моя донька ходить на танці в середу.
`],
   weekend: ['Вихідні й вільний час','Weekends and free time','Week-end et temps libre','عطلة نهاية الأسبوع ووقت الفراغ', `
Wat doe je graag in je vrije tijd?|Що ти любиш робити у вільний час?|What do you like doing in your free time?|Qu’aimes-tu faire pendant ton temps libre ?|ماذا تحب أن تفعل في وقت فراغك؟|❓
Ik sport twee keer per week.|Я займаюся спортом двічі на тиждень.|I do sport twice a week.|Je fais du sport deux fois par semaine.|أمارس الرياضة مرتين في الأسبوع.|🏋️
Vorig weekend hebben we een fietstocht gemaakt.|Минулих вихідних ми їздили на велопрогулянку.|Last weekend we went on a bike ride.|Le week-end dernier, nous avons fait une balade à vélo.|في عطلة نهاية الأسبوع الماضية قمنا بجولة بالدراجة.|🚴
Hoe kan ik me inschrijven bij de club?|Як мені записатися в клуб?|How can I join the club?|Comment puis-je m’inscrire au club ?|كيف يمكنني التسجيل في النادي؟|📝
Ik vind zwemmen leuker dan lopen.|Мені плавати подобається більше, ніж бігати.|I like swimming more than running.|J’aime mieux nager que courir.|أحب السباحة أكثر من الجري.|🏊
Ga je zaterdag mee naar het concert?|Підеш зі мною в суботу на концерт?|Are you coming to the concert with me on Saturday?|Tu viens au concert avec moi samedi ?|هل تأتي معي إلى الحفل يوم السبت؟|🎵
De tickets zijn uitverkocht.|Квитки розпродані.|The tickets are sold out.|Les billets sont épuisés.|نفدت التذاكر.|🎟️
Ik blijf liever thuis met een goed boek.|Я краще залишуся вдома з гарною книжкою.|I’d rather stay at home with a good book.|Je préfère rester à la maison avec un bon livre.|أفضّل البقاء في البيت مع كتاب جيد.|📖
`],
   gevoelens: ['Почуття й настрій','Feelings and mood','Sentiments et humeur','المشاعر والمزاج', `
opgelucht|відчуває полегшення|relieved|soulagé|مرتاح البال|😌|Ik ben opgelucht, want mijn zoon is weer gezond.|Мені полегшало, бо мій син знову здоровий.
boos|сердитий|angry|fâché|غاضب|👎|Mijn buurman is boos, want de muziek is te luid.|Мій сусід сердиться, бо музика надто гучна.
ongerust|стурбований|worried|inquiet|قلق|😔|Ik ben ongerust over mijn familie in Oekraïne.|Я хвилююся за свою родину в Україні.
zenuwachtig|знервований|nervous|nerveux|متوتر|🤞|Voor het examen ben ik zenuwachtig.|Перед іспитом я нервую.
tevreden|задоволений|satisfied|satisfait|راضٍ|👍|Ik ben tevreden over mijn cursus.|Я задоволений своїм курсом.
teleurgesteld|розчарований|disappointed|déçu|خائب الأمل|😞|Hij is teleurgesteld, want hij heeft de job niet gekregen.|Він розчарований, бо не отримав роботу.
verrast|здивований|surprised|surpris|متفاجئ|🎁|Ik ben verrast, want mijn buren hebben een taart gebracht.|Я здивований, бо сусіди принесли торт.
eenzaam|самотній|lonely|seul, isolé|وحيد|👤|In het begin was ik soms eenzaam.|Спочатку мені іноді було самотньо.
`],
   buren: ['Сусіди й допомога','Neighbours and help','Voisins et entraide','الجيران والمساعدة', `
Dag, ik ben uw nieuwe buurvrouw. Ik heet Olena.|Добрий день, я ваша нова сусідка. Мене звати Олена.|Hello, I’m your new neighbour. My name is Olena.|Bonjour, je suis votre nouvelle voisine. Je m’appelle Olena.|مرحباً، أنا جارتكم الجديدة. اسمي أولينا.|👋
Kunt u dit pakje voor mij aannemen?|Можете прийняти цю посилку за мене?|Could you take in this parcel for me?|Pourriez-vous réceptionner ce colis pour moi ?|هل يمكنك استلام هذا الطرد نيابة عني؟|📦
Zal ik je helpen met de boodschappen?|Допомогти тобі з покупками?|Shall I help you with the shopping?|Je t’aide à porter les courses ?|هل أساعدك في حمل المشتريات؟|🤝
Dat is heel vriendelijk van u.|Це дуже люб’язно з вашого боку.|That’s very kind of you.|C’est très gentil de votre part.|هذا لطف كبير منك.|🙏
Sorry voor het lawaai gisteren.|Вибачте за шум учора.|Sorry about the noise yesterday.|Désolé pour le bruit d’hier.|آسف على الضجيج أمس.|🔇
Hoe gaat het met je moeder?|Як справи у твоєї мами?|How is your mother?|Comment va ta mère ?|كيف حال والدتك؟|👵
Proficiat met je nieuwe job!|Вітаю з новою роботою!|Congratulations on your new job!|Félicitations pour ton nouveau travail !|مبروك على عملك الجديد!|🎉
Kom je eens een koffie drinken?|Зайдеш якось на каву?|Will you come round for a coffee sometime?|Tu viens prendre un café un de ces jours ?|هل تأتي لشرب القهوة يوماً ما؟|☕
`],
   tijdwoorden: ['Коли? Слова про майбутнє','When? Future time words','Quand ? Les mots du futur','متى؟ كلمات المستقبل', `
volgend jaar|наступного року|next year|l’année prochaine|السنة القادمة|📅|Volgend jaar wil ik een opleiding volgen.|Наступного року я хочу піти на навчання.
binnenkort|незабаром|soon|bientôt|قريباً|🔜|Binnenkort verhuizen we.|Незабаром ми переїжджаємо.
over twee weken|через два тижні|in two weeks|dans deux semaines|بعد أسبوعين|🗓️|Over twee weken begint mijn nieuwe job.|Через два тижні починається моя нова робота.
later|пізніше, згодом|later|plus tard|لاحقاً|⏳|Later wil ik verpleegster worden.|Згодом я хочу стати медсестрою.
eerst|спочатку|first|d’abord|أولاً|1️⃣|Eerst leer ik Nederlands.|Спочатку я вчу нідерландську.
daarna|після цього|after that|ensuite|بعد ذلك|2️⃣|Daarna zoek ik werk.|Після цього я шукаю роботу.
de droom|мрія|dream|le rêve|الحلم|✨|Mijn droom is een eigen bakkerij.|Моя мрія — власна пекарня.
het doel|мета|goal|l’objectif|الهدف|🎯|Mijn doel is werk vinden in Gent.|Моя мета — знайти роботу в Генті.
`],
   plannen: ['Мої плани','My plans','Mes projets','خططي', `
Volgend jaar ga ik een opleiding tot kok volgen.|Наступного року я піду вчитися на кухаря.|Next year I’m going to train as a cook.|L’année prochaine, je vais suivre une formation de cuisinier.|في السنة القادمة سأتابع تدريباً لأصبح طباخاً.|🧑‍🍳
Ik wil mijn rijbewijs halen.|Я хочу отримати водійські права.|I want to get my driving licence.|Je veux passer mon permis de conduire.|أريد الحصول على رخصة القيادة.|🚗
Na de cursus zoek ik werk in de zorg.|Після курсу я шукатиму роботу в догляді за людьми.|After the course I’ll look for work in care.|Après le cours, je chercherai du travail dans les soins.|بعد الدورة سأبحث عن عمل في مجال الرعاية.|🧑‍⚕️
We gaan in de zomer naar een groter appartement verhuizen.|Улітку ми переїдемо у більшу квартиру.|In summer we’re going to move to a bigger flat.|En été, nous allons déménager dans un appartement plus grand.|في الصيف سننتقل إلى شقة أكبر.|🏘️
Ik hoop dat mijn familie op bezoek komt.|Я сподіваюся, що моя родина приїде в гості.|I hope my family will come to visit.|J’espère que ma famille viendra nous voir.|أتمنى أن تأتي عائلتي للزيارة.|👪
Wat zijn jouw plannen voor volgend jaar?|Які твої плани на наступний рік?|What are your plans for next year?|Quels sont tes projets pour l’année prochaine ?|ما خططك للسنة القادمة؟|❓
Ik weet het nog niet.|Я ще не знаю.|I don’t know yet.|Je ne sais pas encore.|لا أعرف بعد.|🤷
Eerst wil ik beter Nederlands spreken.|Спочатку я хочу краще говорити нідерландською.|First I want to speak Dutch better.|D’abord, je veux mieux parler néerlandais.|أولاً أريد أن أتحدث الهولندية بشكل أفضل.|🗣️
`],
   woning: ['Житло й ремонт','Your home and repairs','Le logement et les réparations','السكن والإصلاحات', `
de huisbaas|власник житла, орендодавець|landlord|le propriétaire|المالك|🔑|De huisbaas komt morgen de verwarming bekijken.|Власник житла завтра прийде подивитися опалення.
de waarborg|застава за оренду|rental deposit|la garantie locative|تأمين الإيجار|💰|De waarborg is twee maanden huur.|Застава дорівнює оплаті за два місяці.
de verwarming|опалення|heating|le chauffage|التدفئة|🌡️|De verwarming werkt niet.|Опалення не працює.
het lek|протікання|leak|la fuite|التسرّب|💧|Er is een lek in de badkamer.|У ванній протікає.
de herstelling|ремонт|repair|la réparation|الإصلاح|🛠️|Wie betaalt de herstelling?|Хто платить за ремонт?
de loodgieter|сантехнік|plumber|le plombier|السبّاك|🔧|De loodgieter komt donderdag.|Сантехнік прийде в четвер.
de meterstand|показник лічильника|meter reading|le relevé du compteur|قراءة العداد|🔢|Ik geef de meterstand door.|Я передаю показник лічильника.
de pmd-zak|мішок PMD для пластику й металу|PMD bag for plastic and cans|le sac PMC|كيس PMD للبلاستيك والمعادن|🧴|De blauwe pmd-zak zet ik op maandag buiten.|Синій мішок PMD я виставляю в понеділок.
`],
   huisbaas: ['Розмова з орендодавцем','Talking to the landlord','Parler au propriétaire','التحدث مع المالك', `
Dag meneer, met Olena van appartement drie.|Добрий день, пане, це Олена з квартири номер три.|Hello sir, this is Olena from flat three.|Bonjour monsieur, c’est Olena de l’appartement trois.|مرحباً سيدي، معك أولينا من الشقة رقم ثلاثة.|📞
Sinds gisteren is er geen warm water.|З учора немає гарячої води.|There has been no hot water since yesterday.|Il n’y a plus d’eau chaude depuis hier.|لا يوجد ماء ساخن منذ أمس.|🚿
Wanneer kan de loodgieter komen?|Коли може прийти сантехнік?|When can the plumber come?|Quand le plombier peut-il venir ?|متى يمكن أن يأتي السبّاك؟|🔧
Ik ben morgen de hele dag thuis.|Завтра я весь день удома.|I’m at home all day tomorrow.|Demain, je suis à la maison toute la journée.|سأكون في البيت طوال اليوم غداً.|🏠
Het raam in de slaapkamer is kapot.|Вікно в спальні розбите.|The bedroom window is broken.|La fenêtre de la chambre est cassée.|نافذة غرفة النوم مكسورة.|🪟
Ik heb een foto van het lek gemaakt.|Я зробив фото протікання.|I took a photo of the leak.|J’ai pris une photo de la fuite.|التقطت صورة للتسرّب.|📸
Mag ik een huisdier hebben?|Чи можна мені тримати домашню тварину?|Am I allowed to have a pet?|Ai-je le droit d’avoir un animal ?|هل يُسمح لي باقتناء حيوان أليف؟|🐈
Ik wil de huur opzeggen.|Я хочу розірвати договір оренди.|I want to give notice on the lease.|Je veux résilier le bail.|أريد إنهاء عقد الإيجار.|📄
`],
   openbaar: ['Автобус, трамвай і велосипед','Bus, tram and bike','Bus, tram et vélo','الحافلة والترام والدراجة', `
Waar kan ik een busticket kopen?|Де можна купити квиток на автобус?|Where can I buy a bus ticket?|Où puis-je acheter un ticket de bus ?|أين يمكنني شراء تذكرة حافلة؟|🎫
Je kunt een ticket in de app kopen.|Квиток можна купити в застосунку.|You can buy a ticket in the app.|Tu peux acheter un ticket dans l’application.|يمكنك شراء تذكرة عبر التطبيق.|📱
Ik heb een abonnement voor een jaar.|У мене абонемент на рік.|I have a one-year pass.|J’ai un abonnement d’un an.|لدي اشتراك لمدة سنة.|💳
Deze bus rijdt niet op zondag.|Цей автобус не їздить у неділю.|This bus doesn’t run on Sundays.|Ce bus ne circule pas le dimanche.|هذه الحافلة لا تعمل يوم الأحد.|🚌
Door werken is er een omleiding.|Через ремонтні роботи є об’їзд.|There is a diversion because of roadworks.|À cause de travaux, il y a une déviation.|بسبب الأشغال هناك تحويلة.|🚧
Hoeveel haltes is het nog?|Скільки ще зупинок?|How many more stops is it?|C’est encore combien d’arrêts ?|كم محطة باقية؟|🚏
Ik zet mijn fiets in de fietsenstalling aan het station.|Я ставлю велосипед на велопарковці біля вокзалу.|I put my bike in the bike park at the station.|Je mets mon vélo au parking vélos de la gare.|أضع دراجتي في موقف الدراجات عند المحطة.|🚲
Met de tram ben ik er in tien minuten.|Трамваєм я буду там за десять хвилин.|By tram I’ll be there in ten minutes.|En tram, j’y suis en dix minutes.|بالترام أصل في عشر دقائق.|🚋
`],
   omdat: ['Причина: want і omdat','Reasons: want and omdat','La cause : want et omdat','السبب: want و omdat', `
Ik blijf thuis, want ik ben ziek.|Я залишаюся вдома, бо я хворий.|I’m staying at home because I’m ill.|Je reste à la maison, car je suis malade.|أبقى في البيت لأنني مريض.|🏠
Ik ga naar de apotheek omdat ik hoest.|Я йду в аптеку, тому що кашляю.|I’m going to the pharmacy because I’m coughing.|Je vais à la pharmacie parce que je tousse.|أذهب إلى الصيدلية لأنني أسعل.|💊
Ik neem de bus, want mijn fiets is kapot.|Я їду автобусом, бо мій велосипед зламався.|I’m taking the bus because my bike is broken.|Je prends le bus, car mon vélo est cassé.|أركب الحافلة لأن دراجتي معطلة.|🚌
Ik neem de bus omdat mijn fiets kapot is.|Я їду автобусом, тому що велосипед зламаний.|I’m taking the bus since my bike is broken.|Je prends le bus parce que mon vélo est cassé.|أركب الحافلة بسبب عطل دراجتي.|🚲
Ik leer Nederlands omdat ik hier wil werken.|Я вчу нідерландську, тому що хочу тут працювати.|I’m learning Dutch because I want to work here.|J’apprends le néerlandais parce que je veux travailler ici.|أتعلم الهولندية لأنني أريد العمل هنا.|📚
Ik ben te laat omdat de trein vertraging had.|Я запізнився, тому що поїзд затримався.|I’m late because the train was delayed.|Je suis en retard parce que le train avait du retard.|تأخرت لأن القطار تأخر.|🚆
Waarom bel je? Omdat ik een vraag heb.|Чому ти дзвониш? Тому що в мене є питання.|Why are you calling? Because I have a question.|Pourquoi tu appelles ? Parce que j’ai une question.|لماذا تتصل؟ لأن لدي سؤالاً.|📞
Ik kom niet, want ik moet werken.|Я не прийду, бо мушу працювати.|I’m not coming because I have to work.|Je ne viens pas, car je dois travailler.|لن آتي لأنني يجب أن أعمل.|💼
`],
   scheidbaar: ['Perfectum дієслів, що розділяються','Perfect tense of separable verbs','Passé composé des verbes séparables','الماضي التام للأفعال المنفصلة', `
ik ben opgestaan|я встав|I got up|je me suis levé|استيقظتُ|⏰|Ik ben om zes uur opgestaan.|Я встав о шостій.
ik heb opgebeld|я подзвонив|I phoned|j’ai téléphoné|اتصلتُ هاتفياً|📞|Ik heb de huisarts opgebeld.|Я подзвонив сімейному лікарю.
ik heb ingevuld|я заповнив|I filled in|j’ai rempli|ملأتُ|📝|Ik heb het formulier ingevuld.|Я заповнив анкету.
ik ben uitgestapt|я вийшов (з транспорту)|I got off|je suis descendu|نزلتُ|🚏|Ik ben aan het station uitgestapt.|Я вийшов біля вокзалу.
ik ben aangekomen|я прибув|I arrived|je suis arrivé|وصلتُ|🏁|De trein is op tijd aangekomen.|Поїзд прибув вчасно.
ik heb meegenomen|я взяв із собою|I brought along|j’ai emporté|أحضرتُ معي|🎒|Ik heb mijn identiteitskaart meegenomen.|Я взяв із собою ID-картку.
ik heb opgeruimd|я навів лад|I tidied up|j’ai rangé|رتّبتُ|🧹|Ik heb mijn kamer opgeruimd.|Я прибрав у своїй кімнаті.
ik heb afgesproken|я домовився|I arranged to meet|j’ai pris rendez-vous|اتفقتُ على موعد|🤝|Ik heb met Anna afgesproken.|Я домовився з Анною.
`]
  },
  // Short grammar rule shown above the exercises of a lesson (uk, en, fr, ar).
  notes: {
   weekplan: ['Час на початку → дієслово на другому місці: Morgen moet ik…','Time first → verb in second place: Morgen moet ik…','Le temps en tête → le verbe en 2e position : Morgen moet ik…','الزمن أولاً ← الفعل في المكان الثاني: Morgen moet ik…'],
   solliciteren: ['Досвід: ik heb … gewerkt; ким був: ik was …','Experience: ik heb … gewerkt; what you were: ik was …','Expérience : ik heb … gewerkt ; ce que tu étais : ik was …','الخبرة: ik heb … gewerkt؛ ما كنتَ: ik was …'],
   huisarts: ['Як довго? sinds + час: Ik heb sinds gisteren keelpijn.','How long? sinds + time: Ik heb sinds gisteren keelpijn.','Depuis quand ? sinds + temps : Ik heb sinds gisteren keelpijn.','منذ متى؟ sinds + الوقت: Ik heb sinds gisteren keelpijn.'],
   orientatie: ['Наказ: дієслово на початку. Ga rechtdoor! Sla linksaf!','Imperative: the verb comes first. Ga rechtdoor! Sla linksaf!','Impératif : le verbe vient en premier. Ga rechtdoor ! Sla linksaf !','الأمر: الفعل في البداية. Ga rechtdoor! Sla linksaf!'],
   weekend: ['Порівняння: leuker dan, liever, beter dan','Comparing: leuker dan, liever, beter dan','Comparer : leuker dan, liever, beter dan','المقارنة: leuker dan، liever، beter dan'],
   buren: ['Ввічливо: u/uw з незнайомими, je/jij з друзями','Polite: u/uw with strangers, je/jij with friends','Poli : u/uw avec des inconnus, je/jij avec des amis','بأدب: u/uw مع الغرباء، je/jij مع الأصدقاء'],
   plannen: ['Майбутнє: gaan/willen + інфінітив у кінці речення','Future: gaan/willen + infinitive at the end','Futur : gaan/willen + infinitif à la fin','المستقبل: gaan/willen + المصدر في نهاية الجملة'],
   omdat: ['want + звичайний порядок слів; після omdat дієслово йде в кінець','want + normal word order; after omdat the verb goes to the end','want + ordre normal ; après omdat, le verbe va à la fin','بعد want ترتيب عادي؛ بعد omdat يأتي الفعل في النهاية'],
   scheidbaar: ['Частка + ge + дієслово: opstaan → opgestaan, invullen → ingevuld','Particle + ge + verb: opstaan → opgestaan, invullen → ingevuld','Particule + ge + verbe : opstaan → opgestaan, invullen → ingevuld','الجزء + ge + الفعل: opstaan ← opgestaan، invullen ← ingevuld']
  },
  gaps: {
   daily:['Gisteren heb ik de hele dag ___.','gepoetst','poetsen','poetst','gepoetsd'],
   work:['Ik heb drie jaar in een winkel ___.','gewerkt','werken','werkt','gewerkd'],
   zorg:['Ik heb ___ gisteren keelpijn.','sinds','voor','na','om'],
   stad:['De bushalte is ___ de bank.','naast','rechtdoor','linksaf','straks'],
   school:['Mijn zoon is ziek. Hij komt ___ naar school.','niet','geen','niets','nee'],
   vrijetijd:['Ik vind zwemmen leuker ___ lopen.','dan','als','of','want'],
   sociaal:['Kunt ___ dit pakje voor mij aannemen, mevrouw?','u','uw','jouw','hem'],
   future:['Volgend jaar ___ ik een opleiding volgen.','ga','gaat','gaan','gegaan']
  },
  // Sentence builder: cat, level, tiles, roles, uk, en, fr, ar, extra tile, final punctuation.
  bank: [
   ['daily',1,'wie|doet|vandaag|de afwas','QVRR','Хто сьогодні миє посуд?','Who is doing the dishes today?','Qui fait la vaisselle aujourd’hui ?','من يغسل الأطباق اليوم؟','','?'],
   ['daily',1,'op zaterdag|doe|ik|de was','TVSR','У суботу я перу білизну.','On Saturday I do the laundry.','Le samedi, je fais la lessive.','يوم السبت أغسل الملابس.','doen','.'],
   ['daily',2,'ik|heb|de hele ochtend|gepoetst','SVRI','Я прибирав увесь ранок.','I cleaned all morning.','J’ai fait le ménage toute la matinée.','نظّفت طوال الصباح.','poetsen','.'],
   ['work',1,'wanneer|kan|ik|beginnen','QVSI','Коли я можу почати?','When can I start?','Quand est-ce que je peux commencer ?','متى يمكنني أن أبدأ؟','','?'],
   ['work',1,'ik|zoek|werk|in een winkel','SVRR','Я шукаю роботу в магазині.','I’m looking for work in a shop.','Je cherche du travail dans un magasin.','أبحث عن عمل في متجر.','','.'],
   ['work',2,'ik|heb|drie jaar|in een winkel|gewerkt','SVRRI','Я три роки працював у магазині.','I worked in a shop for three years.','J’ai travaillé trois ans dans un magasin.','عملت ثلاث سنوات في متجر.','werken','.'],
   ['zorg',1,'hebt|u|iets|tegen hoest','VSRR','У вас є щось від кашлю?','Do you have something for a cough?','Avez-vous quelque chose contre la toux ?','هل لديك شيء للسعال؟','','?'],
   ['zorg',2,'de dokter|heeft|mij|een voorschrift|gegeven','SVRRI','Лікар дав мені рецепт.','The doctor gave me a prescription.','Le médecin m’a donné une ordonnance.','أعطاني الطبيب وصفة طبية.','geeft','.'],
   ['stad',1,'waar|is|de wachtapotheek','QVS','Де чергова аптека?','Where is the on-duty pharmacy?','Où est la pharmacie de garde ?','أين الصيدلية المناوبة؟','','?'],
   ['stad',1,'aan het kruispunt|ga|je|links','TVSR','На перехресті йдеш ліворуч.','At the crossroads you go left.','Au carrefour, tu vas à gauche.','عند التقاطع تذهب يساراً.','gaat','.'],
   ['stad',2,'ik|ben|verkeerd|gelopen','SVRI','Я заблукав.','I went the wrong way.','Je me suis trompé de chemin.','أخطأت الطريق.','heb','.'],
   ['school',1,'moet|ik|dit briefje|ondertekenen','VSRI','Мені треба підписати цей лист?','Do I have to sign this note?','Dois-je signer ce mot ?','هل يجب أن أوقّع هذه الورقة؟','','?'],
   ['school',1,'de les|begint|om zeven uur','SVR','Заняття починається о сьомій.','The lesson starts at seven.','Le cours commence à sept heures.','يبدأ الدرس في السابعة.','','.'],
   ['school',2,'na school|gaat|mijn dochter|naar de opvang','TVSR','Після школи донька йде в групу продовженого дня.','After school my daughter goes to after-school care.','Après l’école, ma fille va à la garderie.','بعد المدرسة تذهب ابنتي إلى الرعاية.','gaan','.'],
   ['vrijetijd',1,'wat|doe|je|graag','QVSR','Що ти любиш робити?','What do you like doing?','Qu’est-ce que tu aimes faire ?','ماذا تحب أن تفعل؟','','?'],
   ['vrijetijd',1,'ik|sport|twee keer per week','SVR','Я займаюся спортом двічі на тиждень.','I do sport twice a week.','Je fais du sport deux fois par semaine.','أمارس الرياضة مرتين في الأسبوع.','','.'],
   ['vrijetijd',2,'vorig weekend|hebben|we|een fietstocht|gemaakt','TVSRI','Минулих вихідних ми їздили на велопрогулянку.','Last weekend we went on a bike ride.','Le week-end dernier, nous avons fait une balade à vélo.','في عطلة نهاية الأسبوع الماضية قمنا بجولة بالدراجة.','maken','.'],
   ['sociaal',1,'zal|ik|je|helpen','VSRI','Тобі допомогти?','Shall I help you?','Je peux t’aider ?','هل أساعدك؟','','?'],
   ['sociaal',1,'dat|is|heel vriendelijk|van u','SVRR','Це дуже люб’язно з вашого боку.','That’s very kind of you.','C’est très gentil de votre part.','هذا لطف كبير منك.','','.'],
   ['sociaal',2,'hij|is|boos|want|de muziek|is|te luid','SVRRSVR','Він сердиться, бо музика надто гучна.','He is angry because the music is too loud.','Il est fâché, car la musique est trop forte.','إنه غاضب لأن الموسيقى عالية جداً.','omdat','.'],
   ['future',1,'volgend jaar|ga|ik|verhuizen','TVSI','Наступного року я переїду.','Next year I’m going to move.','L’année prochaine, je vais déménager.','في السنة القادمة سأنتقل.','gaat','.'],
   ['future',1,'eerst|zoek|ik|werk','TVSR','Спочатку я шукаю роботу.','First I look for work.','D’abord, je cherche du travail.','أولاً أبحث عن عمل.','','.'],
   ['future',2,'na de cursus|wil|ik|in de zorg|werken','TVSRI','Після курсу я хочу працювати в догляді.','After the course I want to work in care.','Après le cours, je veux travailler dans les soins.','بعد الدورة أريد العمل في الرعاية.','wilt','.'],
   ['wonen',1,'de verwarming|werkt|niet','SVR','Опалення не працює.','The heating isn’t working.','Le chauffage ne marche pas.','التدفئة لا تعمل.','','.'],
   ['wonen',2,'wanneer|kan|de loodgieter|komen','QVSI','Коли може прийти сантехнік?','When can the plumber come?','Quand le plombier peut-il venir ?','متى يمكن أن يأتي السبّاك؟','','?'],
   ['travel',1,'hoeveel haltes|is|het|nog','QVSR','Скільки ще зупинок?','How many more stops is it?','C’est encore combien d’arrêts ?','كم محطة باقية؟','','?'],
   ['travel',2,'door werken|is|er|een omleiding','TVSR','Через ремонтні роботи є об’їзд.','There is a diversion because of roadworks.','À cause de travaux, il y a une déviation.','بسبب الأشغال هناك تحويلة.','','.'],
   ['grammar2',2,'ik|blijf|thuis|omdat|ik|ziek|ben','SVRRSRV','Я залишаюся вдома, тому що хворію.','I’m staying at home because I’m ill.','Je reste à la maison parce que je suis malade.','أبقى في البيت لأنني مريض.','want','.'],
   ['grammar2',2,'ik|ben|om zes uur|opgestaan','SVRI','Я встав о шостій.','I got up at six.','Je me suis levé à six heures.','استيقظتُ في السادسة.','heb','.']
  ],
  // Listening and role-play: [id, icon, title uk/en/fr/ar, lines nl|uk|en].
  dialogues: [
   ['daily','🧺','Хто що робить удома?','Who does what at home?','Qui fait quoi à la maison ?','من يفعل ماذا في البيت؟',[
    ['Wie doet vandaag de afwas?','Хто сьогодні миє посуд?','Who is doing the dishes today?'],
    ['Ik heb gisteren al de afwas gedaan.','Я вже мив посуд учора.','I already did the dishes yesterday.'],
    ['Oké, dan doe ik hem vandaag. Kun jij stofzuigen?','Добре, тоді сьогодні мию я. Можеш попилососити?','OK, then I’ll do them today. Can you vacuum?'],
    ['Ja, maar eerst breng ik de kinderen naar school.','Так, але спочатку я відведу дітей до школи.','Yes, but first I’ll take the children to school.'],
    ['Vergeet de vuilniszak niet. Morgen komt de vuilniswagen.','Не забудь про пакет зі сміттям. Завтра приїде сміттєвоз.','Don’t forget the rubbish bag. The bin lorry comes tomorrow.'],
    ['Ik zet hem vanavond buiten.','Я виставлю його сьогодні ввечері.','I’ll put it out tonight.']]],
   ['work','💼','Співбесіда','A job interview','Un entretien d’embauche','مقابلة عمل',[
    ['Goedemorgen, gaat u zitten. Waarom wilt u hier werken?','Доброго ранку, сідайте. Чому ви хочете тут працювати?','Good morning, have a seat. Why do you want to work here?'],
    ['Ik werk graag met mensen en ik heb ervaring in een winkel.','Я люблю працювати з людьми, і маю досвід роботи в магазині.','I like working with people and I have experience in a shop.'],
    ['Hoe lang hebt u in die winkel gewerkt?','Скільки ви працювали в тому магазині?','How long did you work in that shop?'],
    ['Drie jaar, in Kyiv. Daar was ik verkoopster.','Три роки, у Києві. Там я була продавчинею.','Three years, in Kyiv. I was a shop assistant there.'],
    ['Kunt u ook in het weekend werken?','Ви можете працювати й на вихідних?','Can you also work at weekends?'],
    ['Ja, op zaterdag kan ik werken. Wanneer kan ik beginnen?','Так, у суботу я можу працювати. Коли я можу почати?','Yes, I can work on Saturdays. When can I start?']]],
   ['zorg','💊','В аптеці','At the pharmacy','À la pharmacie','في الصيدلية',[
    ['Goedemiddag. Kan ik u helpen?','Добрий день. Можу вам допомогти?','Good afternoon. Can I help you?'],
    ['Ja, ik heb sinds gisteren keelpijn en ik hoest veel.','Так, у мене з учора болить горло, і я сильно кашляю.','Yes, I’ve had a sore throat since yesterday and I cough a lot.'],
    ['Hebt u koorts?','У вас є температура?','Do you have a temperature?'],
    ['Nee, geen koorts. Hebt u iets tegen hoest?','Ні, температури немає. У вас є щось від кашлю?','No, no temperature. Do you have something for a cough?'],
    ['Deze siroop neemt u drie keer per dag, na het eten.','Цей сироп приймайте тричі на день після їжі.','Take this syrup three times a day, after meals.'],
    ['Dank u. Als het niet beter wordt, ga ik naar de huisarts.','Дякую. Якщо не стане краще, я піду до сімейного лікаря.','Thank you. If it doesn’t get better, I’ll go to the GP.']]],
   ['stad','🗺️','Дорога до будинку громади','The way to the town hall','Le chemin de la maison communale','الطريق إلى مبنى البلدية',[
    ['Pardon, mevrouw. Waar is het gemeentehuis?','Перепрошую, пані. Де будинок громади?','Excuse me, madam. Where is the town hall?'],
    ['Ga hier rechtdoor tot aan het kruispunt.','Ідіть тут прямо до перехрестя.','Go straight on here to the crossroads.'],
    ['En dan?','А потім?','And then?'],
    ['Aan het kruispunt gaat u linksaf. Het gemeentehuis is tegenover de kerk.','На перехресті поверніть ліворуч. Будинок громади навпроти церкви.','At the crossroads, turn left. The town hall is opposite the church.'],
    ['Is het ver te voet?','Це далеко пішки?','Is it far on foot?'],
    ['Nee, het is ongeveer tien minuten wandelen.','Ні, це приблизно десять хвилин пішки.','No, it’s about a ten-minute walk.']]],
   ['school','🎒','Розмова з учителькою','Talking to the teacher','Parler à la maîtresse','التحدث مع المعلّمة',[
    ['Dag juf, ik ben de mama van Sofia.','Добрий день, пані вчителько, я мама Софії.','Hello, Miss, I’m Sofia’s mum.'],
    ['Dag mevrouw. Sofia doet het goed in de klas.','Добрий день, пані. Софія добре вчиться.','Hello. Sofia is doing well in class.'],
    ['Fijn! Spreekt ze al goed Nederlands?','Чудово! Вона вже добре говорить нідерландською?','Great! Does she speak Dutch well already?'],
    ['Ja, ze leert snel. Ze praat veel met haar vriendinnen.','Так, вона швидко вчиться. Вона багато розмовляє з подругами.','Yes, she learns fast. She talks a lot with her friends.'],
    ['Moet ik dit briefje voor de schoolreis ondertekenen?','Мені треба підписати цей лист щодо екскурсії?','Do I need to sign this note for the school trip?'],
    ['Ja, graag tegen vrijdag. De schoolreis kost twaalf euro.','Так, будь ласка, до п’ятниці. Екскурсія коштує дванадцять євро.','Yes, by Friday please. The school trip costs twelve euros.']]],
   ['vrijetijd','⚽','Запис у клуб','Joining a club','S’inscrire dans un club','التسجيل في نادٍ',[
    ['Goedenavond. Mijn zoon wil graag voetballen bij jullie club.','Добрий вечір. Мій син хоче грати у футбол у вашому клубі.','Good evening. My son would like to play football at your club.'],
    ['Leuk! Hoe oud is hij?','Чудово! Скільки йому років?','Great! How old is he?'],
    ['Hij is tien. Wanneer zijn de trainingen?','Йому десять. Коли тренування?','He is ten. When are the training sessions?'],
    ['Op woensdagmiddag en op zaterdagochtend.','У середу після обіду й у суботу вранці.','On Wednesday afternoon and Saturday morning.'],
    ['Hoeveel is het lidgeld?','Скільки коштує членський внесок?','How much is the membership fee?'],
    ['Honderd euro per jaar. Het ziekenfonds betaalt soms een deel terug.','Сто євро на рік. Лікарняна каса іноді повертає частину.','A hundred euros a year. The health insurance fund sometimes refunds part of it.']]],
   ['sociaal','🤝','Нова сусідка','The new neighbour','La nouvelle voisine','الجارة الجديدة',[
    ['Dag, ik ben Olena, uw nieuwe buurvrouw.','Добрий день, я Олена, ваша нова сусідка.','Hello, I’m Olena, your new neighbour.'],
    ['Dag Olena, welkom! Ik ben Jan. Woon je hier al lang?','Привіт, Олено, ласкаво просимо! Я Ян. Ти вже давно тут живеш?','Hello Olena, welcome! I’m Jan. Have you lived here long?'],
    ['Nee, we zijn vorige week verhuisd.','Ні, ми переїхали минулого тижня.','No, we moved last week.'],
    ['Als je iets nodig hebt, mag je altijd aanbellen.','Якщо тобі щось потрібно, завжди можеш подзвонити у двері.','If you need anything, you can always ring the bell.'],
    ['Dat is heel vriendelijk. Kunt u morgen een pakje voor mij aannemen?','Це дуже люб’язно. Чи можете ви завтра прийняти для мене посилку?','That’s very kind. Could you take in a parcel for me tomorrow?'],
    ['Natuurlijk, geen probleem.','Звичайно, без проблем.','Of course, no problem.']]],
   ['future','🔜','Плани після курсу','Plans after the course','Projets après le cours','خطط بعد الدورة',[
    ['Wat zijn jouw plannen na de cursus?','Які в тебе плани після курсу?','What are your plans after the course?'],
    ['Eerst wil ik niveau A2 halen. Daarna zoek ik werk.','Спочатку я хочу досягти рівня A2. Потім шукатиму роботу.','First I want to reach level A2. After that I’ll look for work.'],
    ['Welk werk wil je doen?','Яку роботу ти хочеш?','What work do you want to do?'],
    ['Ik wil in de zorg werken. In Oekraïne was ik verpleegster.','Я хочу працювати в догляді за людьми. В Україні я була медсестрою.','I want to work in care. In Ukraine I was a nurse.'],
    ['En wat ga je in de zomer doen?','А що ти робитимеш улітку?','And what are you going to do in summer?'],
    ['We gaan naar een groter appartement verhuizen.','Ми переїдемо у більшу квартиру.','We’re going to move to a bigger flat.']]]
  ],
  // Speaking prompts: question, uk, en, model answer.
  speech: [
   ['Wie doet bij jou thuis de afwas?','Хто у вас удома миє посуд?','Who does the dishes in your home?','Bij ons doet mijn man de afwas.'],
   ['Welk werk heb je vroeger gedaan?','Яку роботу ти виконував раніше?','What work did you do before?','Ik heb drie jaar in een winkel gewerkt.'],
   ['Wat vraag je in de apotheek?','Що ти запитаєш в аптеці?','What do you ask at the pharmacy?','Hebt u iets tegen hoest?'],
   ['Hoe kom je van je huis naar de winkel?','Як дійти від твого дому до магазину?','How do you get from your home to the shop?','Ik ga rechtdoor en aan het kruispunt ga ik links.'],
   ['Waarom komt je kind vandaag niet naar school?','Чому твоя дитина сьогодні не прийде до школи?','Why isn’t your child coming to school today?','Mijn zoon komt niet omdat hij ziek is.'],
   ['Wat doe je graag in je vrije tijd?','Що ти любиш робити у вільний час?','What do you like doing in your free time?','Ik sport graag en ik lees veel.'],
   ['Hoe stel je je voor aan een nieuwe buur?','Як ти представишся новому сусідові?','How do you introduce yourself to a new neighbour?','Dag, ik ben Olena, uw nieuwe buurvrouw.'],
   ['Wat zijn je plannen voor volgend jaar?','Які твої плани на наступний рік?','What are your plans for next year?','Volgend jaar wil ik werk zoeken.']
  ],
  // Two original reading texts: a school letter and a municipal notice.
  reading: [
   'Beste ouders, op vrijdag 14 maart gaan alle klassen op schoolreis naar de zoo. De bus vertrekt om half negen aan de schoolpoort. We zijn om vier uur terug. De schoolreis kost 15 euro. Geef uw kind een lunchpakket en een drankje mee. Betaal voor 7 maart via de schoolrekening. Met vriendelijke groeten, juf Ann',
   'Gemeente Zonnedorp. Vanaf 1 april is het gemeentehuis open van maandag tot vrijdag, van 9 tot 12 uur. Op woensdag is het ook open van 14 tot 19 uur. Voor een nieuwe identiteitskaart maakt u eerst online een afspraak. Breng een pasfoto en uw oude kaart mee.'
  ]
  ,
  // Reading questions: text index, question uk/en/fr/ar, answer first, then three wrong options.
  readingQs: [
   [0,'О котрій вирушає автобус?','What time does the bus leave?','À quelle heure part le bus ?','متى تغادر الحافلة؟',['Om half negen','Om vier uur','Om acht uur','Om half tien']],
   [0,'Що дитина має взяти з собою?','What should the child take along?','Qu’est-ce que l’enfant doit emporter ?','ماذا يجب أن يأخذ الطفل معه؟',['Een lunchpakket en een drankje','Vijftien euro in een envelop','Een fiets','Een pasfoto']],
   [0,'До якого дня треба заплатити?','By when do you have to pay?','Avant quelle date faut-il payer ?','قبل أي تاريخ يجب الدفع؟',['Voor 7 maart','Op 14 maart','Na de schoolreis','Voor 1 april']],
   [1,'Коли будинок громади відкритий після обіду?','When is the town hall open in the afternoon?','Quand la maison communale est-elle ouverte l’après-midi ?','متى يكون مبنى البلدية مفتوحاً بعد الظهر؟',['Op woensdag','Op maandag','Op vrijdag','Elke dag']],
   [1,'Що треба зробити спочатку для нової ID-картки?','What do you do first for a new identity card?','Que faut-il faire d’abord pour une nouvelle carte d’identité ?','ماذا تفعل أولاً للحصول على بطاقة هوية جديدة؟',['Online een afspraak maken','Een brief schrijven','Naar de bibliotheek gaan','Om 19 uur langskomen']],
   [1,'Що треба принести?','What must you bring?','Que faut-il apporter ?','ماذا يجب أن تحضر؟',['Een pasfoto en de oude kaart','Een voorschrift','Het lidgeld','Een kassabon']]
  ],
  // Spaced review of A1.2 grammar across chapters (answer first).
  review: [
   ['gap','Gisteren ___ ik naar de markt gegaan.','ben','heb','is','word'],
   ['gap','Ik heb het formulier ___.','ingevuld','geinvuld','invullen','vul in'],
   ['gap','Ik ben om zes uur ___.','opgestaan','opstaan','geopstaan','sta op'],
   ['gap','Ik kom niet omdat ik moet ___.','werken','werk','werkt','gewerkt'],
   ['pick','Ik neem de bus omdat mijn fiets kapot is.','Ik neem de bus omdat mijn fiets is kapot.','Ik neem de bus want mijn fiets kapot is.','Ik neem de bus omdat is mijn fiets kapot.'],
   ['gap','De trein is sneller ___ de bus.','dan','als','van','om'],
   ['gap','Waar is Tom? Ik zie ___ niet.','hem','hij','zijn','hun'],
   ['gap','Volgend jaar ___ we verhuizen.','gaan','gaat','ga','gegaan'],
   ['gap','Aan het kruispunt sla je ___.','linksaf','tegenover','naast','voorbij'],
   ['pick','Morgen moet ik de vuilniszak buitenzetten.','Morgen ik moet de vuilniszak buitenzetten.','Morgen moet ik buitenzetten de vuilniszak.','Morgen moet de vuilniszak ik buitenzetten.']
  ]
 };
 advanced.push(...a12.chapters.map(([id,title,tabs])=>[id,title,[...tabs]]));
 for(const [id,tabs] of Object.entries(a12.extraTabs))advanced.find(c=>c[0]===id)[2].push(...tabs);
 Object.assign(topicLabels,a12.labels);
 function apply({DATA,CATEGORIES,UI,R,LEVELS}) {
  const grammar = {...CATEGORIES.find(c=>c.id==='grammar')}; // Includes the untouched diphthongs lesson.
  grammar.tabs=grammar.tabs.filter(t=>t!=='adjectives');
  CATEGORIES.splice(0,CATEGORIES.length,
   ...chapters.map(([id,title,tabs],i)=>({id,lvl:'a11',chapter:i+1,tabs})),grammar,
   ...advanced.map(([id,title,tabs])=>({id,lvl:'a12',tabs})));
  LEVELS[0].name='A1.1'; LEVELS[1].name='A1.2'; LEVELS[2].name='A2.1';
  for(const lang of Object.keys(UI)){
   UI[lang].tagline='A1 · A1.1 / A1.2';
   UI[lang].toetsTitle=UI[lang].modes.toets='Toets';
  }
  for(const c of CATEGORIES)for(const lang of Object.keys(UI))UI[lang].cats[c.id]=topicInfo(c.id,lang).title;
  for(const [key,[uk,en,fr,ar,text]] of Object.entries(lessons)) {
   DATA[key]=R(text.trim().split('\n').map((line,i)=>{
    const [nl,uk,en,fr,ar]=line.split('|');
    return [`course_${key}_${i+1}`,nl,en,fr,uk,ar,lessonIcons[key]?.split(' ')[i]||'📖'];
   }));
   for(const [lang,label] of Object.entries({uk,en,fr,ar}))UI[lang].tabs[key]=UI[lang].subs[key]=label;
  }
  for(const [key,[uk,en,fr,ar,text]] of Object.entries(a12.lessons)) {
   DATA[key]=R(text.trim().split('\n').map((line,i)=>{
    const [nl,uk,en,fr,ar,icon,exNl,exUk]=line.split('|');
    return [`course_${key}_${i+1}`,nl,en,fr,uk,ar,icon||'📖',exNl||'',exUk||''];
   }));
   const note=a12.notes[key];
   for(const [i,[lang,label]] of Object.entries(Object.entries({uk,en,fr,ar}))){UI[lang].tabs[key]=label;UI[lang].subs[key]=note?.[i]||label;}
  }
  // Ordinals are explicit practice, not just mentioned in the chapter heading.
  const ordinals=[['eerste','перший','first','premier','الأول'],['tweede','другий','second','deuxième','الثاني'],['derde','третій','third','troisième','الثالث'],['vierde','четвертий','fourth','quatrième','الرابع'],['vijfde','п’ятий','fifth','cinquième','الخامس'],['zesde','шостий','sixth','sixième','السادس'],['zevende','сьомий','seventh','septième','السابع'],['achtste','восьмий','eighth','huitième','الثامن'],['negende','дев’ятий','ninth','neuvième','التاسع'],['tiende','десятий','tenth','dixième','العاشر'],['elfde','одинадцятий','eleventh','onzième','الحادي عشر'],['twaalfde','дванадцятий','twelfth','douzième','الثاني عشر']];
  DATA.birthday.items.push(...R(ordinals.map(([nl,uk,en,fr,ar],i)=>[`course_ordinal_${i+1}`,nl,en,fr,uk,ar,'📅'])).items);
  for(const [tab,text] of Object.entries(practice))
   DATA[tab].items.push(...R(text.trim().split('\n').map((line,i)=>{
    const [nl,uk,en,fr,ar,icon]=line.split('|');
    return [`course_pt_${tab}_${i+1}`,nl,en,fr,uk,ar,icon||'📖'];
   })).items);
  // body-part sentences get the body-map pictures (a flexed biceps is not a shoulder)
  if(typeof KT_IMG!=='undefined'){const P={1:'neus',2:'neus',3:'hand',4:'been',5:'schouder',6:'voet'};for(const it of DATA.klachten.items){const m=/^course_pt_klachten_(\d)$/.exec(it.id);if(m&&P[m[1]]&&KT_IMG[P[m[1]]])it.icon=KT_IMG[P[m[1]]]}}
  // Move individual cards where an older collection spans several chapters.
  const move=(from,to,ids)=>{const selected=new Set(ids);DATA[to].items.push(...DATA[from].items.filter(x=>selected.has(x.id)));DATA[from].items=DATA[from].items.filter(x=>!selected.has(x.id));};
  move('mail','birthday',['b_proficiat']);move('mail','invitation',['b_spijt']);
  move('mail','messages',['b_bijlage','b_geachte','b_mvg','b_afzender','b_onderwerp']);
  move('telefoon','instructions',['b_ziek','b_bericht']);
  // This past-tense example belongs to 1.2, while negation itself belongs to 1.1.
  const nothing=DATA.niet.items.find(x=>x.id==='b_niets');
  if(nothing){nothing.ex_nl='Ik hoor niets.';nothing.ex_uk='Я нічого не чую.';}
 }
 function buildBank(bank) {
  const original=Object.entries(bank);for(const key of Object.keys(bank))delete bank[key];
  const add=(cat,row)=>(bank[cat]??=[]).push(row);
  for(const [cat,rows] of original)for(const row of rows){
   const text=row[1];let dest=cat;
   if(cat==='home')dest=/eet|drink|koffie|brood|melk|kaas|restaurant|kook/.test(text)?'food':/kost|betaal|koop/.test(text)?'nums':'people';
   if(cat==='city')dest=/les|school|gemeente|werk|formulier/.test(text)?'forms':'travelTime';
   if(cat==='nums')dest=/verjaar|jaar|maand|geboren/.test(text)?'birthday':/uur|laat|tijd/.test(text)?'travelTime':'nums';
   if(cat==='people'&&/pijn|dokter|ziek|koorts|voel|lichaam/.test(text))dest='health';
   if(cat==='comm'&&/graag|elke|weekend/.test(text))dest='dag';
   if(cat==='contact')dest=/gekregen/.test(text)?'contact':'forms';
   if(cat==='grammar2')dest=/geen|niet/.test(text)?'dag':/jouw|mijn|hun/.test(text)?'people':'grammar2';
   add(dest,row);
  }
  const rows=[
   ['grammar2','welke jas|is|goedkoper','QVR','Яка куртка дешевша?','Which coat is cheaper?','Quelle veste est moins chère ?','أي سترة أرخص؟'],
   ['opening','wanneer|begint|de les','QVS','Коли починається заняття?','When does the lesson start?','Quand commence le cours ?','متى يبدأ الدرس؟'],
   ['birthday','wanneer|verjaar|jij','QVS','Коли в тебе день народження?','When is your birthday?','Quand est ton anniversaire ?','متى عيد ميلادك؟'],
   ['health','waar|heb|je|pijn','QVSR','Де в тебе болить?','Where does it hurt?','Où as-tu mal ?','أين تشعر بالألم؟'],
   ['food','wat|eet|je|elke dag','QVSR','Що ти їси щодня?','What do you eat every day?','Que manges-tu chaque jour ?','ماذا تأكل كل يوم؟'],
   ['shopping','wat|hebben|we|nodig','QVSR','Що нам потрібно?','What do we need?','De quoi avons-nous besoin ?','ماذا نحتاج؟'],
   ['holiday','waar|hebben|jullie|gelogeerd','QVSR','Де ви зупинялися?','Where did you stay?','Où avez-vous logé ?','أين أقمتم؟'],
   ['travel','waar|moet|ik|overstappen','QVSR','Де мені пересідати?','Where do I need to change?','Où dois-je changer ?','أين يجب أن أبدل؟'],
   ['service','kan|ik|deze jas|omruilen','VSRR','Можна обміняти цю куртку?','Can I exchange this coat?','Puis-je échanger cette veste ?','هل يمكنني استبدال هذه السترة؟'],
   ['reading','waar|kan|ik|me|inschrijven','QVSRR','Де я можу зареєструватися?','Where can I register?','Où puis-je m’inscrire ?','أين يمكنني التسجيل؟'],
   ['contact','hebt|u|mijn bericht|ontvangen','VSRR','Ви отримали моє повідомлення?','Have you received my message?','Avez-vous reçu mon message ?','هل استلمتم رسالتي؟']
  ];
  for(const [cat,q,roles,uk,en,fr,ar] of rows)add(cat,[1,q,roles,uk,en,fr,ar]);
  // Practice test of 27 Oct 2026: word order in statements. T = time/place first, I = infinitive or particle at the end.
  // Row: cat, level, tiles, roles, uk, en, fr, ar, extra decoy tile.
  const statements=[
   ['food',1,'je|moet|meer fruit|eten','SVRI','Тобі треба їсти більше фруктів.','You should eat more fruit.','Tu dois manger plus de fruits.','يجب أن تأكل المزيد من الفاكهة.','minder'],
   ['food',1,'je|moet|minder chips|eten','SVRI','Тобі треба їсти менше чіпсів.','You should eat fewer crisps.','Tu dois manger moins de chips.','يجب أن تأكل شيبس أقل.','meer'],
   ['food',1,'je|moet|meer vis|eten','SVRI','Тобі треба їсти більше риби.','You should eat more fish.','Tu dois manger plus de poisson.','يجب أن تأكل المزيد من السمك.','minder'],
   ['food',1,'je|moet|meer groenten|eten','SVRI','Тобі треба їсти більше овочів.','You should eat more vegetables.','Tu dois manger plus de légumes.','يجب أن تأكل المزيد من الخضار.','minder'],
   ['food',1,'je|moet|minder cola|drinken','SVRI','Тобі треба пити менше коли.','You should drink less cola.','Tu dois boire moins de cola.','يجب أن تشرب كولا أقل.','eten'],
   ['food',2,'je|moet|minder koffie|drinken','SVRI','Тобі треба пити менше кави.','You should drink less coffee.','Tu dois boire moins de café.','يجب أن تشرب قهوة أقل.','meer'],
   ['food',2,'je|moet|minder snoepjes|eten','SVRI','Тобі треба їсти менше солодощів.','You should eat fewer sweets.','Tu dois manger moins de bonbons.','يجب أن تأكل حلويات أقل.','meer'],
   ['food',2,'je|moet|minder hamburgers|eten','SVRI','Тобі треба їсти менше гамбургерів.','You should eat fewer hamburgers.','Tu dois manger moins de hamburgers.','يجب أن تأكل برغر أقل.','drinken'],
   ['food',2,'ik|eet|nooit|vis','SVRR','Я ніколи не їм рибу.','I never eat fish.','Je ne mange jamais de poisson.','لا آكل السمك أبداً.','geen'],
   ['food',2,'ik|drink|meestal|cola|bij het eten','SVRRR','Я зазвичай п’ю колу під час їжі.','I usually drink cola with my meal.','Je bois généralement du cola pendant le repas.','أشرب الكولا عادة مع الطعام.',''],
   ['food',2,'ik|eet|\'s middags|altijd|een zak snoepjes','SVRRR','Удень я завжди з’їдаю пакет цукерок.','In the afternoon I always eat a bag of sweets.','L’après-midi, je mange toujours un sachet de bonbons.','بعد الظهر آكل دائماً كيس حلويات.',''],
   ['dag',1,'om zeven uur|sta|ik|op','TVSI','О сьомій годині я встаю.','At seven o’clock I get up.','À sept heures, je me lève.','في الساعة السابعة أستيقظ.','ben'],
   ['dag',1,'om 07:00 u|neem|ik|een douche','TVSR','О 07:00 я приймаю душ.','At 7:00 I take a shower.','À 7 h, je prends une douche.','في الساعة 07:00 آخذ دشاً.',''],
   ['dag',1,'om 08:15|ontbijt|ik','TVS','О 08:15 я снідаю.','At 8:15 I have breakfast.','À 8 h 15, je prends mon petit-déjeuner.','في الساعة 08:15 أتناول الفطور.',''],
   ['dag',1,'\'s morgens|breng|ik|de kinderen|naar school','TVSRR','Вранці я відвожу дітей до школи.','In the morning I take the children to school.','Le matin, j’emmène les enfants à l’école.','في الصباح أوصل الأطفال إلى المدرسة.',''],
   ['dag',1,'\'s avonds|kook|ik','TVS','Ввечері я готую.','In the evening I cook.','Le soir, je cuisine.','في المساء أطبخ.',''],
   ['dag',2,'na de maaltijd|kijk|ik|naar de tv','TVSR','Після їжі я дивлюся телевізор.','After the meal I watch TV.','Après le repas, je regarde la télé.','بعد الوجبة أشاهد التلفاز.',''],
   ['dag',2,'\'s avonds|luister|ik|naar muziek','TVSR','Ввечері я слухаю музику.','In the evening I listen to music.','Le soir, j’écoute de la musique.','في المساء أستمع إلى الموسيقى.',''],
   ['dag',2,'om 18:00 u|eet|ik|een warme maaltijd','TVSR','О 18:00 я їм теплу страву.','At 18:00 I eat a hot meal.','À 18 h, je mange un repas chaud.','في الساعة 18:00 آكل وجبة ساخنة.',''],
   ['dag',2,'ik|ga|naar de supermarkt|en|ik|doe|boodschappen','SVRRSVR','Я йду в супермаркет і роблю покупки.','I go to the supermarket and I do the shopping.','Je vais au supermarché et je fais les courses.','أذهب إلى السوبرماركت وأتسوق.',''],
   ['health',1,'ik|heb|pijn|aan mijn neus','SVRR','У мене болить ніс.','My nose hurts.','J’ai mal au nez.','أشعر بألم في أنفي.','neuspijn'],
   ['health',1,'hij|heeft|pijn|aan zijn vinger','SVRR','У нього болить палець.','His finger hurts.','Il a mal au doigt.','إصبعه يؤلمه.',''],
   ['health',1,'wat|scheelt|er','QVS','Що трапилося?','What’s wrong?','Qu’est-ce qui ne va pas ?','ما المشكلة؟',''],
   ['health',2,'je|moet|de siroop|3 keer per dag|nemen','SVRRI','Тобі треба пити сироп 3 рази на день.','You must take the syrup 3 times a day.','Tu dois prendre le sirop 3 fois par jour.','يجب أن تتناول الشراب 3 مرات في اليوم.','tijd'],
   ['health',2,'een volwassene|neemt|2 tabletten','SVR','Дорослий приймає 2 таблетки.','An adult takes 2 tablets.','Un adulte prend 2 comprimés.','يتناول البالغ قرصين.','kind'],
   ['plans',1,'ik|moet|boodschappen|doen','SVRI','Я мушу робити покупки.','I have to do the shopping.','Je dois faire les courses.','يجب أن أتسوق.',''],
   ['plans',1,'het spijt me,|ik|kan|niet|komen','RSVRI','Мені шкода, я не можу прийти.','I’m sorry, I can’t come.','Je suis désolé, je ne peux pas venir.','آسف، لا أستطيع الحضور.',''],
   ['plans',2,'nee, het spijt me,|ik|heb|geen tijd','RSVR','Ні, мені шкода, я не маю часу.','No, I’m sorry, I have no time.','Non, désolé, je n’ai pas le temps.','لا، آسف، ليس لدي وقت.','zin'],
   ['plans',2,'nee, het spijt me,|ik|moet|koken','RSVI','Ні, мені шкода, я маю готувати.','No, I’m sorry, I have to cook.','Non, désolé, je dois cuisiner.','لا، آسف، يجب أن أطبخ.','poetsen']
  ];
  for(const [cat,level,q,roles,uk,en,fr,ar,x] of statements)add(cat,[level,q,roles,uk,en,fr,ar,x||'','.']);
  for(const [cat,level,q,roles,uk,en,fr,ar,x,p] of a12.bank)add(cat,[level,q,roles,uk,en,fr,ar,x,p]);
 }
 const gaps={
  comm:['Hoe ___ jij?','heet','heten','heeft','heeten'],
  people:['Dit is ___ broer. Hij heet Tom.','mijn','ik','mij','me'],
  nums:['Het ___ vandaag tien graden.','is','zijn','heeft','heb'],
  travelTime:['Half negen is ___.','08:30','09:30','08:15','09:00'],
  birthday:['Ik verjaar op de ___ mei. (3)','derde','drie','drieën','driede'],
  opening:['De winkel is ___ negen tot zes open.','van','om','op','naar'],
  forms:['Wat is ___ adres, mevrouw?','uw','u','wij','mij'],
  dag:['Vandaag ___ ik om zeven uur op.','sta','staan','opstaan','staat'],
  plans:['Ik ben aan het ___.','koken','kook','kookt','gekookt'],
  health:['Ik blijf thuis omdat ik ziek ___.','ben','is','zijn','heeft'],
  food:['Ik eet ___ fruit: bijna elke dag.','vaak','nooit','geen','niemand'],
  shopping:['Ik koop zes ___.','eieren','ei','eis','eier'],
  past:['Gisteren ___ ik naar Brugge gegaan.','ben','heb','heeft','is'],
  holiday:['We hebben bij mijn zus ___.','gelogeerd','logeert','logeren','geloogd'],
  travel:['Ik moet in Brussel ___.','overstappen','overstapt','overgestapt','stap over'],
  service:['Deze jas is groter ___ die jas.','dan','als','om','van'],
  wonen:['De huur is 700 euro. De kosten zijn 80 euro. Samen betaal ik ___ euro.','780','700','80','620'],
  contact:['Ik heb nog geen bevestiging ___.','ontvangen','ontvangt','ontvang','ontvangde'],
  reading:['Inschrijven kan tot en met vrijdag. Vrijdag inschrijven ___.','mag nog','is te laat','kan nooit','moet altijd'],
  grammar2:['Deze tas is even groot ___ die tas.','als','dan','omdat','naar'],
  ...a12.gaps
 };
 function assessments(tests,DATA) {
  const translated=(uk,en,fr,ar)=>({uk,en,fr,ar});
  const prompt=translated('Заповни пропуск','Fill the gap','Complète','أكمل الفراغ');
  for(const id of ['t5','t10']){const t=tests.find(t=>t.id===id);t.lvl='a11';for(const lang in t.title)t.title[lang]=t.title[lang].replaceAll('A1.2','A1.1');}
  // Give changed assessments new IDs; old achievements and unlocked levels remain saved.
  const health=tests.find(t=>t.id==='t10');health.id='t10_course_v2';
  const ambiguous=health.questions.find(q=>q.opts?.[0]==='Ik ga om elf uur slapen.');
  if(ambiguous)ambiguous.opts[1]='Ik gaat om elf uur slapen.';
  for(const [id,title,tabs] of [...chapters,...advanced]){
   const lvl=chapters.some(c=>c[0]===id)?'a11':'a12',g=gaps[id];
   const pool=tabs.flatMap(t=>DATA[t]?.items||[]).filter(x=>x.id.startsWith('course_'));
   const fallback=tabs.flatMap(t=>DATA[t]?.items||[]);
   const src=(pool.length>=6?pool:fallback).filter(x=>x.nl&&x.uk&&!/[→:]/.test(x.nl));
   // up to 9 words spread over the whole chapter; distractors come from the same chapter
   const step=Math.max(1,src.length/9),chosen=[];for(let k=0;k<9&&Math.floor(k*step)<src.length;k++)chosen.push(src[Math.floor(k*step)]);
   const questions=[{type:'gap',sentence:g[0],q:prompt,opts:g.slice(1),ok:0}];
   chosen.forEach((item,i)=>{
    const kind=x=>/[.?!]$/.test(x.nl)||x.nl.replace(/^(de|het) /i,'').includes(' ')?'p':'w';
    const langs=['nl','uk','en','fr','ar'],dis=[],taken=[item];
    const fits=o=>o.id!==item.id&&langs.every(l=>!o[l]||taken.every(t=>String(t[l]||'').trim().toLowerCase()!==String(o[l]).trim().toLowerCase()));
    const wide=fallback.filter(x=>x.nl&&x.uk&&!/[→:]/.test(x.nl));
    for(const group of [src.filter(x=>kind(x)===kind(item)),src,wide.filter(x=>kind(x)===kind(item)),wide]){
     for(let k=1;dis.length<3&&k<=group.length;k++){const o=group[(i*7+k*5)%group.length];if(o&&fits(o)){dis.push(o);taken.push(o)}}
     if(dis.length>=3)break;
    }
    if(dis.length<3)return;
    const cand=[item,...dis];
    if(i%2===0)questions.push({type:'mc',q:translated(`Що означає «${item.nl}»?`,`What does “${item.nl}” mean?`,`Que signifie « ${item.nl} » ?`,`ما معنى «${item.nl}»؟`),opts:cand.map(x=>translated(x.uk,x.en,x.fr,x.ar)),ok:0});
    else questions.push({type:'mc',q:translated(`Як нідерландською «${item.uk}»?`,`How do you say “${item.en}” in Dutch?`,`Comment dit-on « ${item.fr||item.en} » en néerlandais ?`,`كيف تقول «${item.ar||item.en}» بالهولندية؟`),opts:cand.map(x=>x.nl),ok:0});
   });
   const no=lvl==='a11'?chapters.findIndex(c=>c[0]===id)+1:advanced.findIndex(c=>c[0]===id)+1,clean=title.replace(/^\S+\s/,m=>/\p{Extended_Pictographic}/u.test(m)?'':m);
   tests.push({id:`course_${id}_v2`,lvl,group:'chapter',no,chapter:id,dutch:clean,title:translated(`${no} · ${clean}`,`${no} · ${clean}`,`${no} · ${clean}`,`${no} · ${clean}`),questions});
  }
  const levelTest=tests.find(t=>t.kind==='leveltest'&&t.unlocks==='a12');
  levelTest.id='lt_a12_course_v2';
  // Explicitly test all twelve 1.1 chapters, not just introductions.
  levelTest.questions=chapters.map(([id])=>({type:'gap',sentence:gaps[id][0],q:prompt,opts:gaps[id].slice(1),ok:0}));
  const text1='Te koop: damesfiets, drie jaar oud. De remmen werken goed. Vraagprijs: 85 euro. Ophalen in Leuven op zaterdag tussen 10 en 12 uur. Geen levering. Stuur een bericht om een afspraak te maken.';
  const text2='Buurtwandeling op zondag 8 juni. We vertrekken om 10 uur aan de bibliotheek. De wandeling duurt twee uur en gaat ook bij regen door. Deelname kost 4 euro; kinderen onder twaalf jaar wandelen gratis mee. Schrijf je uiterlijk vrijdag in via de website en neem zelf water mee.';
  const questions=[
   [text1,translated('Як отримати велосипед?','How can you get the bicycle?','Comment obtenir le vélo ?','كيف تحصل على الدراجة؟'),['Zelf ophalen in Leuven','Gratis laten bezorgen','Ophalen op zondag','Ophalen in Gent']],
   [text1,translated('Що треба зробити перед зустріччю?','What should you do before meeting?','Que faut-il faire avant la rencontre ?','ماذا يجب أن تفعل قبل اللقاء؟'),['Een bericht sturen','Een brief per post sturen','De fiets repareren','Naar de bibliotheek gaan']],
   [text1,translated('Коли можна забрати велосипед?','When can you collect the bicycle?','Quand peut-on récupérer le vélo ?','متى يمكنك استلام الدراجة؟'),['Zaterdag tussen tien en twaalf','Vrijdag na twaalf','Zondag om tien','Elke avond']],
   [text2,translated('Що буде, якщо піде дощ?','What happens if it rains?','Que se passe-t-il s’il pleut ?','ماذا يحدث إذا أمطرت؟'),['De wandeling gaat door','De wandeling wordt geannuleerd','De wandeling begint later','Iedereen blijft in de bibliotheek']],
   [text2,translated('Скільки платить десятирічна дитина?','How much does a ten-year-old pay?','Combien paie un enfant de dix ans ?','كم يدفع طفل عمره عشر سنوات؟'),['Niets','Vier euro','Twee euro','Twaalf euro']],
   [text2,translated('До якого дня треба зареєструватися?','By which day must you register?','Jusqu’à quel jour faut-il s’inscrire ?','بحلول أي يوم يجب التسجيل؟'),['Uiterlijk vrijdag','Zaterdagavond','Zondagochtend','Maandag']]
  ].map(([text,q,opts])=>({type:'read',text,q,opts,ok:0}));
  tests.push({id:'course_reading_texts_v1',lvl:'a12',title:translated('A1.2 · Читання оголошень','A1.2 · Reading notices','A1.2 · Lire des annonces','A1.2 · قراءة الإعلانات'),questions});
  // Practice test of 27 Oct 2026 → three short revision tests (always shuffled options; the first option is the answer).
  const T=translated,mc=(q,...opts)=>({type:'mc',q,opts,ok:0}),gap=(sentence,...opts)=>({type:'gap',sentence,q:prompt,opts,ok:0});
  const advice=nl=>T(`Дай пораду: «${nl}»`,`Give advice: “${nl}”`,`Donne un conseil : « ${nl} »`,`قدّم نصيحة: «${nl}»`);
  const pick=T('Яке речення правильне?','Which sentence is correct?','Quelle phrase est correcte ?','أي جملة صحيحة؟');
  const spell=T('Як пишеться правильно?','Which spelling is correct?','Quelle orthographe est correcte ?','ما الكتابة الصحيحة؟');
  const sayIt=(uk,en,fr,ar)=>T(`Що ти скажеш? ${uk}`,`What do you say? ${en}`,`Que dis-tu ? ${fr}`,`ماذا تقول؟ ${ar}`);
  const thursday=[
   ['course_thursday_order_v1',T('Четвер 1 · Порада й порядок слів','Thursday 1 · Advice and word order','Jeudi 1 · Conseils et ordre des mots','الخميس 1 · النصائح وترتيب الكلمات'),[
    mc(advice('Ik eet nooit vis.'),'Je moet meer vis eten.','Je moet minder vis eten.','Je meer vis moet eten.','Je moet meer vis.'),
    mc(advice('Ik eet ’s middags altijd een zak snoepjes.'),'Je moet minder snoepjes eten.','Je minder snoepjes moet eten.','Je moet meer snoepjes eten.','Je moet snoepjes minder.'),
    mc(advice('Ik drink 20 kopjes koffie per dag.'),'Je moet minder koffie drinken.','Je moet minder koffie eten.','Jij minder koffie moet drinken.','Je moet meer koffie drinken.'),
    gap('Ik eet geen fruit. Je moet ___ fruit eten.','meer','minder','geen','niet'),
    gap('Ik drink meestal cola bij het eten. Je moet minder cola ___.','drinken','eten','drink','gedronken'),
    mc(pick,'Om 07:00 u neem ik een douche.','Om 07:00 u ik neem een douche.','Om 07:00 u ik een douche neem.','Om 07:00 u neem een douche ik.'),
    mc(pick,'’s Morgens breng ik de kinderen naar school.','’s Morgens ik breng de kinderen naar school.','’s Morgens ik moet de kinderen brengen.','’s Morgens brengen ik de kinderen naar school.'),
    mc(pick,'Ik ga naar de supermarkt en ik doe boodschappen.','Ik ga naar de supermarkt en ik boodschappen doe.','Ik ga naar de supermarkt en boodschappen doen ik.','Ik ga naar de supermarkt en ik doen boodschappen.'),
    gap('Om 08:15 ___ ik.','ontbijt','ontbijten','ontbijd','ontbeet'),
    gap('Na de maaltijd ___ ik naar de tv.','kijk','kijken','ik kijk','kijkt')
   ]],
  ['course_thursday_health_v1',T('Четвер 2 · Тіло, здоров’я, вибачення','Thursday 2 · Body, health, excuses','Jeudi 2 · Corps, santé, excuses','الخميس 2 · الجسم والصحة والاعتذار'),[
    gap('Ik eet, ik spreek en ik drink met mijn ___.','mond','neus','maaltijd','longen'),
    gap('Ik adem met mijn neus en mijn ___.','longen','kinderen','tenen','oren'),
    gap('Ik heb 5 ___ aan elke voet.','tenen','tanden','vingers','handen'),
    gap('Een kind neemt 1 tablet. Een ___ neemt 2 tabletten.','volwassene','kind','kinderen','medicijn'),
    mc(pick,'Hij heeft pijn aan zijn neus.','Hij heeft neuspijn.','Hij heeft pijn neus.','Hij heeft pijn op zijn neus.'),
    gap('Je moet de siroop 3 ___ per dag nemen.','keer','tijd','zin','dag'),
    gap('Wat ___ er? — Ik heb hoofdpijn.','scheelt','schelt','scheel','scheelen'),
    gap('Ik hoest en ik ___ de hele dag.','nies','niest','neus','neis'),
    gap('38° C? Je hebt ___!','koorts','koords','koors','koerts'),
    mc(sayIt('Je kan niet naar een feest komen.','You cannot come to a party.','Tu ne peux pas venir à une fête.','لا تستطيع الحضور إلى حفلة.'),'Het spijt me, ik kan niet komen.','Het spijt me.','Veel beterschap!','Gelukkige verjaardag!'),
    mc(sayIt('Een persoon is ziek.','Someone is ill.','Quelqu’un est malade.','شخص مريض.'),'Veel beterschap!','Gelukkige verjaardag!','Smakelijk!','Goede reis!'),
    gap('— Ga je mee naar de cinema? — Nee, het spijt me, ik heb geen ___.','tijd','uur','dag','klok')
   ]],
  ['course_thursday_spelling_v1',T('Четвер 3 · Правопис і множина','Thursday 3 · Spelling and plurals','Jeudi 3 · Orthographe et pluriel','الخميس 3 · الإملاء والجمع'),[
    mc(spell,'boodschappen','boodschapen','bodschappen','boedschappen'),
    mc(spell,'ontbijt','ontbijd','ontbet','ontbeet'),
    mc(spell,'verkouden','verkoeden','verkeuden','verkowden'),
    mc(spell,'oren','ooren','oorren','orren'),
    mc(spell,'’s morgens','smorgens','s morgens','morgens’s'),
    mc(spell,'wat scheelt er?','wat schelt er?','wat er scheelt?','wat scheelt het?'),
    gap('Ik moet 2 ___ nemen.','neussprays','neusspray','neussprayen','neusspraaien'),
    gap('In de bakkerij koop ik 2 ___.','broden','brooden','broods','brode'),
    gap('Ik heb 2 ___ voor al mijn afspraken.','agenda’s','agendas','agenda','agendaas'),
    gap('2 dozen koekjes en 3 ___ chips.','zakken','zaken','zakkes','zakkens'),
    gap('Mijn zoon heeft pijn aan zijn ___.','schouders','schouden','schouder','schoudeers'),
    gap('Hij eet 3 ___ met eieren.','boterhammen','boterhamen','boterham','boterhammes')
   ]]
  ];
  for(const [id,title,questions] of thursday)tests.push({id,lvl:'a11',title,questions});
  tests.push({id:'course_reading_texts_v2',lvl:'a12',title:T('A1.2 · Читання: школа й громада','A1.2 · Reading: school and town','A1.2 · Lecture : école et commune','A1.2 · القراءة: المدرسة والبلدية'),
   questions:a12.readingQs.map(([n,uk,en,fr,ar,opts])=>({type:'read',text:a12.reading[n],q:T(uk,en,fr,ar),opts,ok:0}))});
  tests.push({id:'course_a12_review_v1',lvl:'a12',title:T('A1.2 · Повторення граматики','A1.2 · Grammar review','A1.2 · Révision de grammaire','A1.2 · مراجعة القواعد'),
   questions:a12.review.map(([kind,...x])=>kind==='gap'?gap(...x):mc(pick,...x))});
 }
 function games(dialogues,speech) {
  const data=[
   ['holiday','🧳','Після відпустки','After the holiday','Après les vacances','بعد العطلة',[
    ['Hoe was je vakantie?','Як минула твоя відпустка?','How was your holiday?'],
    ['Heel fijn. We zijn naar Brugge geweest.','Дуже добре. Ми були в Брюгге.','Very nice. We went to Bruges.'],
    ['Waar hebben jullie gelogeerd?','Де ви зупинялися?','Where did you stay?'],
    ['Bij mijn zus. We hebben ook een museum bezocht.','У моєї сестри. Ми також відвідали музей.','With my sister. We also visited a museum.'],
    ['Was het mooi weer?','Погода була гарна?','Was the weather nice?'],
    ['Het regende, maar we hebben toch gewandeld.','Ішов дощ, але ми все одно гуляли.','It rained, but we still went for a walk.']]],
   ['journey','🚆','Пропущена пересадка','A missed connection','Une correspondance ratée','رحلة ربط فائتة',[
    ['Goedemiddag. Kan ik u helpen?','Добрий день. Можу вам допомогти?','Good afternoon. Can I help you?'],
    ['Ja, mijn trein was te laat. Ik heb mijn aansluiting gemist.','Так, мій поїзд запізнився. Я пропустив пересадку.','Yes, my train was late. I missed my connection.'],
    ['Waar wilt u naartoe?','Куди ви хочете поїхати?','Where do you want to go?'],
    ['Naar Gent. Wanneer vertrekt de volgende trein?','До Гента. Коли вирушає наступний поїзд?','To Ghent. When does the next train leave?'],
    ['Over twintig minuten, van spoor vier.','За двадцять хвилин, із четвертої колії.','In twenty minutes, from platform four.'],
    ['Dank u. Dan ga ik naar spoor vier.','Дякую. Тоді я піду на четверту колію.','Thank you. Then I will go to platform four.']]],
   ['returns','🛍️','Обмін покупки','Exchanging a purchase','Échanger un achat','استبدال مشتريات',[
    ['Goedemorgen. Wat kan ik voor u doen?','Доброго ранку. Чим можу допомогти?','Good morning. What can I do for you?'],
    ['Ik heb deze trui gisteren gekocht, maar hij is te klein.','Я купив цей светр учора, але він замалий.','I bought this jumper yesterday, but it is too small.'],
    ['Wilt u een grotere maat proberen?','Хочете спробувати більший розмір?','Would you like to try a larger size?'],
    ['Ja, graag. Kan ik hem omruilen?','Так, будь ласка. Можна його обміняти?','Yes, please. Can I exchange it?'],
    ['Ja. Hebt u de kassabon bij u?','Так. У вас із собою чек?','Yes. Do you have the receipt with you?'],
    ['Ja, hier is de kassabon.','Так, ось чек.','Yes, here is the receipt.']]],
   ['appointments','📅','Зміна онлайн-запису','Changing an online booking','Modifier une réservation','تغيير حجز إلكتروني',[
    ['Goedemiddag, waarmee kan ik u helpen?','Добрий день, чим можу допомогти?','Good afternoon, how can I help?'],
    ['Ik heb online een afspraak gemaakt, maar ik kan donderdag niet komen.','Я записався онлайн, але не можу прийти в четвер.','I made an appointment online, but I cannot come on Thursday.'],
    ['Past vrijdag om tien uur voor u?','Вам підходить п’ятниця о десятій?','Does Friday at ten suit you?'],
    ['Ja, vrijdag past beter. Krijg ik een nieuwe bevestiging?','Так, п’ятниця підходить краще. Я отримаю нове підтвердження?','Yes, Friday is better. Will I receive a new confirmation?'],
    ['Ja, ik stuur u een e-mail.','Так, я надішлю вам лист.','Yes, I will send you an email.'],
    ['Dank u. Ik kijk mijn e-mail straks na.','Дякую. Я перевірю пошту пізніше.','Thank you. I will check my email later.']]]
  ];
  for(const [id,icon,uk,en,fr,ar,lines] of data)dialogues.push({id:`course_${id}`,lvl:'a12',icon,title:{uk,en,fr,ar},a:'Alex',b:'Sam',hint:'A1.2',lines:lines.map((row,i)=>[i%2?'B':'A',...row])});
  for(const [q,uk,en,m] of [
   ['Waar ben je op vakantie geweest?','Де ти був у відпустці?','Where did you go on holiday?','Ik ben naar Brugge geweest.'],
   ['Wat heb je gisteren gedaan?','Що ти робив учора?','What did you do yesterday?','Ik heb een museum bezocht.'],
   ['Waarom wil je de jas omruilen?','Чому ти хочеш обміняти куртку?','Why do you want to exchange the coat?','Ik wil hem omruilen omdat hij te klein is.'],
   ['Waarom heb je je aansluiting gemist?','Чому ти пропустив пересадку?','Why did you miss your connection?','Ik heb mijn aansluiting gemist omdat mijn trein te laat was.'],
   ['Heb je de bevestiging ontvangen?','Ти отримав підтвердження?','Have you received the confirmation?','Ik heb de bevestiging nog niet ontvangen.'],
   ['Welke kamer vind je beter?','Яка кімната тобі більше подобається?','Which room do you prefer?','Ik vind deze kamer beter omdat ze groter is.']
  ])speech.push({q,uk,en,m,lvl:'a12',open:true});
  for(const [id,icon,uk,en,fr,ar,lines] of a12.dialogues)dialogues.push({id:`course_${id}`,lvl:'a12',icon,title:{uk,en,fr,ar},a:'Alex',b:'Sam',hint:'A1.2',lines:lines.map((row,i)=>[i%2?'B':'A',...row])});
  for(const [q,uk,en,m] of a12.speech)speech.push({q,uk,en,m,lvl:'a12',open:true});
 }
 return {chapters,advanced,a12,lessons,topicInfo,apply,buildBank,assessments,games};
})();
