// Splash screen on app open: one of the motivation posters for about 4 seconds, then the home screen.
// Once per browser session (a PWA launch is a new session). Tap, Enter or Escape skips it. Skipped for automated browsers.
(function(){
 var box=document.getElementById("splash");if(!box)return;
 function drop(){if(box&&box.parentNode)box.parentNode.removeChild(box);box=null}
 var skip=false;try{skip=navigator.webdriver||sessionStorage.getItem("leren_splash_seen")==="1"||/[?&]nosplash\b/.test(location.search)}catch(e){}
 if(skip){drop();return}
 try{sessionStorage.setItem("leren_splash_seen","1")}catch(e){}
 var img=box.querySelector("img"),n=1+Math.floor(Math.random()*5);img.src="./img/splash/splash-"+n+".webp";
 box.hidden=false;document.documentElement.classList.add("splash-on");
 var closing=false;
 function close(){if(closing||!box)return;closing=true;document.documentElement.classList.remove("splash-on");box.classList.add("out");setTimeout(drop,320)}
 box.addEventListener("click",close);
 document.addEventListener("keydown",function(e){if(e.key==="Escape"||e.key==="Enter"||e.key===" ")close()});
 setTimeout(close,4000);
})();
