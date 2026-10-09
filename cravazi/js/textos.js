// Textos do Cravazi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma e o tema são os mesmos do Gamezi (tt:lang, tt:theme); o resto fica em cz:…

const LANGS = ["pt", "en", "es"];
const CZ_COMPARTILHADO = ["lang", "theme"];

function store(key, value) {
  const k = (CZ_COMPARTILHADO.includes(key) ? "tt:" : "cz:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = store("lang");
if (!LANGS.includes(lang)) lang = LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";

const CZ_T = {
  "nav.back": ["Voltar para o Gamezi", "Back to Gamezi", "Volver a Gamezi"],
  "nav.home": ["Início", "Home", "Inicio"],
  "nav.settings": ["Configurações", "Settings", "Ajustes"],
  "nav.lang": ["Idioma", "Language", "Idioma"],
  "nav.theme": ["Tema", "Theme", "Tema"],
  "nav.dark": ["Usar modo escuro", "Switch to dark mode", "Usar modo oscuro"],
  "nav.light": ["Usar modo claro", "Switch to light mode", "Usar modo claro"],
  "btn.close": ["Fechar", "Close", "Cerrar"],
  "btn.start": ["Começar", "Start", "Empezar"],
  "btn.again": ["Jogar de novo", "Play again", "Jugar de nuevo"],
  "btn.home": ["Início", "Home", "Inicio"],
  "btn.guess": ["Chutar", "Guess", "Probar"],
  "home.tag": ["Todo mundo chuta um número. Quem cravar a resposta exata leva o ponto.", "Everyone guesses a number. Whoever nails the exact answer gets the point.", "Todos dicen un número. Quien clave la respuesta exacta se lleva el punto."],
  "home.players": ["Jogadores", "Players", "Jugadores"],
  "home.player": ["Jogador {n}", "Player {n}", "Jugador {n}"],
  "home.add": ["+ Jogador", "+ Player", "+ Jugador"],
  "home.remove": ["Tirar {nome}", "Remove {nome}", "Quitar a {nome}"],
  "home.rounds": ["Rodadas", "Rounds", "Rondas"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>Aparece uma pergunta com resposta em número.</li><li>Um de cada vez, cada jogador chuta um número.</li><li>O jogo diz se a resposta é <b>mais</b> ou <b>menos</b> que o chute, e a faixa vai fechando.</li><li>Quem <b>cravar</b> o número exato leva 1 ponto. A rodada só acaba quando alguém crava.</li></ol><p>Joguem passando o celular. Depois das rodadas, ganha quem tiver mais pontos.</p>",
    "<ol class=\"help-steps\"><li>A question shows up with a number for an answer.</li><li>One at a time, each player guesses a number.</li><li>The game says if the answer is <b>more</b> or <b>less</b> than the guess, and the range keeps closing in.</li><li>Whoever <b>nails</b> the exact number gets 1 point. The round only ends when someone nails it.</li></ol><p>Pass the phone around. After the rounds, the most points wins.</p>",
    "<ol class=\"help-steps\"><li>Aparece una pregunta cuya respuesta es un número.</li><li>Uno por vez, cada jugador dice un número.</li><li>El juego dice si la respuesta es <b>más</b> o <b>menos</b> que el número, y el rango se va cerrando.</li><li>Quien <b>clave</b> el número exacto gana 1 punto. La ronda solo termina cuando alguien lo clava.</li></ol><p>Jueguen pasándose el celular. Tras las rondas, gana quien tenga más puntos.</p>",
  ],
  "game.round": ["Rodada {a} de {b}", "Round {a} of {b}", "Ronda {a} de {b}"],
  "game.turn": ["Vez de {nome}", "{nome}'s turn", "Turno de {nome}"],
  "game.more": ["É MAIS", "IT'S MORE", "ES MÁS"],
  "game.less": ["É MENOS", "IT'S LESS", "ES MENOS"],
  "game.than": ["que {n}", "than {n}", "que {n}"],
  "game.guessed": ["{nome} chutou {n}", "{nome} guessed {n}", "{nome} dijo {n}"],
  "game.between": ["Está entre {a} e {b}", "It's between {a} and {b}", "Está entre {a} y {b}"],
  "game.above": ["É mais que {a}", "It's more than {a}", "Es más que {a}"],
  "game.out": ["Chute entre {a} e {b}", "Guess between {a} and {b}", "Prueba entre {a} y {b}"],
  "game.outAbove": ["Chute mais que {a}", "Guess more than {a}", "Prueba más que {a}"],
  "game.empty": ["Digite um número", "Type a number", "Escribe un número"],
  "game.placeholder": ["Seu chute", "Your guess", "Tu número"],
  "game.nailed": ["{nome} cravou!", "{nome} nailed it!", "¡{nome} la clavó!"],
  "game.answer": ["A resposta é {n}", "The answer is {n}", "La respuesta es {n}"],
  "game.tries": ["{n} chutes", "{n} guesses", "{n} intentos"],
  "game.tries1": ["de primeira!", "first try!", "¡a la primera!"],
  "game.next": ["Próxima rodada", "Next round", "Siguiente ronda"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "res.won": ["{nome} venceu!", "{nome} wins!", "¡{nome} ganó!"],
  "res.tie": ["Empate!", "It's a tie!", "¡Empate!"],
  "res.tieSub": ["{nomes} empataram", "{nomes} tied", "{nomes} empataron"],
  "res.and": [" e ", " and ", " y "],
  "res.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.pts1": ["1 ponto", "1 point", "1 punto"],
  "res.rounds": ["As rodadas", "The rounds", "Las rondas"],
};

function t(key, vars = {}) {
  const e = CZ_T[key];
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

// 8849 → "8.849" (pt/es) ou "8,849" (en). Ano fica sem separador (ano: true).
function num(n, ano) {
  if (ano) return String(n);
  return n.toLocaleString({ pt: "pt-BR", en: "en-US", es: "es-ES" }[lang], { useGrouping: "always" });
}

function applyI18n(root = document) {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}
