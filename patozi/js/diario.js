// Pato do dia: as mesmas 5 cartas para todo mundo. Chegue perto da resposta sem passar (até 100 por carta).
// O resultado fica no aparelho (pz:diario) e vai para o ranking do dia no banco (patozi_diario).

function diarioHoje() {
  return pzDiaNumero();
}

function diarioDados() {
  return store("diario") || {};
}

function diarioDoDia(dia) {
  return diarioDados()[dia] || { chutes: [], pontos: [] };
}

function diarioSalvar(dia, reg) {
  const todos = diarioDados();
  todos[dia] = reg;
  store("diario", todos);
}

function diarioTotal(reg) {
  return reg.pontos.reduce((a, b) => a + b, 0);
}

function diarioCompleto(reg) {
  return reg.pontos.length >= PZ_DIARIO_QTD;
}

// Dias seguidos com o Pato do dia completo, terminando hoje (ou ontem, se hoje ainda não jogou).
function diarioSequencia() {
  const todos = diarioDados();
  let dia = diarioHoje();
  if (!todos[dia] || !diarioCompleto(todos[dia])) dia -= 1;
  let n = 0;
  while (todos[dia] && diarioCompleto(todos[dia])) {
    n += 1;
    dia -= 1;
  }
  return n;
}

function renderDailyCard() {
  const dia = diarioHoje();
  const el = $("daily-card");
  if (dia < 1) {
    el.hidden = true;
    return;
  }
  const reg = diarioDoDia(dia);
  const feito = diarioCompleto(reg);
  el.hidden = false;
  el.innerHTML = `
    <div class="daily-info">
      <p class="daily-kicker">${escapeHtml(t("daily.kicker", { n: dia }))}</p>
      <p class="daily-title">${escapeHtml(feito ? t("daily.done", { pts: diarioTotal(reg) }) : t("daily.title"))}</p>
      <p class="daily-status">${escapeHtml(feito ? tn("daily.streak", diarioSequencia()) : t("daily.status"))}</p>
    </div>
    <div class="daily-actions"><button type="button" class="btn ${feito ? "ghost" : ""}" id="daily-btn">${escapeHtml(t(feito ? "daily.see" : "daily.play"))}</button></div>`;
  $("daily-btn").onclick = abrirDiario;
}

let diarioEstado = null; // { dia, ids, mostrando }

function abrirDiario() {
  const dia = diarioHoje();
  diarioEstado = { dia, ids: pzDiarioCartas(dia), mostrando: false };
  show("daily");
  renderDiario();
}

function renderDiario() {
  const { dia, ids } = diarioEstado;
  const reg = diarioDoDia(dia);
  $("daily-title").textContent = t("daily.kicker", { n: dia });
  const i = diarioEstado.mostrando ? reg.pontos.length - 1 : reg.pontos.length;
  const dots = ids.map((_, k) => `<i class="${k < reg.pontos.length ? (reg.pontos[k] ? "done" : "zero") : k === i ? "now" : ""}"></i>`).join("");
  if (diarioCompleto(reg) && !diarioEstado.mostrando) return renderDiarioFim(reg, dots);
  $("daily-progress").textContent = t("daily.progress", { i: i + 1, n: ids.length });
  const carta = pzCarta(ids[i]);
  let corpo = `
    <div class="daily-dots">${dots}</div>
    <article class="card">
      <div class="card-head"><span class="card-theme">${themeIcon(carta.tema)}${escapeHtml(temaNome(carta.tema))}</span></div>
      <p class="card-q">${escapeHtml(tr(carta.q))}</p>
    </article>`;
  if (diarioEstado.mostrando) {
    const chute = reg.chutes[i];
    const pts = reg.pontos[i];
    const passou = chute > carta.resposta;
    const ultimo = i === ids.length - 1;
    corpo += `
      <div class="reveal-box">
        <p class="reveal-call">${escapeHtml(t("game.guessPh"))}: <b>${fmt(chute)}</b></p>
        <p class="reveal-label">${escapeHtml(t("game.answerIs"))}</p>
        <p class="reveal-answer" id="answer-num">${fmt(carta.resposta)}</p>
        <p class="verdict">${escapeHtml(passou ? t("daily.over") : t("daily.pts", { n: pts }))}</p>
        <div class="actions center"><button type="button" class="btn big" id="daily-next">${escapeHtml(t(ultimo ? "daily.finish" : "daily.next"))}</button></div>
      </div>`;
    $("daily-body").innerHTML = corpo;
    contarAte($("answer-num"), carta.resposta, false);
    $("daily-next").onclick = () => {
      diarioEstado.mostrando = false;
      renderDiario();
    };
    $("daily-next").focus({ preventScroll: true });
  } else {
    corpo += `
      <form class="guess-row daily-form" id="daily-form">
        <input class="answer-input" id="daily-guess" inputmode="numeric" autocomplete="off" placeholder="${escapeHtml(t("daily.guessPh"))}" aria-label="${escapeHtml(t("daily.guessPh"))}">
        <button type="submit" class="btn">${escapeHtml(t("daily.send"))}</button>
      </form>
      <p class="input-error" id="daily-error"></p>`;
    $("daily-body").innerHTML = corpo;
    $("daily-form").onsubmit = (e) => {
      e.preventDefault();
      const v = lerNumero($("daily-guess").value);
      if (!Number.isFinite(v)) return ($("daily-error").textContent = t("game.errNum"));
      const r = diarioDoDia(dia);
      r.chutes.push(v);
      r.pontos.push(pzDiarioPontos(v, carta.resposta));
      diarioSalvar(dia, r);
      diarioEstado.mostrando = true;
      if (r.pontos[r.pontos.length - 1]) sfx.good();
      else sfx.quack();
      if (diarioCompleto(r)) diarioTerminou(r);
      renderDiario();
    };
    if (matchMedia("(hover: hover)").matches) $("daily-guess").focus({ preventScroll: true });
  }
  $("leaderboard").hidden = true;
}

