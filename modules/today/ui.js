/* TEST-050 «Today with Lexi» (design B + elements of C): the short home, the 5-step first-run introduction, the one-time name
   question for existing learners, the step and session result screens, «More» and «Profile» sheets. DOM only: no storage,
   no network. Every text is set with textContent (a learner's name is never parsed as HTML). Languages: uk, en, fr, ar (RTL). */
(() => {
 'use strict';
 const ukWords=n=>n%10===1&&n%100!==11?'слово':n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'слова':'слів';
 const cap=s=>s?s[0].toLocaleUpperCase()+s.slice(1):s;
 const T={
  uk:{hi:n=>n?'Привіт, '+n+'!':'Привіт!',todayTopic:t=>'Сьогодні: '+t,session:'Заняття на сьогодні',about:m=>'≈ '+m+' хв',
   review:n=>'Повторення · '+n+' '+ukWords(n),lesson:l=>'Урок · '+l,lessonNext:'Урок · наступний за маршрутом',practice:'Практика · коротка розмова',
   start:'Почати навчання',resume:(k,n)=>'Продовжити заняття · крок '+k+' з '+n,placing:'Продовжити тест рівня',again:'Ще одне заняття',pick:'Обрати урок самостійно',
   allDone:'Ти пройшов увесь маршрут цього курсу! Наступний курс — у вкладці «Навчання».',
   streak:'серія',days:n=>n+' '+(n%10===1&&n%100!==11?'день':n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'дні':'днів'),goal:'мета дня',min:'хв',course:c=>'курс '+c,
   lexiIntro:'Я Lexi — твій AI-викладач. Поясню помилку й поговорю з тобою нідерландською.',lexiBtn:'Поговорити з Lexi',lexiOff:'Для розмови з Lexi потрібен інтернет. Уроки працюють і без нього.',
   plan:(n,r,l)=>cap((n?n+', ':'')+(r?'спершу повторимо '+r+' '+ukWords(r)+', потім урок «'+l+'».':'сьогодні урок «'+l+'».'))+' Почнемо?',
   planResume:n=>cap((n?n+', ':'')+'продовжимо з того самого місця.'),planPaused:(n,l)=>cap((n?n+', ':'')+'урок «'+l+'» ще не завершено. Продовжимо з того самого місця?'),startPaused:'Продовжити урок',betaChip:(n,l)=>'Бета · '+n+' уроків ('+l+')',betaNote:(n,l)=>'Бета-курс: '+n+' уроків ('+l+'). Повторення помилок і розмовна практика з Lexi поки є лише в нідерландському курсі.',planDone:n=>cap((n?n+', ':'')+'на сьогодні заняття виконано. Можна ще одне — або відпочити.'),
   planPlacing:'Спершу закінчимо короткий тест рівня, а потім я складу план занять.',
   ask:'Привіт! Ми вже знайомі, але я ще не знаю, як тебе звати. Як мені до тебе звертатися?',enter:'Ввести ім’я',later:'Пізніше',nameLabel:'Ім’я',save:'Зберегти',
   nameNote:'Ім’я зберігається лише на цьому пристрої. Змінити або видалити його можна в «Ще → Профіль».',
   forAI:'Дозволити Lexi звертатися на ім’я і в AI-розмові. Без цієї згоди ім’я не надсилається AI-сервісу.',
   step:k=>'Крок '+k+' з 5',meetT:'Привіт! Я Lexi',meetX:'Я вестиму тебе крок за кроком: щодня скажу, що вчити, і поясню помилки.',courseQ:'Яку мову вивчаємо?',langLabel:'Мова пояснень',meet:'Познайомимось',skipStart:'Пропустити й почати урок',
   nameQ:'Як я можу до тебе звертатися?',next:'Далі',skip:'Пропустити',back:'Назад',
   goalsQ:'Навіщо тобі нідерландська?',goalsHint:'Можна обрати кілька. Від цього залежать приклади й поради Lexi.',
   goals:{belgium:'Життя в Бельгії',work:'Робота',study:'Навчання',social:'Спілкування',travel:'Подорожі',self:'Для себе'},
   levelQ:'Скільки нідерландської ти вже знаєш?',levelHint:'Ніякого іспиту — це лише точка старту.',zero:'Починаю з нуля',zeroS:'Перший урок: привітання',some:'Уже трохи знаю',someS:'Знаю кілька слів або фраз',
   test:'Короткий тест · 12 питань · ≈ 3 хв',basics:'Без тесту — почати з основ',self:'Оберу рівень сам',selfS:'Відкрию карту курсу й оберу тему',
   timeQ:'Скільки часу на день?',paceQ:'Темп',pace:{calm:['Спокійний','менше нового, більше повторень'],balanced:['Збалансований','урок, повторення й практика'],intensive:['Інтенсивний','більше уроків за заняття']},
   go:'Почати перше заняття',
   stepDone:(k,n)=>'Крок '+k+' з '+n+' готово!',score:'Правильних відповідей',xp:n=>'+'+n+' XP',nextIs:l=>'Далі: '+l,auto:s=>'Продовжуємо через '+s+' с',pause:'Пауза',stop:'Завершити на сьогодні',topicDone:t=>'Тему «'+t+'» пройдено!',
   resultT:'Заняття завершено!',resultLexi:n=>cap((n?n+', ':'')+'чудова робота! Усе збережено, навіть без інтернету.'),minutes:(m,g)=>m+' з '+g+' хв сьогодні',goalMet:'Мету дня виконано ✓',
   badges:'Нові досягнення',nextT:'Наступний крок',cont:'Продовжити навчання',home:'На головну',
   nav:{today:'Сьогодні',learn:'Навчання',lexi:'Lexi',games:'Ігри',more:'Ще'},
   more:{title:'Ще',dict:'Словник',progress:'Прогрес і досягнення',profile:'Профіль',tests:'Тести й іспити',life:'Історії LIFE',clock:'Годинник',free:'Вільна практика: усі теми',settings:'Налаштування',guides:'Практичні посібники українською',about:'Про lerenbe.com',close:'Закрити'},
   prof:{title:'Профіль',del:'Видалити ім’я',saved:'Збережено',noName:'Ім’я не вказано'},
   learn:{tests:'Тести й іспити',free:'Вільна практика',mistakes:'Повторити мої помилки'}},
  en:{hi:n=>n?'Hi, '+n+'!':'Hi!',todayTopic:t=>'Today: '+t,session:'Today’s session',about:m=>'≈ '+m+' min',
   review:n=>'Review · '+n+' '+(n===1?'word':'words'),lesson:l=>'Lesson · '+l,lessonNext:'Lesson · next on your path',practice:'Practice · a short conversation',
   start:'Start learning',resume:(k,n)=>'Continue · step '+k+' of '+n,placing:'Continue the level check',again:'Another session',pick:'Choose a lesson myself',
   allDone:'You finished this course’s whole path! The next course is in the Learn tab.',
   streak:'streak',days:n=>n+' '+(n===1?'day':'days'),goal:'daily goal',min:'min',course:c=>'course '+c,
   lexiIntro:'I’m Lexi, your AI tutor. I explain mistakes and talk with you in Dutch.',lexiBtn:'Talk to Lexi',lexiOff:'Chatting with Lexi needs the internet. Lessons work without it.',
   plan:(n,r,l)=>cap((n?n+', ':'')+(r?'first we’ll review '+r+' '+(r===1?'word':'words')+', then the lesson “'+l+'”.':'today’s lesson is “'+l+'”.'))+' Ready?',
   planResume:n=>cap((n?n+', ':'')+'let’s pick up right where you stopped.'),planPaused:(n,l)=>cap((n?n+', ':'')+'the lesson “'+l+'” isn’t finished yet. Shall we carry on where you stopped?'),startPaused:'Continue the lesson',betaChip:(n,l)=>'Beta · '+n+' lessons ('+l+')',betaNote:(n,l)=>'Beta course: '+n+' lessons ('+l+'). Mistake review and conversation practice with Lexi are only in the Dutch course for now.',planDone:n=>cap((n?n+', ':'')+'today’s session is done. You can do another one — or take a break.'),
   planPlacing:'Let’s finish the short level check first, then I’ll plan your sessions.',
   ask:'Hi! We’ve met before, but I don’t know your name yet. What should I call you?',enter:'Enter my name',later:'Later',nameLabel:'Name',save:'Save',
   nameNote:'Your name stays on this device only. Change or delete it in More → Profile.',
   forAI:'Let Lexi use my name in the AI chat too. Without this consent the name is never sent to the AI service.',
   step:k=>'Step '+k+' of 5',meetT:'Hi! I’m Lexi',meetX:'I’ll guide you step by step: every day I’ll tell you what to learn and explain your mistakes.',courseQ:'Which language are we learning?',langLabel:'Explanation language',meet:'Let’s get started',skipStart:'Skip and start a lesson',
   nameQ:'What should I call you?',next:'Next',skip:'Skip',back:'Back',
   goalsQ:'Why are you learning Dutch?',goalsHint:'Pick as many as you like. Lexi uses them for examples and tips.',
   goals:{belgium:'Life in Belgium',work:'Work',study:'Studies',social:'Talking to people',travel:'Travel',self:'For myself'},
   levelQ:'How much Dutch do you already know?',levelHint:'No exam — just a starting point.',zero:'Starting from zero',zeroS:'First lesson: greetings',some:'I know a little',someS:'A few words or phrases',
   test:'Short check · 12 questions · ≈ 3 min',basics:'No check — start with the basics',self:'I’ll choose my level',selfS:'I’ll open the course map and pick a topic',
   timeQ:'How much time per day?',paceQ:'Pace',pace:{calm:['Calm','less new material, more review'],balanced:['Balanced','a lesson, review and practice'],intensive:['Intensive','more lessons per session']},
   go:'Start my first session',
   stepDone:(k,n)=>'Step '+k+' of '+n+' done!',score:'Correct answers',xp:n=>'+'+n+' XP',nextIs:l=>'Next: '+l,auto:s=>'Continuing in '+s+' s',pause:'Pause',stop:'Stop for today',topicDone:t=>'Topic “'+t+'” complete!',
   resultT:'Session complete!',resultLexi:n=>cap((n?n+', ':'')+'great work! Everything is saved, even offline.'),minutes:(m,g)=>m+' of '+g+' min today',goalMet:'Daily goal reached ✓',
   badges:'New achievements',nextT:'Next step',cont:'Continue learning',home:'Back to Today',
   nav:{today:'Today',learn:'Learn',lexi:'Lexi',games:'Games',more:'More'},
   more:{title:'More',dict:'Dictionary',progress:'Progress and achievements',profile:'Profile',tests:'Tests and exams',life:'LIFE stories',clock:'Clock',free:'Free practice: all topics',settings:'Settings',guides:'Practical guides (in Ukrainian)',about:'About lerenbe.com',close:'Close'},
   prof:{title:'Profile',del:'Delete my name',saved:'Saved',noName:'No name set'},
   learn:{tests:'Tests and exams',free:'Free practice',mistakes:'Review my mistakes'}},
  fr:{hi:n=>n?'Bonjour, '+n+' !':'Bonjour !',todayTopic:t=>'Aujourd’hui : '+t,session:'La séance du jour',about:m=>'≈ '+m+' min',
   review:n=>'Révision · '+n+' '+(n===1?'mot':'mots'),lesson:l=>'Leçon · '+l,lessonNext:'Leçon · la suivante du parcours',practice:'Pratique · une courte conversation',
   start:'Commencer à apprendre',resume:(k,n)=>'Continuer · étape '+k+' sur '+n,placing:'Continuer le test de niveau',again:'Une autre séance',pick:'Choisir une leçon moi-même',
   allDone:'Tu as terminé tout le parcours de ce cours ! Le cours suivant est dans l’onglet Apprendre.',
   streak:'série',days:n=>n+' '+(n<2?'jour':'jours'),goal:'objectif du jour',min:'min',course:c=>'cours '+c,
   lexiIntro:'Je suis Lexi, ton prof IA. J’explique tes erreurs et je parle néerlandais avec toi.',lexiBtn:'Parler avec Lexi',lexiOff:'Discuter avec Lexi demande Internet. Les leçons marchent sans.',
   plan:(n,r,l)=>cap((n?n+', ':'')+(r?'d’abord on révise '+r+' '+(r===1?'mot':'mots')+', puis la leçon « '+l+' ».':'aujourd’hui, la leçon « '+l+' ».'))+' On y va ?',
   planResume:n=>cap((n?n+', ':'')+'on reprend au même endroit.'),planPaused:(n,l)=>cap((n?n+', ':'')+'la leçon « '+l+' » n’est pas finie. On reprend au même endroit ?'),startPaused:'Continuer la leçon',betaChip:(n,l)=>'Bêta · '+n+' leçons ('+l+')',betaNote:(n,l)=>'Cours bêta : '+n+' leçons ('+l+'). La révision des erreurs et la conversation avec Lexi existent pour l’instant seulement dans le cours de néerlandais.',planDone:n=>cap((n?n+', ':'')+'la séance du jour est faite. Tu peux en faire une autre — ou faire une pause.'),
   planPlacing:'Terminons d’abord le court test de niveau, puis je préparerai tes séances.',
   ask:'Salut ! On se connaît déjà, mais je ne connais pas encore ton prénom. Comment dois-je t’appeler ?',enter:'Saisir mon prénom',later:'Plus tard',nameLabel:'Prénom',save:'Enregistrer',
   nameNote:'Ton prénom reste uniquement sur cet appareil. Modifie-le ou supprime-le dans Plus → Profil.',
   forAI:'Autoriser Lexi à utiliser mon prénom aussi dans le chat IA. Sans cet accord, le prénom n’est jamais envoyé au service d’IA.',
   step:k=>'Étape '+k+' sur 5',meetT:'Bonjour ! Je suis Lexi',meetX:'Je te guide pas à pas : chaque jour, je te dis quoi apprendre et je t’explique tes erreurs.',courseQ:'Quelle langue apprenons-nous ?',langLabel:'Langue des explications',meet:'Faisons connaissance',skipStart:'Passer et commencer une leçon',
   nameQ:'Comment dois-je t’appeler ?',next:'Suivant',skip:'Passer',back:'Retour',
   goalsQ:'Pourquoi apprends-tu le néerlandais ?',goalsHint:'Choisis-en plusieurs si tu veux. Lexi s’en sert pour les exemples et les conseils.',
   goals:{belgium:'Vivre en Belgique',work:'Travail',study:'Études',social:'Parler aux gens',travel:'Voyages',self:'Pour moi'},
   levelQ:'Quel est ton niveau de néerlandais ?',levelHint:'Pas d’examen — juste un point de départ.',zero:'Je pars de zéro',zeroS:'Première leçon : saluer',some:'J’en connais un peu',someS:'Quelques mots ou phrases',
   test:'Court test · 12 questions · ≈ 3 min',basics:'Sans test — commencer par les bases',self:'Je choisis mon niveau',selfS:'J’ouvre la carte du cours et je choisis',
   timeQ:'Combien de temps par jour ?',paceQ:'Rythme',pace:{calm:['Calme','moins de nouveau, plus de révision'],balanced:['Équilibré','leçon, révision et pratique'],intensive:['Intensif','plus de leçons par séance']},
   go:'Commencer ma première séance',
   stepDone:(k,n)=>'Étape '+k+' sur '+n+' terminée !',score:'Bonnes réponses',xp:n=>'+'+n+' XP',nextIs:l=>'Ensuite : '+l,auto:s=>'On continue dans '+s+' s',pause:'Pause',stop:'Arrêter pour aujourd’hui',topicDone:t=>'Thème « '+t+' » terminé !',
   resultT:'Séance terminée !',resultLexi:n=>cap((n?n+', ':'')+'super travail ! Tout est enregistré, même hors ligne.'),minutes:(m,g)=>m+' sur '+g+' min aujourd’hui',goalMet:'Objectif du jour atteint ✓',
   badges:'Nouveaux succès',nextT:'Étape suivante',cont:'Continuer à apprendre',home:'Retour à Aujourd’hui',
   nav:{today:'Aujourd’hui',learn:'Apprendre',lexi:'Lexi',games:'Jeux',more:'Plus'},
   more:{title:'Plus',dict:'Dictionnaire',progress:'Progrès et succès',profile:'Profil',tests:'Tests et examens',life:'Histoires LIFE',clock:'Horloge',free:'Pratique libre : tous les thèmes',settings:'Réglages',guides:'Guides pratiques (en ukrainien)',about:'À propos de lerenbe.com',close:'Fermer'},
   prof:{title:'Profil',del:'Supprimer mon prénom',saved:'Enregistré',noName:'Aucun prénom'},
   learn:{tests:'Tests et examens',free:'Pratique libre',mistakes:'Revoir mes erreurs'}},
  ar:{hi:n=>n?'مرحباً يا '+n+'!':'مرحباً!',todayTopic:t=>'اليوم: '+t,session:'درس اليوم',about:m=>'≈ '+m+' د',
   review:n=>'مراجعة · '+n+' كلمات',lesson:l=>'درس · '+l,lessonNext:'درس · التالي في مسارك',practice:'تدريب · محادثة قصيرة',
   start:'ابدأ التعلّم',resume:(k,n)=>'تابع · الخطوة '+k+' من '+n,placing:'تابع اختبار المستوى',again:'درس آخر',pick:'اختر درساً بنفسي',
   allDone:'أكملت مسار هذه الدورة كله! الدورة التالية في تبويب التعلّم.',
   streak:'أيام متتالية',days:n=>n+' '+(n===1?'يوم':'أيام'),goal:'هدف اليوم',min:'د',course:c=>'دورة '+c,
   lexiIntro:'أنا Lexi، مدرّسك بالذكاء الاصطناعي. أشرح أخطاءك وأتحدث معك بالهولندية.',lexiBtn:'تحدّث مع Lexi',lexiOff:'المحادثة مع Lexi تحتاج إلى الإنترنت. الدروس تعمل بدونه.',
   plan:(n,r,l)=>(n?n+'، ':'')+(r?'أولاً نراجع '+r+' كلمات، ثم درس «'+l+'».':'درس اليوم «'+l+'».')+' هل نبدأ؟',
   planResume:n=>(n?n+'، ':'')+'لنكمل من حيث توقفت.',planPaused:(n,l)=>(n?n+'، ':'')+'لم يكتمل درس «'+l+'» بعد. هل نكمل من حيث توقفت؟',startPaused:'تابع الدرس',betaChip:(n,l)=>'تجريبي · '+n+' درسًا ('+l+')',betaNote:(n,l)=>'دورة تجريبية: '+n+' درسًا ('+l+'). مراجعة الأخطاء والمحادثة مع Lexi متاحتان حاليًا في دورة الهولندية فقط.',planDone:n=>(n?n+'، ':'')+'أنجزت درس اليوم. يمكنك درساً آخر أو أخذ استراحة.',
   planPlacing:'لننهِ أولاً اختبار المستوى القصير، ثم أضع لك خطة الدروس.',
   ask:'مرحباً! نحن نعرف بعضنا، لكني لا أعرف اسمك بعد. بماذا أناديك؟',enter:'أدخل اسمي',later:'لاحقاً',nameLabel:'الاسم',save:'حفظ',
   nameNote:'يبقى اسمك على هذا الجهاز فقط. يمكنك تغييره أو حذفه من «المزيد ← الملف الشخصي».',
   forAI:'اسمح لـ Lexi باستخدام اسمي في محادثة الذكاء الاصطناعي أيضاً. دون هذه الموافقة لا يُرسل الاسم إلى خدمة الذكاء الاصطناعي.',
   step:k=>'الخطوة '+k+' من 5',meetT:'مرحباً! أنا Lexi',meetX:'سأرشدك خطوة بخطوة: كل يوم أخبرك بما تتعلّمه وأشرح أخطاءك.',courseQ:'أي لغة سنتعلّم؟',langLabel:'لغة الشرح',meet:'لنتعارف',skipStart:'تخطَّ وابدأ درساً',
   nameQ:'بماذا أناديك؟',next:'التالي',skip:'تخطٍّ',back:'رجوع',
   goalsQ:'لماذا تتعلّم الهولندية؟',goalsHint:'يمكنك اختيار أكثر من هدف. يستخدمها Lexi للأمثلة والنصائح.',
   goals:{belgium:'الحياة في بلجيكا',work:'العمل',study:'الدراسة',social:'التواصل مع الناس',travel:'السفر',self:'لنفسي'},
   levelQ:'كم تعرف من الهولندية؟',levelHint:'لا امتحان — مجرد نقطة بداية.',zero:'أبدأ من الصفر',zeroS:'الدرس الأول: التحية',some:'أعرف القليل',someS:'بعض الكلمات أو العبارات',
   test:'اختبار قصير · 12 سؤالاً · ≈ 3 د',basics:'دون اختبار — ابدأ بالأساسيات',self:'سأختار مستواي',selfS:'سأفتح خريطة الدورة وأختار موضوعًا',
   timeQ:'كم من الوقت يومياً؟',paceQ:'الوتيرة',pace:{calm:['هادئة','جديد أقل ومراجعة أكثر'],balanced:['متوازنة','درس ومراجعة وتدريب'],intensive:['مكثفة','دروس أكثر في الجلسة']},
   go:'ابدأ أول درس',
   stepDone:(k,n)=>'اكتملت الخطوة '+k+' من '+n+'!',score:'الإجابات الصحيحة',xp:n=>'+'+n+' XP',nextIs:l=>'التالي: '+l,auto:s=>'نكمل بعد '+s+' ث',pause:'إيقاف مؤقت',stop:'أنهِ لليوم',topicDone:t=>'اكتمل موضوع «'+t+'»!',
   resultT:'اكتمل الدرس!',resultLexi:n=>(n?n+'، ':'')+'عمل رائع! كل شيء محفوظ، حتى دون إنترنت.',minutes:(m,g)=>m+' من '+g+' د اليوم',goalMet:'تحقق هدف اليوم ✓',
   badges:'إنجازات جديدة',nextT:'الخطوة التالية',cont:'تابع التعلّم',home:'العودة إلى اليوم',
   nav:{today:'اليوم',learn:'التعلّم',lexi:'Lexi',games:'الألعاب',more:'المزيد'},
   more:{title:'المزيد',dict:'القاموس',progress:'التقدّم والإنجازات',profile:'الملف الشخصي',tests:'الاختبارات والامتحانات',life:'قصص LIFE',clock:'الساعة',free:'تدريب حر: كل المواضيع',settings:'الإعدادات',guides:'أدلة عملية (بالأوكرانية)',about:'حول lerenbe.com',close:'إغلاق'},
   prof:{title:'الملف الشخصي',del:'احذف اسمي',saved:'تم الحفظ',noName:'لا يوجد اسم'},
   learn:{tests:'الاختبارات والامتحانات',free:'تدريب حر',mistakes:'راجع أخطائي'}}
 };
 const tr=lang=>T[lang]||T.uk;
 const LEXI_IMG='./img/lexi/lexi.webp';
 // Own stylesheet, loaded by this module (not render-blocking in index.html: the perf budget of blocking styles is 45 KB gzip).
 // It is in the Service Worker cache, so offline it comes from there. Until it is ready a new block stays invisible (no flash).
 const CSS_HREF='./modules/today/style.css?v=3';let cssOk=false;
 const cssReady=(()=>{try{let l=document.querySelector('link[data-td-css]');if(!l){l=document.createElement('link');l.rel='stylesheet';l.href=CSS_HREF;l.dataset.tdCss='1';document.head.appendChild(l)}
  return new Promise(r=>{const done=()=>{cssOk=true;r()};if(l.sheet){done();return}l.addEventListener('load',done,{once:true});l.addEventListener('error',done,{once:true});setTimeout(done,2000)})}catch{cssOk=true;return Promise.resolve()}})();
 const styled=el=>{if(!cssOk){el.style.visibility='hidden';cssReady.then(()=>{el.style.visibility=''})}return el};
 function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
 function btn(label,fn,cls='td-btn'){const b=node('button',cls,label);b.type='button';if(fn)b.onclick=fn;return b}
 function avatar(size){const i=node('img','td-av');i.src=LEXI_IMG;i.alt='';i.setAttribute('aria-hidden','true');i.width=size;i.height=size;i.decoding='async';return i}
 const dirOf=lang=>lang==='ar'?'rtl':'ltr';
 // a name in another script (Arabic in a Ukrainian line, Latin in an Arabic one) is isolated so punctuation stays in place
 const iso=n=>n?'\u2068'+n+'\u2069':'';
 const focusHeading=root=>{const h=root.querySelector('h1,h2');if(h){h.tabIndex=-1;try{h.focus({preventScroll:true})}catch{}}};

 /* vm: {lang, name, topic, steps:[{kind,label,min,done,current}], minutes, mode:'start'|'resume'|'placing'|'done'|'allDone', paused (a lesson is unfinished: «Продовжити урок»), advice:{text,label,run} (Lexi's advice), note (a short honest line, e.g. a beta course), position:{index,total},
         review, lessonLabel, stats:{streak,min,goal,pct,course}, lexi:{available,onOpen}, ask:{onSave(name,forAI),onLater()}|null, onStart, onLearn} */
 function home(root,vm){
  const t=tr(vm.lang),wrap=styled(node('section','td-home'));wrap.lang=vm.lang;wrap.dir=dirOf(vm.lang);wrap.dataset.mode=vm.mode;
  const head=node('div','td-head');head.append(node('h1','td-hi',t.hi(iso(vm.name))));if(vm.topic)head.append(node('p','td-sub',t.todayTopic(vm.topic)));wrap.appendChild(head);
  if(vm.ask)wrap.appendChild(askCard(vm.lang,vm.ask));
  const card=node('section','td-today');card.setAttribute('aria-labelledby','tdSessionTitle');
  const top=node('div','td-today-top'),h=node('h2','td-today-title',t.session);h.id='tdSessionTitle';top.append(h);if(vm.minutes&&vm.mode!=='allDone')top.append(node('span','td-min',t.about(vm.minutes)));card.appendChild(top);
  // Element of C: Lexi says the plan in one local sentence (built on the device, no AI).
  const say=node('div','td-say');say.append(avatar(40));
  // the heading already greets by name: Lexi's line does not repeat it (no over-use of the name)
  const line=vm.mode==='resume'?t.planResume(''):vm.mode==='done'?t.planDone(''):vm.mode==='placing'?t.planPlacing:vm.mode==='allDone'?t.allDone:vm.paused?t.planPaused('',vm.lessonLabel||''):t.plan('',vm.review,vm.lessonLabel||'');
  const bubble=node('p','td-bubble',line);say.append(bubble);card.appendChild(say);
  if(vm.note){const nt=node('p','td-note td-beta',vm.note);nt.dataset.note='beta';card.appendChild(nt)} // TEST-050 RC: an honest note for a course that is not complete yet
  if(vm.steps?.length&&vm.mode!=='placing'&&vm.mode!=='allDone'){const ol=node('ol','td-steps');vm.steps.forEach((s,i)=>{const li=node('li','td-step'+(s.done?' is-done':'')+(s.current?' is-current':''));li.dataset.kind=s.kind;
    const mark=node('span','td-step-mark',s.done?'✓':String(i+1));mark.setAttribute('aria-hidden','true');li.append(mark,node('span','td-step-label',s.label),node('span','td-step-min',t.about(s.min)));if(s.current)li.setAttribute('aria-current','step');ol.appendChild(li)});card.appendChild(ol)}
  const label=vm.mode==='resume'?t.resume(vm.position.index+1,vm.position.total):vm.mode==='placing'?t.placing:vm.mode==='done'?t.again:vm.mode==='allDone'?t.pick:vm.paused?t.startPaused:t.start;
  const main=btn(label,vm.mode==='allDone'?vm.onLearn:vm.onStart,'td-btn td-primary td-start');main.dataset.action='start';card.appendChild(main);
  if(vm.mode!=='allDone'){const pick=btn(t.pick,vm.onLearn,'td-link');pick.dataset.action='learn';card.appendChild(pick)}
  wrap.appendChild(card);
  const s=vm.stats||{},tiles=node('div','td-tiles');tiles.setAttribute('role','list');
  const tile=(value,label,id)=>{const d=node('div','td-tile');d.setAttribute('role','listitem');d.dataset.tile=id;d.append(node('strong','',value),node('span','',label));return d};
  tiles.append(tile(t.days(s.streak||0),t.streak,'streak'),tile((s.min||0)+'/'+(s.goal||10)+' '+t.min,t.goal,'goal'),tile((s.pct||0)+'%',t.course(s.course||'A1.1'),'course'));
  tiles.children[1].querySelector('strong').dir='ltr';wrap.appendChild(tiles);
  const lexi=node('section','td-lexi');lexi.setAttribute('aria-label','Lexi');lexi.append(avatar(64));const lx=node('div','td-lexi-text');lx.append(node('p','',t.lexiIntro));
  if(vm.lexi&&!vm.lexi.available)lx.append(node('p','td-note',t.lexiOff));
  // Lexi's advice from the learner's own results (local, no AI): one line and a button that opens the exercise.
  if(vm.advice?.text){const a=node('div','td-advice');a.append(node('p','',vm.advice.text));const go=btn(vm.advice.label,vm.advice.run,'td-btn td-ghost td-advice-btn');go.dataset.action='advice';a.append(go);lx.append(a)}
  const open=btn(t.lexiBtn,vm.lexi?.onOpen,'td-btn td-ghost');open.dataset.action='lexi';lx.append(open);lexi.append(lx);wrap.appendChild(lexi);
  root.appendChild(wrap);return wrap;
 }
 function askCard(lang,ask){
  const t=tr(lang),card=node('section','td-ask');card.setAttribute('role','status');card.dataset.card='ask-name';
  const row=node('div','td-say');row.append(avatar(48),node('p','',t.ask));card.appendChild(row);
  const actions=node('div','td-ask-actions');
  const enter=btn(t.enter,()=>{actions.replaceChildren(nameForm(lang,'',false,(n,ai)=>ask.onSave(n,ai)))},'td-btn td-ghost'); // the lesson stays the one main action on «Сьогодні»
  enter.dataset.action='name';const later=btn(t.later,()=>ask.onLater(),'td-btn td-ghost');later.dataset.action='later';actions.append(enter,later);card.appendChild(actions);return card;
 }
 function nameForm(lang,value,forAI,onSave){
  const t=tr(lang),f=node('form','td-name-form');f.noValidate=true;
  const id='tdName'+Math.random().toString(36).slice(2,7),label=node('label','td-label',t.nameLabel);label.htmlFor=id;
  const input=node('input','td-input');input.id=id;input.type='text';input.maxLength=60;input.autocomplete='given-name';input.value=value||'';input.setAttribute('autocapitalize','words');input.spellcheck=false;
  const consent=node('label','td-check'),cb=node('input');cb.type='checkbox';cb.checked=!!forAI;consent.append(cb,node('span','',t.forAI));
  f.append(label,input,node('p','td-note',t.nameNote),consent,btn(t.save,null,'td-btn td-primary'));f.lastChild.type='submit';
  f.onsubmit=e=>{e.preventDefault();onSave(input.value,cb.checked)};setTimeout(()=>{try{input.focus()}catch{}},30);return f;
 }

 /* Step finished inside a session. vm: {lang, index, total, correct, all, gain, topic, nextLabel, onNext, onStop, autoMs} */
 function stepDone(root,vm){
  const t=tr(vm.lang),box=styled(node('section','td-card td-step-done'));box.lang=vm.lang;box.dir=dirOf(vm.lang);box.setAttribute('role','status');
  box.append(node('h2','',t.stepDone(vm.index,vm.total)));
  if(vm.topic)box.append(node('p','td-topic-done',t.topicDone(vm.topic)));
  if(vm.all>0){const p=node('p','td-score');p.append(node('span','',t.score+': '),node('strong','',vm.correct+' / '+vm.all));box.append(p)}
  if(vm.gain>0)box.append(node('p','td-xp',t.xp(vm.gain)));
  const next=btn(vm.nextLabel?t.nextIs(vm.nextLabel):t.cont,vm.onNext,'td-btn td-primary');next.dataset.action='next';box.append(next);
  const autoLine=node('p','td-note td-auto');box.append(autoLine);
  let left=Math.ceil((vm.autoMs??3000)/1000),timer=null;
  const stopTimer=()=>{if(timer){clearInterval(timer);timer=null}autoLine.textContent=''};
  if(left>0){autoLine.textContent=t.auto(left);timer=setInterval(()=>{if(!box.isConnected){stopTimer();return}left--;if(left<=0){stopTimer();vm.onNext()}else autoLine.textContent=t.auto(left)},1000);
   const pause=btn(t.pause,()=>{stopTimer();pause.remove()},'td-btn td-ghost');pause.dataset.action='pause';box.append(pause)}
  const stop=btn(t.stop,()=>{stopTimer();vm.onStop()},'td-link');stop.dataset.action='stop';box.append(stop);
  root.appendChild(box);setTimeout(()=>{try{next.focus({preventScroll:true})}catch{}},20);return {cancel:stopTimer};
 }

 /* Whole session finished. vm: {lang,name,correct,all,gain,min,goal,badges:[names],nextLabel,onMore,onHome} */
 function result(root,vm){
  const t=tr(vm.lang),box=styled(node('section','td-card td-result'));box.lang=vm.lang;box.dir=dirOf(vm.lang);box.setAttribute('role','status');
  box.append(node('h2','',t.resultT));const say=node('div','td-say');say.append(avatar(48),node('p','td-bubble',t.resultLexi(iso(vm.name))));box.append(say);
  const dl=node('dl','td-sum');const row=(k,v,id)=>{const d=node('div','td-sum-row');d.dataset.sum=id;const dd=node('dd','',v);dd.dir='ltr';d.append(node('dt','',k),dd);dl.appendChild(d)};
  if(vm.all>0)row(t.score,vm.correct+' / '+vm.all,'score');row('XP',t.xp(vm.gain||0),'xp');row(t.goal,t.minutes(vm.min,vm.goal),'minutes');box.append(dl);
  if(vm.min>=vm.goal)box.append(node('p','td-met',t.goalMet));
  if(vm.badges?.length){box.append(node('h3','',t.badges));const ul=node('ul','td-badges');vm.badges.forEach(b=>ul.appendChild(node('li','','🏅 '+b)));box.append(ul)}
  if(vm.nextLabel){box.append(node('h3','',t.nextT),node('p','td-next',vm.nextLabel))}
  const more=btn(t.cont,vm.onMore,'td-btn td-primary');more.dataset.action='more';const end=btn(t.stop,vm.onHome,'td-btn td-ghost');end.dataset.action='stop';box.append(more,end); // TEST-050 RC: «Продовжити навчання» / «Завершити на сьогодні»
  root.appendChild(box);focusHeading(box);return box;
 }

 // ---- Dialogs (native <dialog>: focus stays inside, Escape closes).
 function dialog(lang,cls,label){const d=styled(node('dialog','td-dialog '+cls));d.lang=lang;d.dir=dirOf(lang);d.setAttribute('aria-label',label);document.body.appendChild(d);d.addEventListener('close',()=>d.remove());try{d.showModal()}catch{d.setAttribute('open','')}return d}

 /* First run for a new learner: 5 short screens. opts: {lang, langs:[[code,label]], setLang(code)→code, onDone(data)}.
    data: {course:'nl'|'en'|'fr', name, forAI, goals, start:'zero'|'test'|'basics'|'self', goal, pace, skipped:boolean}. Skip on any screen keeps what was chosen.
    opts.courses: [[id, name, subtitle]] or lang→[[…]] — the courses the learner may pick (the first one is the default). */
 function onboarding(opts){
  let lang=opts.lang;const listOf=()=>{const c=typeof opts.courses==='function'?opts.courses(lang):opts.courses;return Array.isArray(c)&&c.length?c:[['nl','Nederlands','']]};let courses=listOf();const st={course:courses[0][0],name:'',forAI:false,goals:[],start:'zero',goal:10,pace:'balanced'};let step=1,some=false;
  const d=dialog(lang,'td-onb',tr(lang).meetT);d.addEventListener('cancel',e=>e.preventDefault());
  const finish=skipped=>{if(!d.open&&!d.isConnected)return;try{d.close()}catch{d.remove()}opts.onDone({...st,skipped})};
  function chips(list,isOn,toggle,role='group',label=''){const g=node('div','td-chips');g.setAttribute('role',role);if(label)g.setAttribute('aria-label',label);list.forEach(([id,text,sub])=>{const b=btn('',()=>{toggle(id);draw()},'td-chip'+(isOn(id)?' is-on':''));b.dataset.value=id;b.append(node('strong','',text));if(sub)b.append(node('small','',sub));b.setAttribute('aria-pressed',String(isOn(id)));g.appendChild(b)});return g}
  function draw(){
   const t=tr(lang);d.lang=lang;d.dir=dirOf(lang);d.replaceChildren();d.dataset.step=String(step);courses=listOf(); // course names follow a language change on step 1
   const box=node('div','td-onb-body');box.append(node('p','td-onb-step',t.step(step)));
   const nav=node('div','td-onb-nav'),next=(label,fn)=>{const b=btn(label,fn,'td-btn td-primary');b.dataset.action='next';return b},skip=label=>{const b=btn(label||t.skip,()=>finish(true),'td-link');b.dataset.action='skip';return b};
   if(step>1){const b=btn(t.back,()=>{step--;draw()},'td-link td-back');b.dataset.action='back';box.prepend(b)}
   if(step===1){const img=avatar(courses.length>1?72:120);img.alt='Lexi';img.removeAttribute('aria-hidden');box.append(img,node('h2','',t.meetT),node('p','td-onb-text',t.meetX));
    // TEST-050: the course first. The choice decides the course and the first lesson (Dutch is never started for English/French).
    if(courses.length>1){box.classList.add('has-courses');box.append(node('h3','td-course-q',t.courseQ));const g=chips(courses.map(([id,name,sub])=>[id,name,sub]),id=>st.course===id,id=>{st.course=id;if(id!=='nl'&&st.start==='test')st.start='basics'},'radiogroup',t.courseQ);g.classList.add('td-courses');[...g.children].forEach(c=>{c.setAttribute('role','radio');c.setAttribute('aria-checked',c.getAttribute('aria-pressed'));c.removeAttribute('aria-pressed')});box.append(g)}
    const label=node('label','td-label',t.langLabel),sel=node('select','td-input');sel.id='tdOnbLang';label.htmlFor=sel.id;opts.langs.forEach(([code,text])=>{const o=node('option','',text);o.value=code;sel.appendChild(o)});sel.value=lang;
    sel.onchange=()=>{lang=opts.setLang(sel.value)||sel.value;draw()};box.append(label,sel);nav.append(next(t.meet,()=>{step=2;draw()}),skip(t.skipStart))}
   else if(step===2){const say=node('div','td-say');say.append(avatar(48));const q=node('h2','td-bubble',t.nameQ);say.append(q);box.append(say);
    const label=node('label','td-label',t.nameLabel),input=node('input','td-input');input.id='tdOnbName';label.htmlFor=input.id;input.type='text';input.maxLength=60;input.autocomplete='given-name';input.value=st.name;input.spellcheck=false;
    const consent=node('label','td-check'),cb=node('input');cb.type='checkbox';cb.checked=st.forAI;consent.append(cb,node('span','',t.forAI));
    box.append(label,input,node('p','td-note',t.nameNote),consent);const keep=()=>{st.name=input.value;st.forAI=cb.checked};input.oninput=keep;cb.onchange=keep;
    nav.append(next(t.next,()=>{keep();st.nameAsked=true;step=3;draw()}),btn(t.skip,()=>{st.name='';st.forAI=false;st.nameAsked=true;step=3;draw()},'td-link'))}
   else if(step===3){box.append(node('h2','',t.goalsQ),node('p','td-note',t.goalsHint),chips(Object.entries(t.goals),id=>st.goals.includes(id),id=>{st.goals=st.goals.includes(id)?st.goals.filter(x=>x!==id):[...st.goals,id]},'group',t.goalsQ));
    nav.append(next(t.next,()=>{step=4;draw()}),skip())}
   else if(step===4){box.append(node('h2','',t.levelQ),node('p','td-note',t.levelHint));
    const opt=(id,title,sub,on)=>{const b=btn('',()=>{if(id==='some'){some=true;if(st.start!=='test')st.start='basics'}else{some=false;st.start=id}draw()},'td-option'+(on?' is-on':''));b.dataset.value=id;b.setAttribute('aria-pressed',String(on));b.append(node('strong','',title),node('small','',sub));return b};
    box.append(opt('zero',t.zero,t.zeroS,st.start==='zero'&&!some),opt('some',t.some,t.someS,some));
    if(some){const sub=chips((st.course==='nl'?[['test',t.test],['basics',t.basics]]:[['basics',t.basics]]),id=>st.start===id,id=>{st.start=id},'radiogroup',t.some);sub.classList.add('td-sub');[...sub.children].forEach(c=>{c.setAttribute('role','radio');c.setAttribute('aria-checked',c.getAttribute('aria-pressed'));c.removeAttribute('aria-pressed')});box.append(sub)}
    box.append(opt('self',t.self,t.selfS,st.start==='self'));nav.append(next(t.next,()=>{step=5;draw()}),skip())}
   else{box.append(node('h2','',t.timeQ));
    const g=chips([5,10,15,20].map(m=>[String(m),m+' '+t.min]),id=>String(st.goal)===id,id=>{st.goal=Number(id)},'radiogroup',t.timeQ);g.classList.add('td-goals');[...g.children].forEach(c=>{c.setAttribute('role','radio');c.setAttribute('aria-checked',c.getAttribute('aria-pressed'));c.removeAttribute('aria-pressed')});box.append(g);
    box.append(node('h3','',t.paceQ));const p=chips(Object.entries(t.pace).map(([id,[a,b]])=>[id,a,b]),id=>st.pace===id,id=>{st.pace=id},'radiogroup',t.paceQ);[...p.children].forEach(c=>{c.setAttribute('role','radio');c.setAttribute('aria-checked',c.getAttribute('aria-pressed'));c.removeAttribute('aria-pressed')});box.append(p);
    const go=next(t.go,()=>finish(false));go.dataset.action='finish';nav.append(go)}
   d.append(box,nav);focusHeading(d);
  }
  draw();return d;
 }

 /* «More»: every part of the app that is not a tab. opts: {lang, items:[{id, icon, label?, run}]} */
 function more(opts){const t=tr(opts.lang),d=dialog(opts.lang,'td-sheet td-more',t.more.title);const head=node('div','td-sheet-head');head.append(node('h2','',t.more.title),btn(t.more.close,()=>d.close(),'td-link'));d.appendChild(head);
  const list=node('ul','td-more-list');opts.items.forEach(it=>{const li=node('li'),b=btn('',()=>{d.close();setTimeout(it.run,30)},'td-more-item');b.dataset.more=it.id;const ic=node('span','td-more-ic',it.icon);ic.setAttribute('aria-hidden','true');b.append(ic,node('span','',it.label||t.more[it.id]||it.id));li.appendChild(b);list.appendChild(li)});d.appendChild(list);focusHeading(d);return d}

 /* «Profile»: name (edit / delete), AI consent, goals, pace, daily goal. opts: {lang,name,forAI,goals,pace,goal,onSave(data),onDeleteName()} */
 function profile(opts){
  const t=tr(opts.lang),d=dialog(opts.lang,'td-sheet td-profile',t.prof.title),st={goals:[...opts.goals],pace:opts.pace,goal:opts.goal};
  const head=node('div','td-sheet-head');head.append(node('h2','',t.prof.title),btn(t.more.close,()=>d.close(),'td-link'));d.appendChild(head);
  const form=nameForm(opts.lang,opts.name,opts.forAI,()=>{});form.querySelector('button[type=submit]').remove();d.appendChild(form);
  if(opts.name){const del=btn(t.prof.del,()=>{opts.onDeleteName();form.querySelector('input[type=text]').value='';form.querySelector('input[type=checkbox]').checked=false;status.textContent=t.prof.saved},'td-link td-danger');del.dataset.action='delete-name';d.appendChild(del)}
  const body=node('div','td-prof-body');d.appendChild(body);
  const drawPrefs=()=>{body.replaceChildren();
   const mk=(list,isOn,set,role,label)=>{const g=node('div','td-chips');g.setAttribute('role',role);g.setAttribute('aria-label',label);list.forEach(([id,text])=>{const b=btn(text,()=>{set(id);drawPrefs()},'td-chip'+(isOn(id)?' is-on':''));b.dataset.value=id;if(role==='group')b.setAttribute('aria-pressed',String(isOn(id)));else{b.setAttribute('role','radio');b.setAttribute('aria-checked',String(isOn(id)))}g.appendChild(b)});return g};
   body.append(node('h3','',t.goalsQ),mk(Object.entries(t.goals),id=>st.goals.includes(id),id=>{st.goals=st.goals.includes(id)?st.goals.filter(x=>x!==id):[...st.goals,id]},'group',t.goalsQ),
    node('h3','',t.paceQ),mk(Object.entries(t.pace).map(([id,[a]])=>[id,a]),id=>st.pace===id,id=>{st.pace=id},'radiogroup',t.paceQ),
    node('h3','',t.timeQ),mk([5,10,15,20,30].map(m=>[String(m),m+' '+t.min]),id=>String(st.goal)===id,id=>{st.goal=Number(id)},'radiogroup',t.timeQ))};
  drawPrefs();const status=node('p','td-note');status.setAttribute('role','status');
  const save=btn(t.save,()=>{opts.onSave({name:form.querySelector('input[type=text]').value,forAI:form.querySelector('input[type=checkbox]').checked,...st});status.textContent=t.prof.saved},'td-btn td-primary');save.dataset.action='save-profile';
  d.append(save,status);focusHeading(d);return d;
 }

 globalThis.LerenToday={tr,home,stepDone,result,onboarding,more,profile,cleanText:s=>String(s??'')};
})();
