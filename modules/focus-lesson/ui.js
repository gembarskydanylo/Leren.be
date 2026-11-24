/* TEST-050 · «Фокус» lesson mode: one screen, one task, one main action.
   While a lesson, the conversation or today's session runs, the app header, the bottom dock and the footer are hidden
   (html.lp-focus); a slim bar at the top keeps a clear way out (✕: the place in the lesson is already saved by the route
   model) and shows the progress; the main action is fixed at the bottom above the Android system bar (safe area) and,
   with interactive-widget=resizes-content in index.html, above the open keyboard. Lexi says the short standard lines
   (plan, next step, praise, help after a mistake, summary) from the texts below: no network, works offline. No DOM work
   at load time except the stylesheet link; no innerHTML. */
(() => {
 'use strict';
 const CSS_HREF='./modules/focus-lesson/style.css?v=1',LEXI_IMG='./img/lexi/lexi.webp';
 let cssOk=false;
 const cssReady=(()=>{try{if(typeof document==='undefined')return Promise.resolve();let l=document.querySelector('link[data-fl-css]');if(!l){l=document.createElement('link');l.rel='stylesheet';l.href=CSS_HREF;l.dataset.flCss='1';document.head.appendChild(l)}
  return new Promise(r=>{const done=()=>{cssOk=true;r()};if(l.sheet){done();return}l.addEventListener('load',done,{once:true});l.addEventListener('error',done,{once:true});setTimeout(done,2000)})}catch{cssOk=true;return Promise.resolve()}})();

 const T={
  uk:{exit:'Вийти з уроку. Прогрес збережено',phases:['Вивчи','Почуй','Перевір'],talk:'Розмова',review:'Повторення',placement:'Перевірка рівня',session:'Заняття',of:(a,b)=>a+' з '+b,
   plan:n=>'Сьогодні '+n+' '+(n%10===1&&n%100!==11?'нове слово':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'нові слова':'нових слів')+'. Спершу вивчимо, потім послухаємо і перевіримо себе.',
   study:'Послухай, повтори вголос і натисни «Далі».',listen:'Послухай і вибери, що почув(ла).',check:'Як це сказати нідерландською?',checkAny:'Вибери правильну відповідь.',
   right:['Так! Чудово.','Правильно, так тримати!','Саме так!','Молодець, відповідь правильна.'],wrong:c=>'Майже! Правильно: «'+c+'». Це слово ще повернеться в повторенні.',
   phaseDone:['Слова знайомі. Тепер послухай їх без підказки.','Добре чуєш! Тепер перевір себе: від перекладу до нідерландської.'],
   result:(c,t)=>c===t?'Усі '+t+' правильно! Чудовий урок.':'Правильно '+c+' з '+t+'. Гарна робота!',nextLesson:'Далі — наступний урок, він уже готовий.',nextReview:'Є слова з помилками: повторімо їх, це хвилина.',
   talkIntro:'Коротка розмова з 3 реплік. Відповідай нідерландською, підказки під питанням.',talkNext:'Наступна репліка. Відповідай нідерландською.',xp:'XP'},
  en:{exit:'Leave the lesson. Progress is saved',phases:['Learn','Listen','Check'],talk:'Conversation',review:'Review',placement:'Level check',session:'Session',of:(a,b)=>a+' of '+b,
   plan:n=>'Today: '+n+' new '+(n===1?'word':'words')+'. First we learn them, then listen and check ourselves.',
   study:'Listen, say it out loud, then tap «Next».',listen:'Listen and choose what you heard.',check:'How do you say this in Dutch?',checkAny:'Choose the right answer.',
   right:['Yes! Great.','Correct, keep going!','Exactly!','Well done, that’s right.'],wrong:c=>'Almost! The answer is “'+c+'”. This word will come back in your review.',
   phaseDone:['You know the words now. Next, listen to them without a hint.','Good listening! Now check yourself: from the translation to Dutch.'],
   result:(c,t)=>c===t?'All '+t+' correct! A great lesson.':c+' of '+t+' correct. Good work!',nextLesson:'Next up: the next lesson is ready.',nextReview:'Some words were tricky: let’s review them, it takes a minute.',
   talkIntro:'A short conversation, 3 turns. Answer in Dutch; hints are under the question.',talkNext:'Next turn. Answer in Dutch.',xp:'XP'},
  fr:{exit:'Quitter la leçon. Progression enregistrée',phases:['Apprends','Écoute','Vérifie'],talk:'Conversation',review:'Révision',placement:'Test de niveau',session:'Séance',of:(a,b)=>a+' sur '+b,
   plan:n=>'Aujourd’hui : '+n+' '+(n===1?'nouveau mot':'nouveaux mots')+'. On apprend, on écoute, puis on vérifie.',
   study:'Écoute, répète à voix haute, puis touche « Suivant ».',listen:'Écoute et choisis ce que tu as entendu.',check:'Comment le dire en néerlandais ?',checkAny:'Choisis la bonne réponse.',
   right:['Oui ! Bravo.','Correct, continue !','Exactement !','Bien joué, c’est juste.'],wrong:c=>'Presque ! La réponse est « '+c+' ». Ce mot reviendra dans ta révision.',
   phaseDone:['Tu connais les mots. Maintenant, écoute-les sans indice.','Bonne écoute ! Vérifie-toi : de la traduction au néerlandais.'],
   result:(c,t)=>c===t?'Les '+t+' réponses sont justes ! Super leçon.':c+' sur '+t+' justes. Bon travail !',nextLesson:'Ensuite : la leçon suivante est prête.',nextReview:'Quelques mots étaient difficiles : révisons-les, ça prend une minute.',
   talkIntro:'Une courte conversation en 3 répliques. Réponds en néerlandais ; les indices sont sous la question.',talkNext:'Réplique suivante. Réponds en néerlandais.',xp:'XP'},
  ar:{exit:'الخروج من الدرس. تم حفظ التقدّم',phases:['تعلّم','استمع','تحقّق'],talk:'محادثة',review:'مراجعة',placement:'اختبار المستوى',session:'الجلسة',of:(a,b)=>a+' من '+b,
   plan:n=>'اليوم '+n+' كلمات جديدة. نتعلّمها أولاً، ثم نستمع ونختبر أنفسنا.',
   study:'استمع، كرّر بصوت عالٍ، ثم اضغط «التالي».',listen:'استمع واختر ما سمعته.',check:'كيف تقولها بالهولندية؟',checkAny:'اختر الإجابة الصحيحة.',
   right:['نعم! رائع.','صحيح، واصل!','تماماً!','أحسنت، إجابة صحيحة.'],wrong:c=>'قريب جداً! الإجابة الصحيحة «'+c+'». ستعود هذه الكلمة في المراجعة.',
   phaseDone:['تعرّفت على الكلمات. الآن استمع إليها دون مساعدة.','استماع جيد! الآن اختبر نفسك: من الترجمة إلى الهولندية.'],
   result:(c,t)=>c===t?'كل الإجابات الـ'+t+' صحيحة! درس رائع.':c+' من '+t+' صحيحة. عمل جيد!',nextLesson:'التالي: الدرس القادم جاهز.',nextReview:'بعض الكلمات كانت صعبة: لنراجعها، الأمر يستغرق دقيقة.',
   talkIntro:'محادثة قصيرة من 3 ردود. أجب بالهولندية؛ التلميحات تحت السؤال.',talkNext:'الرد التالي. أجب بالهولندية.',xp:'XP'}
 };
 const tr=lang=>T[lang]||T.uk;
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
 const svg=(paths,size=22,width=2.4)=>{const NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('width',size);s.setAttribute('height',size);s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width',width);s.setAttribute('stroke-linecap','round');s.setAttribute('aria-hidden','true');for(const d of paths){const p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.appendChild(p)}return s};
 const styled=el=>{if(!cssOk){el.style.visibility='hidden';cssReady.then(()=>{el.style.visibility=''})}return el};

 // ---- focus on / off: hides the header, dock and footer; watches text fields for the on-screen keyboard.
 let typingWatch=false;
 function enter(on){
  const html=document.documentElement;html.classList.toggle('lp-focus',!!on);if(!on)html.classList.remove('fl-typing');
  if(on&&!typingWatch){typingWatch=true;
   const isField=e=>e&&e.matches?.('textarea,input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit])')&&!!e.closest?.('#learningPath,.cp-stage');
   document.addEventListener('focusin',e=>{if(!html.classList.contains('lp-focus')||!isField(e.target))return;html.classList.add('fl-typing');
    // the keyboard takes ~300 ms to open: then the field and its button go to the middle of what is left of the screen
    setTimeout(()=>{if(document.activeElement===e.target){const f=e.target.closest('form')||e.target;try{f.scrollIntoView({block:'center',behavior:'instant'})}catch{f.scrollIntoView()}}},320)});
   document.addEventListener('focusout',e=>{if(isField(e.target))setTimeout(()=>{if(!isField(document.activeElement))html.classList.remove('fl-typing')},120)});
  }
 }
 const active=()=>typeof document!=='undefined'&&document.documentElement.classList.contains('lp-focus');

 /* Top bar. o: {lang, kind:'lesson'|'review'|'talk'|'placement'|'session', phase:0..2, index, total, xp, onExit} */
 function bar(o){
  const t=tr(o.lang),b=styled(node('div','fl-bar'));b.dir=o.lang==='ar'?'rtl':'ltr';
  const exit=node('button','fl-exit');exit.type='button';exit.setAttribute('aria-label',t.exit);exit.title=t.exit;exit.appendChild(svg(['M6 6l12 12','M18 6L6 18']));exit.onclick=o.onExit;exit.dataset.action='exit';
  const segs=node('div','fl-progress'),total=Math.max(1,o.total||1),idx=Math.min(o.index||0,total);
  let label;
  if(o.kind==='lesson'){const ph=Math.max(0,Math.min(2,o.phase|0));for(let i=0;i<3;i++){const s=node('span','fl-seg');const f=node('i');f.style.width=(i<ph?100:i===ph?Math.round(idx/total*100):0)+'%';s.appendChild(f);segs.appendChild(s)}
   label=t.phases[ph]+' · '+t.of(Math.min(idx+1,total),total);segs.setAttribute('role','progressbar');segs.setAttribute('aria-valuemin','0');segs.setAttribute('aria-valuemax','3');segs.setAttribute('aria-valuenow',String(ph));segs.setAttribute('aria-valuetext',label)}
  else{const s=node('span','fl-seg fl-seg-one');const f=node('i');f.style.width=Math.round(idx/total*100)+'%';s.appendChild(f);segs.appendChild(s);label=(t[o.kind]||t.session)+(o.total?' · '+t.of(Math.min(idx+1,total),total):'');segs.setAttribute('aria-label',label)}
  const lab=node('p','fl-label',label);
  const mid=node('div','fl-mid');mid.append(segs,lab);
  b.append(exit,mid);
  if(o.xp!=null){const x=node('span','fl-xp',String(o.xp)+' '+t.xp);x.setAttribute('aria-label',o.xp+' '+t.xp);b.appendChild(x)}
  return b;
 }
 /* Lexi's line: a small avatar and one short sentence. live: read by screen readers when it changes. */
 function lexi(text,{live=false,tone=''}={}){
  const box=node('div','fl-lexi'+(tone?' is-'+tone:''));const img=node('img','fl-av');img.src=LEXI_IMG;img.alt='';img.setAttribute('aria-hidden','true');img.width=36;img.height=36;img.decoding='async';
  const p=node('p','fl-bubble',text);if(live){box.setAttribute('role','status')}box.append(img,p);return box;
 }
 /* The fixed bottom area with the main action (and at most one quiet extra). */
 function actions(...els){const a=styled(node('div','fl-actions'));a.append(...els.filter(Boolean));return a}
 const pick=(list,i)=>list[Math.abs(i|0)%list.length];
 // After a new task is drawn: the task area back at the top of the screen (the next card never starts half scrolled).
 function toTask(){try{if(active())window.scrollTo({top:0,behavior:'instant'})}catch{try{window.scrollTo(0,0)}catch{}}}

 globalThis.LerenFocusLesson={tr,enter,active,bar,lexi,actions,pick,toTask,cssReady};
})();