function diarioTerminou(reg) {
  const st = loadStats();
  st.diarios += 1;
  st.melhorDiario = Math.max(st.melhorDiario || 0, diarioTotal(reg));
  store("stats", st);
  if (typeof enviarDiario === "function") enviarDiario(diarioEstado.dia, reg).then(() => renderRanking(), () => {});
}

function renderDiarioFim(reg, dots) {
  const { dia, ids } = diarioEstado;
  const total = diarioTotal(reg);
  $("daily-progress").textContent = "";
  $("daily-body").innerHTML = `
    <div class="daily-dots">${dots}</div>
    <div class="daily-result">
      <p class="daily-score">${total}</p>
      <p class="muted"><b>${escapeHtml(t("daily.total", { pts: total }))}</b> · ${escapeHtml(tn("daily.streak", diarioSequencia()))}</p>
      <div class="actions center">
        <button type="button" class="btn" id="daily-share">${escapeHtml(t("btn.share"))}</button>
        <button type="button" class="btn ghost" id="daily-home">${escapeHtml(t("btn.home"))}</button>
      </div>
      <div class="daily-lines">${ids.map((id, k) => {
        const c = pzCarta(id);
        return `<div class="daily-line ${reg.pontos[k] ? "" : "zero"}"><p>${escapeHtml(tr(c.q))}<br><small>${escapeHtml(t("game.guessPh"))}: ${fmt(reg.chutes[k])} · ${escapeHtml(t("daily.answer", { n: fmt(c.resposta) }))}</small></p><b>${reg.pontos[k]}</b></div>`;
      }).join("")}</div>
    </div>`;
  $("daily-share").onclick = (e) => {
    const linha = reg.pontos.map((p) => (p === 0 ? "X" : p >= 90 ? "■" : p >= 60 ? "▣" : "□")).join(" ");
    shareText(t("daily.shareText", { n: dia, pts: total, linha, url: location.origin + location.pathname }), e.target);
  };
  $("daily-home").onclick = irInicio;
  renderRanking();
}

async function renderRanking() {
  if (!diarioEstado || document.body.dataset.screen !== "daily") return;
  const box = $("leaderboard");
  box.hidden = false;
  if (typeof buscarRanking !== "function" || !onlineConfigured()) {
    box.innerHTML = `<h3>${escapeHtml(t("daily.rankTitle"))}</h3><p class="small muted">${escapeHtml(t("daily.rankOff"))}</p>`;
    return;
  }
  box.innerHTML = `<h3>${escapeHtml(t("daily.rankTitle"))}</h3><p class="small muted">${escapeHtml(t("daily.rankLoading"))}</p>`;
  let linhas = [];
  try {
    linhas = await buscarRanking(diarioEstado.dia);
  } catch (e) {
    box.innerHTML = `<h3>${escapeHtml(t("daily.rankTitle"))}</h3><p class="small muted">${escapeHtml(e.message || t("on.errNet"))}</p>`;
    return;
  }
  box.innerHTML = `<h3>${escapeHtml(t("daily.rankTitle"))}</h3>` + (linhas.length
    ? linhas.map((l, k) => `<div class="lb-row ${l.user_id === myId() ? "me" : ""}"><span>${k + 1}</span><b>${escapeHtml(l.nick || "?")}${l.user_id === myId() ? ` <small class="muted">(${escapeHtml(t("daily.you"))})</small>` : ""}</b><em>${l.pontos}</em></div>`).join("")
    : `<p class="small muted">${escapeHtml(t("daily.rankEmpty"))}</p>`);
}
