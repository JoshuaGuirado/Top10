// Resultado: pódio (disputa), Equipe × Lista e Time Azul × Time Vermelho.

const PHRASES = {
  1: ["Cérebro de LED: gasta pouco e brilha muito.", "Isso foi estudo ou bruxaria?", "Não falou o óbvio. Falou o certo.", "Pode pedir música no Fantástico.", "Sabe até o que ninguém perguntou."],
  2: ["Prata também brilha, viu?", "Faltou um fio de luz pra ganhar.", "Vice com cara de campeão.", "O ouro tava ali, dava pra ver."],
  3: ["Bronze com gostinho de ouro.", "Subiu no pódio, é isso que importa.", "Terceiro lugar e muita dignidade."],
  rest: ["Lâmpada piscando hoje, hein?", "Participou. E isso é lindo.", "Na próxima é sua.", "Faltou energia na tomada."],
  last: ["Veio pelo lanche, né?", "A lâmpada queimou no meio do jogo.", "Pelo menos a skin tava bonita.", "O importante é competir… né?"],
  zero: ["Zero pontos e muita confiança.", "Tava só de enfeite?", "Chutou mais que goleiro em pênalti."],
  tie: ["Empate técnico. Ninguém dorme hoje.", "Dois cérebros, uma pontuação."],
};

const TEAM_PHRASES = {
  win: ["Time entrosado é outra coisa.", "A lista não teve a menor chance.", "Cérebros conectados no mesmo Wi-Fi.", "Trabalho em equipe: funciona!"],
  perfect: ["Gabaritaram! A lista pediu música no Fantástico.", "Nenhum item escapou. Que equipe!"],
  lose: ["A lista mandou nessa. Revanche?", "Faltou energia na tomada da equipe.", "A lista ganhou, mas foi por pouco… ou não.", "Hoje a lista saiu de cabeça erguida."],
  tie: ["Empate com a lista. Ninguém dorme hoje."],
  mvp: ["Carregou a equipe nas costas.", "Craque da rodada.", "Cérebro da equipe.", "Se fosse futebol, era a camisa 10."],
  help: ["Fez a parte e ajudou a equipe.", "Cada ponto conta. Valeu!", "Peça importante do time.", "Ponto dado, ponto ganho."],
  lost: ["Lutou até o fim.", "O time não ajudou, né?", "Na revanche vai ser diferente."],
  zero: ["Torcida organizada: apoiou muito.", "Veio pelo lanche, né?", "Estava aquecendo pra próxima."],
};

