// Estatísticas e recordes, salvos só neste navegador.

const MODE_LABELS = { top10: "Top 10", top30: "Top 30", top50: "Top 50", equipe: "Equipe contra a lista", times: "Times", diaria: "Lista do dia", online: "Online" };

// Online, cada aparelho guarda só os números do próprio jogador.
function countedPlayers(g) {
  return g.online ? g.players.filter((_, i) => i === g.me) : g.players;
}

function loadStats() {
  return { games: 0, points: 0, hits: 0, misses: 0, byMode: {}, vsGames: 0, vsWins: 0, perfect: 0, best: null, ...(store("stats") || {}) };
}

function allRecords() {
  return store("recordes") || {};
}

function recordsFor(listId) {
  return allRecords()[listId] || {};
}

// Guarda a partida. Devolve { score } quando bateu o recorde da lista.
function recordGame(g, outcome) {
  const played = g.players.some((p) => p.hits.length || p.misses || p.passes);
  if (!played) return null;
  const n = g.items.length;
  const s = loadStats();
  const key = g.daily ? "diaria" : g.online ? "online" : modeId;
  s.games += 1;
  s.byMode[key] = (s.byMode[key] || 0) + 1;
  countedPlayers(g).forEach((p) => {
    s.points += p.score;
    s.hits += p.hits.length;
    s.misses += p.misses;
  });
  if (g.vsList) {
    s.vsGames += 1;
    if (isWin(outcome)) s.vsWins += 1;
  }
  if (g.found.size === n) s.perfect += 1;
  g.found.forEach((who, i) => {
    if (g.online && who !== g.me) return;
    if (!s.best || i + 1 > s.best.pos) s.best = { pos: i + 1, item: g.items[i].name, list: g.list.title, name: g.players[who].name };
  });
  store("stats", s);
  g.saved = { outcome, perfect: g.found.size === n };
  return updateRecord(g);
}

const isWin = (outcome) => outcome === "win" || outcome === "perfect";

// Chute aceito pela turma depois da partida: corrige estatísticas e recorde.
function recordAccepted(g, i, who, outcome) {
  if (!g.saved) return updateRecord(g);
  const s = loadStats();
  s.points += i + 1;
  s.hits += 1;
  s.misses = Math.max(0, s.misses - 1);
  if (g.vsList && isWin(outcome) !== isWin(g.saved.outcome)) s.vsWins += isWin(outcome) ? 1 : -1;
  if (!g.saved.perfect && g.found.size === g.items.length) {
    s.perfect += 1;
    g.saved.perfect = true;
  }
  if (!s.best || i + 1 > s.best.pos) s.best = { pos: i + 1, item: g.items[i].name, list: g.list.title, name: g.players[who].name };
  g.saved.outcome = outcome;
  store("stats", s);
  return updateRecord(g);
}

function updateRecord(g) {
  const n = g.items.length;
  const all = allRecords();
  const r = (all[g.list.id] = all[g.list.id] || {});
  let record = null;
  if (g.vsList) {
    const score = g.players.reduce((sum, p) => sum + p.score, 0);
    if (score > 0 && (!r.equipe || score > r.equipe.score)) {
      r.equipe = { score, name: g.players.map((p) => p.name).join(", "), total: (n * (n + 1)) / 2 };
      record = { score };
    }
  } else {
    const top = countedPlayers(g).reduce((a, b) => (b.score > a.score ? b : a), { score: 0 });
    if (top.score > 0 && (!r.individual || top.score > r.individual.score)) {
      r.individual = { score: top.score, name: top.name, total: (n * (n + 1)) / 2 };
      record = { score: top.score };
    }
  }
  store("recordes", all);
  return record;
}

function statTile(value, label) {
  return `<div class="stat"><b>${value}</b><span>${label}</span></div>`;
}

function renderStats() {
  const s = loadStats();
  const daily = dailyStreaks();
  const rate = s.hits + s.misses ? Math.round((s.hits / (s.hits + s.misses)) * 100) + "%" : "—";
  $("stats-tiles").innerHTML = [
    statTile(s.games, "partidas"),
    statTile(s.points, "pontos somados"),
    statTile(s.hits, "acertos"),
    statTile(rate, "dos chutes certos"),
    statTile(s.vsGames ? `${s.vsWins}/${s.vsGames}` : "—", "vitórias contra a lista"),
    statTile(s.perfect, s.perfect === 1 ? "lista gabaritada" : "listas gabaritadas"),
    statTile(daily.current, "dias seguidos na lista do dia"),
    statTile(daily.best, "maior sequência"),
  ].join("");

  $("stats-best").innerHTML = s.best
    ? `Maior acerto: <b>nº ${s.best.pos}</b>, ${escapeHtml(s.best.item)} (${escapeHtml(s.best.list)}), por ${escapeHtml(s.best.name)}.`
    : "Jogue uma partida para começar suas estatísticas.";

  const modes = Object.entries(s.byMode).sort((a, b) => b[1] - a[1]);
  $("stats-modes").innerHTML = modes.length
    ? modes.map(([k, v]) => `<span class="chip static">${MODE_LABELS[k] || k} <small>${v}</small></span>`).join("")
    : '<p class="muted small">Nenhuma partida ainda.</p>';

  const lists = new Map(allLists().map((l) => [l.id, l]));
  const rows = [];
  Object.entries(allRecords()).forEach(([id, r]) => {
    const list = lists.get(id);
    if (!list) return;
    if (r.individual) rows.push({ list, kind: "Individual", ...r.individual });
    if (r.equipe) rows.push({ list, kind: "Equipe", ...r.equipe });
  });
  rows.sort((a, b) => b.score / b.total - a.score / a.total || b.score - a.score);
  $("stats-records").innerHTML = rows.length
    ? rows.slice(0, 20).map((r) => `
      <div class="record-row">
        <span class="record-pts">${r.score}<small>/${r.total}</small></span>
        <div><b>${escapeHtml(r.list.title)}</b><p class="muted small">${r.kind} · ${escapeHtml(r.name)}</p></div>
      </div>`).join("")
    : '<p class="muted small">Ainda não há recordes.</p>';
}

function openStats() {
  renderStats();
  renderAccount();
  renderOnlineHistory();
  show("stats");
}

function resetStats() {
  if (!confirm("Apagar estatísticas e recordes deste navegador?")) return;
  store("stats", null);
  store("recordes", null);
  renderStats();
}
