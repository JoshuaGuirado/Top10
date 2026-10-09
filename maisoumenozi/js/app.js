// Maisoumenozi na tela: início (contra o relógio, desafio do dia e sem errar), partida e resultado.
// As regras ficam em jogo.js; os assuntos em data/; os textos em textos.js.

let partida = null; // estado de jogo.js
let modo = "relogio"; // "relogio", "diario" ou "livre"
let diaAtual = 0;
let esperando = false; // mostrando se acertou, antes da próxima
let autoTimer = null;
let fimDoTempo = 0; // relógio: quando o tempo acaba (performance.now)
let relogioRaf = 0;
let ultimoTique = 0;
let pensandoDesde = 0; // quando apareceu a pergunta da vez (performance.now)
let tempoMs = 0; // tempo pensando na partida: desempata o ranking do dia

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
  return { partidas: 0, acertos: 0, recorde: 0, recordeRelogio: 0, maiorCombo: 0, ...(store("stats") || {}) };
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

// ───────────── som (gerado na hora, sem arquivos) ─────────────

let somLigado = store("sound") !== false;
let audio = null;

function bip(notas, tipo = "triangle", dur = 0.12, passo = 0.07, vol = 0.16) {
  if (!somLigado) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audio.currentTime;
    notas.forEach((f, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = tipo;
      o.frequency.value = f;
      const at = t0 + i * passo;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(audio.destination);
      o.start(at);
      o.stop(at + dur + 0.02);
    });
  } catch (e) { /* sem som, sem problema */ }
}

const som = {
  // Quanto maior o combo, mais agudo o "acertou".
  certo: (combo) => bip([523, 659, 784].map((f) => f * (1 + Math.min(combo, 12) * 0.03))),
  errado: () => bip([196, 147], "sawtooth", 0.2, 0.12, 0.08),
  combo: () => bip([784, 988, 1175, 1568], "square", 0.08, 0.05, 0.06),
  tique: () => bip([1200], "square", 0.04, 0, 0.04),
  fim: () => bip([523, 659, 784, 1047, 784, 1047, 1319], "triangle", 0.18, 0.1),
};

// ───────────── confete (recorde) ─────────────

function confete() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("fx");
  const ctx = c.getContext("2d");
  const d = devicePixelRatio || 1;
  c.width = innerWidth * d;
  c.height = innerHeight * d;
  const cores = ["#FF4D3D", "#171717", "#FFC93C", "#1F8A4C", "#3D7BFF"];
  let parts = Array.from({ length: 140 }, (_, i) => ({
    x: c.width / 2, y: c.height * 0.35, vx: (Math.random() - 0.5) * 22 * d, vy: (-Math.random() * 16 - 6) * d,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, s: (6 + Math.random() * 8) * d, cor: cores[i % cores.length], vida: 140 + Math.random() * 60,
  }));
  const quadro = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    parts = parts.filter((p) => p.vida > 0);
    for (const p of parts) {
      p.vy += 0.25 * d;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.vida -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.min(1, p.vida / 30);
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

// ───────────── início ─────────────

const ICONES = {
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  somOn: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/></svg>',
  somOff: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.8M9.5 3h5M12 3v2.5"/></svg>',
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
  const st = stats();
  document.querySelector(".clock-ico").innerHTML = ICONES.relogio;
  $("clock-sub").textContent = st.recordeRelogio ? t("home.clockSub", { n: fmt(st.recordeRelogio) }) : t("home.clockSubNew");
  $("daily-card").innerHTML = `
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(t("daily.name"))}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString(loc))}</span>
      <button type="button" class="btn ${feito ? "ghost" : "dark"}" id="daily-btn">${escapeHtml(t(feito ? "btn.share" : "btn.play"))}</button>
    </div>
    ${semanaHtml()}
    ${feito ? `<p class="daily-status">${escapeHtml(t("daily.done", { a: feito.acertos, b: feito.total }))}${seq > 1 ? ` · ${escapeHtml(t("res.sub", { n: seq }))}` : ""}</p>` : ""}`;
  $("daily-btn").onclick = (e) => (feito ? compartilhar(dia, feito, e.currentTarget) : comecarDiario(dia));
  $("daily-card").querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => abrirDia(Number(b.dataset.dia))));
  $("free-sub").textContent = st.recorde ? t("home.freeSub", { n: st.recorde }) : t("home.freeSubNew");
}

