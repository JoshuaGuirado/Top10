// Resultado: suspense ("E o vencedor é…"), pódio animado, prêmios, destaques da partida
// e, no fim, a turma pode aceitar um chute que estava certo.

// {nome} vira o nome do jogador. Frases neutras: servem para qualquer pessoa.
const PHRASES = {
  1: [
    "{nome} jogou como quem tem a cola no bolso.",
    "Alguém confere se {nome} não estava no Google.",
    "{nome} sabe até a senha do Wi-Fi do vizinho.",
    "Pode chamar {nome} de enciclopédia ambulante.",
    "{nome} não falou o óbvio. Falou o certo.",
    "O cérebro de {nome} roda a 165 Hz.",
    "{nome} veio, viu e gabaritou (quase).",
  ],
  2: [
    "{nome} bateu na trave. Na trave!",
    "Prata também brilha, {nome}.",
    "Faltou um fio de luz pra {nome} ganhar.",
    "{nome} vai pedir revanche, pode anotar.",
    "Vice com cara de campeão, {nome}.",
  ],
  3: [
    "Bronze com gostinho de ouro pra {nome}.",
    "{nome} subiu no pódio no sufoco.",
    "Terceiro lugar e muita dignidade, {nome}.",
    "{nome} garantiu a foto no pódio.",
  ],
  rest: [
    "{nome} estava aquecendo pra próxima.",
    "A lâmpada de {nome} piscou, mas acendeu.",
    "{nome} participou. E isso é lindo.",
    "Na próxima é de {nome}. Talvez.",
  ],
  last: [
    "{nome} veio pelo lanche e saiu com o lanche.",
    "Pelo menos a skin de {nome} tava bonita.",
    "{nome}, o importante é competir… né?",
    "A lanterna é de {nome}. Alguém tem que iluminar.",
  ],
  zero: [
    "{nome} jogou no modo avião.",
    "Zero pontos e muita confiança, {nome}.",
    "{nome} chutou mais que goleiro em pênalti.",
    "{nome} está guardando as respostas pra próxima.",
  ],
  tie: [
    "Empate no topo. Desempate no par ou ímpar!",
    "{nome} dividiu a coroa. Ninguém dorme hoje.",
  ],
  solo: {
    perfect: ["Gabaritou! {nome} é a própria usina elétrica."],
    great: ["Holofote! {nome} quase zerou a lista.", "{nome} acendeu o estádio inteiro."],
    good: ["Lâmpada acesa! Mandou bem, {nome}.", "{nome} fez bonito. Dá pra postar."],
    ok: ["Meia-luz. Dá pra ler um livro, {nome}.", "{nome} tá no caminho. Bora de novo?"],
    low: ["Tá piscando… falta energia, {nome}.", "{nome} achou o básico. A lista riu baixinho."],
    zero: ["Lâmpada queimada. Bora de novo, {nome}?", "{nome} jogou no modo avião."],
  },
};

const TEAM_PHRASES = {
  win: ["Time entrosado é outra coisa.", "A lista não teve a menor chance.", "Cérebros conectados no mesmo Wi-Fi.", "Trabalho em equipe: funciona!", "A lista pediu pra sair."],
  perfect: ["Gabaritaram! A lista pediu música no Fantástico.", "Nenhum item escapou. Que equipe!"],
  lose: ["A lista mandou nessa. Revanche?", "Faltou energia na tomada da equipe.", "Hoje a lista saiu de cabeça erguida.", "A lista ganhou e já está se achando."],
  tie: ["Empate com a lista. Ninguém dorme hoje."],
  mvp: ["{nome} carregou a equipe nas costas.", "Craque da rodada: {nome}.", "{nome} é o cérebro da equipe.", "Se fosse futebol, {nome} vestia a 10."],
  help: ["{nome} fez a parte e ajudou a equipe.", "Cada ponto conta. Valeu, {nome}!", "{nome}: peça importante do time.", "Ponto dado, ponto ganho, {nome}."],
  lost: ["{nome} lutou até o fim.", "O time não ajudou {nome}, né?", "Na revanche {nome} vira o jogo."],
  zero: ["{nome} foi da torcida organizada.", "{nome} veio pelo lanche, né?", "{nome} estava aquecendo pra próxima."],
};

