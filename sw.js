// Service worker do Gamezi (raiz do site): deixa a plataforma e os jogos instaláveis e jogáveis offline.
// Cada jogo fica numa pasta (topzi/…, patozi/…); os arquivos dele entram na lista com o caminho da pasta.
// Online, busca sempre a versão nova (rede primeiro); sem internet, usa a cópia guardada.

const CACHE = "gamezi-v6";
const FILES = [
  "./",
  "index.html",
  "gamezi.css",
  "gamezi-conta.js",
  "conta.html",
  "topzi/",
  "topzi/index.html",
  "topzi/style.css",
  "docs.css",
  "termos.html",
  "privacidade.html",
  "manifest.webmanifest",
  "topzi/data/listas.js",
  "topzi/data/listas-mais.js",
  "topzi/data/listas-grandes.js",
  "topzi/data/listas-grandes-2.js",
  "topzi/data/listas-extra.js",
  "topzi/data/listas-grandes-3.js",
  "topzi/data/listas-populares.js",
  "topzi/data/traducoes.js",
  "topzi/data/traducoes-titulos.js",
  "topzi/data/traducoes-itens-1.js",
  "topzi/data/traducoes-itens-2.js",
  "topzi/data/traducoes-itens-3.js",
  "topzi/data/traducoes-itens-4.js",
  "topzi/data/traducoes-itens-5.js",
  "topzi/data/traducoes-itens-6.js",
  "topzi/data/traducoes-itens-7.js",
  "topzi/data/traducoes-itens-8.js",
  "topzi/data/traducoes-itens-9.js",
  "topzi/data/traducoes-itens-10.js",
  "topzi/js/icons.js",
  "topzi/js/avatars.js",
  "topzi/js/util.js",
  "topzi/js/i18n.js",
  "topzi/js/textos.js",
  "topzi/js/match.js",
  "topzi/js/efeitos.js",
  "topzi/js/listas.js",
  "topzi/js/modos.js",
  "topzi/js/jogadores.js",
  "topzi/js/skins.js",
  "topzi/js/partida.js",
  "topzi/js/resultado.js",
  "topzi/js/estatisticas.js",
  "topzi/js/diaria.js",
  "topzi/js/config.js",
  "topzi/js/online.js",
  "topzi/js/app.js",
  "brand/logo.svg",
  "brand/logo-dark.svg",
  "brand/simbolo.svg",
  "brand/simbolo-escuro.svg",
  "brand/favicon.svg",
  "brand/favicon-32.png",
  "brand/icon-192.png",
  "brand/gamezi-logo.svg",
  "brand/gamezi-logo-dark.svg",
  "patozi/",
  "patozi/index.html",
  "patozi/style.css",
  "patozi/data/temas.js",
  "patozi/data/aposentadas.js",
  "patozi/data/cartas-1.js",
  "patozi/data/cartas-2.js",
  "patozi/data/cartas-3.js",
  "patozi/data/cartas-4.js",
  "patozi/data/cartas-5.js",
  "patozi/js/jogo.js",
  "patozi/js/textos.js",
  "patozi/js/visual.js",
  "patozi/js/conta.js",
  "patozi/js/diario.js",
  "patozi/js/guarda-roupa.js",
  "patozi/js/partida.js",
  "patozi/js/online.js",
  "patozi/js/app.js",
  "brand/patozi-logo.svg",
  "brand/patozi-logo-dark.svg",
  "brand/patozi-simbolo.svg",
  "brand/patozi-simbolo-escuro.svg",
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
        if (req.mode !== "navigate") return Response.error();
        const jogo = ["topzi", "patozi"].find((j) => url.pathname.includes(`/${j}/`));
        return caches.match(jogo ? `${jogo}/index.html` : "index.html");
      })),
  );
});
