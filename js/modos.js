// Modos de jogo: Top 10, Top 30, Top 50 (disputa), Equipe contra a lista e Times.

// Vidas no modo "Equipe contra a lista": cada chute errado custa uma.
const TEAM_LIVES = { 10: 3, 30: 6, 50: 10 };

const TEAM_ICON = '<svg class="mode-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20c.5-3.4 2.7-5.5 5.5-5.5s5 2.1 5.5 5.5M13.2 15.3c.8-.5 1.8-.8 2.8-.8 2.8 0 5 2.1 5.5 5.5"/></svg>';
const TIMES_ICON = '<svg class="mode-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><path d="M1.5 17c.4-2.8 2.1-4.5 4.5-4.5s4.1 1.7 4.5 4.5M13.5 17c.4-2.8 2.1-4.5 4.5-4.5s4.1 1.7 4.5 4.5M12 4v16"/></svg>';

// Nomes e descrições vêm do idioma atual (getters).
const MODES = {
  top10: { size: 10, badge: "10", name: "Top 10", get desc() { return t("mode.top10.desc"); }, get who() { return t("mode.duel.who"); } },
  top30: { size: 30, badge: "30", name: "Top 30", get desc() { return t("mode.top30.desc"); }, get who() { return t("mode.duel.who"); } },
  top50: { size: 50, badge: "50", name: "Top 50", get desc() { return t("mode.top50.desc"); }, get who() { return t("mode.duel.who"); } },
  equipe: { team: true, badge: TEAM_ICON, get name() { return t("mode.equipe.name"); }, get desc() { return t("mode.equipe.desc"); }, get who() { return t("mode.equipe.who"); } },
  times: { teams: true, min: 2, badge: TIMES_ICON, get name() { return t("mode.times.name"); }, get desc() { return t("mode.times.desc"); }, get who() { return t("mode.times.who"); } },
};

let modeId = MODES[store("mode")] ? store("mode") : "top10";
const mode = () => MODES[modeId];

function setMode(id) {
  modeId = id;
  store("mode", id);
}

// Modo de disputa que combina com o tamanho da lista (equipe e times aceitam qualquer um).
function fitModeToSize(size) {
  if (mode().size && mode().size !== size) setMode("top" + size);
}

function modeIcon(m) {
  return m.team ? TEAM_ICON : m.teams ? TIMES_ICON : "";
}

function renderModes() {
  const grid = $("mode-grid");
  grid.innerHTML = "";
  Object.entries(MODES).forEach(([id, m]) => {
    const count = allLists().filter((l) => !m.size || l.items.length === m.size).length;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mode-card" + (m.team ? " team" : "") + (m.teams ? " teams" : "") + (id === modeId ? " active" : "");
    b.innerHTML = `
      <span class="mode-badge">${m.badge}</span>
      <span class="mode-name">${m.name}</span>
      <span class="mode-desc">${m.desc}</span>
      <span class="mode-meta">${m.who} · ${t("mode.lists", { n: count })}</span>`;
    b.addEventListener("click", () => {
      setMode(id);
      activeCat = "all";
      activeSize = "all";
      $("list-search").value = "";
      renderPlayersScreen();
      show("players");
    });
    grid.appendChild(b);
  });
}

function openModes() {
  renderModes();
  show("modes");
}

function renderModeBars() {
  document.querySelectorAll(".mode-bar").forEach((bar) => {
    const extra = pickingForRoom === "suggest" ? ` · ${t("mode.suggestTag")}` : pickingForRoom ? ` · ${t("mode.pickTag")}` : "";
    bar.innerHTML = `<span class="mode-pill">${modeIcon(mode())}${mode().name}${extra}</span>`;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "link-btn";
    b.textContent = pickingForRoom ? t("mode.backRoom") : t("mode.change");
    b.addEventListener("click", pickingForRoom ? showLobby : openModes);
    bar.appendChild(b);
  });
}
