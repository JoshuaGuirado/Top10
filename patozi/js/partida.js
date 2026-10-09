// Partida na tela: quem joga, opções, a carta, os chutes, o "Nem a pato!", a revelação e o resultado.
// Serve para o jogo no mesmo aparelho (modo "local") e para o online (modo "online", ver online.js).

let partida = null;
let modo = "local";
let botCabeca = {}; // índice do jogador → palpite interno do computador nesta rodada
let botCabecaRodada = -1;
let botTimer = null;
let animadoSeq = -1; // revelação já animada (não repete ao redesenhar)
let revealTimers = [];

// ───────────── jogadores e opções (jogo local) ─────────────

function meuNome() {
  return (store("nick") || "").trim();
}

function minhaCor() {
  const c = store("cor");
  return Number.isInteger(c) ? c : 0;
}

function jogadoresSalvos() {
  const lista = store("jogadores");
  if (Array.isArray(lista) && lista.length >= 1) return lista;
  return [{ nome: meuNome(), cor: minhaCor(), bot: false }, { nome: "", cor: 2, bot: true, pato: patoSorteado() }, { nome: "", cor: 3, bot: true, pato: patoSorteado() }];
}

let jogadores = jogadoresSalvos();

function configSalva() {
  return { temas: [], duracao: "normal", dobrei: true, mosca: true, ...(store("config") || {}) };
}

let config = configSalva();

function nomePadrao(i) {
  const p = jogadores[i];
  if (p.bot) return t("setup.bot") + " " + (jogadores.slice(0, i + 1).filter((x) => x.bot).length);
  return i === 0 ? t("setup.you") : t("setup.player", { n: i + 1 });
}

// Visual do pato de cada um na tela de jogadores: o seu vem do Perfil; o computador sorteia o dele.
function visualDe(p, i) {
  return i === 0 && !p.bot ? meuPato() : p.pato || null;
}

function corLivre() {
  const usadas = new Set(jogadores.map((p) => p.cor));
  const livre = PZ_CORES.findIndex((_, i) => !usadas.has(i));
  return livre >= 0 ? livre : jogadores.length % PZ_CORES.length;
}

function salvarJogadores() {
  store("jogadores", jogadores);
  if (jogadores[0] && !jogadores[0].bot) {
    store("nick", (jogadores[0].nome || "").trim().slice(0, 16));
    store("cor", jogadores[0].cor);
  }
}

function renderSetup() {
  $("player-list").innerHTML = jogadores.map((p, i) => `
    <div class="player-row" data-i="${i}">
      <button type="button" class="duck-btn" data-act="cor" aria-label="${escapeHtml(t("setup.dress"))}" title="${escapeHtml(t("setup.dress"))}">${patoSvg(p.cor, "", visualDe(p, i))}</button>
      <input value="${escapeHtml(p.nome || "")}" maxlength="16" placeholder="${escapeHtml(nomePadrao(i))}" aria-label="${escapeHtml(t("setup.name"))}">
      ${p.bot ? `<span class="tag">${UI_ICONS.bot}${escapeHtml(t("setup.botTag"))}</span>` : ""}
      <button type="button" class="remove" data-act="tirar" aria-label="${escapeHtml(t("setup.remove"))}" title="${escapeHtml(t("setup.remove"))}" ${jogadores.length <= 1 ? "disabled" : ""}>×</button>
    </div>`).join("");
  $("add-human").disabled = $("add-bot").disabled = jogadores.length >= PZ_MAX_JOGADORES;
  renderStarter();
  renderOptions($("local-options"), config, jogadores.length, true, (c) => {
    config = c;
    store("config", config);
    renderSetup();
  });
  $("setup-error").textContent = "";
}

// Quem começa: "random" (sorteia) ou o índice do jogador na lista.
function comecaEscolhido() {
  const c = store("comeca");
  return Number.isInteger(c) && c >= 0 && c < jogadores.length ? c : "random";
}

function renderStarter() {
  const atual = comecaEscolhido();
  const chip = (valor, nome, icone = "") => `<button type="button" class="chip plain ${atual === valor ? "active" : ""}" data-comeca="${valor}">${icone}${escapeHtml(nome)}</button>`;
  $("starter-chips").innerHTML = chip("random", t("start.random"), UI_ICONS.dice || "") +
    jogadores.map((p, i) => chip(i, (p.nome || "").trim() || nomePadrao(i))).join("");
}

