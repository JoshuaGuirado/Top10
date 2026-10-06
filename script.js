// Tten — fluxo do jogo.
// Telas: início → jogadores → lista → partida → pódio.

const MAX_PLAYERS = 8;
const LIVES = 3;
const TURN_DELAY = 950;

const $ = (id) => document.getElementById(id);
const screens = ["home", "players", "lists", "game", "results"];

// ───────────── utilidades ─────────────

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem("tt:" + key));
    localStorage.setItem("tt:" + key, JSON.stringify(value));
  } catch (e) {
    return null;
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Ignora acentos, maiúsculas, pontuação e artigo inicial ao comparar palpites.
function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(o|a|os|as|the|um|uma) (?=\S)/, "");
}

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function parseList(list) {
  return list.items.map((raw) => {
    const parts = raw.split("|");
    return {
      name: parts[0],
      exact: parts.filter((p) => !p.startsWith("~")).map(normalize),
      keys: parts.filter((p) => p.startsWith("~")).map((p) => normalize(p.slice(1))),
    };
  });
}

// Devolve { index } para um acerto novo, { dup } se o item já foi achado, ou null.
function matchGuess(items, found, raw) {
  const g = normalize(raw);
  if (!g) return null;
  const padded = ` ${g} `;
  const choose = (idxs) => {
    if (!idxs.length) return null;
    const fresh = idxs.find((i) => !found.has(i));
    return fresh !== undefined ? { index: fresh } : { dup: idxs[0] };
  };

  const exact = items.map((it, i) => (it.exact.includes(g) ? i : -1)).filter((i) => i >= 0);
  const r1 = choose(exact);
  if (r1) return r1;

  const byKey = items.map((it, i) => (it.keys.some((k) => padded.includes(` ${k} `)) ? i : -1)).filter((i) => i >= 0);
  const r2 = choose(byKey);
  if (r2) return r2;

  // Um errinho de digitação é perdoado em palavras sem números.
  if (g.length >= 5 && !/\d/.test(g)) {
    const limit = g.length >= 9 ? 2 : 1;
    let best = 99, bestIdx = [];
    items.forEach((it, i) => {
      for (const e of it.exact) {
        if (/\d/.test(e) || e.length < 5) continue;
        const d = levenshtein(g, e);
        if (d < best) { best = d; bestIdx = [i]; }
        else if (d === best && !bestIdx.includes(i)) bestIdx.push(i);
      }
    });
    if (best <= limit && bestIdx.length === 1) return choose(bestIdx);
  }
  return null;
}

const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// ───────────── som ─────────────

let soundOn = store("sound") !== false;
let audioCtx = null;

function beep(notes, type = "sine", dur = 0.12, gap = 0.08, vol = 0.18) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = t0 + i * gap;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  } catch (e) { /* sem áudio, sem problema */ }
}

const sfx = {
  right: (pts) => beep([523, 659, 784, 1047, 1319].slice(0, 2 + Math.ceil(pts / 3)), "triangle", 0.16, 0.07),
  wrong: () => beep([196, 147], "sawtooth", 0.18, 0.12, 0.08),
  tick: () => beep([880], "sine", 0.05, 0, 0.05),
  win: () => beep([523, 659, 784, 1047, 784, 1047, 1319], "triangle", 0.2, 0.11),
};

function renderSoundBtn() {
  $("sound-btn").textContent = soundOn ? "Som: ligado" : "Som: desligado";
  $("sound-btn").setAttribute("aria-pressed", String(soundOn));
}

// ───────────── efeitos ─────────────

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let running = false;
  const colors = ["#0A0A0A", "#0A0A0A", "#6B6B6B", "#BDBDBD", "#E5322D"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  }
  addEventListener("resize", resize);
  resize();

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += 0.25;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.translate(p.x * devicePixelRatio, p.y * devicePixelRatio);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else running = false;
  }

  return {
    burst(x, y, amount = 40) {
      if (reduce) return;
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 3 + Math.random() * 7;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, size: (6 + Math.random() * 6) * devicePixelRatio, color: pick(colors), life: 70 + Math.random() * 40 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    },
    rain(amount = 160) {
      if (reduce) return;
      for (let i = 0; i < amount; i++) {
        parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, size: (6 + Math.random() * 7) * devicePixelRatio, color: pick(colors), life: 160 + Math.random() * 80 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    },
  };
})();

