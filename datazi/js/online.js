// Datazi online: salas com código, sala de espera e partida ao vivo, cada um no seu celular.
//
// Como no Tamanhozi: o aparelho de quem cria a sala (anfitrião) roda a partida com as regras de jogo.js e manda o
// estado inteiro para os outros pelo Realtime. O anfitrião escolhe o modo (linha do tempo, "Qual veio antes?" ou
// "Em que ano?"); todo mundo joga a mesma rodada ao mesmo tempo e manda só a própria resposta. Quando todos que estão
// na sala responderam (ou acaba o tempo da rodada), o anfitrião revela e cada um leva os pontos da própria resposta. O estado também fica salvo em datazi_salas.state, então quem cai ou recarrega a página
// volta para a partida. Se quem sai é o anfitrião, o comando passa para quem entrou primeiro (datazi_sair_da_sala)
// ou, se ele só sumiu, quem ficou assume depois de alguns segundos (datazi_assumir_sala).
// O banco é o mesmo do Topzi (chaves em ../topzi/js/config.js); as tabelas são datazi_* (supabase/schema.sql).

const SALA_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const AUSENTE_MS = 6000;

let sb = null;
let me = null; // { id }
let sala = null; // linha de datazi_salas
let salaJogadores = [];
let canal = null;
let presentes = new Set();
let sumiuEm = new Map(); // id → quando saiu da presença
let salvarTimer = null;
let partidaRegistrada = false;
let partidaContada = false;

function meuId() {
  return me ? me.id : null;
}

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

async function criarSala() {
  const nick = nickOnline();
  await ensureOnline();
  let codigo = null;
  for (let k = 0; k < 5 && !codigo; k++) {
    const tentativa = codigoNovo();
    const { error } = await sb.from("datazi_salas").insert({ code: tentativa, host_id: me.id, status: "lobby", settings: { tipo: DZ_MODOS.includes(store("tipo")) ? store("tipo") : "linha" } });
    if (!error) codigo = tentativa;
    else if (error.code !== "23505") throw erroDoBanco(error);
  }
  if (!codigo) throw new Error(t("on.errNet"));
  const { error } = await sb.from("datazi_sala_jogadores").insert({ sala_code: codigo, user_id: me.id, nick });
  if (error) throw erroDoBanco(error);
  sb.rpc("datazi_limpar_salas").then(() => {}, () => {});
  await entrarNaSala(codigo);
}

