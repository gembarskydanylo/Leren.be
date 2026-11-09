// Static regression checks for first-glance interface language selection.
// Run with: node tests/header-language.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(html,/<html lang="uk"/);
assert.match(app,/uiLang=validStored\("poly_ui",UI_LANGS,"uk"\)/);
const header=html.match(/<header>[\s\S]*?<\/header>/)?.[0];
assert.ok(header,'header exists');
assert.ok(header.includes('id="headerUiLangPicker"'),'visible select in header');
for(const code of ['uk','en','fr','ar']) assert.ok(header.includes('value="'+code+'"'),'language option: '+code);
assert.ok(app.includes('headerUiPicker.value=uiLang'),'visible control syncs after language change');
assert.ok(app.includes('changeUiLang(e.target.value));'),'picker invokes the existing language transition');
assert.match(html,/app\.js\?v=219/);
assert.match(sw,/leren-be-v219/);
assert.match(sw,/app\.js\?v=219/);
console.log('PASS: initial Ukrainian, visible language switcher, persistence path and updated offline asset versions');

const splash=fs.readFileSync('splash.js','utf8');
assert.match(html,/splash\.js\?v=205/);
assert.match(sw,/leren-be-v219/);
assert.match(sw,/splash\.js\?v=205/);
assert.match(splash,/leren_onboarding_language_v1/);
assert.match(splash,/localStorage\.getItem\(k\)/);
assert.match(splash,/setTimeout\(finish,4000\)/);
for(const code of ['uk','en','fr','ar']) assert.match(splash,new RegExp('id:"'+code+'"'));
console.log('PASS: language onboarding, saved choice, localized banner and 4-second transition');
