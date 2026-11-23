/* Print54 V2 : cache hors ligne minimal (créé le 23/11/2026). Pages : réseau d'abord, puis cache, puis offline.html. */
var V = "p54-v1", S = self.registration.scope;
var CORE = ["", "css/style.css", "js/main.js", "offline.html", "img/logo/logo-horizontal-noir.svg", "favicon.svg"].map(function (p) { return S + p; });
self.addEventListener("install", function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(function (res) { var c = res.clone(); caches.open(V).then(function (k) { k.put(r, c); }); return res; })
      .catch(function () { return caches.match(r).then(function (m) { return m || caches.match(S + "offline.html"); }); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).then(function (res) { if (res.ok) { var c = res.clone(); caches.open(V).then(function (k) { k.put(r, c); }); } return res; });
  }));
});
