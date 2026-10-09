// Textos do Maisoumenozi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma e o tema são os mesmos do Gamezi (tt:lang, tt:theme); o resto fica em mm:…

const LANGS = ["pt", "en", "es"];
const MM_COMPARTILHADO = ["lang", "theme"];

function store(key, value) {
  const k = (MM_COMPARTILHADO.includes(key) ? "tt:" : "mm:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = store("lang");
if (!LANGS.includes(lang)) lang = LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";

const MM_T = {
  "nav.back": ["Voltar para o Gamezi", "Back to Gamezi", "Volver a Gamezi"],
  "nav.home": ["Início", "Home", "Inicio"],
  "nav.settings": ["Configurações", "Settings", "Ajustes"],
  "nav.lang": ["Idioma", "Language", "Idioma"],
  "nav.theme": ["Tema", "Theme", "Tema"],
  "nav.dark": ["Usar modo escuro", "Switch to dark mode", "Usar modo oscuro"],
  "nav.light": ["Usar modo claro", "Switch to light mode", "Usar modo claro"],
  "btn.play": ["Jogar", "Play", "Jugar"],
  "btn.close": ["Fechar", "Close", "Cerrar"],
  "btn.share": ["Compartilhar", "Share", "Compartir"],
  "btn.again": ["Jogar de novo", "Play again", "Jugar de nuevo"],
  "btn.home": ["Início", "Home", "Inicio"],
  "copied": ["Copiado!", "Copied!", "¡Copiado!"],
  "home.tag": ["Tem mais ou tem menos? Compare números do mundo todo, um atrás do outro.", "Is it more or less? Compare numbers from all over the world, one after another.", "¿Hay más o hay menos? Compara números de todo el mundo, uno tras otro."],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["Até errar a primeira. Recorde: {n}", "Until your first miss. Best: {n}", "Hasta el primer error. Récord: {n}"],
  "home.freeSubNew": ["Até errar a primeira", "Until your first miss", "Hasta el primer error"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "home.count": ["{t} assuntos · {n} comparações diferentes", "{t} topics · {n} different comparisons", "{t} temas · {n} comparaciones distintas"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>Em cima aparece um item com o número dele (por exemplo, quantos habitantes tem um país).</li><li>Embaixo, outro item do mesmo assunto, com o número escondido.</li><li>Responda: o de baixo tem <b>mais</b> ou <b>menos</b>? (às vezes é mais alto, mais pesado, mais rápido…)</li><li>Acertou? O de baixo sobe e chega um novo. De tempos em tempos, o assunto muda.</li></ol><p><b>Desafio do dia:</b> as mesmas 10 comparações para todo mundo, todo dia. <b>Partida livre:</b> vai até o primeiro erro. Quantas você acerta seguidas?</p>",
    "<ol class=\"help-steps\"><li>At the top there's an item with its number (for example, how many people live in a country).</li><li>Below, another item on the same topic, with its number hidden.</li><li>Answer: does the one below have <b>more</b> or <b>less</b>? (sometimes it's taller, heavier, faster…)</li><li>Right? The bottom one moves up and a new one arrives. Every so often, the topic changes.</li></ol><p><b>Daily challenge:</b> the same 10 comparisons for everyone, every day. <b>Free play:</b> goes until your first miss. How many in a row can you get?</p>",
    "<ol class=\"help-steps\"><li>Arriba aparece un ítem con su número (por ejemplo, cuántos habitantes tiene un país).</li><li>Abajo, otro ítem del mismo tema, con el número escondido.</li><li>Responde: ¿el de abajo tiene <b>más</b> o <b>menos</b>? (a veces es más alto, más pesado, más rápido…)</li><li>¿Acertaste? El de abajo sube y llega uno nuevo. Cada tanto, el tema cambia.</li></ol><p><b>Desafío del día:</b> las mismas 10 comparaciones para todos, cada día. <b>Partida libre:</b> hasta el primer error. ¿Cuántas aciertas seguidas?</p>",
  ],
  "daily.name": ["Desafio do dia", "Daily challenge", "Desafío del día"],
  "daily.kicker": ["Maisoumenozi do dia #{n}", "Daily Maisoumenozi #{n}", "Maisoumenozi del día #{n}"],
  "daily.done": ["{a} de {b} certas", "{a} of {b} right", "{a} de {b} correctas"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.round": ["{i} de {n}", "{i} of {n}", "{i} de {n}"],
  "game.streak": ["{n} seguidas", "{n} in a row", "{n} seguidas"],
  "game.streak1": ["1 seguida", "1 in a row", "1 seguida"],
  "game.newTopic": ["Assunto novo", "New topic", "Tema nuevo"],
  "game.hidden": ["?", "?", "?"],
  "game.next": ["Próxima", "Next", "Siguiente"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "res.title": ["{a} de {b}", "{a} of {b}", "{a} de {b}"],
  "res.free": ["{n} seguidas", "{n} in a row", "{n} seguidas"],
  "res.free1": ["1 seguida", "1 in a row", "1 seguida"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.sub": ["{n} dias seguidos", "{n} days in a row", "{n} días seguidos"],
  "res.list": ["As comparações", "The comparisons", "Las comparaciones"],
  "res.shareText": ["Maisoumenozi · dia #{n}: {a}/{b}\n{linha}\n{url}", "Maisoumenozi · day #{n}: {a}/{b}\n{linha}\n{url}", "Maisoumenozi · día #{n}: {a}/{b}\n{linha}\n{url}"],
  "res.shareFree": ["Fiz {n} seguidas no Maisoumenozi. Você bate? {url}", "I got {n} in a row on Maisoumenozi. Can you beat it? {url}", "Hice {n} seguidas en Maisoumenozi. ¿Me superas? {url}"],
};

// Frases de acerto e de erro: sorteadas a cada rodada, para não ficar repetindo.
const MM_CERTO = [
  ["Isso!", "Yes!", "¡Eso!"],
  ["Acertou!", "Correct!", "¡Acertaste!"],
  ["Boa!", "Nice!", "¡Bien!"],
  ["Mandou bem!", "Well done!", "¡Muy bien!"],
  ["Na mosca!", "Spot on!", "¡En el blanco!"],
  ["É isso aí!", "That's it!", "¡Así es!"],
  ["Certinho!", "Exactly right!", "¡Exacto!"],
  ["Sabe tudo!", "You know it all!", "¡Lo sabes todo!"],
  ["Mais uma!", "One more!", "¡Una más!"],
  ["Tá voando!", "You're on fire!", "¡Vas volando!"],
  ["Nem precisou pensar, né?", "Didn't even have to think, huh?", "Ni tuviste que pensar, ¿no?"],
  ["Olha o professor!", "Look at the professor!", "¡Mira al profesor!"],
];
const MM_ERRADO = [
  ["Ih, errou!", "Oops, wrong!", "¡Uy, fallaste!"],
  ["Não foi dessa vez.", "Not this time.", "No fue esta vez."],
  ["Quase!", "So close!", "¡Casi!"],
  ["Que pena!", "Too bad!", "¡Qué pena!"],
  ["Essa enganou!", "That one was tricky!", "¡Esa engañaba!"],
  ["Pegadinha, né?", "Sneaky one, right?", "Tramposa, ¿no?"],
  ["Ninguém imaginava!", "Nobody saw that coming!", "¡Nadie lo imaginaba!"],
  ["Agora você sabe!", "Now you know!", "¡Ahora ya lo sabes!"],
];
// Comentário sobre a diferença entre os dois números (depois de revelar).
const MM_DIFERENCA = {
  quase: ["Por pouco: quase empatados.", "Close call: almost a tie.", "Por poco: casi empatados."],
  dobro: ["Mais que o dobro!", "More than double!", "¡Más del doble!"],
  dez: ["Mais de 10 vezes!", "More than 10 times!", "¡Más de 10 veces!"],
  cem: ["Mais de 100 vezes!", "More than 100 times!", "¡Más de 100 veces!"],
};

function t(key, vars = {}) {
  const e = MM_T[key];
  let s = e ? e[LANGS.indexOf(lang)] || e[0] : key;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

function tr(arr) {
  return arr[LANGS.indexOf(lang)] || arr[0];
}

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Número no jeito de cada idioma (1.234,5 · 1,234.5).
function fmt(n) {
  const loc = { pt: "pt-BR", en: "en-US", es: "es-ES" }[lang];
  return new Intl.NumberFormat(loc, { maximumFractionDigits: n < 10 ? 2 : n < 100 ? 1 : 0, useGrouping: n >= 10000 || lang !== "es" }).format(n);
}

function applyI18n(root = document) {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}