function setupClick(e) {
  const row = e.target.closest(".player-row");
  const btn = e.target.closest("button[data-act]");
  if (!row || !btn) return;
  const i = Number(row.dataset.i);
  if (btn.dataset.act === "cor") {
    // Cada um veste o próprio pato (o seu vale também para o Perfil e para a conta).
    const p = jogadores[i];
    return abrirGuardaRoupa(p.nome || nomePadrao(i), { cor: p.cor, pato: visualDe(p, i) }, (cor, pato) => {
      p.cor = cor;
      if (i === 0 && !p.bot) store("pato", pato);
      else p.pato = pato;
      salvarJogadores();
      renderSetup();
    });
  } else if (btn.dataset.act === "tirar") {
    jogadores.splice(i, 1);
    const c = store("comeca");
    if (Number.isInteger(c)) store("comeca", c === i ? "random" : c > i ? c - 1 : c);
  }
  salvarJogadores();
  renderSetup();
}

function setupInput(e) {
  const row = e.target.closest(".player-row");
  if (!row || e.target.tagName !== "INPUT") return;
  jogadores[Number(row.dataset.i)].nome = e.target.value;
  salvarJogadores();
  renderStarter();
}

function addJogador(bot) {
  if (jogadores.length >= PZ_MAX_JOGADORES) return;
  jogadores.push({ nome: "", cor: corLivre(), bot, pato: bot ? patoSorteado() : null });
  salvarJogadores();
  renderSetup();
  if (!bot) {
    const inputs = $("player-list").querySelectorAll("input");
    inputs[inputs.length - 1].focus();
  }
}

// Opções da partida (temas, duração e regras extras). Usado aqui e na sala online.
function renderOptions(el, cfg, nJogadores, editavel, onChange) {
  const todos = !cfg.temas.length;
  const dis = editavel ? "" : "disabled";
  const nCartas = (id) => pzCartasDosTemas([id]).length;
  // Fechado por padrão, com um resumo (temas · duração); abre quem quiser mudar.
  const temasTexto = todos ? t("opt.allThemes") : cfg.temas.length === 1 ? temaNome(cfg.temas[0]) : t("opt.nThemes", { n: cfg.temas.length });
  trocarHtml(el, `<details class="opts" ${el.pzAberto ? "open" : ""}>
    <summary><span>${escapeHtml(t("opt.title"))}</span><small>${escapeHtml(temasTexto)} · ${escapeHtml(t("opt." + cfg.duracao))}</small></summary>
    <div class="opts-body">
    <p class="opt-label">${escapeHtml(t("opt.themes"))}</p>
    <div class="chips">
      <button type="button" class="chip plain ${todos ? "active" : ""}" data-tema="*" ${dis}>${escapeHtml(t("opt.all"))}</button>
      ${PZ_TEMAS.map((tema) => `<button type="button" class="chip ${!todos && cfg.temas.includes(tema.id) ? "active" : ""}" data-tema="${tema.id}" title="${escapeHtml(t("home.cards", { n: nCartas(tema.id) }))}" ${dis}>${themeIcon(tema.id)}${escapeHtml(tr(tema.nome))}</button>`).join("")}
    </div>
    <p class="opt-label">${escapeHtml(t("opt.length"))}</p>
    <div class="chips">
      ${["rapida", "normal", "longa"].map((d) => `<button type="button" class="chip plain ${cfg.duracao === d ? "active" : ""}" data-dur="${d}" ${dis}>${escapeHtml(t("opt." + d))}</button>`).join("")}
    </div>
    <p class="small muted">${escapeHtml(t("opt.lengthHint", { n: pzMeta(Math.max(2, nJogadores), cfg.duracao) }))}</p>
    <p class="opt-label">${escapeHtml(t("opt.extras"))}</p>
    <label class="check"><input type="checkbox" data-regra="dobrei" ${cfg.dobrei ? "checked" : ""} ${dis}><span>${escapeHtml(t("opt.dobrei"))}</span></label>
    <label class="check"><input type="checkbox" data-regra="mosca" ${cfg.mosca ? "checked" : ""} ${dis}><span>${escapeHtml(t("opt.mosca"))}</span></label>
    </div>
  </details>`);
  el.querySelector("details").ontoggle = (e) => (el.pzAberto = e.target.open);
  if (!editavel) return;
  el.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const c = { ...cfg, temas: cfg.temas.slice() };
    if (b.dataset.tema === "*") c.temas = [];
    else if (b.dataset.tema) {
      const id = b.dataset.tema;
      c.temas = c.temas.includes(id) ? c.temas.filter((x) => x !== id) : [...c.temas, id];
      if (c.temas.length === PZ_TEMAS.length) c.temas = [];
    } else if (b.dataset.dur) c.duracao = b.dataset.dur;
    sfx.tick();
    onChange(c);
  };
  el.onchange = (e) => {
    const r = e.target.dataset.regra;
    if (r) onChange({ ...cfg, [r]: e.target.checked });
  };
}

