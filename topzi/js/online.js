// Modo online (Supabase): salas com código, sala de espera, partida ao vivo e perfil na conta.
//
// Como funciona: o aparelho de quem cria a sala (anfitrião) roda a partida com as mesmas regras
// do jogo local e manda o estado para os outros pelo Realtime. Os outros só mandam o próprio lance
// (palpite, passar, dica) na sua vez. O estado também fica salvo em topzi_salas.state, então quem cai
// ou recarrega a página volta para a partida.

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PROFILE_SYNC_KEYS = ["stats", "recordes", "diaria", "custom", "aprendidas", "players", "lang", "vidas"];
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";

let sb = null;
let me = null; // { id, email, anon }
let room = null; // linha de topzi_salas
let roomPlayers = [];
let channel = null;
let presentIds = new Set();
let pickingForRoom = false; // "pick" (anfitrião escolhe) ou "suggest" (convidado sugere)
let suggestions = new Map(); // id do jogador → { nick, list }
let mySuggestion = null;
let profileLoadedFor = null;

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
    s.onerror = () => fail(new Error(t("on.errNet")));
    document.head.appendChild(s);
  });
}

function setMe(session) {
  const u = session && session.user;
  me = u ? { id: u.id, email: u.email || null, anon: !!u.is_anonymous || !u.email } : null;
}

// Conecta ao Supabase e garante um login (anônimo, se a pessoa não conectou conta).
// Chamadas ao mesmo tempo esperam a mesma conexão (nada de login duplicado).
let onlineReady = null;

function ensureOnline() {
  if (!onlineConfigured()) return Promise.reject(new Error(t("on.errSetup")));
  if (!onlineReady) onlineReady = connectOnline().catch((err) => { onlineReady = null; throw err; });
  return onlineReady;
}

async function connectOnline() {
  if (!sb) {
    await loadSupabase();
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    sb.auth.onAuthStateChange((event, session) => {
      setMe(session);
      renderAccount();
      // O Supabase pede para não chamar o banco dentro deste aviso (pode travar o login):
      // o perfil é carregado logo depois, e só para quem conectou conta.
      if (me && !me.anon && (event === "SIGNED_IN" || event === "USER_UPDATED") && profileLoadedFor !== me.id) {
        profileLoadedFor = me.id;
        setTimeout(loadProfile, 0);
      }
    });
  }
  const t0 = performance.now();
  let { data } = await sb.auth.getSession();
  let session = data.session;
  if (!session) {
    const res = await sb.auth.signInAnonymously();
    if (res.error) throw new Error(t("on.errAnon"));
    session = res.data.session;
  }
  setMe(session);
  console.info(`[online] conectado em ${Math.round(performance.now() - t0)} ms`);
  return me;
}

// Adianta a conexão (biblioteca e login) enquanto a pessoa digita o nickname.
function warmUpOnline() {
  if (onlineConfigured()) ensureOnline().catch(() => {});
}

// Botão mostra que está trabalhando e não aceita um segundo clique.
let onlineBusy = false;

async function busyButton(btn, label, task) {
  if (onlineBusy) return;
  onlineBusy = true;
  const old = btn.textContent;
  btn.disabled = true;
  btn.classList.add("loading");
  btn.textContent = label;
  $("online-error").textContent = "";
  try {
    await task();
  } catch (err) {
    onlineError(err);
  } finally {
    onlineBusy = false;
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = old;
  }
}

function onlineError(err) {
  const msg = (err && err.message) || String(err);
  $("online-error").textContent = msg;
  if (document.body.dataset.screen === "lobby") $("lobby-status").textContent = msg;
}

// ───────────── perfil na conta ─────────────

let profileTimer = null;

function scheduleProfileSave() {
  if (!sb || !me || me.anon) return;
  clearTimeout(profileTimer);
  profileTimer = setTimeout(saveProfileNow, 1500);
}

