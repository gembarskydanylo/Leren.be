/* "Kamer van Pieter": a small CSS-3D room (A2). Tap things, name them, tidy up, tell short stories.
 * Offline, no AI, no 3D library: every piece of furniture is a few CSS boxes inside one preserve-3d room. */
(() => {
 'use strict';
 const LANGS=['uk','en','fr','ar'],KEY='leren_kamer_v1';
 const T={
  uk:{title:'Kamer van Pieter',sub:'Кімната Пітера: знаходь предмети й розмовляй',explore:'Вільне дослідження',exploreS:'Торкайся предметів і вчи слова',tasks:'Завдання',tasksS:'П’ять завдань: до 3 зірок за кожне',menu:'← Меню',left:'Повернути вліво',right:'Повернути вправо',tapHint:'Торкнися предмета. Щоб повернути кімнату, потягни пальцем убік або натисни стрілки.',listen:'🔊 Послухати',send:'Надіслати',example:'Показати приклад',next:'Далі',retry:'Ще раз',allTasks:'До завдань',model:'Приклад',typeNl:'Пиши нідерландською…',tryAgain:'Ще не те. Спробуй ще раз.',notDrink:'Це не те, що п’ють. Шукай далі.',wrongPlace:'Не туди. Спробуй інше місце.',picked:'Обрано. Тепер торкнися місця для цієї речі.',tidyDone:'Усе на місці! Тепер поясни.',pickOutfit:'Що ти вдягнеш або візьмеш? Торкнися речі.',star:'зірок',done:'Готово!',r3:['Fantastisch!','Чудово!'],r2:['Goed gedaan!','Добре!'],r1:['Prima, oefen nog even.','Непогано, ще потренуйся.'],best:'Найкращий результат',yours:'Твоя відповідь',pieter:'Пітер'},
  en:{title:'Kamer van Pieter',sub:'Pieter’s room: find things and talk',explore:'Free exploring',exploreS:'Tap things and learn the words',tasks:'Tasks',tasksS:'Five tasks: up to 3 stars each',menu:'← Menu',left:'Rotate left',right:'Rotate right',tapHint:'Tap an object. To turn the room, drag sideways or use the arrows.',listen:'🔊 Listen',send:'Send',example:'Show an example',next:'Next',retry:'Again',allTasks:'Back to tasks',model:'Example',typeNl:'Write in Dutch…',tryAgain:'Not quite. Try again.',notDrink:'That is not something to drink. Keep looking.',wrongPlace:'Not there. Try another place.',picked:'Picked. Now tap the place for this item.',tidyDone:'Everything is in place! Now explain.',pickOutfit:'What do you wear or take? Tap an item.',star:'stars',done:'Done!',r3:['Fantastisch!','Fantastic!'],r2:['Goed gedaan!','Well done!'],r1:['Prima, oefen nog even.','Good, practise a little more.'],best:'Best result',yours:'Your answer',pieter:'Pieter'},
  fr:{title:'Kamer van Pieter',sub:'La chambre de Pieter : trouve des objets et parle',explore:'Exploration libre',exploreS:'Touche les objets et apprends les mots',tasks:'Missions',tasksS:'Cinq missions : jusqu’à 3 étoiles chacune',menu:'← Menu',left:'Tourner à gauche',right:'Tourner à droite',tapHint:'Touche un objet. Pour tourner la pièce, glisse sur le côté ou utilise les flèches.',listen:'🔊 Écouter',send:'Envoyer',example:'Voir un exemple',next:'Suivant',retry:'Encore',allTasks:'Retour aux missions',model:'Exemple',typeNl:'Écris en néerlandais…',tryAgain:'Pas tout à fait. Essaie encore.',notDrink:'Ce n’est pas quelque chose à boire. Cherche encore.',wrongPlace:'Pas là. Essaie un autre endroit.',picked:'Choisi. Touche maintenant l’endroit pour cet objet.',tidyDone:'Tout est rangé ! Maintenant, explique.',pickOutfit:'Que mets-tu ou prends-tu ? Touche un objet.',star:'étoiles',done:'Terminé !',r3:['Fantastisch!','Fantastique !'],r2:['Goed gedaan!','Bien joué !'],r1:['Prima, oefen nog even.','Bien, entraîne-toi encore un peu.'],best:'Meilleur résultat',yours:'Ta réponse',pieter:'Pieter'},
  ar:{title:'Kamer van Pieter',sub:'غرفة بيتر: ابحث عن الأشياء وتحدّث',explore:'استكشاف حر',exploreS:'المس الأشياء وتعلّم الكلمات',tasks:'مهام',tasksS:'خمس مهام: حتى 3 نجوم لكل مهمة',menu:'← القائمة',left:'تدوير لليسار',right:'تدوير لليمين',tapHint:'المس شيئاً. ولتدوير الغرفة اسحب جانباً أو استخدم الأسهم.',listen:'🔊 استمع',send:'إرسال',example:'أرني مثالاً',next:'التالي',retry:'مرة أخرى',allTasks:'العودة إلى المهام',model:'مثال',typeNl:'اكتب بالهولندية…',tryAgain:'ليس تماماً. حاول مرة أخرى.',notDrink:'هذا ليس شيئاً للشرب. تابع البحث.',wrongPlace:'ليس هنا. جرّب مكاناً آخر.',picked:'تم الاختيار. المس الآن مكان هذا الشيء.',tidyDone:'كل شيء في مكانه! اشرح الآن.',pickOutfit:'ماذا سترتدي أو تأخذ؟ المس شيئاً.',star:'نجوم',done:'انتهى!',r3:['Fantastisch!','رائع!'],r2:['Goed gedaan!','أحسنت!'],r1:['Prima, oefen nog even.','جيد، تدرّب أكثر قليلاً.'],best:'أفضل نتيجة',yours:'إجابتك',pieter:'بيتر'}
 };
 // id: [article, noun, uk, en, fr, ar, example nl, example uk, en, fr, ar, picture]
 const O={
  bed:['het','bed','ліжко','bed','lit','سرير','Het bed staat in de hoek.','Ліжко стоїть у кутку.','The bed is in the corner.','Le lit est dans le coin.','السرير في الزاوية.','🛏️'],
  kast:['de','kast','шафа','wardrobe','armoire','خزانة','Mijn jas hangt in de kast.','Моя куртка висить у шафі.','My coat is hanging in the wardrobe.','Mon manteau est dans l’armoire.','معطفي معلّق في الخزانة.','🧥'],
  tafel:['de','tafel','стіл','table','table','طاولة','De boeken liggen op de tafel.','Книжки лежать на столі.','The books are on the table.','Les livres sont sur la table.','الكتب على الطاولة.','📚'],
  stoel:['de','stoel','стілець','chair','chaise','كرسي','Ik zit op de stoel.','Я сиджу на стільці.','I am sitting on the chair.','Je suis assis sur la chaise.','أجلس على الكرسي.','🪑'],
  koelkast:['de','koelkast','холодильник','fridge','réfrigérateur','ثلاجة','De melk staat in de koelkast.','Молоко стоїть у холодильнику.','The milk is in the fridge.','Le lait est dans le frigo.','الحليب في الثلاجة.','🧊'],
  raam:['het','raam','вікно','window','fenêtre','نافذة','Ik open het raam.','Я відчиняю вікно.','I open the window.','J’ouvre la fenêtre.','أفتح النافذة.','🪟'],
  deur:['de','deur','двері','door','porte','باب','Doe de deur dicht, alstublieft.','Зачини двері, будь ласка.','Close the door, please.','Ferme la porte, s’il te plaît.','أغلق الباب من فضلك.','🚪'],
  klok:['de','klok','годинник','clock','horloge','ساعة','De klok wijst half negen.','Годинник показує пів на дев’яту (8:30).','The clock says half past eight.','L’horloge indique huit heures et demie.','تشير الساعة إلى الثامنة والنصف.','🕒'],
  lamp:['de','lamp','лампа','lamp','lampe','مصباح','Doe de lamp aan.','Увімкни лампу.','Turn on the lamp.','Allume la lampe.','شغّل المصباح.','💡'],
  boeken:['de','boeken','книжки','books','livres','كتب','Ik lees elke avond een boek.','Я читаю книжку щовечора.','I read a book every evening.','Je lis un livre chaque soir.','أقرأ كتاباً كل مساء.','📚'],
  kopje:['het','kopje','чашка','cup','tasse','فنجان','Ik drink een kopje koffie.','Я п’ю чашку кави.','I drink a cup of coffee.','Je bois une tasse de café.','أشرب فنجان قهوة.','☕'],
  sleutels:['de','sleutels','ключі','keys','clés','مفاتيح','Waar zijn mijn sleutels?','Де мої ключі?','Where are my keys?','Où sont mes clés ?','أين مفاتيحي؟','🔑'],
  fles:['de','fles','пляшка','bottle','bouteille','زجاجة','Ik heb een fles water.','У мене є пляшка води.','I have a bottle of water.','J’ai une bouteille d’eau.','لدي زجاجة ماء.','🥤'],
  rugzak:['de','rugzak','рюкзак','backpack','sac à dos','حقيبة ظهر','Mijn rugzak is zwaar.','Мій рюкзак важкий.','My backpack is heavy.','Mon sac à dos est lourd.','حقيبتي الظهرية ثقيلة.','🎒'],
  trui:['de','trui','светр','sweater','pull','كنزة','Ik draag een warme trui.','Я ношу теплий светр.','I am wearing a warm sweater.','Je porte un pull chaud.','أرتدي كنزة دافئة.','👕'],
  jas:['de','jas','куртка','coat','manteau','معطف','Ik trek mijn jas aan.','Я вдягаю куртку.','I put on my coat.','J’enfile mon manteau.','أرتدي معطفي.','🧥']
 };
 const L=(o,lang)=>o[2+Math.max(0,LANGS.indexOf(lang))],EX=(o,lang)=>o[7+Math.max(0,LANGS.indexOf(lang))];
 const tl=(arr,lang)=>arr[Math.max(0,LANGS.indexOf(lang))];
 // tasks: nl line, instructions in four languages
 const TASKS=[
  {id:'t1',nl:'Zoek iets om te drinken.',ins:['Знайди в кімнаті щось, щоб випити. Торкнися предмета.','Find something to drink in the room. Tap an object.','Trouve quelque chose à boire dans la chambre. Touche un objet.','ابحث في الغرفة عن شيء تشربه. المس شيئاً.'],
   ask:'Wat is dit? En hoe voel je je?',askT:['Що це? І як ти почуваєшся? Скажи: Dit is een … Ik heb …','What is this? And how do you feel? Say: Dit is een … Ik heb …','Qu’est-ce que c’est ? Et comment te sens-tu ? Dis : Dit is een … Ik heb …','ما هذا؟ وكيف تشعر؟ قل: Dit is een … Ik heb …'],model:'Dit is een fles water. Ik heb dorst.'},
  {id:'t2',nl:'Wat ligt er op de tafel?',ins:['Подивися на стіл. Назви 3–4 предмети, які на ньому лежать.','Look at the table. Name 3 or 4 things on it.','Regarde la table. Nomme 3 ou 4 objets dessus.','انظر إلى الطاولة. سمِّ 3 أو 4 أشياء عليها.'],
   ask:'Wat ligt er op de tafel?',askT:['Скажи: Op de tafel liggen … (торкайся предметів, щоб побачити слова)','Say: Op de tafel liggen … (tap objects to see the words)','Dis : Op de tafel liggen … (touche les objets pour voir les mots)','قل: Op de tafel liggen … (المس الأشياء لترى الكلمات)'],model:'Op de tafel liggen boeken, een kopje, een lamp en sleutels.'},
  {id:'t3',nl:'Maak de kamer netjes.',ins:['Три речі лежать не на місці. Торкнися речі, потім місця для неї.','Three things are in the wrong place. Tap an item, then its place.','Trois objets ne sont pas à leur place. Touche un objet, puis son emplacement.','ثلاثة أشياء ليست في مكانها. المس الشيء ثم مكانه.'],
   ask:'Waarom leg je de trui in de kast? Gebruik omdat.',askT:['Поясни, чому ти кладеш речі саме туди. Використай omdat.','Explain why you put things there. Use omdat.','Explique pourquoi tu ranges les objets là. Utilise omdat.','اشرح لماذا تضع الأشياء هناك. استعمل omdat.'],model:'Ik leg de trui in de kast omdat het daar netjes is.'},
  {id:'t4',nl:'Vertel over gisteren.',ins:['Торкнися будь-якого предмета й розкажи, що ти робив(ла) з ним учора (perfectum).','Tap any object and tell what you did with it yesterday (perfectum).','Touche un objet et raconte ce que tu as fait avec hier (perfectum).','المس أي شيء وأخبر ماذا فعلت به أمس (perfectum).'],
   ask:'Wat heb je gisteren gedaan?',askT:['Почни так: Gisteren heb ik … / Gisteren ben ik …','Start like this: Gisteren heb ik … / Gisteren ben ik …','Commence ainsi : Gisteren heb ik … / Gisteren ben ik …','ابدأ هكذا: Gisteren heb ik … / Gisteren ben ik …'],model:'Gisteren heb ik de lamp aangedaan en ik heb lang gelezen.'},
  {id:'t5',nl:'Wat ga je doen?',ins:['Торкнися шафи, обери одяг і розкажи свій план на день.','Tap the wardrobe, choose clothes and tell your plan for the day.','Touche l’armoire, choisis des vêtements et dis ton programme.','المس الخزانة واختر ملابس وأخبر عن خطتك لليوم.'],
   ask:'Wat ga je doen?',askT:['Скажи: Morgen ga ik … (з назвою обраної речі)','Say: Morgen ga ik … (with the item you chose)','Dis : Morgen ga ik … (avec l’objet choisi)','قل: Morgen ga ik … (مع الشيء الذي اخترته)'],model:'Morgen ga ik met mijn jas naar school.'}
 ];
 const DRINK=new Set(['fles','kopje']),TIDY={trui:'kast',rugzak:'stoel',fles:'koelkast'},TABLE=['boeken','kopje','lamp','sleutels'];
 const OUTFIT=['jas','trui','rugzak'],OUT_RX={jas:/\bjas\b/,trui:/\btrui\b/,rugzak:/\brugzak\b/};
 const norm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?;:()]/g,' ').replace(/\s+/g,' ').trim();
 function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
 function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
 const tr=lang=>T[lang]||T.uk;
 // ---- grading (exported for tests) ----
 function grade(id,text,ctx={}){
  const s=norm(text),words=s?s.split(' ').length:0;
  if(id==='t1'){if(!s)return 0;const named=(ctx.item==='kopje'?/\bkop(je)?\b|koffie|thee/:/\bfles\b|water/).test(s);return Math.min(3,1+(named?1:0)+(/dorst/.test(s)?1:0))}
  if(id==='t2'){const n=[/\bboek(en)?\b/,/\bkop(je|jes)?\b|koffie/,/\blamp\b/,/\bsleutels?\b/].filter(r=>r.test(s)).length;return n>=4?3:n===3?2:n===2?1:0}
  if(id==='t3'){if(!s)return 0;const base=2+(/\b(omdat|want)\b/.test(s)?1:0);return Math.max(1,base-((ctx.misses||0)>2?1:0))}
  if(id==='t4'){const aux=/\b(heb|hebt|heeft|hebben|ben|bent|is|zijn)\b/.test(s),part=/\bge[a-zëï]{3,}\b|\b(vergeten|bezocht|verloren|begonnen|ontmoet|bekeken)\b/.test(s);return aux&&part?(/gisteren/.test(s)&&words>=4?3:2):0}
  if(id==='t5'){const plan=/\b(ga ik|ik ga|gaan we|ga je)\b/.test(s)&&words>=4;if(!plan)return 0;return 2+((ctx.outfit&&OUT_RX[ctx.outfit].test(s))||/\bomdat\b/.test(s)?1:0)}
  return 0;
 }
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
 const btn=(text,cls,fn)=>{const b=el('button',cls,text);b.type='button';if(fn)b.onclick=fn;return b};
 const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);

 // ---- the 3D room ----
 function box(w,h,d,color,x,y,z){
  const r=el('div','k-box');r.style.width=w+'px';r.style.height=h+'px';r.style.marginLeft=-w/2+'px';r.style.marginTop=-h/2+'px';r.style.setProperty('--c',color);r.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px)';
  const f=(cls,fw,fh,tf,left,top)=>{const e=el('div','k-face '+cls);e.style.width=fw+'px';e.style.height=fh+'px';e.style.transform=tf;if(left!=null)e.style.left=left+'px';if(top!=null)e.style.top=top+'px';r.appendChild(e)};
  f('k-f',w,h,'translateZ('+d/2+'px)');f('k-s',w,h,'rotateY(180deg) translateZ('+d/2+'px)');
  f('k-s',d,h,'rotateY(90deg) translateZ('+w/2+'px)',(w-d)/2);f('k-s',d,h,'rotateY(-90deg) translateZ('+w/2+'px)',(w-d)/2);
  f('k-t',w,d,'rotateX(90deg) translateZ('+h/2+'px)',null,(h-d)/2);
  return r;
 }
 const group=(id,x,y,z,kids,extra)=>{const g=el('div','k-obj'+(extra?' '+extra:''));g.dataset.item=id;g.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px)';kids.forEach(k=>g.appendChild(k));return g};
 function wallItem(id,x,y,z,rot,w,h,cls,kids=[]){const g=el('div','k-obj k-wall');g.dataset.item=id;g.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px) rotateY('+rot+'deg)';const f=el('div','k-face k-flat '+cls);f.style.width=w+'px';f.style.height=h+'px';f.style.marginLeft=-w/2+'px';f.style.marginTop=-h/2+'px';kids.forEach(k=>f.appendChild(k));g.appendChild(f);return g}
 function billboard(id,x,y,z,size,pic){const g=el('div','k-obj k-bb-wrap');g.dataset.item=id;g.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px)';const b=el('div','k-bb');b.style.width=size+'px';b.style.height=size+'px';b.style.marginLeft=-size/2+'px';b.style.marginTop=-size/2+'px';const p=pic();if(p){p.classList?.add('k-pic');b.appendChild(p)}else b.textContent=O[id][11];g.appendChild(b);return g}
 function buildRoom(host){
  const room=el('div','k-room');
  const face=(cls,w,h,tf,left,top)=>{const e=el('div','k-face k-shell '+cls);e.style.width=w+'px';e.style.height=h+'px';e.style.transform=tf;if(left!=null)e.style.left=left+'px';if(top!=null)e.style.top=top+'px';room.appendChild(e)};
  face('k-floor',240,240,'rotateX(90deg) translateZ(-85px)',0,-35);face('k-back',240,170,'translateZ(-120px)');face('k-left',240,170,'rotateY(90deg) translateZ(-120px)');
  const pic=e=>()=>host.icon?host.icon(O[e][11]):null;const things=[];
  things.push(group('bed',-78,85,-62,[box(70,14,112,'#8b6b4a',0,-7,0),box(66,12,104,'#5b8def',0,-20,0),box(50,8,22,'#ffffff',0,-30,-38)]));
  things.push(group('kast',75,85,-98,[box(60,120,40,'#c08a5a',0,-60,0),box(4,16,4,'#5c4033',-7,-62,21),box(4,16,4,'#5c4033',7,-62,21)]));
  things.push(group('koelkast',8,85,-100,[box(42,96,36,'#e6edf2',0,-48,0),box(3,26,3,'#8fa0ab',14,-62,19)]));
  const leg=(lx,lz)=>box(5,50,5,'#7a5232',lx,-25,lz);
  things.push(group('tafel',30,85,12,[box(84,6,52,'#a8764b',0,-53,0),leg(-36,-21),leg(36,-21),leg(-36,21),leg(36,21)]));
  const sl=(lx,lz)=>box(4,26,4,'#8c2f3c',lx,-13,lz);
  things.push(group('stoel',-8,85,52,[box(30,5,30,'#d1495b',0,-27,0),sl(-12,-12),sl(12,-12),sl(-12,12),sl(12,12),box(30,28,4,'#d1495b',0,-43,-13)]));
  const win=[el('i','k-cross-v'),el('i','k-cross-h')];
  things.push(wallItem('raam',-119,-18,-62,90,64,54,'k-window',win));
  things.push(wallItem('deur',-119,25,72,90,50,120,'k-door',[el('i','k-knob')]));
  const clockPic=host.icon?host.icon(O.klok[11]):null;if(clockPic)clockPic.classList?.add('k-pic');
  things.push(wallItem('klok',15,-48,-119,0,36,36,'k-clock',clockPic?[clockPic]:[]));
  things.push(billboard('lamp',58,13,2,30,pic('lamp')),billboard('boeken',6,17,12,28,pic('boeken')),billboard('kopje',32,20,26,22,pic('kopje')),billboard('sleutels',22,24,-4,18,pic('sleutels')));
  things.push(billboard('fles',8,-24,-100,24,pic('fles')));
  things.push(billboard('rugzak',-18,69,78,30,pic('rugzak')),billboard('trui',48,70,70,30,pic('trui')));
  things.forEach(t=>{const id=t.dataset.item;t.tabIndex=0;t.setAttribute('role','button');t.setAttribute('aria-label',O[id][0]+' '+O[id][1]);room.appendChild(t)});
  return room;
 }

 function start(host){
  const lang=host.lang(),u=tr(lang);let st=load();st.stars=st.stars||{};let xpTotal=0;
  const root=()=>host.head(u.title,u.sub);
  const dir=lang==='ar'?'rtl':'ltr';
  const pieterRow=(nl,locText)=>{const row=el('div','k-pieter');const img=el('img','k-avatar');img.src='./img/chars/peter.webp';img.alt=u.pieter;img.width=44;img.height=44;
   const bub=el('div','k-bubble');const n=el('strong','k-nl',nl);n.lang='nl';n.dir='ltr';bub.appendChild(n);if(locText)bub.appendChild(el('span','k-loc',locText));row.append(img,bub);return row};

  function menu(){
   const card=root();host.bar(0);const box=el('section','k k-menu');box.dir=dir;
   box.appendChild(pieterRow('Welkom in mijn kamer!',tl(['Ласкаво просимо до моєї кімнати!','Welcome to my room!','Bienvenue dans ma chambre !','مرحباً بك في غرفتي!'],lang)));
   const ex=btn('','k-big',()=>play(null));ex.append(el('strong','',u.explore),el('small','',u.exploreS));box.appendChild(ex);
   box.appendChild(el('h3','k-h',u.tasks));box.appendChild(el('p','k-sub',u.tasksS));
   const list=el('div','k-tasks');TASKS.forEach((t,i)=>{const b=btn('','k-task',()=>play(i));const s=st.stars[t.id]||0;
    const c=el('span','k-task-copy');const n=el('strong','',(i+1)+'. '+t.nl);n.lang='nl';n.dir='ltr';c.append(n,el('small','',tl(t.ins,lang)));const sr=el('span','k-stars',stars(s));sr.setAttribute('aria-label',s+' / 3 '+u.star);b.append(c,sr);list.appendChild(b)});
   box.appendChild(list);card.appendChild(box);
  }

  function play(ti){
   const t=ti==null?null:TASKS[ti];const card=root();host.bar(ti==null?0:ti/TASKS.length);card.classList.add('k-host');
   const box=el('section','k k-play');box.dir=dir;
   const top=el('div','k-top');top.append(btn(u.menu,'k-back-btn',menu),el('strong','k-title',t?(ti+1)+'. '+t.nl:u.explore));top.lastChild.lang=t?'nl':lang;box.appendChild(top);
   const scene=el('div','k-scene');const room=buildRoom(host);scene.appendChild(room);box.appendChild(scene);
   const nav=el('div','k-nav');let ry=-24;const setRy=v=>{ry=Math.max(-50,Math.min(50,v));room.style.setProperty('--ry',ry+'deg')};setRy(ry);
   const lb=btn('‹','k-rot',()=>setRy(ry-15));lb.setAttribute('aria-label',u.left);const rb=btn('›','k-rot',()=>setRy(ry+15));rb.setAttribute('aria-label',u.right);
   const hint=el('span','k-hint',u.tapHint);nav.append(lb,hint,rb);box.appendChild(nav);
   const panel=el('div','k-panel');panel.setAttribute('aria-live','polite');box.appendChild(panel);card.appendChild(box);
   // drag to rotate (no pointer capture, so taps still reach the objects)
   let drag=null,moved=false;
   scene.addEventListener('pointerdown',e=>{drag={x:e.clientX,r:ry};moved=false});
   const mv=e=>{if(!box.isConnected){cleanup();return}if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6)moved=true;if(moved)setRy(drag.r+dx*.35)};const up=()=>{drag=null};
   window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
   function cleanup(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}
   const items=()=>[...room.querySelectorAll('[data-item]')];
   const mark=(id,cls,on=true)=>items().forEach(n=>{if(n.dataset.item===id)n.classList.toggle(cls,on)});
   const clearMarks=cls=>items().forEach(n=>n.classList.remove(cls));
   const tag=id=>{const o=O[id];panel.querySelector('.k-tag')?.remove();const g=el('div','k-tag');const n=el('strong','',o[0]+' '+o[1]);n.lang='nl';g.append(n,el('span','',' · '+L(o,lang)));return g};
   let onTap=()=>{};
   const tap=e=>{if(moved){moved=false;return}const n=e.target.closest('[data-item]');if(!n)return;onTap(n.dataset.item);host.say(O[n.dataset.item][0]+' '+O[n.dataset.item][1])};
   scene.addEventListener('click',tap);
   scene.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset?.item){e.preventDefault();tap(e)}});

   // ---- free exploring ----
   if(!t){
    onTap=id=>{const o=O[id];panel.replaceChildren();clearMarks('is-hot');mark(id,'is-hot');
     const w=el('div','k-word');const n=el('strong','k-word-nl',o[0]+' '+o[1]);n.lang='nl';n.dir='ltr';w.append(n,el('span','k-word-tr',L(o,lang)));
     const ex=el('p','k-ex');const exn=el('span','',o[6]);exn.lang='nl';exn.dir='ltr';ex.append(exn,el('small','',EX(o,lang)));
     panel.append(w,ex,btn(u.listen,'btn',()=>host.say(o[0]+' '+o[1]+'. '+o[6])))};
    panel.appendChild(pieterRow('Wat zie je in mijn kamer?',tl(['Що ти бачиш у моїй кімнаті? Торкнися предмета.','What do you see in my room? Tap an object.','Que vois-tu dans ma chambre ? Touche un objet.','ماذا ترى في غرفتي؟ المس شيئاً.'],lang)));
    return;
   }

   // ---- tasks ----
   let misses=0,ctx={};
   const intro=()=>{panel.replaceChildren(pieterRow(t.nl,tl(t.ins,lang)))};
   const form=(onSend)=>{
    const f=el('form','k-form');const inp=el('input','k-input');inp.type='text';inp.lang='nl';inp.dir='ltr';inp.autocomplete='off';inp.autocapitalize='sentences';inp.spellcheck=false;inp.placeholder=u.typeNl;inp.setAttribute('aria-label',u.typeNl);
    const send=btn(u.send,'btn primary');send.type='submit';f.append(inp,send);const msg=el('p','k-msg');msg.setAttribute('role','status');
    let tries=0;const ex=btn(u.example,'btn k-example',()=>onSend(null,true));ex.hidden=true;
    f.onsubmit=e=>{e.preventDefault();const v=inp.value.trim();if(!v){inp.focus();return}const r=onSend(v,false);if(r===false){tries++;msg.textContent=u.tryAgain;if(tries>=1)ex.hidden=false;inp.focus()}};
    const wrap=el('div','k-formwrap');wrap.append(f,msg,ex);setTimeout(()=>inp.focus({preventScroll:true}),50);return wrap;
   };
   const result=(starsN,text,tipModel)=>{
    const best=st.stars[t.id]||0,gain=Math.max(0,starsN-best)*5;if(starsN>best){st.stars[t.id]=starsN;save(st)}xpTotal+=gain;
    panel.replaceChildren();const r=el('div','k-result');const re=starsN>=3?u.r3:starsN===2?u.r2:u.r1;
    const big=el('div','k-bigstars',stars(starsN));big.setAttribute('aria-label',starsN+' / 3 '+u.star);r.appendChild(big);
    r.appendChild(pieterRow(re[0],re[1]));
    if(text){const y=el('p','k-yours');y.append(el('small','',u.yours+': '),(()=>{const s=el('span','',text);s.lang='nl';s.dir='ltr';return s})());r.appendChild(y)}
    const m=el('p','k-model');m.append(el('small','',u.model+': '),(()=>{const s=el('strong','',tipModel||t.model);s.lang='nl';s.dir='ltr';return s})());r.appendChild(m);
    const row=el('div','row');row.append(btn(u.listen,'btn',()=>host.say(tipModel||t.model)),btn(u.retry,'btn',()=>play(ti)),
     btn(ti<TASKS.length-1?u.next:u.allTasks,'btn primary',()=>ti<TASKS.length-1?play(ti+1):menu()));r.appendChild(row);panel.appendChild(r);
    host.bar((ti+1)/TASKS.length);host.done(gain);
   };
   const ask=(model)=>{
    panel.replaceChildren(pieterRow(t.ask,tl(t.askT,lang)));
    panel.appendChild(form((v,showModel)=>{
     if(showModel){result(1,'',model||t.model);return true}
     const s=grade(t.id,v,{...ctx,misses});if(s<1)return false;result(s,v,null);return true;
    }));
   };
   intro();
   if(t.id==='t1'){
    onTap=id=>{if(DRINK.has(id)){ctx.item=id;clearMarks('is-hot');mark(id,'is-hot');onTap=()=>{};ask(id==='kopje'?'Dit is een kopje koffie. Ik heb dorst.':'Dit is een fles water. Ik heb dorst.')}else{panel.querySelector('.k-msg2')?.remove();panel.appendChild(el('p','k-msg2',u.notDrink));panel.appendChild(tag(id))}};
   }
   if(t.id==='t2'){
    TABLE.forEach(id=>mark(id,'is-hint'));onTap=id=>{panel.querySelector('.k-tag')?.remove();panel.insertBefore(tag(id),panel.children[1]||null)};ask();
   }
   if(t.id==='t3'){
    const left=new Set(Object.keys(TIDY));let picked=null;Object.keys(TIDY).forEach(id=>mark(id,'is-hint'));
    // in this task the bottle stands on the floor, the others as usual
    const bottle=room.querySelector('[data-item="fles"]');const home=bottle.style.transform;bottle.style.transform='translate3d(90px,71px,52px)';
    const dest={kast:[75,25,-72],stoel:[-8,50,52],koelkast:[8,-20,-72]};
    const say=m=>{panel.querySelector('.k-msg2')?.remove();panel.appendChild(el('p','k-msg2',m))};
    onTap=id=>{
     if(left.has(id)){picked=id;clearMarks('is-hot');mark(id,'is-hot');say(u.picked);return}
     if(!picked){return}
     if(TIDY[picked]===id){const node=items().find(n=>n.dataset.item===picked);const d=dest[id];node.style.transform='translate3d('+d[0]+'px,'+d[1]+'px,'+d[2]+'px)';node.classList.remove('is-hint','is-hot');left.delete(picked);picked=null;
      if(!left.size){clearMarks('is-hint');ctx.misses=misses;ask('Ik leg de trui in de kast omdat het daar netjes is.');panel.insertBefore(el('p','k-msg2 ok',u.tidyDone),panel.children[1]||null)}else say(u.picked.split('.')[0]+'.')}
     else{misses++;say(u.wrongPlace);const o=O[picked],d=O[TIDY[picked]];const hn=el('p','k-hintnl','Nee, '+o[0]+' '+o[1]+' hoort in '+d[0]+' '+d[1]+'.');hn.lang='nl';panel.appendChild(hn)}
    };
    void home;
   }
   if(t.id==='t4'){
    onTap=id=>{ctx.item=id;clearMarks('is-hot');mark(id,'is-hot');const o=O[id];ask('Gisteren heb ik '+o[0]+' '+o[1]+' gebruikt.');panel.insertBefore(tag(id),panel.children[1]||null)};
   }
   if(t.id==='t5'){
    onTap=id=>{if(id!=='kast')return;onTap=()=>{};panel.replaceChildren(pieterRow('Wat trek je aan?',u.pickOutfit));const row=el('div','k-outfits');
     OUTFIT.forEach(o=>{const b=btn('','k-outfit',()=>{ctx.outfit=o;clearMarks('is-hot');ask('Morgen ga ik met mijn '+O[o][1]+' naar school.')});const ic=host.icon?host.icon(O[o][11]):null;if(ic){ic.classList?.add('k-pic');b.appendChild(ic)}const n=el('span','',O[o][0]+' '+O[o][1]);n.lang='nl';b.appendChild(n);row.appendChild(b)});panel.appendChild(row)};
    mark('kast','is-hint');
   }
  }
  menu();
 }
 globalThis.LerenKamer={start,grade,tr,T,O,TASKS,KEY};
})();
