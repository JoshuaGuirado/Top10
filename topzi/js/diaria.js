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
  { from: 9, size: 547 }, // listas populares e Bíblia (data/listas-populares.js)
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
    ms: (g.endedAt || Date.now()) - g.startedAt, // tempo da partida (desempate no ranking)
  };
}

function recordDaily(g) {
  if (!g.dailyCounts) return;
  const all = dailyResults();
  all[g.daily] = dailyResultOf(g);
  store("diaria", all);
  g.dailyCounts = false;
  // Só a lista de hoje entra no ranking (as dos dias que passaram dá para jogar, mas não contam).
  if (g.daily === todayNumber() && typeof sendDailyScore === "function") {
    g.rankSent = sendDailyScore(g.daily, all[g.daily]).catch(() => {});
  }
}

function dailyShareText(num, res) {
  const list = dailyList(num);
  const won = res.score > res.total / 2;
  const squares = res.found.map((f) => (f ? "■" : "□")).join("");
  const lives = t("daily.livesShare", { a: Math.max(0, res.lives), b: res.maxLives });
  return [
    `Topzi · ${t("daily.tag", { n: num })}`,
    list ? listTitle(list) : "",
    squares,
    `${t("daily.ptsOf", { a: res.score, b: res.total })} · ${lives}${res.hints ? ` · ${t("rs.hints", { n: res.hints })}` : ""}`,
    won ? t("daily.iWon") : t("rs.lose.all"),
    siteUrl(),
  ].filter(Boolean).join("\n");
}

function startDaily(num = todayNumber()) {
  if (num < 1 || num > todayNumber() || !dailyList(num)) return;
  startGame(dailyList(num), { daily: num, counts: !dailyResults()[num] });
}

// Semana de domingo a sábado, como no Contexto: os dias jogados ficam marcados e os que já passaram dá
// para jogar tocando no dia.
function weekHtml(today = new Date()) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const hoje = todayNumber(today);
  const res = dailyResults();
  const dias = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + i));
  return `<div class="week">${dias.map((d) => {
    const n = todayNumber(d);
    const cls = ["day", res[n] ? "done" : "", n === hoje ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > hoje || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("daily.tag", { n }))}">
      <small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small><b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

// Cartão da lista do dia no início: data, Jogar (ou Compartilhar) e a semana.
function renderDailyCard() {
  const num = todayNumber();
  const card = $("daily-card");
  if (num < 1 || !dailyList(num)) {
    card.hidden = true;
    return;
  }
  const res = dailyResults()[num];
  const { current } = dailyStreaks(num);
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  card.hidden = false;
  card.innerHTML = `
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(t("daily.title"))}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString(loc))}</span>
      <button type="button" class="btn" id="daily-btn">${escapeHtml(t(res ? "results.share" : "btn.play"))}</button>
    </div>
    ${weekHtml()}
    ${res ? `<p class="daily-status">${escapeHtml(t("daily.ptsOf", { a: res.score, b: res.total }))}${current > 1 ? ` · ${escapeHtml(t("daily.streak", { n: current }))}` : ""}</p>` : ""}`;
  if (res && typeof dailyPositionLine === "function") {
    dailyPositionLine(num).then((pos) => {
      const st = card.querySelector(".daily-status");
      if (pos && st && !st.dataset.pos) {
        st.dataset.pos = "1";
        st.textContent += ` · ${t("rank.short", { pos: pos.posicao, total: pos.total })}`;
      }
    });
  }
  $("daily-btn").onclick = (e) => (res ? shareText(dailyShareText(num, res), e.currentTarget, t("results.share")) : startDaily(num));
  card.querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => startDaily(Number(b.dataset.dia))));
}
