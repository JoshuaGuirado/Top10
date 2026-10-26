// Kit de tela dos jogos novos do Gamezi (Emojizi, Contazi, Memorizi): monta as telas (início, partida, resultado,
// online e sala), cuida do idioma, do tema, do desafio do dia com ranking, da partida livre e do online com skin.
// As regras das rodadas ficam em ../gamezi-rodadas.js e no jogo.js de cada jogo; o app.js do jogo chama
// gzIniciar(GZ) com o que é só dele:
//   id, prefixo (chaves do aparelho, "ej" → ej:stats), nome, inicio (Date.UTC do dia 1), textos (os do jogo),
//   diario(dia) e online(tema) → 10 rodadas; livre(tema) → gerador de rodadas sem fim; segundos(rodada);
//   temas: [{ id, nome: [pt, en, es] }] (o primeiro é o padrão; aparecem como botões na partida livre e na sala online);
//   avaliar(rodada, v, ms) → { certo, pontos }; valida(rodada, v); resumo(rodada) e respostaTexto(rodada, v) (HTML);
//   quantias (opcional): [10, 20, 30] → o anfitrião escolhe quantas rodadas na sala; online(tema, qtd) recebe a escolhida;
//   extra (opcional): { card, telas, ligar(), idioma() } → um cartão a mais no início e telas próprias (o "Na mesa" do Censurazi);
//   desenhar(el, rodada, e): desenha a rodada em el. e = { fase: "jogando" | "enviado" | "revelado", nova, v, res, responder }.
//   Com e.nova falso a rodada já está desenhada nessa fase (o jogo pode só sair, para não reiniciar animações).
// Online como no Maiorzi: o aparelho do anfitrião roda a partida e manda o estado inteiro pelo Realtime (tabelas
// <id>_salas, <id>_sala_jogadores com a skin e <id>_partidas; funções <id>_sair_da_sala e <id>_assumir_sala).

const LANGS = ["pt", "en", "es"];
let GZ = null;

