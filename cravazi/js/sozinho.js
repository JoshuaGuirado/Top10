// Cravazi sozinho: o Cravazi do dia (5 perguntas iguais para todo mundo, com ranking do dia) e o treino
// (perguntas sorteadas, sem ranking). As regras ficam em jogo.js (czNovoSolo, czSoloChutar, czSoloProxima).
// O resultado de cada dia fica em cz:diario[dia] = { pontos, rodadas, ms, enviado } e vai uma vez para o
// ranking (../gamezi-ranking.js, tabela cravazi_diario), com o tempo pensando para desempatar.

let solo = null; // estado de jogo.js
let soloModo = "diario"; // "diario" ou "treino"
let soloDia = 0;
let soloPensandoDesde = 0;
let soloTempoMs = 0;

function diarios() {
  return store("diario") || {};
}

function czPerguntaPorId(id) {
  return CZ_PERGUNTAS.find((p) => p.id === id) || null;
}

function sequenciaDiaria() {
  const todos = diarios();
  let dia = czDiaNumero();
  if (!todos[dia]) dia -= 1;
  let n = 0;
  while (todos[dia]) {
    n += 1;
    dia -= 1;
  }
  return n;
}

// ───────────── cartão do início ─────────────

function semanaHtml(hoje = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const n0 = czDiaNumero(hoje);
  const todos = diarios();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = czDiaNumero(d);
    const cls = ["day", todos[n] ? "done" : "", n === n0 ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > n0 || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.kicker", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

function renderDiarioCard() {
  const dia = czDiaNumero();
  const feito = diarios()[dia];
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const seq = sequenciaDiaria();
  const max = CZ_DIARIO_QTD * CZ_SOLO_CHUTES;
  $("daily-card").innerHTML = `
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(t("daily.name"))}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString(loc))}</span>
      <button type="button" class="btn ${feito ? "ghost" : "dark"}" id="daily-btn">${escapeHtml(t(feito ? "btn.share" : "btn.play"))}</button>
    </div>
    ${semanaHtml()}
    <p class="daily-status">${feito
      ? `${escapeHtml(t("daily.done", { n: feito.pontos, max }))}${seq > 1 ? ` · ${escapeHtml(t("daily.streak", { n: seq }))}` : ""} · <button type="button" class="link-btn" id="daily-train">${escapeHtml(t("daily.train"))}</button>`
      : escapeHtml(t("daily.sub"))}</p>`;
  $("daily-btn").onclick = (e) => (feito ? compartilharDia(dia, feito, e.currentTarget) : comecarDiario(dia));
  if ($("daily-train")) $("daily-train").onclick = comecarTreino;
  $("daily-card").querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => abrirDia(Number(b.dataset.dia))));
}

function abrirDia(dia) {
  const feito = diarios()[dia];
  if (feito) return mostrarSoloSalvo(dia, feito);
  comecarDiario(dia);
}

// ───────────── partida ─────────────

function comecarDiario(dia = czDiaNumero()) {
  if (dia < 1 || dia > czDiaNumero()) return;
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === czDiaNumero() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  soloDia = dia;
  comecarSolo("diario", czDiarioPerguntas(dia));
}

function comecarTreino() {
  const perguntas = czSortear(CZ_DIARIO_QTD, store("vistas") || []);
  store("vistas", (store("vistas") || []).concat(perguntas.map((p) => p.id)).slice(-CZ_VISTAS_MAX));
  comecarSolo("treino", perguntas);
}

function comecarSolo(modo, perguntas) {
  soloModo = modo;
  solo = czNovoSolo({ perguntas });
  soloTempoMs = 0;
  show("solo");
  renderSolo();
  soloPensandoDesde = performance.now();
  focarCampo("solo-guess");
}