function resumoOpcoes(cfg) {
  const temas = cfg.temas.length ? cfg.temas.map(temaNome).join(", ") : t("opt.all");
  return t("lobby.settings", { temas, duracao: t("opt." + cfg.duracao) });
}

function comecarLocal() {
  const err = $("setup-error");
  if (jogadores.length < 2) return (err.textContent = t("setup.errMin"));
  if (!jogadores.some((p) => !p.bot)) return (err.textContent = t("setup.errHuman"));
  const lista = jogadores.map((p, i) => ({
    id: i === 0 && !p.bot ? "eu" : "j" + i,
    nome: (p.nome || "").trim().slice(0, 16) || nomePadrao(i),
    cor: p.cor,
    pato: visualDe(p, i),
    bot: p.bot,
  }));
  modo = "local";
  const comeca = comecaEscolhido();
  iniciarPartida(pzNovaPartida({ jogadores: lista, ...config, comeca: comeca === "random" ? null : comeca }));
}

// ───────────── partida ─────────────

function iniciarPartida(estado) {
  partida = estado;
  animadoSeq = -1;
  botCabeca = {};
  botCabecaRodada = -1;
  show("game");
  renderGame();
}

// Índice do jogador deste aparelho na partida (-1 se não está nela).
function meuIndice() {
  if (!partida) return -1;
  if (modo === "online") return partida.jogadores.findIndex((p) => p.id === myId());
  return partida.jogadores.findIndex((p) => p.id === "eu");
}

// Este aparelho pode jogar pelo jogador i agora?
function controlo(i) {
  if (!partida || i < 0) return false;
  if (modo === "online") return partida.jogadores[i].id === myId();
  return !partida.jogadores[i].bot;
}

// Quem o computador joga: os bots no local; no online, quem saiu da sala (só no aparelho do anfitrião).
function jogaComputador(i) {
  if (modo === "online") return typeof onlineAusente === "function" && onlineAusente(i);
  return partida.jogadores[i].bot;
}

function nomeDe(i) {
  return partida.jogadores[i].nome;
}

function renderScoreboard() {
  $("scoreboard").innerHTML = partida.jogadores.map((p, i) => {
    const ausente = modo === "online" && typeof onlinePresente === "function" && !onlinePresente(p.id);
    return `<div class="score-chip ${partida.fase === "lance" && i === partida.vez ? "current" : ""} ${ausente ? "away" : ""}">
      ${patoSvg(p.cor, "", p.pato)}
      <b>${escapeHtml(p.nome)}</b>
      <span title="${escapeHtml(tn("game.ducks", pzPatos(p)) + " · " + tn("game.cards", p.cartas.length))}">${PATO_MINI}${pzPatos(p)} · ${p.cartas.length}/${partida.config.meta}${p.dobreis ? ` · ${UI_ICONS.shield}${p.dobreis}` : ""}</span>
    </div>`;
  }).join("");
}

