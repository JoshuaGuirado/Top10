// Cravazi online: salas com código, sala de espera e partida ao vivo, cada um no seu celular.
//
// Como no Patozi e no Topzi: o aparelho de quem cria a sala (anfitrião) roda a partida com as regras de
// jogo.js e manda o estado inteiro para os outros pelo Realtime. Os outros só mandam o próprio lance
// (o chute na sua vez, ou "próxima rodada" depois que alguém cravou). O estado também fica salvo em
// cravazi_salas.state, então quem cai ou recarrega a página volta para a partida. Se quem está na vez sai,
// a vez passa para o próximo. Se quem sai é o anfitrião, o comando passa para quem entrou primeiro
// (cravazi_sair_da_sala) ou, se ele só sumiu, quem ficou assume depois de alguns segundos (cravazi_assumir_sala).
// O banco é o mesmo do Topzi (chaves em ../topzi/js/config.js); as tabelas são cravazi_* (supabase/schema.sql).

const SALA_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const AUSENTE_MS = 6000;

let sb = null;
let me = null; // { id }
let sala = null; // linha de cravazi_salas
let salaJogadores = [];
let canal = null;
let presentes = new Set();
let sumiuEm = new Map(); // id → quando saiu da presença
let salvarTimer = null;
let partidaRegistrada = false;

function onlineConfigured() {
  return typeof gameziRankingLigado === "function" && gameziRankingLigado();
}

// Conecta (login anônimo se a pessoa não tem conta do Gamezi) e descobre quem sou eu.
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

function noOnline() {
  return modo === "online" && !!sala;
}

function codigoNovo() {
  return Array.from({ length: 5 }, () => SALA_LETRAS[Math.floor(Math.random() * SALA_LETRAS.length)]).join("");
}

// Erro do banco em texto para a pessoa. Tabela que não existe: o schema.sql ainda não rodou no Supabase.
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
  renderMinhaSkinOnline();
  if (codigo) $("join-code").value = codigo;
  $("online-error").textContent = "";
  if (ok) ensureOnline().catch(() => {});
}

function renderMinhaSkinOnline() {
  $("online-skin").innerHTML = czBoneco(minhaSkin(), "body") + `<span class="avatar-edit">${escapeHtml(t("skin.change"))}</span>`;
}

function trocarMinhaSkin() {
  abrirSkin(t("skin.of", { nome: store("nick") || t("lobby.you") }), minhaSkin(), [], (skin) => {
    store("skin", skin);
    renderMinhaSkinOnline();
    if (!sala || !me) return;
    const eu = salaJogadores.find((p) => p.user_id === me.id);
    if (eu) eu.skin = skin;
    if (document.body.dataset.screen === "lobby") renderSala();
    sb.from("cravazi_sala_jogadores").update({ skin }).eq("sala_code", sala.code).eq("user_id", me.id).then(() => enviar("sala"), () => {});
  });
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
  return { sala_code: codigo, user_id: me.id, nick, skin: minhaSkin() };
}

async function criarSala() {
  const nick = nickOnline();
  await ensureOnline();
  let codigo = null;
  for (let k = 0; k < 5 && !codigo; k++) {
    const tentativa = codigoNovo();
    const { error } = await sb.from("cravazi_salas").insert({ code: tentativa, host_id: me.id, status: "lobby", settings: { rodadas } });
    if (!error) codigo = tentativa;
    else if (error.code !== "23505") throw erroDoBanco(error);
  }
  if (!codigo) throw new Error(t("on.errNet"));
  const { error } = await sb.from("cravazi_sala_jogadores").insert(minhaLinha(codigo, nick));
  if (error) throw erroDoBanco(error);
  sb.rpc("cravazi_limpar_salas").then(() => {}, () => {});
  await entrarNaSala(codigo);
}

