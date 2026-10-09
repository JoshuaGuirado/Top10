// Maisoumenozi na tela: início (desafio do dia com a semana e partida livre), partida e resultado.
// As regras ficam em jogo.js; os assuntos em data/; os textos em textos.js.

let partida = null; // estado de jogo.js
let modo = "diario"; // "diario" ou "livre"
let diaAtual = 0;
let esperando = false; // mostrando se acertou, antes da próxima
let autoTimer = null;

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
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
  let dia = mmDiaNumero();
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
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 21 15H15V20H9V15H3Z"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 3 9H9V4H15V9H21Z"/></svg>',
};

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = mmDiaNumero(hoje);
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = mmDiaNumero(d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function renderHome() {
  const dia = mmDiaNumero();
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
  clearTimeout(autoTimer);
  partida = null;
  renderHome();
  show("home");
}

function abrirDia(dia) {
  const feito = diarios()[dia];
  if (feito) return mostrarResultadoSalvo(dia, feito);
  comecarDiario(dia);
}

// ───────────── partida ─────────────

function comecarDiario(dia = mmDiaNumero()) {
  if (dia < 1 || dia > mmDiaNumero()) return;
  modo = "diario";
  diaAtual = dia;
  partida = mmNovaPartida({ modo: "diario", rodadas: mmDiarioRodadas(dia) });
  esperando = false;
  show("game");
  renderJogo();
}

function comecarLivre() {
  modo = "livre";
  partida = mmNovaPartida({ modo: "livre" });
  esperando = false;
  show("game");
  renderJogo();
}

function cartaoHtml(item, tema, mostrar) {
  const nome = `<p class="name">${escapeHtml(mmNome(item, LANGS.indexOf(lang)))}</p>`;
  if (!mostrar) return nome; // escondido: só o nome (o número aparece depois de responder)
  const valor = `<b class="value" data-alvo="${item.valor}">${escapeHtml(fmt(item.valor))}</b>`;
  const [antes, depois = ""] = tr(tema.unidade).split("{n}");
  const parte = (txt) => (txt.trim() ? `<small class="unit">${escapeHtml(txt.trim())}</small>` : "");
  return `${nome}<p class="measure">${parte(antes)}${valor}${parte(depois)}</p>`;
}

function renderJogo() {
  const s = partida;
  const r = esperando ? s.ultimo : s.atual;
  const tema = mmTemaDe(r.tema);
  const a = mmItem(r.a);
  const b = mmItem(r.b);
  const diario = modo === "diario";

  // Alto: o assunto (pisca quando muda) e o placar; no desafio do dia, as 10 barrinhas.
  const topic = $("game-topic");
  topic.textContent = tr(tema.titulo);
  topic.classList.toggle("new", !!(r.novo && !esperando));
  $("game-score").textContent = diario
    ? `${s.marcas.length + (esperando ? 0 : 1)}/${MM_DIARIO_QTD}`
    : s.acertos === 1 ? t("game.streak1") : t("game.streak", { n: s.acertos });
  $("game-dots").hidden = !diario;
  if (diario) $("game-dots").innerHTML = Array.from({ length: MM_DIARIO_QTD }, (_, i) => `<i class="${i < s.marcas.length ? (s.marcas[i] ? "ok" : "no") : i === s.marcas.length ? "now" : ""}"></i>`).join("");

  $("card-a").innerHTML = cartaoHtml(a, tema, true);
  $("card-b-item").innerHTML = cartaoHtml(b, tema, esperando);
  $("card-b").className = "item-card ask" + (esperando ? (s.ultimo.certo ? " right" : " wrong") : "");
  $("game-question").textContent = tr(tema.perguntas[r.p]);
  $("game-question").hidden = esperando;

  const [up, down] = tema.botoes;
  $("btn-up").innerHTML = ICONES.up + `<span>${escapeHtml(tr(up))}</span>`;
  $("btn-down").innerHTML = ICONES.down + `<span>${escapeHtml(tr(down))}</span>`;
  $("game-answers").hidden = esperando;
  $("game-feedback").hidden = !esperando;

  if (esperando) {
    const certo = s.ultimo.certo;
    const razao = Math.max(a.valor, b.valor) / Math.min(a.valor, b.valor);
    const dif = razao >= 100 ? "cem" : razao >= 10 ? "dez" : razao >= 2 ? "dobro" : razao < 1.2 ? "quase" : null;
    $("game-verdict").innerHTML = `<b>${escapeHtml(tr(sortear(certo ? MM_CERTO : MM_ERRADO)))}</b>${dif ? `<span>${escapeHtml(tr(MM_DIFERENCA[dif]))}</span>` : ""}`;
    $("game-verdict").className = "verdict " + (certo ? "good" : "bad");
    $("game-next").textContent = t(s.fim ? "game.finish" : "game.next");
    contar($("card-b").querySelector(".value"));
    // Acertou e ainda tem rodada: segue sozinho depois de um instante (o botão adianta).
    clearTimeout(autoTimer);
    if (certo && !s.fim) autoTimer = setTimeout(proxima, 1900);
  }
}

// O número escondido aparece contando até o valor.
function contar(el) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const alvo = Number(el.dataset.alvo);
  const t0 = performance.now();
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / 700);
    const v = alvo * (1 - Math.pow(1 - k, 3));
    el.textContent = fmt(k < 1 ? (alvo >= 100 ? Math.round(v) : Math.round(v * 10) / 10) : alvo);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function responder(resposta) {
  if (!partida || esperando || partida.fim) return;
  mmResponder(partida, resposta);
  esperando = true;
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function proxima() {
  clearTimeout(autoTimer);
  if (!partida || !esperando) return;
  if (partida.fim) return terminar();
  esperando = false;
  mmProxima(partida);
  if (partida.fim) return terminar();
  renderJogo();
  const card = $("card-b");
  card.classList.add("enter");
  setTimeout(() => card.classList.remove("enter"), 400);
}

// ───────────── fim ─────────────

function terminar() {
  clearTimeout(autoTimer);
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
  if (modo === "diario" && !diarios()[diaAtual]) {
    const todos = diarios();
    todos[diaAtual] = { acertos: s.acertos, total: MM_DIARIO_QTD, marcas: s.marcas, rodadas: s.rodadas };
    store("diario", todos);
  }
  mostrarResultado({ acertos: s.acertos, total: s.marcas.length, marcas: s.marcas, rodadas: s.rodadas, recorde });
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado({ acertos: reg.acertos, total: reg.total, marcas: reg.marcas, rodadas: reg.rodadas || [] });
}

function mostrarResultado(r) {
  partida = null;
  show("results");
  const diario = modo === "diario";
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("game.free");
  $("res-score").textContent = diario ? t("res.title", { a: r.acertos, b: MM_DIARIO_QTD }) : r.acertos === 1 ? t("res.free1") : t("res.free", { n: r.acertos });
  $("res-sub").textContent = diario
    ? (sequenciaDiaria() > 1 ? t("res.sub", { n: sequenciaDiaria() }) : "")
    : r.recorde ? t("res.record") : t("res.best", { n: stats().recorde });
  $("res-share").onclick = (e) => (diario ? compartilhar(diaAtual, r, e.currentTarget) : compartilharLivre(r, e.currentTarget));
  $("res-again").hidden = diario;
  const l = LANGS.indexOf(lang);
  $("res-list").innerHTML = r.rodadas.slice(0, r.marcas.length).map((rd, i) => {
    const a = mmItem(rd.a);
    const b = mmItem(rd.b);
    if (!a || !b) return "";
    const ok = r.marcas[i];
    return `<li class="${ok ? "ok" : "no"}"><span class="mark">${ok ? "✓" : "✗"}</span>
      <span class="pair"><b>${escapeHtml(mmNome(b, l))}</b> <em>${escapeHtml(fmt(b.valor))}</em></span>
      <span class="pair other">× ${escapeHtml(mmNome(a, l))} ${escapeHtml(fmt(a.valor))}</span></li>`;
  }).join("");
}

function copiar(texto, btn) {
  const antes = btn.textContent;
  const pronto = () => {
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = antes), 1800);
  };
  if (navigator.share && matchMedia("(hover: none)").matches) navigator.share({ text: texto }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(texto).then(pronto, () => {});
}

