// Textos do Tamanhozi em [português, inglês, espanhol], idioma, armazenamento e utilidades de tela.
// O idioma e o tema são os mesmos do Gamezi (tt:lang, tt:theme); o resto fica em tm:…

const LANGS = ["pt", "en", "es"];
const TZ_COMPARTILHADO = ["lang", "theme"];

function store(key, value) {
  const k = (TZ_COMPARTILHADO.includes(key) ? "tt:" : "tm:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = store("lang");
if (!LANGS.includes(lang)) lang = LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";

const TZ_T = {
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
  "home.tag": ["Qual o tamanho de verdade? Ajuste e descubra.", "How big is it, really? Resize it and find out.", "¿Qué tamaño tiene de verdad? Ajústalo y descúbrelo."],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["10 rodadas. Recorde: {n}", "10 rounds. Best: {n}", "10 rondas. Récord: {n}"],
  "home.freeSubNew": ["10 rodadas com o tema que você escolher", "10 rounds on the theme you pick", "10 rondas con el tema que elijas"],
  "home.online": ["Online", "Online", "Online"],
  "home.onlineSub": ["Todo mundo ajusta a mesma coisa; quem chegar mais perto leva 1 ponto", "Everyone resizes the same thing; closest gets 1 point", "Todos ajustan lo mismo; quien más se acerque gana 1 punto"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "cat.misto": ["Misto", "Mixed", "Mixto"],
  "cat.monumentos": ["Lugares e monumentos", "Places and landmarks", "Lugares y monumentos"],
  "cat.personagens": ["Pessoas e monstros", "People and monsters", "Personas y monstruos"],
  "cat.animais": ["Animais", "Animals", "Animales"],
  "cat.veiculos": ["Veículos", "Vehicles", "Vehículos"],
  "cat.objetos": ["Objetos", "Objects", "Objetos"],
  "cat.paises": ["Países", "Countries", "Países"],
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    "<ol class=\"help-steps\"><li>Aparecem duas coisas lado a lado: a <b>referência</b> (escura), no tamanho certo e com a medida, e outra (<b>vermelha</b>) num tamanho errado.</li><li>Deixe a vermelha do tamanho de verdade perto da referência: arraste a alça do canto, arraste o dedo no quadro (para cima aumenta), faça pinça, role o mouse ou use <b>−</b> e <b>+</b>.</li><li>Confirme: aparece o tamanho real (contorno verde) e quanto você errou.</li><li>Em cheio vale 100 pontos. Cada vez que a área erra pelo dobro (ou pela metade), perde 50.</li></ol><p><b>Desafio do dia:</b> as mesmas 10 rodadas para todo mundo, com ranking. <b>Partida livre:</b> escolha o tema. <b>Online:</b> todo mundo ajusta a mesma coisa ao mesmo tempo; quem chegar mais perto leva 1 ponto.</p><p class=\"muted small\">Tudo em escala de verdade: monumentos, veículos, objetos e pessoas desenhados com as medidas reais; animais do acervo “QGIS svg icons — Animal silhouettes” (domínio público). Mapas: Natural Earth, numa projeção que mantém a área (sem a distorção dos mapas comuns). Personagens e monstros usam a medida da obra citada.</p>",
    "<ol class=\"help-steps\"><li>Two things show up side by side: the <b>reference</b> (dark), at its real size and with its measurement, and another one (<b>red</b>) at the wrong size.</li><li>Make the red one its real size next to the reference: drag the corner handle, drag on the board (up makes it bigger), pinch, scroll or use <b>−</b> and <b>+</b>.</li><li>Confirm: the real size shows up (green outline) along with how far off you were.</li><li>Spot on is worth 100 points. Every time the area is off by double (or half), you lose 50.</li></ol><p><b>Daily challenge:</b> the same 10 rounds for everyone, with a ranking. <b>Free play:</b> pick a theme. <b>Online:</b> everyone resizes the same thing at the same time; whoever gets closest wins 1 point.</p><p class=\"muted small\">Everything is to scale: landmarks, vehicles, objects and people drawn from their real measurements; animals from the “QGIS svg icons — Animal silhouettes” collection (public domain). Maps: Natural Earth, in an equal-area projection (without the distortion of regular maps). Characters and monsters use the size from the work named.</p>",
    "<ol class=\"help-steps\"><li>Aparecen dos cosas lado a lado: la <b>referencia</b> (oscura), en su tamaño real y con su medida, y otra (<b>roja</b>) en un tamaño equivocado.</li><li>Deja la roja de su tamaño real junto a la referencia: arrastra el asa de la esquina, arrastra el dedo en el cuadro (hacia arriba la agranda), pellizca, usa la rueda o los botones <b>−</b> y <b>+</b>.</li><li>Confirma: aparece el tamaño real (contorno verde) y cuánto te equivocaste.</li><li>Exacto vale 100 puntos. Cada vez que el área se equivoca por el doble (o la mitad), pierdes 50.</li></ol><p><b>Desafío del día:</b> las mismas 10 rondas para todos, con ranking. <b>Partida libre:</b> elige el tema. <b>Online:</b> todos ajustan lo mismo a la vez; quien más se acerque gana 1 punto.</p><p class=\"muted small\">Todo a escala real: monumentos, vehículos, objetos y personas dibujados con sus medidas reales; animales de la colección “QGIS svg icons — Animal silhouettes” (dominio público). Mapas: Natural Earth, en una proyección que conserva el área (sin la distorsión de los mapas comunes). Personajes y monstruos usan la medida de la obra citada.</p>",
  ],
  "daily.name": ["Desafio do dia", "Daily challenge", "Desafío del día"],
  "daily.kicker": ["Tamanhozi do dia #{n}", "Daily Tamanhozi #{n}", "Tamanhozi del día #{n}"],
  "daily.done": ["{n} de 1.000 pontos", "{n} of 1,000 points", "{n} de 1.000 puntos"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.online": ["Online", "Online", "Online"],
  "game.round": ["Rodada {a}/{b}", "Round {a}/{b}", "Ronda {a}/{b}"],
  "game.pts": ["{n} pts", "{n} pts", "{n} pts"],
  "game.ref": ["Referência", "Reference", "Referencia"],
  "game.adjust": ["Ajuste o meu tamanho", "Resize me", "Ajusta mi tamaño"],
  "game.real": ["Tamanho real", "Real size", "Tamaño real"],
  "game.yours": ["O seu", "Yours", "El tuyo"],
  "game.hint": ["Arraste a alça do canto ou o dedo no quadro (para cima aumenta), faça pinça, role o mouse ou use − e +.", "Drag the corner handle or your finger on the board (up makes it bigger), pinch, scroll or use − and +.", "Arrastra el asa de la esquina o el dedo en el cuadro (hacia arriba agranda), pellizca, usa la rueda o − y +."],
  "game.smaller": ["Diminuir", "Smaller", "Achicar"],
  "game.bigger": ["Aumentar", "Bigger", "Agrandar"],
  "game.confirm": ["Confirmar", "Confirm", "Confirmar"],
  "game.bigBy": ["Ficou {n} vezes maior que o real", "It was {n} times too big", "Quedó {n} veces más grande que el real"],
  "game.smallBy": ["Ficou {n} vezes menor que o real", "It was {n} times too small", "Quedó {n} veces más chico que el real"],
  "game.exact": ["Em cheio!", "Spot on!", "¡Exacto!"],
  "game.got": ["+{n} pontos", "+{n} points", "+{n} puntos"],
  "game.next": ["Próximo", "Next", "Siguiente"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "game.quit": ["Sair", "Leave", "Salir"],
  "m.a": ["Altura", "Height", "Altura"],
  "m.c": ["Comprimento", "Length", "Longitud"],
  "m.cv": ["Comprimento", "Length", "Longitud"],
  "m.l": ["Largura", "Width", "Ancho"],
  "m.d": ["Diâmetro", "Diameter", "Diámetro"],
  "m.e": ["Envergadura", "Wingspan", "Envergadura"],
  "m.area": ["Área", "Area", "Área"],
  "km.mi": ["{n} milhões de km²", "{n} million km²", "{n} millones de km²"],
  "km.mil": ["{n} mil km²", "{n} thousand km²", "{n} mil km²"],
  "km.n": ["{n} km²", "{n} km²", "{n} km²"],
  "res.title": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.of": ["de 1.000", "of 1,000", "de 1.000"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.sub": ["Sequência: {n} dia(s) seguidos", "Streak: {n} day(s) in a row", "Racha: {n} día(s) seguidos"],
  "res.rounds": ["As rodadas", "The rounds", "Las rondas"],
  "res.shareText": ["Tamanhozi · dia #{n}: {p}/1000\n{linha}\n{url}", "Tamanhozi · day #{n}: {p}/1000\n{linha}\n{url}", "Tamanhozi · día #{n}: {p}/1000\n{linha}\n{url}"],
  "res.won": ["{nome} venceu!", "{nome} wins!", "¡{nome} ganó!"],
  "res.tie": ["Empate!", "It's a tie!", "¡Empate!"],
  "res.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.pts1": ["1 ponto", "1 point", "1 punto"],
  "res.backRoom": ["Voltar para a sala", "Back to the room", "Volver a la sala"],
  "on.title": ["Jogar online", "Play online", "Jugar online"],
  "on.sub": ["Cada um no seu celular. Todo mundo ajusta a mesma coisa; quem chegar mais perto leva 1 ponto.", "Everyone on their own phone. Everyone resizes the same thing; whoever gets closest wins 1 point.", "Cada uno en su celular. Todos ajustan lo mismo; quien más se acerque gana 1 punto."],
  "on.nick": ["Seu nome", "Your name", "Tu nombre"],
  "on.nickPh": ["Como te chamam?", "What do people call you?", "¿Cómo te llaman?"],
  "on.create": ["Criar sala", "Create room", "Crear sala"],
  "on.createSub": ["Você escolhe o tema e começa quando a turma chegar.", "You pick the theme and start when everyone's in.", "Eliges el tema y empiezas cuando lleguen todos."],
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
  "on.errDb": ["O banco do Tamanhozi ainda não foi criado (falta rodar supabase/schema.sql).", "The Tamanhozi database isn't set up yet (run supabase/schema.sql).", "La base de Tamanhozi aún no está creada (falta ejecutar supabase/schema.sql)."],
  "on.closed": ["A sala foi fechada", "The room was closed", "La sala se cerró"],
  "on.kicked": ["Você não está mais na sala", "You're no longer in the room", "Ya no estás en la sala"],
  "on.quit": ["Sair da partida online?", "Leave the online game?", "¿Salir de la partida online?"],
  "on.sent": ["Resposta enviada! Esperando os outros…", "Answer sent! Waiting for the others…", "¡Respuesta enviada! Esperando a los demás…"],
  "on.answered": ["respondeu", "answered", "respondió"],
  "on.adjusting": ["ajustando…", "resizing…", "ajustando…"],
  "on.missed": ["não respondeu", "didn't answer", "no respondió"],
  "on.closest": ["Mais perto: {nomes}", "Closest: {nomes}", "Más cerca: {nomes}"],
  "on.point": ["+1 ponto", "+1 point", "+1 punto"],
  "on.waitHost": ["Esperando o anfitrião seguir…", "Waiting for the host…", "Esperando al anfitrión…"],
  "on.off": ["{n}% longe", "{n}% off", "{n}% lejos"],
  "lobby.share": ["Convidar", "Invite", "Invitar"],
  "lobby.shareText": ["Bora jogar Tamanhozi comigo? Entre na sala: {url}", "Play Tamanhozi with me! Join the room: {url}", "¿Jugamos Tamanhozi? Entra en la sala: {url}"],
  "lobby.players": ["Na sala", "In the room", "En la sala"],
  "lobby.theme": ["Tema", "Theme", "Tema"],
  "lobby.host": ["anfitrião", "host", "anfitrión"],
  "lobby.you": ["você", "you", "tú"],
  "lobby.kick": ["Tirar da sala", "Remove from room", "Sacar de la sala"],
  "lobby.leave": ["Sair da sala", "Leave room", "Salir de la sala"],
  "lobby.needTwo": ["Precisa de pelo menos 2 jogadores. Mande o código!", "You need at least 2 players. Share the code!", "Se necesitan al menos 2 jugadores. ¡Comparte el código!"],
  "lobby.ready": ["Todo mundo chegou? Pode começar.", "Everyone here? You can start.", "¿Llegaron todos? Puedes empezar."],
  "lobby.waitHost": ["Esperando {nome} começar…", "Waiting for {nome} to start…", "Esperando a que {nome} empiece…"],
};

function t(key, vars = {}) {
  const e = TZ_T[key];
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

// Área para ler: "8,5 milhões de km²", "238 mil km²", "9.200 km²".
function km2(n) {
  if (n >= 1e6) return t("km.mi", { n: num(n / 1e6, 1) });
  if (n >= 1e5) return t("km.mil", { n: num(Math.round(n / 1e3)) });
  return t("km.n", { n: num(Math.round(n / 100) * 100) });
}

// Medida de um item para ler: "330 m", "1,73 m", "14,7 cm", "8 mm", "3.776 m", "8,5 milhões de km²".
function medidaTexto(it) {
  if (it.medida === "area") return km2(it.valor);
  const m = it.valor;
  if (m < 0.01) return num(m * 1000, 1) + " mm";
  if (m < 1) return num(m * 100, 1) + " cm";
  if (m < 10) return num(m, 2) + " m";
  return num(m, 1) + " m";
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