function irInicio() {
  pararRelogio();
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

// ───────────── começar ─────────────

function comecar(novoModo, estado) {
  pararRelogio();
  clearTimeout(autoTimer);
  modo = novoModo;
  partida = estado;
  esperando = false;
  show("game");
  renderJogo();
  tempoMs = 0;
  pensandoDesde = performance.now();
  if (modo === "relogio") iniciarRelogio();
}

function comecarDiario(dia = mmDiaNumero()) {
  if (dia < 1 || dia > mmDiaNumero()) return;
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === mmDiaNumero() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  diaAtual = dia;
  comecar("diario", mmNovaPartida({ modo: "diario", rodadas: mmDiarioRodadas(dia) }));
}

function comecarLivre() {
  comecar("livre", mmNovaPartida({ modo: "livre" }));
}

function comecarRelogio() {
  comecar("relogio", mmNovaPartida({ modo: "relogio" }));
}

// ───────────── relógio ─────────────

function iniciarRelogio() {
  fimDoTempo = performance.now() + MM_RELOGIO_SEG * 1000;
  ultimoTique = 0;
  const passo = () => {
    const resta = Math.max(0, fimDoTempo - performance.now());
    const seg = Math.ceil(resta / 1000);
    $("hud-left").textContent = `0:${String(seg).padStart(2, "0")}`;
    $("hud-left").classList.toggle("low", seg <= 10);
    $("timebar-fill").style.transform = `scaleX(${resta / (MM_RELOGIO_SEG * 1000)})`;
    $("timebar").classList.toggle("low", seg <= 10);
    if (seg <= 5 && seg !== ultimoTique && resta > 0) {
      ultimoTique = seg;
      som.tique();
    }
    if (resta <= 0) {
      relogioRaf = 0;
      return tempoAcabou();
    }
    relogioRaf = requestAnimationFrame(passo);
  };
  relogioRaf = requestAnimationFrame(passo);
}

function pararRelogio() {
  if (relogioRaf) cancelAnimationFrame(relogioRaf);
  relogioRaf = 0;
}

function tempoAcabou() {
  clearTimeout(autoTimer);
  if (!partida) return;
  mmTempoAcabou(partida);
  terminar();
}

// ───────────── desenhar a partida ─────────────

function medidaHtml(valor, unidade) {
  const [antes, depois = ""] = tr(unidade).split("{n}");
  const parte = (txt) => (txt.trim() ? `<small class="unit">${escapeHtml(txt.trim())}</small>` : "");
  return `<p class="measure">${parte(antes)}<b class="value" data-alvo="${valor}">${escapeHtml(fmt(valor))}</b>${parte(depois)}</p>`;
}

// Alto da tela: tempo (ou o nome do modo), combo e pontos (ou o placar).
function renderHud() {
  const s = partida;
  const diario = modo === "diario";
  const relogio = modo === "relogio";
  $("hud-left").classList.toggle("mode", !relogio);
  if (!relogio) {
    $("hud-left").classList.remove("low");
    $("hud-left").textContent = diario ? t("daily.name") : t("game.free");
  }
  $("hud-right").textContent = relogio
    ? t("game.pts", { n: fmt(s.pontos) })
    : diario ? `${s.marcas.length + (esperando ? 0 : 1)}/${MM_DIARIO_QTD}`
      : s.acertos === 1 ? t("game.streak1") : t("game.streak", { n: s.acertos });
  const mult = mmMultiplicador(s.combo);
  const combo = $("hud-combo");
  combo.hidden = !relogio || mult < 2;
  if (combo.textContent !== `×${mult}`) {
    combo.textContent = `×${mult}`;
    combo.classList.remove("bump");
    void combo.offsetWidth;
    combo.classList.add("bump");
  }
  $("timebar").hidden = !relogio;
  $("game-dots").hidden = !diario;
  if (diario) $("game-dots").innerHTML = Array.from({ length: MM_DIARIO_QTD }, (_, i) => `<i class="${i < s.marcas.length ? (s.marcas[i] ? "ok" : "no") : i === s.marcas.length ? "now" : ""}"></i>`).join("");
}

function renderJogo() {
  const s = partida;
  const r = esperando ? s.ultimo : s.atual;
  if (!r) return;
  renderHud();
  const uau = !!r.uau;
  $("round-normal").hidden = uau;
  $("round-uau").hidden = !uau;
  if (uau) renderUau(r);
  else renderNormal(r);

  $("game-feedback").hidden = !esperando;
  $("game-fact").hidden = true;
  if (!esperando) return;

  // Depois de responder: acertou ou errou, a curiosidade (na maluca) e a próxima.
  const certo = s.ultimo.certo;
  $("game-verdict").textContent = tr(sortear(certo ? MM_CERTO : MM_ERRADO));
  $("game-verdict").className = "verdict " + (certo ? "good" : "bad");
  if (uau) {
    $("game-fact").hidden = false;
    $("game-fact").textContent = tr(mmUauDe(r.uau).fato);
  }
  $("game-next").textContent = t(s.fim ? "game.finish" : "game.next");
  $("game-next").hidden = modo === "relogio";
  document.querySelectorAll("#stage .revealed .value[data-alvo]").forEach(contar);
  // Segue sozinho: rápido no relógio; no resto, só quando acerta (errou: a pessoa vê com calma e toca em Próxima).
  clearTimeout(autoTimer);
  const espera = modo === "relogio" ? (uau ? 1800 : certo ? 700 : 1200) : certo ? (uau ? 3200 : 1700) : 0;
  if (espera && !s.fim) autoTimer = setTimeout(proxima, espera);
}

// Rodada comum: a referência (com o número), a pergunta sobre o outro e os dois botões.
function renderNormal(r) {
  const a = mmItem(r.a);
  const b = mmItem(r.b);
  const assunto = mmAssunto(r.tema);
  const l = LANGS.indexOf(lang);
  $("ref").innerHTML = `<span class="ref-name">${escapeHtml(mmNome(a, l))}</span>${medidaHtml(a.valor, mmTemaDe(a.tema).unidade)}`;
  $("ask-name").textContent = mmNome(b, l);
  $("ask-q").textContent = tr(assunto.curta || mmTemaDe(b.tema).curta);
  $("ask-q").hidden = esperando;
  $("ask-answer").hidden = !esperando;
  $("ask-answer").innerHTML = esperando ? medidaHtml(b.valor, mmTemaDe(b.tema).unidade) : "";
  $("ask-answer").classList.toggle("revealed", esperando);
  $("ask").className = "ask" + (esperando ? (partida.ultimo.certo ? " right" : " wrong") : "");
  const [up, down] = assunto.botoes;
  $("btn-up").innerHTML = ICONES.up + `<span>${escapeHtml(tr(up))}</span>`;
  $("btn-down").innerHTML = ICONES.down + `<span>${escapeHtml(tr(down))}</span>`;
  $("game-answers").hidden = esperando;
}

// Comparação maluca: a pergunta e os dois para escolher. Depois, os números aparecem e o maior fica marcado.
function renderUau(r) {
  const u = mmUauDe(r.uau);
  const l = LANGS.indexOf(lang);
  $("uau-question").textContent = tr(u.pergunta);
  for (const quem of ["a", "b"]) {
    const el = $("uau-" + quem);
    const item = u[quem];
    el.disabled = esperando;
    el.innerHTML = `<span class="choice-name">${escapeHtml(item[l + 1] || item[1])}</span>${esperando ? medidaHtml(item[0], u.unidade) : ""}`;
    let cls = "choice" + (esperando ? " revealed" : "");
    if (esperando) {
      const maior = (u.b[0] > u.a[0]) === (quem === "b");
      cls += maior ? " winner" : " loser";
      if (partida.ultimo.resposta === quem) cls += partida.ultimo.certo ? " right" : " wrong";
    }
    el.className = cls;
  }
}

// O número aparece contando até o valor.
function contar(el) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const alvo = Number(el.dataset.alvo);
  const t0 = performance.now();
  const dur = modo === "relogio" ? 400 : 700;
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / dur);
    const v = alvo * (1 - Math.pow(1 - k, 3));
    el.textContent = fmt(k < 1 ? (alvo >= 100 ? Math.round(v) : Math.round(v * 10) / 10) : alvo);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

