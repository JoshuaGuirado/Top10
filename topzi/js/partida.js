// Partida: palpites, vez de cada um, vidas, dicas e tempo por vez.

const TURN_DELAY = 950;
let game = null;

// opts.daily: número da lista do dia (joga só o jogador 1, contra a lista).
// opts.online: { roster, timer } quando este aparelho é o anfitrião de uma sala online.
function startGame(list, opts = {}) {
  const daily = opts.daily || null;
  const online = opts.online || null;
  if (!daily) {
    lastListIds = [list.id, ...lastListIds.filter((id) => id !== list.id)].slice(0, 40);
    store("recent", lastListIds);
  }
  ensurePlayers();
  const n = list.items.length;
  const vsList = !!daily || !!mode().team;
  const teams = !daily && !!mode().teams;
  const roster = daily ? [players[0]] : online ? online.roster : players.slice(0, playerCount);
  // Morte súbita: uma vida para cada um, com ou sem a opção de vidas ligada.
  const sudden = !daily && !!mode().sudden;
  const lives = daily ? 3 : sudden ? 1 : TEAM_LIVES[n] || Math.max(3, Math.round(n / 5));
  const withLives = daily || sudden ? true : online ? !!online.lives : livesOn();
  // Fora do modo equipe, cada jogador tem as próprias vidas.
  const ownLives = withLives && !vsList;
  const gamePlayers = roster.map((p, i) => ({
    name: online ? p.name : playerName(p, i), avatar: p.avatar, team: p.team, uid: online ? p.uid : null,
    score: 0, hits: [], misses: 0, passes: 0, timeouts: 0, streak: 0, bestStreak: 0, clutch: 0,
    lives: ownLives ? lives : null, out: false,
  }));
  game = {
    list,
    items: parseList(list, learnedFor(list.id)),
    found: new Map(),
    tried: new Set(),
    wrongLog: [],
    hints: new Set(),
    hintMode: false,
    players: gamePlayers,
    // No modo Times a vez alterna entre os times, e cada time reveza os próprios jogadores.
    members: teams ? [0, 1].map((tm) => gamePlayers.map((p, i) => (p.team === tm ? i : -1)).filter((i) => i >= 0)) : null,
    nextOf: [0, 0],
    turn: 0,
    passStreak: 0,
    busy: false,
    over: false,
    vsList,
    teams,
    daily,
    dailyCounts: !!opts.counts,
    livesOn: withLives,
    ownLives,
    lives: vsList && withLives ? lives : null,
    maxLives: lives,
    timeLimit: daily ? 0 : online ? online.timer : turnTime,
    timeLeft: 0,
    turnSeq: 0,
    endTimer: null,
    online: !!online,
    isHost: !!online,
    gid: online ? Math.random().toString(36).slice(2, 10) : null,
    me: 0,
  };
  if (online) game.me = gamePlayers.findIndex((p) => p.uid === myId());
  if (teams) game.turn = takeNext(0);

  setupGameScreen();
  setFeedback("", "");
  show("game");
  renderGame();
  startTurnTimer();
  focusGuess();
}

function setupGameScreen() {
  const list = game.list;
  const cat = categoryOf(list);
  const tag = (game.daily ? ` · ${t("daily.tag", { n: game.daily })}` : game.vsList ? ` · ${t("mode.equipe.name")}` : game.teams ? ` · ${t("mode.times.name")}` : "") + (game.online ? " · Online" : "");
  $("game-cat").innerHTML = `${icon(cat.id)}${escapeHtml(catLabel(cat))} · ${t("game.items", { n: list.items.length })}${tag}`;
  $("game-title").textContent = listTitle(list);
  $("source").textContent = t("game.source", { src: listSource(list) });
}

// Online, cada aparelho só joga na vez do próprio jogador.
function myTurn() {
  return !game.online || game.turn === game.me;
}

// Próximo do time que ainda está no jogo (quem ficou sem vidas é pulado).
function takeNext(team) {
  const list = game.members[team].filter((i) => !game.players[i].out);
  if (!list.length) return null;
  const idx = list[game.nextOf[team] % list.length];
  game.nextOf[team] += 1;
  return idx;
}