async function saveProfileNow() {
  if (!sb || !me || me.anon) return;
  ensurePlayers();
  const p = players[0];
  await sb.from("topzi_perfis").upsert({
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
      lang: store("lang"),
      vidas: store("vidas"),
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

  store("vidas", { ...(d.vidas || {}), ...(store("vidas") || {}) });
  // Idioma: vale o escolhido neste aparelho; se nunca escolheu aqui, usa o da conta.
  if (!store("lang") && LANGS.includes(d.lang) && d.lang !== lang) setLang(d.lang);
}

async function loadProfile() {
  if (!sb || !me || me.anon) return;
  const { data } = await sb.from("topzi_perfis").select("*").eq("id", me.id).maybeSingle();
  if (data) mergeProfile(data);
  await saveProfileNow();
  renderDailyCard();
  if (document.body.dataset.screen === "online") renderOnline();
  if (document.body.dataset.screen === "profile") openProfile();
  renderProfileButton();
}

store.onWrite = (key) => {
  if (PROFILE_SYNC_KEYS.includes(key)) scheduleProfileSave();
};

// ───────────── conta do Gamezi ─────────────
// A conta é do Gamezi (uma só para todos os jogos): entrar, criar conta, trocar senha e sair ficam em
// ../conta.html (ver gamezi-conta.js). Aqui o Topzi só mostra quem está conectado e leva para lá.

function accountEmail() {
  if (me) return me.anon ? null : me.email;
  const s = gameziSessao();
  return s && !s.anon ? s.email : null;
}

function accountLine() {
  if (!onlineConfigured()) return t("account.needSetup");
  const email = accountEmail();
  if (email) return t("account.connected", { email: `<b>${escapeHtml(email)}</b>` });
  return t("account.pitch");
}

function renderAccount() {
  document.querySelectorAll(".account-line").forEach((el) => (el.innerHTML = accountLine()));
  document.querySelectorAll(".account-btn").forEach((b) => {
    b.hidden = !onlineConfigured();
    b.textContent = t(accountEmail() ? "account.mine" : b.dataset.label || "account.connect");
  });
  document.querySelectorAll(".home-account").forEach((el) => (el.hidden = !onlineConfigured()));
}

// Vai para a conta do Gamezi, que volta para o Topzi depois do login. Antes, salva o perfil (sem demorar).
async function openAccount() {
  clearTimeout(profileTimer);
  await Promise.race([saveProfileNow().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  location.href = gameziContaUrl("../", "topzi");
}

// ───────────── tela "Jogar online" ─────────────

function renderOnline() {
  ensurePlayers();
  const p = players[0];
  $("online-setup").hidden = onlineConfigured();
  $("online-main").hidden = !onlineConfigured();
  $("online-avatar").innerHTML = renderAvatar(p.avatar) + `<span class="avatar-edit">${t("skin.change")}</span>`;
  $("online-nick").value = p.nick;
  $("online-error").textContent = "";
  renderAccount();
}

function openOnline() {
  renderOnline();
  show("online");
  warmUpOnline();
}

function onlineNick() {
  const nick = players[0].nick.trim();
  if (!nick) {
    $("online-error").textContent = t("on.errNick");
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
  await busyButton($("create-room-btn"), t("on.creating"), async () => {
    const t0 = performance.now();
    await ensureOnline();
    const settings = { mode: modeId, timer: turnTime, lives: livesOn(modeId), list: null };
    let code = null;
    for (let attempt = 0; attempt < 6 && !code; attempt++) {
      const tryCode = randomCode();
      const { error } = await sb.from("topzi_salas").insert({ code: tryCode, host_id: me.id, status: "lobby", settings });
      if (!error) code = tryCode;
      else if (error.code !== "23505") throw error;
    }
    if (!code) throw new Error(t("on.errCreate"));
    const row = { room_code: code, user_id: me.id, nick, avatar: players[0].avatar, team: 0, joined_at: new Date().toISOString() };
    const { error } = await sb.from("topzi_sala_jogadores").insert(row);
    if (error) throw error;
    enterRoom({ code, host_id: me.id, status: "lobby", settings, state: null }, [row]);
    console.info(`[online] sala criada em ${Math.round(performance.now() - t0)} ms`);
    sb.rpc("topzi_limpar_salas").then(() => {}, () => {});
  });
}

async function joinRoom(raw, quiet = false) {
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) {
    if (!quiet) $("online-error").textContent = t("on.errCode");
    return;
  }
  const nick = quiet ? players[0].nick.trim() || t("players.player", { n: "" }).trim() : onlineNick();
  if (!nick) return;
  const task = async () => {
    const t0 = performance.now();
    await ensureOnline();
    // Sala e jogadores ao mesmo tempo (uma ida ao servidor só).
    const [{ data: r, error }, list] = await Promise.all([sb.from("topzi_salas").select("*").eq("code", code).maybeSingle(), fetchRoomPlayers(code)]);
    if (error) throw error;
    if (!r) throw new Error(t("on.errNotFound"));
    const mine = list.find((p) => p.user_id === me.id);
    if (!mine) {
      if (r.status === "playing") throw new Error(t("on.errStarted"));
      if (list.length >= MAX_PLAYERS) throw new Error(t("on.errFull"));
      const team = list.filter((p) => p.team === 0).length > list.filter((p) => p.team === 1).length ? 1 : 0;
      const row = { room_code: code, user_id: me.id, nick: nick.slice(0, 16), avatar: players[0].avatar, team, joined_at: new Date().toISOString() };
      const { error: e2 } = await sb.from("topzi_sala_jogadores").insert(row);
      if (e2) throw new Error(/cheia/.test(e2.message) ? t("on.errFull") : e2.message);
      list.push(row);
    } else {
      mine.nick = nick.slice(0, 16);
      mine.avatar = players[0].avatar;
      sb.from("topzi_sala_jogadores").update({ nick: mine.nick, avatar: mine.avatar }).eq("room_code", code).eq("user_id", me.id).then(() => {}, () => {});
    }
    enterRoom(r, list);
    console.info(`[online] entrou na sala em ${Math.round(performance.now() - t0)} ms`);
  };
  if (quiet) return task();
  await busyButton($("join-form").querySelector("button"), t("on.joining"), task);
}

// Entra na sala com os dados que já tem; o resto atualiza quando o tempo real conectar.
function enterRoom(r, list) {
  store("sala", r.code);
  room = r;
  roomPlayers = list;
  suggestions = new Map();
  mySuggestion = null;
  connectChannel(r.code);
  if (room.status === "playing" && room.state) applyState(room.state);
  else showLobby();
}

async function fetchRoomPlayers(code) {
  const { data } = await sb.from("topzi_sala_jogadores").select("*").eq("room_code", code).order("joined_at");
  return data || [];
}

async function refreshRoom(code = room && room.code) {
  if (!code) return;
  const [{ data: r }, list] = await Promise.all([sb.from("topzi_salas").select("*").eq("code", code).maybeSingle(), fetchRoomPlayers(code)]);
  if (!r) return roomClosed(t("on.closed"));
  room = r;
  roomPlayers = list;
  if (!list.some((p) => p.user_id === me.id)) return roomClosed(t("on.left"));
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
    .on("broadcast", { event: "closed" }, () => roomClosed(t("on.hostClosed")))
    .on("broadcast", { event: "state" }, ({ payload }) => applyState(payload))
    .on("broadcast", { event: "action" }, ({ payload }) => hostAction(payload))
    .on("broadcast", { event: "hello" }, () => {
      if (isHost() && game && game.online) onlineSync();
      if (mySuggestion) send("suggest", mySuggestion);
    })
    .on("broadcast", { event: "suggest" }, ({ payload }) => receiveSuggestion(payload))
    .on("presence", { event: "sync" }, () => {
      const now = new Set(Object.keys(channel.presenceState()));
      const changed = now.size !== presentIds.size || [...now].some((id) => !presentIds.has(id));
      presentIds = now;
      // Só redesenha quando alguém entra ou sai (senão um clique pode cair no meio do redesenho).
      if (changed && document.body.dataset.screen === "lobby") renderLobby();
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
      <b>${escapeHtml(p.nick)}${mine ? ` <small>(${t("lobby.you")})</small>` : ""}</b>
      ${p.user_id === room.host_id ? `<span class="host-tag">${uiIcon("crown")}${t("lobby.host")}</span>` : ""}
      ${m.teams ? `<button type="button" class="team-toggle t${p.team}"${mine ? "" : " disabled"}>${teamName(p.team)}</button>` : ""}
      ${host && !mine ? `<button type="button" class="kick" aria-label="${t("lobby.kick")}">×</button>` : ""}`;
    const toggle = row.querySelector(".team-toggle");
    if (toggle && mine) toggle.addEventListener("click", () => setMyTeam(1 - p.team));
    const kick = row.querySelector(".kick");
    if (kick) kick.addEventListener("click", () => kickPlayer(p));
    wrap.appendChild(row);
  });

  const listLine = st.list
    ? `<b>${escapeHtml(listTitle(st.list))}</b> <span class="muted small">· ${t("game.items", { n: st.list.items.length })}</span>`
    : `<span class="muted">${t("lobby.noList")}</span>`;
  const timerLabel = st.timer ? t("lobby.timer", { n: st.timer }) : t("lobby.noTimer");
  const roomLives = st.lives === undefined ? !!m.team : !!st.lives;
  const box = $("lobby-settings");
  if (!host) {
    box.innerHTML = `
      <p class="lobby-summary"><span class="mode-pill">${modeIcon(m)}${m.name}</span> ${timerLabel} · ${t(roomLives ? "opt.withLives" : "opt.noLives").toLowerCase()}</p>
      <p>Lista: ${listLine}</p>
      <div class="lobby-list"><p class="muted small">${t("lobby.hostPicks")}</p>
        <button type="button" class="btn ghost small" id="lobby-suggest">${t(mySuggestion ? "lobby.changeSuggestion" : "lobby.seeLists")}</button></div>`;
    $("lobby-suggest").addEventListener("click", () => {
      pickingForRoom = "suggest";
      modeId = st.mode;
      activeSize = "all";
      openLists();
    });
  } else {
    box.innerHTML = `
      <p class="ctrl-label">${t("lobby.mode")}</p><div class="chips" id="lobby-modes"></div>
      <p class="ctrl-label">${t("opt.timer")}</p><div class="chips" id="lobby-timer"></div>
      ${MODES[st.mode] && MODES[st.mode].sudden ? "" : `<p class="ctrl-label">${t("opt.lives")}</p><div class="chips" id="lobby-lives"></div>`}
      <p class="ctrl-label">${t("game.list")}</p>
      <div class="lobby-list"><p>${listLine}</p>
        <div class="head-actions"><button type="button" class="btn ghost small" id="lobby-pick">${t("btn.chooseList")}</button><button type="button" class="btn ghost small" id="lobby-random">${t("btn.random")}</button></div>
      </div>`;
    Object.entries(MODES).forEach(([id, mm]) => $("lobby-modes").appendChild(chipButton(mm.name, null, id === st.mode, () => updateSettings({ mode: id }))));
    TIMER_OPTIONS.forEach((s) => $("lobby-timer").appendChild(chipButton(s ? `${s}s` : t("opt.noLimit"), null, s === (st.timer || 0), () => updateSettings({ timer: s }))));
    if ($("lobby-lives")) [[false, t("opt.noLives")], [true, t("opt.withLives")]].forEach(([on, label]) => $("lobby-lives").appendChild(chipButton(label, null, on === roomLives, () => updateSettings({ lives: on }))));
    $("lobby-pick").addEventListener("click", () => {
      pickingForRoom = "pick";
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

  renderSuggestions();

  const problem = lobbyProblem();
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = !!problem;
  $("lobby-status").textContent = host
    ? problem || t("lobby.ready")
    : t("lobby.waiting");
}

function lobbyProblem() {
  const st = room.settings || {};
  const m = MODES[st.mode] || MODES.top10;
  if (!st.list) return t("lobby.pickList");
  if (m.size && st.list.items.length !== m.size) return t("lobby.wrongSize", { mode: m.name, n: m.size });
  if (m.teams) {
    if (roomPlayers.length < 2) return t("lobby.teams2");
    if (!roomPlayers.some((p) => p.team === 0) || !roomPlayers.some((p) => p.team === 1)) return t("lobby.teamsEach");
  }
  return "";
}

async function updateSettings(patch) {
  const settings = { ...(room.settings || {}), ...patch };
  const m = MODES[settings.mode];
  if (patch.mode && settings.list && m.size && settings.list.items.length !== m.size) settings.list = null;
  if (patch.mode && patch.lives === undefined) settings.lives = livesOn(patch.mode);
  room.settings = settings;
  if (patch.mode) modeId = patch.mode;
  renderLobby();
  const { error } = await sb.from("topzi_salas").update({ settings }).eq("code", room.code);
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

// ───────────── sugestões de lista ─────────────

function suggestList(list) {
  pickingForRoom = false;
  const { id, cat, title, source, items } = list;
  mySuggestion = { uid: me.id, nick: players[0].nick.trim() || "?", list: { id, cat, title, source, items } };
  suggestions.set(me.id, mySuggestion);
  send("suggest", mySuggestion);
  showLobby();
  $("lobby-status").textContent = t("lobby.sent", { title });
}

function receiveSuggestion(s) {
  if (!s || !s.uid || !s.list || !Array.isArray(s.list.items)) return;
  suggestions.set(s.uid, s);
  if (document.body.dataset.screen === "lobby") {
    renderLobby();
    if (isHost()) sfx.tick();
  }
}

// Sugestões agrupadas por lista: "Os 10 … · Lara e João" e, para o anfitrião, o botão Usar.
function renderSuggestions() {
  const box = $("lobby-suggestions");
  const inRoom = new Map(roomPlayers.map((p) => [p.user_id, p.nick]));
  const groups = new Map();
  suggestions.forEach((s, uid) => {
    if (!inRoom.has(uid)) return;
    const g = groups.get(s.list.id) || { list: s.list, who: [] };
    g.who.push(inRoom.get(uid));
    groups.set(s.list.id, g);
  });
  box.hidden = !groups.size;
  if (!groups.size) return;
  const chosen = room.settings && room.settings.list && room.settings.list.id;
  const sorted = [...groups.values()].sort((a, b) => b.who.length - a.who.length);
  box.innerHTML = `<p class="ctrl-label">${t("lobby.suggestions")}</p>`;
  sorted.forEach((g) => {
    const row = document.createElement("div");
    row.className = "suggestion" + (g.list.id === chosen ? " chosen" : "");
    const cat = categoryOf(g.list);
    row.innerHTML = `
      <div><p class="list-cat">${icon(cat.id)}${escapeHtml(catLabel(cat))} · ${t("game.items", { n: g.list.items.length })}</p>
        <b>${escapeHtml(listTitle(g.list))}</b>
        <p class="muted small">${t("lobby.suggestedBy", { nomes: g.who.map(escapeHtml).join(", ") })}${g.who.length > 1 ? ` · ${t("lobby.votes", { n: g.who.length })}` : ""}</p></div>
      ${g.list.id === chosen ? `<span class="suggestion-ok">${uiIcon("check")}${t("lobby.chosen")}</span>` : isHost() ? `<button type="button" class="btn small">${t("lobby.use")}</button>` : ""}`;
    const use = row.querySelector("button");
    if (use) use.addEventListener("click", () => pickRoomList(g.list));
    box.appendChild(row);
  });
}

async function setMyTeam(team) {
  const mine = roomPlayers.find((p) => p.user_id === me.id);
  if (mine) mine.team = team;
  renderLobby();
  await sb.from("topzi_sala_jogadores").update({ team }).eq("room_code", room.code).eq("user_id", me.id);
  send("lobby");
}

async function kickPlayer(p) {
  if (!confirm(t("lobby.kickConfirm", { nome: p.nick }))) return;
  await sb.from("topzi_sala_jogadores").delete().eq("room_code", room.code).eq("user_id", p.user_id);
  send("lobby");
  refreshRoom();
}

async function leaveRoom() {
  if (!room) return;
  const code = room.code;
  if (isHost()) {
    send("closed");
    await sb.from("topzi_salas").delete().eq("code", code);
  } else {
    await sb.from("topzi_sala_jogadores").delete().eq("room_code", code).eq("user_id", me.id);
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
  shareText(`${t("lobby.inviteText", { code: room.code })}\n${roomUrl()}`, btn, t("lobby.invite"));
}

// ───────────── partida online ─────────────

async function startOnlineGame() {
  if (!isHost() || lobbyProblem()) return;
  await refreshRoom();
  const st = room.settings;
  modeId = st.mode;
  const roster = roomPlayers.map((p) => ({ uid: p.user_id, name: p.nick, avatar: p.avatar || DEFAULT_AVATAR, team: p.team }));
  suggestions = new Map();
  startGame(st.list, { online: { roster, timer: st.timer || 0, lives: st.lives === undefined ? !!MODES[st.mode].team : !!st.lives } });
  sb.from("topzi_salas").update({ status: "playing" }).eq("code", room.code).then(() => {}, () => {});
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
    livesOn: game.livesOn,
    ownLives: game.ownLives,
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
      sb.from("topzi_salas").update({ state: snap, status: snap.over ? "finished" : "playing" }).eq("code", room.code).then(() => {}, () => {});
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
    livesOn: s.livesOn,
    ownLives: s.ownLives,
    timeLimit: s.timeLimit,
    timeLeft: s.timeLeft,
    feedback: s.feedback,
    isHost: host,
  });
  g.me = g.players.findIndex((p) => p.uid === me.id);
  if (s.mode && MODES[s.mode]) modeId = s.mode;
  game = g;

  if (!same) {
    suggestions = new Map();
    mySuggestion = null;
  }

  // O anfitrião voltando (recarregou a página): retoma o comando da partida.
  if (host && !same) {
    setupGameScreen();
    show("game");
    if (game.over) return showResults();
    game.busy = false;
    renderGame();
    if (game.feedback) paintFeedback(game.feedback.msg, game.feedback.kind);
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
  if (game.feedback) paintFeedback(game.feedback.msg, game.feedback.kind);
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
  if (action.type === "guess") paintFeedback([["on.sending", { text: action.text }]], "info");
}

// Quem sumiu na própria vez perde a vez; se o anfitrião sumir, os outros ficam sabendo.
let absentSince = null;

function watchHost() {
  if (!game || !game.online || game.over || !room) return;
  if (!game.isHost && !presentIds.has(room.host_id)) {
    paintFeedback([["on.hostDown"]], "info");
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
    setFeedback([["on.playerLeft", { nome: cur.name }]], "info");
    nextTurn();
  }
}, 2000);

// Fim da partida no anfitrião: registra no histórico de cada um.
function onlineGameFinished() {
  if (!game.isHost || !room || game.savedMatch) return;
  game.savedMatch = true;
  sb.from("topzi_partidas").insert({
    room_code: room.code,
    list_id: game.list.id,
    list_title: game.list.title,
    mode: modeId,
    players: game.players.map((p) => ({ uid: p.uid, nick: p.name, score: p.score, hits: p.hits.length })),
  }).then(() => {}, () => {});
}

async function backToRoom() {
  if (!room) return roomClosed(t("on.closed"));
  if (isHost()) {
    await sb.from("topzi_salas").update({ status: "lobby", state: null }).eq("code", room.code);
    send("lobby");
  }
  stopGuestTimer();
  game = null;
  await refreshRoom();
  showLobby();
}

// Histórico online na tela de estatísticas.
// Título da partida do histórico no idioma atual (a lista oficial é achada pelo id).
function onlineHistoryTitle(m) {
  const list = m.list_id && LISTS.find((l) => l.id === m.list_id);
  return list ? listTitle(list) : m.list_title || t("game.list");
}

async function renderOnlineHistory() {
  const box = $("stats-online");
  if (!sb || !me) {
    box.innerHTML = `<p class="muted small">${t("on.historyEmpty")}</p>`;
    return;
  }
  const { data } = await sb.from("topzi_partidas").select("*").order("created_at", { ascending: false }).limit(10);
  if (!data || !data.length) {
    box.innerHTML = `<p class="muted small">${t("on.historyNone")}</p>`;
    return;
  }
  box.innerHTML = data.map((m) => {
    const ranked = m.players.slice().sort((a, b) => b.score - a.score);
    const pos = ranked.findIndex((p) => p.uid === me.id) + 1;
    const mine = ranked[pos - 1] || { score: 0 };
    return `<div class="record-row"><span class="record-pts">${pos ? medal(pos) : "—"}</span>
      <div><b>${escapeHtml(onlineHistoryTitle(m))}</b><p class="muted small">${mine.score} pts · ${ranked.map((p) => escapeHtml(p.nick)).join(", ")}</p></div></div>`;
  }).join("");
}

// Abre a conta em segundo plano quando a pessoa já conectou (para trazer o perfil).
function initOnline() {
  // Link do e-mail (nova senha) que caiu no Topzi: a conta do Gamezi cuida disso.
  if (gameziRetornoDoLogin("../")) return;
  renderAccount();
  if (!onlineConfigured()) return;
  // Já deixa a biblioteca baixada e a conexão aberta com o servidor (sem fazer login).
  const pre = document.createElement("link");
  pre.rel = "preconnect";
  pre.href = SUPABASE_URL;
  document.head.appendChild(pre);
  (window.requestIdleCallback || setTimeout)(() => loadSupabase().catch(() => {}));
  const params = new URLSearchParams(location.search);
  const sala = params.get("sala");
  // Quem entrou na conta do Gamezi (aqui ou em outro jogo) já abre com o perfil da conta.
  if (gameziLogado()) ensureOnline().then(loadProfile).catch(() => {});
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