async function entrarComCodigo(bruto, silencioso = false) {
  const codigo = String(bruto || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(codigo)) throw new Error(t("on.errCode"));
  const nick = silencioso ? (store("nick") || "?") : nickOnline();
  await ensureOnline();
  const [{ data: r, error: erro }, lista] = await Promise.all([sb.from("datazi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
  if (erro) throw erroDoBanco(erro);
  if (!r) {
    store("sala", null);
    throw new Error(t("on.errNoRoom"));
  }
  const dentro = lista.find((p) => p.user_id === me.id);
  if (!dentro) {
    if (r.status === "playing") throw new Error(t("on.errPlaying"));
    if (lista.length >= DZ_MAX_JOGADORES) throw new Error(t("on.errFull"));
    const { error } = await sb.from("datazi_sala_jogadores").insert({ sala_code: codigo, user_id: me.id, nick });
    if (error) throw /cheia|full/i.test(error.message || "") ? new Error(t("on.errFull")) : erroDoBanco(error);
  } else if (!silencioso) {
    sb.from("datazi_sala_jogadores").update({ nick }).eq("sala_code", codigo).eq("user_id", me.id).then(() => {}, () => {});
  }
  await entrarNaSala(codigo);
}

async function buscarJogadores(codigo) {
  const { data } = await sb.from("datazi_sala_jogadores").select("*").eq("sala_code", codigo).order("joined_at");
  return data || [];
}

async function atualizarSala(codigo = sala && sala.code) {
  if (!codigo) return;
  const [{ data: r }, lista] = await Promise.all([sb.from("datazi_salas").select("*").eq("code", codigo).maybeSingle(), buscarJogadores(codigo)]);
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
  const { data, error } = await sb.rpc("datazi_assumir_sala", { p_code: sala.code });
  if (error || !data) return;
  await atualizarSala();
  enviar("sala");
}

// Quem está jogando agora (presente na sala, ou eu mesmo). Quem saiu há alguns segundos não segura a rodada.
function idsPresentes() {
  if (!partida) return [];
  return partida.jogadores.map((j) => j.id).filter((id) => id === meuId() || presentes.has(id) || !(sumiuEm.has(id) && Date.now() - sumiuEm.get(id) >= AUSENTE_MS));
}

// O anfitrião revela quando todo mundo respondeu ou quando acaba o tempo da rodada.
function talvezRevelar() {
  if (!isHost() || !partida || modo !== "online" || partida.fim || partida.fase !== "jogando") return;
  const tempoAcabou = Date.now() - partida.comecou >= DZ_ONLINE_SEGUNDOS * 1000;
  const alguem = Object.keys(partida.respostas).length > 0;
  if ((alguem && dzOnlineTodos(partida, idsPresentes())) || tempoAcabou) {
    dzOnlineRevelar(partida);
    onlineTransmitir();
    if (document.body.dataset.screen === "game") renderJogo();
  }
}

setInterval(() => {
  conferirAnfitriao().catch(() => {});
  talvezRevelar();
  renderTimer();
}, 1000);

function renderTimer() {
  const el = $("timer");
  if (!el) return;
  const ativo = partida && partida.online && !partida.fim && partida.fase === "jogando" && document.body.dataset.screen === "game";
  el.hidden = !ativo;
  if (!ativo) return;
  const resta = Math.max(0, Math.ceil(DZ_ONLINE_SEGUNDOS - (Date.now() - partida.comecou) / 1000));
  el.textContent = "0:" + String(resta).padStart(2, "0");
  el.classList.toggle("pouco", resta <= 10);
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

// ───────────── tempo real ─────────────

function conectarCanal(codigo) {
  sairDoCanal();
  canal = sb.channel("datazi-" + codigo, { config: { broadcast: { self: false }, presence: { key: me.id } } });
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
    if (sala && partida) sb.from("datazi_salas").update({ state: partida, status: partida.fim ? "finished" : "playing" }).eq("code", sala.code).then(() => {}, () => {});
  }, 300);
}

function receberEstado(estado, forcar = false) {
  if (!estado || (isHost() && !forcar)) return;
  if (!forcar && partida && modo === "online" && (estado.seq || 0) < (partida.seq || 0)) return;
  const antes = modo === "online" ? partida : null;
  const nova = !antes || estado.atual < antes.atual || !antes.online;
  modo = "online";
  partida = estado;
  if (partida.fim) {
    if (document.body.dataset.screen !== "results" || nova) terminarOnline();
    return;
  }
  if (nova) partidaContada = false;
  if (document.body.dataset.screen !== "game") show("game");
  renderJogo();
  if (antes && antes.fase === "jogando" && estado.fase === "revelado" && navigator.vibrate) navigator.vibrate(40);
}

// Minha resposta da rodada: o anfitrião aplica na hora; os outros mandam para ele.
function onlineResponder(v) {
  if (!partida || !me) return;
  if (isHost()) {
    dzOnlineResponder(partida, me.id, v);
    onlineTransmitir();
    renderJogo();
    talvezRevelar();
    return;
  }
  enviar("acao", { uid: me.id, acao: { tipo: "responder", v }, rodada: partida.atual });
  // Mostra na hora que mandou; o estado com a resposta chega do anfitrião em seguida.
  partida.respostas[me.id] = v;
  renderJogo();
}

function onlineProxima() {
  if (!isHost() || !partida) return;
  if (dzOnlineProxima(partida)) {
    onlineTransmitir();
    onlinePartidaAcabou();
    return terminarOnline();
  }
  onlineTransmitir();
  renderJogo();
}

function receberAcao({ uid, acao, rodada: r }) {
  if (!isHost() || !partida || partida.fim || !acao || r !== partida.atual) return;
  if (acao.tipo === "responder" && dzOnlineResponder(partida, uid, Number(acao.v))) {
    onlineTransmitir();
    if (document.body.dataset.screen === "game") renderJogo();
    talvezRevelar();
  }
}

// Quem já respondeu (durante a rodada) e, depois de revelar, quem acertou (ou o chute e os pontos, no "Em que ano?").
function renderJogadoresOnline() {
  if (!partida || !partida.online) return;
  const s = partida;
  const fim = s.fase === "revelado";
  const lista = s.jogadores.map((j) => ({ ...j, v: s.respostas[j.id], ganho: s.ganhos[j.id] }));
  if (fim) lista.sort((a, b) => (b.ganho || 0) - (a.ganho || 0));
  $("players").innerHTML = lista.map((j) => {
    let nota;
    if (!fim) nota = j.v !== undefined ? "✓ " + t("on.answered") : t("on.thinking");
    else if (j.v === undefined) nota = t("on.missed");
    else if (s.tipo === "ano") nota = j.v + " · +" + j.ganho;
    else nota = t(j.ganho ? "on.right" : "on.wrong");
    const cls = ["player", fim && j.ganho ? "ganhou" : "", !fim && j.v !== undefined ? "ok" : "", onlinePresente(j.id) ? "" : "away"].filter(Boolean).join(" ");
    return `<span class="${cls}">${escapeHtml(j.nome)}${j.id === meuId() ? " (" + escapeHtml(t("lobby.you")) + ")" : ""} <small>${escapeHtml(nota)}</small><span class="pts">${j.pontos}</span></span>`;
  }).join("");
}

// ───────────── sala de espera ─────────────

function mostrarSala() {
  partida = null;
  modo = "livre";
  show("lobby");
  renderSala();
}

function salaTipo() {
  const m = sala && sala.settings && sala.settings.tipo;
  return DZ_MODOS.includes(m) ? m : "linha";
}

function renderSala() {
  if (!sala) return;
  $("room-code").textContent = sala.code;
  const host = isHost();
  $("lobby-players").innerHTML = salaJogadores.map((p) => {
    const eu = p.user_id === me.id;
    return `<div class="lobby-player ${onlinePresente(p.user_id) ? "here" : ""}"><i></i>
      <b>${escapeHtml(p.nick)}${p.user_id === sala.host_id ? ` <small>· ${escapeHtml(t("lobby.host"))}</small>` : ""}${eu ? ` <small>· ${escapeHtml(t("lobby.you"))}</small>` : ""}</b>
      ${host && !eu ? `<button type="button" class="icon-btn" data-tirar="${escapeHtml(p.user_id)}" title="${escapeHtml(t("lobby.kick"))}" aria-label="${escapeHtml(t("lobby.kick"))}">${ICONES.x}</button>` : ""}
    </div>`;
  }).join("");
  chipsModos($("lobby-modes"), salaTipo(), (m) => mudarTipoDaSala(m).catch(onlineErro), host);
  const dono = salaJogadores.find((p) => p.user_id === sala.host_id);
  $("lobby-start").hidden = !host;
  $("lobby-start").disabled = salaJogadores.length < 2;
  $("lobby-status").textContent = host
    ? t(salaJogadores.length < 2 ? "lobby.needTwo" : "lobby.ready")
    : t("lobby.waitHost", { nome: dono ? dono.nick : "?" });
}

async function mudarTipoDaSala(m) {
  if (!isHost() || !DZ_MODOS.includes(m)) return;
  store("tipo", m);
  sala.settings = { ...(sala.settings || {}), tipo: m };
  renderSala();
  await sb.from("datazi_salas").update({ settings: sala.settings }).eq("code", sala.code);
  enviar("sala");
}

async function tirarDaSala(uid) {
  await sb.from("datazi_sala_jogadores").delete().eq("sala_code", sala.code).eq("user_id", uid);
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
  partida = dzNovaOnline({ jogadores: salaJogadores.map((p) => ({ id: p.user_id, nome: p.nick })), tipo: salaTipo() });
  show("game");
  renderJogo();
  onlineTransmitir();
}

// Fim da partida online: placar, rodadas (com quem pontuou) e "voltar para a sala".
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
  telaResultado(s.tipo === "linha" ? "timeline" : "rounds");
  const placar = dzPlacar(s);
  const venc = placar.filter((j) => j.pos === 1);
  $("res-kicker").textContent = t("game.online") + " · " + t("modo." + s.tipo);
  $("res-score").textContent = venc.length === 1 ? t("res.won", { nome: venc[0].nome }) : t("res.tie");
  $("res-sub").textContent = venc[0] ? (venc[0].pontos === 1 ? t("res.pts1") : t("res.pts", { n: venc[0].pontos })) : "";
  $("res-again").textContent = t("res.backRoom");
  $("res-ranking").hidden = false;
  $("res-ranking").innerHTML = placar.map((j) =>
    `<li class="${j.pos === 1 ? "first" : ""}"><span class="pos">${j.pos}º</span><b>${escapeHtml(j.nome)}</b><span>${escapeHtml(j.pontos === 1 ? t("res.pts1") : t("res.pts", { n: j.pontos }))}</span></li>`).join("");
  const nome = (id) => (s.jogadores.find((j) => j.id === id) || {}).nome;
  if (s.tipo === "linha") {
    $("res-timeline").innerHTML = s.linha.map((id) => {
      const e = dzEvento(id);
      return e ? `<li class="event"><b>${e.ano}</b><span>${escapeHtml(tr(e.txt))}</span></li>` : "";
    }).join("");
    return;
  }
  $("res-timeline").innerHTML = s.hist.map((h) => {
    const quem = Object.entries(h.ganhos).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1])
      .map(([id, p]) => (s.tipo === "ano" ? `${nome(id)} +${p}` : nome(id))).filter(Boolean).join(", ") || "—";
    return rodadaHtml(s.tipo, h.r, quem, "");
  }).join("");
}

