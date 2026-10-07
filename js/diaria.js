// Lista do dia: a mesma lista de 10 para todo mundo, 3 vidas e resultado para compartilhar.

const DAILY_START = Date.UTC(2026, 9, 1); // 1º de outubro de 2026 = lista #1
const DAILY_LIVES = 3;

function todayNumber(date = new Date()) {
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - DAILY_START) / 864e5) + 1;
}

// Quantas listas de 10 entram no sorteio a partir de cada dia. Assim, listas novas não
// mudam a lista do dia de hoje: ao adicionar listas de 10, acrescente uma linha que vale
// a partir de amanhã (as listas novas precisam vir depois das antigas na ordem dos arquivos).
const DAILY_POOLS = [
  { from: 1, size: 294 },
  { from: 8, size: 490 },
];

function dailyPool(num = todayNumber()) {
  const all = LISTS.filter((l) => l.items.length === 10);
  const rule = DAILY_POOLS.filter((p) => num >= p.from).pop() || DAILY_POOLS[0];
  return all.slice(0, Math.min(rule.size, all.length));
}

// Pula pela lista com um passo primo: não repete até passar por todas.
function dailyList(num) {
  const pool = dailyPool(num);
  const idx = (((num * 7919 + 17) % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

function dailyResults() {
  return store("diaria") || {};
}

function dailyStreaks(today = todayNumber()) {
  const res = dailyResults();
  let current = 0;
  for (let d = res[today] ? today : today - 1; res[d]; d--) current++;
  let best = 0, run = 0;
  Object.keys(res).map(Number).sort((a, b) => a - b).forEach((d, i, arr) => {
    run = i && arr[i - 1] === d - 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { current, best };
}

function dailyResultOf(g) {
  return {
    listId: g.list.id,
    score: g.players[0].score,
    total: teamTally().total,
    found: g.items.map((_, i) => g.found.has(i)),
    hints: g.hints.size,
    lives: g.lives,
    maxLives: g.maxLives,
  };
}

function recordDaily(g) {
  if (!g.dailyCounts) return;
  const all = dailyResults();
  all[g.daily] = dailyResultOf(g);
  store("diaria", all);
  g.dailyCounts = false;
}

function dailyShareText(num, res) {
  const list = dailyList(num);
  const won = res.score > res.total / 2;
  const squares = res.found.map((f) => (f ? "■" : "□")).join("");
  const lives = `vidas ${Math.max(0, res.lives)}/${res.maxLives}`;
  return [
    `Topzi · Lista do dia #${num}`,
    list ? list.title : "",
    squares,
    `${res.score} de ${res.total} pts · ${lives}${res.hints ? ` · ${plural(res.hints, "dica", "dicas")}` : ""}`,
    won ? "Venci a lista!" : "A lista venceu.",
    siteUrl(),
  ].filter(Boolean).join("\n");
}

function startDaily() {
  const num = todayNumber();
  startGame(dailyList(num), { daily: num, counts: !dailyResults()[num] });
}

function renderDailyCard() {
  const num = todayNumber();
  const list = dailyList(num);
  const card = $("daily-card");
  if (!list || num < 1) {
    card.hidden = true;
    return;
  }
  const res = dailyResults()[num];
  const { current } = dailyStreaks(num);
  const cat = categoryOf(list);
  card.hidden = false;
  card.innerHTML = `
    <div class="daily-info">
      <p class="daily-kicker">Lista do dia #${num} · ${icon(cat.id)}${escapeHtml(cat.label)}</p>
      <p class="daily-title">${res ? escapeHtml(list.title) : "Você contra a lista: 10 itens, 3 vidas."}</p>
      <p class="daily-status">${res
        ? `Você fez ${res.score} de ${res.total} pts${res.score > res.total / 2 ? " e venceu a lista" : ""}. Volte amanhã para a #${num + 1}.`
        : "Todo mundo joga a mesma lista hoje. Compare o resultado com os amigos."}${current ? ` Sequência: ${plural(current, "dia", "dias")}.` : ""}</p>
    </div>
    <div class="daily-actions"></div>`;
  const actions = card.querySelector(".daily-actions");
  const btn = (label, cls, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", () => onClick(b));
    actions.appendChild(b);
  };
  if (res) {
    btn("Compartilhar resultado", "btn", (b) => shareText(dailyShareText(num, res), b, "Compartilhar resultado"));
    btn("Jogar de novo (não conta)", "link-btn", startDaily);
  } else {
    btn("Jogar a lista do dia", "btn", startDaily);
  }
}
