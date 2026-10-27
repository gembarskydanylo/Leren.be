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
assert(['✍️','📖'].includes(unmatched.icon),'Unmatched grammar gaps show a writing picture, not the same cat on every question');
assert(!String(unmatched.src||'').includes('cat'),'Question art never falls back to a cat');
const time=context.renderQuestionPicture({q:{uk:'Котра година?',en:'What time is it?'}});
assert.equal(time.icon,'⏰','Unmatched time questions use the bundled clock emoji');
// With the drawn card art loaded, cards and themes use their own drawing.
context.LerenCardArt={A:{'🍞':'<svg>bread</svg>','⏰':'<svg>clock</svg>'}};
const drawnBread=context.renderQuestionPicture({type:'gap',sentence:'Ik koop ___ brood.'});
assert.equal(drawnBread.innerHTML,'<svg>bread</svg>','Matched questions show the drawing for that word');
const drawnTime=context.renderQuestionPicture({q:{uk:'Котра година?',en:'What time is it?'}});
assert.equal(drawnTime.innerHTML,'<svg>clock</svg>','Theme fallback uses the drawing for the theme');
const svgCard=context.renderQuestionPicture({icon:'<svg>own</svg>'});
assert.equal(svgCard.innerHTML,'<svg>own</svg>','A card that already has a drawing keeps it');
console.log('PASS: question-specific drawings, card SVGs kept, theme drawings, no cat fallback');
