// Desafio do dia: a mesma lista para todo mundo, com vidas e resultado para compartilhar. São três, cada um com a
// própria numeração, resultados e ranking: a Lista do dia (Top 10, desde 1º/10/2026), o Top 30 do dia e o Top 50 do
// dia (os dois desde 14/11/2026). O tamanho é o "size" das funções abaixo (10 quando não vem).

const DAILY_START = Date.UTC(2026, 9, 1); // 1º de outubro de 2026 = lista #1
const DAILY_LIVES = 3;
const DAILY_SIZES = [10, 30, 50];
const DAILY_STARTS = { 10: DAILY_START, 30: Date.UTC(2026, 10, 14), 50: Date.UTC(2026, 10, 14) }; // 14/11/2026 = #1 do Top 30 e do Top 50

function todayNumber(date = new Date(), size = 10) {
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - DAILY_STARTS[size]) / 864e5) + 1;
}

// Quantas listas de 10 entram no sorteio a partir de cada dia. Assim, listas novas não
// mudam a lista do dia de hoje: ao adicionar listas de 10, acrescente uma linha que vale
// a partir de amanhã (as listas novas precisam vir depois das antigas na ordem dos arquivos).
const DAILY_POOLS = [
  { from: 1, size: 294 },
  { from: 8, size: 490 },
  { from: 9, size: 547 }, // listas populares e Bíblia (data/listas-populares.js)
  { from: 10, size: 647 }, // 100 listas novas de 10 (data/listas-n7.js e listas-n8.js)
  { from: 43, size: 694 }, // 47 listas novas de 10 (data/listas-n14.js, 15 delas de inglês), a partir de 12/11/2026
  { from: 45, size: 712 }, // 18 listas novas de 10 de inglês (data/listas-n15.js), a partir de 14/11/2026
];

// O mesmo para o Top 30 e o Top 50 do dia (o dia aqui é o número deles, que começa em 14/11/2026). Listas novas de
// 30 ou 50: acrescente uma linha valendo a partir de amanhã, senão o desafio de hoje muda.
const DAILY_POOLS_BIG = {
  30: [{ from: 1, size: 308 }],
  50: [{ from: 1, size: 155 }],
};

function dailyPool(num = todayNumber(), size = 10) {
  const all = LISTS.filter((l) => l.items.length === size);
  const pools = size === 10 ? DAILY_POOLS : DAILY_POOLS_BIG[size];
  const rule = pools.filter((p) => num >= p.from).pop() || pools[0];
  return all.slice(0, Math.min(rule.size, all.length));
}

