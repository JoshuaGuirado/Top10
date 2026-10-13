// Tamanhozi na tela: início (desafio do dia, partida livre por tema e online), partida e resultado.
// As regras ficam em jogo.js; os textos em textos.js; o online em online.js.
//
// O quadro: as duas coisas em pé no mesmo chão, a referência (escura) à esquerda e a que se ajusta (vermelha) à
// direita, desenhadas na mesma escala (pixels por metro). A escala só muda quando o desenho não cabe mais ou fica
// pequeno demais (e nunca no meio de um arrasto pela alça, senão o canto fugiria do dedo).

let partida = null; // estado de jogo.js (sozinho) ou de tzNovaOnline (online)
let modo = "diario"; // "diario", "livre" ou "online"
let diaAtual = 0;
let categoria = "misto";
let posicao = 0.5; // posição do ajuste na rodada da vez (de 0 a 1)
let pensandoDesde = 0;
let tempoMs = 0; // tempo pensando na partida: desempata o ranking do dia
let vista = null; // { s: pixels por metro, ox: deslocamento x } do quadro na rodada
let travada = false; // durante o arrasto pela alça a vista não muda
let rodadaDesenhada = -1;
let dicaVista = false; // a dica do quadro some de vez depois do primeiro ajuste

const TZ_CATS_UI = ["misto"].concat(TZ_CATEGORIAS);

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

// ───────────── dados guardados ─────────────

function stats() {
  return { partidas: 0, pontos: 0, recorde: 0, online: 0, ...(store("stats") || {}) };
}

function diarios() {
  return store("diario") || {};
}

function sequenciaDiaria() {
  const todos = diarios();
  let dia = tzDiaNumero();
  if (!todos[dia]) dia -= 1;
  let n = 0;
  while (todos[dia]) {
    n += 1;
    dia -= 1;
  }
  return n;
}

// ───────────── início ─────────────

