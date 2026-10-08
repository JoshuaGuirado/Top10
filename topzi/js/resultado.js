// Resultado: suspense ("E o vencedor é…"), pódio animado, prêmios, destaques da partida
// e, no fim, a turma pode aceitar um chute que estava certo.

// As frases ficam em js/textos.js (ph.* para disputa, tph.* para equipe e times).
// {nome} vira o nome do jogador. Frases neutras: servem para qualquer pessoa.

// Selo de colocação (1º, 2º, 3º…) desenhado com as cores da marca.
function medal(place) {
  return `<span class="medal m${Math.min(place, 4)}">${place}º</span>`;
}

// A mesma frase até sair da tela, mesmo se o resultado for redesenhado (ou o idioma mudar:
// guarda a posição da frase, não o texto).
function phraseFor(p, key) {
  const cache = (game.phrases = game.phrases || {});
  const id = `${p.idx}:${key}`;
  const list = tList(key);
  if (cache[id] === undefined) cache[id] = Math.floor(Math.random() * list.length);
  return fill(list[cache[id] % list.length], { nome: p.name });
}

function rankPlayers() {
  const ranked = game.players
    .map((p, i) => ({ ...p, idx: i }))
    .sort((a, b) => b.score - a.score || b.hits.length - a.hits.length || a.misses - b.misses);
  let place = 0, prev = null;
  ranked.forEach((p, k) => {
    if (prev === null || p.score !== prev) place = k + 1;
    p.place = place;
    prev = p.score;
  });
  return ranked;
}

function vsOutcome() {
  const tally = teamTally();
  if (game.found.size === game.items.length) return "perfect";
  return tally.team > tally.list ? "win" : tally.team < tally.list ? "lose" : "tie";
}

// Prêmios divertidos (no máximo 3 por jogador).
function awardsFor(p, ranked, n, extra = []) {
  const out = [...extra];
  const others = ranked.filter((q) => q.idx !== p.idx);
  if (p.hits.includes(n)) out.push(t("aw.last", { n }));
  if (p.bestStreak >= 3) out.push(t("fx.streak", { n: p.bestStreak }));
  if (p.clutch) out.push(t("aw.clutch"));
  if (p.hits.length >= 3 && !p.misses) out.push(t("aw.noMiss"));
  if (p.misses >= 2 && others.length && others.every((q) => q.misses < p.misses)) out.push(t("aw.guesser"));
  if (p.timeouts) out.push(t("aw.slept", { n: p.timeouts }));
  if (p.passes >= 2) out.push(t("aw.passed", { n: p.passes }));
  if (p.hits.length >= 2 && p.hits.every((h) => h <= Math.ceil(n * 0.3))) out.push(t("aw.obvious"));
  return out.slice(0, 3);
}

function avatarStack(group, cls = "vs-team") {
  return `<div class="${cls}">${group.slice(0, 4).map((p) => `<div class="podium-avatar">${renderAvatar(p.avatar)}</div>`).join("")}${group.length > 4 ? `<span class="vs-more">+${group.length - 4}</span>` : ""}</div>`;
}

