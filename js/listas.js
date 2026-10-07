// Listas: oficiais + criadas pelo jogador, tela de escolha, editor e compartilhamento.

const LIST_SIZES = [10, 30, 50];
const MY_CAT = { id: "minhas", label: "Minhas listas" };
let customLists = store("custom") || [];

function allLists() {
  return [...customLists, ...LISTS];
}

function categoryOf(list) {
  return list.cat === MY_CAT.id ? MY_CAT : CATEGORIES.find((c) => c.id === list.cat) || MY_CAT;
}

function saveCustomLists() {
  store("custom", customLists);
}

// Respostas que o grupo aceitou com "Aceitar mesmo assim" ficam valendo nas próximas partidas.
function learnedFor(listId) {
  return (store("aprendidas") || {})[listId] || {};
}

function learnAnswer(listId, index, key) {
  const all = store("aprendidas") || {};
  const list = (all[listId] = all[listId] || {});
  list[index] = [...new Set([...(list[index] || []), key])];
  store("aprendidas", all);
}

// ───────────── escolha da lista ─────────────

let activeCat = "all";
let activeSize = "all";
let lastListIds = store("recent") || [];

// Nos modos Top 10/30/50 o tamanho é fixo; nos outros, o jogador escolhe.
function sizeOk(list) {
  const size = mode().size || activeSize;
  return size === "all" || list.items.length === size;
}

function filteredLists() {
  const q = normalize($("list-search").value);
  return allLists().filter((l) => {
    if (activeCat !== "all" && l.cat !== activeCat) return false;
    if (!sizeOk(l)) return false;
    if (!q) return true;
    return normalize(l.title + " " + categoryOf(l).label).includes(q);
  });
}

function chipButton(label, count, active, onClick, iconHtml = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (active ? " active" : "");
  b.innerHTML = `${iconHtml}${escapeHtml(label)}${count !== null ? ` <small>${count}</small>` : ""}`;
  b.addEventListener("click", onClick);
  return b;
}

function renderChips() {
  const lists = allLists().filter(sizeOk);
  const cats = $("category-chips");
  cats.innerHTML = "";
  const all = [{ id: "all", label: "Todas" }, MY_CAT, ...CATEGORIES];
  all.forEach((cat) => {
    const count = cat.id === "all" ? lists.length : lists.filter((l) => l.cat === cat.id).length;
    if (!count) return;
    cats.appendChild(chipButton(cat.label, count, activeCat === cat.id, () => {
      activeCat = cat.id;
      renderChips();
      renderListGrid();
    }, cat.id === "all" ? "" : icon(cat.id)));
  });

  const sizes = $("size-chips");
  sizes.innerHTML = "";
  sizes.hidden = !!mode().size;
  ["all", ...LIST_SIZES].forEach((size) => {
    const label = size === "all" ? "Qualquer tamanho" : mode().team ? `Top ${size} · ${TEAM_LIVES[size]} vidas` : `Top ${size}`;
    sizes.appendChild(chipButton(label, null, activeSize === size, () => {
      activeSize = size;
      renderChips();
      renderListGrid();
    }));
  });
}

function recordLine(list) {
  const r = recordsFor(list.id);
  const parts = [];
  if (r.individual) parts.push(`Recorde: ${r.individual.score} pts (${escapeHtml(r.individual.name)})`);
  if (r.equipe) parts.push(`Equipe: ${r.equipe.score} pts`);
  return parts.length ? `<span class="list-record">${parts.join(" · ")}</span>` : "";
}

function renderListGrid() {
  const lists = filteredLists();
  $("list-count").textContent = lists.length === 1 ? "1 lista" : `${lists.length} listas`;
  const grid = $("list-grid");
  grid.innerHTML = "";
  if (!lists.length) {
    grid.innerHTML = `<p class="muted">Nenhuma lista encontrada${mode().size ? ` no ${mode().name}` : ""}. Tente outra palavra ou crie a sua.</p>`;
    return;
  }
  lists.forEach((l) => {
    const cat = categoryOf(l);
    const played = lastListIds.includes(l.id);
    const card = document.createElement("div");
    card.className = "list-card" + (played ? " played" : "");
    card.innerHTML = `
      <button type="button" class="list-play">
        <span class="list-cat">${icon(cat.id)}${escapeHtml(cat.label)} · ${l.items.length} itens</span>
        <span class="list-title">${escapeHtml(l.title)}</span>
        ${recordLine(l)}
        ${played ? '<span class="list-played">jogada recentemente</span>' : ""}
      </button>
      ${l.custom ? `<div class="list-tools"><button type="button" data-act="edit">Editar</button><button type="button" data-act="share">Compartilhar</button><button type="button" data-act="delete">Apagar</button></div>` : ""}`;
    card.querySelector(".list-play").addEventListener("click", () => chooseList(l));
    card.querySelectorAll(".list-tools button").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.act === "edit") openEditor(l);
      if (b.dataset.act === "share") shareList(l, b);
      if (b.dataset.act === "delete" && confirm(`Apagar a lista "${l.title}"?`)) {
        customLists = customLists.filter((x) => x.id !== l.id);
        saveCustomLists();
        if (!customLists.length && activeCat === MY_CAT.id) activeCat = "all";
        renderChips();
        renderListGrid();
      }
    }));
    grid.appendChild(card);
  });
}

function openLists() {
  if (activeCat !== "all" && !allLists().some((l) => l.cat === activeCat && sizeOk(l))) activeCat = "all";
  renderModeBars();
  renderChips();
  renderListGrid();
  show("lists");
}