function renderSolo() {
  const s = solo;
  const r = s.atual;
  const p = r.pergunta;
  const fmt = (n) => num(n, p.ano);
  $("solo-kicker").textContent = soloModo === "diario" ? t("daily.kicker", { n: soloDia }) : t("solo.train");
  $("solo-points").textContent = t("solo.pts", { n: s.pontos });
  $("solo-dots").innerHTML = s.perguntas.map((_, i) => {
    const feita = s.rodadas[i];
    return `<i class="${feita ? (feita.cravou ? "ok" : "no") : i === s.rodada ? "now" : ""}"></i>`;
  }).join("");
  const tema = czTemaPorId(p.tema);
  $("solo-theme").textContent = tema ? tr(tema.nome) : "";
  $("solo-question").textContent = tr(p.texto);

  const ult = r.chutes[r.chutes.length - 1];
  const dica = ult && ult.dica !== "cravou" && !r.acabou ? ult : null;
  $("solo-hint").hidden = !dica;
  if (dica) {
    $("solo-hint").className = "hint " + dica.dica;
    $("solo-hint-who").textContent = t("solo.you", { n: fmt(dica.valor) });
    $("solo-hint-big").innerHTML = `${escapeHtml(t(dica.dica === "mais" ? "game.more" : "game.less"))} <span aria-hidden="true">${dica.dica === "mais" ? "↑" : "↓"}</span>`;
  }
  const temFaixa = r.baixo > 0 || r.alto !== null;
  $("solo-range").hidden = !temFaixa || r.acabou;
  if (temFaixa) $("solo-range").textContent = r.alto === null ? t("game.above", { a: fmt(r.baixo) }) : t("game.between", { a: fmt(r.baixo), b: fmt(r.alto) });

  $("solo-play").hidden = r.acabou;
  $("solo-end").hidden = !r.acabou;
  if (!r.acabou) {
    const restam = CZ_SOLO_CHUTES - r.chutes.length;
    $("solo-left").textContent = restam === 1 ? t("solo.left1") : t("solo.left", { n: restam });
    $("solo-unit").textContent = p.unidade ? tr(p.unidade) : "";
    $("solo-unit").hidden = !p.unidade;
  } else {
    $("solo-end").classList.toggle("missed", !r.cravou);
    $("solo-end-title").textContent = t(r.cravou ? "solo.nailed" : "solo.missed");
    $("solo-end-answer").textContent = t("solo.answer", { n: fmt(p.resposta) + (p.unidade ? " " + tr(p.unidade) : "") });
    $("solo-end-sub").textContent = (r.cravou ? (r.chutes.length === 1 ? t("game.tries1") : t("game.tries", { n: r.chutes.length })) + " · " : "") +
      (r.pontos === 1 ? t("solo.got1") : t("solo.got", { n: r.pontos }));
    $("solo-next").textContent = t(s.rodada + 1 >= s.perguntas.length ? "game.finish" : "solo.next");
  }

  $("solo-history").innerHTML = r.chutes.map((c, i) => ({ c, i })).reverse().map(({ c, i }) =>
    `<li class="${c.dica}"><span>${i + 1}º</span><b>${escapeHtml(fmt(c.valor))}</b><i aria-hidden="true">${c.dica === "mais" ? "↑" : c.dica === "menos" ? "↓" : "●"}</i></li>`).join("");
}

function soloChutar(e) {
  e.preventDefault();
  const s = solo;
  if (!s || s.atual.acabou) return;
  const r = s.atual;
  const fmt = (n) => num(n, r.pergunta.ano);
  const valor = lerChute($("solo-guess").value);
  if (!Number.isFinite(valor)) return avisar("solo-play", "solo-msg", t("game.empty"), "solo-guess");
  if (!czChuteValido(s, valor)) {
    return avisar("solo-play", "solo-msg", r.alto === null ? t("game.outAbove", { a: fmt(r.baixo) }) : t("game.out", { a: fmt(r.baixo), b: fmt(r.alto) }), "solo-guess");
  }
  const dica = czSoloChutar(s, valor);
  $("solo-guess").value = "";
  $("solo-msg").textContent = "";
  if (r.acabou) soloTempoMs += performance.now() - soloPensandoDesde;
  renderSolo();
  animar(r.acabou ? $("solo-end") : $("solo-hint"));
  if (dica === "cravou" && navigator.vibrate) navigator.vibrate([40, 40, 80]);
  if (r.acabou) $("solo-next").focus();
  else focarCampo("solo-guess");
}