function nextPlayerIndex() {
  if (game.teams) {
    const other = 1 - game.players[game.turn].team;
    const next = takeNext(other);
    return next !== null ? next : takeNext(1 - other);
  }
  for (let k = 1; k <= game.players.length; k++) {
    const i = (game.turn + k) % game.players.length;
    if (!game.players[i].out) return i;
  }
  return game.turn;
}

function activePlayers() {
  return game.players.filter((p) => !p.out).length;
}

// Pontos da equipe e da lista: o que ninguém achou fica com a lista.
function teamTally() {
  const n = game.items.length;
  const total = (n * (n + 1)) / 2;
  const team = game.players.reduce((sum, p) => sum + p.score, 0);
  return { total, team, list: total - team, goal: Math.floor(total / 2) + 1 };
}

function teamTotals() {
  const totals = [0, 0];
  game.players.forEach((p) => (totals[p.team] += p.score));
  return totals;
}

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>';

function renderVersus() {
  const vs = $("versus");
  vs.hidden = !game.vsList && !game.teams;
  vs.className = "versus" + (game.teams ? " duel" : "");
  if (game.teams) {
    const [a, b] = teamTotals();
    const tally = teamTally();
    const share = a + b ? (a / (a + b)) * 100 : 50;
    vs.innerHTML = `
      <div class="vs-side t0"><span class="vs-label">${teamName(0)}</span><b class="vs-pts">${a}</b></div>
      <div class="vs-mid">
        <div class="vs-bar duel"><span style="width:${share}%"></span></div>
        <p class="vs-goal">${t("game.listLeft", { n: tally.list })}</p>
      </div>
      <div class="vs-side list t1"><span class="vs-label">${teamName(1)}</span><b class="vs-pts">${b}</b></div>`;
    return;
  }
  if (!game.vsList) return;
  const tally = teamTally();
  const left = tally.goal - tally.team;
  const hearts = Array.from({ length: game.maxLives }, (_, i) => `<span class="heart${i < game.lives ? "" : " lost"}">${HEART}</span>`).join("");
  vs.innerHTML = `
    <div class="vs-side"><span class="vs-label">${game.players.length > 1 ? t("game.team") : t("game.you")}</span><b class="vs-pts">${tally.team}</b></div>
    <div class="vs-mid">
      <div class="vs-bar"><span style="width:${(tally.team / tally.total) * 100}%"></span><i></i></div>
      <p class="vs-goal">${left > 0 ? t("game.toWin", { n: left }) : t("game.listBeaten")}</p>
    </div>
    <div class="vs-side list"><span class="vs-label">${t("game.list")}</span><b class="vs-pts">${tally.list}</b></div>
    ${game.livesOn ? `<div class="lives" role="img" aria-label="${t("game.livesOf", { a: game.lives, b: game.maxLives })}">${hearts}<span class="lives-label">${t("game.lives", { n: game.lives })}</span></div>` : ""}`;
}

function canHint() {
  return game.vsList && game.livesOn && !game.over && !game.busy && game.lives > 1 &&
    game.items.some((_, i) => !game.found.has(i) && !game.hints.has(i));
}