function floatText(el, text, cls = "") {
  const r = el.getBoundingClientRect();
  const f = document.createElement("div");
  f.className = "float " + cls;
  f.textContent = text;
  f.style.left = r.left + r.width / 2 + "px";
  f.style.top = r.top + window.scrollY + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function flash(cls) {
  document.body.classList.remove("flash-good", "flash-bad", "flash-epic");
  void document.body.offsetWidth;
  document.body.classList.add(cls);
}

function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

// ───────────── navegação ─────────────

function show(name) {
  screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
  document.body.dataset.screen = name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── jogadores ─────────────

let playerCount = store("count") || 2;
let players = store("players") || [];

function defaultPlayer(i, used) {
  const free = PRESETS.filter((p) => !used.includes(p.id));
  const preset = pick(free.length ? free : PRESETS);
  return { nick: "", presetId: preset.id, avatar: { ...preset.cfg } };
}

function ensurePlayers() {
  while (players.length < MAX_PLAYERS) {
    players.push(defaultPlayer(players.length, players.map((p) => p.presetId)));
  }
}

function playerName(p, i) {
  return p.nick.trim() || `Jogador ${i + 1}`;
}

function modeLabel(n) {
  if (n === 1) return "Modo solo: tente fazer o máximo de pontos.";
  if (n === 2) return "Modo 1v1: um contra o outro.";
  return `Todos contra todos: ${n} jogadores.`;
}

function renderCountPicker() {
  const wrap = $("count-picker");
  wrap.innerHTML = "";
  for (let n = 1; n <= MAX_PLAYERS; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "count" + (n === playerCount ? " active" : "");
    b.innerHTML = `<b>${n}</b><span>${n === 1 ? "Solo" : n === 2 ? "1v1" : n + " jog."}</span>`;
    b.addEventListener("click", () => {
      playerCount = n;
      store("count", n);
      renderPlayersScreen();
    });
    wrap.appendChild(b);
  }
  $("mode-label").textContent = modeLabel(playerCount);
}

function renderPlayersScreen() {
  ensurePlayers();
  renderCountPicker();
  const grid = $("player-grid");
  grid.innerHTML = "";
  players.slice(0, playerCount).forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "player-card";
    const preset = p.presetId && presetById(p.presetId);
    card.innerHTML = `
      <button type="button" class="avatar-btn" aria-label="Trocar skin do jogador ${i + 1}">${renderAvatar(p.avatar)}<span class="avatar-edit">Trocar skin</span></button>
      <label class="nick">
        <span>Jogador ${i + 1}</span>
        <input type="text" maxlength="16" placeholder="Seu nickname" value="${escapeHtml(p.nick)}">
      </label>
      <p class="skin-name">${preset ? escapeHtml(preset.name) : "Skin personalizada"}</p>`;
    card.querySelector(".avatar-btn").addEventListener("click", () => openAvatarDialog(i));
    card.querySelector("input").addEventListener("input", (e) => {
      p.nick = e.target.value;
      store("players", players);
    });
    grid.appendChild(card);
  });
}

// ───────────── escolha de skin ─────────────

let dialogPlayer = 0;
let dialogTab = PRESET_GROUPS[0];
let draft = null;

function openAvatarDialog(i) {
  dialogPlayer = i;
  draft = { ...DEFAULT_AVATAR, ...JSON.parse(JSON.stringify(players[i].avatar)) };
  $("avatar-dialog-title").textContent = `Skin de ${playerName(players[i], i)}`;
  const current = players[i].presetId && presetById(players[i].presetId);
  dialogTab = current ? current.group : "builder";
  renderAvatarDialog();
  $("avatar-dialog").showModal();
}

function renderAvatarDialog() {
  const tabs = $("avatar-tabs");
  tabs.innerHTML = "";
  [...PRESET_GROUPS, "builder"].forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (g === dialogTab ? " active" : "");
    b.textContent = g === "builder" ? "Criar o meu" : g;
    b.addEventListener("click", () => { dialogTab = g; renderAvatarDialog(); });
    tabs.appendChild(b);
  });

  const isBuilder = dialogTab === "builder";
  $("avatar-presets").hidden = isBuilder;
  $("avatar-builder").hidden = !isBuilder;
  $("builder-foot").hidden = !isBuilder;

  if (isBuilder) return renderBuilder();

  const grid = $("avatar-presets");
  grid.innerHTML = "";
  const taken = players.slice(0, playerCount).map((p, i) => (i !== dialogPlayer ? p.presetId : null));
  PRESETS.filter((p) => p.group === dialogTab).forEach((preset) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "preset" + (players[dialogPlayer].presetId === preset.id ? " active" : "");
    const inUse = taken.includes(preset.id);
    b.innerHTML = `${renderAvatar(preset.cfg)}<span>${escapeHtml(preset.name)}</span>${inUse ? '<em class="in-use">em uso</em>' : ""}`;
    b.addEventListener("click", () => {
      players[dialogPlayer].presetId = preset.id;
      players[dialogPlayer].avatar = { ...preset.cfg };
      store("players", players);
      $("avatar-dialog").close();
      renderPlayersScreen();
    });
    grid.appendChild(b);
  });
}

