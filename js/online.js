// Modo online (Supabase): salas com código, sala de espera, partida ao vivo e perfil na conta.
//
// Como funciona: o aparelho de quem cria a sala (anfitrião) roda a partida com as mesmas regras
// do jogo local e manda o estado para os outros pelo Realtime. Os outros só mandam o próprio lance
// (palpite, passar, dica) na sua vez. O estado também fica salvo em rooms.state, então quem cai
// ou recarrega a página volta para a partida.

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PROFILE_SYNC_KEYS = ["stats", "recordes", "diaria", "custom", "aprendidas", "players"];
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

let sb = null;
let me = null; // { id, email, anon }
let room = null; // linha de rooms
let roomPlayers = [];
let channel = null;
let presentIds = new Set();
let pickingForRoom = false;

function onlineConfigured() {
  return typeof SUPABASE_URL === "string" && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

function myId() {
  return me ? me.id : null;
}

function isHost() {
  return !!(room && me && room.host_id === me.id);
}

function loadSupabase() {
  if (window.supabase) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = SUPABASE_CDN;
    s.onload = ok;
    s.onerror = () => fail(new Error("Não deu para conectar. Confira a internet."));
    document.head.appendChild(s);
  });
}

function setMe(session) {
  const u = session && session.user;
  me = u ? { id: u.id, email: u.email || null, anon: !!u.is_anonymous || !u.email } : null;
  if (me && !me.anon) store("conta", true);
}

// Conecta ao Supabase e garante um login (anônimo, se a pessoa não conectou conta).
async function ensureOnline() {
  if (!onlineConfigured()) throw new Error("O modo online ainda não foi configurado (veja supabase/LEIAME.md).");
  if (!sb) {
    await loadSupabase();
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    sb.auth.onAuthStateChange((event, session) => {
      const before = me && me.id;
      setMe(session);
      if (me && (event === "SIGNED_IN" || event === "USER_UPDATED") && (!before || before !== me.id || !me.anon)) loadProfile();
      renderAccount();
    });
  }
  let { data } = await sb.auth.getSession();
  let session = data.session;
  if (!session) {
    const res = await sb.auth.signInAnonymously();
    if (res.error) throw new Error("Não deu para entrar. Ative o login anônimo no Supabase (veja supabase/LEIAME.md).");
    session = res.data.session;
  }
  setMe(session);
  return me;
}

function onlineError(err) {
  const msg = (err && err.message) || String(err);
  $("online-error").textContent = msg;
  if (document.body.dataset.screen === "lobby") $("lobby-status").textContent = msg;
}

// ───────────── perfil na conta ─────────────

let profileTimer = null;

function scheduleProfileSave() {
  if (!sb || !me) return;
  clearTimeout(profileTimer);
  profileTimer = setTimeout(saveProfileNow, 1500);
}

async function saveProfileNow() {
  if (!sb || !me) return;
  ensurePlayers();
  const p = players[0];
  await sb.from("profiles").upsert({
    id: me.id,
    nick: (p.nick || "").trim().slice(0, 16),
    avatar: p.avatar,
    data: {
      preset: p.presetId || null,
      stats: store("stats"),
      recordes: store("recordes"),
      diaria: store("diaria"),
      custom: store("custom"),
      aprendidas: store("aprendidas"),
    },
  });
}

// Junta o que está na conta com o que está neste aparelho (nada se perde).
function mergeProfile(remote) {
  const d = remote.data || {};
  ensurePlayers();
  if (remote.nick) players[0].nick = remote.nick;
  if (remote.avatar) {
    players[0].avatar = remote.avatar;
    players[0].presetId = d.preset || null;
  }
  store("players", players);

  const local = loadStats();
  if (d.stats && (d.stats.games || 0) >= (local.games || 0)) store("stats", d.stats);

  const recs = { ...(d.recordes || {}) };
  Object.entries(store("recordes") || {}).forEach(([id, r]) => {
    const cur = (recs[id] = { ...(recs[id] || {}) });
    ["individual", "equipe"].forEach((k) => {
      if (r[k] && (!cur[k] || r[k].score > cur[k].score)) cur[k] = r[k];
    });
  });
  store("recordes", recs);

  store("diaria", { ...(d.diaria || {}), ...(store("diaria") || {}) });

  const lists = new Map((d.custom || []).map((l) => [l.id, l]));
  (store("custom") || []).forEach((l) => lists.set(l.id, l));
  customLists = [...lists.values()];
  store("custom", customLists);

  const learned = d.aprendidas || {};
  Object.entries(store("aprendidas") || {}).forEach(([listId, items]) => {
    const target = (learned[listId] = learned[listId] || {});
    Object.entries(items).forEach(([i, keys]) => (target[i] = [...new Set([...(target[i] || []), ...keys])]));
  });
  store("aprendidas", learned);
}