// Pontos voando (+30), "−3 s" no erro do relógio e a tela tremendo quando erra.
function efeito(certo, ganhou) {
  if (!certo) {
    const stage = $("stage");
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
    if (modo === "relogio") flutuar(t("game.penalty"), "bad");
    return;
  }
  if (modo === "relogio") flutuar(`+${ganhou}`, "good");
}

function flutuar(texto, cls) {
  const f = $("float");
  f.textContent = texto;
  f.className = "float " + cls;
  void f.offsetWidth;
  f.classList.add("go");
}

function responder(resposta) {
  if (!partida || esperando || partida.fim) return;
  tempoMs += performance.now() - pensandoDesde; // conta só o tempo pensando (não o de ver se acertou)
  const antes = mmMultiplicador(partida.combo);
  const r = mmResponder(partida, resposta);
  if (!r) return;
  esperando = true;
  if (r.certo) {
    som.certo(partida.combo);
    if (modo === "relogio" && mmMultiplicador(partida.combo) > antes) som.combo();
  } else {
    som.errado();
    if (modo === "relogio") fimDoTempo -= 3000; // errar custa 3 segundos
  }
  efeito(r.certo, r.ganhou);
  renderJogo();
  if (modo !== "relogio") $("game-next").focus({ preventScroll: true });
}

