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
  "home.tag": ["Chute um número, descubra se é mais ou menos e crave a resposta exata.", "Guess a number, find out if it's more or less, and nail the exact answer.", "Di un número, descubre si es más o menos y clava la respuesta exacta."],
  "home.players": ["Jogadores", "Players", "Jugadores"],
  "home.player": ["Jogador {n}", "Player {n}", "Jugador {n}"],
  "home.add": ["+ Jogador", "+ Player", "+ Jugador"],
  "home.remove": ["Tirar {nome}", "Remove {nome}", "Quitar a {nome}"],
  "home.rounds": ["Rodadas", "Rounds", "Rondas"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "home.ranking": ["Ranking", "Ranking", "Ranking"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>Aparece uma pergunta com resposta em número.</li><li>Um de cada vez, cada jogador chuta um número.</li><li>O jogo diz se a resposta é <b>mais</b> ou <b>menos</b> que o chute, e a faixa vai fechando.</li><li>Quem <b>cravar</b> o número exato leva 1 ponto. A rodada só acaba quando alguém crava.</li></ol><p>Com a turma, joguem passando o celular; online, cada um no seu. Depois das rodadas, ganha quem tiver mais pontos.</p><h3>Cravazi do dia</h3><p>Sozinho, com 5 perguntas iguais para todo mundo e até 10 chutes em cada. Cravou no 1º chute: 10 pontos; no 10º: 1 ponto. O resultado entra no ranking do dia (no empate, ganha quem foi mais rápido).</p>",
    "<ol class=\"help-steps\"><li>A question shows up with a number for an answer.</li><li>One at a time, each player guesses a number.</li><li>The game says if the answer is <b>more</b> or <b>less</b> than the guess, and the range keeps closing in.</li><li>Whoever <b>nails</b> the exact number gets 1 point. The round only ends when someone nails it.</li></ol><p>With friends, pass the phone around; online, everyone plays on their own. After the rounds, the most points wins.</p><h3>Daily Cravazi</h3><p>Solo, with 5 questions that are the same for everyone and up to 10 guesses each. Nail it on the 1st guess: 10 points; on the 10th: 1 point. Your score goes to the daily ranking (on a tie, the fastest wins).</p>",
    "<ol class=\"help-steps\"><li>Aparece una pregunta cuya respuesta es un número.</li><li>Uno por vez, cada jugador dice un número.</li><li>El juego dice si la respuesta es <b>más</b> o <b>menos</b> que el número, y el rango se va cerrando.</li><li>Quien <b>clave</b> el número exacto gana 1 punto. La ronda solo termina cuando alguien lo clava.</li></ol><p>Con amigos, pásense el celular; online, cada uno en el suyo. Tras las rondas, gana quien tenga más puntos.</p><h3>Cravazi del día</h3><p>Solo, con 5 preguntas iguales para todos y hasta 10 intentos en cada una. La clavas al 1.º intento: 10 puntos; al 10.º: 1 punto. El resultado entra en el ranking del día (en el empate, gana quien fue más rápido).</p>",
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
  "btn.play": ["Jogar", "Play", "Jugar"],
  "btn.back": ["Voltar", "Back", "Volver"],
  "btn.share": ["Compartilhar", "Share", "Compartir"],
  "btn.copied": ["Copiado!", "Copied!", "¡Copiado!"],
  "home.together": ["Com a turma", "With friends", "Con amigos"],
  "home.togetherSub": ["De 2 a 8 jogadores, passando o celular", "2 to 8 players, passing the phone", "De 2 a 8 jugadores, pasándose el celular"],
  "home.online": ["Online", "Online", "Online"],
  "home.onlineSub": ["Cada um no seu celular", "Everyone on their own phone", "Cada uno en su celular"],
  "setup.title": ["Quem vai jogar?", "Who's playing?", "¿Quién juega?"],
  "daily.name": ["Cravazi do dia", "Daily Cravazi", "Cravazi del día"],
  "daily.kicker": ["Cravazi do dia #{n}", "Daily Cravazi #{n}", "Cravazi del día #{n}"],
  "daily.sub": ["Sozinho: 5 perguntas, as mesmas para todo mundo. Quanto menos chutes, mais pontos.", "Solo: 5 questions, the same for everyone. Fewer guesses, more points.", "Solo: 5 preguntas, las mismas para todos. Menos intentos, más puntos."],
  "daily.done": ["Você fez {n} de {max} pontos", "You scored {n} of {max} points", "Hiciste {n} de {max} puntos"],
  "daily.streak": ["{n} dias seguidos", "{n}-day streak", "{n} días seguidos"],
  "daily.train": ["Treinar", "Practice", "Entrenar"],
  "solo.train": ["Treino", "Practice", "Entrenamiento"],
  "solo.left": ["{n} chutes restantes", "{n} guesses left", "Quedan {n} intentos"],
  "solo.left1": ["Último chute!", "Last guess!", "¡Último intento!"],
  "solo.you": ["Você chutou {n}", "You guessed {n}", "Dijiste {n}"],
  "solo.nailed": ["Cravou!", "Nailed it!", "¡La clavaste!"],
  "solo.missed": ["Não foi dessa vez", "Not this time", "No fue esta vez"],
  "solo.got": ["+{n} pontos", "+{n} points", "+{n} puntos"],
  "solo.got1": ["+1 ponto", "+1 point", "+1 punto"],
  "solo.answer": ["A resposta é {n}", "The answer is {n}", "La respuesta es {n}"],
  "solo.next": ["Próxima pergunta", "Next question", "Siguiente pregunta"],
  "solo.pts": ["{n} pts", "{n} pts", "{n} pts"],
  "res.of": ["de {max} pontos", "of {max} points", "de {max} puntos"],
  "res.questions": ["As perguntas", "The questions", "Las preguntas"],
  "res.missed": ["não cravou", "missed", "no la clavó"],
  "res.shareText": ["Cravazi do dia #{n}: {p} de {max} pontos\n{linha}\n{url}", "Daily Cravazi #{n}: {p} of {max} points\n{linha}\n{url}", "Cravazi del día #{n}: {p} de {max} puntos\n{linha}\n{url}"],
  "res.trainAgain": ["Treinar de novo", "Practice again", "Entrenar de nuevo"],
  "res.backRoom": ["Voltar para a sala", "Back to the room", "Volver a la sala"],
  "on.title": ["Jogar online", "Play online", "Jugar online"],
  "on.sub": ["Cada um no seu celular. Crie uma sala e mande o código, ou entre na sala de alguém.", "Everyone on their own phone. Create a room and share the code, or join someone's room.", "Cada uno en su celular. Crea una sala y comparte el código, o entra en la sala de alguien."],
  "on.nick": ["Seu nome", "Your name", "Tu nombre"],
  "on.nickPh": ["Como te chamam?", "What do people call you?", "¿Cómo te llaman?"],
  "on.create": ["Criar sala", "Create room", "Crear sala"],
  "on.createSub": ["Você escolhe as rodadas e começa quando a turma chegar.", "You pick the rounds and start when everyone's in.", "Eliges las rondas y empiezas cuando lleguen todos."],
  "on.join": ["Entrar numa sala", "Join a room", "Entrar en una sala"],
  "on.joinBtn": ["Entrar", "Join", "Entrar"],
  "on.code": ["Código da sala", "Room code", "Código de la sala"],
  "on.wait": ["Aguarde…", "Wait…", "Espera…"],
  "on.errSetup": ["O modo online ainda não está configurado.", "Online mode isn't set up yet.", "El modo online aún no está configurado."],
  "on.errNick": ["Digite seu nome", "Type your name", "Escribe tu nombre"],
  "on.errCode": ["O código tem 5 letras", "The code has 5 characters", "El código tiene 5 letras"],
  "on.errNoRoom": ["Sala não encontrada", "Room not found", "Sala no encontrada"],
  "on.errPlaying": ["A partida dessa sala já começou", "That room's game has already started", "La partida de esa sala ya empezó"],
  "on.errFull": ["A sala está cheia (máx. 8)", "The room is full (max 8)", "La sala está llena (máx. 8)"],
  "on.errNet": ["Sem conexão. Tente de novo.", "No connection. Try again.", "Sin conexión. Inténtalo de nuevo."],
  "on.errDb": ["O banco do Cravazi ainda não foi criado (falta rodar supabase/schema.sql).", "The Cravazi database isn't set up yet (run supabase/schema.sql).", "La base de Cravazi aún no está creada (falta ejecutar supabase/schema.sql)."],
  "on.closed": ["A sala foi fechada", "The room was closed", "La sala se cerró"],
  "on.kicked": ["Você não está mais na sala", "You're no longer in the room", "Ya no estás en la sala"],
  "on.quit": ["Sair da partida online?", "Leave the online game?", "¿Salir de la partida online?"],
  "lobby.share": ["Convidar", "Invite", "Invitar"],
  "lobby.shareText": ["Bora jogar Cravazi comigo? Entre na sala: {url}", "Play Cravazi with me! Join the room: {url}", "¿Jugamos Cravazi? Entra en la sala: {url}"],
  "lobby.players": ["Na sala", "In the room", "En la sala"],
  "lobby.host": ["anfitrião", "host", "anfitrión"],
  "lobby.you": ["você", "you", "tú"],
  "lobby.kick": ["Tirar da sala", "Remove from room", "Sacar de la sala"],
  "lobby.leave": ["Sair da sala", "Leave room", "Salir de la sala"],
  "lobby.needTwo": ["Precisa de pelo menos 2 jogadores. Mande o código!", "You need at least 2 players. Share the code!", "Se necesitan al menos 2 jugadores. ¡Comparte el código!"],
  "lobby.ready": ["Todo mundo chegou? Pode começar.", "Everyone here? You can start.", "¿Llegaron todos? Puedes empezar."],
  "lobby.waitHost": ["Esperando {nome} começar…", "Waiting for {nome} to start…", "Esperando a que {nome} empiece…"],
  "game.quit": ["Sair da partida", "Leave game", "Salir de la partida"],
  "game.yourTurn": ["Sua vez!", "Your turn!", "¡Tu turno!"],
  "game.waitTurn": ["Espere a sua vez", "Wait for your turn", "Espera tu turno"],
  // skins (as mesmas do Topzi: ../topzi/js/avatars.js)
  "btn.random": ["Sortear", "Random", "Al azar"],
  "skin.change": ["Trocar skin", "Change skin", "Cambiar skin"],
  "skin.use": ["Usar esta skin", "Use this skin", "Usar esta skin"],
  "skin.of": ["Skin de {nome}", "{nome}'s skin", "Skin de {nome}"],
  "skin.custom": ["Personalizar", "Customize", "Personalizar"],
  "skin.inUse": ["em uso", "in use", "en uso"],
  "skin.special": ["Especial", "Special", "Especial"],
  "skin.prev": ["Anterior", "Previous", "Anterior"],
  "skin.next": ["Próximo", "Next", "Siguiente"],
  "group.Heróis": ["Heróis", "Heroes", "Héroes"],
  "group.Vilões": ["Vilões", "Villains", "Villanos"],
  "group.Animes": ["Animes", "Anime", "Animes"],
  "group.Desenhos": ["Desenhos", "Cartoons", "Dibujos"],
  "group.Filmes e séries": ["Filmes e séries", "Movies & TV", "Películas y series"],
  "group.Games": ["Games", "Games", "Videojuegos"],
  "group.Futebol": ["Futebol", "Soccer", "Fútbol"],
  "group.Profissões": ["Profissões", "Jobs", "Profesiones"],
  "builder.Rosto": ["Rosto", "Face", "Cara"],
  "builder.Cabelo": ["Cabelo", "Hair", "Pelo"],
  "builder.Cabeça": ["Cabeça", "Head", "Cabeza"],
  "builder.Roupa": ["Roupa", "Outfit", "Ropa"],
  "builder.Extras": ["Extras", "Extras", "Extras"],
  "ctrl.skin": ["Pele", "Skin tone", "Piel"],
  "ctrl.eyes": ["Olhos", "Eyes", "Ojos"],
  "ctrl.mouth": ["Boca", "Mouth", "Boca"],
  "ctrl.beard": ["Barba", "Beard", "Barba"],
  "ctrl.beardColor": ["Cor da barba", "Beard color", "Color de barba"],
  "ctrl.sameHair": ["Igual ao cabelo", "Same as hair", "Igual al pelo"],
  "ctrl.extra": ["Detalhe", "Detail", "Detalle"],
  "ctrl.hair": ["Corte", "Haircut", "Corte"],
  "ctrl.color": ["Cor", "Color", "Color"],
  "ctrl.head": ["Acessório", "Accessory", "Accesorio"],
  "ctrl.headColor": ["Cor principal", "Main color", "Color principal"],
  "ctrl.headColor2": ["Segunda cor", "Second color", "Segundo color"],
  "ctrl.capLetter": ["Letra do boné", "Cap letter", "Letra de la gorra"],
  "ctrl.shirt": ["Camisa", "Shirt", "Camiseta"],
  "ctrl.pattern": ["Estampa", "Print", "Estampado"],
  "ctrl.patternColor": ["Cor da estampa", "Print color", "Color del estampado"],
  "ctrl.number": ["Número", "Number", "Número"],
  "ctrl.sleeves": ["Mangas", "Sleeves", "Mangas"],
  "ctrl.sameShirt": ["Igual à camisa", "Same as shirt", "Igual a la camiseta"],
  "ctrl.belt": ["Cinto", "Belt", "Cinturón"],
  "ctrl.noBelt": ["Sem cinto", "No belt", "Sin cinturón"],
  "ctrl.legs": ["Calça", "Pants", "Pantalón"],
  "ctrl.cape": ["Capa", "Cape", "Capa"],
  "ctrl.noCape": ["Sem capa", "No cape", "Sin capa"],
  "ctrl.item": ["Na mão", "Holding", "En la mano"],
  "ctrl.bg": ["Fundo", "Background", "Fondo"],
  "ctrl.noBg": ["Sem fundo", "No background", "Sin fondo"],
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