async function loadProfile() {
  if (!sb || !me) return;
  const { data } = await sb.from("profiles").select("*").eq("id", me.id).maybeSingle();
  if (data) mergeProfile(data);
  await saveProfileNow();
  renderDailyCard();
  if (document.body.dataset.screen === "online") renderOnline();
  if (document.body.dataset.screen === "stats") renderStats();
}

store.onWrite = (key) => {
  if (PROFILE_SYNC_KEYS.includes(key)) scheduleProfileSave();
};

// ───────────── conta (e-mail) ─────────────

function accountLine() {
  if (!onlineConfigured()) return "Para salvar o perfil numa conta, o modo online precisa estar configurado.";
  if (me && !me.anon) return `Conta conectada: <b>${escapeHtml(me.email)}</b>. Perfil, estatísticas e recordes ficam salvos.`;
  return "Seu perfil está só neste aparelho. Conecte um e-mail para não perder nada e usar em outro celular.";
}

function renderAccount() {
  document.querySelectorAll(".account-line").forEach((el) => (el.innerHTML = accountLine()));
  document.querySelectorAll(".account-btn").forEach((b) => {
    b.hidden = !onlineConfigured();
    b.textContent = me && !me.anon ? "Conta" : "Conectar conta";
  });
}

async function openAccount() {
  $("account-msg").textContent = "";
  $("account-msg").className = "feedback";
  try {
    await ensureOnline();
  } catch (e) {
    $("account-msg").textContent = e.message;
  }
  const logged = me && !me.anon;
  $("account-status").innerHTML = accountLine();
  $("account-form").hidden = logged;
  $("account-logout").hidden = !logged;
  $("account-dialog").showModal();
}

async function accountSave(e) {
  e.preventDefault();
  const email = $("account-email").value.trim();
  const msg = $("account-msg");
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    msg.textContent = "Digite um e-mail válido.";
    return;
  }
  const login = e.submitter && e.submitter.value === "entrar";
  try {
    await ensureOnline();
    const redirect = siteUrl();
    const res = login
      ? await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } })
      : await sb.auth.updateUser({ email }, { emailRedirectTo: redirect });
    if (res.error) {
      const taken = /already|registered|exists/i.test(res.error.message);
      msg.textContent = taken ? "Esse e-mail já tem conta. Use \"Já tenho conta\" para entrar." : res.error.message;
      return;
    }
    await saveProfileNow();
    msg.className = "feedback good";
    msg.textContent = login
      ? `Enviamos um link para ${email}. Abra neste aparelho para entrar e trazer seu perfil.`
      : `Enviamos um link para ${email}. Abra para confirmar: seu perfil fica salvo na conta.`;
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function accountLogout() {
  if (!sb) return;
  await saveProfileNow();
  await sb.auth.signOut();
  me = null;
  store("conta", false);
  $("account-dialog").close();
  renderAccount();
}

// ───────────── tela "Jogar online" ─────────────

function renderOnline() {
  ensurePlayers();
  const p = players[0];
  $("online-setup").hidden = onlineConfigured();
  $("online-main").hidden = !onlineConfigured();
  $("online-avatar").innerHTML = renderAvatar(p.avatar) + '<span class="avatar-edit">Trocar skin</span>';
  $("online-nick").value = p.nick;
  $("online-error").textContent = "";
  renderAccount();
}

function openOnline() {
  renderOnline();
  show("online");
}

function onlineNick() {
  const nick = players[0].nick.trim();
  if (!nick) {
    $("online-error").textContent = "Escolha um nickname antes de entrar.";
    $("online-nick").focus();
    return null;
  }
  return nick.slice(0, 16);
}

