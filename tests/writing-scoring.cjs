// Writing checklists of the A1.2 exam and lesson tasks against different correct and wrong answers.
// Run: node tests/writing-scoring.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const ctx=vm.createContext({console,uiLang:'uk',lsGet:()=>({}),lsSet(){},shuffle:a=>a.slice(),window:{},DATA:{}});ctx.window=ctx;
vm.runInContext(read('course-curriculum.js'),ctx);
for(const f of ['exam-core','exam11','exam12-data','exam12'])vm.runInContext(read('modules/exam/'+f+'.js'),ctx);
const E=ctx.EXAM12,task=id=>E.tasks().find(w=>w.id===id),score=(id,text)=>E.score(task(id),text);
const failed=(id,text)=>Array.from(score(id,text).items.filter(x=>!x.ok).map(x=>x.label));

// 1. Correct answers in other words than the model: every check passes, no tip.
const correct={
 ziek_kind:"Dag juf Ann,\n\nMijn zoon Max is ziek. Hij heeft sinds zondag buikpijn en een beetje koorts. Hij blijft vandaag en morgen thuis. Woensdag komt hij terug naar school. Kan hij het huiswerk later maken?\n\nGroetjes,\nIryna",
 ziek_werk:"Dag Kristof,\n\nIk voel me niet goed. Ik heb hoofdpijn en ik heb koorts. Ik kan vandaag niet werken. Morgen ga ik naar de dokter en ik vraag een ziektebriefje. Ik hoop dat ik vrijdag terug kan komen.\n\nMet vriendelijke groeten,\nAndrij",
 huisbaas:"Dag mevrouw Claes,\n\nEr is een lek in de badkamer. Het water komt sinds zaterdag onder de douche uit. Wanneer kan iemand komen kijken? Ik ben elke dag na vier uur thuis.\n\nMet vriendelijke groeten,\nAnna Shevchenko",
 afspraak:"Beste meneer,\n\nIk heb op donderdag om 10 uur een afspraak voor mijn identiteitskaart. Sorry, maar ik kan niet komen, want mijn kind is ziek. Past dinsdag of woensdag misschien?\n\nMet vriendelijke groeten,\nMaksym",
 weekend:"Hallo Lies,\n\nHoe was jouw weekend? Zaterdag zijn we naar de markt gegaan. Daar hebben we groenten gekocht. Zondag heb ik een taart gebakken en mijn buren zijn gekomen. Het was gezellig, maar ik was ook moe.\nWat heb jij gedaan?\n\nGroetjes,\nOksana",
 vakantie:"Dag allemaal,\n\nWe zijn nu in Durbuy. We logeren op een camping naast de rivier. Het weer is warm en er is veel zon. Gisteren hebben we een kasteel bezocht. Morgen gaan we kajakken.\n\nTot volgende week,\nIgor",
 vacature:"Beste mevrouw,\n\nMijn naam is Petro Bondar. Ik zoek werk in een supermarkt. In Lviv was ik drie jaar verkoper in een winkel. Ik spreek Oekraïens, Russisch en een beetje Nederlands. Ik kan meteen beginnen, ook op zaterdag. In de bijlage vindt u mijn cv.\n\nMet vriendelijke groeten,\nPetro Bondar",
 buur:"Dag meneer Peeters,\n\nMorgen krijg ik een pakket, maar ik ben de hele dag op het werk. Kan u het pakket voor mij aannemen? Ik kom het om zeven uur halen. Heel erg bedankt!\n\nGroetjes,\nDanylo",
 plannen:"Dag Ann,\n\nIk heb veel plannen. Eerst ga ik mijn diploma laten erkennen. Daarna wil ik als boekhouder werken. Ik ga ook elke week Nederlands oefenen met mijn buren. Later wil ik een huis kopen in Gent.\n\nGroetjes,\nMarta",
 tweedehands:"Hallo,\n\nIs uw fiets nog te koop? Ik ben geïnteresseerd. Is 75 euro ook goed? Ik kan de fiets zondag in Leuven komen halen. Hoe laat past het voor u?\n\nGroetjes,\nOleh",
 klacht:"Beste,\n\nVorige week heb ik in uw webshop een stofzuiger gekocht. Hij is kapot: hij start niet. Kan ik hem omruilen voor een nieuwe? Mijn bestelnummer is 77 120.\n\nMet vriendelijke groeten,\nNatalia Koval",
 form_cursus:"Naam: Iryna Petrenko\nAdres: Stationsstraat 5, 2800 Mechelen\nTelefoon: 0485 22 33 44\nGeboortedatum: 02/11/1991\nMoedertaal: Oekraïens\nNiveau: A1.2\nWaarom wil je deze cursus volgen? Ik volg de cursus omdat ik beter met de leerkracht van mijn kinderen wil praten.",
 form_club:"Naam van het kind: Max Bondar\nLeeftijd: 8\nSport: voetbal\nNaam van de ouder: Petro Bondar\nE-mail: petro.bondar@mail.be\nTelefoon: 0477 88 99 00\nAllergieën of ziektes: astma",
 trein:"Hoi Jan,\n\nIk sta in Mechelen en er is vertraging op de lijn. Sorry, ik kom te laat. Ik ben er over vijftien minuten. Kun je de koffie al klaarzetten?\n\nTot zo,\nDanylo",
 wandeling:"Dag,\n\nIk wil me inschrijven voor de wandeling van 8 juni. We komen met twee volwassenen en twee kinderen van 6 en 10 jaar. Mag de hond ook mee? Ik betaal ter plaatse.\n\nGroeten,\nOksana Melnyk",
 waarom:"Ik woon in Antwerpen omdat mijn man hier werkt. Ik leer Nederlands omdat ik met mijn buren wil praten. Ik ga graag naar de markt omdat de groenten daar vers zijn. Ik werk nog niet, want ik volg eerst de cursus. Ik ben tevreden omdat mijn kinderen hier een goede school hebben.",
 taken:"Hallo allemaal,\n\nOp maandag doe ik de boodschappen. Op dinsdag zet Max de vuilniszak buiten. Op donderdag kookt papa en op zaterdag stofzuigen we samen het huis.\n\nGroetjes,\nmama",
 route:"Dag Pieter,\n\nAls je uit het station komt, ga je rechtdoor tot aan de verkeerslichten. Daar ga je rechts. Na de brug zie je de apotheek op de hoek. Ik woon naast de apotheek, nummer 23. Het is vijf minuten wandelen.\n\nTot straks,\nIryna"
};
for(const [id,text] of Object.entries(correct)){
 assert(task(id),'Task exists: '+id);
 const r=score(id,text);assert.deepEqual(failed(id,text),[],'Correct answer for '+id+' fails: '+failed(id,text).join(' | '));
 assert.equal(r.pct,100);assert.equal(r.tips.length,0,'No mistake tip on a correct answer for '+id+': '+r.tips.join(' | '));
}
assert.equal(Object.keys(correct).length,E.tasks().length,'A second correct answer for every task');
for(const w of E.tasks()){const r=E.score(w,w.model);assert.equal(r.pct,100,'Model '+w.id);assert.equal(r.tips.length,0,'Model tips '+w.id)}

