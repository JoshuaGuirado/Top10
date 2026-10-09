// Cravazi na tela: início, partida com a turma (passando o celular) ou online, e resultado.
// As regras ficam em jogo.js; os textos em textos.js; as skins em skins.js; o Cravazi do dia (sozinho,
// com ranking) em sozinho.js; as salas online em online.js. A partida com a turma e a online usam a
// mesma tela: no online, o aparelho do anfitrião aplica os chutes e manda o estado para os outros.

const CZ_MIN = 2;
const CZ_MAX = 8;
const CZ_RODADAS = [5, 10, 15];
const CZ_VISTAS_MAX = 150; // perguntas lembradas para não repetir logo

let partida = null; // estado de jogo.js
let modo = "local"; // "local" (com a turma) ou "online"
let partidaContada = false; // a partida já entrou nas estatísticas deste aparelho
let nomes = []; // nomes digitados em "Com a turma"
let skins = []; // skin de cada um ({ presetId, avatar })
let rodadas = 10;

function show(tela) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + tela));
  document.body.dataset.screen = tela;
  window.scrollTo(0, 0);
}

const ICONES = {
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  x: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// Skin de quem usa este aparelho (Cravazi do dia e online). Na primeira vez, sorteia uma pronta.
function minhaSkin() {
  let s = czSkinValida(store("skin"));
  if (!s) {
    s = czSkinValida(skins[0]) || czSkinSorteada();
    store("skin", s);
  }
  return s;
}

// ───────────── início e "Com a turma" ─────────────

function carregarInicio() {
  const salvos = store("jogadores");
  nomes = Array.isArray(salvos) && salvos.length >= CZ_MIN ? salvos.slice(0, CZ_MAX).map((n) => String(n).slice(0, 16)) : ["", ""];
  const guardadas = store("skins");
  skins = nomes.map((_, i) => (Array.isArray(guardadas) && czSkinValida(guardadas[i])) || null);
  skins.forEach((s, i) => { if (!s) skins[i] = czSkinSorteada(skins.filter(Boolean).map((x) => x.presetId)); });
  const r = store("rodadas");
  rodadas = CZ_RODADAS.includes(r) ? r : 10;
}

function renderJogadores() {
  $("players").innerHTML = nomes.map((n, i) => {
    const rotulo = t("home.player", { n: i + 1 });
    return `
    <div class="player-row">
      <button type="button" class="skin-mini" data-skin="${i}" title="${escapeHtml(t("skin.change"))}" aria-label="${escapeHtml(t("skin.of", { nome: n || rotulo }))}">${czBoneco(skins[i])}</button>
      <input type="text" maxlength="16" value="${escapeHtml(n)}" placeholder="${escapeHtml(rotulo)}" data-i="${i}" aria-label="${escapeHtml(rotulo)}">
      ${nomes.length > CZ_MIN ? `<button type="button" class="icon-btn" data-tirar="${i}" aria-label="${escapeHtml(t("home.remove", { nome: n || rotulo }))}">${ICONES.x}</button>` : ""}
    </div>`;
  }).join("");
  $("add-player").hidden = nomes.length >= CZ_MAX;
}

function renderRodadas() {
  $("rounds").innerHTML = CZ_RODADAS.map((n) =>
    `<button type="button" role="radio" aria-checked="${n === rodadas}" class="${n === rodadas ? "on" : ""}" data-r="${n}">${n}</button>`).join("");
}

function renderHome() {
  renderDiarioCard();
}

function irInicio() {
  partida = null;
  if (modo === "online" && !sala) modo = "local";
  renderHome();
  show("home");
}

function abrirTurma() {
  renderJogadores();
  renderRodadas();
  show("setup");
}

function guardarTurma() {
  store("jogadores", nomes.map((n) => n.trim()));
  store("skins", skins);
}

function escolherSkinDoJogador(i) {
  const nome = nomes[i].trim() || t("home.player", { n: i + 1 });
  const emUso = skins.filter((_, k) => k !== i).map((s) => s && s.presetId).filter(Boolean);
  abrirSkin(t("skin.of", { nome }), skins[i], emUso, (skin) => {
    skins[i] = skin;
    guardarTurma();
    renderJogadores();
  });
}

// Nome vazio vira "Jogador N"; nomes iguais ganham um número para dar para saber de quem é a vez.
function nomesFinais() {
  const vistos = {};
  return nomes.map((n, i) => {
    let nome = n.trim() || t("home.player", { n: i + 1 });
    const k = nome.toLowerCase();
    vistos[k] = (vistos[k] || 0) + 1;
    if (vistos[k] > 1) nome += " " + vistos[k];
    return nome;
  });
}

// ───────────── partida ─────────────

function comecar() {
  guardarTurma();
  store("rodadas", rodadas);
  modo = "local";
  partidaContada = false;
  const lista = nomesFinais().map((nome, i) => ({ nome, skin: skins[i] }));
  partida = czNovaPartida({ jogadores: lista, rodadas, vistas: store("vistas") || [] });
  const vistas = (store("vistas") || []).concat(partida.perguntas.map((p) => p.id));
  store("vistas", vistas.slice(-CZ_VISTAS_MAX));
  show("game");
  renderJogo();
  focarCampo("guess");
}

// Só no computador: no celular o teclado subindo de surpresa atrapalha quem está passando o aparelho.
function focarCampo(id) {
  if (matchMedia("(pointer: fine)").matches && $(id) && !$(id).closest("[hidden]")) $(id).focus();
}

function renderJogo() {
  const s = partida;
  if (!s || s.fim) return;
  const r = s.atual;
  const p = r.pergunta;
  const fmt = (n) => num(n, p.ano);
  const online = modo === "online";
  $("game-quit").hidden = !online;
  $("round").textContent = t("game.round", { a: s.rodada + 1, b: s.perguntas.length });
  $("score").innerHTML = s.jogadores.map((j, i) => {
    const cls = ["chip", i === r.vez && r.vencedor === null ? "now" : "", i === r.vencedor ? "win" : "", online && j.id && !onlinePresente(j.id) ? "away" : ""].filter(Boolean).join(" ");
    return `<span class="${cls}">${czBoneco(j.skin)}<b>${escapeHtml(j.nome)}</b> ${j.pontos}</span>`;
  }).join("");
  const tema = czTemaPorId(p.tema);
  $("theme").textContent = tema ? tr(tema.nome) : "";
  $("question").textContent = tr(p.texto);

  // Último chute: quem chutou, quanto, e se é mais ou menos.
  const ult = r.chutes[r.chutes.length - 1];
  const dica = ult && ult.dica !== "cravou" ? ult : null;
  $("hint").hidden = !dica;
  if (dica) {
    $("hint").className = "hint " + dica.dica;
    $("hint-who").textContent = t("game.guessed", { nome: s.jogadores[dica.jogador].nome, n: fmt(dica.valor) });
    $("hint-big").innerHTML = `${escapeHtml(t(dica.dica === "mais" ? "game.more" : "game.less"))} <span aria-hidden="true">${dica.dica === "mais" ? "↑" : "↓"}</span>`;
  }
  const temFaixa = r.baixo > 0 || r.alto !== null;
  $("range").hidden = !temFaixa || r.vencedor !== null;
  if (temFaixa) {
    $("range").textContent = r.alto === null ? t("game.above", { a: fmt(r.baixo) }) : t("game.between", { a: fmt(r.baixo), b: fmt(r.alto) });
  }

  const acabou = r.vencedor !== null;
  $("play").hidden = acabou;
  $("nailed").hidden = !acabou;
  if (!acabou) {
    const daVez = s.jogadores[r.vez];
    const minha = souDaVez();
    $("turn-skin").innerHTML = czBoneco(daVez.skin);
    $("turn").textContent = online && minha ? t("game.yourTurn") : t("game.turn", { nome: daVez.nome });
    $("guess-row").hidden = !minha;
    $("wait-msg").hidden = minha;
    $("guess-btn").disabled = false;
    $("unit").textContent = p.unidade ? tr(p.unidade) : "";
    $("unit").hidden = !p.unidade;
  } else {
    const venc = s.jogadores[r.vencedor];
    $("nailed-skin").innerHTML = czBoneco(venc.skin, "body");
    $("nailed-who").textContent = t("game.nailed", { nome: venc.nome });
    $("nailed-answer").textContent = fmt(p.resposta) + (p.unidade ? " " + tr(p.unidade) : "");
    $("nailed-tries").textContent = r.chutes.length === 1 ? t("game.tries1") : t("game.tries", { n: r.chutes.length });
    $("next-btn").textContent = t(s.rodada + 1 >= s.perguntas.length ? "game.finish" : "game.next");
    $("next-btn").disabled = false;
  }

  // Chutes da rodada, do mais novo para o mais velho.
  $("history").innerHTML = r.chutes.slice().reverse().map((c) =>
    `<li class="${c.dica}"><span>${escapeHtml(s.jogadores[c.jogador].nome)}</span><b>${escapeHtml(fmt(c.valor))}</b><i aria-hidden="true">${c.dica === "mais" ? "↑" : c.dica === "menos" ? "↓" : "●"}</i></li>`).join("");
}

// "8.849", "8,849" ou "8 849" → 8849.
function lerChute(texto) {
  const so = String(texto).replace(/\D/g, "");
  return so ? Number(so) : NaN;
}

function chutar(e) {
  e.preventDefault();
  const s = partida;
  if (!s || s.fim || s.atual.vencedor !== null || !souDaVez()) return;
  const r = s.atual;
  const fmt = (n) => num(n, r.pergunta.ano);
  const valor = lerChute($("guess").value);
  if (!Number.isFinite(valor)) return avisar("play", "guess-msg", t("game.empty"), "guess");
  if (!czChuteValido(s, valor)) {
    return avisar("play", "guess-msg", r.alto === null ? t("game.outAbove", { a: fmt(r.baixo) }) : t("game.out", { a: fmt(r.baixo), b: fmt(r.alto) }), "guess");
  }
  $("guess").value = "";
  $("guess-msg").textContent = "";
  // Online, quem não é o anfitrião só manda o chute; o estado novo chega do anfitrião.
  if (modo === "online" && !isHost()) return enviarAcao({ tipo: "chutar", valor });
  aplicarChute(valor);
}

// Aplica o chute de quem está na vez (com a turma, ou no aparelho do anfitrião).
function aplicarChute(valor) {
  const dica = czChutar(partida, valor);
  if (!dica) return;
  if (modo === "online") onlineTransmitir();
  renderJogo();
  animar(dica === "cravou" ? $("nailed") : $("hint"));
  if (dica === "cravou") {
    if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
    $("next-btn").focus();
  } else if (souDaVez()) {
    focarCampo("guess");
  }
}

function animar(el) {
  if (!el) return;
  el.classList.remove("pop");
  void el.offsetWidth; // reinicia a animação
  el.classList.add("pop");
}

function avisar(formId, msgId, msg, campoId) {
  $(msgId).textContent = msg;
  const box = $(formId);
  box.classList.remove("shake");
  void box.offsetWidth;
  box.classList.add("shake");
  focarCampo(campoId);
}

function proxima() {
  if (!partida || partida.atual.vencedor === null) return;
  if (modo === "online" && !isHost()) return enviarAcao({ tipo: "proxima" });
  aplicarProxima();
}

function aplicarProxima() {
  if (!partida) return;
  const acabou = czProxima(partida);
  if (modo === "online") {
    onlineTransmitir();
    if (acabou) onlinePartidaAcabou();
  }
  if (acabou) return terminar();
  renderJogo();
  window.scrollTo(0, 0);
  if (souDaVez()) focarCampo("guess");
}

// ───────────── resultado ─────────────

function terminar() {
  if (!partidaContada) {
    partidaContada = true;
    const st = { partidas: 0, rodadas: 0, ...(store("stats") || {}) };
    st.partidas += 1;
    st.rodadas += partida.perguntas.length;
    store("stats", st);
  }
  renderResultado();
  show("results");
}

function renderResultado() {
  const s = partida;
  if (!s) return;
  const venc = czVencedores(s);
  const lista = venc.map((j) => j.nome);
  $("res-podium").innerHTML = venc.slice(0, 4).map((j) => czBoneco(j.skin, "body")).join("");
  if (venc.length === 1) {
    $("res-title").textContent = t("res.won", { nome: venc[0].nome });
    $("res-sub").textContent = venc[0].pontos === 1 ? t("res.pts1") : t("res.pts", { n: venc[0].pontos });
  } else {
    $("res-title").textContent = t("res.tie");
    $("res-sub").textContent = t("res.tieSub", { nomes: lista.slice(0, -1).join(", ") + t("res.and") + lista[lista.length - 1] });
  }
  $("res-ranking").innerHTML = czPlacar(s).map((j) =>
    `<li class="${j.pos === 1 ? "first" : ""}"><span class="pos">${j.pos}º</span>${czBoneco(j.skin)}<b>${escapeHtml(j.nome)}</b><span>${escapeHtml(j.pontos === 1 ? t("res.pts1") : t("res.pts", { n: j.pontos }))}</span></li>`).join("");
  $("res-rounds").innerHTML = s.rodadas.map((r, i) => {
    const p = s.perguntas[i];
    return `<li><p>${escapeHtml(tr(p.texto))}</p><b>${escapeHtml(num(p.resposta, p.ano) + (p.unidade ? " " + tr(p.unidade) : ""))}</b><span>${escapeHtml(s.jogadores[r.vencedor].nome)}</span></li>`;
  }).join("");
  $("res-again").textContent = t(modo === "online" ? "res.backRoom" : "btn.again");
}

// Copia o texto (e abre o compartilhar do celular, se tiver). O botão avisa que copiou.
function copiar(texto, btn) {
  if (navigator.share && matchMedia("(hover: none)").matches) {
    navigator.share({ text: texto }).catch(() => {});
    return;
  }
  const feito = () => {
    if (!btn) return;
    const antes = btn.textContent;
    btn.textContent = t("btn.copied");
    setTimeout(() => (btn.textContent = antes), 1600);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(feito, feito);
  else feito();
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
  if (tela === "setup") abrirTurma();
  if (tela === "game") renderJogo();
  if (tela === "results") renderResultado();
  if (tela === "solo" && solo) renderSolo();
  if (tela === "solo-results") {
    const reg = soloModo === "diario" ? diarios()[soloDia] : solo && { pontos: solo.pontos, rodadas: solo.rodadas };
    if (reg) renderSoloResultado(reg);
  }
  if (tela === "online") renderMinhaSkinOnline();
  if (tela === "lobby") renderSala();
  if ($("skin-dialog").open) renderSkinDialog();
}

// Logo (início): no online, sai da sala (perguntando antes, se a partida está rolando).
function logoClicado() {
  if (sala) {
    if (partida && !partida.fim && document.body.dataset.screen === "game" && !confirm(t("on.quit"))) return;
    return sairDaSala();
  }
  irInicio();
}

function ligar() {
  $("home-btn").onclick = logoClicado;
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

  $("together-btn").onclick = abrirTurma;
  $("online-btn").onclick = () => abrirOnline();
  $("setup-back").onclick = irInicio;
  $("players").addEventListener("input", (e) => {
    if (e.target.dataset.i !== undefined) nomes[Number(e.target.dataset.i)] = e.target.value;
  });
  $("players").addEventListener("click", (e) => {
    const sk = e.target.closest("[data-skin]");
    if (sk) return escolherSkinDoJogador(Number(sk.dataset.skin));
    const b = e.target.closest("[data-tirar]");
    if (!b || nomes.length <= CZ_MIN) return;
    const i = Number(b.dataset.tirar);
    nomes.splice(i, 1);
    skins.splice(i, 1);
    renderJogadores();
  });
  $("add-player").onclick = () => {
    if (nomes.length >= CZ_MAX) return;
    nomes.push("");
    skins.push(czSkinSorteada(skins.map((s) => s && s.presetId)));
    renderJogadores();
    $("players").querySelector(`[data-i="${nomes.length - 1}"]`).focus();
  };
  $("rounds").onclick = (e) => {
    const b = e.target.closest("[data-r]");
    if (!b) return;
    rodadas = Number(b.dataset.r);
    renderRodadas();
  };
  $("start-btn").onclick = comecar;
  $("play").onsubmit = chutar;
  $("guess").addEventListener("input", () => ($("guess-msg").textContent = ""));
  $("next-btn").onclick = proxima;
  $("game-quit").onclick = () => { if (confirm(t("on.quit"))) sairDaSala(); };
  $("res-again").onclick = () => (modo === "online" && sala ? voltarParaSala().catch(onlineErro) : comecar());
  $("res-home").onclick = () => (sala ? sairDaSala() : irInicio());
  ligarSkins();
  ligarSozinho();
  ligarOnline();
}

function iniciar() {
  if (typeof gameziRetornoDoLogin === "function" && gameziRetornoDoLogin("../")) return;
  applyI18n();
  $("help-btn").innerHTML = '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>';
  renderTema();
  carregarInicio();
  ligar();
  irInicio();
  if (location.hash === "#como-jogar") $("help-btn").click();
  retomarOnline();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    addEventListener("load", () => navigator.serviceWorker.register("../sw.js", { scope: "../" }).catch(() => {}));
  }
}

iniciar();