function randomCode() {
  return Array.from({ length: 5 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join("");
}

async function createRoom() {
  const nick = onlineNick();
  if (!nick) return;
  try {
    await ensureOnline();
    sb.rpc("limpar_salas_antigas").then(() => {}, () => {});
    let code = null;
    for (let attempt = 0; attempt < 6 && !code; attempt++) {
      const tryCode = randomCode();
      const { error } = await sb.from("rooms").insert({
        code: tryCode, host_id: me.id, status: "lobby",
        settings: { mode: modeId, timer: turnTime, list: null },
      });
      if (!error) code = tryCode;
      else if (error.code !== "23505") throw error;
    }
    if (!code) throw new Error("Não deu para criar a sala. Tente de novo.");
    const { error } = await sb.from("room_players").upsert({ room_code: code, user_id: me.id, nick, avatar: players[0].avatar, team: 0 });
    if (error) throw error;
    await enterRoom(code);
  } catch (err) {
    onlineError(err);
  }
}

async function joinRoom(raw, quiet = false) {
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) {
    if (!quiet) $("online-error").textContent = "O código da sala tem 5 letras.";
    return;
  }
  const nick = quiet ? players[0].nick.trim() || "Jogador" : onlineNick();
  if (!nick) return;
  try {
    await ensureOnline();
    const { data: r, error } = await sb.from("rooms").select("*").eq("code", code).maybeSingle();
    if (error) throw error;
    if (!r) throw new Error("Sala não encontrada. Confira o código.");
    const list = await fetchRoomPlayers(code);
    const mine = list.find((p) => p.user_id === me.id);
    if (!mine) {
      if (r.status === "playing") throw new Error("A partida dessa sala já começou. Espere ela acabar.");
      if (list.length >= MAX_PLAYERS) throw new Error("A sala está cheia (máximo de 8).");
      const team = list.filter((p) => p.team === 0).length > list.filter((p) => p.team === 1).length ? 1 : 0;
      const { error: e2 } = await sb.from("room_players").insert({ room_code: code, user_id: me.id, nick: nick.slice(0, 16), avatar: players[0].avatar, team });
      if (e2) throw new Error(/cheia/.test(e2.message) ? "A sala está cheia (máximo de 8)." : e2.message);
    } else {
      await sb.from("room_players").update({ nick: nick.slice(0, 16), avatar: players[0].avatar }).eq("room_code", code).eq("user_id", me.id);
    }
    await enterRoom(code);
  } catch (err) {
    if (quiet) throw err;
    onlineError(err);
  }
}

async function enterRoom(code) {
  store("sala", code);
  await refreshRoom(code);
  connectChannel(code);
  if (room.status === "playing" && room.state) applyState(room.state);
  else showLobby();
}

async function fetchRoomPlayers(code) {
  const { data } = await sb.from("room_players").select("*").eq("room_code", code).order("joined_at");
  return data || [];
}

async function refreshRoom(code = room && room.code) {
  if (!code) return;
  const [{ data: r }, list] = await Promise.all([sb.from("rooms").select("*").eq("code", code).maybeSingle(), fetchRoomPlayers(code)]);
  if (!r) return roomClosed("A sala foi fechada.");
  room = r;
  roomPlayers = list;
  if (!list.some((p) => p.user_id === me.id)) return roomClosed("Você saiu da sala.");
  if (document.body.dataset.screen === "lobby") renderLobby();
}

function roomClosed(message) {
  leaveChannel();
  room = null;
  roomPlayers = [];
  store("sala", null);
  if (game && game.online) {
    stopTurnTimer();
    game = null;
  }
  renderOnline();
  show("online");
  $("online-error").textContent = message;
}

// ───────────── Realtime ─────────────

function connectChannel(code) {
  leaveChannel();
  channel = sb.channel("sala-" + code, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  channel
    .on("broadcast", { event: "lobby" }, () => refreshRoom())
    .on("broadcast", { event: "closed" }, () => roomClosed("O anfitrião fechou a sala."))
    .on("broadcast", { event: "state" }, ({ payload }) => applyState(payload))
    .on("broadcast", { event: "action" }, ({ payload }) => hostAction(payload))
    .on("broadcast", { event: "hello" }, () => {
      if (isHost() && game && game.online) onlineSync();
    })
    .on("presence", { event: "sync" }, () => {
      presentIds = new Set(Object.keys(channel.presenceState()));
      if (document.body.dataset.screen === "lobby") renderLobby();
      watchHost();
    })
    .subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({ at: Date.now() });
      send("hello");
      send("lobby");
      refreshRoom();
    });
}

function leaveChannel() {
  if (channel && sb) sb.removeChannel(channel);
  channel = null;
  presentIds = new Set();
}