function swatchRow(label, colors, key, allowNone = false) {
  const row = document.createElement("div");
  row.className = "ctrl";
  row.innerHTML = `<span class="ctrl-label">${label}</span><div class="swatches"></div>`;
  const wrap = row.querySelector(".swatches");
  const opts = allowNone ? [null, ...colors] : colors;
  opts.forEach((col) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + ((draft[key] || null) === col ? " active" : "") + (col ? "" : " none");
    if (col) b.style.background = col;
    b.setAttribute("aria-label", col || "Nenhuma");
    b.addEventListener("click", () => {
      draft[key] = col;
      if (key === "top") delete draft.sleeve;
      renderBuilder();
    });
    wrap.appendChild(b);
  });
  return row;
}

function cycleRow(label, options, key) {
  const row = document.createElement("div");
  row.className = "ctrl";
  let value = Array.isArray(draft[key]) ? draft[key][0] : draft[key];
  let idx = options.findIndex(([v]) => v === value);
  const current = idx >= 0 ? options[idx][1] : "Especial";
  row.innerHTML = `<span class="ctrl-label">${label}</span>
    <div class="cycler"><button type="button" aria-label="Anterior">‹</button><span>${current}</span><button type="button" aria-label="Próximo">›</button></div>`;
  const [prev, next] = row.querySelectorAll("button");
  const step = (d) => {
    idx = idx < 0 ? 0 : (idx + d + options.length) % options.length;
    draft[key] = options[idx][0];
    if (key === "head") { draft.headStyle = ""; draft.headText = ""; }
    renderBuilder();
  };
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  return row;
}

function renderBuilder() {
  $("builder-preview").innerHTML = renderAvatar(draft);
  const c = $("builder-controls");
  c.innerHTML = "";
  c.append(
    swatchRow("Pele", SKIN_TONES, "skin"),
    cycleRow("Cabelo", PARTS.hair, "hair"),
    swatchRow("Cor do cabelo", HAIR_COLORS, "hairColor"),
    cycleRow("Olhos", PARTS.eyes, "eyes"),
    cycleRow("Boca", PARTS.mouth, "mouth"),
    cycleRow("Barba", PARTS.beard, "beard"),
    cycleRow("Detalhe", PARTS.extra, "extra"),
    cycleRow("Cabeça", PARTS.head, "head"),
    swatchRow("Cor do acessório", COLORS, "headColor"),
    swatchRow("Roupa", COLORS, "top"),
    cycleRow("Estampa", PARTS.pattern, "pattern"),
    swatchRow("Cor da estampa", COLORS, "top2"),
  );
  const pat = Array.isArray(draft.pattern) ? draft.pattern : [draft.pattern];
  if (pat.includes("number")) {
    const row = document.createElement("div");
    row.className = "ctrl";
    row.innerHTML = `<span class="ctrl-label">Número</span><input type="text" maxlength="2" inputmode="numeric" class="num-input" value="${escapeHtml(draft.text || "")}">`;
    row.querySelector("input").addEventListener("input", (e) => {
      draft.text = e.target.value.replace(/\D/g, "");
      $("builder-preview").innerHTML = renderAvatar(draft);
    });
    c.append(row);
  }
  c.append(swatchRow("Calça", COLORS, "legs"), swatchRow("Capa", COLORS, "cape", true));
}

