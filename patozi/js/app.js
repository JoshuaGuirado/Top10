// Começo de tudo: liga os botões, desenha o início e volta para a sala online se for o caso.

function irInicio() {
  show("home");
  renderHome();
}

function renderHome() {
  renderDailyCard();
  document.querySelector(".pato-n .pato-ico").innerHTML = patoSvg(0);
  $("home-themes").innerHTML = PZ_TEMAS.map((tema) => {
    const n = PZ_CARTAS.filter((c) => c.tema === tema.id).length;
    return `<span class="theme-pill">${themeIcon(tema.id)}${escapeHtml(tr(tema.nome))} <small>${n}</small></span>`;
  }).join("");
}

function renderTopo() {
  $("help-btn").innerHTML = UI_ICONS.help;
  $("profile-btn").innerHTML = UI_ICONS.user;
  renderThemeBtn();
  renderSoundBtn();
  $("lang-select").value = lang;
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  store("lang", l);
  applyI18n();
  renderTopo();
  renderConta();
  const tela = document.body.dataset.screen;
  if (tela === "home") renderHome();
  if (tela === "setup") renderSetup();
  if (tela === "game") renderGame();
  if (tela === "results") mostrarResultado();
  if (tela === "daily") renderDiario();
  if (tela === "lobby") renderSala();
  if (tela === "profile") abrirPerfil();
}

function abrirAjuda() {
  $("help-body").innerHTML = t("help.html");
  $("help-dialog").showModal();
}

// ───────────── perfil ─────────────

function abrirPerfil() {
  show("profile");
  $("profile-nick").value = store("nick") || "";
  $("profile-duck").innerHTML = patoSvg(minhaCor(), "happy");
  const st = loadStats();
  const tiles = [
    [st.partidas, "stats.games"],
    [st.escapou, "stats.wins"],
    [st.pato, "stats.losses"],
    [st.duvidasCertas + "/" + st.duvidas, "stats.calls"],
    [st.patos, "stats.ducks"],
    [st.dobreis, "stats.doubled"],
    [st.diarios, "stats.daily"],
    [st.melhorDiario, "stats.best"],
  ];
  $("stats").innerHTML = tiles.map(([v, k]) => `<div class="stat"><b>${v}</b><span>${escapeHtml(t(k))}</span></div>`).join("");
  renderConta();
}

// Chamado quando o perfil da conta chega do banco.
function aoMudarPerfil() {
  jogadores = jogadoresSalvos();
  if (jogadores[0] && !jogadores[0].bot && !jogadores[0].nome) {
    jogadores[0].nome = store("nick") || "";
    jogadores[0].cor = minhaCor();
  }
  const tela = document.body.dataset.screen;
  if (tela === "profile") abrirPerfil();
  if (tela === "home") renderHome();
}

function trocarMinhaCor() {
  const cor = (minhaCor() + 1) % PZ_CORES.length;
  store("cor", cor);
  if (jogadores[0] && !jogadores[0].bot) {
    jogadores[0].cor = cor;
    store("jogadores", jogadores);
  }
  $("profile-duck").innerHTML = patoSvg(cor, "happy");
  sfx.tick();
}

function mudarMeuNome(nome) {
  store("nick", nome.trim().slice(0, 16));
  if (jogadores[0] && !jogadores[0].bot) {
    jogadores[0].nome = nome;
    store("jogadores", jogadores);
  }
}

async function mandarSugestao(e) {
  e.preventDefault();
  const msg = $("suggest-msg");
  const q = $("suggest-q").value.trim();
  const a = lerNumero($("suggest-a").value);
  if (q.length < 8 || !Number.isFinite(a)) {
    msg.className = "feedback bad";
    msg.textContent = t("suggest.err");
    return;
  }
  try {
    await enviarSugestao(q.slice(0, 200), a, $("suggest-src").value.trim().slice(0, 200));
    msg.className = "feedback good";
    msg.textContent = t("suggest.ok");
    e.target.reset();
  } catch (err) {
    msg.className = "feedback bad";
    msg.textContent = err.message;
  }
}

// ───────────── botões ─────────────

function ligar() {
  $("home-btn").onclick = () => {
    if (document.body.dataset.screen === "game") return sairDaPartida();
    irInicio();
  };
  $("lang-select").onchange = (e) => setLang(e.target.value);
  $("theme-btn").onclick = toggleTheme;
  $("sound-btn").onclick = toggleSound;
  $("help-btn").onclick = abrirAjuda;
  $("help-link").onclick = abrirAjuda;
  $("profile-btn").onclick = abrirPerfil;
  document.querySelectorAll("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  $("start-btn").onclick = () => {
    jogadores = jogadoresSalvos();
    if (jogadores[0] && !jogadores[0].bot && !jogadores[0].nome && store("nick")) jogadores[0].nome = store("nick");
    show("setup");
    renderSetup();
  };
  $("online-btn").onclick = () => abrirOnline();
  $("player-list").addEventListener("click", setupClick);
  $("player-list").addEventListener("input", setupInput);
  $("add-human").onclick = () => addJogador(false);
  $("add-bot").onclick = () => addJogador(true);
  $("setup-back").onclick = irInicio;
  $("setup-go").onclick = comecarLocal;

  $("game-quit").onclick = sairDaPartida;
  $("again-btn").onclick = jogarDeNovo;
  $("results-home").onclick = () => {
    if (modo === "online" && sala) return voltarParaSala();
    partida = null;
    irInicio();
  };

  $("online-back").onclick = irInicio;
  $("create-room-btn").onclick = (e) => ocupado(e.target, criarSala);
  $("join-form").onsubmit = (e) => {
    e.preventDefault();
    ocupado($("join-room-btn"), () => entrarComCodigo($("join-code").value));
  };
  $("join-code").oninput = (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  $("lobby-start").onclick = (e) => ocupado(e.target, comecarOnline);
  $("leave-room").onclick = sairDaSala;
  $("share-room").onclick = (e) => convidar(e.target);
  $("lobby-players").onclick = (e) => {
    const b = e.target.closest("[data-tirar]");
    if (b) tirarDaSala(b.dataset.tirar);
  };

  $("profile-back").onclick = irInicio;
  $("profile-duck").onclick = trocarMinhaCor;
  $("profile-nick").oninput = (e) => mudarMeuNome(e.target.value);
  $("suggest-form").onsubmit = mandarSugestao;
  document.querySelectorAll(".account-btn").forEach((b) => (b.onclick = () => abrirConta()));
  $("account-form").onsubmit = contaEntrar;
  $("account-forgot").onclick = contaEsqueci;
  $("password-form").onsubmit = contaNovaSenha;
  $("account-logout").onclick = contaSair;
}

function iniciar() {
  applyI18n();
  renderTopo();
  ligar();
  renderConta();
  irInicio();
  if (location.hash === "#como-jogar") abrirAjuda();
  conectarSeJaTemConta();
  retomarOnline();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    addEventListener("load", () => navigator.serviceWorker.register("../sw.js", { scope: "../" }).catch(() => {}));
  }
}

iniciar();