function send(event, payload = {}) {
  if (channel) channel.send({ type: "broadcast", event, payload });
}

// ───────────── sala de espera ─────────────

function showLobby() {
  pickingForRoom = false;
  if (room && room.settings && room.settings.mode && MODES[room.settings.mode]) modeId = room.settings.mode;
  renderLobby();
  show("lobby");
}

function roomUrl() {
  return siteUrl() + "?sala=" + room.code;
}

function renderLobby() {
  if (!room) return;
  const host = isHost();
  const st = room.settings || {};
  const m = MODES[st.mode] || MODES.top10;
  $("room-code").textContent = room.code;
  $("lobby-count").textContent = `${roomPlayers.length}/${MAX_PLAYERS}`;

  const wrap = $("lobby-players");
  wrap.innerHTML = "";
  roomPlayers.forEach((p) => {
    const mine = p.user_id === me.id;
    const row = document.createElement("div");
    row.className = "lobby-player" + (m.teams ? ` t${p.team}` : "") + (presentIds.has(p.user_id) ? " here" : "");
    row.innerHTML = `
      <div class="mini">${renderAvatar(p.avatar || DEFAULT_AVATAR)}</div>
      <b>${escapeHtml(p.nick)}${mine ? " <small>(você)</small>" : ""}</b>
      ${p.user_id === room.host_id ? '<span class="host-tag">👑 anfitrião</span>' : ""}
      ${m.teams ? `<button type="button" class="team-toggle t${p.team}"${mine ? "" : " disabled"}>${TEAM_NAMES[p.team]}</button>` : ""}
      ${host && !mine ? '<button type="button" class="kick" aria-label="Remover da sala">×</button>' : ""}`;
    const toggle = row.querySelector(".team-toggle");
    if (toggle && mine) toggle.addEventListener("click", () => setMyTeam(1 - p.team));
    const kick = row.querySelector(".kick");
    if (kick) kick.addEventListener("click", () => kickPlayer(p));
    wrap.appendChild(row);
  });

  const listLine = st.list
    ? `<b>${escapeHtml(st.list.title)}</b> <span class="muted small">· ${st.list.items.length} itens</span>`
    : '<span class="muted">nenhuma lista escolhida</span>';
  const timerLabel = st.timer ? `${st.timer} segundos por vez` : "sem limite de tempo";
  const box = $("lobby-settings");
  if (!host) {
    box.innerHTML = `
      <p class="lobby-summary"><span class="mode-pill">${modeIcon(m)}${m.name}</span> ${timerLabel}</p>
      <p>Lista: ${listLine}</p>`;
  } else {
    box.innerHTML = `
      <p class="ctrl-label">Modo</p><div class="chips" id="lobby-modes"></div>
      <p class="ctrl-label">Tempo por vez</p><div class="chips" id="lobby-timer"></div>
      <p class="ctrl-label">Lista</p>
      <div class="lobby-list"><p>${listLine}</p>
        <div class="head-actions"><button type="button" class="btn ghost small" id="lobby-pick">Escolher lista</button><button type="button" class="btn ghost small" id="lobby-random">Sortear</button></div>
      </div>`;
    Object.entries(MODES).forEach(([id, mm]) => $("lobby-modes").appendChild(chipButton(mm.name, null, id === st.mode, () => updateSettings({ mode: id }))));
    TIMER_OPTIONS.forEach((s) => $("lobby-timer").appendChild(chipButton(s ? `${s}s` : "Sem limite", null, s === (st.timer || 0), () => updateSettings({ timer: s }))));
    $("lobby-pick").addEventListener("click", () => {
      pickingForRoom = true;
      modeId = st.mode;
      activeSize = "all";
      openLists();
    });
    $("lobby-random").addEventListener("click", () => {
      modeId = st.mode;
      const pool = allLists().filter((l) => (m.size ? l.items.length === m.size : true));
      pickRoomList(pick(pool));
    });
  }

  const problem = lobbyProblem();
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = !!problem;
  $("lobby-status").textContent = host
    ? problem || "Tudo pronto. Quando a turma estiver na sala, é só começar."
    : "Esperando o anfitrião começar a partida…";
}