function proxima() {
  clearTimeout(autoTimer);
  if (!partida || !esperando) return;
  if (partida.fim) return terminar();
  esperando = false;
  mmProxima(partida);
  if (partida.fim) return terminar();
  renderJogo();
  pensandoDesde = performance.now();
  const stage = $("stage");
  stage.classList.remove("enter");
  void stage.offsetWidth;
  stage.classList.add("enter");
}

// ───────────── fim ─────────────

function terminar() {
  pararRelogio();
  clearTimeout(autoTimer);
  const s = partida;
  if (!s) return;
  partida = null;
  const st = stats();
  st.partidas += 1;
  st.acertos += s.acertos;
  st.maiorCombo = Math.max(st.maiorCombo || 0, s.maiorCombo);
  let recorde = false;
  if (modo === "livre" && s.acertos > st.recorde) {
    st.recorde = s.acertos;
    recorde = true;
  }
  if (modo === "relogio" && s.pontos > (st.recordeRelogio || 0)) {
    st.recordeRelogio = s.pontos;
    recorde = true;
  }
  store("stats", st);
  if (modo === "diario" && !diarios()[diaAtual]) {
    const todos = diarios();
    todos[diaAtual] = { acertos: s.acertos, total: MM_DIARIO_QTD, marcas: s.marcas, rodadas: s.rodadas, ms: Math.round(tempoMs) };
    store("diario", todos);
  }
  mostrarResultado({ acertos: s.acertos, total: s.marcas.length, marcas: s.marcas, rodadas: s.rodadas, recorde, pontos: s.pontos, maiorCombo: s.maiorCombo });
  som.fim();
  if (recorde) confete();
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado({ acertos: reg.acertos, total: reg.total, marcas: reg.marcas, rodadas: reg.rodadas || [] });
}

