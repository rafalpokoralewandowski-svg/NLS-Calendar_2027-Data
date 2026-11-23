// NLS Calendar offline cache. Bump VERSION when index.html changes so phones pick up the new copy.
// Several apps can live on one github.io address, so this only ever touches caches whose name starts with PREFIX.
const PREFIX = "nls-calendar-", VERSION = PREFIX + "20261124-0104";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/apple-touch-icon.png",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const mine = () => caches.open(VERSION);
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    // the calendar page: try the network so updates arrive, fall back to the saved copy when offline
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); mine().then(c => c.put("./index.html", copy)); }
      return r;
    }).catch(() => mine().then(c => c.match("./index.html"))));
    return;
  }
  e.respondWith(mine().then(c => c.match(req)).then(hit => hit || fetch(req)));
});