function lobbyProblem() {
  const st = room.settings || {};
  const m = MODES[st.mode] || MODES.top10;
  if (!st.list) return "Escolha a lista da partida.";
  if (m.size && st.list.items.length !== m.size) return `No ${m.name} a lista precisa ter ${m.size} itens.`;
  if (m.teams) {
    if (roomPlayers.length < 2) return "O modo Times precisa de pelo menos 2 jogadores.";
    if (!roomPlayers.some((p) => p.team === 0) || !roomPlayers.some((p) => p.team === 1)) return "Cada time precisa de pelo menos um jogador.";
  }
  return "";
}

async function updateSettings(patch) {
  const settings = { ...(room.settings || {}), ...patch };
  const m = MODES[settings.mode];
  if (patch.mode && settings.list && m.size && settings.list.items.length !== m.size) settings.list = null;
  room.settings = settings;
  if (patch.mode) modeId = patch.mode;
  renderLobby();
  const { error } = await sb.from("rooms").update({ settings }).eq("code", room.code);
  if (error) return onlineError(error);
  send("lobby");
}

function pickRoomList(list) {
  if (!list) return;
  pickingForRoom = false;
  const { id, cat, title, source, items } = list;
  updateSettings({ list: { id, cat, title, source, items } });
  show("lobby");
}

async function setMyTeam(team) {
  const mine = roomPlayers.find((p) => p.user_id === me.id);
  if (mine) mine.team = team;
  renderLobby();
  await sb.from("room_players").update({ team }).eq("room_code", room.code).eq("user_id", me.id);
  send("lobby");
}

async function kickPlayer(p) {
  if (!confirm(`Remover ${p.nick} da sala?`)) return;
  await sb.from("room_players").delete().eq("room_code", room.code).eq("user_id", p.user_id);
  send("lobby");
  refreshRoom();
}

async function leaveRoom() {
  if (!room) return;
  const code = room.code;
  if (isHost()) {
    send("closed");
    await sb.from("rooms").delete().eq("code", code);
  } else {
    await sb.from("room_players").delete().eq("room_code", code).eq("user_id", me.id);
    send("lobby");
  }
  leaveChannel();
  room = null;
  roomPlayers = [];
  store("sala", null);
  if (game && game.online) {
    stopTurnTimer();
    game = null;
  }
  renderOnline();
  show("online");
}

async function shareRoom(btn) {
  shareText(`Bora jogar Top Ten! Entra na minha sala: ${room.code}\n${roomUrl()}`, btn, "Convidar");
}

// ───────────── partida online ─────────────

async function startOnlineGame() {
  if (!isHost() || lobbyProblem()) return;
  await refreshRoom();
  const st = room.settings;
  modeId = st.mode;
  const roster = roomPlayers.map((p) => ({ uid: p.user_id, name: p.nick, avatar: p.avatar || DEFAULT_AVATAR, team: p.team }));
  startGame(st.list, { online: { roster, timer: st.timer || 0 } });
  sb.from("rooms").update({ status: "playing" }).eq("code", room.code).then(() => {}, () => {});
}

// O estado da partida que vai para os outros aparelhos (e fica salvo na sala).
function snapshot() {
  return {
    gid: game.gid,
    mode: modeId,
    list: game.list,
    found: [...game.found],
    tried: [...game.tried],
    wrongLog: game.wrongLog,
    hints: [...game.hints],
    players: game.players,
    members: game.members,
    nextOf: game.nextOf,
    turn: game.turn,
    turnSeq: game.turnSeq,
    passStreak: game.passStreak,
    busy: game.busy,
    over: game.over,
    vsList: game.vsList,
    teams: game.teams,
    lives: game.lives,
    maxLives: game.maxLives,
    timeLimit: game.timeLimit,
    timeLeft: game.timeLeft,
    feedback: game.feedback || null,
    note: game.resultsNote || "",
  };
}

let syncQueued = false;
let saveTimer = null;

function onlineAfterRender() {
  if (game.isHost) onlineSync();
}

// Junta várias mudanças seguidas num envio só.
function onlineSync() {
  if (!game || !game.online || !game.isHost || syncQueued) return;
  syncQueued = true;
  setTimeout(() => {
    syncQueued = false;
    if (!game || !game.online || !room) return;
    const snap = snapshot();
    send("state", snap);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      sb.from("rooms").update({ state: snap, status: snap.over ? "finished" : "playing" }).eq("code", room.code).then(() => {}, () => {});
    }, 250);
  }, 0);
}

