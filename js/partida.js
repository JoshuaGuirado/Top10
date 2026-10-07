// Partida: palpites, vez de cada um, vidas, dicas, tempo por vez e "Aceitar mesmo assim".

const TURN_DELAY = 950;
let game = null;

// opts.daily: número da lista do dia (joga só o jogador 1, contra a lista).
function startGame(list, opts = {}) {
  const daily = opts.daily || null;
  if (!daily) {
    lastListIds = [list.id, ...lastListIds.filter((id) => id !== list.id)].slice(0, 40);
    store("recent", lastListIds);
  }
  ensurePlayers();
  const n = list.items.length;
  const vsList = !!daily || !!mode().team;
  const teams = !daily && !!mode().teams;
  const roster = daily ? [players[0]] : players.slice(0, playerCount);
  const lives = daily ? 3 : TEAM_LIVES[n] || Math.max(3, Math.round(n / 5));
  const gamePlayers = roster.map((p, i) => ({
    name: playerName(p, i), avatar: p.avatar, team: p.team, score: 0, hits: [], misses: 0, passes: 0, timeouts: 0,
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
    members: teams ? [0, 1].map((t) => gamePlayers.map((p, i) => (p.team === t ? i : -1)).filter((i) => i >= 0)) : null,
    nextOf: [0, 0],
    turn: 0,
    passStreak: 0,
    busy: false,
    over: false,
    vsList,
    teams,
    daily,
    dailyCounts: !!opts.counts,
    lives,
    maxLives: lives,
    timeLimit: daily ? 0 : turnTime,
    timeLeft: 0,
    lastWrong: null,
    endTimer: null,
  };
  if (teams) game.turn = takeNext(0);

  const cat = categoryOf(list);
  const tag = daily ? ` · Lista do dia #${daily}` : vsList ? " · Equipe contra a lista" : teams ? " · Times" : "";
  $("game-cat").innerHTML = `${icon(cat.id)}${escapeHtml(cat.label)} · ${n} itens${tag}`;
  $("game-title").textContent = list.title;
  $("source").textContent = `Fonte: ${list.source}`;
  setFeedback("", "");
  show("game");
  renderGame();
  startTurnTimer();
  focusGuess();
}

function takeNext(team) {
  const list = game.members[team];
  const idx = list[game.nextOf[team] % list.length];
  game.nextOf[team] += 1;
  return idx;
}

function nextPlayerIndex() {
  if (game.teams) return takeNext(1 - game.players[game.turn].team);
  return (game.turn + 1) % game.players.length;
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
    const t = teamTally();
    const share = a + b ? (a / (a + b)) * 100 : 50;
    vs.innerHTML = `
      <div class="vs-side t0"><span class="vs-label">${TEAM_NAMES[0]}</span><b class="vs-pts">${a}</b></div>
      <div class="vs-mid">
        <div class="vs-bar duel"><span style="width:${share}%"></span></div>
        <p class="vs-goal">${t.list} pts ainda na lista</p>
      </div>
      <div class="vs-side list t1"><span class="vs-label">${TEAM_NAMES[1]}</span><b class="vs-pts">${b}</b></div>`;
    return;
  }
  if (!game.vsList) return;
  const t = teamTally();
  const left = t.goal - t.team;
  const hearts = Array.from({ length: game.maxLives }, (_, i) => `<span class="heart${i < game.lives ? "" : " lost"}">${HEART}</span>`).join("");
  vs.innerHTML = `
    <div class="vs-side"><span class="vs-label">${game.players.length > 1 ? "Equipe" : "Você"}</span><b class="vs-pts">${t.team}</b></div>
    <div class="vs-mid">
      <div class="vs-bar"><span style="width:${(t.team / t.total) * 100}%"></span><i></i></div>
      <p class="vs-goal">${left > 0 ? `Faltam ${left} pts para vencer a lista` : "A lista já foi vencida!"}</p>
    </div>
    <div class="vs-side list"><span class="vs-label">Lista</span><b class="vs-pts">${t.list}</b></div>
    <div class="lives" role="img" aria-label="${game.lives} de ${game.maxLives} vidas">${hearts}<span class="lives-label">${plural(game.lives, "vida", "vidas")}</span></div>`;
}

function canHint() {
  return game.vsList && !game.over && !game.busy && game.lives > 1 &&
    game.items.some((_, i) => !game.found.has(i) && !game.hints.has(i));
}

function renderGame() {
  const n = game.items.length;
  renderVersus();

  const sb = $("scoreboard");
  sb.innerHTML = "";
  game.players.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "score-chip" + (i === game.turn && !game.over ? " current" : "") + (game.teams ? ` t${p.team}` : "");
    el.dataset.player = i;
    el.innerHTML = `<div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="score-info"><span class="score-name">${escapeHtml(p.name)}</span>
      <span class="score-sub">${plural(p.hits.length, "acerto", "acertos")}</span></div>
      <span class="score-pts">${p.score}</span>`;
    sb.appendChild(el);
  });

  const cur = game.players[game.turn];
  $("turn-avatar").innerHTML = renderAvatar(cur.avatar);
  $("turn-name").textContent = cur.name;
  $("turn-label").textContent = game.teams ? `Vez de · ${TEAM_NAMES[cur.team]}` : "Vez de";
  $("turn").className = "turn" + (game.over ? " hidden" : "") + (game.teams ? ` t${cur.team}` : "");
  if (game.over) $("turn-timer").hidden = true;
  $("progress").textContent = `Encontrados: ${game.found.size} de ${n}`;

  // Com o "Aceitar mesmo assim" ainda aberto, a lista não é revelada.
  const reveal = game.over && !game.lastWrong;
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

  $("wrong-guesses").textContent = game.wrongLog.length ? "Chutes errados: " + game.wrongLog.map((w) => w.text).join(", ") : "";

  const disabled = game.busy || game.over;
  $("guess").disabled = disabled;
  $("guess-form").querySelector("button").disabled = disabled;
  $("pass-btn").hidden = game.players.length === 1;
  $("pass-btn").disabled = disabled;
  $("hint-btn").hidden = !game.vsList;
  $("hint-btn").disabled = !game.hintMode && !canHint();
  $("hint-btn").textContent = game.hintMode ? "Cancelar dica" : "Dica (−1 vida)";
}