function store(key, value) {
  const k = (["lang", "theme", "sound"].includes(key) ? "tt:" : GZ.prefixo + ":") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

let lang = (() => {
  let l = null;
  try { l = JSON.parse(localStorage.getItem("tt:lang")); } catch (e) { l = null; }
  return LANGS.includes(l) ? l : LANGS.includes((navigator.language || "pt").slice(0, 2)) ? navigator.language.slice(0, 2) : "pt";
})();

const KIT_T = {
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
  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "home.free": ["Partida livre", "Free play", "Partida libre"],
  "home.freeSub": ["Até errar 3 vezes. Recorde: {n}", "Until you miss 3 times. Best: {n}", "Hasta fallar 3 veces. Récord: {n}"],
  "home.freeSubNew": ["Até errar 3 vezes", "Until you miss 3 times", "Hasta fallar 3 veces"],
  "home.online": ["Online", "Online", "Online"],
  "home.onlineSub": ["Com a turma, cada um no seu celular e com a sua skin", "With friends, each on their own phone with their own skin", "Con amigos, cada uno en su celular y con su skin"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "daily.done": ["{n} pontos", "{n} points", "{n} puntos"],
  "game.free": ["Partida livre", "Free play", "Partida libre"],
  "game.online": ["Online", "Online", "Online"],
  "game.quit": ["Sair", "Leave", "Salir"],
  "game.pts": ["{n} pts", "{n} pts", "{n} pts"],
  "game.right": ["Certo! +{n}", "Right! +{n}", "¡Correcto! +{n}"],
  "game.wrong": ["Errou!", "Wrong!", "¡Fallaste!"],
  "game.timeUp": ["Acabou o tempo!", "Time's up!", "¡Se acabó el tiempo!"],
  "game.next": ["Próxima", "Next", "Siguiente"],
  "game.finish": ["Ver resultado", "See result", "Ver resultado"],
  "game.lives": ["{n} vidas", "{n} lives", "{n} vidas"],
  "game.lives1": ["1 vida", "1 life", "1 vida"],
  "res.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "res.pts1": ["1 ponto", "1 point", "1 punto"],
  "res.of": ["de 1.000", "of 1,000", "de 1.000"],
  "res.record": ["Novo recorde!", "New record!", "¡Nuevo récord!"],
  "res.best": ["Recorde: {n}", "Best: {n}", "Récord: {n}"],
  "res.streak": ["Sequência: {n} dia(s) seguidos", "Streak: {n} day(s) in a row", "Racha: {n} día(s) seguidos"],
  "res.rounds": ["As rodadas", "The rounds", "Las rondas"],
  "res.right": ["{a} de {b} certas", "{a} of {b} right", "{a} de {b} correctas"],
  "res.share": ["{nome} · dia #{n}: {p} pts\n{linha}\n{url}", "{nome} · day #{n}: {p} pts\n{linha}\n{url}", "{nome} · día #{n}: {p} pts\n{linha}\n{url}"],
  "res.won": ["{nome} venceu!", "{nome} wins!", "¡{nome} ganó!"],
  "res.tie": ["Empate!", "It's a tie!", "¡Empate!"],
  "res.backRoom": ["Voltar para a sala", "Back to the room", "Volver a la sala"],
  "res.you": ["Você: {v}", "You: {v}", "Tú: {v}"],
  "on.title": ["Jogar online", "Play online", "Jugar online"],
  "on.sub": ["Cada um no seu celular. Todo mundo responde a mesma rodada; quem acerta mais rápido ganha mais pontos.", "Everyone on their own phone. All answer the same round; the faster you get it right, the more points.", "Cada uno en su celular. Todos responden la misma ronda; quien acierta más rápido gana más puntos."],
  "on.nick": ["Seu nome", "Your name", "Tu nombre"],
  "on.nickPh": ["Como te chamam?", "What do people call you?", "¿Cómo te llaman?"],
  "on.create": ["Criar sala", "Create room", "Crear sala"],
  "on.createSub": ["Você começa quando a turma chegar.", "You start when everyone's in.", "Empiezas cuando lleguen todos."],
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
  "on.errDb": ["O banco do online deste jogo ainda não foi criado (falta rodar supabase/schema.sql).", "This game's online database isn't set up yet (run supabase/schema.sql).", "La base online de este juego aún no está creada (falta ejecutar supabase/schema.sql)."],
  "on.closed": ["A sala foi fechada", "The room was closed", "La sala se cerró"],
  "on.kicked": ["Você não está mais na sala", "You're no longer in the room", "Ya no estás en la sala"],
  "on.quit": ["Sair da partida online?", "Leave the online game?", "¿Salir de la partida online?"],
  "on.sent": ["Resposta enviada! Esperando os outros…", "Answer sent! Waiting for the others…", "¡Respuesta enviada! Esperando a los demás…"],
  "on.answered": ["respondeu", "answered", "respondió"],
  "on.thinking": ["pensando…", "thinking…", "pensando…"],
  "on.missed": ["não respondeu", "didn't answer", "no respondió"],
  "on.youMissed": ["Não respondeu", "Didn't answer", "No respondiste"],
  "on.wrong": ["errou", "wrong", "falló"],
  "on.waitHost": ["Esperando o anfitrião seguir…", "Waiting for the host…", "Esperando al anfitrión…"],
  "lobby.share": ["Convidar", "Invite", "Invitar"],
  "lobby.shareText": ["Bora jogar {nome} comigo? Entre na sala: {url}", "Play {nome} with me! Join the room: {url}", "¿Jugamos {nome}? Entra en la sala: {url}"],
  "lobby.players": ["Na sala", "In the room", "En la sala"],
  "lobby.theme": ["Tema", "Theme", "Tema"],
  "lobby.rounds": ["Rodadas", "Rounds", "Rondas"],
  "lobby.host": ["anfitrião", "host", "anfitrión"],
  "lobby.you": ["você", "you", "tú"],
  "lobby.kick": ["Tirar da sala", "Remove from room", "Sacar de la sala"],
  "lobby.leave": ["Sair da sala", "Leave room", "Salir de la sala"],
  "lobby.needTwo": ["Precisa de pelo menos 2 jogadores. Mande o código!", "You need at least 2 players. Share the code!", "Se necesitan al menos 2 jugadores. ¡Comparte el código!"],
  "lobby.ready": ["Todo mundo chegou? Pode começar.", "Everyone here? You can start.", "¿Llegaron todos? Puedes empezar."],
  "lobby.waitHost": ["Esperando {nome} começar…", "Waiting for {nome} to start…", "Esperando a que {nome} empiece…"],
};

function t(key, vars = {}) {
  const e = (GZ && GZ.textos[key]) || KIT_T[key];
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

function fmt(n) {
  return Number(n).toLocaleString({ pt: "pt-BR", en: "en-US", es: "es-ES" }[lang]);
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

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

function copiar(texto, btn) {
  const antes = btn.textContent;
  if (navigator.share && matchMedia("(hover: none)").matches) return navigator.share({ text: texto }).catch(() => {});
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(() => {
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = antes), 1800);
  }, () => {});
}

const KIT_ICONES = {
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8 3c0 5.9-8 10.6-8 10.6z"/></svg>',
  x: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  help: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>',
  gear: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
};

// ───────────── telas ─────────────

function kitMontar() {
  const id = GZ.id;
  document.body.innerHTML = `
  <div class="topbar">
    <div class="topbar-left">
      <a class="icon-btn gamezi-back" href="../" data-i18n-aria="nav.back"><svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>
      <button type="button" class="logo-btn" id="home-btn" data-i18n-aria="nav.home">
        <img class="logo logo-light" src="../brand/${id}-logo.svg" alt="${GZ.nome}">
        <img class="logo logo-dark" src="../brand/${id}-logo-dark.svg" alt="" aria-hidden="true">
      </button>
    </div>
    <div class="topbar-actions">
      <button type="button" class="icon-btn" id="help-btn" data-i18n-aria="help.title">${KIT_ICONES.help}</button>
      <button type="button" class="icon-btn" id="settings-btn" data-i18n-aria="nav.settings">${KIT_ICONES.gear}</button>
    </div>
  </div>
  <main>
    <section id="screen-home" class="screen home">
      <div class="home-head">
        <img class="home-symbol logo-light" src="../brand/${id}-simbolo.svg" alt="" aria-hidden="true">
        <img class="home-symbol logo-dark" src="../brand/${id}-simbolo-escuro.svg" alt="" aria-hidden="true">
        <h1 class="home-tag" data-i18n="home.tag"></h1>
      </div>
      <div class="home-card daily" id="daily-card"></div>
      <div class="home-card">
        <div class="home-row">
          <div><b data-i18n="home.free"></b><span id="free-sub"></span></div>
          <button type="button" class="btn dark" id="free-btn" data-i18n="btn.play"></button>
        </div>
        <div class="chips" id="free-temas" role="radiogroup" hidden></div>
      </div>
      <div class="home-card home-row">
        <div><b data-i18n="home.online"></b><span data-i18n="home.onlineSub"></span></div>
        <button type="button" class="btn dark" id="online-btn" data-i18n="btn.play"></button>
      </div>
      ${GZ.extra ? GZ.extra.card : ""}
      <nav class="home-links">
        <button type="button" class="link-btn" id="help-link" data-i18n="help.title"></button>
        <a href="../" data-i18n="home.more"></a>
      </nav>
      <footer class="site-foot">
        <a href="../termos.html">Termos de uso</a>
        <a href="../privacidade.html">Privacidade</a>
        <span>© 2026 Gamezi</span>
      </footer>
    </section>

    <section id="screen-game" class="screen" hidden>
      <div class="hud">
        <b id="game-title"></b>
        <span class="lives" id="game-lives" role="img"></span>
        <span class="game-round" id="game-round"></span>
        <span class="game-score" id="game-score"></span>
      </div>
      <div class="timebar" id="timebar"><i id="timebar-fill"></i></div>
      <div class="round" id="round"></div>
      <div class="feedback-box" id="feedback" hidden>
        <p class="verdict" id="verdict"></p>
        <button type="button" class="btn big" id="game-next"></button>
      </div>
      <p class="sent" id="sent" hidden></p>
      <div class="players" id="players" hidden></div>
      <div class="actions center"><button type="button" class="link-btn" id="game-quit" data-i18n="game.quit"></button></div>
    </section>

    <section id="screen-results" class="screen" hidden>
      <div class="result-head">
        <p class="kicker" id="res-kicker"></p>
        <p class="result-score" id="res-score"></p>
        <p class="muted" id="res-sub"></p>
        <div class="actions center">
          <button type="button" class="btn" id="res-share" data-i18n="btn.share"></button>
          <button type="button" class="btn" id="res-again"></button>
          <button type="button" class="btn ghost" id="res-home" data-i18n="btn.home"></button>
        </div>
      </div>
      <ol class="ranking" id="res-ranking" hidden></ol>
      <div class="leaderboard" id="leaderboard" hidden></div>
      <h3 data-i18n="res.rounds"></h3>
      <ol class="rounds" id="res-list"></ol>
    </section>

    <section id="screen-online" class="screen narrow" hidden>
      <h2 data-i18n="on.title"></h2>
      <p class="muted" data-i18n="on.sub"></p>
      <div class="online-setup feedback" id="online-setup" hidden></div>
      <div id="online-main">
        <div class="gz-nick-row">
          <button type="button" id="online-skin"></button>
          <label class="nick"><span data-i18n="on.nick"></span>
            <input id="online-nick" maxlength="16" autocomplete="nickname" data-i18n-ph="on.nickPh">
          </label>
        </div>
        <div class="online-grid">
          <div class="home-card online-box">
            <p class="card-label" data-i18n="on.create"></p>
            <p class="small muted" data-i18n="on.createSub"></p>
            <button type="button" class="btn" id="create-room-btn" data-i18n="on.create"></button>
          </div>
          <form class="home-card online-box" id="join-form">
            <p class="card-label" data-i18n="on.join"></p>
            <input class="code-input" id="join-code" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="ABCDE" data-i18n-aria="on.code">
            <button type="submit" class="btn dark" id="join-room-btn" data-i18n="on.joinBtn"></button>
          </form>
        </div>
      </div>
      <p class="feedback bad" id="online-error" aria-live="polite"></p>
      <div class="actions"><button type="button" class="btn ghost" id="online-back" data-i18n="btn.back"></button></div>
    </section>

    <section id="screen-lobby" class="screen narrow" hidden>
      <div class="lobby-top">
        <div>
          <p class="small muted" data-i18n="on.code"></p>
          <p class="room-code" id="room-code"></p>
        </div>
        <button type="button" class="btn dark" id="share-room" data-i18n="lobby.share"></button>
      </div>
      <h3 data-i18n="lobby.players"></h3>
      <div class="lobby-players" id="lobby-players"></div>
      <div class="home-card" id="lobby-temas-box" hidden>
        <p class="card-label" data-i18n="lobby.theme"></p>
        <div class="chips" id="lobby-temas" role="radiogroup"></div>
      </div>
      <div class="home-card" id="lobby-qtd-box" hidden>
        <p class="card-label" data-i18n="lobby.rounds"></p>
        <div class="chips" id="lobby-qtd" role="radiogroup"></div>
      </div>
      <p class="small muted" id="lobby-status" aria-live="polite"></p>
      <div class="actions end">
        <button type="button" class="btn ghost" id="leave-room" data-i18n="lobby.leave"></button>
        <button type="button" class="btn big" id="lobby-start" data-i18n="btn.start"></button>
      </div>
    </section>
    ${GZ.extra ? GZ.extra.telas : ""}
  </main>

  <dialog class="dialog" id="help-dialog">
    <div class="dialog-inner">
      <div class="dialog-head"><h2 data-i18n="help.title"></h2><button type="button" class="text-btn" data-close data-i18n="btn.close"></button></div>
      <div class="help-body" id="help-body"></div>
    </div>
  </dialog>

  <dialog class="dialog settings-dialog" id="settings-dialog">
    <div class="dialog-inner">
      <div class="dialog-head"><h2 data-i18n="nav.settings"></h2><button type="button" class="text-btn" data-close data-i18n="btn.close"></button></div>
      <label class="setting-row"><span data-i18n="nav.lang"></span>
        <select id="lang-select" class="lang-select">
          <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option>
        </select>
      </label>
      <div class="setting-row"><span data-i18n="nav.theme"></span><button type="button" class="icon-btn" id="theme-btn"></button></div>
    </div>
  </dialog>`;
}

// ───────────── dados guardados ─────────────

function stats() {
  return { partidas: 0, pontos: 0, recorde: 0, online: 0, ...(store("stats") || {}) };
}

function diarios() {
  return store("diario") || {};
}

function diaHoje() {
  return gzDiaNumero(GZ.inicio);
}

function sequenciaDiaria() {
  const todos = diarios();
  let dia = diaHoje();
  if (!todos[dia]) dia -= 1;
  let n = 0;
  while (todos[dia]) {
    n += 1;
    dia -= 1;
  }
  return n;
}

// ───────────── início ─────────────

let partida = null; // sozinho (gzNovaPartida) ou online (gzNovaOnline)
let modo = "livre"; // "diario", "livre" ou "online"
let temaDaPartida = null; // tema da partida livre ou online
let diaAtual = 0;
let rodadaDesde = 0; // quando a rodada da vez apareceu (performance.now)
let tempoMs = 0; // tempo pensando no desafio do dia (desempata o ranking)
let chaveDesenhada = "";

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = diaHoje();
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = gzDiaNumero(GZ.inicio, d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function renderHome() {
  const dia = diaHoje();
  const feito = diarios()[dia];
  const seq = sequenciaDiaria();
  $("daily-card").innerHTML = `
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(t("daily.name"))}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString({ pt: "pt-BR", en: "en", es: "es" }[lang]))}</span>
      <button type="button" class="btn ${feito ? "ghost" : ""}" id="daily-btn">${escapeHtml(t(feito ? "btn.share" : "btn.play"))}</button>
    </div>
    ${semanaHtml()}
    ${feito ? `<p class="daily-status">${escapeHtml(t("daily.done", { n: fmt(feito.acertos) }))}${seq > 1 ? ` · ${escapeHtml(t("res.streak", { n: seq }))}` : ""}</p>` : ""}`;
  $("daily-btn").onclick = (e) => (feito ? compartilhar(dia, feito, e.currentTarget) : comecarDiario(dia));
  $("daily-card").querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => abrirDia(Number(b.dataset.dia))));
  const st = stats();
  $("free-sub").textContent = st.recorde ? t("home.freeSub", { n: fmt(st.recorde) }) : t("home.freeSubNew");
  $("free-temas").hidden = !GZ.temas;
  if (GZ.temas) chipsTemas($("free-temas"), temaLivre(), (id) => {
    store("tema", id);
    renderHome();
  });
}

// ───────────── temas ─────────────

function temaValido(id) {
  return GZ.temas && GZ.temas.some((x) => x.id === id) ? id : GZ.temas ? GZ.temas[0].id : null;
}

function temaLivre() {
  return temaValido(store("tema"));
}

function nomeTema(id) {
  const x = GZ.temas && GZ.temas.find((y) => y.id === id);
  return x ? tr(x.nome) : "";
}

function chipsTemas(el, atual, onEscolher, editavel = true) {
  el.innerHTML = GZ.temas.map((x) =>
    `<button type="button" role="radio" aria-checked="${x.id === atual}" class="chip ${x.id === atual ? "active" : ""}" data-tema="${x.id}" ${editavel ? "" : "disabled"}>${escapeHtml(tr(x.nome))}</button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest("[data-tema]");
    if (b && editavel) onEscolher(b.dataset.tema);
  };
}

function irInicio() {
  partida = null;
  if (modo === "online") modo = "livre";
  renderHome();
  show("home");
}

function abrirDia(dia) {
  const feito = diarios()[dia];
  if (feito) return mostrarResultadoSalvo(dia, feito);
  comecarDiario(dia);
}

// ───────────── partida sozinho ─────────────

function comecarDiario(dia = diaHoje()) {
  if (dia < 1 || dia > diaHoje()) return;
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === diaHoje() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  modo = "diario";
  diaAtual = dia;
  comecar(gzNovaPartida({ rodadas: GZ.diario(dia) }));
}

function comecarLivre() {
  modo = "livre";
  temaDaPartida = temaLivre();
  comecar(gzNovaPartida({ proxima: GZ.livre(temaDaPartida), vidas: GZ_VIDAS }));
}

function comecar(estado) {
  partida = estado;
  tempoMs = 0;
  chaveDesenhada = "";
  show("game");
  novaRodada();
}

function novaRodada() {
  rodadaDesde = performance.now();
  renderJogo();
}

function rodadaDaVez() {
  return partida.rodadas[partida.n];
}

// Desenha a partida (sozinho ou online): placar, a rodada (pelo jogo) e o resultado da rodada.
function renderJogo() {
  const s = partida;
  if (!s) return;
  const online = !!s.online;
  const r = rodadaDaVez();
  if (!r) return;
  let fase, v, res;
  if (online) {
    const meu = me ? s.respostas[me.id] : undefined;
    fase = s.fase === "revelado" ? "revelado" : meu ? "enviado" : "jogando";
    v = meu ? meu.v : undefined;
    if (fase === "revelado") res = meu ? { certo: (s.ganhos[me.id] || 0) > 0, pontos: s.ganhos[me.id] || 0 } : null;
  } else {
    const resp = s.respostas[s.n];
    fase = resp ? "revelado" : "jogando";
    v = resp ? resp.v : undefined;
    res = resp || null;
  }
  const tema = online ? s.tema : temaDaPartida;
  const comTema = GZ.temas && tema && tema !== GZ.temas[0].id;
  $("game-title").textContent = modo === "diario" ? t("daily.kicker", { n: diaAtual }) : comTema ? nomeTema(tema) : online ? t("game.online") : t("game.free");
  const vidas = !online && s.vidasMax;
  $("game-lives").hidden = !vidas;
  if (vidas) {
    $("game-lives").innerHTML = Array.from({ length: s.vidasMax }, (_, i) => `<span class="heart ${i < s.vidas ? "" : "lost"}">${KIT_ICONES.heart}</span>`).join("");
    $("game-lives").setAttribute("aria-label", s.vidas === 1 ? t("game.lives1") : t("game.lives", { n: s.vidas }));
  }
  $("game-round").hidden = !!vidas;
  $("game-round").textContent = `${Math.min(s.n + 1, s.rodadas.length)}/${s.rodadas.length}`;
  const meus = online ? (s.jogadores.find((j) => me && j.id === me.id) || { pontos: 0 }).pontos : s.pontos;
  $("game-score").textContent = t("game.pts", { n: fmt(meus) });

  const chave = (online ? "on" + s.comecou : "s" + s.n + ":" + s.rodadas.length) + ":" + fase + ":" + lang;
  const nova = chave !== chaveDesenhada;
  chaveDesenhada = chave;
  GZ.desenhar($("round"), r, { fase, nova, v, res, responder: responderAgora });

  const revelado = fase === "revelado";
  $("feedback").hidden = !revelado;
  if (revelado) {
    $("verdict").textContent = !res ? t("on.youMissed") : res.certo ? t("game.right", { n: res.pontos }) : v === null ? t("game.timeUp") : t("game.wrong");
    $("verdict").className = "verdict " + (res && res.certo ? "good" : "bad");
    const anfitriao = online && isHost();
    const acaba = online ? s.n + 1 >= s.rodadas.length : (s.vidasMax && s.vidas <= 0) || (!s.proxima && s.n + 1 >= s.rodadas.length);
    $("game-next").hidden = online && !anfitriao;
    $("game-next").textContent = t(acaba ? "game.finish" : "game.next");
  }
  $("sent").hidden = !online || (revelado ? isHost() : fase !== "enviado");
  $("sent").textContent = t(revelado ? "on.waitHost" : "on.sent");
  $("players").hidden = !online;
  if (online) renderJogadoresOnline();
}

// O jogo chama quando a pessoa responde (v) — ou o tempo, com null.
function responderAgora(v) {
  if (!partida) return;
  const ms = Math.round(performance.now() - rodadaDesde);
  if (partida.online) return onlineResponder(v, ms);
  if (partida.respostas.length > partida.n) return;
  tempoMs += ms;
  gzResponder(partida, v, ms, GZ.avaliar);
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function proxima() {
  if (!partida) return;
  if (partida.online) return onlineProxima();
  if (partida.respostas.length <= partida.n) return;
  if (gzProxima(partida)) return terminar();
  novaRodada();
}

// Barra do tempo: anda enquanto a rodada está aberta; acabou o tempo, conta como sem resposta.
function relogio() {
  requestAnimationFrame(relogio);
  const s = partida;
  const ativo = s && document.body.dataset.screen === "game" && !s.fim &&
    (s.online ? s.fase === "jogando" : s.respostas.length <= s.n);
  $("timebar").style.visibility = ativo ? "visible" : "hidden";
  if (!ativo) return;
  const limite = GZ.segundos(rodadaDaVez()) * 1000;
  const passou = s.online ? Date.now() - s.comecou : performance.now() - rodadaDesde;
  const resta = Math.max(0, limite - passou);
  $("timebar-fill").style.transform = `scaleX(${resta / limite})`;
  $("timebar").classList.toggle("low", resta <= 3000);
  if (resta <= 0 && !s.online) responderAgora(null);
}

// ───────────── fim ─────────────

function terminar() {
  const s = partida;
  const st = stats();
  st.partidas += 1;
  st.pontos += s.pontos;
  const recorde = modo === "livre" && s.pontos > st.recorde;
  if (recorde) st.recorde = s.pontos;
  store("stats", st);
  const reg = { acertos: s.pontos, certas: s.acertos, total: s.respostas.length, marcas: s.respostas.map((r) => r.certo), rodadas: s.rodadas.slice(0, s.respostas.length), respostas: s.respostas.map((r) => r.v), pontosRodada: s.respostas.map((r) => r.pontos), ms: Math.round(tempoMs) };
  if (modo === "diario" && !diarios()[diaAtual]) store("diario", { ...diarios(), [diaAtual]: reg });
  partida = null;
  mostrarResultado(reg, recorde);
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado(reg, false);
}

function telaResultado() {
  show("results");
  $("res-ranking").hidden = true;
  $("leaderboard").hidden = true;
  $("res-share").hidden = true;
  $("res-again").hidden = false;
  $("res-again").textContent = t("btn.again");
  $("res-again").onclick = comecarLivre;
  $("res-home").onclick = irInicio;
}

function mostrarResultado(reg, recorde) {
  const diario = modo === "diario";
  telaResultado();
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("game.free") + (GZ.temas ? " · " + nomeTema(temaDaPartida) : "");
  $("res-score").textContent = t("res.pts", { n: fmt(reg.acertos) });
  const certas = t("res.right", { a: reg.certas, b: reg.total });
  $("res-sub").textContent = diario
    ? certas + (sequenciaDiaria() > 1 ? " · " + t("res.streak", { n: sequenciaDiaria() }) : "")
    : certas + " · " + (recorde ? t("res.record") : t("res.best", { n: fmt(stats().recorde) }));
  $("res-share").hidden = !diario;
  $("res-share").onclick = (e) => compartilhar(diaAtual, reg, e.currentTarget);
  $("res-again").hidden = diario;
  if (diario) mostrarRanking();
  $("res-list").innerHTML = (reg.rodadas || []).map((r, i) => {
    const v = reg.respostas[i];
    const quem = v === null || v === undefined ? "—" : GZ.respostaTexto(r, v);
    return `<li class="${reg.marcas[i] ? "ok" : "no"}"><span>${GZ.resumo(r)}<em>${t("res.you", { v: quem })}</em></span><b>${reg.marcas[i] ? "+" + reg.pontosRodada[i] : "✗"}</b></li>`;
  }).join("");
}

function mostrarRanking() {
  const dia = diaAtual;
  const reg = diarios()[dia];
  if (!reg || typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: GZ.id, dia, hoje: diaHoje(), reg, lang, nick: store("nick"),
    salvar: (r) => store("diario", { ...diarios(), [dia]: r }),
    guardarNick: (n) => store("nick", n),
  });
}

function compartilhar(dia, reg, btn) {
  const linha = (reg.marcas || []).map((m) => (m ? "■" : "□")).join("");
  copiar(gameziTextoDoDia(t("res.share", { nome: GZ.nome, n: dia, p: reg.acertos, linha, url: location.origin + location.pathname })), btn);
}

// ───────────── topo: tema, idioma e ajuda ─────────────

function isDark() {
  return (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
}

function renderTema() {
  const b = $("theme-btn");
  b.innerHTML = KIT_ICONES[isDark() ? "sun" : "moon"];
  b.title = t(isDark() ? "nav.light" : "nav.dark");
  b.setAttribute("aria-label", b.title);
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  store("lang", l);
  applyI18n();
  renderTema();
  const tela = document.body.dataset.screen;
  if (tela === "home") renderHome();
  if (tela === "game") renderJogo();
  if (tela === "lobby") renderSala();
  if (GZ.extra && GZ.extra.idioma) GZ.extra.idioma(tela);
}

function sairDoJogo() {
  if (partida && partida.online) {
    if (!confirm(t("on.quit"))) return;
    return sairDaSala();
  }
  irInicio();
}

function kitLigar() {
  $("home-btn").onclick = () => (partida && partida.online ? sairDoJogo() : irInicio());
  $("help-btn").onclick = () => {
    $("help-body").innerHTML = t("help.html");
    $("help-dialog").showModal();
  };
  $("help-link").onclick = () => $("help-btn").click();
  $("settings-btn").onclick = () => $("settings-dialog").showModal();
  $("lang-select").value = lang;
  $("lang-select").onchange = (e) => setLang(e.target.value);
  $("theme-btn").onclick = () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store("theme", next);
    renderTema();
  };
  document.querySelectorAll("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  $("free-btn").onclick = comecarLivre;
  $("game-next").onclick = proxima;
  $("game-quit").onclick = sairDoJogo;
  $("online-btn").onclick = () => abrirOnline();
  $("online-back").onclick = irInicio;
  $("create-room-btn").onclick = (e) => ocupado(e.currentTarget, criarSala);
  $("join-form").onsubmit = (e) => {
    e.preventDefault();
    ocupado($("join-room-btn"), () => entrarComCodigo($("join-code").value));
  };
  $("join-code").addEventListener("input", (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")));
  $("share-room").onclick = (e) => copiar(t("lobby.shareText", { nome: GZ.nome, url: location.origin + location.pathname + "?sala=" + sala.code }), e.currentTarget);
  $("leave-room").onclick = sairDaSala;
  $("lobby-start").onclick = () => comecarOnline().catch(onlineErro);
  if (GZ.extra) GZ.extra.ligar();
  $("lobby-players").onclick = (e) => {
    const b = e.target.closest("[data-tirar]");
    if (b && isHost()) tirarDaSala(b.dataset.tirar).catch(onlineErro);
    if (e.target.closest("[data-minha-skin]")) gameziEscolherSkin(mudouMinhaSkin);
  };
}

function gzIniciar(config) {
  GZ = config;
  if (typeof gameziRetornoDoLogin === "function" && gameziRetornoDoLogin("../")) return;
  kitMontar();
  applyI18n();
  renderTema();
  kitLigar();
  irInicio();
  requestAnimationFrame(relogio);
  setInterval(() => {
    conferirAnfitriao().catch(() => {});
    talvezRevelar();
  }, 1000);
  if (location.hash === "#como-jogar") $("help-btn").click();
  retomarOnline();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    addEventListener("load", () => navigator.serviceWorker.register("../sw.js", { scope: "../" }).catch(() => {}));
  }
}

// ═════════════════════════════ online ═════════════════════════════

const SALA_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const AUSENTE_MS = 6000;

let sb = null;
let me = null; // { id }
let sala = null;
let salaJogadores = [];
let canal = null;
let presentes = new Set();
let sumiuEm = new Map();
let salvarTimer = null;
let partidaRegistrada = false;
let partidaContada = false;
let anfitriaoSumiuEm = null;
let onlineOcupado = false;

function tabela(nome) {
  return GZ.id + "_" + nome;
}

function meuId() {
  return me ? me.id : null;
}

function onlineConfigured() {
  return typeof gameziRankingLigado === "function" && gameziRankingLigado();
}

async function ensureOnline() {
  if (!onlineConfigured()) throw new Error(t("on.errSetup"));
  try {
    sb = await gameziCliente(true);
  } catch (e) {
    throw new Error(t("on.errNet"));
  }
  const { data } = await sb.auth.getSession();
  const u = data && data.session && data.session.user;
  if (!u) throw new Error(t("on.errNet"));
  me = { id: u.id };
  return me;
}

function isHost() {
  return !!(sala && me && sala.host_id === me.id);
}

function erroDoBanco(error) {
  const m = (error && error.message) || "";
  if (error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(m))) return new Error(t("on.errDb"));
  return new Error(m || t("on.errNet"));
}

function onlineErro(err) {
  const msg = (err && err.message) || String(err);
  $("online-error").textContent = msg;
  if (document.body.dataset.screen === "lobby") $("lobby-status").textContent = msg;
}

async function ocupado(btn, tarefa) {
  if (onlineOcupado) return;
  onlineOcupado = true;
  const antes = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("on.wait");
  $("online-error").textContent = "";
  try {
    await tarefa();
  } catch (err) {
    onlineErro(err);
  } finally {
    onlineOcupado = false;
    btn.disabled = false;
    btn.textContent = antes;
  }
}

function abrirOnline(codigo) {
  show("online");
  const ok = onlineConfigured();
  $("online-setup").hidden = ok;
  $("online-setup").textContent = t("on.errSetup");
  $("online-main").hidden = !ok;
  $("online-nick").value = store("nick") || "";
  if (codigo) $("join-code").value = codigo;
  $("online-error").textContent = "";
  if (ok) ensureOnline().catch(() => {});
  gameziBotaoSkin($("online-skin"), mudouMinhaSkin);
}

function mudouMinhaSkin(skin) {
  if (!sala || !me) return;
  const eu = salaJogadores.find((p) => p.user_id === me.id);
  if (eu) eu.skin = skin;
  if (document.body.dataset.screen === "lobby") renderSala();
  sb.from(tabela("sala_jogadores")).update({ skin }).eq("sala_code", sala.code).eq("user_id", me.id).then(() => enviar("sala"), () => {});
}

function skinDe(id) {
  if (me && id === me.id) return gameziMinhaSkin();
  const p = salaJogadores.find((x) => x.user_id === id);
  const j = partida && partida.jogadores && partida.jogadores.find((x) => x.id === id);
  return (p && p.skin) || (j && j.skin) || null;
}

function nickOnline() {
  const nick = $("online-nick").value.trim().slice(0, 16);
  if (!nick) {
    $("online-nick").focus();
    throw new Error(t("on.errNick"));
  }
  store("nick", nick);
  return nick;
}

async function criarSala() {
  const nick = nickOnline();
  await ensureOnline();
  let codigo = null;
  for (let k = 0; k < 5 && !codigo; k++) {
    const tentativa = Array.from({ length: 5 }, () => SALA_LETRAS[Math.floor(Math.random() * SALA_LETRAS.length)]).join("");
    const { error } = await sb.from(tabela("salas")).insert({ code: tentativa, host_id: me.id, status: "lobby", settings: { tema: temaLivre(), qtd: qtdValida(store("qtd")) } });
    if (!error) codigo = tentativa;
    else if (error.code !== "23505") throw erroDoBanco(error);
  }
  if (!codigo) throw new Error(t("on.errNet"));
  const { error } = await sb.from(tabela("sala_jogadores")).insert({ sala_code: codigo, user_id: me.id, nick, skin: gameziMinhaSkin() });
  if (error) throw erroDoBanco(error);
  sb.rpc(tabela("limpar_salas")).then(() => {}, () => {});
  await entrarNaSala(codigo);
}

async function entrarComCodigo(bruto, silencioso = false) {
  const codigo = String(bruto || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(codigo)) throw new Error(t("on.errCode"));
  const nick = silencioso ? (store("nick") || "?") : nickOnline();
  await ensureOnline();
  const [{ data: r, error: erro }, lista] = await Promise.all([sb.from(tabela("salas")).select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (erro) throw erroDoBanco(erro);
  if (!r) {
    store("sala", null);
    throw new Error(t("on.errNoRoom"));
  }
  const dentro = lista.find((p) => p.user_id === me.id);
  if (!dentro) {
    if (r.status === "playing") throw new Error(t("on.errPlaying"));
    if (lista.length >= GZ_MAX_JOGADORES) throw new Error(t("on.errFull"));
    const { error } = await sb.from(tabela("sala_jogadores")).insert({ sala_code: codigo, user_id: me.id, nick, skin: gameziMinhaSkin() });
    if (error) throw /cheia|full/i.test(error.message || "") ? new Error(t("on.errFull")) : erroDoBanco(error);
  } else if (!silencioso) {
    sb.from(tabela("sala_jogadores")).update({ nick, skin: gameziMinhaSkin() }).eq("sala_code", codigo).eq("user_id", me.id).then(() => {}, () => {});
  }
  await entrarNaSala(codigo);
}

async function buscarJogadores(codigo) {
  const { data } = await sb.from(tabela("sala_jogadores")).select("*").eq("sala_code", codigo).order("joined_at");
  return data || [];
}

async function atualizarSala(codigo = sala && sala.code) {
  if (!codigo) return;
  const [{ data: r }, lista] = await Promise.all([sb.from(tabela("salas")).select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (!r) return salaFechada(t("on.closed"));
  if (!lista.some((p) => p.user_id === me.id)) return salaFechada(t("on.kicked"));
  const antes = sala && sala.host_id;
  sala = r;
  salaJogadores = lista;
  if (antes && antes !== r.host_id) {
    if (document.body.dataset.screen === "lobby") renderSala();
    if (isHost() && partida && modo === "online") {
      if (document.body.dataset.screen === "game") renderJogo();
      onlineTransmitir();
    }
  }
}

async function conferirAnfitriao() {
  if (!sala || !me || !canal || isHost() || !presentes.size || presentes.has(sala.host_id)) {
    anfitriaoSumiuEm = null;
    return;
  }
  anfitriaoSumiuEm = anfitriaoSumiuEm || Date.now();
  if (Date.now() - anfitriaoSumiuEm < AUSENTE_MS + 2000) return;
  const proximo = salaJogadores
    .filter((p) => p.user_id !== sala.host_id && (p.user_id === me.id || presentes.has(p.user_id)))
    .sort((a, b) => String(a.joined_at).localeCompare(String(b.joined_at)))[0];
  if (!proximo || proximo.user_id !== me.id) return;
  anfitriaoSumiuEm = null;
  const { data, error } = await sb.rpc(tabela("assumir_sala"), { p_code: sala.code });
  if (error || !data) return;
  await atualizarSala();
  enviar("sala");
}

function idsPresentes() {
  if (!partida) return [];
  return partida.jogadores.map((j) => j.id).filter((id) => id === meuId() || presentes.has(id) || !(sumiuEm.has(id) && Date.now() - sumiuEm.get(id) >= AUSENTE_MS));
}

function talvezRevelar() {
  if (!isHost() || !partida || modo !== "online" || partida.fim || partida.fase !== "jogando") return;
  const tempoAcabou = Date.now() - partida.comecou >= GZ.segundos(partida.rodadas[partida.n]) * 1000;
  const alguem = Object.keys(partida.respostas).length > 0;
  if ((alguem && gzOnlineTodos(partida, idsPresentes())) || tempoAcabou) {
    gzOnlineRevelar(partida, GZ.avaliar);
    onlineTransmitir();
    if (document.body.dataset.screen === "game") renderJogo();
  }
}

async function entrarNaSala(codigo) {
  await atualizarSala(codigo);
  if (!sala) return;
  store("sala", sala.code);
  conectarCanal(sala.code);
  if (sala.status !== "lobby" && sala.state) receberEstado(sala.state, true);
  else mostrarSala();
}

function salaFechada(msg) {
  sairDoCanal();
  sala = null;
  store("sala", null);
  if (modo === "online") {
    partida = null;
    modo = "livre";
  }
  abrirOnline();
  $("online-error").textContent = msg;
}

function conectarCanal(codigo) {
  sairDoCanal();
  canal = sb.channel(GZ.id + "-" + codigo, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  canal
    .on("presence", { event: "sync" }, presencaMudou)
    .on("broadcast", { event: "estado" }, ({ payload }) => receberEstado(payload.estado))
    .on("broadcast", { event: "acao" }, ({ payload }) => receberAcao(payload))
    .on("broadcast", { event: "sala" }, () => atualizarSala().then(() => document.body.dataset.screen === "lobby" && renderSala()))
    .on("broadcast", { event: "voltar" }, () => atualizarSala().then(() => sala && mostrarSala()))
    .on("broadcast", { event: "fechou" }, () => salaFechada(t("on.closed")))
    .on("broadcast", { event: "oi" }, () => isHost() && partida && modo === "online" && enviar("estado", { estado: partida }))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        canal.track({ nick: store("nick") || "" });
        enviar("sala");
        enviar("oi");
      }
    });
}

function sairDoCanal() {
  if (canal) {
    try { sb.removeChannel(canal); } catch (e) { /* já fechado */ }
  }
  canal = null;
  presentes = new Set();
}

function enviar(evento, payload = {}) {
  if (canal) canal.send({ type: "broadcast", event: evento, payload });
}

function presencaMudou() {
  if (!canal) return;
  const agora = new Set(Object.keys(canal.presenceState()));
  const chegou = [...agora].some((id) => !presentes.has(id));
  presentes.forEach((id) => { if (!agora.has(id)) sumiuEm.set(id, Date.now()); });
  agora.forEach((id) => sumiuEm.delete(id));
  const mudou = chegou || [...presentes].some((id) => !agora.has(id));
  presentes = agora;
  if (document.body.dataset.screen === "lobby" && mudou) atualizarSala().then(renderSala);
  if (chegou && isHost() && partida && modo === "online") enviar("estado", { estado: partida });
  if (mudou && document.body.dataset.screen === "game" && modo === "online") renderJogadoresOnline();
}

function onlinePresente(id) {
  return !canal || presentes.has(id) || (me && id === me.id);
}

function onlineTransmitir() {
  if (!isHost() || !partida) return;
  enviar("estado", { estado: partida });
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    if (sala && partida) sb.from(tabela("salas")).update({ state: partida, status: partida.fim ? "finished" : "playing" }).eq("code", sala.code).then(() => {}, () => {});
  }, 300);
}

function receberEstado(estado, forcar = false) {
  if (!estado || (isHost() && !forcar)) return;
  if (!forcar && partida && modo === "online" && (estado.seq || 0) < (partida.seq || 0)) return;
  const antes = modo === "online" ? partida : null;
  const nova = !antes || estado.n < antes.n || !antes.online;
  modo = "online";
  partida = estado;
  if (partida.fim) {
    if (document.body.dataset.screen !== "results" || nova) terminarOnline();
    return;
  }
  if (nova) partidaContada = false;
  if (document.body.dataset.screen !== "game") show("game");
  if (!antes || antes.n !== estado.n) rodadaDesde = performance.now() - Math.max(0, Date.now() - estado.comecou);
  renderJogo();
}

function onlineResponder(v, ms) {
  if (!partida || !me || partida.fase !== "jogando" || me.id in partida.respostas || v === null) return;
  if (isHost()) {
    gzOnlineResponder(partida, me.id, v, ms, GZ.valida);
    onlineTransmitir();
    renderJogo();
    talvezRevelar();
    return;
  }
  enviar("acao", { uid: me.id, acao: { tipo: "responder", v, ms }, rodada: partida.n });
  partida.respostas[me.id] = { v, ms };
  renderJogo();
}

function onlineProxima() {
  if (!isHost() || !partida) return;
  if (gzOnlineProxima(partida)) {
    onlineTransmitir();
    onlinePartidaAcabou();
    return terminarOnline();
  }
  rodadaDesde = performance.now();
  onlineTransmitir();
  renderJogo();
}

function receberAcao({ uid, acao, rodada: r }) {
  if (!isHost() || !partida || partida.fim || !acao || r !== partida.n) return;
  if (acao.tipo === "responder" && gzOnlineResponder(partida, uid, acao.v, acao.ms, GZ.valida)) {
    onlineTransmitir();
    if (document.body.dataset.screen === "game") renderJogo();
    talvezRevelar();
  }
}

function renderJogadoresOnline() {
  if (!partida || !partida.online) return;
  const s = partida;
  const fim = s.fase === "revelado";
  const lista = s.jogadores.map((j) => ({ ...j, resp: s.respostas[j.id], ganho: s.ganhos[j.id] }));
  if (fim) lista.sort((a, b) => (b.ganho || 0) - (a.ganho || 0));
  $("players").innerHTML = lista.map((j) => {
    let nota;
    if (!fim) nota = j.resp ? "✓ " + t("on.answered") : t("on.thinking");
    else if (!j.resp) nota = t("on.missed");
    else nota = j.ganho ? "+" + j.ganho : t("on.wrong");
    const cls = ["player", fim && j.ganho ? "ganhou" : "", !fim && j.resp ? "ok" : "", onlinePresente(j.id) ? "" : "away"].filter(Boolean).join(" ");
    return `<span class="${cls}">${gameziBoneco(j.skin || skinDe(j.id))}${escapeHtml(j.nome)}${j.id === meuId() ? " (" + escapeHtml(t("lobby.you")) + ")" : ""} <small>${escapeHtml(nota)}</small><span class="pts">${j.pontos}</span></span>`;
  }).join("");
}

function mostrarSala() {
  partida = null;
  modo = "livre";
  show("lobby");
  renderSala();
}

function renderSala() {
  if (!sala) return;
  $("room-code").textContent = sala.code;
  const host = isHost();
  $("lobby-players").innerHTML = salaJogadores.map((p) => {
    const eu = p.user_id === me.id;
    return `<div class="lobby-player ${onlinePresente(p.user_id) ? "here" : ""}"><i></i>${eu ? `<button type="button" class="skin-mini" data-minha-skin aria-label="${escapeHtml(t("lobby.you"))}">${gameziBoneco(gameziMinhaSkin())}</button>` : gameziBoneco(p.skin)}
      <b>${escapeHtml(p.nick)}${p.user_id === sala.host_id ? ` <small>· ${escapeHtml(t("lobby.host"))}</small>` : ""}${eu ? ` <small>· ${escapeHtml(t("lobby.you"))}</small>` : ""}</b>
      ${host && !eu ? `<button type="button" class="icon-btn" data-tirar="${escapeHtml(p.user_id)}" title="${escapeHtml(t("lobby.kick"))}" aria-label="${escapeHtml(t("lobby.kick"))}">${KIT_ICONES.x}</button>` : ""}
    </div>`;
  }).join("");
  $("lobby-temas-box").hidden = !GZ.temas;
  if (GZ.temas) chipsTemas($("lobby-temas"), salaTema(), (id) => mudarTemaDaSala(id).catch(onlineErro), host);
  $("lobby-qtd-box").hidden = !GZ.quantias;
  if (GZ.quantias) {
    const atual = salaQtd();
    $("lobby-qtd").innerHTML = GZ.quantias.map((n) =>
      `<button type="button" role="radio" aria-checked="${n === atual}" class="chip ${n === atual ? "active" : ""}" data-qtd="${n}" ${host ? "" : "disabled"}>${n}</button>`).join("");
    $("lobby-qtd").onclick = (e) => {
      const b = e.target.closest("[data-qtd]");
      if (b && host) mudarQtdDaSala(Number(b.dataset.qtd)).catch(onlineErro);
    };
  }
  const dono = salaJogadores.find((p) => p.user_id === sala.host_id);
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = salaJogadores.length < 2;
  $("lobby-status").textContent = host
    ? t(salaJogadores.length < 2 ? "lobby.needTwo" : "lobby.ready")
    : t("lobby.waitHost", { nome: dono ? dono.nick : "?" });
}

function salaTema() {
  return temaValido(sala && sala.settings && sala.settings.tema);
}

// Quantas rodadas na partida online (só nos jogos com GZ.quantias; nos outros, 10).
function qtdValida(n) {
  return GZ.quantias ? (GZ.quantias.includes(n) ? n : GZ.quantias[0]) : GZ_DIARIO_QTD;
}

function salaQtd() {
  return qtdValida(sala && sala.settings && sala.settings.qtd);
}

async function mudarQtdDaSala(n) {
  if (!isHost() || !GZ.quantias) return;
  store("qtd", n);
  sala.settings = { ...(sala.settings || {}), qtd: qtdValida(n) };
  renderSala();
  await sb.from(tabela("salas")).update({ settings: sala.settings }).eq("code", sala.code);
  enviar("sala");
}

async function mudarTemaDaSala(id) {
  if (!isHost() || !GZ.temas) return;
  store("tema", id);
  sala.settings = { ...(sala.settings || {}), tema: temaValido(id) };
  renderSala();
  await sb.from(tabela("salas")).update({ settings: sala.settings }).eq("code", sala.code);
  enviar("sala");
}

async function tirarDaSala(uid) {
  await sb.from(tabela("sala_jogadores")).delete().eq("sala_code", sala.code).eq("user_id", uid);
  await atualizarSala();
  renderSala();
  enviar("sala");
}

async function comecarOnline() {
  if (!isHost()) return;
  await atualizarSala();
  if (salaJogadores.length < 2) return renderSala();
  modo = "online";
  partidaRegistrada = false;
  partidaContada = false;
  partida = gzNovaOnline({ jogadores: salaJogadores.map((p) => ({ id: p.user_id, nome: p.nick, skin: p.user_id === me.id ? gameziMinhaSkin() : gameziSkinValida(p.skin) })), rodadas: GZ.online(salaTema(), salaQtd()) });
  partida.tema = salaTema();
  chaveDesenhada = "";
  rodadaDesde = performance.now();
  show("game");
  renderJogo();
  onlineTransmitir();
}

function terminarOnline() {
  if (!partida) return;
  const s = partida;
  if (!partidaContada) {
    partidaContada = true;
    const st = stats();
    st.online = (st.online || 0) + 1;
    st.partidas += 1;
    store("stats", st);
  }
  telaResultado();
  const placar = gzPlacar(s);
  const venc = placar.filter((j) => j.pos === 1);
  $("res-kicker").textContent = t("game.online") + (GZ.temas ? " · " + nomeTema(s.tema) : "");
  $("res-score").textContent = venc.length === 1 ? t("res.won", { nome: venc[0].nome }) : t("res.tie");
  $("res-sub").textContent = venc[0] ? t("res.pts", { n: fmt(venc[0].pontos) }) : "";
  $("res-again").textContent = t("res.backRoom");
  $("res-again").onclick = () => voltarParaSala().catch(onlineErro);
  $("res-home").onclick = sairDaSala;
  $("res-ranking").hidden = false;
  $("res-ranking").innerHTML = placar.map((j) =>
    `<li class="${j.pos === 1 ? "first" : ""}"><span class="pos">${j.pos}º</span>${gameziBoneco(j.skin || skinDe(j.id))}<b>${escapeHtml(j.nome)}</b><span>${escapeHtml(t("res.pts", { n: fmt(j.pontos) }))}</span></li>`).join("");
  const nome = (id) => (s.jogadores.find((j) => j.id === id) || {}).nome;
  $("res-list").innerHTML = s.hist.map((h) => {
    const quem = Object.entries(h.ganhos).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]).map(([id, p]) => `${nome(id)} +${p}`).join(", ") || "—";
    return `<li><span>${GZ.resumo(h.r)}<em>${escapeHtml(quem)}</em></span></li>`;
  }).join("");
}

function onlinePartidaAcabou() {
  if (!isHost() || partidaRegistrada || !partida) return;
  partidaRegistrada = true;
  const players = gzPlacar(partida).map((l) => ({ uid: l.id, nick: l.nome, pontos: l.pontos, pos: l.pos }));
  sb.from(tabela("partidas")).insert({ sala_code: sala.code, rodadas: partida.rodadas.length, players }).then(() => {}, () => {});
}

async function voltarParaSala() {
  if (!sala) return irInicio();
  if (isHost()) {
    await sb.from(tabela("salas")).update({ status: "lobby", state: null }).eq("code", sala.code);
    enviar("voltar");
  }
  await atualizarSala();
  if (sala) mostrarSala();
}

async function sairDaSala() {
  const codigo = sala && sala.code;
  try {
    if (codigo && isHost() && partida && modo === "online") await sb.from(tabela("salas")).update({ state: partida }).eq("code", codigo);
    const { data: novo } = codigo ? await sb.rpc(tabela("sair_da_sala"), { p_code: codigo }) : { data: null };
    if (codigo) enviar(novo ? "sala" : "fechou");
  } catch (e) { /* sai mesmo assim */ }
  sairDoCanal();
  sala = null;
  partida = null;
  modo = "livre";
  store("sala", null);
  irInicio();
}

function retomarOnline() {
  const doLink = new URLSearchParams(location.search).get("sala");
  if (doLink) {
    history.replaceState(null, "", location.pathname + location.hash);
    abrirOnline(doLink);
    if (store("nick")) ocupado($("join-room-btn"), () => entrarComCodigo(doLink, true));
    return;
  }
  const salva = store("sala");
  if (salva && onlineConfigured()) entrarComCodigo(salva, true).catch(() => store("sala", null));
}
