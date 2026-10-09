// Ideias para chutar: um bloquinho na tela da partida para anotar os palpites que vêm à cabeça (e não esquecer
// até a sua vez). Cada jogador tem o seu: no mesmo celular aparece o de quem está na vez; online, o seu.
// Fica só neste aparelho e só nesta partida (não vai para os outros jogadores).

const IDEAS_MAX = 30;
let ideas = {}; // dono → lista de textos

function resetIdeas() {
  ideas = {};
}

function ideasOwner() {
  if (!game) return null;
  return game.online ? "me" : game.turn;
}

function renderIdeas() {
  const box = $("ideas");
  if (!game || game.over) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const lista = ideas[ideasOwner()] || [];
  const local = !game.online && game.players.length > 1;
  $("ideas-title").textContent = local ? t("ideas.of", { name: game.players[game.turn].name }) : t("ideas.title");
  $("ideas-count").textContent = lista.length ? String(lista.length) : "";
  $("ideas-list").innerHTML = lista.length
    ? lista.map((txt, i) => `<span class="idea"><button type="button" data-use="${i}">${escapeHtml(txt)}</button><button type="button" class="idea-x" data-del="${i}" aria-label="${escapeHtml(t("ideas.remove"))}">×</button></span>`).join("")
    : `<p class="muted small">${escapeHtml(t("ideas.empty"))}</p>`;
}

function addIdea(raw) {
  const txt = raw.trim().slice(0, 40);
  if (!txt || !game) return;
  const dono = ideasOwner();
  const lista = ideas[dono] || (ideas[dono] = []);
  if (lista.some((x) => normalize(x) === normalize(txt))) return;
  lista.push(txt);
  if (lista.length > IDEAS_MAX) lista.shift();
  renderIdeas();
}

$("ideas-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addIdea($("ideas-input").value);
  $("ideas-input").value = "";
  $("ideas-input").focus();
});

// Tocar numa ideia leva ela para o campo do palpite (e tira do bloquinho); o × só apaga.
$("ideas-list").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !game) return;
  const usar = b.dataset.use !== undefined;
  if (usar && $("guess").disabled) return; // fora da sua vez: a ideia fica guardada
  const lista = ideas[ideasOwner()] || [];
  const i = Number(b.dataset.use ?? b.dataset.del);
  if (!(i >= 0 && i < lista.length)) return;
  const [txt] = lista.splice(i, 1);
  if (usar) {
    $("guess").value = txt;
    $("guess").focus({ preventScroll: true });
  }
  renderIdeas();
});

$("ideas").addEventListener("toggle", (e) => store("ideasOpen", e.target.open));
$("ideas").open = !!store("ideasOpen");
