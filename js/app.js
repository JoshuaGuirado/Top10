// Top Ten — liga os botões às telas e inicia o jogo.
// Telas: início → modo → jogadores → lista (ou criar lista) → partida → resultado.

function goHome() {
  if (game && !game.over && !confirm("Sair da partida atual?")) return;
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
$("stats-btn").addEventListener("click", openStats);
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
  handleGuess(input.value);
  if (game && !game.busy) {
    input.value = "";
    focusGuess();
  }
});
$("pass-btn").addEventListener("click", passTurn);
$("hint-btn").addEventListener("click", toggleHintMode);
$("board").addEventListener("click", (e) => {
  const li = e.target.closest("li.pickable");
  if (li) useHint(Number(li.dataset.index));
});
$("board").addEventListener("keydown", (e) => {
  const li = e.target.closest("li.pickable");
  if (li && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    useHint(Number(li.dataset.index));
  }
});
$("end-btn").addEventListener("click", () => {
  if (confirm("Encerrar a partida e ver o resultado?")) endGame("Partida encerrada.");
});

$("rematch-btn").addEventListener("click", () => (game && game.daily ? openModes() : openLists()));
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
  renderPlayersScreen();
});

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
$("list-total").textContent = allLists().length;
if (!importFromHash()) show("home");