function randomAvatar() {
  const r = (arr) => pick(arr)[0];
  draft = {
    ...DEFAULT_AVATAR,
    skin: pick(SKIN_TONES), hair: r(PARTS.hair), hairColor: pick(HAIR_COLORS),
    eyes: r(PARTS.eyes), mouth: r(PARTS.mouth.filter(([v]) => v !== "evil")), beard: Math.random() < 0.3 ? r(PARTS.beard) : "none",
    extra: Math.random() < 0.3 ? r(PARTS.extra) : "none", head: Math.random() < 0.5 ? r(PARTS.head) : "none",
    headColor: pick(COLORS), headColor2: pick(COLORS), top: pick(COLORS), top2: pick(COLORS),
    pattern: r(PARTS.pattern), text: String(1 + Math.floor(Math.random() * 99)), legs: pick(COLORS),
    cape: Math.random() < 0.2 ? pick(COLORS) : null,
  };
  renderBuilder();
}

// ───────────── listas ─────────────

let activeCat = "all";
let lastListIds = store("recent") || [];

function filteredLists() {
  const q = normalize($("list-search").value);
  return LISTS.filter((l) => {
    if (activeCat !== "all" && l.cat !== activeCat) return false;
    if (!q) return true;
    return normalize(l.title + " " + categoryById[l.cat].label).includes(q);
  });
}

function renderChips() {
  const wrap = $("category-chips");
  wrap.innerHTML = "";
  const all = [{ id: "all", label: "Todas" }, ...CATEGORIES];
  all.forEach((cat) => {
    const count = cat.id === "all" ? LISTS.length : LISTS.filter((l) => l.cat === cat.id).length;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (activeCat === cat.id ? " active" : "");
    b.innerHTML = `${cat.label} <small>${count}</small>`;
    b.addEventListener("click", () => {
      activeCat = cat.id;
      renderChips();
      renderListGrid();
    });
    wrap.appendChild(b);
  });
}

function renderListGrid() {
  const lists = filteredLists();
  $("list-count").textContent = lists.length === 1 ? "1 lista" : `${lists.length} listas`;
  const grid = $("list-grid");
  grid.innerHTML = "";
  if (!lists.length) {
    grid.innerHTML = `<p class="muted">Nenhuma lista encontrada. Tente outra palavra.</p>`;
    return;
  }
  lists.forEach((l) => {
    const cat = categoryById[l.cat];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "list-card" + (lastListIds.includes(l.id) ? " played" : "");
    b.innerHTML = `<span class="list-cat">${cat.label}</span><span class="list-title">${escapeHtml(l.title)}</span>${lastListIds.includes(l.id) ? '<span class="list-played">jogada recentemente</span>' : ""}`;
    b.addEventListener("click", () => startGame(l));
    grid.appendChild(b);
  });
}

// ───────────── partida ─────────────

let game = null;

function startGame(list) {
  lastListIds = [list.id, ...lastListIds.filter((id) => id !== list.id)].slice(0, 30);
  store("recent", lastListIds);
  game = {
    list,
    items: parseList(list),
    found: new Map(),
    tried: new Map(),
    wrongLog: [],
    players: players.slice(0, playerCount).map((p, i) => ({
      name: playerName(p, i), avatar: p.avatar, score: 0, lives: LIVES, hits: [], misses: 0, passes: 0,
    })),
    turn: 0,
    passStreak: 0,
    busy: false,
    over: false,
  };
  const cat = categoryById[list.cat];
  $("game-cat").textContent = cat.label;
  $("game-title").textContent = list.title;
  $("source").textContent = `Fonte: ${list.source}`;
  $("pass-btn").hidden = playerCount === 1;
  setFeedback("", "");
  show("game");
  renderGame();
  focusGuess();
}

function activePlayers() {
  return game.players.filter((p) => p.lives > 0);
}

