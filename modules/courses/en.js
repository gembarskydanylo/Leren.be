/* English 1.1 (Breakthrough, CEFR A1) — chapter 1 «Hello!»: greetings, introducing yourself, personal details for forms.
   Flemish adult-education profile "Europese talen groep 1, Richtgraad 1" (see MULTILANG.md). British spelling.
   Each card: id (en:…), en = the English text, translations uk / fr / ar / nl, icon. Three tabs of 10 cards = 6 lessons of 5.
   Status in modules/courses/registry.js: planned (preview only, lerenbe.com/?multilang=1). */
(() => {
 'use strict';
 const c=(id,en,uk,fr,ar,nl,icon)=>({id:'en:'+id,en,uk,fr,ar,nl,icon});
 const data={
  en_greet:{title:{uk:'Привітання',en:'Greetings',fr:'Salutations',ar:'التحيات'},items:[
   c('hello','Hello!','Привіт! / Вітаю!','Bonjour !','مرحبًا!','Hallo!','👋'),
   c('good_morning','Good morning.','Доброго ранку.','Bonjour. (le matin)','صباح الخير.','Goedemorgen.','🌅'),
   c('good_afternoon','Good afternoon.','Добрий день.','Bon après-midi.','نهارك سعيد.','Goedemiddag.','☀️'),
   c('good_evening','Good evening.','Добрий вечір.','Bonsoir.','مساء الخير.','Goedenavond.','🌆'),
   c('goodbye','Goodbye.','До побачення.','Au revoir.','مع السلامة.','Tot ziens.','🚪'),
   c('see_you','See you later.','До зустрічі.','À plus tard.','أراك لاحقًا.','Tot straks.','⏰'),
   c('how_are_you','How are you?','Як справи?','Comment ça va ?','كيف حالك؟','Hoe gaat het?','🙂'),
   c('fine_thanks',"I'm fine, thank you.",'Добре, дякую.','Ça va bien, merci.','أنا بخير، شكرًا.','Het gaat goed, dank je.','😊'),
   c('and_you','And you?','А в тебе? / А у вас?','Et toi ? / Et vous ?','وأنت؟','En met jou?','🤝'),
   c('nice_to_meet','Nice to meet you.','Приємно познайомитися.','Enchanté(e).','تشرفت بمعرفتك.','Aangenaam.','🤗')]},
  en_intro:{title:{uk:'Знайомство',en:'Introducing yourself',fr:'Se présenter',ar:'التعريف بالنفس'},items:[
   c('your_name',"What's your name?",'Як тебе звати?',"Comment tu t'appelles ?",'ما اسمك؟','Hoe heet je?','❓'),
   c('my_name','My name is Olena.','Мене звати Олена.',"Je m'appelle Olena.",'اسمي أولينا.','Ik heet Olena.','🙋'),
   c('where_from','Where are you from?','Звідки ти?',"Tu viens d'où ?",'من أين أنت؟','Waar kom je vandaan?','🌍'),
   c('from_ukraine',"I'm from Ukraine.",'Я з України.',"Je viens d'Ukraine.",'أنا من أوكرانيا.','Ik kom uit Oekraïne.','🇺🇦'),
   c('where_live','Where do you live?','Де ти живеш?','Où habites-tu ?','أين تسكن؟','Waar woon je?','🏠'),
   c('live_ghent','I live in Ghent.','Я живу в Генті.',"J'habite à Gand.",'أسكن في غنت.','Ik woon in Gent.','🏙️'),
   c('speak_uk','I speak Ukrainian.','Я розмовляю українською.','Je parle ukrainien.','أتكلم الأوكرانية.','Ik spreek Oekraïens.','🗣️'),
   c('learning_en',"I'm learning English.",'Я вивчаю англійську.',"J'apprends l'anglais.",'أتعلم الإنجليزية.','Ik leer Engels.','📚'),
   c('my_friend','This is my friend.','Це мій друг.',"C'est mon ami.",'هذا صديقي.','Dit is mijn vriend.','👫'),
   c('repeat','Can you repeat that, please?','Повторіть, будь ласка.','Vous pouvez répéter, s’il vous plaît ?','هل يمكنك أن تكرر ذلك من فضلك؟','Kunt u dat herhalen, alstublieft?','🔁')]},
  en_details:{title:{uk:'Особисті дані',en:'Personal details',fr:'Données personnelles',ar:'البيانات الشخصية'},items:[
   c('first_name','first name','ім’я','le prénom','الاسم الأول','de voornaam','🪪'),
   c('surname','surname','прізвище','le nom de famille','اسم العائلة','de achternaam','📛'),
   c('address','address','адреса',"l'adresse",'العنوان','het adres','📍'),
   c('phone','phone number','номер телефону','le numéro de téléphone','رقم الهاتف','het telefoonnummer','📞'),
   c('email','email address','електронна адреса',"l'adresse e-mail",'البريد الإلكتروني','het e-mailadres','📧'),
   c('birth','date of birth','дата народження','la date de naissance','تاريخ الميلاد','de geboortedatum','🎂'),
   c('nationality','nationality','громадянство','la nationalité','الجنسية','de nationaliteit','🛂'),
   c('married','married','одружений / заміжня','marié(e)','متزوج / متزوجة','getrouwd','💍'),
   c('spell','How do you spell it?','Як це пишеться?',"Comment ça s'écrit ?",'كيف تتهجّاه؟','Hoe spel je dat?','🔤'),
   c('sign','Sign here, please.','Підпишіть тут, будь ласка.','Signez ici, s’il vous plaît.','وقّع هنا من فضلك.','Teken hier, alstublieft.','✍️')]}
 };
 // One short rule per topic, in the interface languages.
 const grammar={
  en_greet:{uk:'«Hi» і «Bye» — неформально, для друзів. «Good morning» і «Goodbye» підходять завжди. На «How are you?» коротко відповідають: «I’m fine, thank you. And you?»',
   en:'“Hi” and “Bye” are informal. “Good morning” and “Goodbye” work everywhere. Answer “How are you?” briefly: “I’m fine, thank you. And you?”',
   fr:'« Hi » et « Bye » sont familiers. « Good morning » et « Goodbye » conviennent partout. À « How are you? », on répond brièvement : « I’m fine, thank you. And you? »',
   ar:'«Hi» و«Bye» غير رسميتين. «Good morning» و«Goodbye» مناسبتان دائمًا. وعلى «How are you?» نجيب باختصار: «I’m fine, thank you. And you?»'},
  en_intro:{uk:'Дієслово to be: I am (I’m), you are (you’re), he/she is (he’s/she’s). Питання: «Where are you from?» — «I’m from Ukraine.»',
   en:'The verb to be: I am (I’m), you are (you’re), he/she is (he’s/she’s). Question: “Where are you from?” — “I’m from Ukraine.”',
   fr:'Le verbe to be : I am (I’m), you are (you’re), he/she is (he’s/she’s). Question : « Where are you from? » — « I’m from Ukraine. »',
   ar:'الفعل to be: I am (I’m)، you are (you’re)، he/she is (he’s/she’s). سؤال: «Where are you from?» — «I’m from Ukraine.»'},
  en_details:{uk:'В анкетах: first name — ім’я, surname — прізвище. Ім’я диктують по літерах: O-L-E-N-A. Дата народження в Бельгії й Британії: день / місяць / рік.',
   en:'On forms: first name, then surname. Spell your name letter by letter: O-L-E-N-A. Date of birth in Belgium and the UK: day / month / year.',
   fr:'Dans les formulaires : first name = prénom, surname = nom de famille. On épelle son nom : O-L-E-N-A. Date de naissance en Belgique et au Royaume-Uni : jour / mois / année.',
   ar:'في الاستمارات: first name هو الاسم الأول وsurname هو اسم العائلة. تهجَّ اسمك حرفًا حرفًا: O-L-E-N-A. تاريخ الميلاد في بلجيكا وبريطانيا: يوم / شهر / سنة.'}
 };
 // [id, Dutch-style label kept for the core, tabs, level]
 const curriculum={chapters:[['en_hello','Hello!',['en_greet','en_intro','en_details'],'1.1']],advanced:[],
  chapterNames:{en_hello:{uk:'👋 Hello! Знайомство',en:'👋 Hello! Meeting people',fr:'👋 Hello! Faire connaissance',ar:'👋 Hello! التعارف'}}};
 globalThis.LerenCourseData=Object.assign(globalThis.LerenCourseData||{},{en:{data,grammar,curriculum,text:'en'}});
})();
