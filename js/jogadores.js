// Jogadores: quantidade, nickname, skin, time (no modo Times) e tempo por vez.

const MAX_PLAYERS = 8;
const TEAM_NAMES = ["Time Azul", "Time Vermelho"];
const TIMER_OPTIONS = [0, 15, 30, 60];

let playerCount = store("count") || 2;
let players = store("players") || [];
let turnTime = TIMER_OPTIONS.includes(store("timer")) ? store("timer") : 0;

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
  return p.nick.trim() || `Jogador ${i + 1}`;
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
  if (mode().team) {
    const lives = Object.entries(TEAM_LIVES).map(([size, v]) => `${v} no Top ${size}`).join(", ");
    return n === 1
      ? `Só você contra a lista. Vidas: ${lives}.`
      : `Equipe de ${n}: todos juntos contra a lista, revezando a vez. Vidas: ${lives}.`;
  }
  if (mode().teams) {
    const [a, b] = teamSizes();
    if (!a || !b) return "Cada time precisa de pelo menos um jogador. Toque no time de alguém para trocar.";
    return `${TEAM_NAMES[0]}: ${plural(a, "jogador", "jogadores")} · ${TEAM_NAMES[1]}: ${plural(b, "jogador", "jogadores")}. Toque no time de alguém para trocar.`;
  }
  if (n === 1) return "Modo solo: tente fazer o máximo de pontos.";
  if (n === 2) return "Modo 1v1: um contra o outro.";
  return `Todos contra todos: ${n} jogadores.`;
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
    const sub = mode().teams ? (n % 2 ? `${Math.ceil(n / 2)}v${Math.floor(n / 2)}` : `${n / 2}v${n / 2}`) : n === 1 ? "Solo" : n === 2 && !mode().team ? "1v1" : n + " jog.";
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
    wrap.appendChild(chipButton(s ? `${s} segundos` : "Sem limite", null, s === turnTime, () => {
      turnTime = s;
      store("timer", s);
      renderTimerChips();
    }));
  });
  $("timer-help").textContent = turnTime
    ? `Modo relâmpago: quem não chutar em ${turnTime} segundos perde a vez${mode().team ? " e a equipe perde uma vida" : ""}.`
    : "Cada um pensa o tempo que quiser.";
}

function renderPlayersScreen() {
  ensurePlayers();
  renderModeBars();
  $("players-title").textContent = mode().team ? "Quem joga na equipe?" : mode().teams ? "Monte os times" : "Quantos jogadores?";
  renderCountPicker();
  renderTimerChips();
  const grid = $("player-grid");
  grid.innerHTML = "";
  players.slice(0, playerCount).forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "player-card" + (mode().teams ? ` t${p.team}` : "");
    const preset = p.presetId && presetById(p.presetId);
    card.innerHTML = `
      <button type="button" class="avatar-btn" aria-label="Trocar skin do jogador ${i + 1}">${renderAvatar(p.avatar)}<span class="avatar-edit">Trocar skin</span></button>
      <label class="nick">
        <span>Jogador ${i + 1}</span>
        <input type="text" maxlength="16" placeholder="Seu nickname" value="${escapeHtml(p.nick)}">
      </label>
      ${mode().teams ? `<button type="button" class="team-toggle t${p.team}">${TEAM_NAMES[p.team]}</button>` : ""}
      <p class="skin-name">${preset ? escapeHtml(preset.name) : "Skin personalizada"}</p>`;
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
  if (document.body.dataset.screen === "online") renderOnline();
}

// Antes de escolher a lista: no modo Times, os dois times precisam de gente.
function playersReady() {
  if (!mode().teams) return true;
  const [a, b] = teamSizes();
  if (a && b) return true;
  shake($("mode-label"));
  return false;
}
