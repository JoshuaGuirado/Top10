// Datazi na tela: início (Datazi do dia com a semana, Partida livre em três modos e Online), partida e resultado.
// As regras ficam em jogo.js; os textos em textos.js; o online em online.js.

let partida = null; // linha do tempo sozinho (dzNovaPartida), "antes"/"ano" sozinho (dzNovaRodadas) ou online (dzNovaOnline)
let modo = "diario"; // "diario", "livre" ou "online"
let tipoLivre = "linha"; // modo da partida livre: "linha", "antes" ou "ano"
let diaAtual = 0;
let esperando = false; // linha do tempo sozinho: mostrando se acertou, antes do próximo
let pensandoDesde = 0; // quando apareceu o acontecimento da vez (performance.now)
let tempoMs = 0; // tempo pensando na partida: desempata o ranking do dia
let partidaNum = 0; // conta as partidas sozinho (para saber quando a rodada mudou)
let rodadaDesenhada = ""; // última rodada desenhada (limpa o campo do ano e rola a tela só quando muda)
let reveladaDesenhada = "";

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

// ───────────── dados guardados ─────────────

// recorde: linha do tempo; recAntes: "Qual veio antes?"; recAno: "Em que ano?"; online: partidas online.
function stats() {
  return { partidas: 0, acertos: 0, recorde: 0, recAntes: 0, recAno: 0, online: 0, ...(store("stats") || {}) };
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
  x: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// Botões dos modos de jogo (partida livre e sala online).
function chipsModos(el, atual, onEscolher, editavel = true) {
  el.innerHTML = DZ_MODOS.map((m) =>
    `<button type="button" role="radio" aria-checked="${m === atual}" class="chip ${m === atual ? "active" : ""}" data-modo="${m}" ${editavel ? "" : "disabled"}>${escapeHtml(t("modo." + m))}</button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest("[data-modo]");
    if (b && editavel) onEscolher(b.dataset.modo);
  };
}

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
  tipoLivre = DZ_MODOS.includes(store("tipo")) ? store("tipo") : "linha";
  const rec = { linha: st.recorde, antes: st.recAntes, ano: st.recAno }[tipoLivre];
  $("free-sub").textContent = tipoLivre === "ano"
    ? (rec ? t("home.anoSub", { n: rec }) : t("home.anoSubNew"))
    : (rec ? t("home.freeSub", { n: rec }) : t("home.freeSubNew"));
  chipsModos($("free-modes"), tipoLivre, (m) => {
    store("tipo", m);
    renderHome();
  });
}

function irInicio() {
  partida = null;
  if (modo === "online") modo = "livre";
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
  // O de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (dia === dzDiaNumero() && typeof gameziNomeAntesDoDia === "function" && !gameziNick(store("nick"))) {
    return gameziNomeAntesDoDia({ nick: store("nick"), lang, guardarNick: (n) => store("nick", n), comecar: () => comecarDiario(dia) });
  }
  modo = "diario";
  diaAtual = dia;
  partida = dzNovaPartida(dzDiarioEventos(dia), dzVidasDoDia(dia));
  esperando = false;
  show("game");
  renderJogo();
  comecarTempo();
}

function comecarLivre() {
  modo = "livre";
  partida = tipoLivre === "linha" ? dzNovaPartida(dzLivreEventos()) : dzNovaRodadas(tipoLivre, dzLivreRodadas(tipoLivre));
  partidaNum += 1;
  esperando = false;
  show("game");
  renderJogo();
  comecarTempo();
}

// O tempo conta só enquanto a pessoa pensa onde pôr o acontecimento (não enquanto vê se acertou).
function comecarTempo() {
  tempoMs = 0;
  pensandoDesde = performance.now();
}

function tipoDaPartida() {
  return (partida && partida.tipo) || "linha";
}

// Online: eu (id da conta) nesta partida.
function euOnline() {
  return typeof meuId === "function" ? meuId() : null;
}

// A rodada da vez já mostra a resposta? (sozinho: depois de responder; online: depois que o anfitrião revela)
function rodadaRevelada() {
  const s = partida;
  if (s.online) return s.fase === "revelado";
  if (!s.tipo) return esperando;
  return s.respostas.length > s.atual;
}

// Minha resposta na rodada da vez (undefined se ainda não respondi) e quantos pontos ela fez (depois de revelar).
function minhaResposta() {
  const s = partida;
  if (s.online) return { v: s.respostas[euOnline()], pontos: s.ganhos[euOnline()] };
  const r = s.respostas[s.atual];
  return r ? { v: r.v, pontos: r.pontos } : { v: undefined };
}

function renderJogo() {
  const s = partida;
  if (!s) return;
  const tipo = tipoDaPartida();
  const online = !!s.online;
  const revelada = rodadaRevelada();
  const chave = online ? "on" + s.comecou : partidaNum + ":" + (s.tipo ? s.atual : s.linha.length);
  const novaRodada = chave !== rodadaDesenhada;
  rodadaDesenhada = chave;

  $("game-title").textContent = modo === "diario" ? t("daily.kicker", { n: diaAtual }) : t("modo." + tipo);
  const comVidas = !online && s.vidasMax > 0;
  $("game-lives").hidden = !comVidas;
  if (comVidas) {
    $("game-lives").innerHTML = Array.from({ length: s.vidasMax }, (_, i) => `<span class="heart ${i < s.vidas ? "" : "lost"}">${ICONES.heart}</span>`).join("") +
      `<small>${escapeHtml(s.vidas === 1 ? t("game.lives1") : t("game.lives", { n: s.vidas }))}</small>`;
    $("game-lives").setAttribute("aria-label", s.vidas === 1 ? t("game.lives1") : t("game.lives", { n: s.vidas }));
  }
  $("game-round").hidden = !(online || tipo === "ano");
  if (s.rodadas) $("game-round").textContent = t("game.round", { a: Math.min(s.atual + 1, s.rodadas.length), b: s.rodadas.length });
  const pontos = online ? (s.jogadores.find((j) => j.id === euOnline()) || { pontos: 0 }).pontos : tipo === "ano" ? s.pontos : s.acertos;
  $("game-score").textContent = online || tipo === "ano" ? (pontos === 1 ? t("game.pts1") : t("game.pts", { n: pontos })) : (pontos === 1 ? t("game.score1") : t("game.score", { n: pontos }));

  $("game-card").hidden = tipo === "antes";
  $("game-pair").hidden = tipo !== "antes";
  $("year-form").hidden = true;
  $("timeline").hidden = tipo !== "linha";
  if (tipo === "linha") renderLinha(revelada);
  else if (tipo === "antes") renderPar(revelada);
  else renderAno(revelada, novaRodada);

  // Seguir: sozinho, depois de responder; online, só o anfitrião, depois de revelar.
  const anfitriao = online && typeof isHost === "function" && isHost();
  const acaba = online ? s.atual + 1 >= s.rodadas.length : s.tipo ? s.atual + 1 >= s.rodadas.length || (s.vidasMax > 0 && s.vidas <= 0) : s.fim;
  $("game-next").hidden = !revelada || (online && !anfitriao);
  $("game-next").textContent = t(acaba ? "game.finish" : "game.next");
  const respondi = online && minhaResposta().v !== undefined;
  $("sent").hidden = !online || (revelada ? anfitriao : !respondi);
  $("sent").textContent = t(revelada ? "on.waitHost" : "on.sent");
  $("players").hidden = !online;
  if (online && typeof renderJogadoresOnline === "function") renderJogadoresOnline();
  if (typeof renderTimer === "function") renderTimer();

  const chaveRevelada = revelada ? chave : "";
  if (revelada && chaveRevelada !== reveladaDesenhada && tipo === "linha") {
    const el = $("timeline").querySelector(".event.right, .event.wrong, .event.novo");
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  reveladaDesenhada = chaveRevelada;
}

// Linha do tempo: o acontecimento da vez no alto e um botão entre cada um da linha (e antes do primeiro e depois do
// último), dizendo onde fica: "Antes de 1953", "Entre 1953 e 1973", "Depois de 2017".
function renderLinha(revelada) {
  const s = partida;
  let atualId, certo = null, podeTocar, escolhido = null;
  if (s.online) {
    atualId = s.rodadas[s.atual];
    const meu = minhaResposta();
    if (revelada && meu.v !== undefined) certo = meu.pontos > 0;
    podeTocar = !revelada && meu.v === undefined;
    if (!revelada && meu.v !== undefined) escolhido = meu.v;
  } else {
    atualId = revelada ? s.ultimo.id : s.atual;
    if (revelada) certo = s.ultimo.certo;
    podeTocar = !revelada;
  }
  const atual = dzEvento(atualId);
  $("game-card").className = "event-card" + (revelada ? (certo === true ? " right" : certo === false ? " wrong" : "") : "");
  $("game-card").innerHTML = `<p>${escapeHtml(tr(atual.txt))}</p>${revelada ? `<b>${atual.ano}</b>` : ""}`;
  $("game-hint").textContent = revelada ? (certo === null ? t("game.yearMissed", { ano: atual.ano }) : t(certo ? "game.right" : "game.wrong", { ano: atual.ano })) : podeTocar ? t("game.where") : "";
  $("game-hint").className = "game-hint" + (certo === true ? " good" : certo === false ? " bad" : "");

  const ano = (i) => dzEvento(s.linha[i]).ano;
  const onde = (pos) => (pos === 0 ? t("game.before", { a: ano(0) }) : pos === s.linha.length ? t("game.after", { a: ano(pos - 1) }) : t("game.between", { a: ano(pos - 1), b: ano(pos) }));
  const slot = (pos) => `<li class="slot ${pos === escolhido ? "chosen" : ""}"><button type="button" data-pos="${pos}" ${podeTocar ? "" : "disabled"}>${escapeHtml(onde(pos))}</button></li>`;
  let html = slot(0);
  s.linha.forEach((id, i) => {
    const e = dzEvento(id);
    const novo = revelada && id === atualId;
    html += `<li class="event ${novo ? (certo === true ? "right" : certo === false ? "wrong" : "novo") : ""}"><b>${e.ano}</b><span>${escapeHtml(tr(e.txt))}</span></li>`;
    html += slot(i + 1);
  });
  $("timeline").innerHTML = html;
  $("timeline").classList.toggle("placing", podeTocar || escolhido !== null);
}

// "Qual veio antes?": dois botões; depois de responder, os anos aparecem e o mais antigo fica verde.
function renderPar(revelada) {
  const s = partida;
  const par = s.rodadas[s.atual];
  const meu = minhaResposta().v;
  const certo = dzMaisAntigo(par);
  $("game-pair").innerHTML = par.map((id, i) => {
    const e = dzEvento(id);
    const cls = revelada ? (i === certo ? "right" : i === meu ? "wrong" : "") : i === meu ? "chosen" : "";
    return `<button type="button" class="pair-btn ${cls}" data-escolha="${i}" ${revelada || meu !== undefined ? "disabled" : ""}><span>${escapeHtml(tr(e.txt))}</span>${revelada ? `<b>${e.ano}</b>` : ""}</button>`;
  }).join("");
  $("game-hint").textContent = revelada ? (meu === undefined ? "" : t(meu === certo ? "game.firstRight" : "game.firstWrong")) : meu === undefined ? t("game.which") : "";
  $("game-hint").className = "game-hint" + (revelada && meu !== undefined ? (meu === certo ? " good" : " bad") : "");
}

// "Em que ano?": o acontecimento e o campo do ano; depois de responder, o ano certo e os pontos.
function renderAno(revelada, novaRodada) {
  const s = partida;
  const e = dzEvento(s.rodadas[s.atual]);
  const meu = minhaResposta();
  const cls = revelada ? (meu.pontos === 10 ? " right" : !meu.pontos ? " wrong" : " shown") : "";
  $("game-card").className = "event-card" + cls;
  $("game-card").innerHTML = `<p>${escapeHtml(tr(e.txt))}</p>${revelada ? `<b>${e.ano}</b>` : ""}`;
  const podeChutar = !revelada && meu.v === undefined;
  $("year-form").hidden = !podeChutar;
  if (novaRodada) {
    $("year-input").value = "";
    if (podeChutar && matchMedia("(hover: hover)").matches) $("year-input").focus({ preventScroll: true });
  }
  $("game-hint").textContent = revelada
    ? (meu.v === undefined ? t("game.yearMissed", { ano: e.ano }) : t("game.yearRes", { ano: e.ano, v: meu.v, p: meu.pontos }))
    : podeChutar ? t("game.year") : "";
  $("game-hint").className = "game-hint" + (revelada && meu.v !== undefined ? (meu.pontos >= 5 ? " good" : !meu.pontos ? " bad" : "") : "");
}

function colocar(pos) {
  if (!partida || tipoDaPartida() !== "linha") return;
  if (partida.online) {
    if (!rodadaRevelada() && minhaResposta().v === undefined) onlineResponder(pos);
    return;
  }
  if (esperando || partida.fim) return;
  tempoMs += performance.now() - pensandoDesde;
  dzColocar(partida, pos);
  esperando = true;
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

// Resposta de "Qual veio antes?" (0 ou 1) ou de "Em que ano?" (o ano).
function responder(v) {
  if (!partida || rodadaRevelada() || minhaResposta().v !== undefined) return;
  if (partida.online) return onlineResponder(v);
  dzResponder(partida, v);
  renderJogo();
  $("game-next").focus({ preventScroll: true });
}

function chutarAno() {
  const v = Number($("year-input").value);
  if (!dzAnoValido(v)) {
    $("game-hint").textContent = t("game.yearBad");
    $("game-hint").className = "game-hint bad";
    $("year-input").focus();
    return;
  }
  $("year-input").blur();
  responder(v);
}

function proximo() {
  if (!partida) return;
  if (partida.online) return onlineProxima();
  if (partida.tipo) {
    if (!rodadaRevelada()) return;
    if (dzProxima(partida)) return terminar();
  } else {
    if (partida.fim) return terminar();
    esperando = false;
  }
  renderJogo();
  pensandoDesde = performance.now();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── fim ─────────────

function terminar() {
  const s = partida;
  const st = stats();
  st.partidas += 1;
  if (s.tipo) {
    const campo = s.tipo === "antes" ? "recAntes" : "recAno";
    const valor = s.tipo === "antes" ? s.acertos : s.pontos;
    st.acertos += s.acertos;
    const recorde = valor > st[campo];
    if (recorde) st[campo] = valor;
    store("stats", st);
    return mostrarResultadoRodadas(s, recorde);
  }
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
    todos[diaAtual] = { acertos: s.acertos, total: DZ_DIARIO_QTD, marcas: s.marcas, linha: s.linha, ms: Math.round(tempoMs) };
    store("diario", todos);
  }
  mostrarResultado({ acertos: s.acertos, total, marcas: s.marcas, linha: s.linha, recorde });
}

function mostrarResultadoSalvo(dia, reg) {
  modo = "diario";
  diaAtual = dia;
  mostrarResultado({ acertos: reg.acertos, total: reg.total, marcas: reg.marcas, linha: reg.linha || [] });
}

// Partes do resultado que todo modo usa: título da lista, botões e o que fica escondido.
function telaResultado(lista) {
  show("results");
  $("res-ranking").hidden = true;
  $("leaderboard").hidden = true;
  $("res-share").hidden = true;
  $("res-again").hidden = false;
  $("res-again").textContent = t("btn.again");
  $("res-list-title").textContent = t(lista === "timeline" ? "res.timeline" : "res.rounds");
  $("res-timeline").className = lista === "timeline" ? "timeline done" : "rounds";
}

function mostrarResultado(r) {
  const diario = modo === "diario";
  telaResultado("timeline");
  $("res-kicker").textContent = diario ? t("daily.kicker", { n: diaAtual }) : t("modo.linha");
  $("res-score").textContent = diario ? t("res.title", { a: r.acertos, b: DZ_DIARIO_QTD }) : t("res.free", { n: r.acertos });
  $("res-sub").textContent = diario
    ? (sequenciaDiaria() > 1 ? t("res.sub", { n: sequenciaDiaria() }) : "")
    : r.recorde ? t("res.record") : t("res.best", { n: stats().recorde });
  $("res-share").hidden = !diario;
  $("res-share").onclick = (e) => compartilhar(diaAtual, r, e.currentTarget);
  $("res-again").hidden = diario;
  if (diario) mostrarRanking();
  $("res-timeline").innerHTML = r.linha.map((id) => {
    const e = dzEvento(id);
    return e ? `<li class="event"><b>${e.ano}</b><span>${escapeHtml(tr(e.txt))}</span></li>` : "";
  }).join("");
}

// Uma rodada na lista do resultado: "Qual veio antes?" mostra os dois (com o ano); os outros, o acontecimento.
function rodadaHtml(tipo, r, nota, marca) {
  const linha = (id) => {
    const e = dzEvento(id);
    return `${escapeHtml(tr(e.txt))} <small>${e.ano}</small>`;
  };
  const texto = tipo === "antes" ? r.map(linha).join("<br>") : linha(r);
  return `<li><span>${texto}${nota ? `<em>${escapeHtml(nota)}</em>` : ""}</span>${marca ? `<b>${escapeHtml(marca)}</b>` : ""}</li>`;
}

function mostrarResultadoRodadas(s, recorde) {
  telaResultado("rounds");
  const ano = s.tipo === "ano";
  const valor = ano ? s.pontos : s.acertos;
  const rec = stats()[ano ? "recAno" : "recAntes"];
  $("res-kicker").textContent = t("modo." + s.tipo);
  $("res-score").textContent = !ano && valor === 1 ? t("res.antes1") : t(ano ? "res.ano" : "res.antes", { n: valor });
  $("res-sub").textContent = (ano ? t("res.of100") + " · " : "") + (recorde ? t("res.record") : t("res.best", { n: rec }));
  $("res-timeline").innerHTML = s.respostas.map((r, i) => ano
    ? rodadaHtml("ano", s.rodadas[i], t("res.guess", { v: r.v }), "+" + r.pontos)
    : rodadaHtml("antes", s.rodadas[i], "", r.certo ? "✓" : "✗")).join("");
}

// Ranking do dia (../gamezi-ranking.js): manda o resultado de hoje uma vez e mostra quem foi melhor.
function mostrarRanking() {
  const dia = diaAtual;
  const reg = diarios()[dia];
  if (!reg || typeof gameziRankingDoDia !== "function") return;
  gameziRankingDoDia({
    box: $("leaderboard"), jogo: "datazi", dia, hoje: dzDiaNumero(), reg, lang, nick: store("nick"),
    salvar: (r) => store("diario", { ...diarios(), [dia]: r }),
    guardarNick: (n) => store("nick", n),
  });
}

function compartilhar(dia, r, btn) {
  const linha = (r.marcas || []).map((m) => (m ? "■" : "□")).join("");
  copiar(t("res.shareText", { n: dia, a: r.acertos, b: DZ_DIARIO_QTD, linha, url: location.origin + location.pathname }), btn);
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

// Sair no meio da partida: online, pergunta antes e sai da sala.
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
  $("timeline").onclick = (e) => {
    const b = e.target.closest("[data-pos]");
    if (b) colocar(Number(b.dataset.pos));
  };
  $("game-pair").onclick = (e) => {
    const b = e.target.closest("[data-escolha]");
    if (b) responder(Number(b.dataset.escolha));
  };
  $("year-form").onsubmit = (e) => {
    e.preventDefault();
    chutarAno();
  };
  $("game-next").onclick = proximo;
  $("game-quit").onclick = sairDoJogo;
  $("res-again").onclick = () => (modo === "online" ? voltarParaSala() : comecarLivre());
  $("res-home").onclick = () => (modo === "online" ? sairDaSala() : irInicio());
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
