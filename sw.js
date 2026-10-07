// Service worker: deixa o Topzi instalável e jogável offline.
// Online, busca sempre a versão nova (rede primeiro); sem internet, usa a cópia guardada.

const CACHE = "topzi-v1";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "data/listas.js",
  "data/listas-mais.js",
  "data/listas-grandes.js",
  "data/listas-grandes-2.js",
  "data/listas-extra.js",
  "data/listas-grandes-3.js",
  "js/icons.js",
  "js/avatars.js",
  "js/util.js",
  "js/match.js",
  "js/efeitos.js",
  "js/listas.js",
  "js/modos.js",
  "js/jogadores.js",
  "js/skins.js",
  "js/partida.js",
  "js/resultado.js",
  "js/estatisticas.js",
  "js/diaria.js",
  "js/config.js",
  "js/online.js",
  "js/app.js",
  "brand/logo.svg",
  "brand/logo-dark.svg",
  "brand/simbolo.svg",
  "brand/simbolo-escuro.svg",
  "brand/favicon.svg",
  "brand/favicon-32.png",
  "brand/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return req.mode === "navigate" ? caches.match("index.html") : Response.error();
      })),
  );
});
