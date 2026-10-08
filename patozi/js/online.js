// Patozi online: salas com código, sala de espera e partida ao vivo, cada um no seu celular.
//
// Como funciona (igual ao Topzi): o aparelho de quem cria a sala (anfitrião) roda a partida com as regras
// de jogo.js e manda o estado inteiro para os outros pelo Realtime. Os outros só mandam o próprio lance
// (chutar ou "Nem a pato!") na sua vez. O estado também fica salvo em patozi_salas.state, então quem cai ou
// recarrega a página volta para a partida. Se alguém sai no meio, o computador joga por ele.

const SALA_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const AUSENTE_MS = 6000;

let sala = null; // linha de patozi_salas
let salaJogadores = [];
let canal = null;
let presentes = new Set();
let sumiuEm = new Map(); // id → quando saiu da presença
let salvarTimer = null;
let partidaRegistrada = false;

function isHost() {
  return !!(sala && me && sala.host_id === me.id);
}

function codigoNovo() {
  return Array.from({ length: 5 }, () => SALA_LETRAS[Math.floor(Math.random() * SALA_LETRAS.length)]).join("");
}

function onlineErro(err) {
  const msg = (err && err.message) || String(err);
  $("online-error").textContent = msg;
  if (document.body.dataset.screen === "lobby") $("lobby-status").textContent = msg;
}

// Botão mostra que está trabalhando e não aceita segundo clique.
let onlineOcupado = false;
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

// ───────────── tela "Jogar online" ─────────────

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

function minhaLinha(codigo, nick) {
  return { sala_code: codigo, user_id: me.id, nick, cor: minhaCor() };
}

async function criarSala() {
  const nick = nickOnline();
  await ensureOnline();
  let codigo = null;
  for (let k = 0; k < 5 && !codigo; k++) {
    const tentativa = codigoNovo();
    const { error } = await sb.from("patozi_salas").insert({ code: tentativa, host_id: me.id, status: "lobby", settings: config });
    if (!error) codigo = tentativa;
    else if (error.code !== "23505") throw erroDoBanco(error);
  }
  if (!codigo) throw new Error(t("on.errNet"));
  const { error } = await sb.from("patozi_sala_jogadores").insert(minhaLinha(codigo, nick));
  if (error) throw erroDoBanco(error);
  sb.rpc("patozi_limpar_salas").then(() => {}, () => {});
  await entrarNaSala(codigo);
}