function renderGame() {
  // placar
  const sb = $("scoreboard");
  sb.innerHTML = "";
  game.players.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "score-chip" + (i === game.turn && !game.over ? " current" : "") + (p.lives <= 0 ? " out" : "");
    el.dataset.player = i;
    el.innerHTML = `<div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="score-info"><span class="score-name">${escapeHtml(p.name)}</span>
      <span class="score-hearts">${"♥".repeat(Math.max(p.lives, 0))}<i>${"♥".repeat(LIVES - Math.max(p.lives, 0))}</i></span></div>
      <span class="score-pts">${p.score}</span>`;
    sb.appendChild(el);
  });

  // vez
  const cur = game.players[game.turn];
  $("turn-avatar").innerHTML = renderAvatar(cur.avatar);
  $("turn-name").textContent = cur.name;
  $("turn").classList.toggle("hidden", game.over);

  // tabuleiro
  const board = $("board");
  board.innerHTML = "";
  game.items.forEach((item, i) => {
    const li = document.createElement("li");
    li.dataset.index = i;
    const who = game.found.get(i);
    if (who !== undefined) {
      const p = game.players[who];
      li.className = "slot found";
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span><span class="slot-who" title="${escapeHtml(p.name)}">${renderAvatar(p.avatar)}</span><span class="pts">+${i + 1}</span>`;
    } else if (game.over) {
      li.className = "slot missed";
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span><span class="pts">${i + 1} pts</span>`;
    } else {
      li.className = "slot";
      li.innerHTML = `<span class="rank">${i + 1}</span><span class="slot-name"><span class="hidden-name"></span></span><span class="pts">${i + 1} pts</span>`;
    }
    board.appendChild(li);
  });

  $("wrong-guesses").textContent = game.wrongLog.length ? "Chutes errados: " + game.wrongLog.map((w) => w.text).join(", ") : "";

  const disabled = game.busy || game.over;
  $("guess").disabled = disabled;
  $("guess-form").querySelector("button").disabled = disabled;
  $("pass-btn").disabled = disabled;
}

function setFeedback(text, kind) {
  const f = $("feedback");
  f.textContent = text;
  f.className = "feedback " + kind;
}

function focusGuess() {
  if (!game.over && !game.busy) setTimeout(() => $("guess").focus(), 50);
}

const HYPE = {
  low: ["Esse era fácil, hein.", "O óbvio também conta!", "Pontinho garantido.", "Começou pelo básico."],
  mid: ["Boa!", "Mandou bem!", "Lâmpada acesa!", "Isso aí!", "Tá esperto!"],
  high: ["QUE ISSO?!", "Ninguém esperava essa!", "Gênio detectado!", "Lâmpada de estádio!", "Tirou da cartola!"],
};

function handleGuess(raw) {
  if (!game || game.over || game.busy) return;
  const text = raw.trim();
  if (!text) return;
  const p = game.players[game.turn];
  const result = matchGuess(game.items, game.found, text);

  if (result && result.dup !== undefined) {
    const who = game.players[game.found.get(result.dup)];
    setFeedback(`${game.items[result.dup].name} já foi encontrado por ${who.name}. Tente outro!`, "info");
    shake($("guess-form"));
    return;
  }

  if (!result) {
    const key = normalize(text);
    if (game.tried.has(key)) {
      setFeedback(`"${text}" já foi tentado. Tente outro!`, "info");
      shake($("guess-form"));
      return;
    }
    game.tried.set(key, game.turn);
    game.wrongLog.push({ text, player: game.turn });
    p.lives -= 1;
    p.misses += 1;
    game.passStreak = 0;
    sfx.wrong();
    flash("flash-bad");
    shake($("guess-form"));
    const chip = $("scoreboard").querySelector(`[data-player="${game.turn}"]`);
    if (chip) { shake(chip); floatText(chip, "−1 vida", "bad"); }
    setFeedback(p.lives > 0 ? `"${text}" não está na lista. ${p.name} perdeu uma vida.` : `"${text}" não está na lista. ${p.name} está fora!`, "bad");
    return nextTurn();
  }

  // acerto
  const i = result.index;
  const pts = i + 1;
  game.found.set(i, game.turn);
  p.score += pts;
  p.hits.push(pts);
  game.passStreak = 0;
  renderGame();

  const slot = $("board").querySelector(`[data-index="${i}"]`);
  slot.classList.add("reveal");
  const r = slot.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, 20 + pts * 8);
  floatText(slot, `+${pts}`, pts >= 8 ? "epic" : "good");
  sfx.right(pts);
  const tier = pts >= 8 ? "high" : pts >= 4 ? "mid" : "low";
  if (tier === "high") flash("flash-epic");
  setFeedback(`${pick(HYPE[tier])} ${game.items[i].name} é o nº ${pts}: +${pts} para ${p.name}.`, tier === "high" ? "epic" : "good");
  nextTurn();
}