function soloVerdict(score, n) {
  const ratio = score / ((n * (n + 1)) / 2);
  if (ratio === 1) return "Gabaritou! Você é a própria usina elétrica.";
  if (ratio >= 0.8) return "Holofote! Quase perfeito.";
  if (ratio >= 0.55) return "Lâmpada acesa! Mandou bem.";
  if (ratio >= 0.3) return "Meia-luz. Dá pra ler um livro.";
  if (score > 0) return "Tá piscando… falta energia.";
  return "Lâmpada queimada. Bora de novo?";
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

function showResults() {
  if (!game) return;
  game.endTimer = null;
  const n = game.items.length;
  const ranked = rankPlayers();
  const outcome = game.vsList ? vsOutcome() : null;
  const record = recordGame(game, outcome);
  if (game.daily) recordDaily(game);

  if (game.vsList) showTeamResults(ranked, n, outcome);
  else if (game.teams) showTimesResults(ranked, n);
  else showDuelResults(ranked, n);

  $("results-sub").textContent = record ? `Novo recorde da lista: ${record.score} pts!` : "";
  $("share-btn").hidden = !game.daily;
  $("rematch-btn").textContent = game.daily ? "Jogar outra lista" : "Revanche (outra lista)";
  renderResultsTable(ranked);
  renderFinalBoard(n);
  show("results");
}

function vsOutcome() {
  const t = teamTally();
  if (game.found.size === game.items.length) return "perfect";
  return t.team > t.list ? "win" : t.team < t.list ? "lose" : "tie";
}

function celebrate(won) {
  if (won) {
    sfx.win();
    setTimeout(() => fx.rain(), 250);
  } else {
    sfx.lose();
  }
}

function avatarStack(group) {
  return `<div class="vs-team">${group.slice(0, 4).map((p) => `<div class="podium-avatar">${renderAvatar(p.avatar)}</div>`).join("")}${group.length > 4 ? `<span class="vs-more">+${group.length - 4}</span>` : ""}</div>`;
}

function showDuelResults(ranked, n) {
  const solo = ranked.length === 1;
  const lastPlace = ranked[ranked.length - 1].place;
  const maxHits = Math.max(...ranked.map((p) => p.hits.length));
  const maxMiss = Math.max(...ranked.map((p) => p.misses));
  const obvious = Math.ceil(n * 0.3);
  ranked.forEach((p) => {
    const tied = ranked.filter((q) => q.place === p.place).length > 1;
    if (solo) p.phrase = soloVerdict(p.score, n);
    else if (p.score === 0) p.phrase = pick(PHRASES.zero);
    else if (tied && p.place === 1) p.phrase = pick(PHRASES.tie);
    else if (p.place <= 3) p.phrase = pick(PHRASES[p.place]);
    else if (p.place === lastPlace && ranked.length >= 4) p.phrase = pick(PHRASES.last);
    else p.phrase = pick(PHRASES.rest);
    p.badges = [];
    if (p.hits.includes(n)) p.badges.push(`Achou o nº ${n}`);
    if (!solo && p.hits.length === maxHits && maxHits > 0) p.badges.push("Mais acertos");
    if (!solo && p.misses === maxMiss && maxMiss > 0 && ranked.some((q) => q.misses < maxMiss)) p.badges.push("Mais chutes errados");
    if (p.hits.length && p.hits.every((h) => h <= obvious)) p.badges.push("Só o óbvio");
  });

  const winners = ranked.filter((p) => p.place === 1);
  $("results-title").textContent = solo
    ? `${ranked[0].score} pontos`
    : winners.length > 1 ? "Empate no topo!" : `${winners[0].name} venceu!`;

  const podium = $("podium");
  podium.className = "podium";
  podium.innerHTML = "";
  (solo ? [1] : [2, 1, 3]).forEach((pl) => {
    const group = ranked.filter((p) => p.place === pl);
    if (!group.length) return;
    const col = document.createElement("div");
    col.className = `podium-col place-${pl}`;
    col.innerHTML = `
      <div class="podium-people">${group.map((p) => `<div class="podium-person"><div class="podium-avatar">${renderAvatar(p.avatar)}</div><b>${escapeHtml(p.name)}</b><span>${p.score} pts</span></div>`).join("")}</div>
      <div class="podium-block"><span>${solo ? group[0].score : pl + "º"}</span></div>`;
    podium.appendChild(col);
  });
  celebrate(true);
}

function showTeamResults(ranked, n, outcome) {
  const t = teamTally();
  const won = outcome === "perfect" || outcome === "win";
  const solo = ranked.length === 1;
  const maxMiss = Math.max(...ranked.map((p) => p.misses));
  const obvious = Math.ceil(n * 0.3);

  ranked.forEach((p) => {
    const mvp = !solo && p.place === 1 && p.score > 0;
    if (solo) p.phrase = pick(TEAM_PHRASES[outcome]);
    else if (p.score === 0) p.phrase = pick(TEAM_PHRASES.zero);
    else if (mvp) p.phrase = pick(TEAM_PHRASES.mvp);
    else p.phrase = pick(TEAM_PHRASES.help);
    p.badges = [];
    if (mvp) p.badges.push("MVP");
    if (p.hits.includes(n)) p.badges.push(`Achou o nº ${n}`);
    if (!solo && t.team && p.score) p.badges.push(`${Math.round((p.score / t.team) * 100)}% dos pontos`);
    if (!solo && p.misses === maxMiss && maxMiss > 0 && ranked.some((q) => q.misses < maxMiss)) p.badges.push("Mais vidas perdidas");
    if (p.hits.length && p.hits.every((h) => h <= obvious)) p.badges.push("Só o óbvio");
  });

  $("results-title").textContent = {
    perfect: solo ? "Você gabaritou a lista!" : "Gabaritaram a lista!",
    win: solo ? "Você venceu a lista!" : "A equipe venceu a lista!",
    lose: "A lista venceu.",
    tie: "Empate com a lista!",
  }[outcome];

  const lost = game.maxLives - game.lives;
  const extra = [`${game.found.size} de ${n} itens`, plural(lost, "vida perdida", "vidas perdidas")];
  if (game.hints.size) extra.push(plural(game.hints.size, "dica", "dicas"));
  const podium = $("podium");
  podium.className = "podium vs-final";
  podium.innerHTML = `
    <div class="vs-final-row">
      <div class="vs-final-side${won ? " winner" : ""}">
        ${avatarStack(ranked)}
        <b>${solo ? escapeHtml(ranked[0].name) : "Equipe"}</b>
        <span class="vs-final-pts">${t.team}</span>
      </div>
      <span class="vs-x">×</span>
      <div class="vs-final-side list${won ? "" : " winner"}">
        <div class="vs-list-icon">${icon(categoryOf(game.list).id, "ico big")}</div>
        <b>Lista</b>
        <span class="vs-final-pts">${t.list}</span>
      </div>
    </div>
    <p class="vs-verdict">${solo ? "" : `“${escapeHtml(pick(TEAM_PHRASES[outcome]))}” · `}${extra.join(" · ")}</p>`;
  celebrate(won);
}

function showTimesResults(ranked, n) {
  const totals = teamTotals();
  const winner = totals[0] > totals[1] ? 0 : totals[1] > totals[0] ? 1 : -1;
  const top = ranked[0];
  const obvious = Math.ceil(n * 0.3);

  ranked.forEach((p) => {
    const mvp = p.place === 1 && p.score > 0;
    if (p.score === 0) p.phrase = pick(TEAM_PHRASES.zero);
    else if (mvp) p.phrase = pick(TEAM_PHRASES.mvp);
    else if (winner === -1 || p.team === winner) p.phrase = pick(TEAM_PHRASES.help);
    else p.phrase = pick(TEAM_PHRASES.lost);
    p.badges = [TEAM_NAMES[p.team]];
    if (mvp) p.badges.push("MVP");
    if (p.hits.includes(n)) p.badges.push(`Achou o nº ${n}`);
    if (p.hits.length && p.hits.every((h) => h <= obvious)) p.badges.push("Só o óbvio");
  });

  $("results-title").textContent = winner === -1 ? "Empate entre os times!" : `${TEAM_NAMES[winner]} venceu!`;
  const side = (t) => `
    <div class="vs-final-side t${t}${winner === t ? " winner" : ""}">
      ${avatarStack(ranked.filter((p) => p.team === t))}
      <b>${TEAM_NAMES[t]}</b>
      <span class="vs-final-pts">${totals[t]}</span>
    </div>`;
  const podium = $("podium");
  podium.className = "podium vs-final duel";
  podium.innerHTML = `
    <div class="vs-final-row">${side(0)}<span class="vs-x">×</span>${side(1)}</div>
    <p class="vs-verdict">${top.score ? `MVP: ${escapeHtml(top.name)} · ` : ""}${game.found.size} de ${n} itens · ${teamTally().list} pts ficaram na lista</p>`;
  celebrate(true);
}

function renderResultsTable(ranked) {
  $("results-table").innerHTML = ranked.map((p) => `
    <div class="result-row${game.teams ? ` t${p.team}` : ""}">
      <span class="result-place">${p.place}º</span>
      <div class="mini">${renderAvatar(p.avatar)}</div>
      <div class="result-info">
        <b>${escapeHtml(p.name)}</b> <span class="result-pts">${p.score} pts</span>
        <p class="result-phrase">“${escapeHtml(p.phrase)}”</p>
        <p class="result-stats">Acertos: ${p.hits.length ? p.hits.slice().sort((a, b) => b - a).map((h) => `nº ${h}`).join(", ") : "nenhum"} · Erros: ${p.misses}${p.timeouts ? ` (${p.timeouts} por tempo)` : ""}${p.passes ? ` · Passou: ${p.passes}` : ""}</p>
        ${p.badges.length ? `<p class="badges">${p.badges.map((b) => `<span>${escapeHtml(b)}</span>`).join("")}</p>` : ""}
      </div>
    </div>`).join("");
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
