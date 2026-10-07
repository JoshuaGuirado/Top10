// Topzi — liga os botões às telas e inicia o jogo.
// Telas: início → modo → jogadores → lista (ou criar lista) → partida → resultado.

function goHome() {
  if (game && game.online && !game.over) {
    if (!confirm("Sair da partida online? Você sai da sala.")) return;
    leaveRoom();
  } else if (game && !game.over && !confirm("Sair da partida atual?")) return;
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
  $("profile-name").textContent = e.target.value.trim() || "Sem nickname";
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
  if (confirm("Encerrar a partida e ver o resultado?")) endGame("Partida encerrada.");
});

$("rematch-btn").addEventListener("click", () => {
  if (game && game.online) backToRoom();
  else if (game && game.daily) openModes();
  else openLists();
});
$("share-btn").addEventListener("click", (e) => {
  if (game && game.daily) shareText(dailyShareText(game.daily, dailyResultOf(game)), e.currentTarget, "Compartilhar resultado");
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
  if (confirm(isHost() ? "Fechar a sala para todo mundo?" : "Sair da sala?")) leaveRoom();
});
$("room-share").addEventListener("click", (e) => shareRoom(e.currentTarget));
document.querySelectorAll(".account-btn").forEach((b) => b.addEventListener("click", openAccount));
$("account-form").addEventListener("submit", accountSave);
$("account-logout").addEventListener("click", accountLogout);

// Modo claro/escuro: começa seguindo o aparelho; o botão fixa a escolha.
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function renderThemeBtn() {
  $("theme-btn").textContent = currentTheme() === "dark" ? "Modo claro" : "Modo escuro";
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

renderSoundBtn();
renderThemeBtn();
ensurePlayers();
renderDailyCard();
renderProfileButton();
$("list-total").textContent = allLists().length;
if (!importFromHash()) show("home");
initOnline();