async function entrarComCodigo(bruto, silencioso = false) {
  const codigo = String(bruto || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(codigo)) throw new Error(t("on.errCode"));
  const nick = silencioso ? (store("nick") || "Pato") : nickOnline();
  await ensureOnline();
  const [{ data: r }, lista] = await Promise.all([sb.from("patozi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (!r) {
    store("sala", null);
    throw new Error(t("on.errNoRoom"));
  }
  const dentro = lista.find((p) => p.user_id === me.id);
  if (!dentro) {
    if (r.status === "playing") throw new Error(t("on.errPlaying"));
    if (lista.length >= PZ_MAX_JOGADORES) throw new Error(t("on.errFull"));
    const { error } = await sb.from("patozi_sala_jogadores").insert(minhaLinha(codigo, nick));
    if (error) throw new Error(/cheia|full/i.test(error.message) ? t("on.errFull") : error.message);
  } else if (!silencioso) {
    sb.from("patozi_sala_jogadores").update({ nick, cor: minhaCor() }).eq("sala_code", codigo).eq("user_id", me.id).then(() => {}, () => {});
  }
  await entrarNaSala(codigo);
}

async function buscarJogadores(codigo) {
  const { data } = await sb.from("patozi_sala_jogadores").select("*").eq("sala_code", codigo).order("joined_at");
  return data || [];
}

async function atualizarSala(codigo = sala && sala.code) {
  if (!codigo) return;
  const [{ data: r }, lista] = await Promise.all([sb.from("patozi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (!r) return salaFechada(t("on.closed"));
  if (!lista.some((p) => p.user_id === me.id)) return salaFechada(t("on.kicked"));
  sala = r;
  salaJogadores = lista;
}

async function entrarNaSala(codigo) {
  await atualizarSala(codigo);
  if (!sala) return;
  store("sala", sala.code);
  conectarCanal(sala.code);
  if (sala.status !== "lobby" && sala.state) {
    modo = "online";
    iniciarPartida(sala.state);
  } else mostrarSala();
}

function salaFechada(msg) {
  sairDoCanal();
  sala = null;
  store("sala", null);
  if (modo === "online") partida = null;
  abrirOnline();
  $("online-error").textContent = msg;
}

// ───────────── tempo real ─────────────

function conectarCanal(codigo) {
  sairDoCanal();
  canal = sb.channel("patozi-" + codigo, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  canal
    .on("presence", { event: "sync" }, presencaMudou)
    .on("broadcast", { event: "estado" }, ({ payload }) => receberEstado(payload.estado))
    .on("broadcast", { event: "acao" }, ({ payload }) => receberAcao(payload))
    .on("broadcast", { event: "sala" }, () => atualizarSala().then(() => document.body.dataset.screen === "lobby" && renderSala()))
    .on("broadcast", { event: "voltar" }, () => atualizarSala().then(mostrarSala))
    .on("broadcast", { event: "fechou" }, () => salaFechada(t("on.closed")))
    // Quem chegou ou recarregou a página pede o estado; o anfitrião responde se a partida está rolando.
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
  const saiu = [...presentes].some((id) => !agora.has(id));
  presentes.forEach((id) => { if (!agora.has(id)) sumiuEm.set(id, Date.now()); });
  agora.forEach((id) => sumiuEm.delete(id));
  presentes = agora;
  if (document.body.dataset.screen === "lobby") atualizarSala().then(renderSala);
  // Quem chegou (ou voltou depois de recarregar) recebe o estado da partida na hora.
  if (chegou && isHost() && partida && modo === "online") enviar("estado", { estado: partida });
  if (document.body.dataset.screen === "game" && modo === "online") {
    renderScoreboard();
    // Quem sumiu só vira "computador" depois de alguns segundos (pode ser só a internet piscando).
    if (saiu) setTimeout(() => modo === "online" && partida && agendarComputador(), AUSENTE_MS + 200);
  }
}

function onlinePresente(id) {
  return !canal || presentes.has(id) || (me && id === me.id);
}

// O anfitrião joga pelo jogador i com o computador se ele saiu há alguns segundos.
function onlineAusente(i) {
  if (!isHost() || !partida) return false;
  const id = partida.jogadores[i].id;
  if (id === me.id || presentes.has(id)) return false;
  const desde = sumiuEm.get(id);
  if (!desde) {
    sumiuEm.set(id, Date.now());
    return false;
  }
  return Date.now() - desde >= AUSENTE_MS;
}

function onlineTransmitir() {
  if (!isHost() || !partida) return;
  enviar("estado", { estado: partida });
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    if (sala && partida) sb.from("patozi_salas").update({ state: partida, status: partida.fim ? "finished" : "playing" }).eq("code", sala.code).then(() => {}, () => {});
  }, 300);
}

function receberEstado(estado) {
  if (!estado || isHost()) return;
  if (partida && estado.seq < partida.seq && estado.rodada === partida.rodada) return;
  const nova = !partida || modo !== "online";
  modo = "online";
  partida = estado;
  const tela = document.body.dataset.screen;
  if (nova || tela === "lobby" || tela === "online") iniciarPartida(estado);
  else if (tela === "game") renderGame();
}

function enviarAcao(acao) {
  enviar("acao", { uid: me.id, acao, seq: partida.seq });
  // Mostra que mandou; o estado novo chega do anfitrião em seguida.
  const box = $("turn");
  if (box) box.querySelectorAll("button, input").forEach((el) => (el.disabled = true));
}

function receberAcao({ uid, acao, seq }) {
  if (!isHost() || !partida || seq !== partida.seq) return;
  const j = partida.jogadores.findIndex((p) => p.id === uid);
  if (j !== partida.vez) return;
  if (acao.tipo === "chutar" && !Number.isInteger(acao.valor)) return;
  aplicarAcao(acao, j);
}

// ───────────── sala de espera ─────────────

function mostrarSala() {
  partida = null;
  modo = "local";
  show("lobby");
  renderSala();
}

function renderSala() {
  if (!sala) return;
  $("room-code").textContent = sala.code;
  const host = isHost();
  $("lobby-players").innerHTML = salaJogadores.map((p) => `
    <div class="lobby-player ${onlinePresente(p.user_id) ? "here" : ""}">
      ${patoSvg(p.cor || 0)}
      <b>${escapeHtml(p.nick)}${p.user_id === sala.host_id ? ` <small>· ${escapeHtml(t("lobby.host"))}</small>` : ""}${p.user_id === me.id ? ` <small>· ${escapeHtml(t("lobby.you"))}</small>` : ""}</b>
      <span class="dot"></span>
      ${host && p.user_id !== me.id ? `<button type="button" class="remove" data-tirar="${p.user_id}" title="${escapeHtml(t("lobby.kick"))}" aria-label="${escapeHtml(t("lobby.kick"))}">×</button>` : ""}
    </div>`).join("");
  const cfg = { ...configSalva(), ...(sala.settings || {}) };
  renderOptions($("lobby-options"), cfg, salaJogadores.length, host, async (c) => {
    config = c;
    store("config", c);
    sala.settings = c;
    renderSala();
    await sb.from("patozi_salas").update({ settings: c }).eq("code", sala.code);
    enviar("sala");
  });
  const dono = salaJogadores.find((p) => p.user_id === sala.host_id);
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = salaJogadores.length < 2;
  $("lobby-status").textContent = host
    ? t(salaJogadores.length < 2 ? "lobby.needTwo" : "lobby.ready")
    : t("lobby.waitHost", { nome: dono ? dono.nick : "?" });
}

async function tirarDaSala(uid) {
  await sb.from("patozi_sala_jogadores").delete().eq("sala_code", sala.code).eq("user_id", uid);
  await atualizarSala();
  renderSala();
  enviar("sala");
}

async function comecarOnline() {
  if (!isHost()) return;
  await atualizarSala();
  if (salaJogadores.length < 2) return renderSala();
  const cfg = { ...configSalva(), ...(sala.settings || {}) };
  const lista = salaJogadores.map((p) => ({ id: p.user_id, nome: p.nick, cor: p.cor || 0, bot: false }));
  modo = "online";
  partidaRegistrada = false;
  iniciarPartida(pzNovaPartida({ jogadores: lista, ...cfg }));
  onlineTransmitir();
}

function onlinePartidaAcabou() {
  if (!isHost() || partidaRegistrada || !partida) return;
  partidaRegistrada = true;
  const jogadoresFinal = pzPlacar(partida).map((l) => ({ uid: l.id, nick: l.nome, patos: l.patos, cartas: l.cartas, perdeu: l.perdeu }));
  sb.from("patozi_partidas").insert({ sala_code: sala.code, rodadas: partida.rodada, players: jogadoresFinal }).then(() => {}, () => {});
}

async function voltarParaSala() {
  if (!sala) return irInicio();
  if (isHost()) {
    await sb.from("patozi_salas").update({ status: "lobby", state: null }).eq("code", sala.code);
    enviar("voltar");
  }
  await atualizarSala();
  mostrarSala();
}

async function sairDaSala() {
  const codigo = sala && sala.code;
  try {
    if (codigo && isHost()) {
      enviar("fechou");
      await sb.from("patozi_salas").delete().eq("code", codigo);
    } else if (codigo) {
      await sb.from("patozi_sala_jogadores").delete().eq("sala_code", codigo).eq("user_id", me.id);
      enviar("sala");
    }
  } catch (e) { /* sai mesmo assim */ }
  sairDoCanal();
  sala = null;
  partida = null;
  modo = "local";
  store("sala", null);
  irInicio();
}

function convidar(btn) {
  const url = location.origin + location.pathname + "?sala=" + sala.code;
  shareText(t("lobby.shareText", { url }), btn);
}

// Volta sozinho para a sala depois de recarregar a página, ou entra pelo link de convite.
function retomarOnline() {
  const doLink = new URLSearchParams(location.search).get("sala");
  if (doLink) {
    history.replaceState(null, "", location.pathname + location.hash);
    if (store("nick")) {
      abrirOnline(doLink);
      ocupado($("join-room-btn"), () => entrarComCodigo(doLink, true));
    } else abrirOnline(doLink);
    return;
  }
  const salva = store("sala");
  if (salva && onlineConfigured()) entrarComCodigo(salva, true).catch(() => store("sala", null));
}