function setFeedback(text, kind, action = null) {
  const f = $("feedback");
  f.className = "feedback " + kind;
  f.textContent = text;
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "feedback-action";
    b.textContent = action.label;
    b.addEventListener("click", action.onClick);
    f.append(" ", b);
  }
}

function focusGuess() {
  if (game && !game.over && !game.busy) setTimeout(() => $("guess").focus({ preventScroll: true }), 50);
}

const HYPE = {
  low: ["Esse era fácil, hein.", "O óbvio também conta.", "Pontinho garantido.", "Começou pelo básico."],
  mid: ["Boa!", "Mandou bem!", "Lâmpada acesa!", "Isso aí!", "Tá esperto!"],
  high: ["Que isso?!", "Ninguém esperava essa!", "Gênio detectado!", "Tirou da cartola!", "Esse ninguém lembrava!"],
};

function handleGuess(raw) {
  if (!game || game.over || game.busy) return;
  const text = raw.trim();
  if (!text) return;
  game.hintMode = false;
  const result = matchGuess(game.items, game.found, text);

  if (result && result.dup !== undefined) {
    const who = game.players[game.found.get(result.dup)];
    setFeedback(`${game.items[result.dup].name} já foi encontrado por ${who.name}. Tente outro!`, "info");
    shake($("guess-form"));
    renderGame();
    return;
  }

  if (!result) {
    const key = normalize(text);
    if (game.tried.has(key)) {
      setFeedback(`"${text}" já foi tentado. Tente outro!`, "info");
      shake($("guess-form"));
      renderGame();
      return;
    }
    game.lastWrong = null;
    return registerMiss(`"${text}" não está na lista.`, { text, key });
  }

  game.lastWrong = null;
  scoreHit(result.index, game.turn);
  nextTurn();
}