// Outro aparelho recebe o estado: atualiza a tela e repete as animações do lance.
function applyState(s) {
  if (!s || !s.list || !me) return;
  const same = game && game.online && game.gid === s.gid ? game : null;
  const before = same
    ? { found: new Set(same.found.keys()), misses: same.players.map((p) => p.misses), lives: same.lives, hints: same.hints.size, turnSeq: same.turnSeq, over: same.over }
    : null;
  const host = room && room.host_id === me.id;
  const g = same || {
    online: true,
    list: s.list,
    items: parseList(s.list, host ? learnedFor(s.list.id) : {}),
    hintMode: false,
    daily: null,
    dailyCounts: false,
    endTimer: null,
    phrases: {},
    gid: s.gid,
  };
  Object.assign(g, {
    found: new Map(s.found),
    tried: new Set(s.tried),
    wrongLog: s.wrongLog,
    hints: new Set(s.hints),
    players: s.players,
    members: s.members,
    nextOf: s.nextOf,
    turn: s.turn,
    turnSeq: s.turnSeq,
    passStreak: s.passStreak,
    busy: s.busy,
    over: s.over,
    vsList: s.vsList,
    teams: s.teams,
    lives: s.lives,
    maxLives: s.maxLives,
    timeLimit: s.timeLimit,
    timeLeft: s.timeLeft,
    feedback: s.feedback,
    isHost: host,
  });
  g.me = g.players.findIndex((p) => p.uid === me.id);
  if (s.mode && MODES[s.mode]) modeId = s.mode;
  game = g;

  // O anfitrião voltando (recarregou a página): retoma o comando da partida.
  if (host && !same) {
    setupGameScreen();
    show("game");
    if (game.over) return showResults();
    game.busy = false;
    renderGame();
    if (game.feedback) paintFeedback(game.feedback.text, game.feedback.kind);
    startTurnTimer();
    return;
  }

  if (!same) {
    setupGameScreen();
    if (s.over) {
      renderGame();
      return showResults();
    }
    show("game");
  }

  if (game.over && before && before.over) {
    // Já no resultado: o anfitrião aceitou um chute depois da partida.
    const added = [...game.found.keys()].filter((i) => !before.found.has(i));
    added.forEach((i) => {
      if (game.found.get(i) === game.me) recordAccepted(game, i, game.me, game.vsList ? vsOutcome() : null);
    });
    renderResults(s.note || "");
    const screen = $("screen-results");
    screen.classList.remove("play");
    void screen.offsetWidth;
    screen.classList.add("play");
    countUp(screen);
    return;
  }

  renderGame();
  if (game.feedback) paintFeedback(game.feedback.text, game.feedback.kind);
  if (before) {
    [...game.found.keys()].filter((i) => !before.found.has(i)).forEach((i) => hitEffects(i, game.found.get(i)));
    game.players.forEach((p, i) => {
      if (p.misses > before.misses[i]) missEffects(i, false);
    });
    if (game.lives < before.lives && game.hints.size === before.hints) lifeEffects();
    if (game.hints.size > before.hints) sfx.hint();
    if (game.turnSeq !== before.turnSeq && game.players.length > 1) {
      sfx.tick();
      $("turn").classList.remove("pop");
      void $("turn").offsetWidth;
      $("turn").classList.add("pop");
    }
  }
  guestTimer();
  if (game.over && !(before && before.over)) {
    stopGuestTimer();
    game.endTimer = setTimeout(showResults, 1300);
  } else if (myTurn() && !game.busy) {
    focusGuess();
  }
}

// Relógio só para mostrar (quem decide o fim do tempo é o anfitrião).
let guestClock = null;

function guestTimer() {
  stopGuestTimer();
  if (!game.timeLimit || game.over || game.busy || game.timeLeft <= 0) {
    $("turn-timer").hidden = !game.timeLimit || game.over;
    return;
  }
  $("turn-timer").hidden = false;
  let last = performance.now();
  renderTimer();
  guestClock = setInterval(() => {
    const now = performance.now();
    game.timeLeft = Math.max(0, game.timeLeft - (now - last));
    last = now;
    renderTimer();
    if (game.timeLeft <= 0) stopGuestTimer();
  }, 100);
}

function stopGuestTimer() {
  clearInterval(guestClock);
  guestClock = null;
}