function names(group) {
  const list = group.map((p) => escapeHtml(p.name));
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} ${t("and")} ${list[list.length - 1]}` : list[0];
}

// ───────────── visões por modo ─────────────
// Cada uma devolve o título, o pódio e a cena da revelação.

function duelView(ranked, n) {
  const solo = ranked.length === 1;
  const lastPlace = ranked[ranked.length - 1].place;
  const winners = ranked.filter((p) => p.place === 1);

  ranked.forEach((p) => {
    const tiedTop = p.place === 1 && winners.length > 1;
    if (solo) {
      const ratio = p.score / ((n * (n + 1)) / 2);
      const key = ratio === 1 ? "perfect" : ratio >= 0.8 ? "great" : ratio >= 0.55 ? "good" : ratio >= 0.3 ? "ok" : p.score ? "low" : "zero";
      p.phrase = phraseFor(p, "ph.solo." + key);
    } else if (p.score === 0) p.phrase = phraseFor(p, "ph.zero");
    else if (tiedTop) p.phrase = phraseFor(p, "ph.tie");
    else if (p.place <= 3) p.phrase = phraseFor(p, "ph." + p.place);
    else if (p.place === lastPlace && ranked.length >= 4) p.phrase = phraseFor(p, "ph.last");
    else p.phrase = phraseFor(p, "ph.rest");
    p.badges = awardsFor(p, ranked, n, !solo && p.place === 1 && p.score > 0 ? [t("aw.won")] : []);
  });

  const podium = (solo ? [1] : [2, 1, 3]).map((pl) => {
    const group = ranked.filter((p) => p.place === pl);
    if (!group.length) return "";
    return `
      <div class="podium-col place-${pl}">
        <div class="podium-people">${group.map((p) => `
          <div class="podium-person">
            ${pl === 1 && p.score > 0 ? `<span class="crown">${uiIcon("crown", "crown-ico")}</span>` : ""}
            <div class="podium-avatar">${renderAvatar(p.avatar)}</div>
            <b>${escapeHtml(p.name)}</b><span><span data-count="${p.score}">${p.score}</span> pts</span>
          </div>`).join("")}</div>
        <div class="podium-block"><span>${solo ? `<span data-count="${group[0].score}">${group[0].score}</span>` : medal(pl)}</span></div>
      </div>`;
  }).join("");

  const top = winners[0];
  let reveal;
  if (solo) {
    const ratio = top.score / ((n * (n + 1)) / 2);
    reveal = {
      kicker: t("rv.finalScore"),
      html: `${avatarStack([top], "reveal-avatars")}<h2 class="reveal-title">${t("rv.points", { n: `<span data-count="${top.score}">${top.score}</span>` })}</h2><p class="reveal-sub">${escapeHtml(top.phrase)}</p>`,
      mood: ratio >= 0.55 ? "win" : "tie",
    };
  } else if (winners.length > 1) {
    reveal = { kicker: t("rv.winnerIs"), html: `${avatarStack(winners, "reveal-avatars")}<h2 class="reveal-title">${t("rv.tie")}</h2><p class="reveal-sub">${t("rv.tieEach", { nomes: names(winners), n: top.score })}</p>`, mood: "tie" };
  } else {
    reveal = { kicker: t("rv.winnerIs"), html: `<span class="reveal-crown">${uiIcon("crown", "crown-ico")}</span>${avatarStack([top], "reveal-avatars")}<h2 class="reveal-title">${escapeHtml(top.name)}!</h2><p class="reveal-sub">${t("rv.wonWith", { n: top.score })}</p>`, mood: "win" };
  }

  return {
    title: solo ? t("rv.points", { n: top.score }) : winners.length > 1 ? t("rs.tieTop") : t("rs.won", { nome: top.name }),
    podiumClass: "podium",
    podium,
    reveal,
    won: solo ? top.score > 0 : true,
  };
}

function teamView(ranked, n) {
  const tally = teamTally();
  const outcome = vsOutcome();
  const won = isWin(outcome);
  const solo = ranked.length === 1;

  ranked.forEach((p) => {
    const mvp = !solo && p.place === 1 && p.score > 0;
    if (solo) p.phrase = phraseFor(p, "tph." + outcome);
    else if (p.score === 0) p.phrase = phraseFor(p, "tph.zero");
    else if (mvp) p.phrase = phraseFor(p, "tph.mvp");
    else p.phrase = phraseFor(p, "tph.help");
    const extra = mvp ? ["MVP"] : [];
    if (!solo && tally.team && p.score) extra.push(t("aw.share", { n: Math.round((p.score / tally.team) * 100) }));
    p.badges = awardsFor(p, ranked, n, extra);
  });

  const lost = game.maxLives - game.lives;
  const extra = [t("rs.itemsOf", { a: game.found.size, b: n })];
  if (game.livesOn) extra.push(t("rs.livesLost", { n: lost }));
  if (game.hints.size) extra.push(t("rs.hints", { n: game.hints.size }));
  const verdict = phraseFor({ idx: "v", name: "" }, "tph." + outcome);
  const podium = `
    <div class="vs-final-row">
      <div class="vs-final-side${won ? " winner" : ""}">
        ${avatarStack(ranked)}
        <b>${solo ? escapeHtml(ranked[0].name) : t("game.team")}</b>
        <span class="vs-final-pts" data-count="${tally.team}">${tally.team}</span>
      </div>
      <span class="vs-x">×</span>
      <div class="vs-final-side list${won ? "" : " winner"}">
        <div class="vs-list-icon">${icon(categoryOf(game.list).id, "ico big")}</div>
        <b>${t("game.list")}</b>
        <span class="vs-final-pts" data-count="${tally.list}">${tally.list}</span>
      </div>
    </div>
    <p class="vs-verdict">${solo ? "" : `“${escapeHtml(verdict)}” · `}${extra.join(" · ")}</p>`;

  const who = solo ? "solo" : "team";
  const score = { a: tally.team, b: tally.list };
  const reveals = {
    perfect: { html: `${avatarStack(ranked, "reveal-avatars")}<h2 class="reveal-title">${t("rv.perfect")}</h2><p class="reveal-sub">${t("rv.perfectSub." + who, { n })}</p>`, mood: "win" },
    win: { html: `${avatarStack(ranked, "reveal-avatars")}<h2 class="reveal-title">${t("rv.victory")}</h2><p class="reveal-sub">${t("rv.winSub." + who, score)}</p>`, mood: "win" },
    lose: { html: `<div class="reveal-list">${icon(categoryOf(game.list).id, "ico")}</div><h2 class="reveal-title">${t("rv.listWon")}</h2><p class="reveal-sub">${t("rv.loseSub", score)}</p>`, mood: "lose" },
    tie: { html: `<h2 class="reveal-title">${t("rv.tie")}</h2><p class="reveal-sub">${t("rv.tieList", score)}</p>`, mood: "tie" },
  };

  return {
    title: t(`rs.${outcome}.${outcome === "lose" || outcome === "tie" ? "all" : who}`),
    podiumClass: "podium vs-final",
    podium,
    reveal: { kicker: t("rv.resultIs"), ...reveals[outcome] },
    won,
  };
}

function timesView(ranked, n) {
  const totals = teamTotals();
  const winner = totals[0] > totals[1] ? 0 : totals[1] > totals[0] ? 1 : -1;
  const top = ranked[0];

  ranked.forEach((p) => {
    const mvp = p.place === 1 && p.score > 0;
    if (p.score === 0) p.phrase = phraseFor(p, "tph.zero");
    else if (mvp) p.phrase = phraseFor(p, "tph.mvp");
    else if (winner === -1 || p.team === winner) p.phrase = phraseFor(p, "tph.help");
    else p.phrase = phraseFor(p, "tph.lost");
    p.badges = awardsFor(p, ranked, n, [teamName(p.team), ...(mvp ? ["MVP"] : [])]);
  });

  const side = (tm) => `
    <div class="vs-final-side t${tm}${winner === tm ? " winner" : ""}">
      ${avatarStack(ranked.filter((p) => p.team === tm))}
      <b>${teamName(tm)}</b>
      <span class="vs-final-pts" data-count="${totals[tm]}">${totals[tm]}</span>
    </div>`;
  const podium = `
    <div class="vs-final-row">${side(0)}<span class="vs-x">×</span>${side(1)}</div>
    <p class="vs-verdict">${top.score ? `MVP: ${escapeHtml(top.name)} · ` : ""}${t("rs.itemsOf", { a: game.found.size, b: n })} · ${t("rs.leftInList", { n: teamTally().list })}</p>`;

  const reveal = winner === -1
    ? { kicker: t("rv.teamIs"), html: `<h2 class="reveal-title">${t("rv.tie")}</h2><p class="reveal-sub">${t("rv.score", { a: totals[0], b: totals[1] })}</p>`, mood: "tie" }
    : { kicker: t("rv.teamIs"), html: `${avatarStack(ranked.filter((p) => p.team === winner), "reveal-avatars")}<h2 class="reveal-title">${teamName(winner).toUpperCase()}!</h2><p class="reveal-sub">${t("rv.wonBy", { a: totals[winner], b: totals[1 - winner] })}</p>`, mood: "win t" + winner };

  return {
    title: winner === -1 ? t("rs.tieTeams") : t("rs.won", { nome: teamName(winner) }),
    podiumClass: "podium vs-final duel",
    podium,
    reveal,
    won: true,
  };
}

// ───────────── tela ─────────────
// note: mensagem estruturada (ver tMsg), para cada aparelho ler no próprio idioma.

function showResults() {
  if (!game) return;
  game.endTimer = null;
  game.phrases = {};
  const record = recordGame(game, game.vsList ? vsOutcome() : null);
  if (game.daily) recordDaily(game);
  $("daily-ranking").hidden = true;
  if (game.daily && typeof renderDailyRanking === "function") {
    const g = game;
    Promise.resolve(g.rankSent).then(() => game === g && renderDailyRanking(g.daily, $("daily-ranking")));
  }
  if (game.online) onlineGameFinished();
  renderResults(record ? [["rs.record", { n: record.score }]] : "");
  show("results");
  playReveal(game.view);
}

function renderResults(note) {
  const n = game.items.length;
  const ranked = rankPlayers();
  const view = game.vsList ? teamView(ranked, n) : game.teams ? timesView(ranked, n) : duelView(ranked, n);
  game.view = view;
  $("results-title").textContent = view.title;
  $("results-sub").textContent = tMsg(note);
  const podium = $("podium");
  podium.className = view.podiumClass;
  podium.innerHTML = view.podium;
  renderHighlights(n);
  renderResultsTable(ranked, n);
  renderLateContest();
  renderFinalBoard(n);
  $("share-btn").hidden = !game.daily;
  $("rematch-btn").textContent = game.online ? t("mode.backRoom") : game.daily ? t("rs.otherList") : t("rs.rematch");
  $("new-players-btn").hidden = game.online;
  $("change-mode-btn").hidden = game.online;
  game.resultsNote = note;
}

// Números que sobem de 0 até o valor final.
function countUp(root) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    if (reduceMotion || !end) return;
    const t0 = performance.now();
    const dur = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Cena de suspense por cima do resultado. Toque para pular.
function playReveal(view) {
  const screen = $("screen-results");
  const overlay = $("reveal");
  const inner = $("reveal-inner");
  screen.classList.remove("play");
  const finish = () => {
    if (overlay.hidden) return;
    clearTimeout(playReveal.t1);
    clearTimeout(playReveal.t2);
    overlay.classList.add("out");
    setTimeout(() => { overlay.hidden = true; }, 300);
    void screen.offsetWidth;
    screen.classList.add("play");
    countUp(screen);
    if (view.won) setTimeout(() => fx.rain(), 300);
  };
  overlay.className = "reveal";
  overlay.hidden = false;
  overlay.onclick = finish;
  inner.innerHTML = `<p class="reveal-kicker">${view.reveal.kicker}</p><div class="drum" aria-hidden="true"><span></span><span></span><span></span></div>`;
  const suspense = reduceMotion ? 300 : 1700;
  sfx.drumroll(suspense);
  playReveal.t1 = setTimeout(() => {
    overlay.className = "reveal show " + view.reveal.mood;
    inner.innerHTML = view.reveal.html;
    countUp(inner);
    if (view.reveal.mood.startsWith("lose")) sfx.lose();
    else {
      sfx.crash();
      setTimeout(sfx.win, 120);
      const palette = view.reveal.mood.includes("t1") ? ["#FF4D3D", "#FFF4DE", "#FF8A7F"] : ["#171717", "#FFF4DE", "#FFFFFF", "#8A1C12"];
      fx.fireworks(view.reveal.mood.startsWith("win") ? 6 : 2, palette);
    }
  }, suspense);
  playReveal.t2 = setTimeout(finish, suspense + 2600);
}

// Destaques: a melhor jogada, o que ninguém lembrou, sequências.
function renderHighlights(n) {
  const cards = [];
  let best = -1;
  game.found.forEach((_, i) => { if (i > best) best = i; });
  if (best >= 0) {
    const p = game.players[game.found.get(best)];
    cards.push(["flame", t("hl.best"), t("hl.bestText", { nome: `<b>${escapeHtml(p.name)}</b>`, item: `<b>${escapeHtml(game.items[best].name)}</b>`, n: best + 1 })]);
  } else {
    cards.push(["ghost", t("hl.zero"), t("hl.zeroText")]);
  }
  if (game.found.size === n) cards.push(["trophy", t("hl.perfect"), t("hl.perfectText", { n })]);
  else if (!game.found.has(n - 1)) cards.push(["question", t("hl.hardest"), t("hl.hardestText", { n, item: `<b>${escapeHtml(game.items[n - 1].name)}</b>` })]);
  if (!game.found.has(0)) cards.push(["ghost", t("hl.obvious"), t("hl.obviousText", { item: `<b>${escapeHtml(game.items[0].name)}</b>` })]);
  const hot = game.players.reduce((a, b) => (b.bestStreak > a.bestStreak ? b : a));
  if (hot.bestStreak >= 3) cards.push(["bolt", t("hl.streak"), t("hl.streakText", { nome: `<b>${escapeHtml(hot.name)}</b>`, n: hot.bestStreak })]);
  $("highlights").innerHTML = cards.slice(0, 3).map(([ic, title, text], k) => `
    <div class="highlight" style="--i:${k}"><span class="highlight-ico">${uiIcon(ic)}</span><div><p class="highlight-title">${title}</p><p>${text}</p></div></div>`).join("");
}

function renderResultsTable(ranked, n) {
  $("results-table").innerHTML = ranked.map((p, k) => {
    const pills = p.hits.slice().sort((a, b) => b - a)
      .map((h) => `<span class="pill${h / n >= 0.45 ? " hot" : ""}" style="--a:${Math.round(25 + (h / n) * 75)}%">${h}</span>`).join("");
    const stats = [];
    if (p.misses - p.timeouts > 0) stats.push(t("rs.misses", { n: p.misses - p.timeouts }));
    if (p.timeouts) stats.push(t("rs.timeouts", { n: p.timeouts }));
    if (p.passes) stats.push(t("rs.passes", { n: p.passes }));
    return `
    <div class="result-row${game.teams ? ` t${p.team}` : ""}" style="--i:${k}">
      <span class="result-place">${medal(p.place)}</span>
      <div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="result-info">
        <p class="result-head"><b>${escapeHtml(p.name)}</b> <span class="result-pts"><span data-count="${p.score}">${p.score}</span> pts</span></p>
        <p class="result-phrase">${escapeHtml(p.phrase)}</p>
        <div class="hit-pills">${pills || `<span class="muted small">${t("rs.noHits")}</span>`}</div>
        ${stats.length ? `<p class="result-stats">${stats.join(" · ")}</p>` : ""}
        ${p.badges.length ? `<p class="badges">${p.badges.map((b) => `<span>${escapeHtml(b)}</span>`).join("")}</p>` : ""}
      </div>
    </div>`;
  }).join("");
}

function renderFinalBoard(n) {
  $("final-board").classList.toggle("big", n > 10);
  $("final-board").style.setProperty("--rows", Math.ceil(n / 2));
  $("final-board").innerHTML = game.items.map((item, i) => {
    const who = game.found.get(i);
    const p = who !== undefined ? game.players[who] : null;
    return `<li class="slot ${p ? "found" : "missed"}${p && game.teams ? ` t${p.team}` : ""}"><span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span>${p ? `<span class="slot-who" title="${escapeHtml(p.name)}">${renderAvatar(p.avatar)}</span>` : ""}<span class="pts">${p ? escapeHtml(p.name) : game.vsList ? t("rs.toList", { n: i + 1 }) : t("rs.nobody")}</span></li>`;
  }).join("");
}

// ───────────── algum chute estava certo? ─────────────
// Só depois da partida (a lista já está aberta para todos), só com 2 ou mais
// jogadores (a turma decide junto) e nunca na lista do dia.

function canContest() {
  // Online, quem aceita é o anfitrião (depois de a turma combinar).
  if (game.online && !game.isHost) return false;
  return !game.daily && game.players.length > 1 && game.wrongLog.length > 0 && game.found.size < game.items.length;
}

function renderLateContest() {
  const box = $("late-contest");
  box.hidden = !canContest();
  if (box.hidden) return;
  const rows = $("late-contest-rows");
  rows.innerHTML = "";
  game.wrongLog.forEach((w, k) => {
    const order = rankCandidates(game.items, game.found, w.text, game.items.length);
    const row = document.createElement("div");
    row.className = "contest-row";
    row.innerHTML = `
      <p class="contest-guess"><b>“${escapeHtml(w.text)}”</b> <span class="muted small">${t("contest.by", { nome: escapeHtml(game.players[w.player].name) })}</span></p>
      <select aria-label="${t("contest.which", { text: escapeHtml(w.text) })}">
        <option value="">${t("contest.pick")}</option>
        ${order.map((i) => `<option value="${i}">${t("contest.option", { n: i + 1, item: escapeHtml(game.items[i].name) })}</option>`).join("")}
      </select>
      <button type="button" class="btn small" disabled>${t("contest.accept")}</button>`;
    const select = row.querySelector("select");
    const btn = row.querySelector("button");
    select.addEventListener("change", () => (btn.disabled = select.value === ""));
    btn.addEventListener("click", () => acceptLate(k, Number(select.value)));
    rows.appendChild(row);
  });
}

function acceptLate(k, i) {
  const w = game.wrongLog[k];
  if (!w || game.found.has(i)) return;
  const n = game.items.length;
  const p = game.players[w.player];
  game.wrongLog.splice(k, 1);
  game.found.set(i, w.player);
  p.score += i + 1;
  p.hits.push(i + 1);
  p.misses -= 1;
  learnAnswer(game.list.id, i, normalize(w.text));
  const record = !game.online || w.player === game.me ? recordAccepted(game, i, w.player, game.vsList ? vsOutcome() : null) : null;
  const notes = [["contest.accepted", { text: w.text, n: i + 1, nome: p.name }]];
  if (record) notes.push(["rs.record", { n: record.score }]);
  renderResults(notes);
  const screen = $("screen-results");
  screen.classList.remove("play");
  void screen.offsetWidth;
  screen.classList.add("play");
  countUp(screen);
  sfx.right((i + 1) / n);
  floatText($("results-sub"), `+${i + 1}`, "epic");
  if (game.online) onlineSync();
}