function mostrarResultado(r) {
  show("results");
  const st = stats();
  $("res-kicker").textContent = { diario: t("daily.kicker", { n: diaAtual }), livre: t("game.free"), relogio: t("game.clock") }[modo];
  if (modo === "relogio") {
    $("res-score").textContent = t("res.clock", { n: fmt(r.pontos) });
    $("res-sub").textContent = t("res.clockSub", { a: r.acertos, b: r.total, c: mmMultiplicador(Math.max(0, r.maiorCombo - 1)) });
  } else if (modo === "livre") {
    $("res-score").textContent = r.acertos === 1 ? t("res.free1") : t("res.free", { n: r.acertos });
    $("res-sub").textContent = r.recorde ? "" : t("res.best", { n: st.recorde });
  } else {
    $("res-score").textContent = t("res.title", { a: r.acertos, b: MM_DIARIO_QTD });
    $("res-sub").textContent = sequenciaDiaria() > 1 ? t("res.sub", { n: sequenciaDiaria() }) : "";
  }
  $("res-record").hidden = !r.recorde;
  $("res-record").textContent = t("res.record");
  $("res-share").onclick = (e) => (modo === "diario" ? compartilhar(diaAtual, r, e.currentTarget) : compartilharPartida(r, e.currentTarget));
  $("res-again").hidden = modo === "diario";
  $("leaderboard").hidden = true;
  if (modo === "diario") mostrarRanking();
  $("res-again").onclick = modo === "livre" ? comecarLivre : comecarRelogio;
  const l = LANGS.indexOf(lang);
  $("res-list").innerHTML = r.rodadas.slice(0, r.marcas.length).map((rd, i) => {
    const ok = r.marcas[i];
    let cima;
    let baixo;
    if (rd.uau) {
      const u = mmUauDe(rd.uau);
      if (!u) return "";
      const [maior, menor] = u.b[0] > u.a[0] ? [u.b, u.a] : [u.a, u.b];
      cima = `<b>${escapeHtml(maior[l + 1])}</b> <em>${escapeHtml(fmt(maior[0]))}</em>`;
      baixo = `× ${escapeHtml(menor[l + 1])} ${escapeHtml(fmt(menor[0]))}`;
    } else {
      const a = mmItem(rd.a);
      const b = mmItem(rd.b);
      if (!a || !b) return "";
      cima = `<b>${escapeHtml(mmNome(b, l))}</b> <em>${escapeHtml(fmt(b.valor))}</em>`;
      baixo = `× ${escapeHtml(mmNome(a, l))} ${escapeHtml(fmt(a.valor))}`;
    }
    return `<li class="${ok ? "ok" : "no"}"><span class="mark">${ok ? "✓" : "✗"}</span><span class="pair">${cima}</span><span class="pair other">${baixo}</span></li>`;
  }).join("");
}

// Ranking do dia (../gamezi-ranking.js): manda o resultado de hoje uma vez e mostra quem foi melhor.
function mostrarRanking() {
  const dia = diaAtual;
  const reg = diarios()[dia];
  if (!reg || typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: "maisoumenozi", dia, hoje: mmDiaNumero(), reg, lang, nick: store("nick"),
    salvar: (r) => store("diario", { ...diarios(), [dia]: r }),
    guardarNick: (n) => store("nick", n),
  });
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

function compartilharPartida(r, btn) {
  const url = location.origin + location.pathname;
  copiar(modo === "relogio" ? t("res.shareClock", { n: fmt(r.pontos), url }) : t("res.shareFree", { n: r.acertos, url }), btn);
}

// ───────────── topo: tema, som, idioma e ajuda ─────────────

function isDark() {
  return (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
}

function renderTema() {
  const b = $("theme-btn");
  b.innerHTML = ICONES[isDark() ? "sun" : "moon"];
  b.title = t(isDark() ? "nav.light" : "nav.dark");
  b.setAttribute("aria-label", b.title);
  const s = $("sound-btn");
  s.innerHTML = ICONES[somLigado ? "somOn" : "somOff"];
  s.title = t(somLigado ? "nav.soundOn" : "nav.soundOff");
  s.setAttribute("aria-label", s.title);
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
  $("sound-btn").onclick = () => {
    somLigado = !somLigado;
    store("sound", somLigado);
    renderTema();
    som.tique();
  };
  document.querySelectorAll("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  $("clock-btn").onclick = comecarRelogio;
  $("free-btn").onclick = comecarLivre;
  $("btn-up").onclick = () => responder("mais");
  $("btn-down").onclick = () => responder("menos");
  $("uau-a").onclick = () => responder("a");
  $("uau-b").onclick = () => responder("b");
  $("game-next").onclick = proxima;
  $("res-home").onclick = irInicio;
  // No computador: setas respondem (cima/baixo na comum, esquerda/direita na maluca).
  addEventListener("keydown", (e) => {
    if (document.body.dataset.screen !== "game" || document.querySelector("dialog[open]") || !partida || esperando) return;
    const mapa = partida.atual && partida.atual.uau ? { ArrowLeft: "a", ArrowRight: "b" } : { ArrowUp: "mais", ArrowDown: "menos" };
    if (mapa[e.key]) {
      e.preventDefault();
      responder(mapa[e.key]);
    }
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