// Lance de outro jogador chegando no anfitrião.
function hostAction(a) {
  if (!game || !game.online || !game.isHost || game.over || game.busy || !a) return;
  const cur = game.players[game.turn];
  if (!cur || a.uid !== cur.uid) return;
  if (a.type === "guess") handleGuess(String(a.text || "").slice(0, 80));
  else if (a.type === "pass") passTurn();
  else if (a.type === "hint" && canHint()) {
    game.hintMode = true;
    useHint(Number(a.index));
  }
}

// Este aparelho é de um convidado: em vez de jogar direto, manda o lance para o anfitrião.
function sendAction(action) {
  if (!game || !myTurn() || game.over || game.busy) return;
  send("action", { ...action, uid: me.id });
  if (action.type === "guess") paintFeedback(`Enviando "${action.text}"…`, "info");
}

// Quem sumiu na própria vez perde a vez; se o anfitrião sumir, os outros ficam sabendo.
let absentSince = null;

function watchHost() {
  if (!game || !game.online || game.over || !room) return;
  if (!game.isHost && !presentIds.has(room.host_id)) {
    paintFeedback("O anfitrião caiu. Esperando ele voltar…", "info");
  }
}

setInterval(() => {
  if (!game || !game.online || !game.isHost || game.over || game.busy) {
    absentSince = null;
    return;
  }
  const cur = game.players[game.turn];
  if (!cur || cur.uid === me.id || presentIds.has(cur.uid)) {
    absentSince = null;
    return;
  }
  absentSince = absentSince || Date.now();
  if (Date.now() - absentSince > 8000) {
    absentSince = null;
    cur.passes += 1;
    cur.streak = 0;
    setFeedback(`${cur.name} saiu da sala e perdeu a vez.`, "info");
    nextTurn();
  }
}, 2000);

// Fim da partida no anfitrião: registra no histórico de cada um.
function onlineGameFinished() {
  if (!game.isHost || !room || game.savedMatch) return;
  game.savedMatch = true;
  sb.from("matches").insert({
    room_code: room.code,
    list_id: game.list.id,
    list_title: game.list.title,
    mode: modeId,
    players: game.players.map((p) => ({ uid: p.uid, nick: p.name, score: p.score, hits: p.hits.length })),
  }).then(() => {}, () => {});
}

async function backToRoom() {
  if (!room) return roomClosed("A sala foi fechada.");
  if (isHost()) {
    await sb.from("rooms").update({ status: "lobby", state: null }).eq("code", room.code);
    send("lobby");
  }
  stopGuestTimer();
  game = null;
  await refreshRoom();
  showLobby();
}

// Histórico online na tela de estatísticas.
async function renderOnlineHistory() {
  const box = $("stats-online");
  if (!sb || !me) {
    box.innerHTML = '<p class="muted small">Jogue online para ver o histórico aqui.</p>';
    return;
  }
  const { data } = await sb.from("matches").select("*").order("created_at", { ascending: false }).limit(10);
  if (!data || !data.length) {
    box.innerHTML = '<p class="muted small">Nenhuma partida online ainda.</p>';
    return;
  }
  box.innerHTML = data.map((m) => {
    const ranked = m.players.slice().sort((a, b) => b.score - a.score);
    const pos = ranked.findIndex((p) => p.uid === me.id) + 1;
    const mine = ranked[pos - 1] || { score: 0 };
    return `<div class="record-row"><span class="record-pts">${pos ? MEDALS[pos] || pos + "º" : "—"}</span>
      <div><b>${escapeHtml(m.list_title || "Lista")}</b><p class="muted small">${mine.score} pts · ${ranked.map((p) => escapeHtml(p.nick)).join(", ")}</p></div></div>`;
  }).join("");
}

// Abre a conta em segundo plano quando a pessoa já conectou (para trazer o perfil).
function initOnline() {
  renderAccount();
  if (!onlineConfigured()) return;
  const params = new URLSearchParams(location.search);
  const sala = params.get("sala");
  const authReturn = /access_token|error_description/.test(location.hash) || params.has("code");
  if (store("conta") || authReturn) ensureOnline().then(loadProfile).catch(() => {});
  if (sala) {
    // Chegou por um link de convite.
    history.replaceState(null, "", location.pathname + location.hash);
    openOnline();
    $("join-code").value = sala.toUpperCase();
    if (players[0] && players[0].nick.trim()) joinRoom(sala);
  } else if (store("sala")) {
    // Recarregou a página no meio de uma sala: volta para ela.
    joinRoom(store("sala"), true).catch(() => store("sala", null));
  }
}
