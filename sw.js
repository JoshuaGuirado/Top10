// Service worker do Gamezi (raiz do site): deixa a plataforma e os jogos instaláveis e jogáveis offline.
// Cada jogo fica numa pasta (topzi/…, patozi/…); os arquivos dele entram na lista com o caminho da pasta.
// Online, busca sempre a versão nova (rede primeiro); sem internet, usa a cópia guardada.

const CACHE = "gamezi-v19";
const FILES = [
  "./",
  "index.html",
  "gamezi.css",
  "gamezi-conta.js",
  "gamezi-ranking.js",
  "ranking.html",
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
  "topzi/data/listas-n1.js",
  "topzi/data/listas-n2.js",
  "topzi/data/listas-n3.js",
  "topzi/data/listas-n4.js",
  "topzi/data/listas-n5.js",
  "topzi/data/listas-n6.js",
  "topzi/data/listas-n7.js",
  "topzi/data/listas-n8.js",
  "topzi/data/listas-n9.js",
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
  "topzi/data/traducoes-n1.js",
  "topzi/data/traducoes-n2.js",
  "topzi/data/traducoes-n3.js",
  "topzi/data/traducoes-n4.js",
  "topzi/data/traducoes-n5.js",
  "topzi/data/traducoes-n6.js",
  "topzi/data/traducoes-n7.js",
  "topzi/data/traducoes-n8.js",
  "topzi/data/traducoes-n9.js",
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
  "topzi/js/ideias.js",
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
  "patozi/data/cartas-6.js",
  "patozi/data/cartas-7.js",
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
  "datazi/",
  "datazi/index.html",
  "datazi/style.css",
  "datazi/data/eventos.js",
  "datazi/js/jogo.js",
  "datazi/js/textos.js",
  "datazi/js/app.js",
  "brand/datazi-logo.svg",
  "brand/datazi-logo-dark.svg",
  "brand/datazi-simbolo.svg",
  "brand/datazi-simbolo-escuro.svg",
  "maisoumenozi/",
  "maisoumenozi/index.html",
  "maisoumenozi/style.css",
  "maisoumenozi/js/jogo.js",
  "maisoumenozi/data/assuntos-1.js",
  "maisoumenozi/data/assuntos-2.js",
  "maisoumenozi/data/assuntos-3.js",
  "maisoumenozi/data/grupos.js",
  "maisoumenozi/data/uau-1.js",
  "maisoumenozi/data/assuntos-4.js",
  "maisoumenozi/data/uau-2.js",
  "maisoumenozi/data/perguntas.js",
  "maisoumenozi/js/textos.js",
  "maisoumenozi/js/app.js",
  "brand/maisoumenozi-logo.svg",
  "brand/maisoumenozi-logo-dark.svg",
  "brand/maisoumenozi-simbolo.svg",
  "brand/maisoumenozi-simbolo-escuro.svg",
  "cravazi/",
  "cravazi/index.html",
  "cravazi/style.css",
  "cravazi/js/jogo.js",
  "cravazi/data/perguntas-1.js",
  "cravazi/data/perguntas-2.js",
  "cravazi/js/textos.js",
  "cravazi/js/skins.js",
  "cravazi/js/sozinho.js",
  "cravazi/js/online.js",
  "cravazi/js/app.js",
  "brand/cravazi-logo.svg",
  "brand/cravazi-logo-dark.svg",
  "brand/cravazi-simbolo.svg",
  "brand/cravazi-simbolo-escuro.svg",
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
        const jogo = ["topzi", "patozi", "datazi", "maisoumenozi", "cravazi"].find((j) => url.pathname.includes(`/${j}/`));
        return caches.match(jogo ? `${jogo}/index.html` : "index.html");
      })),
  );
});