function nextTurn() {
  if (game.found.size === game.items.length) return endGame("Todos os 10 foram encontrados!");
  if (!activePlayers().length) return endGame(playerCount === 1 ? "Acabaram suas vidas!" : "Todo mundo ficou sem vidas!");
  game.busy = true;
  renderGame();
  setTimeout(() => {
    if (!game || game.over) return;
    if (game.players.length > 1) {
      let n = game.turn;
      do { n = (n + 1) % game.players.length; } while (game.players[n].lives <= 0);
      game.turn = n;
    } else if (game.players[0].lives <= 0) {
      return endGame("Acabaram suas vidas!");
    }
    game.busy = false;
    $("guess").value = "";
    renderGame();
    if (game.players.length > 1) {
      sfx.tick();
      $("turn").classList.remove("pop");
      void $("turn").offsetWidth;
      $("turn").classList.add("pop");
    }
    focusGuess();
  }, TURN_DELAY);
}

function passTurn() {
  if (!game || game.over || game.busy) return;
  const p = game.players[game.turn];
  p.passes += 1;
  game.passStreak += 1;
  if (game.passStreak >= activePlayers().length) return endGame("Todo mundo passou a vez. Ninguém sabe mais nenhum!");
  setFeedback(`${p.name} passou a vez.`, "info");
  nextTurn();
}

function endGame(reason) {
  if (!game || game.over) return;
  game.over = true;
  game.busy = false;
  setFeedback(reason, "info");
  renderGame();
  setTimeout(showResults, 1300);
}

// ───────────── pódio ─────────────

const PHRASES = {
  1: ["Cérebro de LED: gasta pouco e brilha muito.", "Isso foi estudo ou bruxaria?", "Não falou o óbvio. Falou o certo.", "Pode pedir música no Fantástico.", "Lâmpada de estádio em dia de final."],
  2: ["Prata também brilha, viu?", "Faltou um fio de luz pra ganhar.", "Vice com cara de campeão.", "O ouro tava ali, dava pra ver."],
  3: ["Bronze com gostinho de ouro.", "Subiu no pódio, é isso que importa.", "Terceiro lugar e muita dignidade."],
  rest: ["Lâmpada piscando hoje, hein?", "Participou. E isso é lindo.", "Na próxima é sua.", "Faltou energia na tomada."],
  last: ["Veio pelo lanche, né?", "A lâmpada queimou no meio do jogo.", "Pelo menos a skin tava bonita.", "O importante é competir… né?"],
  zero: ["Zero pontos e muita confiança.", "Tava só de enfeite?", "Chutou mais que goleiro em pênalti."],
  tie: ["Empate técnico. Ninguém dorme hoje.", "Dois cérebros, uma pontuação."],
};

function soloVerdict(score) {
  const max = (game.items.length * (game.items.length + 1)) / 2;
  if (score === max) return "Gabaritou! Você é a própria usina elétrica.";
  if (score >= 45) return "Holofote! Quase perfeito.";
  if (score >= 30) return "Lâmpada acesa! Mandou bem.";
  if (score >= 15) return "Meia-luz. Dá pra ler um livro.";
  if (score > 0) return "Tá piscando… falta energia.";
  return "Lâmpada queimada. Bora de novo?";
}

