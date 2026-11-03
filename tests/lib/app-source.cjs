// index.html as source tests can read, with app.js put back inline where the page loads it (the main script was inline
// until v181). Tests that look for the main script, RELEASE_VERSION or functions in index.html read this.
const fs=require('node:fs'),path=require('node:path');
module.exports=()=>{
 const root=path.join(__dirname,'..','..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const tag=html.match(/<script src="\.\/app\.js\?v=\d+"><\/script>/);
 if(!tag)throw new Error('index.html does not load app.js');
 return html.replace(tag[0],()=>'<script>\n'+fs.readFileSync(path.join(root,'app.js'),'utf8')+'</script>');
};