function renderGame() {
  const n = game.items.length;
  renderVersus();

  const sb = $("scoreboard");
  sb.innerHTML = "";
  game.players.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "score-chip" + (i === game.turn && !game.over ? " current" : "") + (game.teams ? ` t${p.team}` : "") + (p.out ? " out" : "");
    el.dataset.player = i;
    el.innerHTML = `<div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="score-info"><span class="score-name">${escapeHtml(p.name)}</span>
      <span class="score-sub">${p.out ? t("game.out") : t("game.hits", { n: p.hits.length })}${game.ownLives && !p.out ? ` <span class="chip-lives" aria-label="${t("game.lives", { n: p.lives })}">${p.lives <= 5 ? HEART.repeat(p.lives) : `${HEART}${p.lives}`}</span>` : ""}</span></div>
      <span class="score-pts">${p.score}</span>`;
    sb.appendChild(el);
  });

  const cur = game.players[game.turn];
  $("turn-avatar").innerHTML = renderAvatar(cur.avatar);
  $("turn-name").textContent = cur.name;
  $("turn-label").textContent = game.teams ? `${t("game.turnOf")} · ${teamName(cur.team)}` : t("game.turnOf");
  $("turn").className = "turn" + (game.over ? " hidden" : "") + (game.teams ? ` t${cur.team}` : "");
  if (game.over) $("turn-timer").hidden = true;
  $("progress").textContent = t("game.found", { a: game.found.size, b: n });

  const reveal = game.over;
  const board = $("board");
  board.classList.toggle("big", n > 10);
  board.classList.toggle("picking", game.hintMode);
  board.style.setProperty("--rows", Math.ceil(n / 2));
  board.innerHTML = "";
  game.items.forEach((item, i) => {
    const li = document.createElement("li");
    li.dataset.index = i;
    const who = game.found.get(i);
    if (who !== undefined) {
      const p = game.players[who];
      li.className = "slot found" + (game.teams ? ` t${p.team}` : "");
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span><span class="slot-who" title="${escapeHtml(p.name)}">${renderAvatar(p.avatar)}</span><span class="pts">+${i + 1}</span>`;
    } else if (reveal) {
      li.className = "slot missed";
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span><span class="pts">${i + 1} pts</span>`;
    } else {
      const hinted = game.hints.has(i);
      li.className = "slot" + (game.hintMode && !hinted ? " pickable" : "");
      if (game.hintMode && !hinted) li.tabIndex = 0;
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name">${hinted ? `<span class="hint">${escapeHtml(hintFor(item.name))}</span>` : '<span class="hidden-name"></span>'}</span><span class="pts">${i + 1} pts</span>`;
    }
    board.appendChild(li);
  });

  $("wrong-guesses").textContent = game.wrongLog.length ? t("game.wrong") + " " + game.wrongLog.map((w) => w.text).join(", ") : "";

  const disabled = game.busy || game.over || !myTurn();
  $("guess").disabled = disabled;
  $("guess").placeholder = myTurn() || game.over ? t("game.guessPh") : t("game.waitTurn", { nome: cur.name });
  $("guess-form").querySelector("button").disabled = disabled;
  $("pass-btn").hidden = game.players.length === 1;
  $("pass-btn").disabled = disabled;
  $("hint-btn").hidden = !game.vsList || !game.livesOn;
  $("hint-btn").disabled = !myTurn() || (!game.hintMode && !canHint());
  $("hint-btn").textContent = game.hintMode ? t("game.hintCancel") : t("game.hintBtn");
  $("end-btn").hidden = game.online && !game.isHost;
  if (game.online) onlineAfterRender();
}

// msg: [[chave, variáveis, índice da frase]…] (ver tMsg em js/i18n.js). Online, a mensagem
// viaja assim e cada aparelho mostra no próprio idioma.
function setFeedback(msg, kind) {
  if (game) game.feedback = { msg, kind };
  paintFeedback(msg, kind);
}

// Só pinta a mensagem neste aparelho (sem mandar para os outros jogadores online).
function paintFeedback(msg, kind) {
  const f = $("feedback");
  f.className = "feedback " + kind;
  f.textContent = tMsg(msg);
}

const randomIndex = (key) => Math.floor(Math.random() * tList(key).length);

function focusGuess() {
  if (game && !game.over && !game.busy) setTimeout(() => $("guess").focus({ preventScroll: true }), 50);
}

function handleGuess(raw) {
  if (!game || game.over || game.busy) return;
  const text = raw.trim();
  if (!text) return;
  game.hintMode = false;
  const result = matchGuess(game.items, game.found, text);

  if (result && result.dup !== undefined) {
    const who = game.players[game.found.get(result.dup)];
    setFeedback([["fb.dup", { item: ["@item", result.dup], nome: who.name }]], "info");
    shake($("guess-form"));
    renderGame();
    return;
  }

  if (!result) {
    const key = normalize(text);
    if (game.tried.has(key)) {
      setFeedback([["fb.tried", { text }]], "info");
      shake($("guess-form"));
      renderGame();
      return;
    }
    return registerMiss([["fb.notIn", { text }]], { text, key });
  }

  scoreHit(result.index, game.turn);
  nextTurn();
}