function scoreHit(i, who, lead = null) {
  const p = game.players[who];
  const pts = i + 1;
  const ratio = pts / game.items.length;
  game.found.set(i, who);
  p.score += pts;
  p.hits.push(pts);
  game.passStreak = 0;
  renderGame();

  const slot = $("board").querySelector(`[data-index="${i}"]`);
  slot.classList.add("reveal");
  slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
  const r = slot.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, Math.round(20 + ratio * 80));
  floatText(slot, `+${pts}`, ratio >= 0.7 ? "epic" : "");
  sfx.right(ratio);
  const tier = ratio >= 0.7 ? "high" : ratio >= 0.35 ? "mid" : "low";
  if (tier === "high") flash("flash-epic");
  const forWho = game.teams ? `${p.name} (${TEAM_NAMES[p.team]})` : p.name;
  setFeedback(`${lead || pick(HYPE[tier])} ${game.items[i].name} é o nº ${pts}: +${pts} para ${forWho}.`, tier === "high" ? "epic" : "good");
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
  game.passStreak = 0;
  sfx.wrong();
  flash("flash-bad");
  shake($("guess-form"));
  const chip = $("scoreboard").querySelector(`[data-player="${who}"]`);
  shake(chip);
  floatText(chip, wrong ? "errou" : "tempo!", "bad");
  const action = wrong ? { label: "Aceitar mesmo assim", onClick: openContest } : null;
  let tail = game.players.length > 1 ? " Passa a vez." : "";

  if (game.vsList) {
    game.lives -= 1;
    renderVersus();
    shake($("versus"));
    floatText($("versus").querySelector(".lives"), "-1 vida", "bad");
    if (wrong) game.lastWrong = { ...wrong, player: who, lostLife: true };
    if (game.lives <= 0) return endGame(`${message} Acabaram as vidas${game.players.length > 1 ? " da equipe" : ""}!`, action);
    tail = ` ${game.lives === 1 ? "Resta 1 vida!" : `Restam ${game.lives} vidas.`}${tail}`;
  } else if (wrong) {
    game.lastWrong = { ...wrong, player: who, lostLife: false };
  }
  setFeedback(message + tail, "bad", action);
  nextTurn();
}

function nextTurn() {
  stopTurnTimer();
  if (game.found.size === game.items.length) return endGame(`Todos os ${game.items.length} foram encontrados!`);
  game.busy = true;
  renderGame();
  const g = game;
  setTimeout(() => {
    if (game !== g || g.over) return;
    g.turn = nextPlayerIndex();
    g.busy = false;
    $("guess").value = "";
    renderGame();
    if (g.players.length > 1) {
      sfx.tick();
      $("turn").classList.remove("pop");
      void $("turn").offsetWidth;
      $("turn").classList.add("pop");
    }
    // Se o "Aceitar mesmo assim" estiver aberto, o relógio só começa quando ele fechar.
    if ($("contest-dialog").open) g.timeLeft = g.timeLimit * 1000;
    else startTurnTimer();
    focusGuess();
  }, game.players.length > 1 ? TURN_DELAY : 350);
}

function passTurn() {
  if (!game || game.over || game.busy) return;
  game.lastWrong = null;
  game.hintMode = false;
  const p = game.players[game.turn];
  p.passes += 1;
  game.passStreak += 1;
  if (game.passStreak >= game.players.length) {
    return endGame(game.vsList ? "A equipe toda passou a vez. A lista fica com o resto!" : "Todo mundo passou a vez. Ninguém lembra de mais nenhum!");
  }
  setFeedback(`${p.name} passou a vez.`, "info");
  nextTurn();
}

