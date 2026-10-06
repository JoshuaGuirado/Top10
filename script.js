const MAX_LIVES = 3;

const $ = (id) => document.getElementById(id);
const menu = $("menu");
const game = $("game");
const board = $("board");
const guessInput = $("guess");
const feedback = $("feedback");

let state = null;

// Ignora maiúsculas, acentos, pontuação e espaços extras ao comparar palpites.
function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderMenu() {
  const picker = $("list-picker");
  picker.innerHTML = "";
  LISTS.forEach((list) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = list.title;
    btn.addEventListener("click", () => startGame(list));
    li.appendChild(btn);
    picker.appendChild(li);
  });
}

function startGame(list) {
  state = {
    list,
    found: new Set(),
    wrong: [],
    lives: MAX_LIVES,
    over: false,
    keys: list.items.map((item) =>
      new Set([item.name, ...item.aliases].map(normalize))
    ),
  };
  $("game-title").textContent = list.title;
  $("source").textContent = `Fonte: ${list.source}`;
  feedback.textContent = "";
  feedback.className = "";
  menu.hidden = true;
  game.hidden = false;
  render();
  guessInput.focus();
}

function render() {
  board.innerHTML = "";
  state.list.items.forEach((item, i) => {
    const li = document.createElement("li");
    if (state.found.has(i)) {
      li.textContent = item.name;
      li.className = "found";
    } else if (state.over) {
      li.textContent = item.name;
      li.className = "missed";
    } else {
      li.textContent = "?";
    }
    board.appendChild(li);
  });

  $("score").textContent = `${state.found.size}/10`;
  $("lives").textContent =
    "♥".repeat(state.lives) + "♡".repeat(MAX_LIVES - state.lives);
  $("wrong-guesses").textContent = state.wrong.length
    ? `Erros: ${state.wrong.join(", ")}`
    : "";

  guessInput.disabled = state.over;
  $("guess-form").querySelector("button").disabled = state.over;
  $("give-up").hidden = state.over;
}

function setFeedback(text, kind) {
  feedback.textContent = text;
  feedback.className = kind;
}

function handleGuess(raw) {
  const guess = normalize(raw);
  if (!guess || state.over) return;

  const index = state.keys.findIndex((keys) => keys.has(guess));

  if (index === -1) {
    if (state.wrong.some((w) => normalize(w) === guess)) {
      setFeedback(`Você já tentou "${raw}".`, "info");
      return;
    }
    state.wrong.push(raw.trim());
    state.lives -= 1;
    setFeedback(`"${raw}" não está na lista.`, "bad");
  } else if (state.found.has(index)) {
    setFeedback(`${state.list.items[index].name} já foi encontrado.`, "info");
    return;
  } else {
    state.found.add(index);
    setFeedback(`Boa! ${state.list.items[index].name} é o nº ${index + 1}.`, "good");
  }

  if (state.found.size === state.list.items.length) {
    state.over = true;
    setFeedback("Você acertou todos os 10! 🎉", "good");
  } else if (state.lives === 0) {
    state.over = true;
    setFeedback(`Fim de jogo! Você acertou ${state.found.size} de 10.`, "bad");
  }
  render();
}

$("guess-form").addEventListener("submit", (e) => {
  e.preventDefault();
  handleGuess(guessInput.value);
  guessInput.value = "";
  guessInput.focus();
});

$("give-up").addEventListener("click", () => {
  state.over = true;
  setFeedback(`Você acertou ${state.found.size} de 10. Veja a lista completa:`, "info");
  render();
});

$("back").addEventListener("click", () => {
  game.hidden = true;
  menu.hidden = false;
});

renderMenu();