function scoreHit(i, who) {
  const p = game.players[who];
  const pts = i + 1;
  const ratio = pts / game.items.length;
  game.found.set(i, who);
  p.score += pts;
  p.hits.push(pts);
  p.streak += 1;
  p.bestStreak = Math.max(p.bestStreak, p.streak);
  if (game.vsList && game.lives === 1) p.clutch += 1;
  game.passStreak = 0;
  const tier = ratio >= 0.7 ? "high" : ratio >= 0.35 ? "mid" : "low";
  const msg = [["hype." + tier, {}, randomIndex("hype." + tier)]];
  const vars = { item: ["@item", i], n: pts, nome: p.name };
  msg.push(game.teams ? ["fb.hitTeam", { ...vars, team: ["team." + p.team] }] : ["fb.hit", vars]);
  if (p.streak >= 3) msg.push(["streak", { nome: p.name, n: p.streak }, randomIndex("streak")]);
  setFeedback(msg, tier === "high" || p.streak >= 3 ? "epic" : "good");
  renderGame();
  hitEffects(i, who);
}

// Animação e som de um acerto (online, os outros aparelhos repetem ao receber o lance).
function hitEffects(i, who) {
  const pts = i + 1;
  const ratio = pts / game.items.length;
  const slot = $("board").querySelector(`[data-index="${i}"]`);
  if (!slot) return;
  slot.classList.add("reveal");
  slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
  const r = slot.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, Math.round(20 + ratio * 80));
  floatText(slot, `+${pts}`, ratio >= 0.7 ? "epic" : "");
  sfx.right(ratio);
  if (ratio >= 0.7) flash("flash-epic");
  if (game.players[who].streak >= 3) floatText($("scoreboard").querySelector(`[data-player="${who}"]`), t("fx.streak", { n: game.players[who].streak }), "streak");
}

function missEffects(who, timeout) {
  sfx.wrong();
  flash("flash-bad");
  shake($("guess-form"));
  const chip = $("scoreboard").querySelector(`[data-player="${who}"]`);
  shake(chip);
  floatText(chip, timeout ? t("fx.time") : t("fx.miss"), "bad");
}

function lifeEffects() {
  shake($("versus"));
  floatText($("versus").querySelector(".lives"), t("fx.life"), "bad");
}

// Erro (palpite fora da lista) ou tempo esgotado (wrong = null).
function registerMiss(message, wrong) {
  const who = game.turn;
  const p = game.players[who];
  stopTurnTimer();
  if (wrong) {
    game.tried.add(wrong.key);
    game.wrongLog.push({ text: wrong.text, player: who });
  }
  p.misses += 1;
  p.streak = 0;
  game.passStreak = 0;
  missEffects(who, !wrong);
  const pass = game.players.length > 1 ? [["fb.pass"]] : [];
  let tail = pass;

  if (game.vsList && game.livesOn) {
    game.lives -= 1;
    renderVersus();
    lifeEffects();
    if (game.lives <= 0) return endGame([...message, [game.players.length > 1 ? "fb.noLivesTeam" : "fb.noLives"]]);
    tail = [["fb.livesLeft", { n: game.lives }], ...pass];
  } else if (game.ownLives) {
    p.lives -= 1;
    if (p.lives <= 0) {
      p.out = true;
      if (!activePlayers()) return endGame([...message, [game.players.length > 1 ? "fb.allOut" : "fb.noLives"]]);
      tail = [["fb.playerOut", { nome: p.name }]];
    } else {
      tail = [["fb.playerLives", { nome: p.name, n: p.lives }], ...pass];
    }
  }
  setFeedback([...message, ...tail], "bad");
  nextTurn();
}

