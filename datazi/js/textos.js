// Textos do Datazi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma e o tema são os mesmos do Gamezi (tt:lang, tt:theme); o resto fica em dz:…

const LANGS = ["pt", "en", "es"];
const DZ_COMPARTILHADO = ["lang", "theme"];

function store(key, value) {
  const k = (DZ_COMPARTILHADO.includes(key) ? "tt:" : "dz:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = store("lang");
if (!LANGS.includes(lang)) lang = LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";

const DZ_T = {
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
  "home.tag": ["Coloque os acontecimentos na ordem em que aconteceram.", "Put the events in the order they happened.", "Pon los acontecimientos en el orden en que ocurrieron."],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["Até errar 3 vezes. Recorde: {n}", "Until you miss 3 times. Best: {n}", "Hasta fallar 3 veces. Récord: {n}"],
  "home.freeSubNew": ["Até errar 3 vezes", "Until you miss 3 times", "Hasta fallar 3 veces"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>A linha do tempo começa com um acontecimento e o ano dele.</li><li>Aparece outro acontecimento: toque no lugar da linha onde ele entra (antes, entre ou depois).</li><li>Acertou, ganha um ponto e o ano aparece. Errou, perde uma vida, e ele vai para o lugar certo.</li><li>Com 3 erros, acaba.</li></ol><p><b>Datazi do dia:</b> os mesmos 8 acontecimentos para todo mundo, todo dia. <b>Partida livre:</b> vá o mais longe que conseguir.</p>",
    "<ol class=\"help-steps\"><li>The timeline starts with one event and its year.</li><li>A new event shows up: tap where it goes on the line (before, between or after).</li><li>Right: one point, and the year shows up. Wrong: you lose a life, and it moves to the right spot.</li><li>Three misses and it's over.</li></ol><p><b>Daily Datazi:</b> the same 8 events for everyone, every day. <b>Free play:</b> go as far as you can.</p>",
    "<ol class=\"help-steps\"><li>La línea del tiempo empieza con un acontecimiento y su año.</li><li>Aparece otro: toca el lugar de la línea donde va (antes, entre o después).</li><li>Si aciertas, ganas un punto y aparece el año. Si fallas, pierdes una vida y va al lugar correcto.</li><li>Con 3 errores, se acaba.</li></ol><p><b>Datazi del día:</b> los mismos 8 acontecimientos para todos, cada día. <b>Partida libre:</b> llega lo más lejos que puedas.</p>",
  ],
  "daily.name": ["Datazi do dia", "Daily Datazi", "Datazi del día"],
  "daily.kicker": ["Datazi do dia #{n}", "Daily Datazi #{n}", "Datazi del día #{n}"],
  "daily.done": ["{a} de {b} na ordem certa", "{a} of {b} in the right order", "{a} de {b} en el orden correcto"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.lives": ["{n} vidas", "{n} lives", "{n} vidas"],
  "game.score": ["{n} certos", "{n} right", "{n} aciertos"],
  "game.score1": ["1 certo", "1 right", "1 acierto"],
  "game.where": ["Onde entra na linha do tempo?", "Where does it go on the timeline?", "¿Dónde va en la línea del tiempo?"],
  "game.here": ["Aqui", "Here", "Aquí"],
  "game.right": ["Certo! Foi em {ano}.", "Right! It was in {ano}.", "¡Correcto! Fue en {ano}."],
  "game.wrong": ["Errou: foi em {ano}.", "Wrong: it was in {ano}.", "Fallaste: fue en {ano}."],
  "game.next": ["Próximo", "Next", "Siguiente"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "res.title": ["{a} de {b}", "{a} of {b}", "{a} de {b}"],
  "res.free": ["{n} na ordem certa", "{n} in the right order", "{n} en el orden correcto"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.sub": ["Sequência: {n} dia(s) seguidos", "Streak: {n} day(s) in a row", "Racha: {n} día(s) seguidos"],
  "res.timeline": ["A linha do tempo", "The timeline", "La línea del tiempo"],
  "res.shareText": ["Datazi · dia #{n}: {a}/{b}\n{linha}\n{url}", "Datazi · day #{n}: {a}/{b}\n{linha}\n{url}", "Datazi · día #{n}: {a}/{b}\n{linha}\n{url}"],
};

function t(key, vars = {}) {
  const e = DZ_T[key];
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

function applyI18n(root = document) {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}
