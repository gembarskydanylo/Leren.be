// Rebuilds audio/nl/manifest.json and audio/nl-f/manifest.json from the .m4a files in each folder.
// Run after recording and after pulling other recordings: node tools/audio-manifest.js
const fs=require('fs');
for(const dir of ['audio/nl','audio/nl-f']){
 const ids=fs.readdirSync(dir).filter(f=>f.endsWith('.m4a')&&!f.startsWith('.')).map(f=>f.slice(0,-4)).sort();
 fs.writeFileSync(dir+'/manifest.json',JSON.stringify(ids)+'\n');
 console.log(dir+': '+ids.length+' recordings');
}
