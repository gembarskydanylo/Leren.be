/* LerenBe LIFE pilot — original Belgian Dutch A1/A2 content. No APIs or personal data. */
(function(root){
  'use strict';
  const vocabulary=[
    {nl:'de hamer',uk:'молоток',cat:'tools'},{nl:'de nagel',uk:'цвях',cat:'tools'},
    {nl:'de schroef',uk:'шуруп',cat:'tools'},{nl:'de schroefmachine',uk:'шуруповерт',cat:'tools'},
    {nl:'de boormachine',uk:'дриль',cat:'tools'},{nl:'de waterpas',uk:'будівельний рівень',cat:'tools'},
    {nl:'de schop',uk:'лопата',cat:'tools'},{nl:'de spade',uk:'штикова лопата',cat:'tools'},
    {nl:'het meetlint',uk:'рулетка',cat:'tools'},{nl:'het touw',uk:'мотузка',cat:'tools'},
    {nl:'de paal',uk:'стовп',cat:'fence'},{nl:'het hek',uk:'паркан',cat:'fence'},
    {nl:'de poort',uk:'хвіртка / ворота',cat:'fence'},{nl:'het grind',uk:'щебінь',cat:'fence'},
    {nl:'het gat',uk:'яма / отвір',cat:'fence'},{nl:'de diepte',uk:'глибина',cat:'measure'},
    {nl:'de hoogte',uk:'висота',cat:'measure'},{nl:'diep',uk:'глибоко / глибокий',cat:'measure'},
    {nl:'niet te diep',uk:'не надто глибоко',cat:'measure'},{nl:'ondiep',uk:'неглибокий',cat:'measure'},
    {nl:'hoger',uk:'вище',cat:'measure'},{nl:'lager',uk:'нижче',cat:'measure'},
    {nl:'een centimeter',uk:'один сантиметр',cat:'measure'},{nl:'hoeveel centimeter?',uk:'скільки сантиметрів?',cat:'measure'}
  ];
  const scenes=[
    {id:'tools',title:'Попроси інструмент',context:'Сусід стоїть біля ями. Тобі потрібен молоток.',prompt:'Як ввічливо попросити молоток?',options:['Kun je me de hamer aangeven, alsjeblieft?','Waar is de waterpas?','We moeten de poort openen.'],correct:0,feedback:'Kun je me … aangeven? — природне прохання передати предмет.',phrase:'Kun je me de hamer aangeven, alsjeblieft?',translate:'Можеш передати мені молоток, будь ласка?',grammar:'Kun je + мені (me) + предмет + aangeven?'},
    {id:'have',title:'Запитай, чи є інструмент',context:'Треба перевірити, чи стовп стоїть вертикально.',prompt:'Запитай: «У тебе є будівельний рівень?»',options:['Heb je een waterpas?','Hoe diep is het gat?','Is de paal te hoog?'],correct:0,feedback:'Heb je een …? — «У тебе є …?»',phrase:'Heb je een waterpas?',translate:'У тебе є рівень?',grammar:'У запитанні з heb дієслово стоїть на початку.'},
    {id:'depth',title:'Глибина ями',context:'Ви викопали яму під дерев’яний стовп. Треба уточнити глибину.',prompt:'Як запитати «Наскільки глибокою має бути яма?»',options:['Hoe hoog moet de paal zijn?','Hoe diep moet het gat zijn?','Waar ligt de hamer?'],correct:1,feedback:'Hoe diep …? питає про глибину, hoe hoog …? — про висоту.',phrase:'Hoe diep moet het gat zijn?',translate:'Якої глибини має бути яма?',grammar:'Hoe diep — наскільки глибоко; moet … zijn — має бути.'},
    {id:'cm',title:'Скільки сантиметрів?',context:'Сусід сказав зробити яму глибшою, але не вказав розмір.',prompt:'Як перепитати «На скільки сантиметрів глибше?»',options:['Hoeveel centimeter dieper?','Hoeveel meter hoger?','Hoe laat beginnen we?'],correct:0,feedback:'Hoeveel centimeter dieper? — коротке природне уточнення під час роботи.',phrase:'Hoeveel centimeter dieper?',translate:'На скільки сантиметрів глибше?',grammar:'diep → dieper; hoog → hoger; laag → lager.'},
    {id:'height',title:'Висота стовпа',context:'Стовп стирчить вище за інші. Ти хочеш уточнити необхідну висоту.',prompt:'Запитай: «Якої висоти має бути стовп?»',options:['Hoe diep is de paal?','Hoe hoog moet de paal zijn?','Heb je een schop?'],correct:1,feedback:'Hoe hoog moet de paal zijn? — про потрібну висоту.',phrase:'Hoe hoog moet de paal zijn?',translate:'Якої висоти має бути стовп?',grammar:'hoog = високий, hoogte = висота, hoger = вище.'},
    {id:'hold',title:'Тримай рівно',context:'Треба підсипати щебінь, поки сусід тримає стовп.',prompt:'Як попросити «Можеш потримати стовп рівно?»',options:['Kun je de paal even recht vasthouden?','Kun je het gat dichtmaken?','Heb je een schroefmachine?'],correct:0,feedback:'even робить прохання м’якшим, recht — рівно, vasthouden — тримати.',phrase:'Kun je de paal even recht vasthouden?',translate:'Можеш трохи потримати стовп рівно?',grammar:'Kun je … even …? — ввічливе прохання; vasthouden — тримати.'}
  ];
  const stateKey='leren_life_fence_v1';
  function normalize(s){return String(s||'').toLocaleLowerCase('nl').normalize('NFC').replace(/[.!?,]/g,'').replace(/\s+/g,' ').trim()}
  function grade(sceneId,option){const s=scenes.find(x=>x.id===sceneId);return s?{correct:s.correct===option,correctText:s.options[s.correct],feedback:s.feedback}:null}
  root.LerenLifeFence=Object.freeze({vocabulary,scenes,stateKey,normalize,grade});
})(typeof window!=='undefined'?window:globalThis);
