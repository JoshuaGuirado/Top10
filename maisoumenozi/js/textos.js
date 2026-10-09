// Textos do Maisoumenozi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma, o tema e o som são os mesmos do Gamezi (tt:lang, tt:theme, tt:sound); o resto fica em mm:…

const LANGS = ["pt", "en", "es"];
const MM_COMPARTILHADO = ["lang", "theme", "sound"];

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
  "res.shareClock": ["Fiz {n} pontos em 60 segundos no Maisoumenozi. Você bate? {url}", "I scored {n} points in 60 seconds on Maisoumenozi. Can you beat it? {url}", "Hice {n} puntos en 60 segundos en Maisoumenozi. ¿Me superas? {url}"],
  "res.clockSub": ["{a} acertos de {b} · maior combo ×{c}", "{a} right out of {b} · best combo ×{c}", "{a} aciertos de {b} · mejor combo ×{c}"],
  "res.clock": ["{n} pontos", "{n} points", "{n} puntos"],
  "game.timeUp": ["Tempo!", "Time's up!", "¡Tiempo!"],
  "game.penalty": ["−3 s", "−3 s", "−3 s"],
  "game.pts": ["{n} pts", "{n} pts", "{n} pts"],
  "game.uau": ["Comparação maluca", "Wild comparison", "Comparación loca"],
  "game.clock": ["Contra o relógio", "Beat the clock", "Contra el reloj"],
  "nav.soundOff": ["Som desligado", "Sound off", "Sonido desactivado"],
  "nav.soundOn": ["Som ligado", "Sound on", "Sonido activado"],
  "nav.sound": ["Som", "Sound", "Sonido"],
  "home.clockSubNew": ["60 segundos. Acertos seguidos multiplicam os pontos.", "60 seconds. Answers in a row multiply your points.", "60 segundos. Los aciertos seguidos multiplican los puntos."],
  "home.clockSub": ["60 segundos. Acertos seguidos multiplicam os pontos. Recorde: {n}", "60 seconds. Answers in a row multiply your points. Best: {n}", "60 segundos. Los aciertos seguidos multiplican los puntos. Récord: {n}"],
  "home.clock": ["Contra o relógio", "Beat the clock", "Contra el reloj"],
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
  "home.tag": ["Tem mais ou tem menos? Responda rápido.", "More or less? Answer fast.", "¿Más o menos? Responde rápido."],
  "home.free": ["Sem errar", "No mistakes", "Sin fallar"],
  "home.freeSub": ["Até errar a primeira. Recorde: {n}", "Until your first miss. Best: {n}", "Hasta el primer error. Récord: {n}"],
  "home.freeSubNew": ["Até errar a primeira", "Until your first miss", "Hasta el primer error"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<p>Duas coisas, um número escondido: <b>tem mais ou tem menos?</b></p><ol class=\"help-steps\"><li>Em cima vem um item com o número. Embaixo, outro com o número escondido. Diga se o de baixo tem <b>mais</b> ou <b>menos</b> (ou é mais alto, mais pesado, mais rápido…).</li><li>Os assuntos se misturam: o Monte Fuji contra o Burj Khalifa, a Lagoa dos Patos contra um país. Olhe a unidade!</li><li>Às vezes cai uma <b>comparação maluca</b>: os dois números escondidos (uma baleia ou 30 elefantes?). Toque no que tem mais. Depois vem uma curiosidade.</li></ol><p><b>Contra o relógio:</b> 60 segundos. Cada acerto vale 10 pontos (20 na maluca) e acertos seguidos multiplicam: ×2 a partir do 3º, ×3 do 6º, até ×5. Errar zera o combo e tira 3 segundos.</p><p><b>Desafio do dia:</b> as mesmas 10 comparações para todo mundo. <b>Sem errar:</b> até o primeiro erro.</p>",
    "<p>Two things, one hidden number: <b>more or less?</b></p><ol class=\"help-steps\"><li>On top, an item with its number. Below, another with the number hidden. Say whether the one below has <b>more</b> or <b>less</b> (or is taller, heavier, faster…).</li><li>Topics get mixed: Mount Fuji against the Burj Khalifa, a lake against a country. Mind the units!</li><li>Sometimes a <b>wild comparison</b> shows up: both numbers hidden (one whale or 30 elephants?). Tap the bigger one. Then you get a fun fact.</li></ol><p><b>Beat the clock:</b> 60 seconds. Each right answer is worth 10 points (20 for wild ones) and streaks multiply: ×2 from the 3rd, ×3 from the 6th, up to ×5. A miss resets the combo and costs 3 seconds.</p><p><b>Daily challenge:</b> the same 10 comparisons for everyone. <b>No mistakes:</b> until your first miss.</p>",
    "<p>Dos cosas, un número escondido: <b>¿más o menos?</b></p><ol class=\"help-steps\"><li>Arriba, un ítem con su número. Abajo, otro con el número escondido. Di si el de abajo tiene <b>más</b> o <b>menos</b> (o es más alto, más pesado, más rápido…).</li><li>Los temas se mezclan: el monte Fuji contra el Burj Khalifa, un lago contra un país. ¡Ojo con la unidad!</li><li>A veces aparece una <b>comparación loca</b>: los dos números escondidos (¿una ballena o 30 elefantes?). Toca el que tiene más. Después viene una curiosidad.</li></ol><p><b>Contra el reloj:</b> 60 segundos. Cada acierto vale 10 puntos (20 en la loca) y las rachas multiplican: ×2 desde el 3.º, ×3 desde el 6.º, hasta ×5. Fallar reinicia el combo y quita 3 segundos.</p><p><b>Desafío del día:</b> las mismas 10 comparaciones para todos. <b>Sin fallar:</b> hasta el primer error.</p>",
  ],
  "daily.name": ["Desafio do dia", "Daily challenge", "Desafío del día"],
  "daily.kicker": ["Maisoumenozi do dia #{n}", "Daily Maisoumenozi #{n}", "Maisoumenozi del día #{n}"],
  "daily.done": ["{a} de {b} certas", "{a} of {b} right", "{a} de {b} correctas"],
  "game.free": ["Sem errar", "No mistakes", "Sin fallar"],
  "game.streak": ["{n} seguidas", "{n} in a row", "{n} seguidas"],
  "game.streak1": ["1 seguida", "1 in a row", "1 seguida"],
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
