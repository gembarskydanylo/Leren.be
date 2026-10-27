const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function questionPicture('),end=html.indexOf('\n}',start)+2;
assert(start>=0&&end>start,'Question illustration resolver exists');
const images=[];
const context=vm.createContext({
 DATA:{food:{items:[{id:'food_bread',nl:'het brood',en:'bread',fr:'pain',uk:'хліб',icon:'🍞'}]}},
 LerenEmoji:{make(icon,className){const image={tag:'img',icon,className,attrs:{},removeAttribute(k){delete this.attrs[k]}};images.push(image);return image}},
 LerenWordArt:{forCard(){return null},svg(){return ''}},
 el(tag,className){return {tag,className,attrs:{},setAttribute(k,v){this.attrs[k]=v}}},
 iconBox(icon){return {tag:'div',icon,classList:{add(){}},setAttribute(){}}}
});
vm.runInContext(html.slice(start,end)+';globalThis.renderQuestionPicture=questionPicture',context);
const bread=context.renderQuestionPicture({type:'gap',sentence:'Ik koop ___ brood.',q:{uk:'Заповни пропуск',en:'Fill the gap'}});
assert.equal(bread.icon,'🍞','Gap prompts reuse the matching bread illustration');
assert.equal(bread.className,'question-picture');
const unmatched=context.renderQuestionPicture({type:'gap',sentence:'Ik ___ Anna.',q:{uk:'Заповни пропуск'}});
assert.equal(unmatched.src,'./img/mascot/fill-gap-cat.png','Unmatched grammar gaps use the writing-cat picture');
assert(!unmatched.src.includes('student-cat-v1.png'),'Question art never falls back to the six-pose mascot collage');
const time=context.renderQuestionPicture({q:{uk:'Котра година?',en:'What time is it?'}});
assert.equal(time.icon,'⏰','Unmatched time questions use the bundled clock emoji');
console.log('PASS: question-specific image matching, fill-gap fallback and no mascot collage on quiz cards');