function endGame(reason, action = null) {
  if (!game || game.over) return;
  game.over = true;
  game.busy = false;
  game.hintMode = false;
  stopTurnTimer();
  setFeedback(reason, "info", action);
  renderGame();
  // Com "Aceitar mesmo assim" na tela, o pódio espera um pouco mais.
  game.endTimer = setTimeout(showResults, action ? 3500 : 1300);
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
  game.lastWrong = null;
  game.hintMode = false;
  const p = game.players[game.turn];
  p.timeouts += 1;
  registerMiss(`Acabou o tempo de ${p.name}!`, null);
}

// ───────────── dicas (equipe contra a lista) ─────────────

function toggleHintMode() {
  if (!game || game.over || game.busy) return;
  if (!game.hintMode && !canHint()) return;
  game.hintMode = !game.hintMode;
  renderGame();
  if (game.hintMode) setFeedback("Toque num item escondido para ver a primeira letra. Custa 1 vida.", "info");
  else setFeedback("", "");
}

function useHint(i) {
  if (!game || !game.hintMode || game.found.has(i) || game.hints.has(i)) return;
  game.hintMode = false;
  game.hints.add(i);
  game.lives -= 1;
  sfx.hint();
  renderGame();
  setFeedback(`Dica do nº ${i + 1}: ${hintFor(game.items[i].name)}. ${game.lives === 1 ? "Resta 1 vida." : `Restam ${game.lives} vidas.`}`, "info");
  floatText($("versus").querySelector(".lives"), "-1 vida", "bad");
  focusGuess();
}

// ───────────── aceitar mesmo assim ─────────────
// Quando o grupo concorda que o palpite estava certo (faltava um apelido na lista).

function openContest() {
  const w = game && game.lastWrong;
  if (!w) return;
  stopTurnTimer();
  if (game.over) {
    clearTimeout(game.endTimer);
    game.endTimer = null;
  }
  $("contest-text").textContent = `Qual item da lista é "${w.text}"? Decidam juntos: os itens abaixo ficam visíveis para quem olhar.`;
  renderContestOptions(rankCandidates(game.items, game.found, w.text, 3));
  $("contest-all").hidden = false;
  $("contest-dialog").showModal();
}

function renderContestOptions(indices) {
  const wrap = $("contest-options");
  wrap.innerHTML = "";
  indices.forEach((i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "contest-option";
    b.innerHTML = `<span class="rank">${i + 1}</span><span>${escapeHtml(game.items[i].name)}</span>`;
    b.addEventListener("click", () => acceptGuess(i));
    wrap.appendChild(b);
  });
}

function showAllContestOptions() {
  renderContestOptions(game.items.map((_, i) => i).filter((i) => !game.found.has(i)));
  $("contest-all").hidden = true;
}

function acceptGuess(i) {
  const w = game.lastWrong;
  if (!w) return;
  game.lastWrong = null;
  const p = game.players[w.player];
  p.misses -= 1;
  const k = game.wrongLog.map((x) => x.text).lastIndexOf(w.text);
  if (k >= 0) game.wrongLog.splice(k, 1);
  game.tried.delete(w.key);
  if (w.lostLife) game.lives += 1;
  learnAnswer(game.list.id, i, w.key);
  game.items[i].exact.push(w.key);
  game.items[i].stems.push(stem(w.key));
  const revived = game.over;
  game.over = false;
  $("contest-dialog").close();
  scoreHit(i, w.player, "Aceito!");
  if (game.found.size === game.items.length) return endGame(`Todos os ${game.items.length} foram encontrados!`);
  if (revived) nextTurn();
  else if (!game.busy) {
    resumeTurnTimer();
    focusGuess();
  }
}

function onContestClosed() {
  if (!game) return;
  if (game.over) {
    if (!game.endTimer) game.endTimer = setTimeout(showResults, 500);
  } else {
    resumeTurnTimer();
    focusGuess();
  }
}