function onlinePartidaAcabou() {
  if (!isHost() || partidaRegistrada || !partida) return;
  partidaRegistrada = true;
  const players = dzPlacar(partida).map((l) => ({ uid: l.id, nick: l.nome, pontos: l.pontos, pos: l.pos }));
  sb.from("datazi_partidas").insert({ sala_code: sala.code, tipo: partida.tipo, rodadas: partida.rodadas.length, players }).then(() => {}, () => {});
}

async function voltarParaSala() {
  if (!sala) return irInicio();
  if (isHost()) {
    await sb.from("datazi_salas").update({ status: "lobby", state: null }).eq("code", sala.code);
    enviar("voltar");
  }
  await atualizarSala();
  if (sala) mostrarSala();
}

async function sairDaSala() {
  const codigo = sala && sala.code;
  try {
    if (codigo && isHost() && partida && modo === "online") await sb.from("datazi_salas").update({ state: partida }).eq("code", codigo);
    const { data: novo } = codigo ? await sb.rpc("datazi_sair_da_sala", { p_code: codigo }) : { data: null };
    if (codigo) enviar(novo ? "sala" : "fechou");
  } catch (e) { /* sai mesmo assim */ }
  sairDoCanal();
  sala = null;
  partida = null;
  modo = "livre";
  store("sala", null);
  irInicio();
}

function convidar(btn) {
  copiar(t("lobby.shareText", { url: location.origin + location.pathname + "?sala=" + sala.code }), btn);
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
  $("online-btn").onclick = () => abrirOnline();
  $("online-back").onclick = irInicio;
  $("create-room-btn").onclick = (e) => ocupado(e.currentTarget, criarSala);
  $("join-form").onsubmit = (e) => {
    e.preventDefault();
    ocupado($("join-room-btn"), () => entrarComCodigo($("join-code").value));
  };
  $("join-code").addEventListener("input", (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")));
  $("share-room").onclick = (e) => convidar(e.currentTarget);
  $("leave-room").onclick = sairDaSala;
  $("lobby-start").onclick = () => comecarOnline().catch(onlineErro);
  $("lobby-players").onclick = (e) => {
    const b = e.target.closest("[data-tirar]");
    if (b && isHost()) tirarDaSala(b.dataset.tirar).catch(onlineErro);
  };
}

ligarOnline();
retomarOnline();