function showResults() {
  const ranked = game.players
    .map((p, i) => ({ ...p, idx: i }))
    .sort((a, b) => b.score - a.score || b.hits.length - a.hits.length || a.misses - b.misses);
  let place = 0, prev = null;
  ranked.forEach((p, k) => {
    if (prev === null || p.score !== prev) place = k + 1;
    p.place = place;
    prev = p.score;
  });

  const solo = ranked.length === 1;
  const lastPlace = ranked[ranked.length - 1].place;
  const maxHits = Math.max(...ranked.map((p) => p.hits.length));
  const maxMiss = Math.max(...ranked.map((p) => p.misses));
  ranked.forEach((p) => {
    const tied = ranked.filter((q) => q.place === p.place).length > 1;
    if (solo) p.phrase = soloVerdict(p.score);
    else if (p.score === 0) p.phrase = pick(PHRASES.zero);
    else if (tied && p.place === 1) p.phrase = pick(PHRASES.tie);
    else if (p.place <= 3) p.phrase = pick(PHRASES[p.place]);
    else if (p.place === lastPlace && ranked.length >= 4) p.phrase = pick(PHRASES.last);
    else p.phrase = pick(PHRASES.rest);
    p.badges = [];
    if (p.hits.includes(10)) p.badges.push("Achou o nº 10");
    if (!solo && p.hits.length === maxHits && maxHits > 0) p.badges.push("Mais acertos");
    if (!solo && p.misses === maxMiss && maxMiss > 0) p.badges.push("Mais chutes errados");
    if (p.hits.length && p.hits.every((h) => h <= 3)) p.badges.push("Só o óbvio");
  });

  const winners = ranked.filter((p) => p.place === 1);
  $("results-title").textContent = solo
    ? `${ranked[0].score} pontos`
    : winners.length > 1 ? "Empate no topo!" : `${winners[0].name} venceu!`;

  // pódio: colunas 2º, 1º, 3º
  const podium = $("podium");
  podium.innerHTML = "";
  const columns = solo ? [1] : [2, 1, 3];
  columns.forEach((pl) => {
    const group = ranked.filter((p) => p.place === pl);
    if (!group.length) return;
    const col = document.createElement("div");
    col.className = `podium-col place-${pl}`;
    col.innerHTML = `
      <div class="podium-people">${group.map((p) => `<div class="podium-person"><div class="podium-avatar">${renderAvatar(p.avatar)}</div><b>${escapeHtml(p.name)}</b><span>${p.score} pts</span></div>`).join("")}</div>
      <div class="podium-block"><span>${solo ? group[0].score : pl + "º"}</span></div>`;
    podium.appendChild(col);
  });

  // tabela
  const table = $("results-table");
  table.innerHTML = ranked.map((p) => `
    <div class="result-row">
      <span class="result-place">${p.place}º</span>
      <div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="result-info">
        <b>${escapeHtml(p.name)}</b> <span class="result-pts">${p.score} pts</span>
        <p class="result-phrase">“${escapeHtml(p.phrase)}”</p>
        <p class="result-stats">Acertos: ${p.hits.length ? p.hits.slice().sort((a, b) => b - a).map((h) => `nº ${h}`).join(", ") : "nenhum"} · Erros: ${p.misses}${p.passes ? ` · Passou: ${p.passes}` : ""}</p>
        ${p.badges.length ? `<p class="badges">${p.badges.map((b) => `<span>${b}</span>`).join("")}</p>` : ""}
      </div>
    </div>`).join("");

  // lista completa
  $("final-board").innerHTML = game.items.map((item, i) => {
    const who = game.found.get(i);
    const p = who !== undefined ? game.players[who] : null;
    return `<li class="slot ${p ? "found" : "missed"}"><span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span>${p ? `<span class="slot-who" title="${escapeHtml(p.name)}">${renderAvatar(p.avatar)}</span>` : ""}<span class="pts">${p ? escapeHtml(p.name) : "ninguém"}</span></li>`;
  }).join("");

  show("results");
  sfx.win();
  setTimeout(() => fx.rain(120), 250);
}

// ───────────── eventos ─────────────

$("home-btn").addEventListener("click", () => {
  if (game && !game.over && !confirm("Sair da partida atual?")) return;
  game = null;
  show("home");
});
$("sound-btn").addEventListener("click", () => {
  soundOn = !soundOn;
  store("sound", soundOn);
  renderSoundBtn();
  sfx.tick();
});
$("start-btn").addEventListener("click", () => {
  renderPlayersScreen();
  show("players");
});
$("to-lists-btn").addEventListener("click", () => {
  store("players", players);
  renderChips();
  renderListGrid();
  show("lists");
});
$("list-search").addEventListener("input", renderListGrid);
$("random-list-btn").addEventListener("click", () => {
  const pool = filteredLists();
  const fresh = pool.filter((l) => !lastListIds.includes(l.id));
  const list = pick(fresh.length ? fresh : pool.length ? pool : LISTS);
  startGame(list);
});
$("guess-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("guess");
  const value = input.value;
  handleGuess(value);
  if (game && !game.busy) {
    input.value = "";
    focusGuess();
  }
});
$("pass-btn").addEventListener("click", passTurn);
$("end-btn").addEventListener("click", () => {
  if (confirm("Encerrar a partida e ver o pódio?")) endGame("Partida encerrada.");
});
$("rematch-btn").addEventListener("click", () => {
  renderChips();
  renderListGrid();
  show("lists");
});
$("new-players-btn").addEventListener("click", () => {
  renderPlayersScreen();
  show("players");
});
$("builder-random").addEventListener("click", randomAvatar);
$("builder-save").addEventListener("click", () => {
  players[dialogPlayer].avatar = draft;
  players[dialogPlayer].presetId = null;
  store("players", players);
  $("avatar-dialog").close();
  renderPlayersScreen();
});

renderSoundBtn();
ensurePlayers();
show("home");