const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

// A mesma frase até sair da tela, mesmo se o resultado for redesenhado.
function phraseFor(p, key, list) {
  const cache = (game.phrases = game.phrases || {});
  const id = `${p.idx}:${key}`;
  if (!cache[id]) cache[id] = pick(list).replaceAll("{nome}", p.name);
  return cache[id];
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
  const t = teamTally();
  if (game.found.size === game.items.length) return "perfect";
  return t.team > t.list ? "win" : t.team < t.list ? "lose" : "tie";
}

// Prêmios divertidos (no máximo 3 por jogador).
function awardsFor(p, ranked, n, extra = []) {
  const out = [...extra];
  const others = ranked.filter((q) => q.idx !== p.idx);
  if (p.hits.includes(n)) out.push(`🧠 Achou o nº ${n}`);
  if (p.bestStreak >= 3) out.push(`🔥 ${p.bestStreak} seguidos`);
  if (p.clutch) out.push("🦸 Acertou com 1 vida");
  if (p.hits.length >= 3 && !p.misses) out.push("🎯 Zero erros");
  if (p.misses >= 2 && others.length && others.every((q) => q.misses < p.misses)) out.push("💥 Chutador oficial");
  if (p.timeouts) out.push(p.timeouts === 1 ? "⏰ Dormiu no relógio" : `⏰ Dormiu ${p.timeouts}x no relógio`);
  if (p.passes >= 2) out.push(`🙈 Passou ${p.passes} vezes`);
  if (p.hits.length >= 2 && p.hits.every((h) => h <= Math.ceil(n * 0.3))) out.push("🐢 Só o óbvio");
  return out.slice(0, 3);
}

function avatarStack(group, cls = "vs-team") {
  return `<div class="${cls}">${group.slice(0, 4).map((p) => `<div class="podium-avatar">${renderAvatar(p.avatar)}</div>`).join("")}${group.length > 4 ? `<span class="vs-more">+${group.length - 4}</span>` : ""}</div>`;
}