const ICONES = {
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  x: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  resize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
};

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = tzDiaNumero(hoje);
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = tzDiaNumero(d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function chipsCategorias(el, atual, onEscolher, editavel = true) {
  el.innerHTML = TZ_CATS_UI.map((c) =>
    `<button type="button" role="radio" aria-checked="${c === atual}" class="chip ${c === atual ? "active" : ""}" data-cat="${c}" ${editavel ? "" : "disabled"}>${escapeHtml(t("cat." + c))}</button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest("[data-cat]");
    if (b && editavel) onEscolher(b.dataset.cat);
  };
}

function renderHome() {
  const dia = tzDiaNumero();
  const feito = diarios()[dia];
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const seq = sequenciaDiaria();
  $("daily-card").innerHTML = `
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(t("daily.name"))}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString(loc))}</span>
      <button type="button" class="btn ${feito ? "ghost" : ""}" id="daily-btn">${escapeHtml(t(feito ? "btn.share" : "btn.play"))}</button>
    </div>
    ${semanaHtml()}
    ${feito ? `<p class="daily-status">${escapeHtml(t("daily.done", { n: num(feito.acertos) }))}${seq > 1 ? ` · ${escapeHtml(t("res.sub", { n: seq }))}` : ""}</p>` : ""}`;
  $("daily-btn").onclick = (e) => (feito ? compartilhar(dia, feito, e.currentTarget) : comecarDiario(dia));
  $("daily-card").querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => abrirDia(Number(b.dataset.dia))));
  const st = stats();
  $("free-sub").textContent = st.recorde ? t("home.freeSub", { n: num(st.recorde) }) : t("home.freeSubNew");
  categoria = TZ_CATS_UI.includes(store("cat")) ? store("cat") : "misto";
  chipsCategorias($("free-cats"), categoria, (c) => {
    store("cat", c);
    renderHome();
  });
}

function irInicio() {
  partida = null;
  if (modo === "online") modo = "livre";
  renderHome();
  show("home");
}

function abrirDia(dia) {
  const feito = diarios()[dia];
  if (feito) return mostrarResultadoSalvo(dia, feito);
  comecarDiario(dia);
}

// ───────────── partida sozinho ─────────────

function comecarDiario(dia = tzDiaNumero()) {
  if (dia < 1 || dia > tzDiaNumero()) return;
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === tzDiaNumero() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  modo = "diario";
  diaAtual = dia;
  comecar(tzNovaPartida(tzDiarioRodadas(dia)));
}

function comecarLivre() {
  modo = "livre";
  comecar(tzNovaPartida(tzLivreRodadas(categoria)));
}

function comecar(estado) {
  partida = estado;
  tempoMs = 0;
  rodadaDesenhada = -1;
  show("game");
  renderJogo();
}

// Rodada da vez já foi respondida (sozinho) ou revelada (online)?
function revelado() {
  if (!partida) return false;
  return partida.online ? partida.fase === "revelado" : partida.respostas.length > partida.atual;
}

// Online: eu já mandei a resposta desta rodada?
function jaRespondi() {
  return !!(partida && partida.online && typeof meuId === "function" && meuId() in partida.respostas);
}

// Posição que aparece no quadro depois de revelar: a minha resposta.
function minhaResposta() {
  if (!partida.online) return partida.respostas[partida.atual].v;
  const v = partida.respostas[meuId()];
  return v === undefined ? null : v;
}

function rodada() {
  return partida.rodadas[partida.atual];
}

// ───────────── o quadro ─────────────

function medidaVertical(it) {
  return it.medida === "a" || it.medida === "cv";
}

// Posições em metros (x para a direita, y para cima a partir do chão) para o tamanho f da coisa ajustada.
function cena(f) {
  const r = rodada();
  const ref = tzItem(r.ref);
  const alvo = tzItem(r.alvo);
  const rw = ref.w * ref.k, rh = ref.h * ref.k;
  const aw = alvo.w * alvo.k, ah = alvo.h * alvo.k;
  const gap = 0.22 * Math.max(rw, rh * 0.5);
  const x2 = rw + gap;
  const fim = revelado();
  const bw = fim ? Math.max(aw * f, aw) : aw * f;
  const bh = fim ? Math.max(ah * f, ah) : ah * f;
  return { ref, alvo, rw, rh, aw, ah, x2, f, largura: x2 + bw, altura: Math.max(rh, bh) };
}

const PAD = { x: 16, top: 66, bottom: 30 };

function ajustarVista(c, W, H) {
  const s = Math.min((W - 2 * PAD.x) / c.largura, (H - PAD.top - PAD.bottom) / c.altura);
  if (!vista || (!travada && (s < vista.s * 0.999 || s > vista.s * 1.9))) vista = { s: s * (vista ? 0.92 : 0.9) };
  if (!travada) vista.ox = (W - c.largura * vista.s) / 2;
}

function pathHtml(it, x, yTopo, escala, cls) {
  const tr = `translate(${x.toFixed(1)} ${yTopo.toFixed(1)}) scale(${(escala * it.k).toPrecision(5)}) translate(${-it.x} ${-it.y})`;
  // Países: buracos pela regra "evenodd" (Lesoto dentro da África do Sul); os desenhos usam "nonzero" (peças sobrepostas).
  return `<path class="${cls}" fill-rule="${it.cat === "paises" ? "evenodd" : "nonzero"}" transform="${tr}" d="${it.d}"${cls === "real" ? ' vector-effect="non-scaling-stroke"' : ""}/>`;
}

// Régua da medida: na vertical ao lado (altura) ou embaixo (comprimento, largura, diâmetro). Países não têm.
function reguaHtml(it, x, w, yTopo, h, chao, cls) {
  if (it.medida === "area") return "";
  if (medidaVertical(it)) {
    const xr = cls === "real" ? x + w + 9 : x - 9; // a da referência à esquerda; a do tamanho real à direita
    return `<path class="regua ${cls}" d="M${xr} ${yTopo}V${chao}M${xr - 5} ${yTopo}h10M${xr - 5} ${chao}h10"/>`;
  }
  const yr = chao + 12;
  return `<path class="regua ${cls}" d="M${x} ${yr}H${x + w}M${x} ${yr - 5}v10M${x + w} ${yr - 5}v10"/>`;
}

function desenhar() {
  if (!partida || partida.fim) return;
  const board = $("board");
  const W = board.clientWidth, H = board.clientHeight;
  if (!W || !H) return;
  if (rodadaDesenhada !== partida.atual) {
    vista = null;
    rodadaDesenhada = partida.atual;
  }
  const r = rodada();
  const fim = revelado();
  const vMostrar = fim ? minhaResposta() : posicao;
  const f = vMostrar === null ? 1 : tzFator(r, vMostrar);
  const c = cena(f);
  ajustarVista(c, W, H);
  const s = vista.s, ox = vista.ox, chao = H - PAD.bottom;
  const X = (m) => ox + m * s;
  const refTopo = chao - c.rh * s;
  const gw = c.aw * f * s, gh = c.ah * f * s;
  const awPx = c.aw * s, ahPx = c.ah * s;
  let svg = `<line class="chao" x1="0" x2="${W}" y1="${chao}" y2="${chao}"/>`;
  svg += pathHtml(c.ref, X(0), refTopo, s, "ref");
  svg += reguaHtml(c.ref, X(0), c.rw * s, refTopo, c.rh * s, chao, "ref");
  if (vMostrar !== null) svg += pathHtml(c.alvo, X(c.x2), chao - gh, s * f, fim ? "alvo palpite" : "alvo");
  if (fim) {
    svg += pathHtml(c.alvo, X(c.x2), chao - ahPx, s, "real");
    svg += reguaHtml(c.alvo, X(c.x2), awPx, chao - ahPx, ahPx, chao, "real");
  } else {
    svg += `<rect class="caixa" x="${X(c.x2)}" y="${chao - gh}" width="${gw}" height="${gh}"/>`;
  }
  const stage = $("stage");
  stage.setAttribute("viewBox", `0 0 ${W} ${H}`);
  stage.innerHTML = svg;
  stage.setAttribute("aria-label", tr(c.ref.nome) + " · " + tr(c.alvo.nome));

  // Rótulos em cima de cada um: nome e a medida (a do vermelho só aparece depois de revelar).
  const rotulo = (it, cx, topo, cls, medida) =>
    `<div class="label ${cls}" style="left:${cx.toFixed(0)}px;top:${Math.max(4, topo - 6).toFixed(0)}px"><b>${escapeHtml(tr(it.nome))}</b><span>${escapeHtml(t("m." + it.medida))}: ${escapeHtml(medida)}</span></div>`;
  const alvoTopo = fim ? chao - Math.max(gh, ahPx) : chao - gh;
  const alvoMeio = X(c.x2) + (fim ? Math.max(gw, awPx) : gw) / 2;
  $("labels").innerHTML = rotulo(c.ref, X(0) + (c.rw * s) / 2, refTopo, "ref", medidaTexto(c.ref)) +
    rotulo(c.alvo, alvoMeio, alvoTopo, "alvo", fim ? medidaTexto(c.alvo) : "?");
  // Cada rótulo inteiro dentro do quadro (perto da borda ele anda para dentro, em vez de ser cortado).
  $("labels").querySelectorAll(".label").forEach((el) => {
    const meio = el.offsetWidth / 2 + 6;
    el.style.left = Math.min(W - meio, Math.max(meio, parseFloat(el.style.left))).toFixed(0) + "px";
  });

  // Alça no canto de cima do vermelho (enquanto dá para ajustar).
  const h = $("handle");
  const podeMexer = !fim && !jaRespondi();
  h.hidden = !podeMexer;
  if (podeMexer) {
    h.style.left = Math.min(W - 14, X(c.x2) + gw).toFixed(0) + "px";
    h.style.top = Math.max(14, chao - gh).toFixed(0) + "px";
  }
}

function renderCartoes() {
  const r = rodada();
  const ref = tzItem(r.ref), alvo = tzItem(r.alvo);
  const fim = revelado();
  $("card-ref").innerHTML = `<small>${escapeHtml(t("game.ref"))}</small><b>${escapeHtml(tr(ref.nome))}</b><span>${escapeHtml(t("m." + ref.medida))}: ${escapeHtml(medidaTexto(ref))}</span>`;
  $("card-alvo").innerHTML = `<small>${escapeHtml(t(fim ? "game.real" : "game.adjust"))}</small><b>${escapeHtml(tr(alvo.nome))}</b><span>${escapeHtml(t("m." + alvo.medida))}: ${escapeHtml(fim ? medidaTexto(alvo) : "?")}</span>`;
}

function renderJogo() {
  if (!partida || partida.fim) return;
  const s = partida;
  if (rodadaDesenhada !== s.atual) {
    posicao = rodada().inicio;
    pensandoDesde = performance.now();
  }
  const fim = revelado();
  const online = !!s.online;
  $("game-title").textContent = online ? t("game.online") : modo === "diario" ? t("daily.kicker", { n: diaAtual }) : t("cat." + categoria);
  $("game-round").textContent = t("game.round", { a: s.atual + 1, b: s.rodadas.length });
  $("game-dots").innerHTML = s.rodadas.map((_, i) => `<i class="${i < s.atual || (i === s.atual && fim) ? "done" : i === s.atual ? "now" : ""}"></i>`).join("");
  const meus = online ? (s.jogadores.find((j) => j.id === meuId()) || { pontos: 0 }).pontos : s.pontos;
  $("game-score").textContent = online ? "★ " + meus : t("game.pts", { n: num(meus) });
  renderCartoes();
  const respondi = jaRespondi();
  $("controls").hidden = fim || respondi;
  $("sent").hidden = !(online && respondi && !fim);
  $("board-hint").hidden = fim || respondi || s.atual > 0 || dicaVista;
  $("game-reveal").hidden = !fim;
  $("players").hidden = !online;
  if (online && typeof renderJogadoresOnline === "function") renderJogadoresOnline();
  if (fim) renderRevelacao();
  desenhar();
}

function renderRevelacao() {
  const s = partida;
  const r = rodada();
  const ultima = s.atual + 1 >= s.rodadas.length;
  if (s.online) {
    const nomes = s.ganhadores.map((id) => (s.jogadores.find((j) => j.id === id) || {}).nome).filter(Boolean);
    $("reveal").innerHTML = `<p class="reveal-pts top">${escapeHtml(nomes.length ? t("on.closest", { nomes: nomes.join(", ") }) : "—")}</p>`;
    const anfitriao = typeof isHost === "function" && isHost();
    $("game-next").hidden = !anfitriao;
    $("game-next").textContent = t(ultima ? "game.finish" : "game.next");
    if (!anfitriao) $("reveal").innerHTML += `<p class="muted">${escapeHtml(t("on.waitHost"))}</p>`;
    return;
  }
  const resp = s.respostas[s.atual];
  const area = tzFator(r, resp.v) ** 2;
  const como = resp.pontos === 100 ? t("game.exact") : area >= 1 ? t("game.bigBy", { n: num(area, 1) }) : t("game.smallBy", { n: num(1 / area, 1) });
  $("reveal").innerHTML = `
    <p class="reveal-pts ${resp.pontos >= 90 ? "top" : ""}">${escapeHtml(t("game.got", { n: resp.pontos }))}</p>
    <p class="how">${escapeHtml(como)}</p>`;
  $("game-next").hidden = false;
  $("game-next").textContent = t(ultima ? "game.finish" : "game.next");
}

// ───────────── ajustar o tamanho ─────────────

function podeAjustar() {
  return partida && !partida.fim && !revelado() && !jaRespondi() && document.body.dataset.screen === "game";
}

function mover(v) {
  if (!podeAjustar()) return;
  posicao = Math.min(1, Math.max(0, v));
  dicaVista = true;
  $("board-hint").hidden = true;
  desenhar();
}

function confirmar() {
  if (!podeAjustar()) return;
  if (partida.online) return onlineResponder(posicao);
  tempoMs += performance.now() - pensandoDesde;
  tzResponder(partida, posicao);
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function proximo() {
  if (!partida || !revelado()) return;
  if (partida.online) return onlineProxima();
  if (tzProxima(partida)) return terminar();
  renderJogo();
}

// Arrastar: pela alça, o canto segue o dedo; no resto do quadro, para cima ou para a direita aumenta.
// Dois dedos: pinça. Rodinha do mouse também.
function ligarQuadro() {
  const board = $("board");
  const dedos = new Map();
  let modoArrasto = null; // "alca", "solto" ou "pinca"
  let inicio = null;

  const pos = (e) => {
    const b = board.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const distancia = () => {
    const [a, b] = [...dedos.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };

  board.addEventListener("pointerdown", (e) => {
    if (!podeAjustar()) return;
    e.preventDefault();
    board.setPointerCapture(e.pointerId);
    dedos.set(e.pointerId, pos(e));
    dicaVista = true;
    $("board-hint").hidden = true;
    if (dedos.size === 2) {
      modoArrasto = "pinca";
      inicio = { d: distancia(), v: posicao };
      travada = false;
    } else if (dedos.size === 1) {
      modoArrasto = e.target.closest("#handle") ? "alca" : "solto";
      travada = modoArrasto === "alca";
      inicio = { ...pos(e), v: posicao };
    }
  });
  board.addEventListener("pointermove", (e) => {
    if (!dedos.has(e.pointerId) || !podeAjustar()) return;
    const p = pos(e);
    dedos.set(e.pointerId, p);
    if (modoArrasto === "pinca" && dedos.size === 2) {
      mover(inicio.v + Math.log(distancia() / inicio.d) / TZ_FAIXA);
    } else if (modoArrasto === "alca" && vista) {
      const r = rodada();
      const c = cena(1);
      const chao = board.clientHeight - PAD.bottom;
      const fx = (p.x - (vista.ox + c.x2 * vista.s)) / (c.aw * vista.s);
      const fy = (chao - p.y) / (c.ah * vista.s);
      const f = Math.max(fx, fy, 0.001);
      mover(r.certo + Math.log(f) / TZ_FAIXA);
    } else if (modoArrasto === "solto") {
      mover(inicio.v + ((p.x - inicio.x) - (p.y - inicio.y)) / (board.clientWidth * 1.1));
    }
  });
  const soltar = (e) => {
    dedos.delete(e.pointerId);
    if (dedos.size === 1 && modoArrasto === "pinca") {
      const [p] = dedos.values();
      modoArrasto = "solto";
      inicio = { ...p, v: posicao };
    }
    if (!dedos.size) {
      modoArrasto = null;
      if (travada) {
        travada = false;
        desenhar();
      }
    }
  };
  ["pointerup", "pointercancel"].forEach((ev) => board.addEventListener(ev, soltar));
  board.addEventListener("wheel", (e) => {
    if (!podeAjustar()) return;
    e.preventDefault();
    mover(posicao - Math.sign(e.deltaY) * Math.min(0.03, Math.abs(e.deltaY) * 0.0006));
  }, { passive: false });
}

// Segurar o − ou o + continua mexendo (devagar no começo, mais rápido depois).
function ligarBotaoTamanho(btn, passo) {
  let timer = null;
  const parar = () => clearTimeout(timer);
  const repetir = (espera) => {
    mover(posicao + passo);
    timer = setTimeout(() => repetir(Math.max(35, espera * 0.8)), espera);
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    repetir(380);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, parar));
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      mover(posicao + passo);
    }
  });
}

// ───────────── fim (sozinho) ─────────────

function terminar() {
  const s = partida;
  const st = stats();
  st.partidas += 1;
  st.pontos += s.pontos;
  let recorde = false;
  if (modo === "livre" && s.pontos > st.recorde) {
    st.recorde = s.pontos;
    recorde = true;
  }
  store("stats", st);
  const reg = { acertos: s.pontos, rodadas: s.rodadas.map((r, i) => ({ ref: r.ref, alvo: r.alvo, pontos: s.respostas[i].pontos })), ms: Math.round(tempoMs) };
  if (modo === "diario" && !diarios()[diaAtual]) store("diario", { ...diarios(), [diaAtual]: reg });
  mostrarResultado(modo === "diario" ? diarios()[diaAtual] : reg, recorde);
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado(reg, false);
}

function mostrarResultado(reg, recorde) {
  show("results");
  const diario = modo === "diario";
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("cat." + categoria);
  $("res-score").textContent = t("res.title", { n: num(reg.acertos) });
  $("res-sub").textContent = t("res.of") + (diario
    ? (sequenciaDiaria() > 1 ? " · " + t("res.sub", { n: sequenciaDiaria() }) : "")
    : " · " + (recorde ? t("res.record") : t("res.best", { n: num(stats().recorde) })));
  $("res-share").hidden = !diario;
  $("res-share").onclick = (e) => compartilhar(diaAtual, reg, e.currentTarget);
  $("res-again").hidden = diario;
  $("res-again").textContent = t("btn.again");
  $("res-ranking").hidden = true;
  $("leaderboard").hidden = true;
  if (diario) mostrarRanking();
  $("res-rounds").innerHTML = (reg.rodadas || []).map((r) => {
    const a = tzItem(r.alvo), b = tzItem(r.ref);
    return a && b ? `<li><span>${escapeHtml(tr(a.nome))} <small>× ${escapeHtml(tr(b.nome))}</small></span><b>${r.pontos}</b></li>` : "";
  }).join("");
}

// Ranking do dia (../gamezi-ranking.js): manda o resultado de hoje uma vez e mostra quem foi melhor.
function mostrarRanking() {
  const dia = diaAtual;
  const reg = diarios()[dia];
  if (!reg || typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: "tamanhozi", dia, hoje: tzDiaNumero(), reg, lang, nick: store("nick"),
    salvar: (r) => store("diario", { ...diarios(), [dia]: r }),
    guardarNick: (n) => store("nick", n),
  });
}

// Copia o texto (e abre o compartilhar do celular, se tiver). O botão avisa que copiou.
function copiar(texto, btn) {
  if (navigator.share && matchMedia("(hover: none)").matches) {
    navigator.share({ text: texto }).catch(() => {});
    return;
  }
  if (!navigator.clipboard) return;
  const antes = btn.textContent;
  navigator.clipboard.writeText(texto).then(() => {
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = antes), 1800);
  }, () => {});
}

function compartilhar(dia, reg, btn) {
  const linha = (reg.rodadas || []).map((r) => (r.pontos >= 90 ? "🟩" : r.pontos >= 60 ? "🟨" : r.pontos > 0 ? "🟧" : "🟥")).join("");
  copiar(t("res.shareText", { n: dia, p: reg.acertos, linha, url: location.origin + location.pathname }), btn);
}

// ───────────── topo: tema, idioma e ajuda ─────────────

function isDark() {
  return (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
}

function renderTema() {
  const b = $("theme-btn");
  b.innerHTML = ICONES[isDark() ? "sun" : "moon"];
  b.title = t(isDark() ? "nav.light" : "nav.dark");
  b.setAttribute("aria-label", b.title);
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  store("lang", l);
  applyI18n();
  renderTema();
  const tela = document.body.dataset.screen;
  if (tela === "home") renderHome();
  if (tela === "game") renderJogo();
  if (tela === "lobby" && typeof renderSala === "function") renderSala();
}

function sairDoJogo() {
  if (partida && partida.online) {
    if (!confirm(t("on.quit"))) return;
    return sairDaSala();
  }
  irInicio();
}

function ligar() {
  $("home-btn").onclick = () => (partida && partida.online ? sairDoJogo() : irInicio());
  $("help-btn").onclick = () => {
    $("help-body").innerHTML = t("help.html");
    $("help-dialog").showModal();
  };
  $("help-link").onclick = () => $("help-btn").click();
  $("settings-btn").onclick = () => $("settings-dialog").showModal();
  $("lang-select").value = lang;
  $("lang-select").onchange = (e) => setLang(e.target.value);
  $("theme-btn").onclick = () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store("theme", next);
    renderTema();
  };
  document.querySelectorAll("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  $("free-btn").onclick = comecarLivre;
  $("handle").innerHTML = ICONES.resize;
  ligarQuadro();
  ligarBotaoTamanho($("size-down"), -0.006);
  ligarBotaoTamanho($("size-up"), 0.006);
  $("game-confirm").onclick = confirmar;
  $("game-next").onclick = proximo;
  $("game-quit").onclick = sairDoJogo;
  $("res-again").onclick = () => (modo === "online" ? voltarParaSala() : comecarLivre());
  $("res-home").onclick = () => (modo === "online" ? sairDaSala() : irInicio());
  addEventListener("keydown", (e) => {
    if (!podeAjustar() || e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "+") mover(posicao + 0.006);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "-") mover(posicao - 0.006);
    else return;
    e.preventDefault();
  });
  addEventListener("resize", () => {
    vista = null;
    if (partida && document.body.dataset.screen === "game") desenhar();
  });
}

function iniciar() {
  applyI18n();
  $("help-btn").innerHTML = '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>';
  renderTema();
  ligar();
  irInicio();
  if (location.hash === "#como-jogar") $("help-btn").click();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    addEventListener("load", () => navigator.serviceWorker.register("../sw.js", { scope: "../" }).catch(() => {}));
  }
}

iniciar();