// 2. Empty, too short and off-task answers do not pass.
for(const w of E.tasks()){
 assert.equal(E.score(w,'').pct===100,false,'Empty answer passes '+w.id);
 assert(E.score(w,'Hallo.').pct<50,'One word scores low for '+w.id);
}
assert(score('huisbaas',correct.weekend).pct<100,'A weekend e-mail does not answer the landlord task');
assert(score('ziek_werk',correct.vakantie).pct<100,'A holiday card is not a sick note');

// 3. Wrong answers: the right checks fail and the right tips appear.
const wrong=(id,text,expectFail,expectTip)=>{const r=score(id,text),f=failed(id,text).join(' | ');
 for(const x of expectFail)assert(f.includes(x),id+': expected failing check «'+x+'», got: '+f);
 for(const x of expectTip||[])assert(r.tips.some(t=>t.includes(x)),id+': expected tip «'+x+'», got: '+r.tips.join(' | '));
 assert(r.pct<100,id+' must not score 100%');return r};
wrong('weekend',"Hallo Lies,\n\nZaterdag ik heb gegaan naar de markt. Ik heb groenten kopen. Het was leuk.\n\nGroetjes,\nOksana",['Perfectum met zijn','Vraag'],['zijn']);
wrong('weekend',"hallo lies\n\nik ben gewerkt. ik heb gekookt\n\ngroetjes oksana",['Perfectum met zijn','з великої'],['hebben']);
wrong('ziek_kind',"Hallo,\n\nMijn zoon is ziek.\n\nGroetjes,\nIryna",['Begroeting (Beste juf','sinds','Wanneer terug']);
wrong('afspraak',"Beste meneer,\n\nIk kan donderdag niet komen omdat ik moet werken.\n\nGroetjes,\nMaksym",['Het spijt me','Een nieuwe dag']);
wrong('afspraak',"Beste meneer,\n\nHet spijt me, ik kan donderdag niet komen, omdat ik ben ziek. Past vrijdag?\n\nGroetjes,\nMaksym",[],['omdat']);
wrong('waarom',"Ik leer Nederlands omdat ik wil werken hier. Ik woon hier omdat mijn man werkt hier. Ik ben blij.",['Minstens 3 × omdat','Minstens 1 × want']);
wrong('waarom',"ik leer Nederlands omdat ik ben in België. Ik woon hier omdat ik heb werk. Ik ga graag zwemmen omdat het leuk is. Ik ben moe want ik werk veel. Ik kook graag.",['omdat: werkwoord achteraan','hoofdletter'],['omdat']);
wrong('form_cursus',"Naam: Iryna\nAdres: Gent\nTelefoon: 123\nWaarom wil je deze cursus volgen? Omdat ik heb tijd.",['Adres','Telefoon','Geboortedatum','Moedertaal','Niveau','omdat']);
wrong('form_club',"Naam van het kind: Max\nLeeftijd: acht\nE-mail: petro",['Leeftijd','Sport','E-mail','Telefoon']);
wrong('route',"Hoi Pieter,\n\nJe komt naar mijn huis. Het is niet ver.\n\nTot straks,\nIryna",['rechtdoor','links / rechts','Een plaats','Adres','Hoe lang']);
wrong('klacht',"Beste,\n\nDe stofzuiger is mooi. Bedankt!\n\nGroeten,\nNatalia",['Wat heb je gekocht','Het probleem','Wat wil je']);
wrong('trein',"Hoi Jan,\n\nIk kom morgen.\n\nTot zo,\nDanylo",['vertraging','te laat','Hoe laat','Een vraag']);
wrong('vacature',"Beste mevrouw,\n\nIk wil werken. Ik ben er morgen.\n\nGroeten,\nPetro",['Wie ben je','Ervaring','Talen','cv']);
wrong('tweedehands',"Hallo,\n\nIk wil de fiets.\n\nGroetjes,\nOleh",['nog te koop','Prijs','ophalen']);
wrong('taken',"Hallo allemaal,\n\nIk doe de afwas.\n\nGroetjes,\nmama",['Minstens 3 dagen','Minstens 3 taken']);
// General checks for messages: capitals, full stops, sentence count, name.
const gen=failed('ziek_werk',"beste kristof\n\nik ben ziek ik kan niet komen werken ik ga naar de dokter voor een ziektebriefje morgen ben ik terug");
for(const x of ['з великої','закінчується','Щонайменше','Ім’я'])assert(gen.some(f=>f.includes(x)),'General check «'+x+'» fails: '+gen.join(' | '));
// Tips: common mistakes and correct sentences.
const tips=t=>E.score(task('weekend'),t).tips;
for(const s of ['Ik heb gegaan.','Ik ben gewerkt.','omdat ik ben ziek.','Hij is groter als ik.','Ik ben geopstaan.','Bedenkt voor de uitnodiging.'])assert(tips(s).length,'Tip for: '+s);
for(const s of ['Ik ben gegaan.','Ik heb gewerkt.','omdat ik ziek ben.','omdat ik moet werken.','Hij is groter dan ik.','Ik ben opgestaan.','Bedankt voor de uitnodiging.','Ik ben even groot als hij.'])assert.equal(tips(s).length,0,'No tip for: '+s);
// Labels follow the interface language.
for(const [lang,word] of [['en','capital'],['fr','majuscule'],['ar','حرف كبير']]){ctx.uiLang=lang;assert(E.score(task('ziek_werk'),'x').items.some(i=>i.label.includes(word)),'Checklist in '+lang)}
ctx.uiLang='uk';
console.log('PASS: '+E.tasks().length+' writing tasks: model and a second correct answer score 100% without tips, empty/short/off-task answers fail, 14 wrong answers fail the right checks and get the right tips, labels in four languages');
