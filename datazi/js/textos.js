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
  "btn.back": ["Voltar", "Back", "Volver"],
  "btn.start": ["Começar", "Start", "Empezar"],
  "copied": ["Copiado!", "Copied!", "¡Copiado!"],
  "home.tag": ["Coloque os acontecimentos na ordem em que aconteceram.", "Put the events in the order they happened.", "Pon los acontecimientos en el orden en que ocurrieron."],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["Até errar 2 vezes. Recorde: {n}", "Until you miss twice. Best: {n}", "Hasta fallar 2 veces. Récord: {n}"],
  "home.freeSubNew": ["Até errar 2 vezes", "Until you miss twice", "Hasta fallar 2 veces"],
  "home.anoSub": ["10 rodadas, até 10 pontos cada. Recorde: {n}", "10 rounds, up to 10 points each. Best: {n}", "10 rondas, hasta 10 puntos cada una. Récord: {n}"],
  "home.anoSubNew": ["10 rodadas, até 10 pontos cada", "10 rounds, up to 10 points each", "10 rondas, hasta 10 puntos cada una"],
  "home.online": ["Online", "Online", "Online"],
  "home.onlineSub": ["Cada um no seu celular, todo mundo joga a mesma rodada", "Everyone on their own phone, all playing the same round", "Cada uno en su celular, todos juegan la misma ronda"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "modo.linha": ["Linha do tempo", "Timeline", "Línea del tiempo"],
  "modo.antes": ["Qual veio antes?", "Which came first?", "¿Cuál fue antes?"],
  "modo.ano": ["Em que ano?", "What year?", "¿En qué año?"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<h3>Linha do tempo</h3><ol class=\"help-steps\"><li>A linha do tempo começa com um acontecimento e o ano dele.</li><li>Aparece outro acontecimento: toque no lugar da linha onde ele entra (antes, entre ou depois).</li><li>Acertou, ganha um ponto e o ano aparece. Errou, perde uma vida, e ele vai para o lugar certo.</li><li>Com 2 erros, acaba.</li></ol><p><b>Datazi do dia:</b> os mesmos 8 acontecimentos para todo mundo, todo dia. <b>Partida livre:</b> vá o mais longe que conseguir.</p><h3>Qual veio antes?</h3><p>Aparecem dois acontecimentos: toque no que aconteceu primeiro. Com 2 erros, acaba.</p><h3>Em que ano?</h3><p>Digite o ano do acontecimento. Em cheio vale 10; errou por até 2 anos, 7; até 5, 5; até 10, 3; até 25, 1. São 10 rodadas.</p><h3>Online</h3><p>Cada um no seu celular, todo mundo joga a mesma rodada (30 segundos). Na linha do tempo e no Qual veio antes?, quem acerta leva 1 ponto; no Em que ano?, cada um leva os pontos do próprio chute.</p>",
    "<h3>Timeline</h3><ol class=\"help-steps\"><li>The timeline starts with one event and its year.</li><li>A new event shows up: tap where it goes on the line (before, between or after).</li><li>Right: one point, and the year shows up. Wrong: you lose a life, and it moves to the right spot.</li><li>Two misses and it's over.</li></ol><p><b>Daily Datazi:</b> the same 8 events for everyone, every day. <b>Free play:</b> go as far as you can.</p><h3>Which came first?</h3><p>Two events show up: tap the one that happened first. Two misses and it's over.</p><h3>What year?</h3><p>Type the year of the event. Spot on is worth 10; off by up to 2 years, 7; up to 5, 5; up to 10, 3; up to 25, 1. There are 10 rounds.</p><h3>Online</h3><p>Everyone on their own phone, all playing the same round (30 seconds). In Timeline and Which came first?, getting it right is worth 1 point; in What year?, everyone gets the points of their own guess.</p>",
    "<h3>Línea del tiempo</h3><ol class=\"help-steps\"><li>La línea del tiempo empieza con un acontecimiento y su año.</li><li>Aparece otro: toca el lugar de la línea donde va (antes, entre o después).</li><li>Si aciertas, ganas un punto y aparece el año. Si fallas, pierdes una vida y va al lugar correcto.</li><li>Con 2 errores, se acaba.</li></ol><p><b>Datazi del día:</b> los mismos 8 acontecimientos para todos, cada día. <b>Partida libre:</b> llega lo más lejos que puedas.</p><h3>¿Cuál fue antes?</h3><p>Aparecen dos acontecimientos: toca el que pasó primero. Con 2 errores, se acaba.</p><h3>¿En qué año?</h3><p>Escribe el año del acontecimiento. Exacto vale 10; si fallas por hasta 2 años, 7; hasta 5, 5; hasta 10, 3; hasta 25, 1. Son 10 rondas.</p><h3>Online</h3><p>Cada uno en su celular, todos juegan la misma ronda (30 segundos). En Línea del tiempo y ¿Cuál fue antes?, quien acierta gana 1 punto; en ¿En qué año?, cada uno gana los puntos de su respuesta.</p>",
  ],
  "daily.name": ["Datazi do dia", "Daily Datazi", "Datazi del día"],
  "daily.kicker": ["Datazi do dia #{n}", "Daily Datazi #{n}", "Datazi del día #{n}"],
  "daily.done": ["{a} de {b} na ordem certa", "{a} of {b} in the right order", "{a} de {b} en el orden correcto"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.lives": ["{n} vidas", "{n} lives", "{n} vidas"],
  "game.lives1": ["1 vida", "1 life", "1 vida"],
  "game.score": ["{n} acertos", "{n} right", "{n} aciertos"],
  "game.score1": ["1 acerto", "1 right", "1 acierto"],
  "game.where": ["Onde entra na linha do tempo?", "Where does it go on the timeline?", "¿Dónde va en la línea del tiempo?"],
  "game.before": ["Antes de {a}", "Before {a}", "Antes de {a}"],
  "game.between": ["Entre {a} e {b}", "Between {a} and {b}", "Entre {a} y {b}"],
  "game.after": ["Depois de {a}", "After {a}", "Después de {a}"],
  "game.right": ["Certo! Foi em {ano}.", "Right! It was in {ano}.", "¡Correcto! Fue en {ano}."],
  "game.wrong": ["Errou: foi em {ano}.", "Wrong: it was in {ano}.", "Fallaste: fue en {ano}."],
  "game.next": ["Próximo", "Next", "Siguiente"],
  "game.online": ["Online", "Online", "Online"],
  "game.quit": ["Sair", "Leave", "Salir"],
  "game.round": ["Rodada {a}/{b}", "Round {a}/{b}", "Ronda {a}/{b}"],
  "game.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "game.pts1": ["1 ponto", "1 point", "1 punto"],
  "game.which": ["Qual veio antes? Toque nele.", "Which came first? Tap it.", "¿Cuál fue antes? Tócalo."],
  "game.firstRight": ["Certo! Esse veio antes.", "Right! That one came first.", "¡Correcto! Ese fue antes."],
  "game.firstWrong": ["Errou: o outro veio antes.", "Wrong: the other one came first.", "Fallaste: el otro fue antes."],
  "game.year": ["Em que ano foi?", "What year was it?", "¿En qué año fue?"],
  "game.yearPh": ["Ano", "Year", "Año"],
  "game.guess": ["Chutar", "Guess", "Adivinar"],
  "game.yearBad": ["Digite um ano", "Type a year", "Escribe un año"],
  "game.yearRes": ["Foi em {ano}. Você chutou {v}: +{p}", "It was {ano}. You guessed {v}: +{p}", "Fue en {ano}. Dijiste {v}: +{p}"],
  "game.yearMissed": ["Foi em {ano}.", "It was {ano}.", "Fue en {ano}."],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "res.title": ["{a} de {b}", "{a} of {b}", "{a} de {b}"],
  "res.free": ["{n} na ordem certa", "{n} in the right order", "{n} en el orden correcto"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.sub": ["Sequência: {n} dia(s) seguidos", "Streak: {n} day(s) in a row", "Racha: {n} día(s) seguidos"],
  "res.timeline": ["A linha do tempo", "The timeline", "La línea del tiempo"],
  "res.rounds": ["As rodadas", "The rounds", "Las rondas"],
  "res.antes": ["{n} acertos", "{n} right", "{n} aciertos"],
  "res.antes1": ["1 acerto", "1 right", "1 acierto"],
  "res.guess": ["Seu chute: {v}", "Your guess: {v}", "Tu respuesta: {v}"],
  "res.ano": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.of100": ["de 100", "of 100", "de 100"],
  "res.won": ["{nome} venceu!", "{nome} wins!", "¡{nome} ganó!"],
  "res.tie": ["Empate!", "It's a tie!", "¡Empate!"],
  "res.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.pts1": ["1 ponto", "1 point", "1 punto"],
  "res.backRoom": ["Voltar para a sala", "Back to the room", "Volver a la sala"],
  "on.title": ["Jogar online", "Play online", "Jugar online"],
  "on.sub": ["Cada um no seu celular. Todo mundo joga a mesma rodada e quem acerta pontua.", "Everyone on their own phone. All play the same round, and getting it right scores.", "Cada uno en su celular. Todos juegan la misma ronda y quien acierta suma."],
  "on.nick": ["Seu nome", "Your name", "Tu nombre"],
  "on.nickPh": ["Como te chamam?", "What do people call you?", "¿Cómo te llaman?"],
  "on.create": ["Criar sala", "Create room", "Crear sala"],
  "on.createSub": ["Você escolhe o modo de jogo e começa quando a turma chegar.", "You pick the game mode and start when everyone's in.", "Eliges el modo de juego y empiezas cuando lleguen todos."],
  "on.join": ["Entrar numa sala", "Join a room", "Entrar en una sala"],
  "on.joinBtn": ["Entrar", "Join", "Entrar"],
  "on.code": ["Código da sala", "Room code", "Código de la sala"],
  "on.wait": ["Aguarde…", "Wait…", "Espera…"],
  "on.errSetup": ["O modo online ainda não está configurado.", "Online mode isn't set up yet.", "El modo online aún no está configurado."],
  "on.errNick": ["Digite seu nome", "Type your name", "Escribe tu nombre"],
  "on.errCode": ["O código tem 5 letras", "The code has 5 characters", "El código tiene 5 letras"],
  "on.errNoRoom": ["Sala não encontrada", "Room not found", "Sala no encontrada"],
  "on.errPlaying": ["A partida dessa sala já começou", "That room's game has already started", "La partida de esa sala ya empezó"],
  "on.errFull": ["A sala está cheia (máx. 10)", "The room is full (max 10)", "La sala está llena (máx. 10)"],
  "on.errNet": ["Sem conexão. Tente de novo.", "No connection. Try again.", "Sin conexión. Inténtalo de nuevo."],
  "on.errDb": ["O banco do Datazi online ainda não foi criado (falta rodar supabase/schema.sql).", "The Datazi online database isn't set up yet (run supabase/schema.sql).", "La base de Datazi online aún no está creada (falta ejecutar supabase/schema.sql)."],
  "on.closed": ["A sala foi fechada", "The room was closed", "La sala se cerró"],
  "on.kicked": ["Você não está mais na sala", "You're no longer in the room", "Ya no estás en la sala"],
  "on.quit": ["Sair da partida online?", "Leave the online game?", "¿Salir de la partida online?"],
  "on.sent": ["Resposta enviada! Esperando os outros…", "Answer sent! Waiting for the others…", "¡Respuesta enviada! Esperando a los demás…"],
  "on.answered": ["respondeu", "answered", "respondió"],
  "on.thinking": ["pensando…", "thinking…", "pensando…"],
  "on.missed": ["não respondeu", "didn't answer", "no respondió"],
  "on.right": ["acertou", "right", "acertó"],
  "on.wrong": ["errou", "wrong", "falló"],
  "on.waitHost": ["Esperando o anfitrião seguir…", "Waiting for the host…", "Esperando al anfitrión…"],
  "lobby.share": ["Convidar", "Invite", "Invitar"],
  "lobby.shareText": ["Bora jogar Datazi comigo? Entre na sala: {url}", "Play Datazi with me! Join the room: {url}", "¿Jugamos Datazi? Entra en la sala: {url}"],
  "lobby.players": ["Na sala", "In the room", "En la sala"],
  "lobby.mode": ["Modo de jogo", "Game mode", "Modo de juego"],
  "lobby.host": ["anfitrião", "host", "anfitrión"],
  "lobby.you": ["você", "you", "tú"],
  "lobby.kick": ["Tirar da sala", "Remove from room", "Sacar de la sala"],
  "lobby.leave": ["Sair da sala", "Leave room", "Salir de la sala"],
  "lobby.needTwo": ["Precisa de pelo menos 2 jogadores. Mande o código!", "You need at least 2 players. Share the code!", "Se necesitan al menos 2 jugadores. ¡Comparte el código!"],
  "lobby.ready": ["Todo mundo chegou? Pode começar.", "Everyone here? You can start.", "¿Llegaron todos? Puedes empezar."],
  "lobby.waitHost": ["Esperando {nome} começar…", "Waiting for {nome} to start…", "Esperando a que {nome} empiece…"],
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
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}
