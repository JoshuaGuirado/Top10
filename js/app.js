// Topzi — liga os botões às telas e inicia o jogo.
// Telas: início → modo → jogadores → lista (ou criar lista) → partida → resultado.

function goHome() {
  if (game && game.online && !game.over) {
    if (!confirm(t("confirm.leaveOnline"))) return;
    leaveRoom();
  } else if (game && !game.over && !confirm(t("confirm.leaveGame"))) return;
  stopTurnTimer();
  game = null;
  renderDailyCard();
  show("home");
}

$("home-btn").addEventListener("click", goHome);
$("sound-btn").addEventListener("click", () => {
  soundOn = !soundOn;
  store("sound", soundOn);
  renderSoundBtn();
  sfx.tick();
});
$("start-btn").addEventListener("click", openModes);
$("stats-btn").addEventListener("click", openProfile);
$("profile-btn").addEventListener("click", openProfile);
$("profile-avatar").addEventListener("click", () => openAvatarDialog(0));
$("profile-nick").addEventListener("input", (e) => {
  ensurePlayers();
  players[0].nick = e.target.value;
  savePlayers();
  $("profile-name").textContent = e.target.value.trim() || t("profile.noNick");
});
$("stats-reset").addEventListener("click", resetStats);
$("stats-back").addEventListener("click", goHome);
$("change-mode-btn").addEventListener("click", openModes);
$("to-lists-btn").addEventListener("click", () => {
  if (!playersReady()) return;
  savePlayers();
  openLists();
});
$("list-search").addEventListener("input", renderListGrid);
$("random-list-btn").addEventListener("click", randomList);
$("create-list-btn").addEventListener("click", () => openEditor());
$("editor-cancel").addEventListener("click", openLists);
$("editor-form").addEventListener("submit", (e) => {
  e.preventDefault();
  saveEditor();
});

$("guess-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("guess");
  if (game && game.online && !game.isHost) {
    if (input.value.trim()) sendAction({ type: "guess", text: input.value.trim() });
    input.value = "";
    return;
  }
  handleGuess(input.value);
  if (game && !game.busy) {
    input.value = "";
    focusGuess();
  }
});
$("pass-btn").addEventListener("click", () => (game && game.online && !game.isHost ? sendAction({ type: "pass" }) : passTurn()));
$("hint-btn").addEventListener("click", toggleHintMode);
function pickHint(i) {
  if (game && game.online && !game.isHost) {
    sendAction({ type: "hint", index: i });
    game.hintMode = false;
    renderGame();
  } else {
    useHint(i);
  }
}
$("board").addEventListener("click", (e) => {
  const li = e.target.closest("li.pickable");
  if (li) pickHint(Number(li.dataset.index));
});
$("board").addEventListener("keydown", (e) => {
  const li = e.target.closest("li.pickable");
  if (li && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    pickHint(Number(li.dataset.index));
  }
});
$("end-btn").addEventListener("click", () => {
  if (confirm(t("confirm.end"))) endGame([["fb.ended"]]);
});

$("rematch-btn").addEventListener("click", () => {
  if (game && game.online) backToRoom();
  else if (game && game.daily) openModes();
  else openLists();
});
$("share-btn").addEventListener("click", (e) => {
  if (game && game.daily) shareText(dailyShareText(game.daily, dailyResultOf(game)), e.currentTarget, t("results.share"));
});
$("new-players-btn").addEventListener("click", () => {
  renderPlayersScreen();
  show("players");
});
$("builder-random").addEventListener("click", randomAvatar);
$("builder-save").addEventListener("click", () => {
  players[dialogPlayer].avatar = draft;
  players[dialogPlayer].presetId = null;
  savePlayers();
  $("avatar-dialog").close();
  refreshAfterAvatar();
});

// Modo online e conta.
$("online-btn").addEventListener("click", openOnline);
$("online-avatar").addEventListener("click", () => openAvatarDialog(0));
$("online-nick").addEventListener("input", (e) => {
  ensurePlayers();
  players[0].nick = e.target.value;
  savePlayers();
});
$("create-room-btn").addEventListener("click", createRoom);
$("join-form").addEventListener("submit", (e) => {
  e.preventDefault();
  joinRoom($("join-code").value);
});
$("lobby-start").addEventListener("click", startOnlineGame);
$("lobby-leave").addEventListener("click", () => {
  if (confirm(t(isHost() ? "confirm.closeRoom" : "confirm.leaveRoom"))) leaveRoom();
});
$("room-share").addEventListener("click", (e) => shareRoom(e.currentTarget));
document.querySelectorAll(".account-btn").forEach((b) => b.addEventListener("click", openAccount));
$("account-form").addEventListener("submit", accountSave);
$("account-logout").addEventListener("click", accountLogout);

// Modo claro/escuro: começa seguindo o aparelho; o botão fixa a escolha.
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
const THEME_ICONS = {
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
};
function renderThemeBtn() {
  const dark = currentTheme() === "dark";
  const b = $("theme-btn");
  b.innerHTML = THEME_ICONS[dark ? "sun" : "moon"];
  b.title = t(dark ? "nav.themeLight" : "nav.themeDark");
  b.setAttribute("aria-label", b.title);
}
$("theme-btn").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store("theme", next);
  renderThemeBtn();
});

// Instalar como app e jogar offline (só funciona com o site publicado, não abrindo o arquivo).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

// Idioma: o seletor do topo troca tudo na hora, inclusive a tela aberta.
function renderHeroLead() {
  $("hero-lead").textContent = t("hero.lead", { total: allLists().length });
}
$("lang-select").value = lang;
$("lang-select").addEventListener("change", (e) => setLang(e.target.value));
function onLangChange() {
  $("lang-select").value = lang;
  renderSoundBtn();
  renderThemeBtn();
  renderHeroLead();
  renderDailyCard();
  renderAccount();
  const screen = document.body.dataset.screen;
  if (screen === "modes") renderModes();
  if (screen === "players") renderPlayersScreen();
  if (screen === "lists") openLists();
  if (screen === "editor") {
    retitleEditor();
    renderEditorRows([]);
  }
  if (screen === "profile") openProfile();
  if (screen === "online") renderOnline();
  if (screen === "lobby") renderLobby();
  if (game && (screen === "game" || screen === "results")) {
    setupGameScreen();
    if (screen === "results") renderResults(game.resultsNote || "");
    else {
      renderGame();
      if (game.feedback) paintFeedback(game.feedback.msg, game.feedback.kind);
    }
  }
  if ($("avatar-dialog").open) {
    $("avatar-dialog-title").textContent = t("skin.of", { nome: playerName(players[dialogPlayer], dialogPlayer) });
    renderAvatarDialog();
  }
}

applyStaticTexts();
renderSoundBtn();
renderThemeBtn();
ensurePlayers();
renderDailyCard();
renderProfileButton();
renderHeroLead();
if (!importFromHash()) show("home");
initOnline();