function randomList() {
  const pool = filteredLists();
  const fresh = pool.filter((l) => !lastListIds.includes(l.id));
  chooseList(pick(fresh.length ? fresh : pool.length ? pool : allLists().filter(sizeOk)));
}

// Escolher a lista começa a partida, ou define a lista da sala online.
function chooseList(list) {
  if (pickingForRoom === "suggest") suggestList(list);
  else if (pickingForRoom) pickRoomList(list);
  else startGame(list);
}

// ───────────── criar a própria lista ─────────────

let editing = null;
let editorSize = 10;

function openEditor(list = null) {
  editing = list;
  editorSize = list ? list.items.length : mode().size || (activeSize !== "all" ? activeSize : 10);
  $("editor-title").textContent = list ? "Editar lista" : "Criar lista";
  $("editor-name").value = list ? list.title : "";
  $("editor-error").textContent = "";
  renderEditorRows(list ? list.items : []);
  show("editor");
  $("editor-name").focus();
}

function readEditorRows() {
  return [...$("editor-rows").querySelectorAll(".editor-row")].map((row) => ({
    name: row.querySelector(".editor-item").value.trim(),
    alts: row.querySelector(".editor-alts").value.trim(),
  }));
}

function renderEditorRows(items) {
  // Mantém o que já foi digitado ao trocar o tamanho.
  const current = items.length
    ? items.map((raw) => { const [name, ...alts] = raw.split("|"); return { name, alts: alts.filter((a) => !a.startsWith("~")).join(", ") }; })
    : readEditorRows();
  const sizes = $("editor-sizes");
  sizes.innerHTML = "";
  LIST_SIZES.forEach((n) => {
    sizes.appendChild(chipButton(`${n} itens`, null, n === editorSize, () => {
      const kept = readEditorRows();
      editorSize = n;
      renderEditorRows(kept.map((r) => [r.name, ...r.alts.split(",").map((a) => a.trim()).filter(Boolean)].join("|")));
    }));
  });
  const wrap = $("editor-rows");
  wrap.innerHTML = "";
  for (let i = 0; i < editorSize; i++) {
    const v = current[i] || { name: "", alts: "" };
    const row = document.createElement("div");
    row.className = "editor-row";
    row.innerHTML = `
      <span class="rank">${i + 1}</span>
      <div class="editor-fields">
        <input type="text" class="editor-item" maxlength="80" placeholder="${i === 0 ? "O mais óbvio (vale 1 ponto)" : i === editorSize - 1 ? `O menos óbvio (vale ${editorSize} pontos)` : `Item nº ${i + 1}`}" value="${escapeHtml(v.name)}">
        <input type="text" class="editor-alts" maxlength="160" placeholder="Outras respostas aceitas, separadas por vírgula (opcional)" value="${escapeHtml(v.alts)}">
      </div>`;
    wrap.appendChild(row);
  }
}

function saveEditor() {
  const title = $("editor-name").value.trim();
  const rows = readEditorRows();
  const err = (msg) => { $("editor-error").textContent = msg; };
  if (!title) return err("Dê um nome para a lista.");
  const empty = rows.findIndex((r) => !r.name);
  if (empty >= 0) return err(`Preencha o item nº ${empty + 1}.`);
  const seen = new Map();
  for (let i = 0; i < rows.length; i++) {
    const key = normalize(rows[i].name);
    if (seen.has(key)) return err(`Os itens nº ${seen.get(key) + 1} e nº ${i + 1} são iguais.`);
    seen.set(key, i);
  }
  const items = rows.map((r) => [r.name, ...r.alts.split(",").map((a) => a.trim()).filter(Boolean)].join("|"));
  const list = { id: editing ? editing.id : "minha-" + Date.now(), cat: MY_CAT.id, title, source: "Lista criada por você", items, custom: true };
  customLists = editing ? customLists.map((l) => (l.id === list.id ? list : l)) : [list, ...customLists];
  saveCustomLists();
  fitModeToSize(items.length);
  activeCat = MY_CAT.id;
  activeSize = "all";
  $("list-search").value = "";
  openLists();
}

// Compartilhar: a lista inteira vai codificada no próprio link.
function encodeList(list) {
  const json = JSON.stringify({ t: list.title, i: list.items });
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeList(code) {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (typeof data.t !== "string" || !Array.isArray(data.i) || !LIST_SIZES.includes(data.i.length)) return null;
    if (!data.i.every((x) => typeof x === "string" && x.trim())) return null;
    return { title: data.t.slice(0, 120), items: data.i.map((x) => x.slice(0, 300)) };
  } catch (e) {
    return null;
  }
}

function siteUrl() {
  return location.href.split("#")[0].split("?")[0];
}

function shareList(list, btn) {
  shareText(siteUrl() + "#lista=" + encodeList(list), btn, "Compartilhar");
}

function importFromHash() {
  const m = location.hash.match(/^#lista=([\w-]+)/);
  if (!m) return false;
  history.replaceState(null, "", location.pathname + location.search);
  const data = decodeList(m[1]);
  if (!data) {
    alert("Esse link de lista não é válido.");
    return false;
  }
  if (!confirm(`Adicionar a lista "${data.title}" (${data.items.length} itens) às suas listas?`)) return false;
  customLists = [{ id: "minha-" + Date.now(), cat: MY_CAT.id, title: data.title, source: "Lista compartilhada", items: data.items, custom: true }, ...customLists];
  saveCustomLists();
  fitModeToSize(data.items.length);
  activeCat = MY_CAT.id;
  activeSize = "all";
  openLists();
  return true;
}
