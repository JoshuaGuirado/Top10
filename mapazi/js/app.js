// Mapazi na tela: início (Mapazi do dia com a semana e Partida livre), partida e resultado.
// As regras ficam em jogo.js; os textos em textos.js; os contornos em data/paises.js.

let partida = null; // estado de jogo.js
let modo = "diario"; // "diario" ou "livre"
let diaAtual = 0;
let posicao = 0.5; // posição da barra na rodada da vez (de 0 a 1)
let pensandoDesde = 0; // quando apareceu a rodada da vez (performance.now)
let tempoMs = 0; // tempo pensando na partida: desempata o ranking do dia

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

// ───────────── dados guardados ─────────────

function stats() {
  return { partidas: 0, pontos: 0, recorde: 0, ...(store("stats") || {}) };
}

function diarios() {
  return store("diario") || {};
}

function sequenciaDiaria() {
  const todos = diarios();
  let dia = mpDiaNumero();
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
};

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = mpDiaNumero(hoje);
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = mpDiaNumero(d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function renderHome() {
  const dia = mpDiaNumero();
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
}

function irInicio() {
  partida = null;
  renderHome();
  show("home");
}

// Dia já jogado: mostra o resultado; senão, joga.
function abrirDia(dia) {
  const feito = diarios()[dia];
  if (feito) return mostrarResultadoSalvo(dia, feito);
  comecarDiario(dia);
}

// ───────────── partida ─────────────

function comecarDiario(dia = mpDiaNumero()) {
  if (dia < 1 || dia > mpDiaNumero()) return;
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === mpDiaNumero() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  modo = "diario";
  diaAtual = dia;
  comecar(mpDiarioRodadas(dia));
}

function comecarLivre() {
  modo = "livre";
  comecar(mpLivreRodadas());
}

function comecar(rodadas) {
  partida = mpNovaPartida(rodadas);
  tempoMs = 0;
  show("game");
  novaRodada();
}

function novaRodada() {
  posicao = partida.rodadas[partida.atual].inicio;
  $("size").value = Math.round(posicao * 1000);
  renderJogo();
  pensandoDesde = performance.now();
}

function respondida() {
  return partida && partida.respostas.length > partida.atual;
}

// Caixa (em km) de cada país no desenho e a escala de cada um. f: quantas vezes maior que o real está o vermelho.
function layout(r, f, revelado) {
  const ref = mpPais(r.ref);
  const alvo = mpPais(r.alvo);
  const rw = ref.w * ref.u, rh = ref.h * ref.u;
  const aw = alvo.w * alvo.u, ah = alvo.h * alvo.u;
  const gw = aw * f, gh = ah * f;
  // Revelado: a caixa do vermelho cobre o seu tamanho e o real (os dois com o mesmo centro).
  const bw = revelado ? Math.max(gw, aw) : gw, bh = revelado ? Math.max(gh, ah) : gh;
  const caixa = $("stage").getBoundingClientRect();
  const proporcao = caixa.width && caixa.height ? caixa.width / caixa.height : 1.2;
  // Lado a lado ou um embaixo do outro: o que deixar os países maiores na tela.
  const gap = 0.08 * Math.max(Math.min(rw, bw), Math.min(rh, bh), 0.15 * Math.max(rw, bw, rh, bh));
  const lado = { W: rw + gap + bw, H: Math.max(rh, bh) };
  const pilha = { W: Math.max(rw, bw), H: rh + gap + bh };
  const cabe = (o) => Math.min(proporcao / o.W, 1 / o.H);
  const deLado = cabe(lado) >= cabe(pilha);
  const L = deLado ? lado : pilha;
  // A área toda com a proporção da tela, para os países ficarem no meio.
  let W = L.W, H = L.H;
  if (W / H > proporcao) H = W / proporcao;
  else W = H * proporcao;
  const pad = 0.06 * Math.max(W, H);
  const refPos = deLado ? [0, (L.H - rh) / 2] : [(L.W - rw) / 2, 0];
  const boxPos = deLado ? [rw + gap, (L.H - bh) / 2] : [(L.W - bw) / 2, rh + gap];
  const centro = [boxPos[0] + bw / 2, boxPos[1] + bh / 2];
  return {
    viewBox: [-(W - L.W) / 2 - pad, -(H - L.H) / 2 - pad, W + 2 * pad, H + 2 * pad].map((n) => +n.toFixed(2)).join(" "),
    ref: { x: refPos[0], y: refPos[1], s: ref.u, d: ref.d },
    palpite: { x: centro[0] - gw / 2, y: centro[1] - gh / 2, s: alvo.u * f, d: alvo.d },
    real: { x: centro[0] - aw / 2, y: centro[1] - ah / 2, s: alvo.u, d: alvo.d },
  };
}

function pathHtml(p, cls) {
  const tr = `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.s.toFixed(5)})`;
  return `<path class="${cls}" fill-rule="evenodd" transform="${tr}" d="${p.d}"${cls === "real" ? ' vector-effect="non-scaling-stroke"' : ""}/>`;
}

function desenhar() {
  const r = partida.rodadas[partida.atual];
  const revelado = respondida();
  const L = layout(r, mpFator(r, posicao), revelado);
  const svg = $("stage");
  svg.setAttribute("viewBox", L.viewBox);
  svg.innerHTML = pathHtml(L.ref, "ref") + pathHtml(L.palpite, revelado ? "alvo palpite" : "alvo") + (revelado ? pathHtml(L.real, "real") : "");
  svg.setAttribute("aria-label", tr(mpPais(r.ref).nome) + " · " + tr(mpPais(r.alvo).nome));
}

function renderJogo() {
  const s = partida;
  const r = s.rodadas[s.atual];
  const ref = mpPais(r.ref);
  const alvo = mpPais(r.alvo);
  const revelado = respondida();
  $("game-title").textContent = modo === "diario" ? t("daily.kicker", { n: diaAtual }) : t("game.free");
  $("game-round").textContent = t("game.round", { a: s.atual + 1, b: s.rodadas.length });
  $("game-score").textContent = t("game.pts", { n: num(s.pontos) });
  $("legend").innerHTML =
    `<span class="ref"><i></i>${escapeHtml(tr(ref.nome))} <small>${escapeHtml(t("game.ref"))}</small></span>` +
    `<span class="alvo"><i></i>${escapeHtml(tr(alvo.nome))} <small>${escapeHtml(t(revelado ? "game.guess" : "game.yours"))}</small></span>` +
    (revelado ? `<span class="real"><i></i><small>${escapeHtml(t("game.real"))}</small></span>` : "");
  $("game-ask").hidden = revelado;
  $("game-play").hidden = revelado;
  $("game-reveal").hidden = !revelado;
  if (revelado) {
    const resp = s.respostas[s.atual];
    const area = mpFator(r, resp.v) ** 2;
    const como = resp.pontos === 100 ? t("game.exact") : area >= 1 ? t("game.bigBy", { n: num(area, 1) }) : t("game.smallBy", { n: num(1 / area, 1) });
    $("reveal").innerHTML = `
      <p class="reveal-pts ${resp.pontos >= 90 ? "top" : ""}">${escapeHtml(t("game.got", { n: resp.pontos }))}</p>
      <p class="how">${escapeHtml(como)}</p>
      <p class="areas">${escapeHtml(tr(ref.nome))}: ${escapeHtml(km2(ref.km2))} · ${escapeHtml(tr(alvo.nome))}: ${escapeHtml(km2(alvo.km2))}</p>`;
    $("game-next").textContent = t(s.atual + 1 >= s.rodadas.length ? "game.finish" : "game.next");
  }
  desenhar();
}

function mover(v) {
  if (!partida || respondida()) return;
  posicao = Math.min(1, Math.max(0, v));
  $("size").value = Math.round(posicao * 1000);
  desenhar();
}

function confirmar() {
  if (!partida || respondida()) return;
  tempoMs += performance.now() - pensandoDesde;
  mpResponder(partida, posicao);
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function proximo() {
  if (!partida || !respondida()) return;
  if (mpProxima(partida)) return terminar();
  novaRodada();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── fim ─────────────

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
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("game.free");
  $("res-score").textContent = t("res.title", { n: num(reg.acertos) });
  $("res-sub").textContent = t("res.of") + (diario
    ? (sequenciaDiaria() > 1 ? " · " + t("res.sub", { n: sequenciaDiaria() }) : "")
    : " · " + (recorde ? t("res.record") : t("res.best", { n: num(stats().recorde) })));
  $("res-share").hidden = !diario;
  $("res-share").onclick = (e) => compartilhar(diaAtual, reg, e.currentTarget);
  $("res-again").hidden = diario;
  $("leaderboard").hidden = true;
  if (diario) mostrarRanking();
  $("res-rounds").innerHTML = (reg.rodadas || []).map((r) => {
    const a = mpPais(r.alvo), b = mpPais(r.ref);
    return a && b ? `<li><span>${escapeHtml(tr(a.nome))} <small>× ${escapeHtml(tr(b.nome))}</small></span><b>${r.pontos}</b></li>` : "";
  }).join("");
}

// Ranking do dia (../gamezi-ranking.js): manda o resultado de hoje uma vez e mostra quem foi melhor.
function mostrarRanking() {
  const dia = diaAtual;
  const reg = diarios()[dia];
  if (!reg || typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: "mapazi", dia, hoje: mpDiaNumero(), reg, lang, nick: store("nick"),
    salvar: (r) => store("diario", { ...diarios(), [dia]: r }),
    guardarNick: (n) => store("nick", n),
  });
}

function compartilhar(dia, reg, btn) {
  const linha = (reg.rodadas || []).map((r) => (r.pontos >= 90 ? "🟩" : r.pontos >= 60 ? "🟨" : r.pontos > 0 ? "🟧" : "🟥")).join("");
  const texto = t("res.shareText", { n: dia, p: reg.acertos, linha, url: location.origin + location.pathname });
  const antes = btn.textContent;
  const pronto = () => {
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = antes), 1800);
  };
  if (navigator.share && matchMedia("(hover: none)").matches) navigator.share({ text: texto }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(texto).then(pronto, () => {});
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

function ligar() {
  $("home-btn").onclick = irInicio;
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
  $("size").addEventListener("input", (e) => mover(Number(e.target.value) / 1000));
  ligarBotaoTamanho($("size-down"), -0.005);
  ligarBotaoTamanho($("size-up"), 0.005);
  // Rodinha do mouse em cima do mapa também muda o tamanho.
  $("stage").addEventListener("wheel", (e) => {
    if (!partida || respondida()) return;
    e.preventDefault();
    mover(posicao - Math.sign(e.deltaY) * 0.01);
  }, { passive: false });
  $("game-confirm").onclick = confirmar;
  $("game-next").onclick = proximo;
  $("game-quit").onclick = irInicio;
  $("res-again").onclick = comecarLivre;
  $("res-home").onclick = irInicio;
  addEventListener("resize", () => {
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