function compartilhar(dia, r, btn) {
  const linha = (r.marcas || []).map((m) => (m ? "■" : "□")).join("");
  copiar(t("res.shareText", { n: dia, a: r.acertos, b: MM_DIARIO_QTD, linha, url: location.origin + location.pathname }), btn);
}

function compartilharLivre(r, btn) {
  copiar(t("res.shareFree", { n: r.acertos, url: location.origin + location.pathname }), btn);
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
  if (tela === "game" && partida) renderJogo();
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
  $("btn-up").onclick = () => responder("mais");
  $("btn-down").onclick = () => responder("menos");
  $("game-next").onclick = proxima;
  $("res-again").onclick = comecarLivre;
  $("res-home").onclick = irInicio;
  // No computador: seta para cima/baixo responde; Enter ou espaço passa para a próxima.
  addEventListener("keydown", (e) => {
    if (document.body.dataset.screen !== "game" || document.querySelector("dialog[open]")) return;
    if (!esperando && e.key === "ArrowUp") { e.preventDefault(); responder("mais"); }
    if (!esperando && e.key === "ArrowDown") { e.preventDefault(); responder("menos"); }
  });
}

function iniciar() {
  if (typeof gameziRetornoDoLogin === "function" && gameziRetornoDoLogin("../")) return;
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