// Pula pela lista com um passo primo: não repete até passar por todas (o 30 e o 50 com outro ponto de partida).
function dailyList(num, size = 10) {
  const pool = dailyPool(num, size);
  const shift = { 10: 17, 30: 101, 50: 211 }[size];
  const idx = (((num * 7919 + shift) % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

function dailyKey(size = 10) {
  return size === 10 ? "diaria" : "diaria" + size;
}

function dailyResults(size = 10) {
  return store(dailyKey(size)) || {};
}

// Nome curto do desafio ("Lista do dia #44", "Top 30 do dia #1").
function dailyTag(num, size = 10) {
  return size === 10 ? t("daily.tag", { n: num }) : t("daily.tagBig", { tam: size, n: num });
}

function dailyStreaks(today = todayNumber(), size = 10) {
  const res = dailyResults(size);
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
  const size = g.dailySize || 10;
  const all = dailyResults(size);
  all[g.daily] = dailyResultOf(g);
  store(dailyKey(size), all);
  g.dailyCounts = false;
  // Só a lista de hoje entra no ranking (as dos dias que passaram dá para jogar, mas não contam).
  if (g.daily === todayNumber(new Date(), size) && typeof sendDailyScore === "function") {
    g.rankSent = sendDailyScore(g.daily, all[g.daily], size).catch(() => {});
  }
}

function dailyShareText(num, res, size = 10) {
  const list = dailyList(num, size);
  const won = res.score > res.total / 2;
  // No Top 50, uma linha de quadradinhos para cada 10 itens (no Top 30 também), para caber na mensagem.
  const squares = res.found.map((f, i) => (f ? "■" : "□") + (size > 10 && i % 10 === 9 && i < res.found.length - 1 ? "\n" : "")).join("");
  const lives = t("daily.livesShare", { a: Math.max(0, res.lives), b: res.maxLives });
  return [
    `Topzi · ${dailyTag(num, size)}`,
    list ? listTitle(list) : "",
    squares,
    `${t("daily.ptsOf", { a: res.score, b: res.total })} · ${lives}${res.hints ? ` · ${t("rs.hints", { n: res.hints })}` : ""}`,
    won ? t("daily.iWon") : t("rs.lose.all"),
    siteUrl(),
  ].filter(Boolean).join("\n");
}

function startDaily(num, size = 10) {
  const hoje = todayNumber(new Date(), size);
  if (num === undefined) num = hoje;
  if (num < 1 || num > hoje || !dailyList(num, size)) return;
  const comecar = () => startGame(dailyList(num, size), { daily: num, dailySize: size, counts: !dailyResults(size)[num] });
  // A lista de hoje vai para o ranking: sem nome, pede o nome antes (../gamezi-ranking.js).
  if (num !== hoje || dailyResults(size)[num] || typeof gameziNomeAntesDoDia !== "function") return comecar();
  ensurePlayers();
  gameziNomeAntesDoDia({ nick: players[0].nick, lang, guardarNick: (n) => { players[0].nick = n; savePlayers(); }, comecar });
}

// Semana de domingo a sábado, como no Contexto: os dias jogados ficam marcados e os que já passaram dá
// para jogar tocando no dia. semanasAtras: 0 é a semana de hoje, 1 a anterior… (sem o nome do dia, só o número).
function weekHtml(today = new Date(), semanasAtras = 0, size = 10) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const hoje = todayNumber(today, size);
  const res = dailyResults(size);
  const domingo = today.getDate() - today.getDay() - 7 * semanasAtras;
  const dias = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), domingo + i));
  return `<div class="week${semanasAtras ? " past" : ""}">${dias.map((d) => {
    const n = todayNumber(d, size);
    const cls = ["day", res[n] ? "done" : "", n === hoje ? "today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-dia="${n}" ${n > hoje || n < 1 ? "disabled" : ""} aria-label="${escapeHtml(dailyTag(n, size))} · ${escapeHtml(d.toLocaleDateString(loc))}">
      ${semanasAtras ? "" : `<small>${escapeHtml(d.toLocaleDateString(loc, { weekday: "short" }))}</small>`}<b>${d.getDate()}</b></button>`;
  }).join("")}</div>`;
}

// Todas as semanas antes desta, até a da lista #1, da mais nova para a mais velha, com o mês quando ele muda.
let dailyAllOpen = false;
function pastWeeksHtml(today = new Date(), size = 10) {
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  let html = "";
  let mesAnterior = `${today.getFullYear()}-${today.getMonth()}`;
  for (let k = 1; ; k++) {
    const sabado = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7 * k + 6);
    if (todayNumber(sabado, size) < 1) break;
    const mes = `${sabado.getFullYear()}-${sabado.getMonth()}`;
    if (mes !== mesAnterior) html += `<p class="week-month">${escapeHtml(sabado.toLocaleDateString(loc, { month: "long", year: "numeric" }))}</p>`;
    mesAnterior = mes;
    html += weekHtml(today, k, size);
  }
  return html;
}

function hasPastWeeks(today = new Date(), size = 10) {
  return todayNumber(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 1), size) >= 1;
}

// Cartão do desafio do dia no início: abas Top 10 / Top 30 / Top 50, data, Jogar (ou Compartilhar) e a semana.
let dailySizeTab = DAILY_SIZES.includes(store("diariaTam")) ? store("diariaTam") : 10;
function renderDailyCard() {
  const size = dailySizeTab;
  const num = todayNumber(new Date(), size);
  const card = $("daily-card");
  if (todayNumber() < 1 || !dailyList(todayNumber())) {
    card.hidden = true;
    return;
  }
  const res = num >= 1 ? dailyResults(size)[num] : null;
  const { current } = dailyStreaks(num, size);
  const loc = { pt: "pt-BR", en: "en", es: "es" }[lang];
  const nome = size === 10 ? t("daily.title") : t("daily.titleBig", { tam: size });
  card.hidden = false;
  card.innerHTML = `
    <div class="daily-tabs" role="tablist">${DAILY_SIZES.map((n) => `<button type="button" role="tab" class="daily-tab" data-tam="${n}" aria-selected="${n === size}">Top ${n}</button>`).join("")}</div>
    <div class="daily-top">
      <b class="daily-name">${escapeHtml(nome)}</b>
      <span class="daily-date">${escapeHtml(new Date().toLocaleDateString(loc))}</span>
      <button type="button" class="btn ${res ? "ghost" : ""}" id="daily-btn">${escapeHtml(t(res ? "btn.share" : "btn.play"))}</button>
    </div>
    ${weekHtml(new Date(), 0, size)}
    ${hasPastWeeks(new Date(), size) ? `${dailyAllOpen ? `<div class="weeks-past">${pastWeeksHtml(new Date(), size)}</div>` : ""}
      <button type="button" class="link-btn week-more" id="daily-all" aria-expanded="${dailyAllOpen}">${escapeHtml(t(dailyAllOpen ? "daily.less" : "daily.all"))}</button>` : ""}
    ${res ? `<p class="daily-status">${escapeHtml(t("daily.ptsOf", { a: res.score, b: res.total }))}${current > 1 ? ` · ${escapeHtml(t("daily.streak", { n: current }))}` : ""}</p>` : ""}`;
  if (res && typeof dailyPositionLine === "function") {
    dailyPositionLine(num, size).then((pos) => {
      const st = card.querySelector(".daily-status");
      if (pos && st && !st.dataset.pos && dailySizeTab === size) {
        st.dataset.pos = "1";
        st.textContent += ` · ${t("rank.short", { pos: pos.posicao, total: pos.total })}`;
      }
    });
  }
  $("daily-btn").onclick = (e) => (res ? shareText(gameziTextoDoDia(dailyShareText(num, res, size)), e.currentTarget, t("btn.share")) : startDaily(num, size));
  card.querySelectorAll("[data-dia]").forEach((b) => (b.onclick = () => startDaily(Number(b.dataset.dia), size)));
  card.querySelectorAll("[data-tam]").forEach((b) => (b.onclick = () => {
    dailySizeTab = Number(b.dataset.tam);
    store("diariaTam", dailySizeTab);
    dailyAllOpen = false;
    renderDailyCard();
  }));
  if ($("daily-all")) {
    $("daily-all").onclick = () => {
      dailyAllOpen = !dailyAllOpen;
      renderDailyCard();
    };
  }
}