function names(group) {
  const list = group.map((p) => escapeHtml(p.name));
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}` : list[0];
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
      p.phrase = phraseFor(p, "solo-" + key, PHRASES.solo[key]);
    } else if (p.score === 0) p.phrase = phraseFor(p, "zero", PHRASES.zero);
    else if (tiedTop) p.phrase = phraseFor(p, "tie", PHRASES.tie);
    else if (p.place <= 3) p.phrase = phraseFor(p, "p" + p.place, PHRASES[p.place]);
    else if (p.place === lastPlace && ranked.length >= 4) p.phrase = phraseFor(p, "last", PHRASES.last);
    else p.phrase = phraseFor(p, "rest", PHRASES.rest);
    p.badges = awardsFor(p, ranked, n, !solo && p.place === 1 && p.score > 0 ? ["👑 Venceu"] : []);
  });

  const podium = (solo ? [1] : [2, 1, 3]).map((pl) => {
    const group = ranked.filter((p) => p.place === pl);
    if (!group.length) return "";
    return `
      <div class="podium-col place-${pl}">
        <div class="podium-people">${group.map((p) => `
          <div class="podium-person">
            ${pl === 1 && p.score > 0 ? '<span class="crown" aria-hidden="true">👑</span>' : ""}
            <div class="podium-avatar">${renderAvatar(p.avatar)}</div>
            <b>${escapeHtml(p.name)}</b><span><span data-count="${p.score}">${p.score}</span> pts</span>
          </div>`).join("")}</div>
        <div class="podium-block"><span>${solo ? `<span data-count="${group[0].score}">${group[0].score}</span>` : MEDALS[pl]}</span></div>
      </div>`;
  }).join("");

  const top = winners[0];
  let reveal;
  if (solo) {
    const ratio = top.score / ((n * (n + 1)) / 2);
    reveal = {
      kicker: "Sua pontuação final…",
      html: `${avatarStack([top], "reveal-avatars")}<h2 class="reveal-title"><span data-count="${top.score}">${top.score}</span> pontos</h2><p class="reveal-sub">${escapeHtml(top.phrase)}</p>`,
      mood: ratio >= 0.55 ? "win" : "tie",
    };
  } else if (winners.length > 1) {
    reveal = { kicker: "E o vencedor é…", html: `${avatarStack(winners, "reveal-avatars")}<h2 class="reveal-title">EMPATE!</h2><p class="reveal-sub">${names(winners)} com ${top.score} pontos cada</p>`, mood: "tie" };
  } else {
    reveal = { kicker: "E o vencedor é…", html: `<span class="reveal-crown">👑</span>${avatarStack([top], "reveal-avatars")}<h2 class="reveal-title">${escapeHtml(top.name)}!</h2><p class="reveal-sub">venceu com ${top.score} pontos</p>`, mood: "win" };
  }

  return {
    title: solo ? `${top.score} pontos` : winners.length > 1 ? "Empate no topo!" : `${top.name} venceu!`,
    podiumClass: "podium",
    podium,
    reveal,
    won: solo ? top.score > 0 : true,
  };
}

function teamView(ranked, n) {
  const t = teamTally();
  const outcome = vsOutcome();
  const won = isWin(outcome);
  const solo = ranked.length === 1;

  ranked.forEach((p) => {
    const mvp = !solo && p.place === 1 && p.score > 0;
    if (solo) p.phrase = phraseFor(p, "out-" + outcome, TEAM_PHRASES[outcome]);
    else if (p.score === 0) p.phrase = phraseFor(p, "zero", TEAM_PHRASES.zero);
    else if (mvp) p.phrase = phraseFor(p, "mvp", TEAM_PHRASES.mvp);
    else p.phrase = phraseFor(p, "help", TEAM_PHRASES.help);
    const extra = mvp ? ["⭐ MVP"] : [];
    if (!solo && t.team && p.score) extra.push(`📊 ${Math.round((p.score / t.team) * 100)}% dos pontos`);
    p.badges = awardsFor(p, ranked, n, extra);
  });

  const lost = game.maxLives - game.lives;
  const extra = [`${game.found.size} de ${n} itens`, plural(lost, "vida perdida", "vidas perdidas")];
  if (game.hints.size) extra.push(plural(game.hints.size, "dica", "dicas"));
  const verdict = game.phrases.verdict || (game.phrases.verdict = pick(TEAM_PHRASES[outcome]));
  const podium = `
    <div class="vs-final-row">
      <div class="vs-final-side${won ? " winner" : ""}">
        ${avatarStack(ranked)}
        <b>${solo ? escapeHtml(ranked[0].name) : "Equipe"}</b>
        <span class="vs-final-pts" data-count="${t.team}">${t.team}</span>
      </div>
      <span class="vs-x">×</span>
      <div class="vs-final-side list${won ? "" : " winner"}">
        <div class="vs-list-icon">${icon(categoryOf(game.list).id, "ico big")}</div>
        <b>Lista</b>
        <span class="vs-final-pts" data-count="${t.list}">${t.list}</span>
      </div>
    </div>
    <p class="vs-verdict">${solo ? "" : `“${escapeHtml(verdict)}” · `}${extra.join(" · ")}</p>`;

  const who = solo ? "Você" : "A equipe";
  const reveals = {
    perfect: { html: `${avatarStack(ranked, "reveal-avatars")}<h2 class="reveal-title">GABARITOU!</h2><p class="reveal-sub">${who} achou todos os ${n} itens</p>`, mood: "win" },
    win: { html: `${avatarStack(ranked, "reveal-avatars")}<h2 class="reveal-title">VITÓRIA!</h2><p class="reveal-sub">${who} venceu a lista por ${t.team} a ${t.list}</p>`, mood: "win" },
    lose: { html: `<div class="reveal-list">${icon(categoryOf(game.list).id, "ico")}</div><h2 class="reveal-title">A LISTA VENCEU</h2><p class="reveal-sub">${t.list} a ${t.team}. Revanche?</p>`, mood: "lose" },
    tie: { html: `<h2 class="reveal-title">EMPATE!</h2><p class="reveal-sub">${t.team} a ${t.list} com a lista</p>`, mood: "tie" },
  };

  return {
    title: { perfect: solo ? "Você gabaritou a lista!" : "Gabaritaram a lista!", win: solo ? "Você venceu a lista!" : "A equipe venceu a lista!", lose: "A lista venceu.", tie: "Empate com a lista!" }[outcome],
    podiumClass: "podium vs-final",
    podium,
    reveal: { kicker: "E o resultado é…", ...reveals[outcome] },
    won,
  };
}

function timesView(ranked, n) {
  const totals = teamTotals();
  const winner = totals[0] > totals[1] ? 0 : totals[1] > totals[0] ? 1 : -1;
  const top = ranked[0];

  ranked.forEach((p) => {
    const mvp = p.place === 1 && p.score > 0;
    if (p.score === 0) p.phrase = phraseFor(p, "zero", TEAM_PHRASES.zero);
    else if (mvp) p.phrase = phraseFor(p, "mvp", TEAM_PHRASES.mvp);
    else if (winner === -1 || p.team === winner) p.phrase = phraseFor(p, "help", TEAM_PHRASES.help);
    else p.phrase = phraseFor(p, "lost", TEAM_PHRASES.lost);
    p.badges = awardsFor(p, ranked, n, [TEAM_NAMES[p.team], ...(mvp ? ["⭐ MVP"] : [])]);
  });

  const side = (t) => `
    <div class="vs-final-side t${t}${winner === t ? " winner" : ""}">
      ${avatarStack(ranked.filter((p) => p.team === t))}
      <b>${TEAM_NAMES[t]}</b>
      <span class="vs-final-pts" data-count="${totals[t]}">${totals[t]}</span>
    </div>`;
  const podium = `
    <div class="vs-final-row">${side(0)}<span class="vs-x">×</span>${side(1)}</div>
    <p class="vs-verdict">${top.score ? `MVP: ${escapeHtml(top.name)} · ` : ""}${game.found.size} de ${n} itens · ${teamTally().list} pts ficaram na lista</p>`;

  const reveal = winner === -1
    ? { kicker: "E o time vencedor é…", html: `<h2 class="reveal-title">EMPATE!</h2><p class="reveal-sub">${totals[0]} a ${totals[1]}</p>`, mood: "tie" }
    : { kicker: "E o time vencedor é…", html: `${avatarStack(ranked.filter((p) => p.team === winner), "reveal-avatars")}<h2 class="reveal-title">${TEAM_NAMES[winner].toUpperCase()}!</h2><p class="reveal-sub">venceu por ${totals[winner]} a ${totals[1 - winner]}</p>`, mood: "win t" + winner };

  return {
    title: winner === -1 ? "Empate entre os times!" : `${TEAM_NAMES[winner]} venceu!`,
    podiumClass: "podium vs-final duel",
    podium,
    reveal,
    won: true,
  };
}

// ───────────── tela ─────────────

function showResults() {
  if (!game) return;
  game.endTimer = null;
  game.phrases = {};
  const record = recordGame(game, game.vsList ? vsOutcome() : null);
  if (game.daily) recordDaily(game);
  if (game.online) onlineGameFinished();
  renderResults(record ? `🏆 Novo recorde da lista: ${record.score} pts!` : "");
  show("results");
  playReveal(game.view);
}

function renderResults(note) {
  const n = game.items.length;
  const ranked = rankPlayers();
  const view = game.vsList ? teamView(ranked, n) : game.teams ? timesView(ranked, n) : duelView(ranked, n);
  game.view = view;
  $("results-title").textContent = view.title;
  $("results-sub").textContent = note;
  const podium = $("podium");
  podium.className = view.podiumClass;
  podium.innerHTML = view.podium;
  renderHighlights(n);
  renderResultsTable(ranked, n);
  renderLateContest();
  renderFinalBoard(n);
  $("share-btn").hidden = !game.daily;
  $("rematch-btn").textContent = game.online ? "Voltar à sala" : game.daily ? "Jogar outra lista" : "Revanche (outra lista)";
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
      const palette = view.reveal.mood.includes("t1") ? ["#E5322D", "#FF8A80", "#FFFFFF", "#FFC23D"] : ["#FFFFFF", "#8FA8FF", "#FFC23D", "#2450F5"];
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
    cards.push(["🔥", "Jogada da partida", `<b>${escapeHtml(p.name)}</b> achou <b>${escapeHtml(game.items[best].name)}</b>, o nº ${best + 1}.`]);
  } else {
    cards.push(["😶", "Placar zerado", "Ninguém achou nada. A lista agradece a visita."]);
  }
  if (game.found.size === n) cards.push(["🏆", "Lista gabaritada", `Todos os ${n} itens. Não sobrou nada pra lista!`]);
  else if (!game.found.has(n - 1)) cards.push(["😱", "O mais difícil", `O nº ${n} era <b>${escapeHtml(game.items[n - 1].name)}</b>. Alguém lembrava?`]);
  if (!game.found.has(0)) cards.push(["🤦", "Esqueceram o óbvio", `Ninguém disse <b>${escapeHtml(game.items[0].name)}</b>, o nº 1!`]);
  const hot = game.players.reduce((a, b) => (b.bestStreak > a.bestStreak ? b : a));
  if (hot.bestStreak >= 3) cards.push(["⚡", "Sequência", `<b>${escapeHtml(hot.name)}</b> acertou ${hot.bestStreak} seguidos.`]);
  $("highlights").innerHTML = cards.slice(0, 3).map(([ic, title, text], k) => `
    <div class="highlight" style="--i:${k}"><span class="highlight-ico">${ic}</span><div><p class="highlight-title">${title}</p><p>${text}</p></div></div>`).join("");
}

function renderResultsTable(ranked, n) {
  $("results-table").innerHTML = ranked.map((p, k) => {
    const pills = p.hits.slice().sort((a, b) => b - a)
      .map((h) => `<span class="pill${h / n >= 0.45 ? " hot" : ""}" style="--a:${Math.round(25 + (h / n) * 75)}%">${h}</span>`).join("");
    const stats = [];
    if (p.misses - p.timeouts > 0) stats.push(`❌ ${plural(p.misses - p.timeouts, "erro", "erros")}`);
    if (p.timeouts) stats.push(`⏰ ${p.timeouts} no tempo`);
    if (p.passes) stats.push(`⏭ passou ${p.passes}`);
    return `
    <div class="result-row${game.teams ? ` t${p.team}` : ""}" style="--i:${k}">
      <span class="result-place">${MEDALS[p.place] || p.place + "º"}</span>
      <div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="result-info">
        <p class="result-head"><b>${escapeHtml(p.name)}</b> <span class="result-pts"><span data-count="${p.score}">${p.score}</span> pts</span></p>
        <p class="result-phrase">${escapeHtml(p.phrase)}</p>
        <div class="hit-pills">${pills || '<span class="muted small">nenhum acerto</span>'}</div>
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
    return `<li class="slot ${p ? "found" : "missed"}${p && game.teams ? ` t${p.team}` : ""}"><span class="rank">${i + 1}</span><span class="slot-name">${escapeHtml(item.name)}</span>${p ? `<span class="slot-who" title="${escapeHtml(p.name)}">${renderAvatar(p.avatar)}</span>` : ""}<span class="pts">${p ? escapeHtml(p.name) : game.vsList ? `+${i + 1} lista` : "ninguém"}</span></li>`;
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
      <p class="contest-guess"><b>“${escapeHtml(w.text)}”</b> <span class="muted small">chute de ${escapeHtml(game.players[w.player].name)}</span></p>
      <select aria-label="Qual item era “${escapeHtml(w.text)}”?">
        <option value="">Era qual item?</option>
        ${order.map((i) => `<option value="${i}">nº ${i + 1} · ${escapeHtml(game.items[i].name)}</option>`).join("")}
      </select>
      <button type="button" class="btn small" disabled>Aceitar</button>`;
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
  const notes = [`✅ Aceito! “${w.text}” valeu o nº ${i + 1}: +${i + 1} para ${p.name}.`];
  if (record) notes.push(`🏆 Novo recorde da lista: ${record.score} pts!`);
  renderResults(notes.join(" "));
  const screen = $("screen-results");
  screen.classList.remove("play");
  void screen.offsetWidth;
  screen.classList.add("play");
  countUp(screen);
  sfx.right((i + 1) / n);
  floatText($("results-sub"), `+${i + 1}`, "epic");
  if (game.online) onlineSync();
}
