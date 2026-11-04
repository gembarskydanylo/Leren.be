/* One short, randomized Dutch invitation call during an active lesson visit. */
(() => {
 'use strict';
 const KEY='leren-mid-lesson-call-v1';
 const names=['Noor','Milan','Lotte','Sam','Mila','Jules','Emma','Luca'];
 const plans=[
  {nl:'Wil je morgen met mij fietsen?',uk:'Хочеш завтра покататися зі мною на велосипеді?',en:'Would you like to go cycling with me tomorrow?',fr:'Tu veux faire du vélo avec moi demain ?',ar:'هل تريد ركوب الدراجة معي غداً؟'},
  {nl:'Ga je morgen met mij zwemmen?',uk:'Підеш завтра зі мною плавати?',en:'Will you go swimming with me tomorrow?',fr:'Tu viens nager avec moi demain ?',ar:'هل ستذهب للسباحة معي غداً؟'},
  {nl:'Zullen we morgen samen in het park wandelen?',uk:'Може, завтра разом прогуляємося в парку?',en:'Shall we go for a walk in the park tomorrow?',fr:'On va se promener ensemble au parc demain ?',ar:'هل نتمشى معاً في الحديقة غداً؟'},
  {nl:'Wil je morgen met mij naar de markt gaan?',uk:'Хочеш завтра піти зі мною на ринок?',en:'Would you like to go to the market with me tomorrow?',fr:'Tu veux aller au marché avec moi demain ?',ar:'هل تريد الذهاب معي إلى السوق غداً؟'}
 ];
 const answers=[
  {kind:'yes',nl:['Ja, leuk! Hoe laat spreken we af?','Ja, graag. Ik heb morgen tijd.','Leuk idee! Ik ga graag mee.'],uk:['Так, клас! О котрій зустрінемося?','Так, із задоволенням. Я завтра маю час.','Чудова ідея! Я охоче піду з тобою.'],en:['Yes, great! What time shall we meet?','Yes, I’d love to. I have time tomorrow.','Great idea! I’d like to come.'],fr:['Oui, super ! À quelle heure se retrouve-t-on ?','Oui, avec plaisir. Je suis libre demain.','Bonne idée ! Je viens avec plaisir.'],ar:['نعم، رائع! في أي ساعة نلتقي؟','نعم، بكل سرور. لدي وقت غداً.','فكرة رائعة! يسعدني أن آتي.'],reply:['Leuk! Zullen we om tien uur afspreken?','Top! Ik stuur je straks een berichtje.'],replyUk:['Чудово! Зустріньмося о десятій?','Супер! Я трохи пізніше напишу тобі.'],replyEn:['Great! Shall we meet at ten?','Awesome! I’ll message you later.'],replyFr:['Super ! On se retrouve à dix heures ?','Génial ! Je t’envoie un message plus tard.'],replyAr:['رائع! هل نلتقي الساعة العاشرة؟','ممتاز! سأرسل لك رسالة لاحقاً.']},
  {kind:'no',nl:['Sorry, morgen kan ik niet.','Helaas, ik moet morgen werken.','Morgen lukt niet. Misschien een andere dag?'],uk:['Вибач, завтра я не можу.','На жаль, завтра я маю працювати.','Завтра не вийде. Може, іншого дня?'],en:['Sorry, I can’t tomorrow.','Unfortunately, I have to work tomorrow.','Tomorrow won’t work. Maybe another day?'],fr:['Désolé(e), je ne peux pas demain.','Dommage, je dois travailler demain.','Pas possible demain. Un autre jour ?'],ar:['آسف، لا أستطيع غداً.','للأسف، يجب أن أعمل غداً.','لا أستطيع غداً. ربما يوماً آخر؟'],reply:['Jammer! Misschien volgende week.','Geen probleem. We spreken snel af!'],replyUk:['Шкода! Може, наступного тижня.','Нічого страшного. Домовимося іншим разом!'],replyEn:['Too bad! Maybe next week.','No worries. We’ll make plans another time!'],replyFr:['Dommage ! Peut-être la semaine prochaine.','Pas de souci. On s’organisera une autre fois !'],replyAr:['للأسف! ربما الأسبوع القادم.','لا بأس. سنرتب موعداً آخر!']},
  {kind:'maybe',nl:['Misschien! Hoe laat wil je gaan?','Ik weet het nog niet. Ik laat het je vanavond weten.','Dat klinkt leuk. Waar spreken we af?'],uk:['Можливо! О котрій ти хочеш піти?','Я ще не знаю. Напишу тобі ввечері.','Звучить чудово. Де зустрінемося?'],en:['Maybe! What time do you want to go?','I’m not sure yet. I’ll let you know tonight.','That sounds fun. Where shall we meet?'],fr:['Peut-être ! À quelle heure veux-tu y aller ?','Je ne sais pas encore. Je te le dirai ce soir.','Ça a l’air sympa. Où se retrouve-t-on ?'],ar:['ربما! في أي ساعة تريد الذهاب؟','لا أعرف بعد. سأخبرك هذا المساء.','هذا يبدو جميلاً. أين نلتقي؟'],reply:['Dat is goed. Laat het maar weten!','We spreken af bij het station.'],replyUk:['Добре, дай знати!','Зустріньмося біля вокзалу.'],replyEn:['That’s fine. Let me know!','Let’s meet by the station.'],replyFr:['D’accord. Tiens-moi au courant !','Retrouvons-nous près de la gare.'],replyAr:['حسناً، أخبرني!','لنلتقِ قرب المحطة.']}
 ];
 const labels={
  uk:{incoming:'Вхідний дзвінок',friend:'Друг телефонує',answer:'Що відповіси?',your:'Твоя відповідь',their:'Друг',close:'Повернутися до уроку',speak:'Прослухати фразу',picked:'Гарна мовна практика!'},
  en:{incoming:'Incoming call',friend:'Your friend is calling',answer:'What will you say?',your:'You said',their:'Your friend',close:'Back to the lesson',speak:'Listen to the phrase',picked:'Nice language practice!'},
  fr:{incoming:'Appel entrant',friend:'Ton ami t’appelle',answer:'Que réponds-tu ?',your:'Ta réponse',their:'Ton ami',close:'Retour à la leçon',speak:'Écouter la phrase',picked:'Bonne pratique !'},
  ar:{incoming:'مكالمة واردة',friend:'صديقك يتصل بك',answer:'ماذا ستقول؟',your:'إجابتك',their:'صديقك',close:'العودة إلى الدرس',speak:'استمع إلى العبارة',picked:'تدريب لغوي رائع!'}
 };
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 function create(config){
  let data={};try{data=JSON.parse(sessionStorage.getItem(KEY)||'{}')||{}}catch{}
  let elapsed=Number.isFinite(data.elapsed)?Math.max(0,data.elapsed):0;
  const target=Number.isFinite(data.target)?data.target:180000+Math.floor(Math.random()*60000);
  let shown=data.shown===true,opened=false,scenario=null,chosen=null,interval=null;
  let last=Date.now(),overlay=null;
  const language=()=>labels[config.language?.()]?config.language(): 'uk';
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
  const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({elapsed,target,shown}))}catch{}};
  function close(){opened=false;overlay?.remove();overlay=null}
  function say(text){if(text&&config.speak)config.speak(text)}
  function render(){
   overlay?.remove();overlay=null;if(!opened)return;
   const lang=language(),copy=labels[lang],shade=make('div','midcall-shade');shade.id='midLessonCall';
   const card=make('section','midcall-card');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','midcallTitle');
   const top=make('div','midcall-top');top.append(make('span','midcall-live','● '+copy.incoming));
   const dismiss=make('button','midcall-dismiss','×');dismiss.type='button';dismiss.setAttribute('aria-label',copy.close);dismiss.onclick=close;top.appendChild(dismiss);card.appendChild(top);
   const avatar=make('div','midcall-avatar',scenario.name.slice(0,1));avatar.setAttribute('aria-hidden','true');
   const icon=make('span','midcall-phone','☎');icon.setAttribute('aria-hidden','true');avatar.appendChild(icon);card.appendChild(avatar);
   card.append(make('h2','',scenario.name),make('p','midcall-subtitle',copy.friend));
   const prompt=make('div','midcall-prompt');const nl=make('p','midcall-dutch',scenario.plan.nl);nl.lang='nl';prompt.append(nl,make('p','midcall-translation',scenario.plan[lang]||scenario.plan.uk));const listen=make('button','midcall-listen',copy.speak);listen.type='button';listen.onclick=()=>say(scenario.plan.nl);prompt.appendChild(listen);card.appendChild(prompt);
   if(!chosen){
    card.appendChild(make('h3','',copy.answer));const options=make('div','midcall-options');
    scenario.choices.forEach(choice=>{const b=make('button','midcall-choice');b.type='button';const text=make('strong','midcall-dutch',choice.nl);text.lang='nl';b.append(text,make('span','midcall-translation',choice[lang]||choice.uk));b.onclick=()=>{chosen=choice;render()};options.appendChild(b)});
    card.appendChild(options);
   }else{
    const result=make('div','midcall-result');result.appendChild(make('strong','',copy.picked));
    const you=make('div','midcall-line');you.append(make('span','midcall-label',copy.your));const said=make('p','midcall-dutch',chosen.nl);said.lang='nl';you.append(said,make('p','midcall-translation',chosen[lang]||chosen.uk));result.appendChild(you);
    const friend=make('div','midcall-line');friend.append(make('span','midcall-label',copy.their));const reply=make('p','midcall-dutch',chosen.replyText);reply.lang='nl';friend.append(reply,make('p','midcall-translation',chosen.replyTranslation));result.appendChild(friend);
    const sayBack=make('button','midcall-listen',copy.speak);sayBack.type='button';sayBack.onclick=()=>say(chosen.nl);result.appendChild(sayBack);
    const back=make('button','midcall-back',copy.close);back.type='button';back.onclick=close;result.appendChild(back);card.appendChild(result);
   }
   shade.appendChild(card);document.body.appendChild(shade);overlay=shade;
   (card.querySelector('button')||card).focus?.({preventScroll:true});
  }
  function start(){
   if(shown||opened||!config.eligible?.()||!config.boundary?.())return;
   const plan=pick(plans),name=pick(names),choices=answers.map(group=>{const i=Math.floor(Math.random()*group.nl.length);return {kind:group.kind,nl:group.nl[i],uk:group.uk[i],en:group.en[i],fr:group.fr[i],ar:group.ar[i],replyText:pick(group.reply),replyTranslation:''}});
   choices.forEach(choice=>{const group=answers.find(x=>x.kind===choice.kind),i=group.reply.indexOf(choice.replyText);choice.replyTranslation=(group['reply'+language().toUpperCase()]||group.replyUk)[i]});
   scenario={name,plan,choices:choices.sort(()=>Math.random()-.5)};shown=true;opened=true;save();render();
  }
  function tick(){
   const now=Date.now(),delta=Math.max(0,Math.min(now-last,5000));last=now;
   if(!shown&&config.active?.()&&!document.hidden){elapsed+=delta;save();if(elapsed>=target)start()}
  }
  interval=setInterval(tick,1000);
  return {close,destroy(){clearInterval(interval);close()}};
 }
 globalThis.LerenMidLessonCall={create};
})();