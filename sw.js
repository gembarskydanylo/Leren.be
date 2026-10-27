/* Leren.be offline cache. Relative paths support GitHub Pages project sites. */
const CACHE_NAME = "leren-be-v120";
const APP_FILES = ["./course-curriculum.js?v=120", "./modules/card-art/art.js?v=120", "./modules/card-art/people.js?v=120", "./modules/card-art/food.js?v=120", "./modules/card-art/things.js?v=120", "./modules/card-art/places.js?v=120", "./modules/clock/clock.js", "./modules/exam/exam11.js?v=101", "./", "./index.html", "./manifest.webmanifest", "./favicon-32.png", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./privacy.html", "./fonts/nunito.woff", "./fonts/unbounded.woff", "./dict/nl.json", "./img/chars/peter.webp", "./img/chars/peter-wow.webp", "./img/chars/peter-think.webp", "./img/chars/peter-sad.webp", "./img/chars/dafna.webp", "./img/chars/dafna-wow.webp", "./img/chars/dafna-think.webp", "./img/chars/dafna-sad.webp", "./modules/clock/widget.html", "./modules/clock/widget.js", "./modules/diphthongs/widget.js?v=87", "./modules/diphthongs/widget.html?v=87", "./modules/diphthongs/widget.css?v=87", "./modules/diphthongs/words.json?v=87", "./img/topics/birthday.svg", "./img/topics/comm.svg", "./img/topics/contact.svg", "./img/topics/dag.svg", "./img/topics/food.svg", "./img/topics/forms.svg", "./img/topics/grammar.svg", "./img/topics/grammar2.svg", "./img/topics/health.svg", "./img/topics/holiday.svg", "./img/topics/nums.svg", "./img/topics/opening.svg", "./img/topics/past.svg", "./img/topics/people.svg", "./img/topics/plans.svg", "./img/topics/reading.svg", "./img/topics/service.svg", "./img/topics/shopping.svg", "./img/topics/travel.svg", "./img/topics/travelTime.svg", "./img/topics/wonen.svg", "./modules/diphthongs/lesson-core.js?v=87", "./modules/learning-path/core.js?v=102", "./modules/rewards/core.js?v=102", "./modules/companion/ui.js?v=116", "./modules/rewards/gifts.js?v=102", "./modules/rewards/ui.js?v=102", "./modules/learning-path/ui.js?v=112", "./modules/learning-path/style.css?v=107", "./modules/rewards/style.css?v=102", "./modules/companion/style.css?v=102", "./img/mascot/student-cat-v1.png", "./audio/nl/pronunciation-v105/7dc692a9.m4a", "./audio/nl/pronunciation-v105/c79493aa.m4a", "./audio/nl-f/pronunciation-v105/7dc692a9.m4a", "./audio/nl-f/pronunciation-v105/c79493aa.m4a", "./modules/focused-home/ui.js?v=112", "./modules/focused-home/style.css?v=112", "./modules/test-library/ui.js?v=109", "./modules/test-library/style.css?v=109", "./img/tests/first-steps-v109.webp", "./img/tests/everyday-v109.webp", "./img/tests/practice-v109.webp", "./modules/game-gallery/style.css?v=111", "./img/games/story-v111.webp", "./img/games/ai-v111.webp", "./img/games/ask-v111.webp", "./img/games/dlg-v111.webp", "./img/games/rp-v111.webp", "./img/games/sp-v111.webp", "./img/games/bl-v111.webp", "./img/games/mm-v111.webp", "./img/games/dc-v111.webp", "./img/games/md-v111.webp", "./img/games/om-v111.webp", "./img/games/ks-v111.webp", "./modules/lesson-conversation/content.js?v=112", "./modules/lesson-conversation/core.js?v=112", "./modules/lesson-conversation/ui.js?v=112", "./modules/ai-coach/core.js?v=112", "./modules/ai-coach/ui.js?v=112", "./modules/word-builder/art.js?v=114", "./modules/word-builder/game.js?v=114", "./modules/word-builder/style.css?v=113", "./img/games/wb-v114.webp"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => (key.startsWith("polyglot-leren-")||key.startsWith("leren-be-")) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Version checks must reach the server, including after an older worker cached sw.js.
  if (url.pathname.endsWith("/sw.js") || request.cache === "no-store") return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        // no-cache: revalidate with the server, so a reload right after a deploy never gets a 10-minute-old page from the HTTP cache
        let response = await fetch(request.url, {cache: "no-cache", credentials: "same-origin"});
        if (response.redirected) response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});

// Daily reminder pushes (sent by .github/workflows/reminders.yml)
self.addEventListener("push", event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = {body: event.data ? event.data.text() : ""}; }
  event.waitUntil(self.registration.showNotification(d.title || "Leren.be", {
    body: d.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: "leren-daily",
    renotify: false,
    data: {url: d.url || "./"}
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await clients.matchAll({type: "window", includeUncontrolled: true});
    for (const c of all) { if (c.url.startsWith(self.registration.scope)) { await c.focus(); return; } }
    await clients.openWindow(url);
  })());
});
