// Jogadores: quantidade, nickname, skin, time (no modo Times) e tempo por vez.

const MAX_PLAYERS = 8;
function teamName(i) {
  return t("team." + i);
}
const TIMER_OPTIONS = [0, 15, 30, 60];

let playerCount = store("count") || 2;
let players = store("players") || [];
let turnTime = TIMER_OPTIONS.includes(store("timer")) ? store("timer") : 0;

// Com vidas ou sem vidas, guardado por modo (a equipe começa com vidas; os outros, sem).
function livesOn(id = modeId) {
  if (MODES[id].sudden) return true; // morte súbita: sempre uma vida
  const saved = (store("vidas") || {})[id];
  return saved === undefined ? !!MODES[id].team : !!saved;
}

function setLivesOn(on, id = modeId) {
  store("vidas", { ...(store("vidas") || {}), [id]: on });
}

function livesText(teamMode) {
  const counts = t("opt.livesCounts", { a: TEAM_LIVES[10], b: TEAM_LIVES[30], c: TEAM_LIVES[50] });
  return t(teamMode ? "opt.livesTeam" : "opt.livesOwn", { counts });
}

function ensurePlayers() {
  while (players.length < MAX_PLAYERS) {
    const used = players.map((p) => p.presetId);
    const free = PRESETS.filter((p) => !used.includes(p.id));
    const preset = pick(free.length ? free : PRESETS);
    players.push({ nick: "", presetId: preset.id, avatar: { ...preset.cfg } });
  }
  players.forEach((p, i) => { if (p.team !== 0 && p.team !== 1) p.team = i % 2; });
}

function playerName(p, i) {
  return p.nick.trim() || t("players.player", { n: i + 1 });
}

function savePlayers() {
  store("players", players);
}

// Quantos jogadores há em cada time, entre os que vão jogar.
function teamSizes() {
  const sizes = [0, 0];
  players.slice(0, playerCount).forEach((p) => sizes[p.team]++);
  return sizes;
}

function modeLabel(n) {
  if (mode().team) return n === 1 ? t("label.teamSolo") : t("label.team", { n });
  if (mode().teams) {
    const [a, b] = teamSizes();
    if (!a || !b) return t("label.teamsEmpty");
    return `${teamName(0)}: ${t("players.n", { n: a })} · ${teamName(1)}: ${t("players.n", { n: b })}. ${t("label.teamsTap")}`;
  }
  if (n === 1) return t("label.solo");
  if (n === 2) return t("label.1v1");
  return t("label.ffa", { n });
}

function renderCountPicker() {
  const min = mode().min || 1;
  if (playerCount < min) playerCount = min;
  const wrap = $("count-picker");
  wrap.innerHTML = "";
  for (let n = 1; n <= MAX_PLAYERS; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "count" + (n === playerCount ? " active" : "");
    b.disabled = n < min;
    const sub = mode().teams ? (n % 2 ? `${Math.ceil(n / 2)}v${Math.floor(n / 2)}` : `${n / 2}v${n / 2}`) : n === 1 ? "Solo" : n === 2 && !mode().team ? "1v1" : t("players.count", { n });
    b.innerHTML = `<b>${n}</b><span>${n < min ? "—" : sub}</span>`;
    b.addEventListener("click", () => {
      playerCount = n;
      store("count", n);
      renderPlayersScreen();
    });
    wrap.appendChild(b);
  }
  const label = $("mode-label");
  label.textContent = modeLabel(playerCount);
  const [a, b] = teamSizes();
  label.classList.toggle("bad", !!mode().teams && (!a || !b));
}

function renderTimerChips() {
  const wrap = $("timer-chips");
  wrap.innerHTML = "";
  TIMER_OPTIONS.forEach((s) => {
    wrap.appendChild(chipButton(s ? t("opt.seconds", { n: s }) : t("opt.noLimit"), null, s === turnTime, () => {
      turnTime = s;
      store("timer", s);
      renderTimerChips();
    }));
  });
  $("timer-help").textContent = turnTime ? t(livesOn() ? "opt.timerHelpLives" : "opt.timerHelp", { n: turnTime }) : t("opt.timerOff");
  renderOptsSummary();
}

function renderLivesChips() {
  const wrap = $("lives-chips");
  wrap.innerHTML = "";
  wrap.hidden = !!mode().sudden;
  if (mode().sudden) {
    $("lives-help").textContent = t("opt.sudden");
    return renderOptsSummary();
  }
  [[false, t("opt.noLives")], [true, t("opt.withLives")]].forEach(([on, label]) => {
    wrap.appendChild(chipButton(label, null, on === livesOn(), () => {
      setLivesOn(on);
      renderLivesChips();
      renderTimerChips();
      renderCountPicker();
    }));
  });
  $("lives-help").textContent = livesOn()
    ? livesText(!!mode().team)
    : t(mode().team ? "opt.noLivesTeam" : "opt.noLivesDuel");
  renderOptsSummary();
}

// Resumo do "Mais opções" fechado: tempo por vez e vidas.
function renderOptsSummary() {
  $("opts-summary").textContent = `${turnTime ? t("opt.seconds", { n: turnTime }) : t("opt.noLimit")} · ${t(mode().sudden ? "opt.oneLife" : livesOn() ? "opt.withLives" : "opt.noLives")}`;
}

function renderPlayersScreen() {
  ensurePlayers();
  renderModeBars();
  $("players-title").textContent = t(mode().team ? "players.team" : mode().teams ? "players.teams" : "players.howMany");
  renderCountPicker();
  renderTimerChips();
  renderLivesChips();
  const grid = $("player-grid");
  grid.innerHTML = "";
  players.slice(0, playerCount).forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "player-card" + (mode().teams ? ` t${p.team}` : "");
    const preset = p.presetId && presetById(p.presetId);
    card.innerHTML = `
      <button type="button" class="avatar-btn" aria-label="${t("players.skinOf", { n: i + 1 })}">${renderAvatar(p.avatar)}<span class="avatar-edit">${t("skin.change")}</span></button>
      <label class="nick">
        <span>${t("players.player", { n: i + 1 })}</span>
        <input type="text" maxlength="16" placeholder="${t("players.nickPh")}" value="${escapeHtml(p.nick)}">
      </label>
      ${mode().teams ? `<button type="button" class="team-toggle t${p.team}">${teamName(p.team)}</button>` : ""}
      <p class="skin-name">${preset ? escapeHtml(presetName(preset)) : t("players.skinCustom")}</p>`;
    card.querySelector(".avatar-btn").addEventListener("click", () => openAvatarDialog(i));
    card.querySelector("input").addEventListener("input", (e) => {
      p.nick = e.target.value;
      savePlayers();
    });
    const toggle = card.querySelector(".team-toggle");
    if (toggle) toggle.addEventListener("click", () => {
      p.team = 1 - p.team;
      savePlayers();
      renderPlayersScreen();
    });
    grid.appendChild(card);
  });
}

// Depois de trocar skin: atualiza a tela de jogadores e a do modo online.
function refreshAfterAvatar() {
  renderPlayersScreen();
  renderProfileButton();
  if (document.body.dataset.screen === "online") renderOnline();
  if (document.body.dataset.screen === "profile") renderProfileHead();
}

// Antes de escolher a lista: no modo Times, os dois times precisam de gente.
function playersReady() {
  if (!mode().teams) return true;
  const [a, b] = teamSizes();
  if (a && b) return true;
  shake($("mode-label"));
  return false;
}