async function entrarComCodigo(bruto, silencioso = false) {
  const codigo = String(bruto || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(codigo)) throw new Error(t("on.errCode"));
  const nick = silencioso ? (store("nick") || t("home.player", { n: 1 })) : nickOnline();
  await ensureOnline();
  const [{ data: r, error: erro }, lista] = await Promise.all([sb.from("cravazi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (erro) throw erroDoBanco(erro);
  if (!r) {
    store("sala", null);
    throw new Error(t("on.errNoRoom"));
  }
  const dentro = lista.find((p) => p.user_id === me.id);
  if (!dentro) {
    if (r.status === "playing") throw new Error(t("on.errPlaying"));
    if (lista.length >= CZ_MAX) throw new Error(t("on.errFull"));
    const { error } = await sb.from("cravazi_sala_jogadores").insert(minhaLinha(codigo, nick));
    if (error) throw /cheia|full/i.test(error.message || "") ? new Error(t("on.errFull")) : erroDoBanco(error);
  } else if (!silencioso) {
    sb.from("cravazi_sala_jogadores").update({ nick, skin: minhaSkin() }).eq("sala_code", codigo).eq("user_id", me.id).then(() => {}, () => {});
  }
  await entrarNaSala(codigo);
}

async function buscarJogadores(codigo) {
  const { data } = await sb.from("cravazi_sala_jogadores").select("*").eq("sala_code", codigo).order("joined_at");
  return data || [];
}

async function atualizarSala(codigo = sala && sala.code) {
  if (!codigo) return;
  const [{ data: r }, lista] = await Promise.all([sb.from("cravazi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (!r) return salaFechada(t("on.closed"));
  if (!lista.some((p) => p.user_id === me.id)) return salaFechada(t("on.kicked"));
  const anfitriaoAntes = sala && sala.host_id;
  sala = r;
  salaJogadores = lista;
  if (anfitriaoAntes && anfitriaoAntes !== r.host_id) anfitriaoMudou();
}

// O comando da sala mudou de mão: quem virou anfitrião passa a rodar a partida.
function anfitriaoMudou() {
  if (document.body.dataset.screen === "lobby") renderSala();
  if (!isHost() || !partida || modo !== "online") return;
  if (document.body.dataset.screen === "game") renderJogo();
  onlineTransmitir();
}

// Anfitrião sumiu sem sair (fechou o app, caiu a internet): quem entrou primeiro entre os que ficaram assume.
let anfitriaoSumiuEm = null;

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
  const { data, error } = await sb.rpc("cravazi_assumir_sala", { p_code: sala.code });
  if (error || !data) return;
  await atualizarSala();
  enviar("sala");
}

// O anfitrião passa a vez de quem saiu da sala (senão a rodada ficaria parada esperando).
function passarVezDeQuemSaiu() {
  if (!noOnline() || !isHost() || !partida || partida.fim || partida.atual.vencedor !== null) return;
  if (!onlineAusente(partida.atual.vez)) return;
  czPassarVez(partida);
  onlineTransmitir();
  if (document.body.dataset.screen === "game") renderJogo();
}

setInterval(() => {
  conferirAnfitriao().catch(() => {});
  passarVezDeQuemSaiu();
}, 2000);

async function entrarNaSala(codigo) {
  await atualizarSala(codigo);
  if (!sala) return;
  store("sala", sala.code);
  conectarCanal(sala.code);
  if (sala.status !== "lobby" && sala.state) {
    receberEstado(sala.state, true);
  } else mostrarSala();
}

function salaFechada(msg) {
  sairDoCanal();
  sala = null;
  store("sala", null);
  if (modo === "online") {
    partida = null;
    modo = "local";
  }
  abrirOnline();
  $("online-error").textContent = msg;
}

// ───────────── tempo real ─────────────

function conectarCanal(codigo) {
  sairDoCanal();
  canal = sb.channel("cravazi-" + codigo, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  canal
    .on("presence", { event: "sync" }, presencaMudou)
    .on("broadcast", { event: "estado" }, ({ payload }) => receberEstado(payload.estado))
    .on("broadcast", { event: "acao" }, ({ payload }) => receberAcao(payload))
    .on("broadcast", { event: "sala" }, () => atualizarSala().then(() => document.body.dataset.screen === "lobby" && renderSala()))
    .on("broadcast", { event: "voltar" }, () => atualizarSala().then(() => sala && mostrarSala()))
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
  presentes.forEach((id) => { if (!agora.has(id)) sumiuEm.set(id, Date.now()); });
  agora.forEach((id) => sumiuEm.delete(id));
  const mudou = chegou || [...presentes].some((id) => !agora.has(id));
  presentes = agora;
  if (document.body.dataset.screen === "lobby" && mudou) atualizarSala().then(renderSala);
  // Quem chegou (ou voltou depois de recarregar) recebe o estado da partida na hora.
  if (chegou && isHost() && partida && modo === "online") enviar("estado", { estado: partida });
  if (mudou && document.body.dataset.screen === "game" && modo === "online") renderJogo();
}

function onlinePresente(id) {
  return !canal || presentes.has(id) || (me && id === me.id);
}

// O jogador i saiu há alguns segundos (pode ser só a internet piscando)?
function onlineAusente(i) {
  if (!isHost() || !partida) return false;
  const id = partida.jogadores[i].id;
  if (!id || id === me.id || presentes.has(id)) return false;
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
    if (sala && partida) sb.from("cravazi_salas").update({ state: partida, status: partida.fim ? "finished" : "playing" }).eq("code", sala.code).then(() => {}, () => {});
  }, 300);
}

function receberEstado(estado, forcar = false) {
  if (!estado || (isHost() && !forcar)) return;
  if (!forcar && partida && modo === "online" && (estado.seq || 0) < (partida.seq || 0)) return;
  const antes = modo === "online" ? partida : null;
  const nova = !antes || estado.rodada < antes.rodada;
  modo = "online";
  partida = estado;
  if (partida.fim) {
    if (document.body.dataset.screen !== "results" || nova) terminar();
    return;
  }
  if (nova) partidaContada = false;
  if (document.body.dataset.screen !== "game") show("game");
  renderJogo();
  // Mostra a dica nova com a mesma animação de quem chutou.
  if (antes && antes.rodada === estado.rodada && estado.atual.chutes.length > antes.atual.chutes.length) {
    animar(estado.atual.vencedor !== null ? $("nailed") : $("hint"));
    if (estado.atual.vencedor !== null && navigator.vibrate) navigator.vibrate([40, 40, 80]);
  }
  if (souDaVez()) focarCampo("guess");
}

function souDaVez() {
  if (modo !== "online" || !partida || !me) return true;
  const j = partida.jogadores[partida.atual.vez];
  return !!j && j.id === me.id;
}

function enviarAcao(acao) {
  enviar("acao", { uid: me.id, acao, seq: partida.seq });
  // Mostra que mandou; o estado novo chega do anfitrião em seguida.
  $("guess-btn").disabled = true;
  $("next-btn").disabled = true;
  setTimeout(() => { $("guess-btn").disabled = false; $("next-btn").disabled = false; }, 2500);
}

function receberAcao({ uid, acao, seq }) {
  if (!isHost() || !partida || partida.fim || !acao || seq !== partida.seq) return;
  const j = partida.jogadores.findIndex((p) => p.id === uid);
  if (j < 0) return;
  if (acao.tipo === "chutar") {
    if (j !== partida.atual.vez || !Number.isInteger(acao.valor)) return;
    aplicarChute(acao.valor);
  }
  if (acao.tipo === "proxima") aplicarProxima();
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
  $("lobby-players").innerHTML = salaJogadores.map((p) => {
    const eu = p.user_id === me.id;
    const skin = eu ? minhaSkin() : czSkinValida(p.skin);
    return `
    <div class="lobby-player ${onlinePresente(p.user_id) ? "here" : ""} ${eu ? "me" : ""}">
      ${eu
        ? `<button type="button" class="skin-mini" data-minha-skin title="${escapeHtml(t("skin.change"))}" aria-label="${escapeHtml(t("skin.change"))}">${czBoneco(skin)}</button>`
        : `<span class="skin-mini">${czBoneco(skin)}</span>`}
      <b>${escapeHtml(p.nick)}${p.user_id === sala.host_id ? ` <small>· ${escapeHtml(t("lobby.host"))}</small>` : ""}${eu ? ` <small>· ${escapeHtml(t("lobby.you"))}</small>` : ""}</b>
      ${host && !eu ? `<button type="button" class="icon-btn" data-tirar="${escapeHtml(p.user_id)}" title="${escapeHtml(t("lobby.kick"))}" aria-label="${escapeHtml(t("lobby.kick"))}">${ICONES.x}</button>` : ""}
    </div>`;
  }).join("");
  const n = salaRodadas();
  $("lobby-rounds").innerHTML = CZ_RODADAS.map((r) =>
    `<button type="button" role="radio" aria-checked="${r === n}" class="${r === n ? "on" : ""}" data-r="${r}" ${host ? "" : "disabled"}>${r}</button>`).join("");
  const dono = salaJogadores.find((p) => p.user_id === sala.host_id);
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = salaJogadores.length < 2;
  $("lobby-status").textContent = host
    ? t(salaJogadores.length < 2 ? "lobby.needTwo" : "lobby.ready")
    : t("lobby.waitHost", { nome: dono ? dono.nick : "?" });
}

function salaRodadas() {
  const r = sala && sala.settings && sala.settings.rodadas;
  return CZ_RODADAS.includes(r) ? r : 10;
}

async function mudarRodadasDaSala(n) {
  if (!isHost() || !CZ_RODADAS.includes(n)) return;
  rodadas = n;
  store("rodadas", n);
  sala.settings = { ...(sala.settings || {}), rodadas: n };
  renderSala();
  await sb.from("cravazi_salas").update({ settings: sala.settings }).eq("code", sala.code);
  enviar("sala");
}

async function tirarDaSala(uid) {
  await sb.from("cravazi_sala_jogadores").delete().eq("sala_code", sala.code).eq("user_id", uid);
  await atualizarSala();
  renderSala();
  enviar("sala");
}

async function comecarOnline() {
  if (!isHost()) return;
  await atualizarSala();
  if (salaJogadores.length < 2) return renderSala();
  const lista = salaJogadores.map((p) => ({ id: p.user_id, nome: p.nick, skin: p.user_id === me.id ? minhaSkin() : czSkinValida(p.skin) }));
  modo = "online";
  partidaRegistrada = false;
  partidaContada = false;
  partida = czNovaPartida({ jogadores: lista, rodadas: salaRodadas() });
  show("game");
  renderJogo();
  onlineTransmitir();
  focarCampo("guess");
}

// Fim da partida online: o anfitrião guarda no histórico (cada um vê as partidas em que jogou).
function onlinePartidaAcabou() {
  if (!isHost() || partidaRegistrada || !partida) return;
  partidaRegistrada = true;
  const players = czPlacar(partida).map((l) => ({ uid: l.id, nick: l.nome, pontos: l.pontos, pos: l.pos }));
  sb.from("cravazi_partidas").insert({ sala_code: sala.code, rodadas: partida.perguntas.length, players }).then(() => {}, () => {});
}

async function voltarParaSala() {
  if (!sala) return irInicio();
  if (isHost()) {
    await sb.from("cravazi_salas").update({ status: "lobby", state: null }).eq("code", sala.code);
    enviar("voltar");
  }
  await atualizarSala();
  if (sala) mostrarSala();
}

async function sairDaSala() {
  const codigo = sala && sala.code;
  try {
    // Anfitrião saindo no meio da partida: deixa o estado salvo para quem assumir.
    if (codigo && isHost() && partida && modo === "online") await sb.from("cravazi_salas").update({ state: partida }).eq("code", codigo);
    // O banco passa o comando para quem entrou primeiro (a sala só fecha quando sai o último).
    const { data: novo } = codigo ? await sb.rpc("cravazi_sair_da_sala", { p_code: codigo }) : { data: null };
    if (codigo) enviar(novo ? "sala" : "fechou");
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
  copiar(t("lobby.shareText", { url }), btn);
}

// Volta sozinho para a sala depois de recarregar a página, ou entra pelo link de convite.
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

function ligarOnline() {
  $("online-back").onclick = irInicio;
  $("online-skin").onclick = trocarMinhaSkin;
  $("create-room-btn").onclick = (e) => ocupado(e.currentTarget, criarSala);
  $("join-form").onsubmit = (e) => {
    e.preventDefault();
    ocupado($("join-room-btn"), () => entrarComCodigo($("join-code").value));
  };
  $("join-code").addEventListener("input", (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")));
  $("share-room").onclick = (e) => convidar(e.currentTarget);
  $("leave-room").onclick = sairDaSala;
  $("lobby-start").onclick = () => comecarOnline().catch(onlineErro);
  $("lobby-rounds").onclick = (e) => {
    const b = e.target.closest("[data-r]");
    if (b) mudarRodadasDaSala(Number(b.dataset.r)).catch(onlineErro);
  };
  $("lobby-players").onclick = (e) => {
    if (e.target.closest("[data-minha-skin]")) return trocarMinhaSkin();
    const b = e.target.closest("[data-tirar]");
    if (b && isHost()) tirarDaSala(b.dataset.tirar).catch(onlineErro);
  };
}