function renderCard() {
  const carta = pzCarta(partida.carta);
  const card = $("card");
  if (card.dataset.carta !== carta.id + ":" + partida.rodada) {
    card.dataset.carta = carta.id + ":" + partida.rodada;
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
  }
  $("card-theme").innerHTML = themeIcon(carta.tema) + escapeHtml(temaNome(carta.tema));
  $("card-ducks").innerHTML = patosHtml(carta.patos);
  $("card-q").textContent = tr(carta.q);
  $("card-unit").hidden = !unidade(carta);
  $("card-unit").textContent = t("card.unit", { u: unidade(carta) });
  const u = pzUltimo(partida);
  const bid = $("bid");
  const chave = u ? partida.lances.length + ":" + u.valor : "0";
  if (u) {
    const novo = bid.dataset.k !== chave;
    bid.innerHTML = `<span class="bid-value ${novo ? "pop" : ""}">${fmt(u.valor, carta.ano)}${unidadeHtml(carta)}</span><span class="bid-who">${escapeHtml(t("game.lastBid", { nome: nomeDe(u.j) }))}${u.dobrei ? ` · ${escapeHtml(t("game.dobrei"))}` : ""}</span>`;
  } else bid.innerHTML = `<span class="bid-empty">${escapeHtml(t("game.noBid"))}</span>`;
  bid.dataset.k = chave;
  $("bids").innerHTML = partida.lances.slice(0, -1).map((l) => `<li class="${l.dobrei ? "dbl" : ""}">${escapeHtml(nomeDe(l.j))}: ${fmtU(l.valor, carta)}</li>`).join("");
}