function soloProxima() {
  if (!solo) return;
  if (czSoloProxima(solo)) return terminarSolo();
  renderSolo();
  window.scrollTo(0, 0);
  soloPensandoDesde = performance.now();
  focarCampo("solo-guess");
}

// ───────────── resultado ─────────────

function terminarSolo() {
  const st = { partidas: 0, rodadas: 0, ...(store("stats") || {}) };
  st.partidas += 1;
  st.rodadas += solo.perguntas.length;
  store("stats", st);
  const reg = { pontos: solo.pontos, rodadas: solo.rodadas, ms: Math.round(soloTempoMs) };
  if (soloModo === "diario" && !diarios()[soloDia]) store("diario", { ...diarios(), [soloDia]: reg });
  renderSoloResultado(soloModo === "diario" ? diarios()[soloDia] : reg);
  show("solo-results");
}

function mostrarSoloSalvo(dia, reg) {
  soloModo = "diario";
  soloDia = dia;
  solo = null;
  renderSoloResultado(reg);
  show("solo-results");
}

function renderSoloResultado(reg) {
  const diario = soloModo === "diario";
  const max = (reg.rodadas.length || CZ_DIARIO_QTD) * CZ_SOLO_CHUTES;
  $("solo-res-skin").innerHTML = czBoneco(minhaSkin(), "body");
  $("solo-res-kicker").textContent = diario ? t("daily.kicker", { n: soloDia }) : t("solo.train");
  $("solo-res-score").textContent = reg.pontos === 1 ? t("res.pts1") : t("res.pts", { n: reg.pontos });
  $("solo-res-sub").textContent = t("res.of", { max });
  $("solo-res-share").hidden = !diario;
  $("solo-res-share").onclick = (e) => compartilharDia(soloDia, reg, e.currentTarget);
  $("solo-res-train").textContent = t(diario ? "daily.train" : "res.trainAgain");
  $("solo-res-list").innerHTML = reg.rodadas.map((r) => {
    const p = czPerguntaPorId(r.pergunta);
    if (!p) return "";
    const como = r.cravou ? (r.chutes === 1 ? t("game.tries1") : t("game.tries", { n: r.chutes })) : t("res.missed");
    return `<li class="${r.cravou ? "" : "missed"}"><p>${escapeHtml(tr(p.texto))}</p><b>${escapeHtml(num(p.resposta, p.ano) + (p.unidade ? " " + tr(p.unidade) : ""))}</b><span>${escapeHtml(como)} · ${escapeHtml(t("solo.pts", { n: r.pontos }))}</span></li>`;
  }).join("");
  $("leaderboard").hidden = true;
  if (diario) mostrarRanking(soloDia, reg);
}

// Ranking do dia (../gamezi-ranking.js): manda o resultado de hoje uma vez e mostra quem foi melhor.
function mostrarRanking(dia, reg) {
  if (typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: "cravazi", dia, hoje: czDiaNumero(), lang, nick: store("nick"),
    reg: { acertos: reg.pontos, ms: reg.ms, enviado: !!reg.enviado },
    salvar: (r) => store("diario", { ...diarios(), [dia]: { ...diarios()[dia], enviado: r.enviado } }),
    guardarNick: (nome) => store("nick", nome),
  });
}

function compartilharDia(dia, reg, btn) {
  const linha = reg.rodadas.map((r) => (r.cravou ? "🎯" + r.chutes : "❌")).join(" ");
  copiar(t("res.shareText", { n: dia, p: reg.pontos, max: reg.rodadas.length * CZ_SOLO_CHUTES, linha, url: location.origin + location.pathname }), btn);
}

function ligarSozinho() {
  $("solo-play").onsubmit = soloChutar;
  $("solo-guess").addEventListener("input", () => ($("solo-msg").textContent = ""));
  $("solo-next").onclick = soloProxima;
  $("solo-res-train").onclick = comecarTreino;
  $("solo-res-home").onclick = irInicio;
}