function nextTurn() {
  stopTurnTimer();
  if (game.found.size === game.items.length) return endGame([["fb.allFound", { n: game.items.length }]]);
  game.busy = true;
  renderGame();
  const g = game;
  setTimeout(() => {
    if (game !== g || g.over) return;
    g.turn = nextPlayerIndex();
    g.turnSeq += 1;
    g.busy = false;
    $("guess").value = "";
    renderGame();
    if (g.players.length > 1) {
      sfx.tick();
      $("turn").classList.remove("pop");
      void $("turn").offsetWidth;
      $("turn").classList.add("pop");
    }
    startTurnTimer();
    focusGuess();
  }, game.players.length > 1 ? TURN_DELAY : 350);
}

function passTurn() {
  if (!game || game.over || game.busy) return;
  game.hintMode = false;
  const p = game.players[game.turn];
  p.passes += 1;
  p.streak = 0;
  game.passStreak += 1;
  if (game.passStreak >= activePlayers()) {
    return endGame([[game.vsList ? "fb.allPassTeam" : "fb.allPass"]]);
  }
  setFeedback([["fb.passed", { nome: p.name }]], "info");
  nextTurn();
}

function endGame(reason) {
  if (!game || game.over) return;
  game.over = true;
  game.busy = false;
  game.hintMode = false;
  stopTurnTimer();
  setFeedback(reason, "info");
  renderGame();
  game.endTimer = setTimeout(showResults, 1300);
}

// ───────────── tempo por vez (modo relâmpago) ─────────────

let timerHandle = null;

function startTurnTimer() {
  stopTurnTimer();
  if (!game.timeLimit || game.over) {
    $("turn-timer").hidden = true;
    return;
  }
  game.timeLeft = game.timeLimit * 1000;
  resumeTurnTimer();
}

function resumeTurnTimer() {
  if (!game || !game.timeLimit || game.over || game.busy || timerHandle || game.timeLeft <= 0) return;
  $("turn-timer").hidden = false;
  let last = performance.now();
  let lastSec = Math.ceil(game.timeLeft / 1000);
  renderTimer();
  timerHandle = setInterval(() => {
    const now = performance.now();
    game.timeLeft -= now - last;
    last = now;
    const sec = Math.ceil(game.timeLeft / 1000);
    if (sec !== lastSec && sec > 0 && sec <= 5) sfx.clock();
    lastSec = sec;
    renderTimer();
    if (game.timeLeft <= 0) {
      stopTurnTimer();
      timeUp();
    }
  }, 100);
}

function stopTurnTimer() {
  clearInterval(timerHandle);
  timerHandle = null;
}

function renderTimer() {
  const el = $("turn-timer");
  const left = Math.max(0, game.timeLeft);
  el.querySelector("span").style.width = (left / (game.timeLimit * 1000)) * 100 + "%";
  el.querySelector("b").textContent = Math.ceil(left / 1000) + "s";
  el.classList.toggle("low", left <= 5000);
}

function timeUp() {
  if (!game || game.over || game.busy) return;
  game.hintMode = false;
  const p = game.players[game.turn];
  p.timeouts += 1;
  registerMiss([["fb.timeUp", { nome: p.name }]], null);
}

// ───────────── dicas (equipe contra a lista) ─────────────

function toggleHintMode() {
  if (!game || game.over || game.busy || !myTurn()) return;
  if (!game.hintMode && !canHint()) return;
  game.hintMode = !game.hintMode;
  renderGame();
  if (game.hintMode) paintFeedback([["fb.hintPick"]], "info");
  else paintFeedback((game.feedback || {}).msg || "", (game.feedback || {}).kind || "");
}

function useHint(i) {
  if (!game || !game.hintMode || game.found.has(i) || game.hints.has(i)) return;
  game.hintMode = false;
  game.hints.add(i);
  game.lives -= 1;
  sfx.hint();
  setFeedback([["fb.hint", { n: i + 1, hint: ["@hint", i] }], ["fb.livesLeft", { n: game.lives }]], "info");
  renderGame();
  floatText($("versus").querySelector(".lives"), t("fx.life"), "bad");
  focusGuess();
}