function renderTurn() {
  const box = $("turn");
  if (partida.fase !== "lance") {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const i = partida.vez;
  const p = partida.jogadores[i];
  const u = pzUltimo(partida);
  const minimo = pzMinimo(partida);
  const carta = pzCarta(partida.carta);
  if (controlo(i)) {
    const meu = modo === "online" || partida.jogadores.filter((x) => !x.bot).length === 1;
    box.innerHTML = `
      <p class="turn-name">${patoSvg(p.cor, "", p.pato)}${escapeHtml(t(meu ? "game.yourTurn" : "game.turnOf", { nome: p.nome }))}</p>
      <p class="turn-hint">${escapeHtml(u ? t("game.raise", { min: fmtU(minimo, carta) }) : t("game.first"))}</p>
      <form class="guess-row" id="guess-form">
        ${campoChute("guess", t("game.guessPh"), carta)}
        <button type="submit" class="btn">${escapeHtml(t("game.guess"))}</button>
      </form>
      <button type="button" class="btn nem" id="nem-btn" ${u ? "" : "disabled"}>${escapeHtml(t("game.nemApato"))}</button>
      <p class="input-error" id="guess-error"></p>`;
    $("guess-form").onsubmit = (e) => {
      e.preventDefault();
      const v = lerNumero($("guess").value);
      if (!Number.isFinite(v)) return ($("guess-error").textContent = t("game.errNum"));
      if (v < minimo) return ($("guess-error").textContent = t("game.errLow", { min: fmtU(minimo, carta) }));
      agir({ tipo: "chutar", valor: v });
    };
    $("nem-btn").onclick = () => agir({ tipo: "duvidar" });
    if (matchMedia("(hover: hover)").matches) $("guess").focus({ preventScroll: true });
  } else {
    const pensando = jogaComputador(i) || p.bot;
    box.innerHTML = `
      <p class="turn-name">${patoSvg(p.cor, "", p.pato)}${escapeHtml(t("game.turnOf", { nome: p.nome }))}</p>
      <p class="thinking"><span class="dots"><i></i><i></i><i></i></span>${escapeHtml(t(pensando ? "game.thinking" : "game.waiting", { nome: p.nome }))}</p>`;
  }
}

// Campo do chute, com a unidade da carta no fim (km, L, kg…), quando tem.
function campoChute(id, texto, carta) {
  const u = unidade(carta);
  // Espaço à direita do número para caber a unidade (que é menor que o número digitado).
  const espaco = u ? ` style="padding-right: ${(1.2 + u.length * 0.45).toFixed(1)}em"` : "";
  const input = `<input class="answer-input" id="${id}" inputmode="numeric" autocomplete="off" placeholder="${escapeHtml(texto)}" aria-label="${escapeHtml(u ? `${texto} (${u})` : texto)}"${espaco}>`;
  return u ? `<span class="unit-input${u.length > 6 ? " long" : ""}">${input}<span class="unit-suffix" aria-hidden="true">${escapeHtml(u)}</span></span>` : input;
}

function veredito(r) {
  const valor = fmtU(r.valor, pzCarta(partida.carta));
  if (r.mosca) return t("game.bullseye", { valor, nome: nomeDe(r.perdedor) });
  if (r.passou) return t("game.over", { valor, nome: nomeDe(r.perdedor) });
  return t("game.fits", { valor, nome: nomeDe(r.perdedor) });
}

function renderReveal() {
  const box = $("reveal");
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  if (partida.fase !== "revelado") {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const r = partida.resultado;
  const carta = pzCarta(partida.carta);
  const perdedor = partida.jogadores[r.perdedor];
  const podeSeguir = modo === "local" || isHost();
  const botao = partida.fim
    ? `<button type="button" class="btn big" id="next-btn">${escapeHtml(t("game.results"))}</button>`
    : podeSeguir
      ? `<button type="button" class="btn big" id="next-btn">${escapeHtml(t("game.next"))}</button>`
      : `<p class="small muted">${escapeHtml(t("game.waitHost"))}</p>`;
  const final = `
    <p class="reveal-label">${escapeHtml(t("game.answerIs"))}</p>
    <p class="reveal-answer"><span id="answer-num">${fmt(r.resposta, carta.ano)}</span>${unidadeHtml(carta)}</p>
    <p class="verdict">${escapeHtml(veredito(r))}</p>
    <span class="taker">${patoSvg(perdedor.cor, "sad", perdedor.pato)}${escapeHtml(tn("game.takes", r.patos, { nome: perdedor.nome }))}</span>
    <div class="actions center">${botao}</div>`;
  const topo = `<p class="reveal-call">${escapeHtml(t("game.called", { nome: nomeDe(r.desafiante) }))}</p><p class="reveal-shout">${escapeHtml(t("game.nemApato"))}</p>`;
  const ligar = () => {
    const b = $("next-btn");
    if (b) b.onclick = seguir;
  };
  if (animadoSeq === partida.seq || reduceMotion) {
    box.innerHTML = topo + final;
    ligar();
    return;
  }
  animadoSeq = partida.seq;
  box.innerHTML = topo + '<div class="drum"><span></span><span></span><span></span></div>';
  sfx.quack();
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  revealTimers.push(setTimeout(() => sfx.drumroll(1100), 500));
  revealTimers.push(setTimeout(() => {
    box.innerHTML = topo + final;
    ligar();
    contarAte($("answer-num"), r.resposta, carta.ano);
    const meu = meuIndice();
    if (meu >= 0 && r.perdedor === meu) sfx.bad();
    else sfx.good();
    if (r.perdedor >= 0) fx.feathers(PZ_CORES[perdedor.cor % PZ_CORES.length], 14);
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 1700));
}

function contarAte(el, alvo, ano) {
  if (!el || reduceMotion) return;
  const ini = ano ? Math.max(0, alvo - 60) : 0;
  const t0 = performance.now();
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / 650);
    el.textContent = fmt(Math.round(ini + (alvo - ini) * (1 - Math.pow(1 - k, 3))), ano);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function renderGame() {
  if (!partida || document.body.dataset.screen !== "game") return;
  $("game-round").textContent = t("game.round", { n: partida.rodada, meta: partida.config.meta });
  renderScoreboard();
  renderCard();
  renderTurn();
  renderReveal();
  agendarComputador();
}

// Um lance de quem está na vez, vindo deste aparelho.
function agir(acao) {
  if (!partida || !controlo(partida.vez)) return;
  if (modo === "online" && !isHost()) return enviarAcao(acao);
  aplicarAcao(acao, partida.vez);
}

function aplicarAcao(acao, j) {
  const err = acao.tipo === "duvidar" ? pzDuvidar(partida, j) : pzChutar(partida, j, acao.valor);
  if (err) return err;
  if (acao.tipo === "chutar") sfx.bid();
  depoisDaMudanca();
  return null;
}

function depoisDaMudanca() {
  if (modo === "online" && typeof onlineTransmitir === "function") onlineTransmitir();
  renderGame();
}

function seguir() {
  if (!partida) return;
  if (partida.fim) return mostrarResultado();
  if (modo === "online" && !isHost()) return;
  pzProxima(partida);
  depoisDaMudanca();
}

function agendarComputador() {
  clearTimeout(botTimer);
  if (!partida || partida.fase !== "lance") return;
  if (modo === "online" && !isHost()) return;
  const i = partida.vez;
  if (!jogaComputador(i)) return;
  if (botCabecaRodada !== partida.rodada) {
    botCabeca = {};
    botCabecaRodada = partida.rodada;
  }
  const seq = partida.seq;
  botTimer = setTimeout(() => {
    if (!partida || partida.seq !== seq || partida.vez !== i) return;
    const carta = pzCarta(partida.carta);
    botCabeca[i] = botCabeca[i] || pzBotPalpite(carta);
    aplicarAcao(pzBotJogada(partida, botCabeca[i]), i);
  }, 900 + Math.random() * 900);
}

function sairDaPartida() {
  if (partida && !partida.fim && !confirm(t("game.quitConfirm"))) return;
  clearTimeout(botTimer);
  revealTimers.forEach(clearTimeout);
  if (modo === "online") return sairDaSala();
  partida = null;
  irInicio();
}

// ───────────── resultado ─────────────

function mostrarResultado() {
  if (!partida) return;
  clearTimeout(botTimer);
  revealTimers.forEach(clearTimeout);
  const placar = pzPlacar(partida);
  const perdedores = placar.filter((l) => l.perdeu);
  const nomes = perdedores.map((l) => l.nome);
  const juntos = nomes.length > 1 ? nomes.slice(0, -1).join(", ") + t("res.and") + nomes[nomes.length - 1] : nomes[0];
  $("loser").innerHTML = `
    <div class="loser-ducks">${perdedores.slice(0, 4).map((l) => patoSvg(l.cor, "sad", l.pato)).join("")}</div>
    <h2>${escapeHtml(nomes.length > 1 ? t("res.losers", { nomes: juntos }) : t("res.loser", { nome: juntos }))}</h2>
    <p>${escapeHtml(t("res.sub"))}</p>`;
  let lugar = 0;
  let anterior = null;
  $("ranking").innerHTML = placar.map((l, k) => {
    if (l.patos !== anterior) lugar = k + 1;
    anterior = l.patos;
    return `<div class="rank-row ${l.perdeu ? "lost" : ""}" style="--i:${k}">
      <span class="rank-place">${lugar}</span>
      ${patoSvg(l.cor, l.perdeu ? "sad" : "happy", l.pato)}
      <div><b>${escapeHtml(l.nome)}</b><small>${escapeHtml(tn("game.cards", l.cartas))}${l.dobreis ? " · " + escapeHtml(tn("game.shields", l.dobreis)) : ""} · ${escapeHtml(l.perdeu ? t("res.duck") : t("res.won"))}</small></div>
      <span class="rank-ducks">${l.patos}${PATO_MINI}</span>
    </div>`;
  }).join("");
  $("again-btn").hidden = modo === "online" && !isHost();
  show("results");
  const eu = meuIndice();
  const perdi = eu >= 0 && placar.find((l) => l.i === eu).perdeu;
  setTimeout(() => {
    if (perdi) {
      sfx.lose();
      fx.feathers(PZ_CORES[partida.jogadores[eu].cor % PZ_CORES.length]);
    } else {
      sfx.win();
      fx.confetti();
    }
  }, 400);
  contarPartida();
  if (modo === "online" && typeof onlinePartidaAcabou === "function") onlinePartidaAcabou();
}

function loadStats() {
  return { partidas: 0, escapou: 0, pato: 0, duvidas: 0, duvidasCertas: 0, patos: 0, dobreis: 0, diarios: 0, melhorDiario: 0, ...(store("stats") || {}) };
}

// Estatísticas de quem joga neste aparelho (uma vez por partida).
function contarPartida() {
  const eu = meuIndice();
  if (!partida || partida.contada || eu < 0) return;
  partida.contada = true;
  const st = loadStats();
  const linha = pzPlacar(partida).find((l) => l.i === eu);
  st.partidas += 1;
  if (linha.perdeu) st.pato += 1;
  else st.escapou += 1;
  st.patos += partida.jogadores[eu].cartas.reduce((n, c) => n + c.patos, 0);
  st.dobreis += partida.jogadores[eu].dobreis;
  partida.hist.filter((h) => h.desafiante === eu).forEach((h) => {
    st.duvidas += 1;
    if (h.passou) st.duvidasCertas += 1;
  });
  store("stats", st);
}

function jogarDeNovo() {
  if (modo === "online") return voltarParaSala();
  comecarLocal();
}
