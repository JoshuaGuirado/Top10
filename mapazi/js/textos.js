// Textos do Mapazi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma e o tema são os mesmos do Gamezi (tt:lang, tt:theme); o resto fica em mp:…

const LANGS = ["pt", "en", "es"];
const MP_COMPARTILHADO = ["lang", "theme"];

function store(key, value) {
  const k = (MP_COMPARTILHADO.includes(key) ? "tt:" : "mp:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = store("lang");
if (!LANGS.includes(lang)) lang = LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";

const MP_T = {
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
  "home.tag": ["Qual o tamanho de verdade de cada país? Ajuste e descubra.", "How big is each country, really? Resize it and find out.", "¿Qué tamaño tiene de verdad cada país? Ajústalo y descúbrelo."],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["10 rodadas com países sorteados. Recorde: {n}", "10 rounds with random countries. Best: {n}", "10 rondas con países al azar. Récord: {n}"],
  "home.freeSubNew": ["10 rodadas com países sorteados", "10 rounds with random countries", "10 rondas con países al azar"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>Aparece um país no tamanho certo (cinza) e outro país do lado (vermelho), num tamanho errado.</li><li>Arraste a barra para aumentar ou diminuir o vermelho até ele ficar do tamanho certo perto do cinza.</li><li>Confirme: aparece o tamanho real (contorno verde) e quanto você errou.</li><li>Em cheio vale 100 pontos. Cada vez que a área erra pelo dobro (ou pela metade), perde 50.</li></ol><p><b>Mapazi do dia:</b> as mesmas 10 rodadas para todo mundo, com ranking. <b>Partida livre:</b> países sorteados.</p><p class=\"muted small\">Mapas: Natural Earth. Cada país é desenhado numa projeção que mantém a área, então o tamanho é o de verdade (sem a distorção dos mapas comuns).</p>",
    "<ol class=\"help-steps\"><li>One country shows up at its real size (gray) and another one next to it (red), at the wrong size.</li><li>Drag the bar to make the red one bigger or smaller until it's the right size next to the gray one.</li><li>Confirm: the real size shows up (green outline) along with how far off you were.</li><li>Spot on is worth 100 points. Every time the area is off by double (or half), you lose 50.</li></ol><p><b>Daily Mapazi:</b> the same 10 rounds for everyone, with a ranking. <b>Free play:</b> random countries.</p><p class=\"muted small\">Maps: Natural Earth. Each country is drawn in an equal-area projection, so its size is the real one (without the distortion of regular maps).</p>",
    "<ol class=\"help-steps\"><li>Aparece un país en su tamaño real (gris) y otro al lado (rojo), en un tamaño equivocado.</li><li>Arrastra la barra para agrandar o achicar el rojo hasta que tenga el tamaño correcto junto al gris.</li><li>Confirma: aparece el tamaño real (contorno verde) y cuánto te equivocaste.</li><li>Exacto vale 100 puntos. Cada vez que el área se equivoca por el doble (o la mitad), pierdes 50.</li></ol><p><b>Mapazi del día:</b> las mismas 10 rondas para todos, con ranking. <b>Partida libre:</b> países al azar.</p><p class=\"muted small\">Mapas: Natural Earth. Cada país se dibuja en una proyección que conserva el área, así que el tamaño es el real (sin la distorsión de los mapas comunes).</p>",
  ],
  "daily.name": ["Mapazi do dia", "Daily Mapazi", "Mapazi del día"],
  "daily.kicker": ["Mapazi do dia #{n}", "Daily Mapazi #{n}", "Mapazi del día #{n}"],
  "daily.done": ["{n} de 1.000 pontos", "{n} of 1,000 points", "{n} de 1.000 puntos"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.round": ["Rodada {a} de {b}", "Round {a} of {b}", "Ronda {a} de {b}"],
  "game.pts": ["{n} pts", "{n} pts", "{n} pts"],
  "game.ask": ["Deixe o país vermelho do tamanho de verdade.", "Make the red country its real size.", "Deja el país rojo de su tamaño real."],
  "game.ref": ["tamanho certo", "real size", "tamaño real"],
  "game.yours": ["você ajusta", "you resize", "tú ajustas"],
  "game.smaller": ["Diminuir", "Smaller", "Achicar"],
  "game.bigger": ["Aumentar", "Bigger", "Agrandar"],
  "game.size": ["Tamanho", "Size", "Tamaño"],
  "game.confirm": ["Confirmar", "Confirm", "Confirmar"],
  "game.real": ["tamanho real", "real size", "tamaño real"],
  "game.guess": ["seu chute", "your guess", "tu intento"],
  "game.bigBy": ["Ficou {n} vezes maior que o real", "It was {n} times too big", "Quedó {n} veces más grande que el real"],
  "game.smallBy": ["Ficou {n} vezes menor que o real", "It was {n} times too small", "Quedó {n} veces más chico que el real"],
  "game.exact": ["Em cheio!", "Spot on!", "¡Exacto!"],
  "game.got": ["+{n} pontos", "+{n} points", "+{n} puntos"],
  "game.next": ["Próximo", "Next", "Siguiente"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "km.mi": ["{n} milhões de km²", "{n} million km²", "{n} millones de km²"],
  "km.mil": ["{n} mil km²", "{n} thousand km²", "{n} mil km²"],
  "km.n": ["{n} km²", "{n} km²", "{n} km²"],
  "res.title": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.of": ["de 1.000", "of 1,000", "de 1.000"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.sub": ["Sequência: {n} dia(s) seguidos", "Streak: {n} day(s) in a row", "Racha: {n} día(s) seguidos"],
  "res.rounds": ["As rodadas", "The rounds", "Las rondas"],
  "res.shareText": ["Mapazi · dia #{n}: {p}/1000\n{linha}\n{url}", "Mapazi · day #{n}: {p}/1000\n{linha}\n{url}", "Mapazi · día #{n}: {p}/1000\n{linha}\n{url}"],
};

function t(key, vars = {}) {
  const e = MP_T[key];
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

// Número no jeito do idioma (1.000 / 1,000), com até "casas" decimais.
function num(n, casas = 0) {
  return Number(n).toLocaleString({ pt: "pt-BR", en: "en-US", es: "es-ES" }[lang], { maximumFractionDigits: casas });
}

// Área para ler: "8,5 milhões de km²", "238 mil km²", "9.182 km²".
function km2(n) {
  if (n >= 1e6) return t("km.mi", { n: num(n / 1e6, 1) });
  if (n >= 1e5) return t("km.mil", { n: num(Math.round(n / 1e3)) });
  return t("km.n", { n: num(Math.round(n / 100) * 100) });
}

function applyI18n(root = document) {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}
