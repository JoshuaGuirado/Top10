// Datazi na tela: início (Datazi do dia com a semana e Partida livre), partida e resultado.
// As regras ficam em jogo.js; os textos em textos.js.

let partida = null; // estado de jogo.js
let modo = "diario"; // "diario" ou "livre"
let diaAtual = 0;
let esperando = false; // mostrando se acertou, antes do próximo

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

// ───────────── dados guardados ─────────────

function stats() {
  return { partidas: 0, acertos: 0, recorde: 0, ...(store("stats") || {}) };
}

function diarios() {
  return store("diario") || {};
}

function sequenciaDiaria() {
  const todos = diarios();
  let dia = dzDiaNumero();
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
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8 3c0 5.9-8 10.6-8 10.6z"/></svg>',
};

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = dzDiaNumero(hoje);
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = dzDiaNumero(d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function renderHome() {
  const dia = dzDiaNumero();
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
    ${feito ? `<p class="daily-status">${escapeHtml(t("daily.done", { a: feito.acertos, b: feito.total }))}${seq > 1 ? ` · ${escapeHtml(t("res.sub", { n: seq }))}` : ""}</p>` : ""}`;
  $("daily-btn").onclick = (e) => (feito ? compartilhar(dia, feito, e.currentTarget) : comecarDiario(dia));
  $("daily-card").querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => abrirDia(Number(b.dataset.dia))));
  const st = stats();
  $("free-sub").textContent = st.recorde ? t("home.freeSub", { n: st.recorde }) : t("home.freeSubNew");
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

function comecarDiario(dia = dzDiaNumero()) {
  if (dia < 1 || dia > dzDiaNumero()) return;
  modo = "diario";
  diaAtual = dia;
  partida = dzNovaPartida(dzDiarioEventos(dia));
  esperando = false;
  show("game");
  renderJogo();
}

function comecarLivre() {
  modo = "livre";
  partida = dzNovaPartida(dzLivreEventos());
  esperando = false;
  show("game");
  renderJogo();
}

function renderJogo() {
  const s = partida;
  $("game-title").textContent = modo === "diario" ? t("daily.kicker", { n: diaAtual }) : t("game.free");
  $("game-lives").innerHTML = Array.from({ length: DZ_VIDAS }, (_, i) => `<span class="heart ${i < s.vidas ? "" : "lost"}">${ICONES.heart}</span>`).join("");
  $("game-lives").setAttribute("aria-label", t("game.lives", { n: s.vidas }));
  $("game-score").textContent = s.acertos === 1 ? t("game.score1") : t("game.score", { n: s.acertos });

  const ultimo = esperando ? s.ultimo : null;
  const atual = esperando ? dzEvento(ultimo.id) : dzEvento(s.atual);
  $("game-card").className = "event-card" + (ultimo ? (ultimo.certo ? " right" : " wrong") : "");
  $("game-card").innerHTML = `<p>${escapeHtml(tr(atual.txt))}</p>${ultimo ? `<b>${atual.ano}</b>` : ""}`;
  $("game-hint").textContent = ultimo ? t(ultimo.certo ? "game.right" : "game.wrong", { ano: atual.ano }) : t("game.where");
  $("game-hint").className = "game-hint" + (ultimo ? (ultimo.certo ? " good" : " bad") : "");
  $("game-next").hidden = !ultimo;
  $("game-next").textContent = t(s.fim ? "game.finish" : "game.next");

  // Linha do tempo: um "Aqui" entre cada acontecimento (e antes do primeiro e depois do último).
  const slot = (pos) => `<li class="slot"><button type="button" data-pos="${pos}" ${ultimo ? "disabled" : ""}>${escapeHtml(t("game.here"))}</button></li>`;
  let html = slot(0);
  s.linha.forEach((id, i) => {
    const e = dzEvento(id);
    const novo = ultimo && ultimo.id === id;
    html += `<li class="event ${novo ? (ultimo.certo ? "right" : "wrong") : ""}"><b>${e.ano}</b><span>${escapeHtml(tr(e.txt))}</span></li>`;
    html += slot(i + 1);
  });
  $("timeline").innerHTML = html;
  $("timeline").classList.toggle("placing", !ultimo);
  if (ultimo) {
    const el = $("timeline").querySelector(".event.right, .event.wrong");
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function colocar(pos) {
  if (!partida || esperando || partida.fim) return;
  dzColocar(partida, pos);
  esperando = true;
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function proximo() {
  if (!partida) return;
  if (partida.fim) return terminar();
  esperando = false;
  renderJogo();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── fim ─────────────

function terminar() {
  const s = partida;
  const st = stats();
  st.partidas += 1;
  st.acertos += s.acertos;
  let recorde = false;
  if (modo === "livre" && s.acertos > st.recorde) {
    st.recorde = s.acertos;
    recorde = true;
  }
  store("stats", st);
  const total = s.marcas.length + s.fila.length;
  if (modo === "diario" && !diarios()[diaAtual]) {
    const todos = diarios();
    todos[diaAtual] = { acertos: s.acertos, total: DZ_DIARIO_QTD, marcas: s.marcas, linha: s.linha };
    store("diario", todos);
  }
  mostrarResultado({ acertos: s.acertos, total, marcas: s.marcas, linha: s.linha, recorde });
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado({ acertos: reg.acertos, total: reg.total, marcas: reg.marcas, linha: reg.linha || [] });
}

function mostrarResultado(r) {
  show("results");
  const diario = modo === "diario";
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("game.free");
  $("res-score").textContent = diario ? t("res.title", { a: r.acertos, b: DZ_DIARIO_QTD }) : t("res.free", { n: r.acertos });
  $("res-sub").textContent = diario
    ? (sequenciaDiaria() > 1 ? t("res.sub", { n: sequenciaDiaria() }) : "")
    : r.recorde ? t("res.record") : t("res.best", { n: stats().recorde });
  $("res-share").hidden = !diario;
  $("res-share").onclick = (e) => compartilhar(diaAtual, r, e.currentTarget);
  $("res-again").hidden = diario;
  $("res-timeline").innerHTML = r.linha.map((id) => {
    const e = dzEvento(id);
    return e ? `<li class="event"><b>${e.ano}</b><span>${escapeHtml(tr(e.txt))}</span></li>` : "";
  }).join("");
}

function compartilhar(dia, r, btn) {
  const linha = (r.marcas || []).map((m) => (m ? "■" : "□")).join("");
  const texto = t("res.shareText", { n: dia, a: r.acertos, b: DZ_DIARIO_QTD, linha, url: location.origin + location.pathname });
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
  $("timeline").onclick = (e) => {
    const b = e.target.closest("[data-pos]");
    if (b) colocar(Number(b.dataset.pos));
  };
  $("game-next").onclick = proximo;
  $("game-quit").onclick = irInicio;
  $("res-again").onclick = comecarLivre;
  $("res-home").onclick = irInicio;
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
